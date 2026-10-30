"""KDI-P01 experimental tool-call preflight. Pure validation; never dispatches tools.

Design inspiration: DeepInfer's separation of structured-output preparation from
runtime, and deepseek-recipe's protocol-neutral intermediate representation.
This is NOT a full Responses/Chat adapter, a security sandbox, or authorization.

Input: one completed Responses function_call item or one Chat tool_calls item.
Legacy {"args": [str, ...]} remains supported. Named fields require a trusted
per-tool ordered mapping. Optional fields must form a trailing suffix. Explicit
integer/boolean named scalar declarations are canonicalized to string argv;
this is not generic JSON Schema validation. Optional trusted integer bounds
constrain typed integer values before argv conversion. Trusted string enums
restrict named string values without changing legacy positional arguments.
Unknown fields, context overrides, duplicate JSON keys, and non-string args fail closed.
"""
from dataclasses import dataclass
import json
import re
from typing import FrozenSet, Iterable, Mapping, Tuple


_TOOL_NAME = re.compile(r"[a-z][a-z0-9_-]{0,63}\Z")
_FIELD_NAME = re.compile(r"[A-Za-z_][A-Za-z0-9_]{0,63}\Z")
_RESERVED_FIELDS = frozenset({"args", "context", "tier", "cwd", "timeout", "env",
                              "environment", "custom_env", "permissions", "sandbox", "tool"})


class PreflightError(ValueError):
    """Rejected before any DSHA tool lookup or execution."""


def _no_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise PreflightError("duplicate JSON key")
        result[key] = value
    return result


def _reject_constant(_value):
    raise PreflightError("non-standard JSON constant")


@dataclass(frozen=True)
class CompiledContract:
    """Trusted, reusable, immutable preflight constraints (not model-produced)."""

    tools: FrozenSet[str]
    max_arguments: int = 16
    max_payload_bytes: int = 4096
    named_string_fields: Tuple[Tuple[str, Tuple[str, ...]], ...] = ()
    named_required_counts: Tuple[Tuple[str, int], ...] = ()
    named_scalar_types: Tuple[Tuple[str, Tuple[Tuple[str, str], ...]], ...] = ()
    named_integer_bounds: Tuple[Tuple[str, Tuple[Tuple[str, int, int], ...]], ...] = ()
    named_string_enums: Tuple[Tuple[str, Tuple[Tuple[str, Tuple[str, ...]], ...]], ...] = ()

    @classmethod
    def compile(cls, tool_ids: Iterable[str], max_arguments: int = 16,
                max_payload_bytes: int = 4096, named_string_fields=None,
                named_required_counts=None, named_scalar_types=None,
                named_integer_bounds=None, named_string_enums=None):
        if type(max_arguments) is not int or not 1 <= max_arguments <= 256:
            raise ValueError("invalid argument limit")
        if type(max_payload_bytes) is not int or not 128 <= max_payload_bytes <= 65536:
            raise ValueError("invalid payload limit")
        tools = frozenset(tool_ids)
        if not tools or any(not isinstance(t, str) or not _TOOL_NAME.fullmatch(t) for t in tools):
            raise ValueError("invalid trusted tool registry")
        if named_string_fields is None:
            named_string_fields = {}
        if not isinstance(named_string_fields, Mapping):
            raise ValueError("invalid named string field mapping")
        bindings = []
        for tool, fields in named_string_fields.items():
            if tool not in tools or not isinstance(fields, (list, tuple)) or not 1 <= len(fields) <= max_arguments:
                raise ValueError("invalid named string field mapping")
            if any(not isinstance(field, str) or not _FIELD_NAME.fullmatch(field)
                   or field in _RESERVED_FIELDS for field in fields) or len(set(fields)) != len(fields):
                raise ValueError("invalid named string fields")
            bindings.append((tool, tuple(fields)))
        if named_required_counts is None:
            named_required_counts = {}
        if not isinstance(named_required_counts, Mapping):
            raise ValueError("invalid named required count mapping")
        declared_fields = dict(bindings)
        counts = []
        for tool, required in named_required_counts.items():
            if (tool not in declared_fields or type(required) is not int
                    or not 0 <= required <= len(declared_fields[tool])):
                raise ValueError("invalid named required count")
            counts.append((tool, required))
        if named_scalar_types is None:
            named_scalar_types = {}
        if not isinstance(named_scalar_types, Mapping):
            raise ValueError("invalid named scalar type mapping")
        scalar_bindings = []
        for tool, typed_fields in named_scalar_types.items():
            if (tool not in declared_fields or not isinstance(typed_fields, Mapping)
                    or not typed_fields):
                raise ValueError("invalid named scalar type mapping")
            if any(field not in declared_fields[tool] or kind not in ("integer", "boolean")
                   for field, kind in typed_fields.items()):
                raise ValueError("invalid named scalar types")
            scalar_bindings.append((tool, tuple(sorted(typed_fields.items()))))
        if named_integer_bounds is None:
            named_integer_bounds = {}
        if not isinstance(named_integer_bounds, Mapping):
            raise ValueError("invalid named integer bound mapping")
        scalar_declarations = {tool: dict(fields) for tool, fields in scalar_bindings}
        bound_bindings = []
        for tool, field_bounds in named_integer_bounds.items():
            if (tool not in declared_fields or not isinstance(field_bounds, Mapping)
                    or not field_bounds):
                raise ValueError("invalid named integer bound mapping")
            bounds = []
            for field, limits in field_bounds.items():
                if (scalar_declarations.get(tool, {}).get(field) != "integer"
                        or not isinstance(limits, (list, tuple)) or len(limits) != 2
                        or type(limits[0]) is not int or type(limits[1]) is not int
                        or limits[0] > limits[1]):
                    raise ValueError("invalid named integer bounds")
                bounds.append((field, limits[0], limits[1]))
            bound_bindings.append((tool, tuple(sorted(bounds))))
        if named_string_enums is None:
            named_string_enums = {}
        if not isinstance(named_string_enums, Mapping):
            raise ValueError("invalid named string enum mapping")
        enum_bindings = []
        for tool, field_enums in named_string_enums.items():
            if (tool not in declared_fields or not isinstance(field_enums, Mapping)
                    or not field_enums):
                raise ValueError("invalid named string enum mapping")
            choices_by_field = []
            for field, choices in field_enums.items():
                if (field not in declared_fields[tool]
                        or field in scalar_declarations.get(tool, {})
                        or not isinstance(choices, (list, tuple))
                        or not 1 <= len(choices) <= 64
                        or any(not isinstance(value, str) or "\x00" in value
                               or len(value.encode("utf-8")) > 1024 for value in choices)
                        or len(set(choices)) != len(choices)):
                    raise ValueError("invalid named string enum declaration")
                choices_by_field.append((field, tuple(choices)))
            enum_bindings.append((tool, tuple(sorted(choices_by_field))))
        return cls(tools, max_arguments, max_payload_bytes,
                   tuple(sorted(bindings)), tuple(sorted(counts)),
                   tuple(sorted(scalar_bindings)), tuple(sorted(bound_bindings)),
                   tuple(sorted(enum_bindings)))


@dataclass(frozen=True)
class PreparedToolCall:
    source_protocol: str
    provider_call_id: str
    tool: str
    args: Tuple[str, ...]

    def to_dsha_request(self):
        """Compatible with Call_Tools(tool_name, args, context); no tier override."""
        return {"tool": self.tool, "args": list(self.args), "context": {}}


def prepare_tool_call(item: Mapping, source_protocol: str,
                      contract: CompiledContract) -> PreparedToolCall:
    """Validate a completed provider tool call. Does not execute or authorize it."""
    if not isinstance(contract, CompiledContract) or not isinstance(item, dict):
        raise PreflightError("invalid preflight inputs")
    if source_protocol == "responses":
        required = {"type", "name", "arguments", "call_id"}
        allowed = required | {"id", "status"}
        if not required <= set(item) <= allowed or item["type"] != "function_call":
            raise PreflightError("unsupported Responses function call")
        item_id = item.get("id")
        if item_id is not None and (not isinstance(item_id, str) or not 1 <= len(item_id) <= 128
                                    or any(ord(c) < 32 or ord(c) == 127 for c in item_id)):
            raise PreflightError("invalid Responses item ID")
        if item.get("status") not in (None, "completed"):
            raise PreflightError("Responses function call not completed")
        name, raw, call_id = item["name"], item["arguments"], item["call_id"]
    elif source_protocol == "chat":
        if set(item) != {"id", "type", "function"} or item["type"] != "function":
            raise PreflightError("unsupported Chat tool call")
        function = item["function"]
        if not isinstance(function, dict) or set(function) != {"name", "arguments"}:
            raise PreflightError("unsupported Chat function fields")
        name, raw, call_id = function["name"], function["arguments"], item["id"]
    else:
        raise PreflightError("unsupported source protocol")

    if not isinstance(name, str) or name not in contract.tools:
        raise PreflightError("tool not in trusted registry")
    if not isinstance(call_id, str) or not 1 <= len(call_id) <= 128 or any(ord(c) < 32 for c in call_id):
        raise PreflightError("invalid provider call ID")
    if not isinstance(raw, str) or len(raw.encode("utf-8")) > contract.max_payload_bytes:
        raise PreflightError("invalid or oversized tool arguments")
    try:
        decoded = json.loads(raw, object_pairs_hook=_no_duplicate_keys,
                             parse_constant=_reject_constant)
    except (json.JSONDecodeError, UnicodeError) as exc:
        raise PreflightError("invalid JSON arguments") from exc
    if not isinstance(decoded, dict):
        raise PreflightError("expected JSON argument object")
    if set(decoded) == {"args"}:
        args = decoded["args"]
    else:
        fields = dict(contract.named_string_fields).get(name)
        required = dict(contract.named_required_counts).get(name, len(fields) if fields is not None else 0)
        count = len(decoded)
        if (fields is None or not required <= count <= len(fields)
                or set(decoded) != set(fields[:count])):
            raise PreflightError("unmapped named arguments or context override")
        scalar_types = dict(dict(contract.named_scalar_types).get(name, ()))
        integer_bounds = {field: (lower, upper) for field, lower, upper
                          in dict(contract.named_integer_bounds).get(name, ())}
        string_enums = dict(dict(contract.named_string_enums).get(name, ()))
        args = []
        for field in fields[:count]:
            value = decoded[field]
            kind = scalar_types.get(field)
            if kind == "integer":
                if type(value) is not int:
                    raise PreflightError("named integer argument has invalid type")
                if field in integer_bounds:
                    lower, upper = integer_bounds[field]
                    if not lower <= value <= upper:
                        raise PreflightError("named integer argument out of bounds")
                args.append(str(value))
            elif kind == "boolean":
                if type(value) is not bool:
                    raise PreflightError("named boolean argument has invalid type")
                args.append("true" if value else "false")
            else:
                if field in string_enums and value not in string_enums[field]:
                    raise PreflightError("named string argument outside trusted enum")
                args.append(value)
    if not isinstance(args, list) or len(args) > contract.max_arguments or any(
        not isinstance(arg, str) or "\x00" in arg for arg in args
    ):
        raise PreflightError("args must be bounded string list")
    return PreparedToolCall(source_protocol, call_id, name, tuple(args))
