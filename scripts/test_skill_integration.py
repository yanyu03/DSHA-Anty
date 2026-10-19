#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSHA Open-Source Skill Integration & Graft-Reaction Test Suite (排异反应测试套件).

Evaluates whether importing external open-source skills triggers architectural,
permission, linguistic, or runtime rejection across 5 core dimensions:
  1. Dimension 1: DSH Permission Tier Gate (gate.py)
  2. Dimension 2: Engineering Lock L1-L9 Compliance (englock.py)
  3. Dimension 3: BaseTool & Prerequisite Assertion (base_tool.py)
  4. Dimension 4: Safe Shell & Pipeline Insulation (dsha-pwsh & dsha-sh)
  5. Dimension 5: DSHA-Index Cataloging & Router Resolution (index.py & router.py)
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
USER_HOME = Path(os.environ.get("USERPROFILE") or ".")

# Add scripts directory to sys.path
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from base_tool import (
    BaseTool,
    ErrBlock,
    PrerequisiteEnv,
    RiskLevel,
    TOOL_REGISTRY,
    ToolCategory,
    Call_Tools,
)


# =========================================================================
# Prototype Open-Source Skills for Integration Testing
# =========================================================================

class SecurityAuditTool(BaseTool):
    """Prototype of popular open-source Security Audit & Vulnerability Scanner Skill."""
    def __init__(self):
        super().__init__(
            tool_id="sec-audit",
            name="Open-Source Security Audit & Vulnerability Scanner",
            category=ToolCategory.POLICY_RADAR,
            risk_level=RiskLevel.LOW,
            version="1.2.0",
            description="Static vulnerability scanning, secret discovery, CVE matching, dependency auditing",
            cmd="sec-audit.cmd",
            script="sec_audit.py",
            prerequisites=[
                PrerequisiteEnv(
                    binary="python",
                    min_version="3.10.0",
                    remediation="Install Python >= 3.10 via https://python.org",
                )
            ],
            keywords=["security", "audit", "vulnerability", "cve", "secret", "owasp", "安全审查", "漏洞", "密钥扫描", "代码审计"],
            extensions=[".py", ".js", ".ts", ".json", ".env"],
            exact_filenames=["requirements.txt", "package.json", "audit.json"],
            weight=1.2,
        )


class DockerCompanionTool(BaseTool):
    """Prototype of popular open-source Container & Docker Management Skill (external runtime test)."""
    def __init__(self):
        super().__init__(
            tool_id="docker-companion",
            name="Open-Source Docker & Container Companion",
            category=ToolCategory.SYSADMIN,
            risk_level=RiskLevel.MEDIUM,
            version="2.1.0",
            description="Container inspection, image analysis, compose orchestration",
            cmd="docker-comp.cmd",
            script="docker_comp.py",
            prerequisites=[
                PrerequisiteEnv(
                    binary="docker",
                    min_version="20.0.0",
                    remediation="Install Docker Desktop via 'winget install Docker.DockerDesktop' or https://docker.com",
                )
            ],
            keywords=["docker", "container", "image", "compose", "容器", "镜像", "编排"],
            extensions=[".dockerfile", ".yaml", ".yml"],
            exact_filenames=["Dockerfile", "docker-compose.yml"],
            weight=1.0,
        )


class SqliteAnalyzerTool(BaseTool):
    """Prototype of popular open-source SQLite Schema & Query Inspection Skill."""
    def __init__(self):
        super().__init__(
            tool_id="sqlite-analyzer",
            name="Open-Source SQLite Schema & Query Inspector",
            category=ToolCategory.SYSADMIN,
            risk_level=RiskLevel.LOW,
            version="1.0.0",
            description="SQLite database schema inspection, table profiling, integrity check",
            cmd="sqlite-ana.cmd",
            script="sqlite_ana.py",
            prerequisites=[
                PrerequisiteEnv(
                    binary="python",
                    min_version="3.10.0",
                    remediation="Install Python >= 3.10 via https://python.org",
                )
            ],
            keywords=["sqlite", "db", "query", "schema", "table", "数据库", "表结构", "查询"],
            extensions=[".db", ".sqlite", ".sqlite3"],
            weight=1.0,
        )


# =========================================================================
# Integration Test Execution Suite
# =========================================================================

def run_integration_tests():
    py_exe = sys.executable
    cfg_dir = USER_HOME / ".gemini" / "config"
    gate_py = cfg_dir / "plugins" / "dsh-permissions" / "scripts" / "gate.py"
    if not gate_py.is_file():
        gate_py = REPO_ROOT / "plugins" / "dsh-permissions" / "scripts" / "gate.py"

    englock_py = cfg_dir / "plugins" / "dsh-permissions" / "scripts" / "englock.py"
    if not englock_py.is_file():
        englock_py = REPO_ROOT / "plugins" / "dsh-permissions" / "scripts" / "englock.py"

    tier_path = cfg_dir / "plugins" / "dsh-permissions" / "tier.json"
    if not tier_path.is_file():
        tier_path = REPO_ROOT / "plugins" / "dsh-permissions" / "tier.json"

    print("=" * 70)
    print("🔬 DSHA 开源知名 Skill 整合测试与排异反应评估 (Skill Graft-Reaction Test)")
    print("=" * 70)

    results = []

    # ---------------------------------------------------------------------
    # Dimension 1: DSH 权限门禁排异测试 (Gate & PreToolUse Hook)
    # ---------------------------------------------------------------------
    print("\n--- 维度 1: DSH 权限门禁排异测试 (Permission Gate Reaction) ---")
    
    def test_gate(tier, cmd_str):
        orig_content = tier_path.read_text(encoding="utf-8") if tier_path.is_file() else None
        try:
            tier_path.write_text(
                json.dumps({"tier": tier, "auto_reviewer": "local", "audit_logging": False, "log_allow": False}),
                encoding="utf-8"
            )
            payload = {
                "toolCall": {"name": "run_command", "args": {"CommandLine": cmd_str}},
                "conversationId": "test",
                "stepIdx": 1,
            }
            r = subprocess.run(
                [py_exe, str(gate_py)],
                input=json.dumps(payload),
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=5,
            )
            try:
                return json.loads(r.stdout.strip())
            except Exception:
                return {"decision": "error", "raw": r.stdout}
        finally:
            if orig_content is not None:
                tier_path.write_text(orig_content, encoding="utf-8")

    # 1.1 开源技能纯只读观察指令 (如 git status / type 等) 在 read-only 档位正常放行
    d1_1 = test_gate("read-only", "git status")
    ok1_1 = (d1_1.get("decision") == "allow")
    results.append(("D1.1: 纯只读观察指令 (如 git status) 在 read-only 档位正常放行 (无虚假拦截)", ok1_1, d1_1.get("reason", "")))

    # 1.2 开源技能写出/重定向补丁在只读档位下触发拦截
    d1_2 = test_gate("read-only", "python sec_audit.py --fix > patch.diff")
    ok1_2 = (d1_2.get("decision") in ("force_ask", "deny"))
    results.append(("D1.2: 外部写入/补丁重定向在 read-only 档位受控拦截 (防未经许可修改)", ok1_2, d1_2.get("reason", "")))

    # 1.3 开源技能可能携带的高危全盘销毁操作在 auto 档位被底层拒绝
    d1_3 = test_gate("auto", "rmdir /s /q C:")
    ok1_3 = (d1_3.get("decision") == "deny")
    results.append(("D1.3: 外部包含的高危越界操作 (rmdir C:) 在 auto 档位被底层硬拒绝 (防沙箱逃逸)", ok1_3, d1_3.get("reason", "")))


    # ---------------------------------------------------------------------
    # Dimension 2: 工程质量与语言规范锁排异测试 (EngLock L1-L9)
    # ---------------------------------------------------------------------
    print("\n--- 维度 2: 工程质量锁排异测试 (Engineering & Language Lock Reaction) ---")

    def test_englock(text_content):
        payload = {
            "toolCall": {
                "name": "write_to_file",
                "args": {
                    "TargetFile": "report.md",
                    "CodeContent": text_content,
                    "Description": "test",
                },
            },
            "conversationId": "test",
            "stepIdx": 1,
        }
        r = subprocess.run(
            [py_exe, str(englock_py)],
            input=json.dumps(payload),
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=5,
        )
        try:
            return json.loads(r.stdout.strip())
        except Exception:
            return {"decision": "error", "raw": r.stdout}

    # 2.1 开源技能常见营销绝对化词汇（如 100% 安全、完美检测、epic）被 L6/L9.1 成功识别
    bad_skill_output = "本安全审计完成，已实现 100% 安全无死角，系统达到 flawless 状态，彻底消灭所有漏洞。"
    d2_1 = test_englock(bad_skill_output)
    reason2_1 = d2_1.get("reason", "")
    ok2_1 = ("L9.1" in reason2_1 or "L6" in reason2_1)
    results.append(("D2.1: 外部技能过度吹捧措辞 (100%/flawless) 被 L9.1 敏锐捕获 (防虚假安全感)", ok2_1, reason2_1))

    # 2.2 符合 L1-L9 规范的实证化输出（带样本、出处、客观表达）平稳放行
    disciplined_output = "基于安全扫描脚本（工具: sec_audit v1.2.0），对项目 42 个源代码文件完成单次静态审查，发现 0 个硬编码密钥（样本数 n=42）。"
    d2_2 = test_englock(disciplined_output)
    ok2_2 = (d2_2.get("decision") == "allow")
    results.append(("D2.2: 规范量化输出 (明确出处、工具、样本数 n=42) 平稳放行", ok2_2, d2_2.get("reason", "allow")))

    # 2.3 未经验证的早熟结论词（无证据直接声明 已修复）被 L9.4 捕获
    premature_output = "经安全审计排查，该系统高危漏洞现已修复完毕。"
    d2_3 = test_englock(premature_output)
    reason2_3 = d2_3.get("reason", "")
    ok2_3 = ("L9.4" in reason2_3)
    results.append(("D2.3: 外部技能口头宣称已修复 (无验证标记) 被 L9.4 成功预警", ok2_3, reason2_3))


    # ---------------------------------------------------------------------
    # Dimension 3: 宿主运行环境与 BaseTool 断言排异测试 (No Bundled Runtimes)
    # ---------------------------------------------------------------------
    print("\n--- 维度 3: 宿主环境依赖断言排异测试 (Prerequisite & ErrBlock Reaction) ---")

    # 3.1 Python 纯依赖技能满足宿主环境
    sec_tool = SecurityAuditTool()
    ok_env_sec, err_sec = sec_tool.assert_environment()
    results.append(("D3.1: 纯 Python 外部技能宿主环境断言一次性满足 (环境兼容)", ok_env_sec, "满足要求"))

    # 3.2 依赖未安装外部工具（如 Docker）时，优雅拒绝而非崩溃死循环
    docker_tool = DockerCompanionTool()
    ok_env_doc, err_doc = docker_tool.assert_environment()
    docker_installed = shutil.which("docker") is not None
    if not docker_installed:
        res_exec = docker_tool.execute()
        ok3_2 = (
            not ok_env_doc
            and err_doc is not None
            and err_doc.error_code == "ERR_PREREQUISITE_MISSING"
            and res_exec["exit_code"] == 126
            and "remediations" in res_exec["err_block"]
        )
        results.append(("D3.2: 缺失外部运行时 (Docker) 时优雅发出 ErrBlock 阻断与修复指引 (绝不假死乱窜)", ok3_2, err_doc.refusal_statement if err_doc else ""))
    else:
        results.append(("D3.2: 宿主已预装 Docker，环境断言直接满足", True, "Docker available"))

    # 3.3 越权防护测试：写操作工具在 read-only 档位被前置掐断
    ok_auth_doc, err_auth_doc = docker_tool.assert_authorization(active_tier="read-only")
    ok3_3 = (not ok_auth_doc and err_auth_doc and err_auth_doc.error_code == "ERR_PERMISSION_DENIED")
    results.append(("D3.3: 具修改风险等级外部技能在 read-only 下受 BaseTool 前置断言掐断 (严防越权)", ok3_3, err_auth_doc.refusal_statement if err_auth_doc else ""))


    # ---------------------------------------------------------------------
    # Dimension 4: Windows 终端安全 Shell 隔离排异测试 (Safe Shell)
    # ---------------------------------------------------------------------
    print("\n--- 维度 4: 终端管道与括号撕裂排异测试 (Safe Shell Insulation) ---")

    # 4.1 复杂管道与带括号 PowerShell 指令在 dsha-pwsh 中零撕裂
    def find_cmd(name):
        cands = [
            REPO_ROOT / "bin" / name,
            Path(r"c:\Users\admin\Desktop\GOOGLE\DSHA\bin") / name,
            USER_HOME / ".gemini" / "config" / name,
            REPO_ROOT / name,
        ]
        for c in cands:
            if c.is_file():
                return c
        w = shutil.which(name)
        return Path(w) if w else None

    pwsh_cmd = find_cmd("dsha-pwsh.cmd")
    if pwsh_cmd and pwsh_cmd.is_file():
        r_pwsh = subprocess.run(
            [str(pwsh_cmd), "-Command", "@(1..5) | Where-Object { $_ -gt 2 } | Measure-Object | Select-Object -ExpandProperty Count"],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=10,
        )
        ok4_1 = (r_pwsh.returncode == 0 and r_pwsh.stdout.strip() == "3")
        results.append(("D4.1: 复杂圆括号管道脚本在专用 PowerShell 7 绝缘运行 (无 PS 5.1 撕裂)", ok4_1, f"Count={r_pwsh.stdout.strip()}"))
    else:
        results.append(("D4.1: 找到 dsha-pwsh.cmd", False, "Missing"))

    # 4.2 POSIX Shell 脚本语法通过 dsha-sh 正常运行
    sh_cmd = find_cmd("dsha-sh.cmd")
    if sh_cmd and sh_cmd.is_file():
        r_sh = subprocess.run(
            [str(sh_cmd), "-c", "echo 'hello open source skill' | tr 'a-z' 'A-Z'"],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=10,
        )
        ok4_2 = (r_sh.returncode == 0 and "HELLO OPEN SOURCE SKILL" in r_sh.stdout)
        results.append(("D4.2: POSIX 语法工具链在防咬人 GNU Bash 顺畅解析 (POSIX 跨平台无缝兼容)", ok4_2, r_sh.stdout.strip()))
    else:
        results.append(("D4.2: 找到 dsha-sh.cmd", False, "Missing"))


    # ---------------------------------------------------------------------
    # Dimension 5: DSHA-Index 动态编目与 Router 路由决策排异测试
    # ---------------------------------------------------------------------
    print("\n--- 维度 5: DSHA-Index 编目与 Router 智能路由排异测试 ---")

    # 5.1 动态注册新技能至 TOOL_REGISTRY
    TOOL_REGISTRY.register(SecurityAuditTool)
    TOOL_REGISTRY.register(SqliteAnalyzerTool)
    all_registered = TOOL_REGISTRY.all()
    ok5_1 = ("sec-audit" in all_registered and "sqlite-analyzer" in all_registered)
    results.append(("D5.1: 外部新技能类无摩擦接入 ToolRegistry (基于类的类型安全扩展)", ok5_1, f"Registered: {len(all_registered)} tools"))

    # 5.2 按类目精确提取外部新工具
    pr_tools = TOOL_REGISTRY.get_by_category("PolicyRadar")
    ok5_2 = any(t.id == "sec-audit" for t in pr_tools)
    results.append(("D5.2: 外部工具精准归入指定业务类目并在 Category 检索中立即可查", ok5_2, f"PolicyRadar contains: {[t.id for t in pr_tools]}"))

    # 5.3 测试 Router 对外部新技能意图的路由决策
    import router
    router.TOOL_REGISTRY["sec-audit"] = SecurityAuditTool().to_dict()
    router.TOOL_REGISTRY["sqlite-analyzer"] = SqliteAnalyzerTool().to_dict()

    route_res = router.analyze_route("请对当前工程代码执行全面的安全审查和依赖漏洞扫描")
    ok5_3 = (route_res["selected_tool"] == "sec-audit")
    results.append(("D5.3: DSHA-Router 智能路由层精准命中外部新技能 (意图解析与置信度高)", ok5_3, f"Selected: {route_res['selected_tool']} ({int(route_res['confidence']*100)}%)"))

    # ---------------------------------------------------------------------
    # 汇总输出
    # ---------------------------------------------------------------------
    print("\n" + "=" * 70)
    passed_count = sum(1 for _, ok, _ in results if ok)
    total_count = len(results)
    
    print(f"📊 排异反应综合测试矩阵结果: PASS {passed_count} / FAIL {total_count - passed_count} (总计 {total_count} 项)")
    print("=" * 70)
    
    for name, ok, detail in results:
        status_sym = "✅ [PASS]" if ok else "❌ [FAIL]"
        print(f"  {status_sym} {name}")
        if detail:
            print(f"       细节: {detail}")

    return passed_count == total_count


if __name__ == "__main__":
    success = run_integration_tests()
    sys.exit(0 if success else 1)
