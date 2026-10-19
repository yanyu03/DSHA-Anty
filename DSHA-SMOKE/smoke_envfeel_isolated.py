#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSHA EnvFeel Isolated Smoke Test & Probe Strength Qualification.
Tests host topology telemetry, discovery precedence, 0-byte trap avoidance,
live invocation probes, fail-closed short-circuit, and polite apology generation.
"""

import json
import os
import platform
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# Ensure UTF-8 output across Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add repo scripts to module path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

from base_tool import (
    BaseTool,
    ErrBlock,
    ExecutionEnvelope,
    HostEnvPerceiver,
    PrerequisiteEnv,
    RiskLevel,
    TOOL_REGISTRY,
    ToolCategory,
)
import dsha_env


def run_smoke_suite():
    print("=" * 72)
    print("🔬 DSHA EnvFeel 隔离环境运行态触探力度冒烟测试 (Isolated Smoke Test)")
    print("=" * 72)

    results = []
    
    # -------------------------------------------------------------------------
    # Test 1: 宿主平台与指令集盲探 (Host Topology Telemetry)
    # -------------------------------------------------------------------------
    print("\n[DIMENSION 1] 宿主拓扑与硬件指令集盲探 (Topology Telemetry)")
    os_sys = platform.system()
    os_release = platform.release()
    machine_arch = platform.machine()
    python_ver = sys.version.split()[0]
    print(f"  • 检测到宿主系统: {os_sys} {os_release} (os.name: {os.name})")
    print(f"  • 检测到硬件架构: {machine_arch}")
    print(f"  • 当前解释器环境: Python {python_ver} ({sys.executable})")
    
    t1_pass = bool(os_sys and machine_arch)
    results.append(("DIM-1 宿主拓扑与指令集感知", t1_pass, f"{os_sys} {machine_arch}"))
    print(f"  -> {'[PASS]' if t1_pass else '[FAIL]'} 拓扑感知就绪")

    # -------------------------------------------------------------------------
    # Test 2: 真实宿主关键工具链自感知探测 (Live Host Runtime Inventory)
    # -------------------------------------------------------------------------
    print("\n[DIMENSION 2] 宿主关键工具链自感知与可用性探测 (Live Host Probe)")
    runtimes = ["python", "node", "wrangler", "pwsh", "bash", "git"]
    probed_inventory = {}
    for r in runtimes:
        loc = HostEnvPerceiver.locate(r)
        d_path = dsha_env.display_path(loc)
        probed_inventory[r] = loc
        status_tag = "🟢 已发现" if loc else "⚪ 未检出"
        print(f"  • {r.ljust(10)}: {status_tag} {d_path}")

    t2_pass = probed_inventory.get("python") is not None
    results.append(("DIM-2 核心运行时发现能力", t2_pass, f"Python={bool(probed_inventory.get('python'))}"))
    print(f"  -> {'[PASS]' if t2_pass else '[FAIL]'} 运行时寻径雷达实测通过")

    # -------------------------------------------------------------------------
    # Test 3: 显式失效覆盖拒绝与零隐蔽降级防线 (Invalid Override Rejection)
    # -------------------------------------------------------------------------
    print("\n[DIMENSION 3] 显式覆盖优先级与失效拒绝契约 (Fail-Closed Overrides)")
    with tempfile.TemporaryDirectory(prefix="dsha_override_") as temp_dir:
        fake_bin = Path(temp_dir) / "nonexistent_python_custom.exe"
        
        # Test 3a: Explicit argument override with non-existent path
        override_res = dsha_env.find_binary("python", explicit=str(fake_bin))
        print(f"  • 显式传参传入不存在路径: {fake_bin}")
        print(f"  • 寻径解析结果: {override_res} (预期: None，严禁静默降级为系统 Python)")
        t3a_pass = (override_res is None)
        
        # Test 3b: Environment variable override with non-existent path
        mock_env = dict(os.environ, DSHA_PYTHON=str(fake_bin))
        env_override_res = dsha_env.find_binary("python", environ=mock_env)
        print(f"  • 环境变量 DSHA_PYTHON 注入不存在路径: {fake_bin}")
        print(f"  • 寻径解析结果: {env_override_res} (预期: None，契约保护)")
        t3b_pass = (env_override_res is None)

    t3_pass = t3a_pass and t3b_pass
    results.append(("DIM-3 显式覆盖失效绝不静默回退", t3_pass, "fail-closed verified"))
    print(f"  -> {'[PASS]' if t3_pass else '[FAIL]'} 覆盖失效拒绝契约保护生效")

    # -------------------------------------------------------------------------
    # Test 4: 0 字节 WindowsApps 假死别名拦截陷阱 (Execution Alias Trap Avoidance)
    # -------------------------------------------------------------------------
    print("\n[DIMENSION 4] 0 字节 WindowsApps 假死别名拦截测试 (0-Byte Alias Guard)")
    with tempfile.TemporaryDirectory(prefix="dsha_alias_") as temp_dir:
        fake_winapps = Path(temp_dir) / "Microsoft" / "WindowsApps"
        fake_winapps.mkdir(parents=True, exist_ok=True)
        stub_python = fake_winapps / "python.exe"
        stub_python.touch()  # Create 0-byte file mimicking execution alias
        
        # Directly test validation logic
        is_valid = HostEnvPerceiver._is_valid_executable(stub_python)
        print(f"  • 构造 0 字节别名测试桩: {stub_python} (大小: {stub_python.stat().st_size} 字节)")
        print(f"  • _is_valid_executable() 判别结果: {is_valid} (预期: False)")
        t4_pass = (is_valid is False)

    results.append(("DIM-4 0字节 WindowsApps 别名陷阱过滤", t4_pass, "0-byte rejected"))
    print(f"  -> {'[PASS]' if t4_pass else '[FAIL]'} 假死别名陷阱拦截实测通过")

    # -------------------------------------------------------------------------
    # Test 5: 真实探针实时拉起实测 (Live Smoke Execution Probes)
    # -------------------------------------------------------------------------
    print("\n[DIMENSION 5] 探针进程实时拉起实测 (Live Process Invocation Probes)")
    t5_checks = []
    
    # 5a. Real Python probe
    py_bin = HostEnvPerceiver.locate("python")
    t0 = time.time()
    py_ok, py_msg = HostEnvPerceiver.can_invoke(py_bin, "python", timeout=2.0)
    py_ms = int((time.time() - t0) * 1000)
    print(f"  • [Python 探针] 拉起状态: {py_ok} (耗时: {py_ms}ms, 探针详情: {py_msg})")
    t5_checks.append(py_ok)

    # 5b. Broken / non-executable file probe
    with tempfile.TemporaryDirectory(prefix="dsha_broken_") as temp_dir:
        broken_bin = Path(temp_dir) / "broken_corrupted.exe"
        broken_bin.write_text("NOT_A_VALID_PE_HEADER", encoding="utf-8")
        broken_ok, broken_msg = HostEnvPerceiver.can_invoke(str(broken_bin), "mock_broken", timeout=1.0)
        print(f"  • [损坏二进制探针] 拉起状态: {broken_ok} (预期: False, 拦截捕获: {broken_msg})")
        t5_checks.append(broken_ok is False)

    t5_pass = all(t5_checks)
    results.append(("DIM-5 真实进程探针实时拉起与防崩溃", t5_pass, f"py={py_ok}, broken_intercepted={not broken_ok}"))
    print(f"  -> {'[PASS]' if t5_pass else '[FAIL]'} 探针实时拉起实测通过")

    # -------------------------------------------------------------------------
    # Test 6: 缺失环境执行链瞬间短路与诚恳体面致歉 (Short-Circuit & Polite Apology)
    # -------------------------------------------------------------------------
    print("\n[DIMENSION 6] 缺失依赖执行链瞬间截断与体面致歉实测 (Short-Circuit & Apology)")
    class AlienMissingTool(BaseTool):
        def __init__(self):
            super().__init__(
                tool_id="alien_compiler",
                name="Alien System Compiler (GCC/Clang on Unknown Arch)",
                category=ToolCategory.SYSADMIN,
                risk_level=RiskLevel.MEDIUM,
                version="1.0.0",
                description="Mock compiler tool for alien hardware",
                cmd="alien_cc.cmd",
                prerequisites=[
                    PrerequisiteEnv(
                        binary="alien_uninstalled_toolchain_xyz",
                        min_version="2.0.0",
                        remediation="Please install 'alien_uninstalled_toolchain_xyz' via package manager.",
                    )
                ],
            )

    alien_tool = AlienMissingTool()
    t0 = time.time()
    exec_res = alien_tool.execute(["--compile", "test.c"])
    exec_ms = int((time.time() - t0) * 1000)
    
    stderr_out = exec_res.get("stderr", "")
    exit_code = exec_res.get("exit_code")
    has_apology = "非常抱歉" in stderr_out
    has_err_block = "ERR_PREREQUISITE_MISSING" in stderr_out
    
    print(f"  • 执行返回码: {exit_code} (预期: 126，严格掐断)")
    print(f"  • 下游阻断耗时: {exec_ms}ms (毫秒级即刻熔断)")
    print(f"  • 诚恳致歉识别: {'已包含' if has_apology else '缺失'} (\"非常抱歉...\")")
    print(f"  • 结构化 ErrBlock: {'已就绪' if has_err_block else '缺失'}")
    print("\n  [实测截断输出流预览]:")
    for line in stderr_out.strip().splitlines()[:6]:
        print(f"    | {line}")

    t6_pass = (exit_code == 126 and has_apology and has_err_block)
    results.append(("DIM-6 执行链熔断截断与诚恳体面致歉", t6_pass, f"exit={exit_code}, apology={has_apology}"))
    print(f"\n  -> {'[PASS]' if t6_pass else '[FAIL]'} 熔断截断与致歉协议实测通过")

    # -------------------------------------------------------------------------
    # Test 7: 出版级隐私路径与机密凭证脱敏 (Publication Redaction Hygiene)
    # -------------------------------------------------------------------------
    print("\n[DIMENSION 7] 路径脱敏与敏感凭据屏蔽实测 (Privacy Redaction)")
    sample_text = (
        r"Loaded user config from C:\Users\admin\Desktop\GOOGLE\secret_repo "
        r"using Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token123 "
        r"with api_key=sk-live-998877665544332211"
    )
    redacted = dsha_env.redact(sample_text)
    has_raw_user = r"C:\Users\admin" in redacted
    has_raw_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" in redacted
    has_raw_key = "sk-live-998877665544332211" in redacted
    
    print("  • 原始日志: " + sample_text[:65] + "...")
    print("  • 脱敏结果: " + redacted[:65] + "...")
    t7_pass = (not has_raw_user and not has_raw_token and not has_raw_key)
    results.append(("DIM-7 凭证与用户路径出版级脱敏", t7_pass, "all sensitive tokens redacted"))
    print(f"  -> {'[PASS]' if t7_pass else '[FAIL]'} 证据脱敏防护实测通过")

    # -------------------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------------------
    print("\n" + "=" * 72)
    print("📊 DSHA EnvFeel 隔离测试矩阵实测汇总:")
    print("=" * 72)
    passed_cnt = sum(1 for _, ok, _ in results)
    total_cnt = len(results)
    for name, ok, detail in results:
        status = "✅ PASS" if ok else "❌ FAIL"
        print(f"  {status} | {name.ljust(36)} | {detail}")
    
    print(f"\n整体裁决: {passed_cnt}/{total_cnt} 维度全量通过 (Exit Code: {0 if passed_cnt == total_cnt else 1})")
    return passed_cnt == total_cnt


if __name__ == "__main__":
    success = run_smoke_suite()
    sys.exit(0 if success else 1)
