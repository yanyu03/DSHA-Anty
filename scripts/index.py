#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSHA-Index: Master Capability Catalog & Call_Tools Dispatcher (v1.0.0).

Architecture Role:
  [Top-Level Index] DSHA-Index defines the complete capability catalog and contracts.
  [Core Router]     DSHA-Router resolves developer intent and maps to tools.
  [Unified Driver]  Call_Tools pulls and executes parallel tools with standardized
                    isolation, encoding, proxy propagation, trace logging, and
                    prerequisite & authorization assertions via BaseTool.

Class Categories:
  - ReverseEngineering : rea (Binary & artifact forensics)
  - WebEdge            : cf (Cloudflare Web, Workers, Pages, Tunnels & Forge API)
  - Archivist          : scribe (Intelligence archivist & research dossier generator)
  - SysAdmin           : pwsh (Hardened PowerShell 7), sh (GNU Bash POSIX scripting)
  - PolicyRadar        : tier (Permission tier management), meter (Quota & Token telemetry)
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

# Ensure UTF-8 output across Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Import BaseTool architecture
try:
    from base_tool import (
        BaseTool,
        Call_Tools as BaseCallTools,
        ErrBlock,
        PrerequisiteEnv,
        RiskLevel,
        TOOL_REGISTRY,
        ToolCategory,
        get_active_tier,
        TraceStore,
        retrace,
        dump_open_protocol_schema,
    )
except ImportError:
    # Handle direct script invocation from different directories
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from base_tool import (
        BaseTool,
        Call_Tools as BaseCallTools,
        ErrBlock,
        PrerequisiteEnv,
        RiskLevel,
        TOOL_REGISTRY,
        ToolCategory,
        get_active_tier,
        TraceStore,
        retrace,
        dump_open_protocol_schema,
    )

# Backward-compatible dictionary matching the previous DSHA_INDEX format
DSHA_INDEX = TOOL_REGISTRY.to_legacy_dict()


def resolve_tool_path(tool_name):
    tool = TOOL_REGISTRY.get(tool_name)
    if not tool:
        return None
    return tool.resolve_executable()


def Call_Tools(tool_name, args=None, context=None):
    """
    Unified Parallel Tool Pulling and Execution Protocol.
    Pulls the tool definition from DSHA-Index, resolves the binary,
    asserts host prerequisites (strict refusal on missing runtime),
    asserts anti-privilege authorization, executes safely, and captures results.
    """
    return BaseCallTools(tool_name, args=args, context=context)


def print_index_table(category=None):
    tools = list(TOOL_REGISTRY.all().values())
    if category:
        tools = TOOL_REGISTRY.get_by_category(category)

    header = "=== 📚 DSHA-Index 顶层能力目录与全景索引 (Master Catalog v1.0.0) ==="
    if category:
        header += f" [类目: {category}]"
    print(header)
    print(f"| {'标识'.ljust(8)} | {'类目'.ljust(20)} | {'工具名称'.ljust(30)} | {'安全级别'.ljust(10)} | {'依赖环境'} |")
    print(f"|{'-'*10}|{'-'*22}|{'-'*32}|{'-'*12}|{'-'*20}|")
    for t in tools:
        p = t.resolve_executable()
        status_sym = "✓" if p else "✗"
        prereqs = ", ".join([pr.binary for pr in t.prerequisites]) or "none"
        print(f"| {status_sym} {t.id.ljust(6)} | {t.category.value.ljust(20)} | {t.name.ljust(30)} | {t.risk_level.value.ljust(10)} | {prereqs} |")


def run_selftest():
    tests = []

    # Test 1: Registry completeness (7 tools)
    tests.append(("registry_7_tools", len(TOOL_REGISTRY.all()) == 7))

    # Test 2: Resolve all tools
    all_resolved = True
    for t_id, tool in TOOL_REGISTRY.all().items():
        p = tool.resolve_executable()
        if not p:
            all_resolved = False
    tests.append(("all_tools_resolved", all_resolved))

    # Test 3: Category filtering
    cf_tools = TOOL_REGISTRY.get_by_category("WebEdge")
    tests.append(("category_filter_webedge", len(cf_tools) == 1 and cf_tools[0].id == "cf"))

    # Test 4: Call_Tools on scribe status
    res = Call_Tools("scribe", ["status"], {"capture": True, "timeout": 10})
    tests.append(("call_tools_scribe_status", res["success"] and "DSHA" in res["stdout"]))

    # Test 5: Call_Tools on non-existent tool
    res_bad = Call_Tools("nonexistent_tool")
    tests.append(("call_tools_error_handling", not res_bad["success"] and res_bad["exit_code"] == 127))

    # Test 6: Call_Tools on cf status
    res_cf = Call_Tools("cf", ["status"], {"capture": True, "timeout": 15})
    tests.append(("call_tools_cf_status", res_cf["exit_code"] == 0 and "Node.js" in res_cf["stdout"]))

    # Test 7: Prerequisite assertion failure generates structured ErrBlock
    class MissingPrereqTool(BaseTool):
        def __init__(self):
            super().__init__(
                tool_id="mock_missing",
                name="Mock Missing Runtime",
                category=ToolCategory.SYSADMIN,
                risk_level=RiskLevel.LOW,
                version="1.0.0",
                description="Mock tool",
                cmd="mock.cmd",
                prerequisites=[
                    PrerequisiteEnv(binary="nonexistent_runtime_xyz", min_version="1.0.0")
                ],
            )

    TOOL_REGISTRY.register(MissingPrereqTool)
    res_err = Call_Tools("mock_missing")
    tests.append((
        "call_tools_err_block_prerequisite",
        not res_err["success"]
        and res_err["exit_code"] == 126
        and "ERR_PREREQUISITE_MISSING" in res_err["stderr"]
        and "err_block" in res_err
    ))

    # Test 8: Anti-privilege escalation blocks modifying tool under read-only tier
    res_auth = Call_Tools("pwsh", ["-Command", "Get-Date"], {"tier": "read-only"})
    tests.append((
        "call_tools_anti_privilege_escalation",
        not res_auth["success"]
        and res_auth["exit_code"] == 126
        and "ERR_PERMISSION_DENIED" in res_auth["stderr"]
    ))

    # Test 9: Call_Tools response includes standard envfeel payload
    res_envfeel = Call_Tools("scribe", ["status"], {"timeout": 10})
    tests.append((
        "call_tools_standard_envfeel_payload",
        "envfeel" in res_envfeel
        and "status" in res_envfeel["envfeel"]
        and "platform" in res_envfeel["envfeel"]
    ))

    # Test 10: Call_Tools generates TraceReceipt with stages
    tests.append((
        "call_tools_trace_receipt",
        "trace_receipt" in res_envfeel
        and res_envfeel["trace_receipt"]["status"] == "PASS"
        and len(res_envfeel["trace_receipt"]["stages"]) >= 6
    ))

    # Test 11: retrace function analyzes trace from Call_Tools
    retrace_out = retrace(res_envfeel)
    tests.append((
        "index_retrace_backward_walk",
        "逆向调用链回溯" in retrace_out
        and "7/7: 响应封套封装" in retrace_out
        and "1/7: 入口封套校验" in retrace_out
    ))

    # Test 12: Open Protocol schema export
    proto_schema = dump_open_protocol_schema()
    tests.append((
        "index_open_protocol_schema",
        isinstance(proto_schema, dict)
        and "DSHARequest" in proto_schema.get("definitions", {})
        and "TraceReceipt" in proto_schema.get("definitions", {})
    ))

    passed = sum(1 for _, ok in tests if ok)
    total = len(tests)
    print(f"selftest: {passed}/{total}")
    for name, ok in tests:
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}")
    return passed == total


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print("DSHA-Index: Master Capability Catalog & Call_Tools Dispatcher (v1.2.0-std)")
        print("Usage:")
        print("  index.py list [-c|--category <cat>]   # Display master index table (optionally filtered)")
        print("  index.py categories                   # List all registered capability categories")
        print("  index.py feel [tool] [--json]         # Display Host Perception Radar HUD")
        print("  index.py check [tool]                 # Check prerequisite host environment")
        print("  index.py trace <trace_id> [--json]    # Inspect execution trace receipt by ID")
        print("  index.py retrace <target> [--json]    # Reverse causal trace walk from Stage 7 to Stage 1")
        print("  index.py schema                       # Dump official Open Protocol JSON Schema")
        print("  index.py get <tool>                   # Display JSON metadata for tool")
        print("  index.py call <tool> [args...]        # Invoke tool via Call_Tools")
        print("  index.py selftest                     # Run internal unit tests")
        return 0

    cmd = sys.argv[1].lower()

    if cmd == "schema":
        print(json.dumps(dump_open_protocol_schema(), ensure_ascii=False, indent=2))
        return 0

    if cmd == "trace":
        if len(sys.argv) < 3:
            print("Usage: index.py trace <trace_id> [--json]", file=sys.stderr)
            return 1
        tid = sys.argv[2]
        data = TraceStore.get(tid)
        if not data:
            print(f"Error: Trace '{tid}' not found.", file=sys.stderr)
            return 1
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return 0

    if cmd == "retrace":
        if len(sys.argv) < 3:
            print("Usage: index.py retrace <trace_id_or_file> [--json]", file=sys.stderr)
            return 1
        target = sys.argv[2]
        as_json = "--json" in sys.argv
        print(retrace(target, as_json=as_json))
        return 0

    if cmd in ("feel", "envfeel"):
        target_tool = None
        as_json = "--json" in sys.argv
        for arg in sys.argv[2:]:
            if not arg.startswith("-"):
                target_tool = arg
                break
        from base_tool import HostEnvPerceiver
        print(HostEnvPerceiver.render_radar(tool_id=target_tool, as_json=as_json))
        return 0

    if cmd == "list":
        category = None
        if len(sys.argv) >= 4 and sys.argv[2] in ("-c", "--category"):
            category = sys.argv[3]
        elif len(sys.argv) == 3 and not sys.argv[2].startswith("-"):
            category = sys.argv[2]
        print_index_table(category=category)
        return 0

    if cmd == "categories":
        for cat in TOOL_REGISTRY.list_categories():
            tools = TOOL_REGISTRY.get_by_category(cat)
            tool_names = ", ".join([t.id for t in tools])
            print(f"  • {cat.ljust(22)} ({len(tools)} 工具: {tool_names})")
        return 0

    if cmd == "check":
        tool_id = sys.argv[2] if len(sys.argv) > 2 else None
        tools = [TOOL_REGISTRY.get(tool_id)] if tool_id else list(TOOL_REGISTRY.all().values())
        all_ok = True
        for t in tools:
            if not t:
                print(f"Error: Tool '{tool_id}' not found.", file=sys.stderr)
                return 1
            ok, err = t.assert_environment()
            if ok:
                print(f"  [PASS] [{t.category.value}] {t.name} (id: {t.id}) - Prerequisites satisfied.")
            else:
                all_ok = False
                print(err.format_cli())
        return 0 if all_ok else 1

    if cmd == "selftest":
        ok = run_selftest()
        sys.exit(0 if ok else 1)

    if cmd == "get":
        if len(sys.argv) < 3:
            print("Error: Specify tool id (cf, rea, scribe, pwsh, sh, tier, meter)", file=sys.stderr)
            return 1
        t_id = sys.argv[2].lower()
        tool = TOOL_REGISTRY.get(t_id)
        if tool:
            print(json.dumps(tool.to_dict(), ensure_ascii=False, indent=2))
            return 0
        else:
            print(f"Error: Tool '{t_id}' not found in DSHA-Index.", file=sys.stderr)
            return 1

    if cmd == "call":
        if len(sys.argv) < 3:
            print("Usage: index.py call <tool> [args...]", file=sys.stderr)
            return 1
        tool_name = sys.argv[2]
        call_args = sys.argv[3:]
        res = Call_Tools(tool_name, call_args, {"capture": False})
        if not res["success"] and res.get("stderr"):
            print(res["stderr"], file=sys.stderr)
        return res["exit_code"]

    # Direct tool call shorthand: index.py <tool> [args...]
    if TOOL_REGISTRY.get(cmd):
        res = Call_Tools(cmd, sys.argv[2:], {"capture": False})
        if not res["success"] and res.get("stderr"):
            print(res["stderr"], file=sys.stderr)
        return res["exit_code"]

    print_index_table()
    return 0


if __name__ == "__main__":
    sys.exit(main())
