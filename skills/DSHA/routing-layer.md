# DSHA 智能路由层 (Routing Layer) · 多模态工具智能调度中心

> **分支特性 (DHSA-TestWeb)**：为解决 DSHA 旗下工具矩阵（REA 逆向、Scribe 书记官、Cloudflare 边缘引擎、Pwsh 7 系统运维、DSH 权限与额度雷达）日益庞大、多模型协同调度时的选型成本，特引入**智能情境路由层**。

---

## 1. 路由体系架构与 7 大子系统矩阵

路由层通过对开发者输入的自然语言意图、目标文件扩展名、特定关键字与上下文特征进行多维加权分析，实时判定最适配的子系统入口：

| 子系统标识 | 工具名称 | 触发特征 / 目标对象 | 调度入口 |
|---|---|---|---|
| **`cf`** | **Cloudflare Web & Edge Engine** | `.html`, `.ts`, `.js`, `wrangler.toml`, Workers, Pages, Tunnel, 边缘函数, 部署 | `bin\cf.cmd` |
| **`rea`** | **Reverse Engineer Anything** | `.exe`, `.dll`, `.so`, `.apk`, `.asar`, 逆向, 反编译, 查壳, 节表, 导入表 | `bin\rea.cmd` |
| **`scribe`** | **DSHA Scribe (书记官)** | `.log`, `.jsonl`, `gate.log`, 日志收录, 异常堆栈, 审计轨迹, 问题研判简报 | `bin\scribe.cmd` |
| **`pwsh`** | **DSHA Dedicated PowerShell 7** | `.ps1`, 管道命令, 进程管理, 自动化脚本, 避开 Windows 原生括号咬人 | `bin\dsha-pwsh.cmd` |
| **`sh`** | **DSHA Safe GNU Bash** | `.sh`, POSIX 脚本, `grep`, `sed`, `awk`, `curl`, Linux 环境兼容 | `bin\dsha-sh.cmd` |
| **`tier`** | **DSH Permission Tier Gate** | `read-only`, `auto`, `danger-full-access`, `workspace-write`, 切换权限档位 | `bin\agy-tier.ps1` |
| **`meter`** | **DSHA Quota Floating Radar** | 额度监控, 5H / 7D 水位, Token 悬浮窗, 回血倒计时 | `bin\agy-meter.ps1` |

---

## 2. 路由层核心指令与使用模式 (CLI Usage)

通过统一的纯 ASCII 入口 `bin\dsha.cmd`（或全局 PATH 中的 `dsha`）进行调度：

### 1) 意图与情境分析 (`route`)
根据输入意图进行多因子评分，输出结构化决策报告（包含推荐工具、置信度、决策依据与建议指令）：
```cmd
bin\dsha.cmd route "逆向分析 elevate.exe 的节表和哈希"
bin\dsha.cmd route "部署这个 Cloudflare Worker 并启动本地 dev"
bin\dsha.cmd route "收录最近的崩溃日志并生成一份问题研究简报"
```
*JSON 格式输出*（适用于 Agent 自动化管道）：
```cmd
bin\dsha.cmd route "部署一段网页到 Cloudflare Pages" --json
```

### 2) 全工具链就位检测 (`status`)
快速检查 DSHA 旗下全部 7 个子系统工具的就绪情况：
```cmd
bin\dsha.cmd status
```

### 3) 自动化用例自检 (`selftest`)
运行 8 大全场景测试矩阵（逆向分析、ASAR 解包、Worker 部署、Tunnel 隧道、日志收录、审计提取、PowerShell 管道、权限切档），验证路由准确率：
```cmd
bin\dsha.cmd selftest
```

### 4) 子系统直接透明代理
支持直接作为统一入口穿透代理底层工具：
```cmd
bin\dsha.cmd cf whoami
bin\dsha.cmd scribe status
bin\dsha.cmd pwsh -Command "$PSVersionTable"
```
