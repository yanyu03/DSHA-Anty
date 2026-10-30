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


if __name__ == "__main__":
    unittest.main()
