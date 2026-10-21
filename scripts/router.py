#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSHA Intelligent Tool Routing Layer (DHSA-TestWeb).

Role & Mission:
  Evaluates developer intent, context, targets, and file types to dynamically
  route requests to the most appropriate DSHA subsystem (CF, REA, Scribe, Pwsh, Sh, Tier, Meter).

CLI Commands:
  dsha.cmd route "<query or file>" [--json]
  dsha.cmd exec "<query or file>" [extra_args...]
  dsha.cmd status
  dsha.cmd selftest
  dsha.cmd <tool> [args...]
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

# Ensure UTF-8 output across Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Import BaseTool Architecture for Environment-Activated Routing
try:
    from base_tool import TOOL_REGISTRY as BASE_REGISTRY, HostEnvPerceiver, TraceStore, retrace, dump_open_protocol_schema
except ImportError:
    try:
        from scripts.base_tool import TOOL_REGISTRY as BASE_REGISTRY, HostEnvPerceiver, TraceStore, retrace, dump_open_protocol_schema
    except ImportError:
        BASE_REGISTRY = None
        HostEnvPerceiver = None
        TraceStore = None
        retrace = None
        dump_open_protocol_schema = None


TOOL_REGISTRY = {
    "markdown": {"name":"Markdown Tool","cmd":"dsha-markdown",
                 "description":"Read-only Markdown lint and outline",
                 "extensions":[".md",".markdown"],"exact_filenames":["README.md","SKILL.md"],
                 "keywords":["markdown","md文档","md语法"],"weight":1.8},
    "office": {"name":"Office Tool","cmd":"dsha-office",
               "description":"Read-only OOXML inspection",
               "extensions":[".docx",".xlsx",".pptx"],"exact_filenames":[],
               "keywords":["office","word","excel","powerpoint","办公文档"],"weight":1.6},
    "wps": {"name":"WPS Tool","cmd":"dsha-wps",
            "description":"WPS Linux runtime readiness",
            "extensions":[".wps",".et",".dps"],"exact_filenames":[],
            "keywords":["wps","金山办公"],"weight":1.8},
    "cf": {
        "name": "Cloudflare Web & Edge Engine",
        "cmd": "cf.cmd",
        "description": "Cloudflare Workers, Pages, Tunnels, Web deployment, Edge APIs",
        "extensions": [".html", ".css", ".ts", ".tsx", ".js", ".jsx", ".wasm", ".toml"],
        "exact_filenames": ["wrangler.toml", "wrangler.json", "package.json", "index.html"],
        "keywords": [
            "cloudflare", "wrangler", "worker", "workers", "pages", "tunnel",
            "web", "edge", "deploy", "serverless", "dns", "kv", "r2", "d1",
            "frontend", "http", "api", "ingress", "部署", "网页", "前端", "边缘计算", "函数计算", "隧道", "域名"
        ],
        "weight": 1.0,
    },
    "rea": {
        "name": "Reverse Engineer Anything (REA)",
        "cmd": "rea.cmd",
        "description": "Binary analysis, PE/ELF/Mach-O inspection, ASAR unpack, APK decompilation",
        "extensions": [".exe", ".dll", ".so", ".dylib", ".apk", ".asar", ".dex", ".class", ".bin", ".sys"],
        "exact_filenames": [],
        "keywords": [
            "reverse", "decompile", "disassemble", "unpack", "binary", "pe",
            "elf", "macho", "apk", "asar", "dex", "section", "iat", "import table",
            "inspect-artifact", "ghidra", "hopper", "ida", "strings",
            "逆向", "反编译", "解包", "脱壳", "查壳", "节表", "导入表", "二进制分析", "反汇编"
        ],
        "weight": 1.0,
    },
    "scribe": {
        "name": "DSHA Scribe (Chronicler & Archivist)",
        "cmd": "scribe.cmd",
        "description": "Log harvesting, error stack trace indexing, research dossier synthesis",
        "extensions": [".log", ".jsonl"],
        "exact_filenames": ["gate.log", "transcript.jsonl"],
        "keywords": [
            "log", "audit", "dossier", "triage", "trace", "error", "exception",
            "harvest", "chronicler", "incident", "briefing", "diagnose", "investigate",
            "stacktrace", "failed", "exit code",
            "日志", "收录", "简报", "审计", "崩溃", "报错", "异常", "排查", "门禁记录", "堆栈", "诊断", "复盘"
        ],
        "weight": 1.0,
    },
    "pwsh": {
        "name": "DSHA Dedicated PowerShell 7",
        "cmd": "dsha-pwsh.cmd",
        "description": "Parenthesis-safe PowerShell 7 pipeline and Windows automation",
        "extensions": [".ps1", ".psm1", ".psd1"],
        "exact_filenames": [],
        "keywords": [
            "powershell", "pwsh", "cmdlet", "pipeline", "wmi", "cim", "get-process",
            "set-executionpolicy", "active directory", "windows service",
            "管道", "进程", "脚本执行", "注册表"
        ],
        "weight": 1.0,
    },
    "sh": {
        "name": "DSHA Safe GNU Bash",
        "cmd": "dsha-sh.cmd",
        "description": "POSIX shell automation, Git Bash utilities (grep, awk, sed, curl)",
        "extensions": [".sh", ".bash"],
        "exact_filenames": ["Makefile", "Dockerfile"],
        "keywords": [
            "bash", "sh", "posix", "shell", "grep", "sed", "awk", "curl", "chmod", "export", "终端脚本"
        ],
        "weight": 0.8,
    },
    "tier": {
        "name": "DSH Permission Tier Gate",
        "cmd": "agy-tier.ps1",
        "description": "Antigravity permission tier management (read-only, auto, danger-full-access, workspace-write)",
        "extensions": [],
        "exact_filenames": ["tier.json"],
        "keywords": [
            "tier", "permission", "sandbox", "read-only", "danger-full-access",
            "workspace-write", "gate", "switch tier", "grant",
            "权限", "档位", "切档", "只读", "全权", "沙箱", "放行"
        ],
        "weight": 1.1,
    },
    "meter": {
        "name": "DSHA Quota Floating Radar",
        "cmd": "agy-meter.ps1",
        "description": "5H / 7D sliding window token and quota visual monitoring HUD",
        "extensions": [],
        "exact_filenames": [],
        "keywords": [
            "meter", "quota", "token", "floating window", "hud", "radar", "5h", "7d", "watermark",
            "额度", "悬浮窗", "雷达", "回血", "水位", "代币"
        ],
        "weight": 1.1,
    },
}


def analyze_route(input_str, check_env=True):
    text = input_str.strip()
    low_text = text.lower()
    words = set(re.findall(r"[\w\.\-]+", low_text))

    scores = {tool: 0.0 for tool in TOOL_REGISTRY}
    match_details = {tool: [] for tool in TOOL_REGISTRY}

    # 1. Exact tool direct invocation
    for tool_id in TOOL_REGISTRY:
        if low_text.startswith(tool_id + " ") or low_text == tool_id:
            scores[tool_id] += 60.0
            match_details[tool_id].append(f"明确指定工具标识 '{tool_id}'")

    # 2. Check path / file extension in input
    extracted_paths = re.findall(r"[a-zA-Z0-9_\-\.\/\\]+\.[a-zA-Z0-9]+", text)
    for p in extracted_paths:
        p_obj = Path(p)
        ext = p_obj.suffix.lower()
        fname = p_obj.name.lower()

        for tool_id, meta in TOOL_REGISTRY.items():
            if fname in [f.lower() for f in meta["exact_filenames"]]:
                scores[tool_id] += 45.0
                match_details[tool_id].append(f"命中专属文件名 '{fname}'")
            elif ext in meta["extensions"]:
                scores[tool_id] += 35.0
                match_details[tool_id].append(f"命中专属文件扩展名 '{ext}'")

    # 3. Keyword matching with boundary safety
    for tool_id, meta in TOOL_REGISTRY.items():
        matched_kw = []
        for kw in meta["keywords"]:
            is_ascii = all(ord(c) < 128 for c in kw)
            if is_ascii and len(kw) <= 4:
                # Use word boundary for short ascii words
                if re.search(r"\b" + re.escape(kw) + r"\b", low_text):
                    matched_kw.append(kw)
            else:
                if kw in low_text:
                    matched_kw.append(kw)

        if matched_kw:
            pts = len(matched_kw) * 12.0 * meta["weight"]
            scores[tool_id] += pts
            match_details[tool_id].append(f"命中关键词: {', '.join(matched_kw[:4])}")

    # 4. Host Environment Perception & Route Activation
    env_status_map = {}
    env_details_map = {}
    env_remediations_map = {}

    if check_env and BASE_REGISTRY:
        for tool_id in TOOL_REGISTRY:
            base_tool = BASE_REGISTRY.get(tool_id)
            if base_tool:
                ok_e, err_e = base_tool.assert_environment()
                if ok_e:
                    env_status_map[tool_id] = "ACTIVATED"
                    # Apply environment activation readiness boost to matched candidates
                    if scores[tool_id] > 0:
                        scores[tool_id] = scores[tool_id] * 1.15 + 5.0
                        match_details[tool_id].append("环境自感知激活就绪")
                else:
                    env_status_map[tool_id] = "PREREQ_REQUIRED"
                    if err_e:
                        env_details_map[tool_id] = err_e.details or []
                        env_remediations_map[tool_id] = err_e.remediations or []

    # Rank tools by score
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    best_tool, best_score = ranked[0]
    total_score = sum(scores.values())

    # 这是「得分占比」，不是「判断正确的概率」。单候选命中时它会接近 1.0，
    # 打印成百分比容易被读成置信概率，因此另给 score_share 字段并把语义写进报告。
    score_share = round(best_score / (total_score + 1e-6), 2) if total_score > 0 else 0.0
    confidence = score_share  # 向后兼容别名

    # Build suggested command
    tool_meta = TOOL_REGISTRY[best_tool]
    cmd_name = tool_meta["cmd"]

    # Parameter extraction
    remaining_args = text
    if remaining_args.lower().startswith(best_tool + " "):
        remaining_args = remaining_args[len(best_tool) + 1:].strip()

    suggested_cmd = f"{cmd_name} {remaining_args}".strip() if remaining_args else f"{cmd_name} status"

    activation_state = env_status_map.get(best_tool, "UNKNOWN")
    if activation_state == "ACTIVATED":
        env_summary = "🟢 [已激活] 必需宿主运行环境均已就位"
    elif activation_state == "PREREQ_REQUIRED":
        missing_bins = [d.get("binary") for d in env_details_map.get(best_tool, []) if "binary" in d]
        env_summary = f"🟡 [待激活 · 需补齐依赖] 缺少: {', '.join(missing_bins)}"
    else:
        env_summary = "⚪ [未检测]"

    result = {
        "input": input_str,
        "selected_tool": best_tool,
        "tool_name": tool_meta["name"],
        "executable": tool_meta["cmd"],
        "env_activation": activation_state,
        "env_status": env_summary,
        "env_remediations": env_remediations_map.get(best_tool, []),
        "confidence": confidence,
        "score_share": score_share,
        "score": round(best_score, 1),
        "reasoning": match_details[best_tool] if match_details[best_tool] else ["基于综合情境判定"],
        "suggested_command": suggested_cmd,
        "runner": "DSHA Router v1.0 (DHSA-TestWeb)",
        "alternatives": [
            {
                "tool": t,
                "name": TOOL_REGISTRY[t]["name"],
                "score": round(s, 1),
                "activation": env_status_map.get(t, "UNKNOWN"),
            }
            for t, s in ranked[1:3] if s > 0
        ],
    }
    return result


def print_route_report(res):
    print("=== 🧭 DSHA 路由层决策报告 (Routing Decision) ===")
    print(f"  输入意图: \"{res['input']}\"")
    print(f"  首选工具: [{res['selected_tool'].upper()}] {res['tool_name']}")
    print(f"  执行入口: {res['executable']}")
    print(f"  环境状态: {res.get('env_status', '未知')}")
    print(f"  得分占比: {int(res['score_share'] * 100)}% (得分: {res['score']})  ← 占比，非正确概率")
    print(f"  决策依据: {'; '.join(res['reasoning'])}")
    print(f"  建议命令: `{res['suggested_command']}`")
    if res.get("env_remediations"):
        print("  环境修复指引:")
        for r in res["env_remediations"]:
            print(f"    💡 {r}")
    if res["alternatives"]:
        alt_str = ", ".join([f"{a['tool']}({a['score']}分, {a.get('activation', '未知')})" for a in res["alternatives"]])
        print(f"  备选工具: {alt_str}")


def run_selftest():
    tests = [
        # (input_query, expected_tool)
        ("逆向分析 elevate.exe 的节表和哈希", "rea"),
        ("帮我解包 app.asar 查看内部源码", "rea"),
        ("部署这个 Cloudflare Worker 并启动本地 dev", "cf"),
        ("配置 cloudflare pages 和 tunnel 隧道", "cf"),
        ("收录最近的崩溃日志并生成一份问题研究简报", "scribe"),
        ("查看 gate.log 门禁拦截记录", "scribe"),
        ("执行一段 powershell 管道脚本处理进程", "pwsh"),
        ("把当前 DSHA 权限档位切换为 read-only", "tier"),
    ]

    passed = 0
    total = len(tests)
    print(f"Running DSHA Router test matrix (n={total})...")
    for q, expected in tests:
        res = analyze_route(q)
        ok = (res["selected_tool"] == expected) and ("env_activation" in res)
        if ok:
            passed += 1
            print(f"  [PASS] \"{q[:25]}...\" -> {res['selected_tool']} ({res['env_activation']}, 占比 {int(res['score_share']*100)}%)")
        else:
            print(f"  [FAIL] \"{q[:25]}...\" -> got {res['selected_tool']}, expected {expected}")

    # Test 9: Host Perception Radar telemetry
    if HostEnvPerceiver:
        radar_text = HostEnvPerceiver.render_radar()
        if "DSHA EnvFeel" in radar_text:
            passed += 1
            total += 1
            print("  [PASS] \"HostEnvPerceiver.render_radar()\" -> 宿主感知雷达 HUD 就绪")

    print(f"selftest: {passed}/{total}  (n={total}, miss={total - passed})")
    return passed == total


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print("DSHA 智能路由层 (DHSA-TestWeb)")
        print("Usage:")
        print("  dsha route \"<intent or file>\" [--json]")
        print("  dsha exec \"<intent or file>\" [args...]")
        print("  dsha feel [tool] [--json]             # 宿主自感知雷达与运行时探针 HUD")
        print("  dsha envfeel [tool] [--json]          # 同上")
        print("  dsha trace <trace_id> [--json]        # 查看执行凭据与链路记录")
        print("  dsha retrace <target> [--json]        # 顺着接口逆向回溯根因与复现/回滚")
        print("  dsha schema                           # 导出 DSHA 开放协议标准 JSON Schema")
        print("  dsha <cf|rea|scribe|pwsh|sh|tier|meter> [args...]")
        print("  dsha status")
        print("  dsha selftest")
        return 0

    cmd = sys.argv[1].lower()

    if cmd == "schema":
        if dump_open_protocol_schema:
            print(json.dumps(dump_open_protocol_schema(), ensure_ascii=False, indent=2))
            return 0
        print("[DSHA-ROUTER] Error: dump_open_protocol_schema not available.", file=sys.stderr)
        return 1

    if cmd == "trace":
        if len(sys.argv) < 3:
            print("Usage: dsha trace <trace_id> [--json]", file=sys.stderr)
            return 1
        tid = sys.argv[2]
        if TraceStore:
            data = TraceStore.get(tid)
            if not data:
                print(f"Error: Trace '{tid}' not found.", file=sys.stderr)
                return 1
            print(json.dumps(data, ensure_ascii=False, indent=2))
            return 0
        print("[DSHA-ROUTER] Error: TraceStore not available.", file=sys.stderr)
        return 1

    if cmd == "retrace":
        if len(sys.argv) < 3:
            print("Usage: dsha retrace <target> [--json]", file=sys.stderr)
            return 1
        target = sys.argv[2]
        as_json = "--json" in sys.argv
        if retrace:
            print(retrace(target, as_json=as_json))
            return 0
        print("[DSHA-ROUTER] Error: retrace not available.", file=sys.stderr)
        return 1

    if cmd == "selftest":
        ok = run_selftest()
        sys.exit(0 if ok else 1)

    if cmd in ("feel", "envfeel"):
        target_tool = None
        as_json = "--json" in sys.argv
        for arg in sys.argv[2:]:
            if not arg.startswith("-"):
                target_tool = arg
                break

        if HostEnvPerceiver:
            print(HostEnvPerceiver.render_radar(tool_id=target_tool, as_json=as_json))
            return 0
        else:
            print("[DSHA-ROUTER] Error: HostEnvPerceiver not available.", file=sys.stderr)
            return 1

    if cmd == "status":
        print("=== DSHA 路由层全工具链与环境激活状态 ===")
        repo_bin = Path(__file__).resolve().parent.parent / "bin"
        for t_id, meta in TOOL_REGISTRY.items():
            t_path = repo_bin / meta["cmd"]
            found = t_path.is_file()
            launcher_tag = "[已就绪]" if found else "[缺失]"
            act_tag = "⚪ [未检测]"
            if BASE_REGISTRY:
                base_tool = BASE_REGISTRY.get(t_id)
                if base_tool:
                    ok_e, _ = base_tool.assert_environment()
                    act_tag = "🟢 [已激活]" if ok_e else "🟡 [待激活]"
            print(f"  {act_tag} {launcher_tag} {t_id.ljust(8)}: {meta['name']} -> {meta['cmd']}")
        return 0

    if cmd == "route":
        if len(sys.argv) < 3:
            print("Error: Please provide a query or file path to route.", file=sys.stderr)
            return 1
        query = sys.argv[2]
        res = analyze_route(query)
        if "--json" in sys.argv:
            print(json.dumps(res, ensure_ascii=False, indent=2))
        else:
            print_route_report(res)
        return 0

    if cmd in ("call", "exec"):
        if len(sys.argv) < 3:
            print("Usage: dsha call <tool> [args...] OR dsha exec \"<intent>\"", file=sys.stderr)
            return 1
        try:
            try:
                from index import Call_Tools
            except ImportError:
                from scripts.index import Call_Tools
        except Exception as e:
            print(f"[DSHA-ROUTER] Error loading Call_Tools: {e}", file=sys.stderr)
            return 1

        if cmd == "call":
            tool_target = sys.argv[2]
            res = Call_Tools(tool_target, sys.argv[3:], {"capture": False})
            if not res["success"] and res.get("stderr"):
                print(res["stderr"], file=sys.stderr)
            return res["exit_code"]
        else:
            query = sys.argv[2]
            res = analyze_route(query)
            print(f"[DSHA-ROUTER] Routing intent to [{res['selected_tool'].upper()}] {res['tool_name']} (得分占比: {int(res['score_share']*100)}%)...")
            call_res = Call_Tools(
                res["selected_tool"],
                tool_args,
                {"capture": False, "route_meta": {"selected_tool": res["selected_tool"], "score_share": res["score_share"], "reasoning": res["reasoning"]}},
            )
            if not call_res["success"] and call_res.get("stderr"):
                print(call_res["stderr"], file=sys.stderr)
            return call_res["exit_code"]

    # Direct tool proxy via Call_Tools
    if cmd in TOOL_REGISTRY:
        try:
            try:
                from index import Call_Tools
            except ImportError:
                from scripts.index import Call_Tools
            call_res = Call_Tools(cmd, sys.argv[2:], {"capture": False})
            if not call_res["success"] and call_res.get("stderr"):
                print(call_res["stderr"], file=sys.stderr)
            return call_res["exit_code"]
        except Exception as error:
            # Never bypass prerequisite/authorization checks after a dispatcher error.
            print(f"[DSHA-ROUTER] Dispatcher failed; execution refused: {error}", file=sys.stderr)
            return 126

    # Default: route the entire argument string
    full_query = " ".join(sys.argv[1:])
    res = analyze_route(full_query)
    print_route_report(res)
    return 0


if __name__ == "__main__":
    sys.exit(main())
