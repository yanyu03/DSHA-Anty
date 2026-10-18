# 参考：DSHA — 为 Anty 制作的 DSH 同款权限插件

本文件是 `/DSHA` 的配套参考。`SKILL.md` 讲流程，这里放**切换前必须原样转达的警告全文**、完整旋钮映射，以及踩过的运维陷阱。

## 切换前的警告全文（必须原样转达）

脚本本身也会在缺 `-Yes` 时打印一份英文警告并拒绝执行；下面是对用户的完整中文版本，**切换前请原样引用对应那一档**，然后等用户明确确认。

### `read-only`（最严格）

> **read-only 是近似，不是真正的沙箱。**
> Antigravity 没有"禁止工作区内写入"的原生旋钮，所以由钩子顶替：变更类工具与灾难性命令会被拒绝，但**普通写入只会变成"必须显式确认"**。这一档的准确含义是 *写入需批准*，而不是 *写入不可能*——这是移植的真实差距，不要粉饰。
> 同时：工作区外文件访问与联网设为 `DENY`，终端命令策略为 `strict`（每条命令都要批准）。

### `workspace-write`（中等）

> **只自动放行开发命令白名单**（`git` / `npm` / `pnpm` / `pip` / `python` / `node` / `cargo` / `go` / `dotnet` / `pytest` / `make` 等），白名单之外仍需批准。
> 终端沙箱开启；工作区外文件访问与联网改为 `ASK`。
> 该档完全由 Antigravity 原生开关承担、钩子关闭，因此**每次工具调用没有额外开销**。

### `danger-full-access`（Full access，最宽松）

> **终端命令不再有任何拦截**（terminal auto-execution = `always-proceed`），工作区外文件访问与联网 `ALLOW`，授权白名单收敛为 `command(*)` / `mcp(*)` / `read_url(*)` / `execute_url(*)` / `read_file(*)` / `write_file(*)`。
> DSH 对上游同档位的原文警告是：它会减少确认步骤、让 agent 直接执行更多动作，包括**敏感操作、文件修改与外部命令**——只在你信任后续任务时启用。

### `auto`（Auto review）

> ⚠ **重要语义差距。**
> DSH 的 auto 档是"无沙箱 + 每次工具调用前由**与当前 agent 相同的模型**逐次审查"。本移植没有可用的一次性模型入口，因此改用**本地确定性正则策略**：免费、离线、约 50ms、可审计。
> 代价：它会**误放行也会误拦截**，并且**比真货更爱打断你**（变更类非命令工具一律 `ask`）。所有日志与文档都称它为 `auto (local policy)`，以免被误认为真货。

### 四档共同的警告

> 切换会**停止并重启 Antigravity**：原生开关只在进程启动时读取，而且运行中的 language server 会覆盖 `config.json`。**正在运行的会话会被中断**。实测一次切换约 **7 秒**（6 秒停机宽限 + 约 1 秒到新进程写出启动日志）；脚本在进程出现即返回，窗口完全可用可能再需几秒。
> 重启必须以**非提权**方式进行——Antigravity 从提权进程启动会在 `requestSingleInstanceLock()` 处静默 `exit 0`，不写任何日志。`agy-tier.ps1` 已处理这一点。

## 完整旋钮映射

| 档位 | `autoExecutionPolicy` | `enableTerminalSandbox` | `nonWorkspaceFileAccessPolicy` | `internetAccessPolicy` | `artifactReviewMode` | 授权白名单 | 钩子 |
|---|---|---|---|---|---|---|---|
| `read-only` | `..._OFF`（strict） | `true` | `DENY` | `DENY` | `ALWAYS` | 只读命令 17 条 + `read_url(*)` | **ON** |
| `workspace-write` | `..._AUTO`（request-review） | `true` | `ASK` | `ASK` | `AUTO` | 开发工具前缀 + `mcp(*)`/`read_url(*)` | off |
| `danger-full-access` | `..._EAGER`（always-proceed） | `false` | `ALLOW` | `ALLOW` | `TURBO` | `command(*)`/`mcp(*)`/`read_url(*)`/`execute_url(*)`/`read_file(*)`/`write_file(*)` | off |
| `auto` | `..._AUTO` | `false` | `ALLOW` | `ALLOW` | `AUTO` | `mcp(*)`/`read_url(*)`/`execute_url(*)` | **ON** |

四档一律 `planningMode = PLANNING_MODE_OFF`（DSH 也没有计划审批这一层）。

钩子只在 `read-only` 与 `auto` 武装，因此这两档之间切换**即时生效**（闸门每次调用都重读 `tier.json`）；另外两档必须重启。

## 落盘位置

| 内容 | 路径 |
|---|---|
| 四级切换器（唯一事实源） | `~\.gemini\config\agy-tier.ps1` |
| 闸门插件 | `~\.gemini\config\plugins\dsh-permissions\`（`plugin.json` / `hooks.json` / `tier.json` / `run-gate.cmd` / `scripts\gate.py`） |
| 插件注册与启停 | `~\.gemini\config\plugins.json`、`config.json` 的 `plugins.dsh-permissions.enabled` |
| 本 skill | `~\.gemini\config\skills\DSHA\` |
| 每次切换的备份 | `~\.gemini\config\_rollback\<时间戳>\` |
| 闸门审计流水 | `plugins\dsh-permissions\logs\gate.log`（>512KB 轮转为 `.1`） |

## 运维陷阱（全部为本机实测）

1. **提权启动会静默失败。** 从提权进程直接 `Start-Process Antigravity.exe`：`ExitCode 0`、无进程、不写 `main.log`、连 profile 目录都不创建。对照实验里唯一有效的方式是经 `explorer.exe` 降权启动。排查时已排除：残留进程、隐藏单实例窗口、`Local\lockfile` 等命名互斥体（`NtQuerySystemInformation` 枚举 18 万个句柄，零命中）、userData 可写性与属主、profile 损坏。

2. **不要在 Antigravity 运行时改写 `config.json`。** 运行中的 language server 拥有它并会在下一次写入时覆盖你。`agy-tier.ps1` 因此总是先停止应用。

3. **钩子 `command` 不能以引号开头，且必须丢弃 stderr。** `cmd /c` 对以引号开头的命令行有引号剥离规则，会把 `"C:\python312\python.exe"`（连引号）当程序名；失败时 cmd 用 OEM 代码页（cp936）写 stderr，而 Antigravity 会把 hook stderr 捕获进 protobuf string value → **非法 UTF-8 → agent executor 崩溃**。所以 `hooks.json` 指向 `run-gate.cmd`（路径无空格、无引号），并在内部 `2>nul`；诊断改由 `gate.py` 以强制 ASCII 写入 `gate.log`。**这个坑曾经把用户的会话弄崩两次。**

4. **"无日志"不等于"没注册"。** 钩子失败会在写日志前就结束，表现为 `gate.log` 毫无记录。要先用 language server 日志里的 `command_hook_executor.go` / `jsonhook.go` 记录区分"没注册"与"注册了但跑失败"。

5. **真实工具名 ≠ 文档推导名。** 文档说工具名 = Cortex 步骤类型去前缀小写，那会得到 `list_directory`；真实 `PreToolUse` 载荷给的是 **`list_dir`**。曾因此把一次合法读取硬拒。现在 `READ_TOOLS`/`WRITE_TOOLS` 收录实测名与别名，且**未知工具改为 `force_ask` 而非 `deny`**——理由是代价不对称：猜错只多一次确认，而硬拒会悄悄让 agent 瘫痪。

6. **改 `tier.json` 不需要重启**，改原生开关必须重启。这是选择切换路径时最实用的一条。

7. **别再用 `Antigravity-Patcher.exe`。** 桌面 `MYSQL\0921\` 下那个 patcher 会改名 `app.asar`、重建 `resources\app` 并往 `preload.js` 注入代码；官方更新会把它整个冲掉一次（已实测），而残留的半成品状态会让应用起不来。本 skill 与 `dsh-permissions` 插件**完全不依赖任何渲染层改动**，所以不怕更新。
