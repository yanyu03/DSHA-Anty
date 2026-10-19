# DSHA-Index 顶层能力目录与 Call_Tools 统合拉取协议 (v1.0.0)

> **定位**：DSHA-SharBoy 体系顶层索引总控。作为全系统“能力大纲与工具全景元数据的事实源”，与核心路由（DSHA-Router）及统合拉取函数（`Call_Tools`）协同，实现对 7 大平行工具的集中式编排与动态加载。

---

## 1. 顶层分层调用蓝图 (The Layered Architecture)

```
[请求输入 / Agent 任务]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ 1. 顶层索引：DSHA-Index (Master Catalog & Capabilities)│
│    - 7 大工具元数据、输入输出契约、敏感等级、环境预检  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. 核心路由：DSHA-Router (Intent & Context Dispatcher) │
│    - 多因子加权算法 (意图/后缀/动词) -> 智能定标工具   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. 调度中枢：Call_Tools(tool_name, args, context)      │
│    - 路径动态定位、沙箱环境注入 (UTF-8/Proxy)、执行捕获│
│    - 自动向 DSHA Scribe 镜像推流审计信息               │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
 ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
 │   Tool_REA    │ │    Tool_CF    │ │  Tool_Scribe  │ ... (7大平行工具)
 └───────────────┘ └───────────────┘ └───────────────┘
```

---

## 2. 7 大平行工具族注册大纲 (Master Catalog Matrix)

| 标识 | 工具名称 | 入口启动器 | 风险等级 | 核心领域与触发特征 |
|---|---|---|---|---|
| **`cf`** | Cloudflare Web & Edge Engine | `bin\cf.cmd` | `medium` | Workers、Pages、Tunnel、Forge 2900+ API、边缘部署 |
| **`rea`** | Reverse Engineer Anything | `bin\rea.cmd` | `low` | PE/ELF/Mach-O、ASAR 解包、APK 字节码、静态证据抽取 |
| **`scribe`** | DSHA Scribe (书记官) | `bin\scribe.cmd` | `read-only` | 日志收录、异常堆栈索引、问题研判简报 (Dossier) |
| **`pwsh`** | DSHA Dedicated PowerShell 7 | `bin\dsha-pwsh.cmd`| `medium` | 零括号撕裂的加固 PowerShell 7 系统运维流 |
| **`sh`** | DSHA Safe GNU Bash | `bin\dsha-sh.cmd` | `medium` | POSIX 脚本自动化与 Linux 兼容工具流 |
| **`tier`** | DSH Permission Tier Gate | `bin\agy-tier.ps1` | `admin` | 四级沙箱权限门禁与策略放行 |
| **`meter`** | DSHA Quota Floating Radar | `bin\agy-meter.ps1`| `low` | 5H / 7D 水位与 Token 实时 HUD 悬浮监控 |

---

## 3. `Call_Tools` 统一函数调用规范

### Python API
```python
from scripts.index import Call_Tools

# 1. 调用 Scribe 提取当前系统健康态势
res = Call_Tools("scribe", ["status"], {"capture": True, "timeout": 15})
if res["success"]:
    print(res["stdout"])

# 2. 调用 Cloudflare 直通引擎执行端点自发现
res = Call_Tools("cf", ["search", "deploy worker"], {"capture": True})

# 3. 调用 REA 逆向目标文件
res = Call_Tools("rea", ["inspect-artifact", "target.exe", "--json"], {"timeout": 60})
```

### 返回对象契约 (`ToolResult`)
```json
{
  "success": true,
  "tool": "cf",
  "tool_name": "Cloudflare Web & Edge Engine",
  "exit_code": 0,
  "stdout": "...",
  "stderr": "",
  "duration_ms": 1420,
  "cmd": ["<repo>\\bin\\cf.cmd", "status"]
}
```

---

## 4. 命令行总控界面 (CLI Usage)

```cmd
# 1. 浏览 DSHA-Index 顶层能力清单
bin\dsha-index.cmd list

# 2. 查阅指定工具的完整 Schema 元数据
bin\dsha-index.cmd get cf

# 3. 通过 Call_Tools 协议执行指定工具
bin\dsha.cmd call cf status
bin\dsha.cmd call scribe status

# 4. 路由智能研判并自动执行 (Router -> Call_Tools)
bin\dsha.cmd exec "部署 Worker 到边缘"
```
