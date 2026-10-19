#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSHA-Index: Master Capability Catalog & Call_Tools Dispatcher (v1.0.0).

Architecture Role:
  [Top-Level Index] DSHA-Index defines the complete capability catalog and contracts.
  [Core Router]     DSHA-Router resolves developer intent and maps to tools.
  [Unified Driver]  Call_Tools pulls and executes parallel tools with standardized
                    isolation, encoding, proxy propagation, and trace logging.

Tools Registered:
  - cf      : Cloudflare Web, Workers, Pages, Tunnels & Forge API
  - rea     : Reverse Engineer Anything (Binary & artifact forensics)
  - scribe  : Scribe intelligence archivist & research dossier generator
  - pwsh    : Hardened PowerShell 7 automation (parenthesis-safe)
  - sh      : GNU Bash POSIX scripting
  - tier    : Permission tier management
  - meter   : Quota & Token floating telemetry radar
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


DSHA_INDEX = {
    "cf": {
        "id": "cf",
        "name": "Cloudflare Web & Edge Engine",
        "cmd": "cf.cmd",
        "script": "dsha_cf.py",
        "version": "1.0.0",
        "description": "Cloudflare Workers, Pages, Tunnels, Web deployment, Edge APIs & Forge OpenAPI",
        "tags": ["web", "workers", "pages", "tunnel", "edge", "deploy", "serverless", "dns"],
        "extensions": [".html", ".css", ".ts", ".tsx", ".js", ".jsx", ".wasm", ".toml"],
        "exact_filenames": ["wrangler.toml", "wrangler.json", "package.json", "index.html"],
        "risk_level": "medium",
        "keywords": [
            "cloudflare", "wrangler", "worker", "workers", "pages", "tunnel",
            "web", "edge", "deploy", "serverless", "dns", "kv", "r2", "d1",
            "frontend", "http", "api", "ingress", "部署", "网页", "前端", "边缘计算", "函数计算", "隧道", "域名"
        ],
        "weight": 1.0,
    },
    "rea": {
        "id": "rea",
        "name": "Reverse Engineer Anything (REA)",
        "cmd": "rea.cmd",
        "script": "dsha_rea_driver.py",
        "version": "1.0.0",
        "description": "Binary analysis, PE/ELF/Mach-O inspection, ASAR unpack, APK decompilation",
        "tags": ["reverse", "decompile", "binary", "pe", "elf", "apk", "asar", "forensics"],
        "extensions": [".exe", ".dll", ".so", ".dylib", ".apk", ".asar", ".dex", ".class", ".bin", ".sys"],
        "exact_filenames": [],
        "risk_level": "low",
        "keywords": [
            "reverse", "decompile", "disassemble", "unpack", "binary", "pe",
            "elf", "macho", "apk", "asar", "dex", "section", "iat", "import table",
            "inspect-artifact", "ghidra", "hopper", "ida", "strings",
            "逆向", "反编译", "解包", "脱壳", "查壳", "节表", "导入表", "二进制分析", "反汇编"
        ],
        "weight": 1.0,
    },
    "scribe": {
        "id": "scribe",
        "name": "DSHA Scribe (Chronicler & Archivist)",
        "cmd": "scribe.cmd",
        "script": "scribe.py",
        "version": "1.0.0",
        "description": "Log harvesting, error stack trace indexing, research dossier synthesis",
        "tags": ["logs", "audit", "dossier", "diagnose", "triage", "archivist"],
        "extensions": [".log", ".jsonl"],
        "exact_filenames": ["gate.log", "transcript.jsonl"],
        "risk_level": "read-only",
        "keywords": [
            "log", "audit", "dossier", "triage", "trace", "error", "exception",
            "harvest", "chronicler", "incident", "briefing", "diagnose", "investigate",
            "stacktrace", "failed", "exit code",
            "日志", "收录", "简报", "审计", "崩溃", "报错", "异常", "排查", "门禁记录", "堆栈", "诊断", "复盘"
        ],
        "weight": 1.0,
    },
    "pwsh": {
        "id": "pwsh",
        "name": "DSHA Dedicated PowerShell 7",
        "cmd": "dsha-pwsh.cmd",
        "script": None,
        "version": "7.6.6",
        "description": "Parenthesis-safe PowerShell 7 pipeline and Windows automation",
        "tags": ["powershell", "pwsh", "pipeline", "windows", "automation", "sysadmin"],
        "extensions": [".ps1", ".psm1", ".psd1"],
        "exact_filenames": [],
        "risk_level": "medium",
        "keywords": [
            "powershell", "pwsh", "cmdlet", "pipeline", "wmi", "cim", "get-process",
            "set-executionpolicy", "active directory", "windows service",
            "管道", "进程", "脚本执行", "注册表"
        ],
        "weight": 1.0,
    },
    "sh": {
        "id": "sh",
        "name": "DSHA Safe GNU Bash",
        "cmd": "dsha-sh.cmd",
        "script": None,
        "version": "5.3",
        "description": "POSIX shell automation, Git Bash utilities (grep, awk, sed, curl)",
        "tags": ["bash", "posix", "shell", "linux", "scripts"],
        "extensions": [".sh", ".bash"],
        "exact_filenames": ["Makefile", "Dockerfile"],
        "risk_level": "medium",
        "keywords": [
            "bash", "sh", "posix", "shell", "grep", "sed", "awk", "curl", "chmod", "export", "终端脚本"
        ],
        "weight": 0.8,
    },
    "tier": {
        "id": "tier",
        "name": "DSH Permission Tier Gate",
        "cmd": "agy-tier.ps1",
        "script": "gate.py",
        "version": "1.0.0",
        "description": "Antigravity permission tier management (read-only, auto, danger-full-access, workspace-write)",
        "tags": ["security", "tier", "permission", "sandbox", "gate"],
        "extensions": [],
        "exact_filenames": ["tier.json"],
        "risk_level": "admin",
        "keywords": [
            "tier", "permission", "sandbox", "read-only", "danger-full-access",
            "workspace-write", "gate", "switch tier", "grant",
            "权限", "档位", "切档", "只读", "全权", "沙箱", "放行"
        ],
        "weight": 1.1,
    },
    "meter": {
        "id": "meter",
        "name": "DSHA Quota Floating Radar",
        "cmd": "agy-meter.ps1",
        "script": "meter.py",
        "version": "1.0.0",
        "description": "5H / 7D sliding window token and quota visual monitoring HUD",
        "tags": ["quota", "meter", "token", "telemetry", "hud", "radar"],
        "extensions": [],
        "exact_filenames": [],
        "risk_level": "low",
        "keywords": [
            "meter", "quota", "token", "floating window", "hud", "radar", "5h", "7d", "watermark",
            "额度", "悬浮窗", "雷达", "回血", "水位", "代币"
        ],
        "weight": 1.1,
    },
}


def resolve_tool_path(tool_name):
    meta = DSHA_INDEX.get(tool_name.lower())
    if not meta:
        return None

    cmd_name = meta["cmd"]
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent if script_dir.name in ("scripts", "bin") else script_dir
    user_home = Path(os.environ.get("USERPROFILE") or ".")

    candidate_locations = [
        repo_root / "bin" / cmd_name,
        user_home / ".gemini" / "config" / cmd_name,
        repo_root / cmd_name,
    ]

    for p in candidate_locations:
        if p.is_file():
            return str(p)

    which_path = shutil.which(cmd_name)
    if which_path:
        return which_path

    return None


def Call_Tools(tool_name, args=None, context=None):
    """
    Unified Parallel Tool Pulling and Execution Protocol.
    Pulls the tool definition from DSHA-Index, resolves the binary,
    configures environment isolation, executes safely, and captures results.
    """
    if args is None:
        args = []
    if context is None:
        context = {}

    start_time = time.time()
    tool_key = tool_name.lower()
    meta = DSHA_INDEX.get(tool_key)

    if not meta:
        return {
            "success": False,
            "tool": tool_name,
            "exit_code": 127,
            "stdout": "",
            "stderr": f"[DSHA-INDEX] Error: Tool '{tool_name}' not found in DSHA master index.",
            "duration_ms": 0,
        }

    exec_path = resolve_tool_path(tool_key)
    if not exec_path:
        return {
            "success": False,
            "tool": tool_name,
            "exit_code": 127,
            "stdout": "",
            "stderr": f"[DSHA-INDEX] Error: Executable '{meta['cmd']}' could not be resolved on disk.",
            "duration_ms": 0,
        }

    # Setup environment
    exec_env = os.environ.copy()
    exec_env["PYTHONUTF8"] = "1"
    if context.get("proxy"):
        exec_env["ALL_PROXY"] = context["proxy"]
        exec_env["HTTPS_PROXY"] = context["proxy"]
    elif "ALL_PROXY" not in exec_env:
        exec_env["ALL_PROXY"] = "socks5://127.0.0.1:10808"

    cwd = context.get("cwd") or str(Path.cwd())
    timeout = context.get("timeout", 180)

    # Command assembly
    if exec_path.endswith(".ps1"):
        script_dir = Path(__file__).resolve().parent
        pwsh_bin = script_dir.parent / "bin" / "pwsh.cmd"
        cmd = [str(pwsh_bin), "-NoProfile", "-File", exec_path] + args
    else:
        cmd = [exec_path] + args

    capture = context.get("capture", True)

    try:
        if capture:
            proc = subprocess.run(
                cmd,
                cwd=cwd,
                env=exec_env,
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout,
            )
            duration_ms = int((time.time() - start_time) * 1000)
            return {
                "success": proc.returncode == 0,
                "tool": tool_name,
                "tool_name": meta["name"],
                "exit_code": proc.returncode,
                "stdout": proc.stdout,
                "stderr": proc.stderr,
                "duration_ms": duration_ms,
                "cmd": cmd,
            }
        else:
            proc = subprocess.run(cmd, cwd=cwd, env=exec_env, timeout=timeout)
            duration_ms = int((time.time() - start_time) * 1000)
            return {
                "success": proc.returncode == 0,
                "tool": tool_name,
                "tool_name": meta["name"],
                "exit_code": proc.returncode,
                "stdout": "",
                "stderr": "",
                "duration_ms": duration_ms,
                "cmd": cmd,
            }
    except subprocess.TimeoutExpired:
        duration_ms = int((time.time() - start_time) * 1000)
        return {
            "success": False,
            "tool": tool_name,
            "exit_code": 124,
            "stdout": "",
            "stderr": f"[DSHA-INDEX] Execution timed out after {timeout} seconds.",
            "duration_ms": duration_ms,
        }
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        return {
            "success": False,
            "tool": tool_name,
            "exit_code": 1,
            "stdout": "",
            "stderr": f"[DSHA-INDEX] Execution error: {e}",
            "duration_ms": duration_ms,
        }


def print_index_table():
    print("=== 📚 DSHA-Index 顶层能力目录与全景索引 (Master Catalog v1.0.0) ===")
    print(f"| {'标识'.ljust(8)} | {'工具名称'.ljust(32)} | {'启动器'.ljust(16)} | {'安全级别'.ljust(10)} | {'核心标签'} |")
    print(f"|{'-'*10}|{'-'*34}|{'-'*18}|{'-'*12}|{'-'*24}|")
    for t_id, meta in DSHA_INDEX.items():
        p = resolve_tool_path(t_id)
        status_sym = "✓" if p else "✗"
        tag_str = ", ".join(meta["tags"][:3])
        print(f"| {status_sym} {t_id.ljust(6)} | {meta['name'].ljust(32)} | {meta['cmd'].ljust(16)} | {meta['risk_level'].ljust(10)} | {tag_str} |")


def run_selftest():
    tests = []
    # Test 1: Registry completeness
    tests.append(("registry_7_tools", len(DSHA_INDEX) == 7))

    # Test 2: Resolve all tools
    all_resolved = True
    for t_id in DSHA_INDEX:
        p = resolve_tool_path(t_id)
        if not p:
            all_resolved = False
    tests.append(("all_tools_resolved", all_resolved))

    # Test 3: Call_Tools on scribe status
    res = Call_Tools("scribe", ["status"], {"capture": True, "timeout": 10})
    tests.append(("call_tools_scribe_status", res["success"] and "DSHA" in res["stdout"]))

    # Test 4: Call_Tools on non-existent tool
    res_bad = Call_Tools("nonexistent_tool")
    tests.append(("call_tools_error_handling", not res_bad["success"] and res_bad["exit_code"] == 127))

    # Test 5: Call_Tools on cf status
    res_cf = Call_Tools("cf", ["status"], {"capture": True, "timeout": 15})
    tests.append(("call_tools_cf_status", res_cf["exit_code"] == 0 and "Node.js" in res_cf["stdout"]))

    passed = sum(1 for _, ok in tests if ok)
    total = len(tests)
    print(f"selftest: {passed}/{total}")
    for name, ok in tests:
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}")
    return passed == total


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print("DSHA-Index: Master Capability Catalog & Call_Tools Dispatcher")
        print("Usage:")
        print("  index.py list                     # Display master index table")
        print("  index.py get <tool>               # Display JSON metadata for tool")
        print("  index.py call <tool> [args...]    # Invoke tool via Call_Tools")
        print("  index.py selftest                 # Run internal unit tests")
        return 0

    cmd = sys.argv[1].lower()

    if cmd == "list":
        print_index_table()
        return 0

    if cmd == "selftest":
        ok = run_selftest()
        sys.exit(0 if ok else 1)

    if cmd == "get":
        if len(sys.argv) < 3:
            print("Error: Specify tool id (cf, rea, scribe, pwsh, sh, tier, meter)", file=sys.stderr)
            return 1
        t_id = sys.argv[2].lower()
        if t_id in DSHA_INDEX:
            print(json.dumps(DSHA_INDEX[t_id], ensure_ascii=False, indent=2))
            return 0
        else:
            print(f"Error: Tool '{t_id}' not found.", file=sys.stderr)
            return 1

    if cmd == "call":
        if len(sys.argv) < 3:
            print("Usage: index.py call <tool> [args...]", file=sys.stderr)
            return 1
        tool = sys.argv[2]
        call_args = sys.argv[3:]
        res = Call_Tools(tool, call_args, {"capture": False})
        return res["exit_code"]

    # Direct tool call shorthand: index.py <tool> [args...]
    if cmd in DSHA_INDEX:
        res = Call_Tools(cmd, sys.argv[2:], {"capture": False})
        return res["exit_code"]

    print_index_table()
    return 0


if __name__ == "__main__":
    sys.exit(main())
