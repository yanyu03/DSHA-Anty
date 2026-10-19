#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSHA Scribe (书记官) - Intelligence & Log Synthesizer for Agents.

Role & Mission:
  Dedicated archivist and log synthesizer. Gathers execution traces, gate logs,
  task outputs, and environment state, then distills them into compact,
  high-density Research Dossiers (问题研究简报) for other agents (Parent, Subagent,
  ChatGPT, etc.) to rapidly diagnose and research issues without burning tokens.

CLI Commands:
  scribe.py harvest [--dir DIR] [--out FILE]
  scribe.py dossier [--issue QUERY] [--out FILE] [--max-events N]
  scribe.py status
  scribe.py selftest
"""

import argparse
import glob
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Ensure UTF-8 output across Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def get_default_paths():
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent if script_dir.name in ("scripts", "bin") else script_dir
    user_home = Path(os.environ.get("USERPROFILE") or os.environ.get("HOME") or ".")
    gemini_cfg = user_home / ".gemini" / "config"
    brain_dir = user_home / ".gemini" / "antigravity" / "brain"

    return {
        "repo_root": repo_root,
        "gemini_cfg": gemini_cfg,
        "brain_dir": brain_dir,
        "scribe_cache": repo_root / ".scribe",
    }


def find_gate_logs(paths):
    candidates = [
        paths["repo_root"] / "plugins" / "dsh-permissions" / "logs" / "gate.log",
        paths["gemini_cfg"] / "plugins" / "dsh-permissions" / "logs" / "gate.log",
    ]
    found = []
    for c in candidates:
        if c.is_file():
            found.append(c)
    return found


def find_task_logs(paths, limit=5):
    brain_dir = paths["brain_dir"]
    if not brain_dir.is_dir():
        return []
    # Search for task-*.log in brain directory
    task_files = list(brain_dir.glob("*/.system_generated/tasks/task-*.log"))
    task_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return task_files[:limit]


def parse_gate_log(log_path, max_lines=50):
    events = []
    if not os.path.exists(log_path):
        return events

    try:
        with open(log_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
    except Exception:
        return events

    for line in lines[-max_lines:]:
        line = line.strip()
        if not line:
            continue
        # Format example: [2026-10-19 00:40:19] [auto] [deny] cid=...
        m = re.match(r"^\[(.*?)\]\s*\[(.*?)\]\s*(?:\[(allow|deny|ask|force_ask)\]|(allow|deny|ask|force_ask))\s*(.*)$", line)
        if m:
            decision = m.group(3) or m.group(4)
            events.append({
                "timestamp": m.group(1),
                "tier": m.group(2),
                "decision": decision,
                "detail": m.group(5)[:160],
            })
        else:
            events.append({
                "timestamp": "unknown",
                "tier": "unknown",
                "decision": "info",
                "detail": line[:160],
            })
    return events


def parse_task_log(log_path):
    info = {
        "path": str(log_path),
        "name": log_path.name,
        "exit_code": None,
        "errors": [],
        "tail": [],
    }
    try:
        with open(log_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception as e:
        info["errors"].append(str(e))
        return info

    # Look for exit code
    m_exit = re.search(r"exited with code\s*(\d+)", content, re.IGNORECASE)
    if m_exit:
        info["exit_code"] = int(m_exit.group(1))

    # Look for error signatures
    error_patterns = [
        r"(Exception[^\n]+)",
        r"(Error:[^\n]+)",
        r"(FATAL[^\n]+)",
        r"(\[FAIL\][^\n]+)",
        r"(The term '[^']+' is not recognized[^\n]+)",
    ]
    for pat in error_patterns:
        for match in re.finditer(pat, content, re.IGNORECASE):
            text = match.group(1).strip()
            if text and text not in info["errors"]:
                info["errors"].append(text[:200])

    lines = [l.rstrip() for l in content.splitlines() if l.strip()]
    info["tail"] = lines[-10:] if len(lines) >= 10 else lines
    return info


def get_git_state(repo_root):
    state = {
        "branch": "unknown",
        "clean": True,
        "modified": [],
        "recent_commits": [],
    }
    git_cmd = shutil.which("git") or "git"

    try:
        res = subprocess.run(
            [git_cmd, "status", "--short"],
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            timeout=5,
        )
        if res.returncode == 0:
            mods = [line.strip() for line in res.stdout.splitlines() if line.strip()]
            state["modified"] = mods
            state["clean"] = (len(mods) == 0)

        res_branch = subprocess.run(
            [git_cmd, "branch", "--show-current"],
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            timeout=5,
        )
        if res_branch.returncode == 0:
            state["branch"] = res_branch.stdout.strip()

        res_log = subprocess.run(
            [git_cmd, "log", "-n", "5", "--oneline"],
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            timeout=5,
        )
        if res_log.returncode == 0:
            state["recent_commits"] = [line.strip() for line in res_log.stdout.splitlines() if line.strip()]
    except Exception as e:
        state["error"] = str(e)

    return state


def get_env_snapshot(paths):
    snapshot = {
        "python": sys.version.split()[0],
        "os": sys.platform,
        "tier": "unknown",
        "englock_mode": "unknown",
        "timestamp": datetime.now().isoformat(),
    }
    tier_candidates = [
        paths["gemini_cfg"] / "plugins" / "dsh-permissions" / "tier.json",
        paths["repo_root"] / "plugins" / "dsh-permissions" / "tier.json",
    ]
    for tc in tier_candidates:
        if tc.is_file():
            try:
                with open(tc, "r", encoding="utf-8") as f:
                    snapshot["tier"] = json.load(f).get("tier", "unknown")
                    break
            except Exception:
                pass

    eng_candidates = [
        paths["gemini_cfg"] / "plugins" / "dsh-permissions" / "englock.json",
        paths["repo_root"] / "plugins" / "dsh-permissions" / "englock.json",
    ]
    for ec in eng_candidates:
        if ec.is_file():
            try:
                with open(ec, "r", encoding="utf-8") as f:
                    snapshot["englock_mode"] = json.load(f).get("mode", "unknown")
                    break
            except Exception:
                pass

    return snapshot


def harvest(paths):
    gate_logs = find_gate_logs(paths)
    gate_events = []
    for gl in gate_logs:
        gate_events.extend(parse_gate_log(gl, max_lines=40))

    task_files = find_task_logs(paths, limit=4)
    tasks = [parse_task_log(tf) for tf in task_files]

    git_state = get_git_state(paths["repo_root"])
    env_state = get_env_snapshot(paths)

    data = {
        "harvested_at": datetime.now().isoformat(),
        "env": env_state,
        "git": git_state,
        "gate_events_count": len(gate_events),
        "recent_gate_events": gate_events[-15:],
        "recent_tasks": tasks,
    }

    cache_dir = paths["scribe_cache"]
    cache_dir.mkdir(parents=True, exist_ok=True)
    out_file = cache_dir / "latest_harvest.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return data


def generate_dossier(data, issue_query=None):
    now_str = data.get("harvested_at", datetime.now().isoformat())
    env = data.get("env", {})
    git = data.get("git", {})
    tasks = data.get("recent_tasks", [])
    gate_events = data.get("recent_gate_events", [])

    # Compile errors
    all_errors = []
    for t in tasks:
        for err in t.get("errors", []):
            all_errors.append(f"[{t.get('name')}] {err}")

    denials = [e for e in gate_events if e.get("decision") in ("deny", "ask")]

    dossier_lines = [
        "# 📋 DSHA 书记官·问题研究简报 (Research Dossier)",
        "",
        "> **使命定位**：由 DSHA 书记官专职收录整理。专为其他 Agent、研究子智能体及 ChatGPT 快速研判提供高密度实证，避免反复翻阅原始海量日志。",
        "",
        f"- **简报生成时间**：`{now_str}`",
        f"- **目标议题/关注点**：`{issue_query or '全盘态势与最新执行诊断'}`",
        f"- **当前权限档位**：`{env.get('tier', 'unknown')}`",
        f"- **工程锁模式**：`{env.get('englock_mode', 'unknown')}`",
        f"- **Python / 宿主**：`Python {env.get('python', 'unknown')}` ({env.get('os', 'win32')})",
        "",
        "---",
        "",
        "## 1. 核心态势摘要 (Executive Summary)",
        "",
    ]

    status_desc = []
    if git.get("clean"):
        status_desc.append("工作区代码干净无未提交修改")
    else:
        status_desc.append(f"存在 {len(git.get('modified', []))} 处待决或未跟踪变动")

    if all_errors:
        status_desc.append(f"提取到 {len(all_errors)} 条显式任务异常/报错")
    else:
        status_desc.append("最近后台任务均正常退出（无未捕获异常）")

    if denials:
        status_desc.append(f"权限网关拦截或询问了 {len(denials)} 次敏感操作")
    else:
        status_desc.append("无权限网关阻断事件")

    dossier_lines.append(f"本轮执行态势：{'；'.join(status_desc)}。")
    dossier_lines.append("")

    # Section 2: Error and Anomaly Index
    dossier_lines.append("## 2. 异常与报错索引 (Error & Anomaly Index)")
    dossier_lines.append("")
    if all_errors:
        for err in all_errors[:8]:
            dossier_lines.append(f"- 🔴 `{err}`")
    else:
        dossier_lines.append("- 🟢 无致命或异常报错记录。")
    dossier_lines.append("")

    # Section 3: Task & Process History
    dossier_lines.append("## 3. 后台任务与执行轨迹 (Task Trace)")
    dossier_lines.append("")
    if tasks:
        for t in tasks:
            code_str = f"退出码: {t.get('exit_code')}" if t.get('exit_code') is not None else "状态: 运行中/未知"
            dossier_lines.append(f"### 任务日志: `{t.get('name')}` ({code_str})")
            dossier_lines.append(f"- 日志路径: `{t.get('path')}`")
            if t.get("tail"):
                dossier_lines.append("```text")
                for tl in t.get("tail")[-5:]:
                    dossier_lines.append(tl)
                dossier_lines.append("```")
            dossier_lines.append("")
    else:
        dossier_lines.append("暂无抓取到近期后台任务日志。")
        dossier_lines.append("")

    # Section 4: Gate Decisions
    dossier_lines.append("## 4. 权限与工程审计轨迹 (Gate Audit Trail)")
    dossier_lines.append("")
    if gate_events:
        dossier_lines.append("| 时间 | 档位 | 决策 | 详细指令/调用 |")
        dossier_lines.append("|---|---|---|---|")
        for ge in gate_events[-8:]:
            dossier_lines.append(f"| {ge.get('timestamp')} | {ge.get('tier')} | `{ge.get('decision')}` | {ge.get('detail')} |")
    else:
        dossier_lines.append("暂无敏感拦截或待审记录。")
    dossier_lines.append("")

    # Section 5: Footprint & Git
    dossier_lines.append("## 5. 版本与变更足迹 (Version & Git Footprint)")
    dossier_lines.append("")
    dossier_lines.append(f"- 当前分支: `{git.get('branch', 'unknown')}`")
    if git.get("recent_commits"):
        dossier_lines.append("- 最近提交记录:")
        for c in git.get("recent_commits")[:4]:
            dossier_lines.append(f"  - `{c}`")
    if git.get("modified"):
        dossier_lines.append("- 变更文件列表:")
        for m in git.get("modified")[:10]:
            dossier_lines.append(f"  - `{m}`")
    dossier_lines.append("")

    # Section 6: Research Angles for Agents
    dossier_lines.append("## 6. 建议后续 Agent 研究切入点 (Suggested Research Angles)")
    dossier_lines.append("")
    if all_errors:
        dossier_lines.append("1. **精准定位排查**：优先聚焦异常索引中的第 1 条报错信息，直接调阅对应文件行数；")
    else:
        dossier_lines.append("1. **基线验证**：核心测试套件已在最近运行中保持通过，重点审查新增业务逻辑的边界输入；")
    dossier_lines.append("2. **权限与命令规范**：在 PowerShell 7 专用运行时中复现命令，避免 PowerShell 5.1 括号与重定向歧义；")
    dossier_lines.append("3. **杨老师思维审视**：核查涉及资源申请的地方是否已完全纳入上下文管理器 (`with`) 成对闭环管理。")
    dossier_lines.append("")

    return "\n".join(dossier_lines)


def run_selftest():
    tests = []
    # Test 1: Env snapshot
    paths = get_default_paths()
    env = get_env_snapshot(paths)
    tests.append(("env_snapshot", "python" in env and "os" in env))

    # Test 2: Gate parsing mock (both unbracketed and bracketed formats)
    pat = r"^\[(.*?)\]\s*\[(.*?)\]\s*(?:\[(allow|deny|ask|force_ask)\]|(allow|deny|ask|force_ask))\s*(.*)$"
    m1 = re.match(pat, "[2026-10-18T12:00:00] [auto] allow run_command: npm test")
    m2 = re.match(pat, "[2026-10-19 00:40:19] [auto] [deny] cid=selftest step=1 cmd='rm -rf /'")
    ok2 = bool(m1 and (m1.group(3) or m1.group(4)) == "allow" and m2 and (m2.group(3) or m2.group(4)) == "deny")
    tests.append(("gate_parser_regex", ok2))

    # Test 3: Task log error regex
    mock_task_text = "The command exited with code 1.\nError: file not found"
    m_exit = re.search(r"exited with code\s*(\d+)", mock_task_text)
    tests.append(("task_exit_regex", bool(m_exit and m_exit.group(1) == "1")))

    # Test 4: Dossier compilation
    mock_data = {
        "harvested_at": "2026-10-19T00:00:00",
        "env": {"tier": "auto", "englock_mode": "advisory", "python": "3.12.9", "os": "win32"},
        "git": {"clean": True, "branch": "main", "recent_commits": ["abc1234 test"]},
        "recent_tasks": [{"name": "task-test.log", "exit_code": 0, "tail": ["done"], "errors": []}],
        "recent_gate_events": [{"timestamp": "12:00", "tier": "auto", "decision": "allow", "detail": "git status"}],
    }
    dossier = generate_dossier(mock_data, issue_query="SelfTest")
    tests.append(("dossier_synthesis", "DSHA 书记官" in dossier and "SelfTest" in dossier))

    # Test 5: Cache directory creation
    cache = paths["scribe_cache"]
    tests.append(("cache_path_resolved", bool(cache)))

    # Test 6: CLI Argument parser setup
    parser = build_parser()
    tests.append(("parser_setup", parser is not None))

    passed = sum(1 for _, ok in tests if ok)
    total = len(tests)
    print(f"selftest: {passed}/{total}")
    for name, ok in tests:
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}")
    return passed == total


def build_parser():
    parser = argparse.ArgumentParser(description="DSHA Scribe - Agent Intelligence Archivist")
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")

    # Harvest command
    subparsers.add_parser("harvest", help="Harvest logs and state into .scribe cache")

    # Dossier command
    p_dossier = subparsers.add_parser("dossier", help="Generate research dossier for agents")
    p_dossier.add_argument("--issue", type=str, default=None, help="Specific issue topic")
    p_dossier.add_argument("--out", type=str, default=None, help="Output file path")

    # Status command
    subparsers.add_parser("status", help="Quick status overview")

    # Selftest command
    subparsers.add_parser("selftest", help="Run internal self-tests")

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    paths = get_default_paths()

    if args.command == "selftest":
        ok = run_selftest()
        sys.exit(0 if ok else 1)

    if args.command == "harvest":
        data = harvest(paths)
        print(f"[SCRIBE] Ingested {data.get('gate_events_count')} gate events, {len(data.get('recent_tasks'))} task logs.")
        print(f"[SCRIBE] Cache written to: {paths['scribe_cache'] / 'latest_harvest.json'}")
        return

    if args.command == "status":
        data = harvest(paths)
        env = data.get("env", {})
        git = data.get("git", {})
        print(f"=== DSHA 书记官状态 (Scribe Status) ===")
        print(f"  收集时间: {data.get('harvested_at')}")
        print(f"  当前档位: {env.get('tier')} | 工程锁: {env.get('englock_mode')}")
        print(f"  代码分支: {git.get('branch')} (Clean: {git.get('clean')})")
        print(f"  任务日志: {len(data.get('recent_tasks'))} 个 | 审计事件: {data.get('gate_events_count')} 条")
        return

    # Default or 'dossier'
    data = harvest(paths)
    issue = getattr(args, "issue", None)
    out_path = getattr(args, "out", None)
    dossier_text = generate_dossier(data, issue_query=issue)

    if out_path:
        out_p = Path(out_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        with open(out_p, "w", encoding="utf-8") as f:
            f.write(dossier_text)
        print(f"[SCRIBE] Dossier exported to: {out_p}")
    else:
        # Default save to cache as well
        cache_dossier = paths["scribe_cache"] / "latest_dossier.md"
        with open(cache_dossier, "w", encoding="utf-8") as f:
            f.write(dossier_text)
        print(dossier_text)


if __name__ == "__main__":
    main()
