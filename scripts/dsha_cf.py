#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSHA Cloudflare CLI Conduit (DHSA-TestWeb).

Role & Mission:
  Direct bridge to Cloudflare developer ecosystem (Wrangler, Pages, Workers, Tunnel).
  Wraps local wrangler CLI, normalizes paths and encodings, handles proxies,
  and provides standardized web/edge commands for DSHA agents.

CLI Commands:
  cf.cmd status
  cf.cmd whoami
  cf.cmd dev [args]
  cf.cmd deploy [args]
  cf.cmd pages [args]
  cf.cmd tunnel [args]
  cf.cmd selftest
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from dsha_env import find_binary, proxy_environment, display_path

# Ensure UTF-8 output across Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def find_tool(name, explicit=None):
    return find_binary(name, explicit=explicit)


def get_cf_environment():
    cf_path = find_tool("cf")
    wrangler_path = find_tool("wrangler")
    node_path = find_tool("node")
    cloudflared_path = find_tool("cloudflared")

    env_info = {
        "cf_path": cf_path,
        "cf_version": None,
        "wrangler_path": wrangler_path,
        "wrangler_version": None,
        "node_path": node_path,
        "node_version": None,
        "cloudflared_path": cloudflared_path,
        "cloudflared_version": None,
        "workerd_installed": False,
        "authenticated": False,
        "auth_detail": None,
    }

    if cf_path:
        try:
            r = subprocess.run(
                [cf_path, "--version"],
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=5,
            )
            if r.returncode == 0:
                env_info["cf_version"] = r.stdout.strip()
        except Exception:
            pass

    if node_path:
        try:
            r = subprocess.run(
                [node_path, "--version"],
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=5,
            )
            if r.returncode == 0:
                env_info["node_version"] = r.stdout.strip()
        except Exception:
            pass

    if wrangler_path:
        try:
            r = subprocess.run(
                [wrangler_path, "--version"],
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=10,
            )
            if r.returncode == 0:
                env_info["wrangler_version"] = r.stdout.strip()
        except Exception:
            pass

    if cloudflared_path:
        try:
            r = subprocess.run(
                [cloudflared_path, "--version"],
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=5,
            )
            if r.returncode == 0:
                env_info["cloudflared_version"] = r.stdout.strip()
        except Exception:
            pass

    user_home = Path(os.environ.get("USERPROFILE") or ".")
    workerd_dir = Path(os.environ.get("DSHA_WORKERD_DIR") or Path(os.environ.get("APPDATA") or user_home / "AppData/Roaming") / "npm/node_modules/@cloudflare/workerd-windows-64")
    env_info["workerd_installed"] = workerd_dir.is_dir()

    return env_info


def run_wrangler_cmd(args_list):
    wrangler = find_tool("wrangler")
    if not wrangler:
        print("[DSHA-CF] Error: wrangler CLI not found in PATH or AppData/npm.", file=sys.stderr)
        print("[DSHA-CF] Run: npm install -g wrangler to install.", file=sys.stderr)
        return 1

    cmd = [wrangler] + args_list
    try:
        proc = subprocess.run(cmd, env=proxy_environment())
        return proc.returncode
    except Exception as e:
        print(f"[DSHA-CF] Execution failed: {e}", file=sys.stderr)
        return 1


def run_status(check_auth=False):
    env = get_cf_environment()
    print("=== DSHA Cloudflare 工具链状态 (Cloudflare Conduit) ===")
    print(f"  分支特性: DHSA-TestWeb 直通引擎")
    print(f"  Node.js:  {env['node_version'] or '未检测到'} ({display_path(env['node_path'])})")
    print(f"  CF Forge: {env['cf_version'] or '未检测到'} ({display_path(env['cf_path'])})")
    print(f"  Wrangler: {env['wrangler_version'] or '未检测到'} ({display_path(env['wrangler_path'])})")
    workerd_tag = "就绪 (@cloudflare/workerd-windows-64)" if env['workerd_installed'] else "未安装"
    print(f"  Workerd:  {workerd_tag}")
    print(f"  Tunnel:   {env['cloudflared_version'] or '支持 (通过 cf tunnels 或 cloudflared)'}")

    if env["wrangler_path"] and check_auth:
        print("\n  测试 Wrangler 鉴权状态 (wrangler whoami)...")
        custom_env = proxy_environment()
        try:
            r = subprocess.run(
                [env["wrangler_path"], "whoami"],
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=12,
                env=custom_env,
            )
            print("    Auth probe: " + ("completed" if r.returncode == 0 else "failed"))
            if "You are not authenticated" in r.stdout:
                print("    [提示] 未登录 Cloudflare 账号。可执行 'cf login' 授权，或使用 'cf deploy --temporary' 测试预览。")
        except subprocess.TimeoutExpired:
            print("    [提示] 鉴权网络检测超时（可在配置代理或登录后正常使用，或使用 'cf dev' 本地运行）。")
        except Exception as e:
            print(f"    检查失败: {e}")
    else:
        print("  [WARN] 未检测到 Wrangler，请先安装 Node.js 与 Wrangler。")


def run_selftest():
    tests = []
    # Test 1: Node tool discovery
    node = find_tool("node")
    tests.append(("node_tool_detected", node is not None))

    # Test 2: Wrangler tool discovery
    wrangler = find_tool("wrangler")
    tests.append(("wrangler_tool_detected", wrangler is not None))

    # Test 3: Environment dictionary structure
    env = get_cf_environment()
    tests.append(("env_structure_valid", "wrangler_path" in env and "node_version" in env))

    # Test 4: Argument parsing
    parser = build_parser()
    tests.append(("parser_setup", parser is not None))

    # Test 5: Command mapping validity
    subcmds = ["status", "whoami", "dev", "deploy", "pages", "tunnel", "selftest"]
    valid_sub = all(s in parser._subparsers._group_actions[0].choices for s in subcmds)
    tests.append(("subcommand_mapping", valid_sub))

    passed = sum(1 for _, ok in tests if ok)
    total = len(tests)
    print(f"selftest: {passed}/{total}")
    for name, ok in tests:
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}")
    return passed == total


def build_parser():
    parser = argparse.ArgumentParser(description="DSHA Cloudflare CLI Conduit")
    subparsers = parser.add_subparsers(dest="command", help="Cloudflare subcommands")

    subparsers.add_parser("status", help="Check Cloudflare toolchain & auth status")
    subparsers.add_parser("whoami", help="Display current Cloudflare identity")
    subparsers.add_parser("selftest", help="Run internal self-tests")

    p_dev = subparsers.add_parser("dev", help="Start local worker dev server")
    p_dev.add_argument("dev_args", nargs=argparse.REMAINDER, help="Arguments passed to wrangler dev")

    p_deploy = subparsers.add_parser("deploy", help="Deploy worker or application")
    p_deploy.add_argument("deploy_args", nargs=argparse.REMAINDER, help="Arguments passed to wrangler deploy")

    p_pages = subparsers.add_parser("pages", help="Cloudflare Pages management")
    p_pages.add_argument("pages_args", nargs=argparse.REMAINDER, help="Arguments passed to wrangler pages")

    p_tunnel = subparsers.add_parser("tunnel", help="Cloudflare Tunnel operations")
    p_tunnel.add_argument("tunnel_args", nargs=argparse.REMAINDER, help="Arguments passed to tunnel")

    return parser


def main():
    if len(sys.argv) > 1 and sys.argv[1] in ("--help", "-h"):
        parser = build_parser()
        parser.print_help()
        return 0

    if len(sys.argv) > 1 and sys.argv[1] == "selftest":
        ok = run_selftest()
        sys.exit(0 if ok else 1)

    if len(sys.argv) > 1 and sys.argv[1] == "status":
        run_status(check_auth="--check-auth" in sys.argv)
        return 0

    if len(sys.argv) > 1 and sys.argv[1] == "whoami":
        return run_wrangler_cmd(["whoami"])

    if len(sys.argv) > 1 and sys.argv[1] == "search":
        cf_bin = find_tool("cf")
        if not cf_bin:
            print("[DSHA-CF] Error: Cloudflare Forge CLI ('cf' / 'cloudflare') not found.", file=sys.stderr)
            return 1
        cmd = [cf_bin, "cli", "search"] + sys.argv[2:]
        return subprocess.run(cmd).returncode

    if len(sys.argv) > 1 and sys.argv[1] == "mcp":
        cf_bin = find_tool("cf")
        if not cf_bin:
            print("[DSHA-CF] Error: Cloudflare Forge CLI ('cf' / 'cloudflare') not found.", file=sys.stderr)
            return 1
        cmd = [cf_bin, "mcp"] + sys.argv[2:]
        return subprocess.run(cmd).returncode

    if len(sys.argv) > 1 and sys.argv[1] == "api":
        cf_bin = find_tool("cf")
        if not cf_bin:
            print("[DSHA-CF] Error: Cloudflare Forge CLI ('cf' / 'cloudflare') not found.", file=sys.stderr)
            return 1
        cmd = [cf_bin] + sys.argv[2:]
        return subprocess.run(cmd).returncode

    if len(sys.argv) > 1 and sys.argv[1] == "wrangler":
        return run_wrangler_cmd(sys.argv[2:])

    # Unified CF API operations
    unified_cmds = ("zones", "dns", "radar", "zero-trust", "migrate", "workflows", "vectorize", "queues", "pipelines")
    if len(sys.argv) > 1 and sys.argv[1] in unified_cmds:
        cf_bin = find_tool("cf")
        if cf_bin:
            cmd = [cf_bin] + sys.argv[1:]
            return subprocess.run(cmd).returncode
        return run_wrangler_cmd(sys.argv[1:])

    if len(sys.argv) > 1 and sys.argv[1] in ("dev", "deploy", "pages", "types", "tail", "kv", "d1", "r2", "ai"):
        # Direct pass-through to wrangler
        return run_wrangler_cmd(sys.argv[1:])

    if len(sys.argv) > 1 and sys.argv[1] == "tunnel":
        cloudflared = find_tool("cloudflared")
        if cloudflared:
            cmd = [cloudflared] + sys.argv[2:]
            return subprocess.run(cmd).returncode
        else:
            cf_bin = find_tool("cf")
            if cf_bin:
                cmd = [cf_bin, "tunnels"] + sys.argv[2:]
                return subprocess.run(cmd).returncode
            print("[DSHA-CF] cloudflared.exe not found in standard paths.")
            print("[DSHA-CF] To run tunnels: winget install --id Cloudflare.cloudflared or download cloudflared.exe", file=sys.stderr)
            return 1

    # Default fallback: pass all args directly to wrangler
    if len(sys.argv) > 1:
        return run_wrangler_cmd(sys.argv[1:])

    # If no args, run status
    run_status()
    return 0


if __name__ == "__main__":
    sys.exit(main())
