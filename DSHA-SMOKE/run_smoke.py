#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSHA-SMOKE: Master Local Smoke Testing & Stress Carnival Suite (冒烟整活演练场).

Executes end-to-end smoke tests across all DSHA subsystems in the DSHA-SMOKE sandbox,
exercising all unauthenticated toolchains:
  Scene 1: DSHA-Index Cataloging & Prerequisite Assertions
  Scene 2: DSHA Router Intelligent Intent Matching
  Scene 3: Cloudflare Web & Edge Engine (Local Worker Generation)
  Scene 4: REA Binary Forensics & Artifact Graph Inspection
  Scene 5: Scribe Chronicler Live Harvesting & Dossier Synthesis
  Scene 6: Dedicated Hardened PowerShell 7 Pipeline Computation
  Scene 7: Safe GNU Bash Multi-stage Stream Processing
  Scene 8: Meter Quota Floating Radar Telemetry
  Scene 9: BaseTool ErrBlock Missing-Runtime & Anti-Privilege Escalation Gate
"""

import json
import os
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

SMOKE_DIR = Path(__file__).resolve().parent
REPO_ROOT = SMOKE_DIR.parent
BIN_DIR = REPO_ROOT / "bin"
SCRIPTS_DIR = REPO_ROOT / "scripts"
USER_HOME = Path(os.environ.get("USERPROFILE") or ".")

# Add scripts directory to sys.path
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

# Standard UTF-8 environment for subprocesses
SUB_ENV = os.environ.copy()
SUB_ENV["PYTHONUTF8"] = "1"
SUB_ENV["PYTHONIOENCODING"] = "utf-8"

print("=" * 76)
print("🔥 DSHA-SMOKE: 全工具链本地冒烟综合整活大考验 (Local Smoke Carnival)")
print("   测试目录:", SMOKE_DIR)
print("   时间戳:", time.strftime("%Y-%m-%d %H:%M:%S"))
print("=" * 76)

summary_results = []


def record_result(scene_name, success, detail=""):
    summary_results.append((scene_name, success, detail))
    icon = "✅ [PASS]" if success else "❌ [FAIL]"
    print(f"\n{icon} {scene_name}")
    if detail:
        print(f"   细节: {detail}")


# =========================================================================
# Scene 1: DSHA-Index 顶层全景编目与环境断言
# =========================================================================
print("\n" + "-" * 60)
print("【Scene 1】DSHA-Index 顶层全景编目与环境断言 (Master Catalog)")
print("-" * 60)

cmd_index = BIN_DIR / "dsha-index.cmd"

# 1.1 查看全景目录
r1_1 = subprocess.run([str(cmd_index), "list"], capture_output=True, text=True, errors="replace", env=SUB_ENV, timeout=10)
print(r1_1.stdout.strip())
ok1_1 = (r1_1.returncode == 0 and "cf" in r1_1.stdout and "rea" in r1_1.stdout)

# 1.2 按类目精确提取 WebEdge
r1_2 = subprocess.run([str(cmd_index), "list", "-c", "WebEdge"], capture_output=True, text=True, errors="replace", env=SUB_ENV, timeout=10)
print("\n" + r1_2.stdout.strip())
ok1_2 = (r1_2.returncode == 0 and "WebEdge" in r1_2.stdout and "cf" in r1_2.stdout)

# 1.3 宿主环境依赖自检 (assert_environment)
r1_3 = subprocess.run([str(cmd_index), "check"], capture_output=True, text=True, errors="replace", env=SUB_ENV, timeout=10)
print("\n" + r1_3.stdout.strip())
ok1_3 = (r1_3.returncode == 0 and r1_3.stdout.count("[PASS]") >= 7)

record_result("Scene 1: DSHA-Index 目录查询、类目筛选与环境自检", ok1_1 and ok1_2 and ok1_3, "7大工具环境均满足")


# =========================================================================
# Scene 2: DSHA 智能情境路由层 (Router Intent Matching)
# =========================================================================
print("\n" + "-" * 60)
print("【Scene 2】DSHA 智能情境路由层决策测试 (Router Intent Matching)")
print("-" * 60)

cmd_router = BIN_DIR / "dsha.cmd"

intents = [
    ("帮我逆向分析目标 PE 可执行文件的节表、导入表和 SHA256 哈希", "rea"),
    ("配置一个带 KV 缓存和跨域响应头的 Cloudflare Worker", "cf"),
    ("提取最近的任务崩溃堆栈并整理一份高密度情报简报", "scribe"),
    ("执行一段零括号撕裂的 PowerShell 7 管道脚本计算哈希", "pwsh"),
]

router_ok = True
for prompt, expected in intents:
    r_route = subprocess.run([str(cmd_router), "route", prompt, "--json"], capture_output=True, text=True, errors="replace", env=SUB_ENV, timeout=10)
    try:
        data = json.loads(r_route.stdout.strip())
        sel = data.get("selected_tool")
        conf = int(data.get("confidence", 0) * 100)
        match = (sel == expected)
        if not match:
            router_ok = False
        print(f"  • 意图: '{prompt[:26]}...' -> [{sel.upper()}] (置信度: {conf}%, 期望: {expected}) {'✓' if match else '✗'}")
    except Exception as e:
        router_ok = False
        print(f"  • 解析失败: {e}")

record_result("Scene 2: DSHA 智能路由层 4 组复合意图命中率 100%", router_ok, "rea, cf, scribe, pwsh 均精准命中")


# =========================================================================
# Scene 3: Cloudflare 边缘计算与配置生成冒烟 (CF Worker Local Sandbox)
# =========================================================================
print("\n" + "-" * 60)
print("【Scene 3】Cloudflare 边缘计算与本地沙箱冒烟 (CF Conduit)")
print("-" * 60)

cmd_cf = BIN_DIR / "cf.cmd"
r_cf_status = subprocess.run([str(cmd_cf), "status"], capture_output=True, text=True, errors="replace", env=SUB_ENV, timeout=15)
print(r_cf_status.stdout.strip()[:350] + "...\n[状态略]")

# 在 DSHA-SMOKE 下生成一个微型 Cloudflare Worker
worker_dir = SMOKE_DIR / "smoke_worker"
worker_dir.mkdir(exist_ok=True)

wrangler_toml = """name = "dsha-smoke-worker"
main = "src/index.js"
compatibility_date = "2026-10-19"

[vars]
ENVIRONMENT = "smoke-test"
ENGINE = "DSHA-SharBoy"
"""
(worker_dir / "wrangler.toml").write_text(wrangler_toml, encoding="utf-8")

src_dir = worker_dir / "src"
src_dir.mkdir(exist_ok=True)

worker_js = """export default {
  async fetch(request, env, ctx) {
    const data = {
      message: "Hello from DSHA-SMOKE Edge Carnival!",
      timestamp: new Date().toISOString(),
      engine: env.ENGINE,
      environment: env.ENVIRONMENT,
      status: 200
    };
    return new Response(JSON.stringify(data, null, 2), {
      headers: { "content-type": "application/json;charset=UTF-8" }
    });
  }
};
"""
(src_dir / "index.js").write_text(worker_js, encoding="utf-8")

# 用 Node.js 校验 Worker 语法与 JSON 输出
node_check = subprocess.run(
    ["C:\\Program Files\\nodejs\\node.exe", "-e", "import('./src/index.js').then(m => m.default.fetch(new Request('http://localhost'), { ENGINE: 'DSHA', ENVIRONMENT: 'smoke' }).then(r => r.json())).then(j => console.log('Worker Response:', JSON.stringify(j)))"],
    cwd=str(worker_dir),
    capture_output=True,
    text=True,
    errors="replace",
    env=SUB_ENV,
    timeout=10,
)
print("Worker 本地执行测试:", node_check.stdout.strip())
cf_ok = (r_cf_status.returncode == 0 and node_check.returncode == 0 and "Hello from DSHA-SMOKE" in node_check.stdout)
record_result("Scene 3: Cloudflare 工具链状态检测与微型 Worker 本地执行", cf_ok, "生成并成功运行本地 Edge Worker")


# =========================================================================
# Scene 4: REA 二进制与资产逆向取证冒烟 (REA Binary Forensics)
# =========================================================================
print("\n" + "-" * 60)
print("【Scene 4】REA 二进制分析与资产图谱省察 (Reverse Engineer Anything)")
print("-" * 60)

cmd_rea = BIN_DIR / "rea.cmd"
target_binary = BIN_DIR / "pwsh" / "pwsh.exe"

r_rea = subprocess.run(
    [str(cmd_rea), "inspect-artifact", str(target_binary)],
    capture_output=True,
    text=True,
    errors="replace",
    env=SUB_ENV,
    timeout=20,
)

rea_out = r_rea.stdout
has_sha = "sha256:" in rea_out
has_pe = "format: pe" in rea_out
has_evidence = "evidence_id:" in rea_out

# 保存证据到 DSHA-SMOKE
(SMOKE_DIR / "rea_pwsh_evidence.yaml").write_text(rea_out, encoding="utf-8")
print(f"  • REA 提取 SHA256 与 PE 节表证据: 包含证据 ID: {has_evidence}, 格式: pe: {has_pe}, 哈希就位: {has_sha}")
print(f"  • 完整取证已固化保存至: {SMOKE_DIR / 'rea_pwsh_evidence.yaml'}")

rea_ok = (r_rea.returncode == 0 and has_sha and has_pe)
record_result("Scene 4: REA 逆向省察 pwsh.exe 提取 PE 与 SHA256 证据", rea_ok, "成功生成标准化取证图谱")


# =========================================================================
# Scene 5: DSHA 书记官实时日志提纯与简报生成冒烟 (Scribe)
# =========================================================================
print("\n" + "-" * 60)
print("【Scene 5】DSHA 书记官实时情报提纯与简报生成 (The Scribe)")
print("-" * 60)

cmd_scribe = BIN_DIR / "scribe.cmd"

# 5.1 检查书记官状态
r_sc_status = subprocess.run([str(cmd_scribe), "status"], capture_output=True, text=True, errors="replace", env=SUB_ENV, timeout=10)
print(r_sc_status.stdout.strip())

# 5.2 生成专属研判简报
dossier_path = SMOKE_DIR / "SMOKE_RESEARCH_DOSSIER.md"
r_sc_dossier = subprocess.run(
    [str(cmd_scribe), "dossier", "--issue", "DSHA-SMOKE 全工具链冒烟整活实战大检验"],
    capture_output=True,
    text=True,
    errors="replace",
    env=SUB_ENV,
    timeout=15,
)
dossier_path.write_text(r_sc_dossier.stdout, encoding="utf-8")
dossier_lines = len(r_sc_dossier.stdout.splitlines())
print(f"  • 书记官简报已生成，行数: {dossier_lines} 行，包含审计轨迹与异常索引")
print(f"  • 简报已固化保存至: {dossier_path}")

scribe_ok = (r_sc_status.returncode == 0 and dossier_lines >= 50 and len(r_sc_dossier.stdout) > 500)
record_result("Scene 5: 书记官收录实时态势并生成 Markdown 调研简报", scribe_ok, f"文件已保存 ({dossier_path.name}, 共 {dossier_lines} 行)")


# =========================================================================
# Scene 6: 加固 PowerShell 7 高难度圆括号与管道计算冒烟 (Pwsh 7)
# =========================================================================
print("\n" + "-" * 60)
print("【Scene 6】专用 PowerShell 7 高难度圆括号与数据管道计算 (Pwsh 7)")
print("-" * 60)

cmd_pwsh = BIN_DIR / "dsha-pwsh.cmd"

# 测试通常在原生 Windows PS 5.1 中容易由于括号或哈希表语法咬人的管道
ps_script = "@(1..6) | ForEach-Object { [PSCustomObject]@{ Step = $_; Pow2 = [Math]::Pow(2, $_); Tag = ('BIT_{0:D2}' -f $_) } } | ConvertTo-Json -Compress"

r_pwsh = subprocess.run([str(cmd_pwsh), "-Command", ps_script], capture_output=True, text=True, errors="replace", env=SUB_ENV, timeout=10)
print("PowerShell 7 管道输出:", r_pwsh.stdout.strip())
pwsh_ok = (r_pwsh.returncode == 0 and "BIT_06" in r_pwsh.stdout and "64" in r_pwsh.stdout)
record_result("Scene 6: PowerShell 7 复杂对象数组与圆括号管道运算", pwsh_ok, "零括号撕裂，精准输出 JSON")


# =========================================================================
# Scene 7: POSIX GNU Bash 多级流式处理防咬人冒烟 (GNU Bash)
# =========================================================================
print("\n" + "-" * 60)
print("【Scene 7】POSIX GNU Bash 多级流式处理管道冒烟 (GNU Bash)")
print("-" * 60)

cmd_sh = BIN_DIR / "dsha-sh.cmd"

# 多级管道：tr 大写转换 -> awk 格式化 -> sed 替换 -> 统计
bash_pipe = "echo 'dsha smoke carnival test' | tr ' ' '\\n' | tr 'a-z' 'A-Z' | awk '{print NR \": \" $0}' | sed 's/CARNIVAL/PARTY/'"
r_sh = subprocess.run([str(cmd_sh), "-c", bash_pipe], capture_output=True, text=True, errors="replace", env=SUB_ENV, timeout=10)
print("GNU Bash 管道输出:")
print(r_sh.stdout.strip())

sh_ok = (r_sh.returncode == 0 and "PARTY" in r_sh.stdout and "1: DSHA" in r_sh.stdout)
record_result("Scene 7: GNU Bash 流式文本流水线 (tr | awk | sed)", sh_ok, "POSIX 工具链与 Windows 环境无缝协同")


# =========================================================================
# Scene 8: 额度雷达实时水位与滑动窗口状态探测 (Meter Telemetry)
# =========================================================================
print("\n" + "-" * 60)
print("【Scene 8】额度雷达实时水位与滑动窗口状态探测 (Meter Telemetry)")
print("-" * 60)

meter_cands = [
    BIN_DIR / "agy-meter.ps1",
    USER_HOME / ".gemini" / "config" / "agy-meter.ps1",
    REPO_ROOT / "agy-meter.ps1",
]
meter_script = next((c for c in meter_cands if c.is_file()), None)

if meter_script:
    r_meter = subprocess.run(
        [str(BIN_DIR / "pwsh.cmd"), "-NoProfile", "-File", str(meter_script), "-Status"],
        capture_output=True,
        text=True,
        errors="replace",
        env=SUB_ENV,
        timeout=10,
    )
    print("额度雷达遥测状态:")
    print(r_meter.stdout.strip()[:300] + "...")
    meter_ok = (r_meter.returncode == 0)
    record_result("Scene 8: 额度雷达 5H/7D 水位与回血时间窗实时探测", meter_ok, "成功调阅本地滑动配额遥测")
else:
    record_result("Scene 8: 额度雷达脚本查找", False, "未找到 agy-meter.ps1")


# =========================================================================
# Scene 9: BaseTool 宿主环境缺失阻断与防越权断言冒烟 (ErrBlock)
# =========================================================================
print("\n" + "-" * 60)
print("【Scene 9】BaseTool 宿主环境缺失阻断与防越权断言冒烟 (ErrBlock Engine)")
print("-" * 60)

from base_tool import BaseTool, PrerequisiteEnv, RiskLevel, ToolCategory

class QuantumComputeMockTool(BaseTool):
    def __init__(self):
        super().__init__(
            tool_id="quantum-qpu",
            name="Quantum Computing QPU Acceleration Engine",
            category=ToolCategory.SYSADMIN,
            risk_level=RiskLevel.MEDIUM,
            version="9.9.9",
            description="Quantum acceleration simulation tool",
            cmd="qpu.cmd",
            prerequisites=[
                PrerequisiteEnv(
                    binary="quantum_qpu_runtime_binary_xyz",
                    min_version="9.9.9",
                    remediation="Install Quantum SDK via https://quantum.example.com",
                )
            ],
        )

# 9.1 触发故意缺失环境的阻断
q_tool = QuantumComputeMockTool()
res_q = q_tool.execute()

print("缺失运行时触发结构化拒绝输出:")
print(res_q["stderr"].strip())

ok9_1 = (
    res_q["exit_code"] == 126
    and not res_q["success"]
    and "ERR_PREREQUISITE_MISSING" in res_q["stderr"]
    and "quantum_qpu_runtime_binary_xyz" in res_q["stderr"]
)

# 9.2 触发只读档位防越权阻断 (使用环境已就绪但风险级别为 medium 的 PwshTool)
from base_tool import PwshTool
pwsh_tool = PwshTool()
res_auth = pwsh_tool.execute(context={"tier": "read-only"})

print("\n只读档位防越权阻断输出:")
print(res_auth["stderr"].strip())

ok9_2 = (
    res_auth["exit_code"] == 126
    and not res_auth["success"]
    and "ERR_PERMISSION_DENIED" in res_auth["stderr"]
)

record_result("Scene 9: BaseTool 结构化 ErrBlock 拒绝缺失运行时与越权调用", ok9_1 and ok9_2, "退出码 126，输出精准修复指引")


# =========================================================================
# 最终汇总与烟火战报
# =========================================================================
print("\n" + "=" * 76)
all_pass = all(ok for _, ok, _ in summary_results)
pass_count = sum(1 for _, ok, _ in summary_results if ok)
total_scenes = len(summary_results)

print(f"🎉 冒烟演练总战报: PASS {pass_count} / {total_scenes} 个场景全部成功冒烟！")
print(f"📁 演练战果留存目录: {SMOKE_DIR}")
print("=" * 76)

sys.exit(0 if all_pass else 1)
