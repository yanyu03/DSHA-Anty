---
name: DSHA
description: >-
  为 Anty 制作的 DSH 同款权限插件。展示并切换 Antigravity 的四级 DSH 权限档位
  （read-only / workspace-write / danger-full-access / auto），每次切换前先给出分级警告。
  Use when the user types /DSHA, asks which permission tier is active, or wants to change
  how much the agent may run without asking — 切换权限、看当前权限档位、改成全权/只读/工作区写入.
---

# DSHA — DSH 同款权限插件（为 Anty 制作）

本机把 **DeepSeek Harness** 的四个权限预设移植到了 Antigravity 上。一个开关同时管住两半：

```
$env:USERPROFILE\.gemini\config\agy-tier.ps1
```

它把原生开关写进 `~/.gemini/config/config.json`，武装 `dsh-permissions` 插件
（`tier.json` + `hooks.json`），并以非提权方式重启 Antigravity。**不要手工编辑那些文件**——
这个脚本是唯一事实源，且每次都会先备份。

## 四个档位

| 档位 | DSH 对应 | 终端命令 | 工作区之外 | 由谁承担 |
|---|---|---|---|---|
| `read-only` | sandbox=read-only, approval=ask | 仅观察类放行，其余确认或拒绝 | 文件 DENY、联网 DENY | 钩子 |
| `workspace-write` | sandbox=workspace-write, approval=ask | 开发白名单自动，其余需批准 | 文件 ASK、联网 ASK | 原生开关（钩子关闭） |
| `danger-full-access` | sandbox=danger-full-access, approval=never | 不审批 | 文件 ALLOW、联网 ALLOW | 原生开关（钩子关闭） |
| `auto` | 无沙箱、逐调用审查 | 每次调用由**本地策略引擎**判定 | 文件 ALLOW、联网 ALLOW | 钩子 |

`read-only` 与 `auto` 由钩子承担，因此**这两档之间切换立即生效**。
`workspace-write` 与 `danger-full-access` 由原生开关承担，而 Antigravity 只在进程启动时读取
它们——这两档必定重启应用。

## 怎么用这个 skill

### 1. 先读真实状态——不要猜

```powershell
pwsh -NoProfile -NonInteractive -File "$env:USERPROFILE\.gemini\config\agy-tier.ps1" -Status
```

它会打印活动档位与全部原生开关。同样的值也在
`plugins\dsh-permissions\tier.json`（`tier`）与 `config.json`（`userSettings`）里。
**报告你测到的值，不要报告你以为的值。**

### 2. 在对话里内联渲染选择器

把本 skill 目录下的 `widget.html` 复制到本对话的 artifact 目录，把 `<body>` 上的
`data-current` 替换成你刚测到的档位，然后嵌入：

```
<agent-embed src="file:///<artifact_path>/widget.html"></agent-embed>
```

`widget.html` 已符合 `generative_ui` 契约：白名单 gstatic Tailwind、
`<body class="bg-transparent …">`、宿主主题变量（`--card`、`--border`、`--foreground`、
`--muted-foreground`、`--primary`/`--primary-foreground`、`--secondary`、`--accent`）、
卡片包裹、远低于 500px 内联预算、且不含任何视口相对尺寸。

### 3. 用户选档后，先给警告——并且当真

说明用户选了哪一档，然后**从 `reference.md` 原样引用该档的警告全文**，再等用户在本对话里
明确确认。只有确认之后才运行：

```powershell
pwsh -NoProfile -NonInteractive -File "$env:USERPROFILE\.gemini\config\agy-tier.ps1" <tier> -Yes
```

**`agy-tier.ps1` 没有 `-Yes` 就不会改动任何东西**（打印警告并以 exit 2 退出，一个文件都不碰）。
这是刻意的：`-Yes` 是你"用户已被警告并同意"的担保。**绝不要擅自加它**、不要为了"省一个来回"
加它、也不要在用户只是询问某档而不是选择某档时加它。

### 4. 如实交代重启

每次切换都会停止并重启 Antigravity：**任何正在运行的对话都会被中断**。实测一次切换
（2026-09-22）端到端约 **7 秒**——6 秒刻意停机宽限，加约 1 秒到新进程写出启动日志；
脚本在进程出现即返回，所以窗口完全可用可能再需几秒。重启必须**非提权**——
从提权进程启动 Antigravity 会在 `requestSingleInstanceLock()` 处静默 `exit 0`，一行日志都不写。
脚本用 `explorer.exe` 处理了这一点；不要"修"成直接启动 exe。

## 两处真实差距，不许粉饰

1. **`read-only` 是近似。** DSH 用真实文件系统沙箱阻止写入。Antigravity 没有"禁止工作区内写入"
   的旋钮，所以由插件的钩子顶替：变更类工具与灾难性命令被拒绝，但**普通写入只会变成"必须确认"**。
   诚实的说法是*写入需批准*，绝不是*写入不可能*。

2. **这里的 `auto` 不是 DSH 那种模型审查。** DSH 会让同一个模型逐次裁决每次调用。本移植改用
   确定性本地正则策略：免费、离线、可审计、约 50ms——而且两个方向都会判错，且比真货更爱打断。
   请一律称之为 `auto (local policy)`。

同目录的 `reference.md` 放着完整警告全文、完整旋钮映射，以及那些运维陷阱
（提权启动、`cmd /c` 引号、hook stderr 编码、真实工具名）。

---

## 工程锁（Engineering Lock）— 与权限档位正交的第二道闸

除权限档位外，本机还装有**工程锁**：档位决定"能不能做"，工程锁决定"做得对不对"。
完整规格见同目录 `engineering-lock.md`，机械校验器：`plugins\dsh-permissions\scripts\englock.py`。

**每次收尾前自查八条：**

| ID | 锁 | 要求 |
|---|---|---|
| L1 | 出处锁 | 每个数字/结论都带来源；推算值必须标 `[EXTRAPOLATED]` |
| L2 | 样本锁 | "验证/证明"必须配样本量；**n=1 只能写"单次观测"** |
| L3 | 撤回锁 | 与旧结论冲突时，必须写明"撤回：<旧结论>（时间/轮次）" |
| L4 | 三件套锁 | 交报告 + **复现命令** + **回滚方式** |
| L5 | 报告头锁 | 报告必含：日期 / 设备与固件 / 工具与版本 / 样本数 / 是否实测 / 结论强度 |
| L6 | 措辞锁 | 禁用史诗级、完美、100%、彻底、万能、绝对；一律量化 |
| L7 | 断拍锁 | 断拍 >6h 或新会话接手：**先出状态对账清单**（上次结论/未闭环项/回滚点）再动手 |
| L8 | 外部审查锁 | 对外发布前列出 **3 个最可能被推翻的点** |

**离线自查命令：**

```powershell
python "$env:USERPROFILE\.gemini\config\plugins\dsh-permissions\scripts\englock.py" status
python "...\englock.py" check <某份报告.md>     # 逐条列出被锁命中的地方
python "...\englock.py" selftest               # 10/10 即正常
```

---

## 工程锁（Engineering Lock）— 与权限档位正交的第二道闸

除权限档位外，本机还装有**工程锁**：档位决定"能不能做"，工程锁决定"做得对不对"。
完整规格见同目录 `engineering-lock.md` 与 `language-norm.md`；
机械校验器：`plugins\dsh-permissions\scripts\englock.py`（词表 `lexicon.json`，改词表即改行为）。

**每次收尾前自查：**

| ID | 锁 | 要求 |
|---|---|---|
| L1 | 出处锁 | 每个数字/结论都带来源；推算值必须标 `[EXTRAPOLATED]` |
| L2 | 样本锁 | "验证/证明"必须配样本量；**n=1 只能写"单次观测"** |
| L3 | 撤回锁 | 与旧结论冲突时，必须写明"撤回：<旧结论>（时间/轮次）" |
| L4 | 三件套锁 | 交报告 + **复现命令** + **回滚方式** |
| L5 | 报告头锁 | 报告必含：日期 / 设备与固件 / 工具与版本 / 样本数 / 是否实测 / 结论强度 |
| L6 | 措辞锁 | 禁用史诗级、完美、100%、彻底、万能、绝对；一律量化 |
| L7 | 断拍锁 | 断拍 >6h 或新会话接手：**先出状态对账清单**（上次结论/未闭环项/回滚点）再动手 |
| L8 | 外部审查锁 | 对外发布前列出 **3 个最可能被推翻的点** |

### L9 语言规范锁（防止"胡言乱语"）

**原则：措辞强度不得超过证据强度。** 硬锁只有一条，其余为提醒。

| ID | 规则 | 触发 |
|---|---|---|
| **L9.1** | **禁用词（硬）** | 史诗级/完美/彻底/万能/无敌/天花板/遥遥领先/震撼/炸裂/逆天/神器/一键/保证/一劳永逸/我完全掌控… |
| L9.2 | 无据权威 | "官方/业内/权威/众所周知" 但全文无来源 |
| L9.3 | 伪精确 | 两位以上小数，却无样本/误差说明 |
| L9.4 | 假完成 | "已修复/已解决/现已生效/收工" 但无任何验证标记 |
| L9.5 | 术语漂移 | 同一概念多种写法（待验证 / 尚未确认） |
| L9.6 | 引用不可解析 | 正文里的 `file:///` 路径不存在 |
| L9.7 | 未来态无标记 | "将/计划/预计" 但无"计划/待验证"字样 |

**改写示范**：❌"史诗级突破，100% 彻底攻克" → ✅"已打通：单次观测 `GPU 72.8%`（n=1，待复测）"。

**离线自查命令：**

```powershell
python "$env:USERPROFILE\.gemini\config\plugins\dsh-permissions\scripts\englock.py" status
python "...\englock.py" check <某份报告.md>     # 逐条列出被锁命中的地方（退出码 1 = 有命中）
python "...\englock.py" lexicon                # 打印当前词表
python "...\englock.py" selftest               # 19/19 即正常
```


---

## UI 权限调节面板（用户点按钮，不靠记命令）

用户说 `/DSHA 面板`（或"看看权限面板"）时，按下面三步渲染：

1. **先读真实状态**（不要猜）：
   ```powershell
   pwsh -NoProfile -NonInteractive -File "$env:USERPROFILE\.gemini\config\agy-tier.ps1" -Status
   ```
2. 把本目录 `widget.html` 复制到本对话 artifact 目录，替换 **三个** `data-*` 属性：
   - `data-current` → 刚测到的档位（`read-only` / `workspace-write` / `danger-full-access` / `auto`）
   - `data-lock` → `englock.json` 的 `mode`（`advisory` / `strict`）
   - `data-checked` → 本次实测时间（如 `2026-10-06 11:20`）
   然后嵌入：`<agent-embed src="file:///<artifact_path>/widget.html"></agent-embed>`
3. **面板只展示与复制命令，不会自己改开关**。用户点了「复制：请求 agent 切换」后会把文本粘回来 ——
   此时按本 skill `§3` 的流程走：**原样引用该档警告全文 → 等用户明确确认 → 才执行 `agy-tier.ps1 <tier> -Yes`**。

> **出厂默认 = `danger-full-access`（全权）**：`data-current` 为该值时面板会自动亮出风险横幅。
> 完成度警告见包内 `默认全权警告.md`。


---

## DSHA-Meter（额度与 Token 监视器 · 5H / 7D / Context 水位）

DSHA 家族第三位成员：常驻 Anty 前台或桌面的极轻量悬浮雷达，实时监测 5H/7D 额度与单轮上下文水位。

### 常用命令：
```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\agy-meter.ps1" -Status   # 查看当前遥测
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\agy-meter.ps1" -Start    # 启动桌面常驻悬浮窗
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\agy-meter.ps1" -Stop     # 停止悬浮窗
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\agy-meter.ps1" -Restart  # 重启悬浮窗
```

---

## Programer 编程思维与工程辅助模式 (Programer Mindset)

DSHA 家族第四位成员：围绕配置、输入、资源生命周期和证据整理的工程指导模块；不模仿个人教学口吻或分发课程全文。

### 核心五大支柱：
1. **系统底层穿透律**：跨平台绝对锚定，UTF-8 BOM vs 无 BOM 物理隔离，Job Object 与 DWM 穿透；
2. **防御性契约与生命周期**：严格 `with` 上下文回收，字典 `.get()` 兜底，杜绝可变默认形参；
3. **并发安全与锁纪律**：I/O 密集用守护线程，独立 UI 跨进程隔离，共享状态互斥锁 (`Lock`) 保护；
4. **高内聚与无侵入切面**：AOP 钩子横切接入，保持核心业务纯粹，模块自带 `__main__` 自检；
5. **精炼范式与量化实证**：契合 DSHA L1-L9 工程锁，三件套交付（报告 + 指令 + 回滚）。

详情参考：
- 模块设计与来源：`docs/PROGRAMER_DESIGN.md`、`docs/PROGRAMER_PROVENANCE.md`
- 架构思维规范：`docs/PROGRAMER_MINDSET.md`
- 技能实践速查：`skills/DSHA/programer.md`

---

## REA 逆向工程与证据抽取工具集 (Reverse Engineer Anything)

DSHA 家族第五位成员：引入自开源 `morluto/rea` 并在本地就地执行的逆向工程工具集。具备零依赖静态提取能力与 150+ 项指令，以 Programer 风味 Python 驱动器保障底层稳定与防御性降级。

### 核心功能与就地调用
- **运行时环境自检**：
  ```bash
  rea --self-test
  ```
- **分析 JavaScript / Electron ASAR 应用**：
  ```bash
  rea analyze-javascript-application <path-to-app-or-asar> --json
  ```
- **检查 PE / ELF / Mach-O 二进制结构与哈希**：
  ```bash
  rea inspect-artifact <path-to-binary> --json
  ```
- **Android APK 资源清单与类结构分析**：
  ```bash
  rea search-android-classes <path-to-apk>
  ```
- **MCP 服务端启动**：
  ```bash
  rea mcp
  ```

> **Programer 避坑指引**：即使系统未安装 Ghidra、Hopper 或 IDA，驱动器也会自动安全降级至纯静态提取模式（支持 ASAR 解包、JS 依赖提取、PE 节表与 APK 资源分析），杜绝抛出致命崩溃。

---

## 合规安全 Shell 环境 (防咬人环境 · No Parenthesis Biting)

为解决 Windows PowerShell 5.1 下执行命令时频发的**“括号咬人”**（圆括号被误认为子表达式导致 `ParserError`）、ExecutionPolicy 限制 (`UnauthorizedAccess`) 以及 UTF-8 编码错位问题，DSHA 提供了合规防咬人 Shell 套件：

### 核心 Shell 工具
1. **`dsha-sh` (通用安全 Shell 执行器)**：
   自动切换 UTF-8 (Code Page 65001)，绕过 PowerShell 语法陷阱，直接将命令安全传递至 GNU Bash 执行：
   ```bash
   dsha-sh "echo '(nested parentheses) and [brackets] are safe!'"
   ```
2. **`bash` & `sh` (原生 GNU Bash)**：
   已将 Git Bash 核心（`C:\Program Files\Git\bin` 与 `usr\bin`）整合进全局 PATH，任何模型均可直接调用标准 POSIX 工具：
   ```bash
   bash -c "npm -v; node -v"
   ```
3. **ExecutionPolicy 已合规放行**：
   当前用户作用域已置为 `RemoteSigned`，全面消除 `.ps1` 脚本的权限拦截。

---

## DSHA 书记官智能体 (The Scribe)

DSHA 家族第六位成员：专职情报官与日志档案员。只负责收录日志、整理执行轨迹、提取报错堆栈，为其他 Agent 提供高密度的问题研究材料 (Research Dossier)。

### 核心能力与指令
- **查看收录状态**：`bin\scribe.cmd status`
- **生成问题研究简报**：`bin\scribe.cmd dossier [--issue <议题>]`
- **刷新日志缓存**：`bin\scribe.cmd harvest`
- **内置用例自检**：`bin\scribe.cmd selftest`
- **子智能体调度**：支持通过 `invoke_subagent(TypeName="scribe")` 异步唤起。

详见：[skills/DSHA/scribe.md](file:///c:/Users/admin/Desktop/GOOGLE/DSHA/skills/DSHA/scribe.md)

---

## Cloudflare 直通引擎 (Cloudflare Conduit · DHSA-TestWeb)

DSHA 家族第七位成员：直通 Cloudflare 现代边缘计算与 Web 体系。统一封装 Wrangler、Pages 与 Tunnel，自带编码加固与智能代理感知。

### 核心能力与指令
- **工具链状态**：`bin\cf.cmd status`
- **账号身份鉴权**：`bin\cf.cmd whoami`
- **本地开发调试**：`bin\cf.cmd dev`
- **边缘服务部署**：`bin\cf.cmd deploy`
- **静态与全栈托管**：`bin\cf.cmd pages`
- **安全隧道穿透**：`bin\cf.cmd tunnel`
- **单元自检测试**：`bin\cf.cmd selftest`

详见：[skills/DSHA/cloudflare.md](file:///c:/Users/admin/Desktop/GOOGLE/DSHA/skills/DSHA/cloudflare.md)

---

## DSHA 智能路由层 (Intelligent Routing Layer)

DSHA 家族总指挥枢纽：根据开发者意图、目标文件与上下文自动路由至最佳工具（CF / REA / Scribe / Pwsh / Sh / Tier / Meter）。

### 核心能力与指令
- **意图路由研判**：`bin\dsha.cmd route "<任务意图或目标文件>"`
- **工具就位体检**：`bin\dsha.cmd status`
- **全矩阵自检**：`bin\dsha.cmd selftest`
- **透明穿透代理**：`bin\dsha.cmd <tool> [args...]`

详见：[skills/DSHA/routing-layer.md](file:///c:/Users/admin/Desktop/GOOGLE/DSHA/skills/DSHA/routing-layer.md)

---

## DSHA-Index 顶层目录与 Call_Tools 统合拉取协议 (v1.0.0 正式版)

DSHA 家族最高顶层事实源：维护 7 大平行工具全景元数据与执行契约，通过核心路由 (DSHA-Router) 与统一函数 `Call_Tools` 实现对底层工具的隔离加载与结果回收。

### 核心能力与指令
- **浏览全景能力清单**：`bin\dsha-index.cmd list`
- **查阅指定工具契约**：`bin\dsha-index.cmd get <tool_id>`
- **统合拉取调用协议**：`bin\dsha.cmd call <tool_id> [args...]`
- **意图研判自动执行**：`bin\dsha.cmd exec "<任务意图>"`
- **套件自检验证**：`bin\dsha-index.cmd selftest`

详见：[skills/DSHA/dsha-index.md](file:///c:/Users/admin/Desktop/GOOGLE/DSHA/skills/DSHA/dsha-index.md)


