#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSHA-REA Driver (杨老师风味系统级逆向工具驱动器)
贯彻 TeacherYang 五大支柱：
 1. 系统底层穿透律：自动探测 Node.js、规范化跨平台路径、解决 Windows 编码与引号转义。
 2. 防御性契约与生命周期：入参前置校验、目标存在性检查、缺少 Native 引擎时安全降级不崩溃。
 3. 并发安全与超时纪律：带超时保护的隔离子进程，杜绝反编译死循环锁死终端。
 4. 高内聚与无侵入切面：与 DSHA-Gate / EngLock 无缝契合，保持原始工具输出纯粹。
 5. 精炼范式与量化实证：内置自检 (--self-test) 与结构化量化报告。
"""

import sys
import os
import subprocess
import shutil
import json

# 强制标准输出为 UTF-8，杜绝 Windows 控制台 GBK 崩溃
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REA_MJS = os.environ.get('DSHA_REA_ENTRY') or os.path.join(SCRIPT_DIR, "scripts", "rea.mjs")
PACKAGE_JSON = os.path.join(SCRIPT_DIR, "package.json")

def find_node():
    """底层穿透：多候选自适应探测 Node.js 解释器"""
    if 'DSHA_NODE' in os.environ:
        candidate = os.environ['DSHA_NODE']
        return candidate if os.path.isfile(candidate) else None
    program_files = os.environ.get('ProgramFiles', '')
    candidates = [
        shutil.which("node"),
        os.path.join(program_files, 'nodejs', 'node.exe') if program_files else None,
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "nodejs", "node.exe"),
        os.path.join(os.environ.get('ProgramFiles(x86)', ''), 'nodejs', 'node.exe') if os.environ.get('ProgramFiles(x86)') else None
    ]
    for c in candidates:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return None

def preflight_check(args):
    """防御性契约：参数语义前置检查与避坑警示"""
    if not os.path.isfile(REA_MJS):
        print("[FAIL] 找不到 REA 运行时入口；检查 DSHA_REA_ENTRY。", file=sys.stderr)
        print("请确认 skills/reverse-engineer-anything/tools/rea 完整性。", file=sys.stderr)
        return False

    # 若传入了待分析文件路径，前置验证存在性
    if len(args) > 1 and not args[1].startswith("-"):
        target_path = args[1]
        # 跳过子命令名（如 doctor, mcp, setup）
        subcommands = {"doctor", "setup", "mcp", "providers", "completions", "uninstall", "update"}
        if target_path not in subcommands and not os.path.exists(target_path):
            print("[FAIL] 目标路径不存在；检查传入参数。", file=sys.stderr)
            print("请检查绝对路径或拼写，避免空指针与无效分析调用。", file=sys.stderr)
            return False

    return True

def run_self_test(node_bin):
    """Only a bounded version probe; provider readiness needs separate evidence."""
    print("=== DSHA-REA runtime probe ===")
    try:
        res = subprocess.run([node_bin, REA_MJS, "--version"], capture_output=True,
                             text=True, encoding="utf-8", errors="replace", timeout=10)
    except (OSError, subprocess.TimeoutExpired) as error:
        print(f"[FAIL] REA version probe: {type(error).__name__}")
        return 1
    passed = res.returncode == 0 and bool(res.stdout.strip())
    # Even version output may contain arbitrary diagnostics; do not publish it.
    print(f"[{'PASS' if passed else 'FAIL'}] REA version probe; exit={res.returncode}")
    for key in ('GHIDRA_INSTALL_DIR', 'HOPPER_LAUNCHER_PATH'):
        print(f"{key}: {'configured' if os.environ.get(key) else 'unset'}; provider NOT_RUN")
    print("Static analysis and native target analysis: NOT_RUN")
    return 0 if passed else 1

def main():
    args = sys.argv[1:]

    # 处理自检
    if "--self-test" in args or "-t" in args:
        node_bin = find_node()
        if not node_bin:
            print("[FAIL] 未找到 Node.js 解释器，请安装 Node 20+ 后重试。", file=sys.stderr)
            sys.exit(1)
        sys.exit(run_self_test(node_bin))

    node_bin = find_node()
    if not node_bin:
        print("[杨老师系统底层穿透] ❌ 找不到可用的 Node.js 解释器。", file=sys.stderr)
        print("建议安装 Node.js LTS (https://nodejs.org) 并加入系统 PATH。", file=sys.stderr)
        sys.exit(1)

    if not preflight_check(args):
        sys.exit(2)

    # 构造执行命令
    full_cmd = [node_bin, REA_MJS] + args

    # 并发与超时纪律：默认 180 秒防护，防止极端反编译任务卡死
    try:
        timeout_sec = int(os.environ.get("DSHA_REA_TIMEOUT", "180"))
        if timeout_sec <= 0:
            raise ValueError('invalid timeout')
        proc = subprocess.run(
            full_cmd,
            timeout=timeout_sec,
            env=os.environ.copy()
        )
        sys.exit(proc.returncode)
    except subprocess.TimeoutExpired:
        print(f"\n[杨老师超时断开] 任务执行超过 {timeout_sec} 秒，已安全截断以防终端假死。", file=sys.stderr)
        sys.exit(124)
    except KeyboardInterrupt:
        print("\n[用户中断] 任务已平稳退出。", file=sys.stderr)
        sys.exit(130)
    except (OSError, ValueError) as error:
        print(f"\n[FAIL] REA invocation: {type(error).__name__}; check runtime and DSHA_REA_TIMEOUT.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
