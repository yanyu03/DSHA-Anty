"""KDI-P01 isolated protocol preflight tests: no process or network execution."""
import json
import unittest

from scripts.kdi_protocol_preflight import (
    CompiledContract, PreflightError, prepare_tool_call,
)


class PreflightTests(unittest.TestCase):
    def setUp(self):
        self.contract = CompiledContract.compile(["scribe", "cf"], max_arguments=2)

    def responses(self, arguments='{"args":["status"]}', **updates):
        item = {"type": "function_call", "call_id": "call-r1", "name": "scribe", "arguments": arguments}
        item.update(updates)
        return item

    def chat(self, arguments='{"args":["status"]}', **updates):
        item = {"id": "call-c1", "type": "function", "function": {"name": "scribe", "arguments": arguments}}
        item.update(updates)
        return item

    def test_same_dsha_request_for_both_protocols(self):
        r = prepare_tool_call(self.responses(), "responses", self.contract)
        c = prepare_tool_call(self.chat(), "chat", self.contract)
        self.assertEqual(r.to_dsha_request(), c.to_dsha_request())
        self.assertEqual(r.to_dsha_request(), {"tool": "scribe", "args": ["status"], "context": {}})
        self.assertEqual((r.provider_call_id, c.provider_call_id), ("call-r1", "call-c1"))

    def test_empty_args_supported(self):
        obj = prepare_tool_call(self.responses('{"args":[]}'), "responses", self.contract)
        self.assertEqual(obj.args, ())

    def test_responses_sdk_optional_item_metadata(self):
        item = self.responses(id="fc_123", status="completed")
        result = prepare_tool_call(item, "responses", self.contract)
        self.assertEqual(result.provider_call_id, "call-r1")  # never confuse item id with call_id
        self.assertEqual(result.to_dsha_request(), {"tool": "scribe", "args": ["status"], "context": {}})
        self.assertEqual(item["id"], "fc_123")
        self.assertEqual(prepare_tool_call(self.responses(id=None, status=None), "responses", self.contract),
                         prepare_tool_call(self.responses(), "responses", self.contract))

    def test_responses_incomplete_status_rejected(self):
        for status in ("in_progress", "incomplete", "failed", 1, {}, []):
            with self.subTest(status=status), self.assertRaises(PreflightError):
                prepare_tool_call(self.responses(status=status), "responses", self.contract)

    def test_responses_invalid_optional_id_rejected(self):
        for item_id in ("", 123, [], "x" * 129, "x\x00y", "x\x7fy"):
            with self.subTest(item_id=item_id), self.assertRaises(PreflightError):
                prepare_tool_call(self.responses(id=item_id), "responses", self.contract)

    def test_responses_unrecognized_sdk_metadata_still_rejected(self):
        for field in ("async", "caller", "namespace", "context"):
            with self.subTest(field=field), self.assertRaises(PreflightError):
                prepare_tool_call(self.responses(**{field: None}), "responses", self.contract)

    def test_unknown_tool_denied(self):
        with self.assertRaises(PreflightError):
            prepare_tool_call(self.responses(name="pwsh"), "responses", self.contract)

    def test_context_escalation_denied(self):
        for args in ('{"args":[],"context":{"tier":"danger-full-access"}}',
                     '{"args":[],"custom_env":{"TOKEN":"x"}}'):
            with self.subTest(args=args), self.assertRaises(PreflightError):
                prepare_tool_call(self.responses(args), "responses", self.contract)

    def test_duplicate_json_keys_denied(self):
        with self.assertRaises(PreflightError):
            prepare_tool_call(self.responses('{"args":[],"args":["override"]}'), "responses", self.contract)

    def test_unknown_payload_field_denied(self):
        with self.assertRaises(PreflightError):
            prepare_tool_call(self.responses(extra="x"), "responses", self.contract)

    def test_chat_payload_unknown_fields_denied(self):
        malformed = self.chat()
        malformed["function"]["context"] = {}
        with self.assertRaises(PreflightError):
            prepare_tool_call(malformed, "chat", self.contract)

    def test_invalid_argument_types_denied(self):
        for value in ('{"args":"status"}', '{"args":[123]}', '{"args":null}',
                      '{"args":["a","b","c"]}', '{"args":["a\\u0000b"]}',
                      '{"args":NaN}', '{"args":{}}', '[]', '{'):
            with self.subTest(value=value), self.assertRaises(PreflightError):
                prepare_tool_call(self.responses(value), "responses", self.contract)

    def test_argument_bytes_capped(self):
        big = json.dumps({"args": ["X" * 5000]})
        with self.assertRaises(PreflightError):
            prepare_tool_call(self.responses(big), "responses", self.contract)

    def test_unsupported_protocol_denied(self):
        with self.assertRaises(PreflightError):
            prepare_tool_call(self.responses(), "messages", self.contract)

    def test_bad_contract_denied(self):
        for tool_ids in ([], ["../tool"], ["UpperCase"]):
            with self.subTest(tool_ids=tool_ids), self.assertRaises(ValueError):
                CompiledContract.compile(tool_ids)

    def test_stable_preparation_and_no_mutation(self):
        original = self.responses()
        before = json.dumps(original, sort_keys=True)
        a = prepare_tool_call(original, "responses", self.contract)
        b = prepare_tool_call(original, "responses", self.contract)
        self.assertEqual(a, b)
        self.assertEqual(before, json.dumps(original, sort_keys=True))
        returned = a.to_dsha_request()
        returned["args"].append("injected")
        self.assertEqual(a.args, ("status",))


    def test_named_string_fields_both_protocols(self):
        contract = CompiledContract.compile(["scribe", "cf"], max_arguments=2,
            named_string_fields={"scribe": ("location", "query")})
        payload = '{"query":"today","location":"Boston"}'
        r = prepare_tool_call(self.responses(payload), "responses", contract)
        c = prepare_tool_call(self.chat(payload), "chat", contract)
        self.assertEqual(r.args, ("Boston", "today"))
        self.assertEqual(c.to_dsha_request(), r.to_dsha_request())
        self.assertEqual(r.provider_call_id, "call-r1")
        self.assertEqual(c.provider_call_id, "call-c1")

    def test_named_fields_default_denied_and_legacy_preserved(self):
        with self.assertRaises(PreflightError):
            prepare_tool_call(self.responses('{"location":"Boston"}'), "responses", self.contract)
        contract = CompiledContract.compile(["scribe"], named_string_fields={"scribe": ("location",)})
        self.assertEqual(prepare_tool_call(self.responses(), "responses", contract).args, ("status",))
        self.assertEqual(prepare_tool_call(self.responses('{"location":"Boston"}'), "responses", contract).args, ("Boston",))

    def test_named_fields_fail_closed(self):
        contract = CompiledContract.compile(["scribe", "cf"], max_arguments=2,
            named_string_fields={"scribe": ("location", "query")})
        for payload in ('{"location":"Boston"}', '{"location":"Boston","query":"today","extra":1}',
                        '{"location":"Boston","query":2}', '{"location":"Boston","query":"x\\u0000"}',
                        '{"location":"Boston","query":"today","context":{}}',
                        '{"location":"Boston","location":"NY","query":"today"}'):
            with self.subTest(payload=payload), self.assertRaises(PreflightError):
                prepare_tool_call(self.responses(payload), "responses", contract)
        with self.assertRaises(PreflightError):
            prepare_tool_call(self.responses('{"location":"Boston","query":"today"}', name="cf"), "responses", contract)

    def test_invalid_named_field_contract_denied(self):
        for mapping in ({"unknown": ("location",)}, {"scribe": ("context",)},
                        {"scribe": ("args",)}, {"scribe": ("location", "location")},
                        {"scribe": ()}, {"scribe": ("location", "query", "extra")},
                        {"scribe": ("bad-field",)}, {"scribe": "location"}, []):
            with self.subTest(mapping=mapping), self.assertRaises(ValueError):
                CompiledContract.compile(["scribe"], max_arguments=2, named_string_fields=mapping)

    def test_named_field_mapping_is_frozen(self):
        source = {"scribe": ["location"]}
        contract = CompiledContract.compile(["scribe"], named_string_fields=source)
        source["scribe"].append("context")
        source["scribe"] = ["query"]
        self.assertEqual(contract.named_string_fields, (("scribe", ("location",)),))
        result = prepare_tool_call(self.responses('{"location":"Boston"}'), "responses", contract)
        self.assertEqual(result.args, ("Boston",))

if __name__ == "__main__":
    unittest.main()
