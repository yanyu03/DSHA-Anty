# DSH Permissions

把 **DeepSeek Harness 的四级权限预设**移植到 Antigravity 上的独立插件。

## 为什么需要它

DSH 把权限建模为**两个正交旋钮**——文件系统 **sandbox** 与 **approval policy**——
并打包成具名预设（见 `@deepseek-ai/dsh-permission-presets`）。本机部署配置了四级
（`dsh-base/cordis.patch.yml:232-241`，`~/.dsh/settings.yaml` 的
`permission.defaultPreset: danger-full-access`）：

| 预设 | sandbox | approval | 客户端标签 |
|---|---|---|---|
| `read-only` | read-only | ask | — |
| `workspace-write` | workspace-write | ask | — |
| `danger-full-access` | danger-full-access | never | Full access |
| `auto` | 无沙箱 | 逐调用模型审查 | Auto review |

Antigravity 把同一片地皮摊在三个原生开关加一套生命周期钩子上，所以每一级都要在
**两处**落地：`~/.gemini/config/config.json` 的原生开关，以及本插件的
`tier.json`（闸门状态）与 `hooks.json`（是否武装）。

## 目录

```
~/.gemini/config/plugins/dsh-permissions/
├── plugin.json          # 清单（Antigravity 只认 name 字段）
├── hooks.json           # PreToolUse 钩子；enabled 由档位决定
├── tier.json            # 当前档位；每次调用即时生效，无需重启
├── rules/AGENTS.md      # 注入给模型的准则
├── scripts/gate.py      # 闸门本体
├── scripts/selftest.py  # 四档 + 协议健壮性自测（37 例）
└── logs/gate.log        # 审计流水，超 512 KB 轮转
```

## 用法

```powershell
pwsh -File agy-tier.ps1 read-only
pwsh -File agy-tier.ps1 workspace-write
pwsh -File agy-tier.ps1 danger-full-access
pwsh -File agy-tier.ps1 auto
pwsh -File agy-tier.ps1 -Status
pwsh -File agy-tier.ps1 -SelfTest
```

切换器每次都会把 `config.json` / `plugins.json` / `tier.json` / `hooks.json`
备份到 `~/.gemini/config/_rollback/<时间戳>/`。

**钩子只在 `read-only` 与 `auto` 两档武装。** `workspace-write` 与
`danger-full-access` 完全由原生开关表达，关掉钩子意味着它们**每次工具调用零额外
开销**——上一版插件每调用 spawn 一个 Python 进程，那本身就是"墨迹"的一部分。

## 与 DSH 的语义差距（必读）

这不是逐位对齐的移植，两处必须知道的差异：

1. **`read-only` 只是近似。** DSH 用真实文件系统沙箱**阻止**写入；Antigravity
   没有"禁止工作区内写入"这个旋钮。本插件用钩子顶替：灾难性命令与变更类工具
   直接 `deny`，而**普通写入走 `force_ask`**（等价于 DSH 的升级确认），因为这里
   没有东西能真正阻止它。所以本档的准确含义是"写入需显式确认"而非"写入不可能"。

2. **`auto` 不是模型审查。** DSH 的 auto 档无沙箱，且**由与当前 agent 相同的模型
   逐次裁决**。本移植改用**本地确定性正则策略**：免费、约 50 ms、离线可审计，
   但会比真货**更频繁地打断你**（尤其对变更类非命令工具一律 `ask`），且两个方向
   都可能误判。所有日志与文档一律称它为 `auto (local policy)`，避免被误认为真货。

## 两个必须记住的运维事实

以下 1–4 每一条都在本机实测过，不是推测。

### 1. 绝不可从提权进程启动 Antigravity

本轮实测：从**提权的 PowerShell** 直接 `Start-Process Antigravity.exe`，应用会
在 Electron 的 `app.requestSingleInstanceLock()` 处拿不到锁，**静默 `exit 0`**——
不写 `main.log`、不加 `ELECTRON_ENABLE_LOGGING` 也无任何输出、连 profile 目录都不
创建。它看起来完全像"什么都没发生"。

对照实验（同一台机器、相邻时刻）：

| 启动方式 | 结果 |
|---|---|
| 提权 `Start-Process` | `ExitCode 0`，无进程，无日志 |
| 提权 + `-WorkingDirectory` 指定安装目录 | 同上 |
| 全新 `userData` 目录 + 提权 | 同上 |
| **经 `explorer.exe` 降权启动** | **7 个进程，正常运行** |

因此 `agy-tier.ps1` / `agy-tier.ps1` 在检测到提权时会经 `explorer.exe`
把启动交给中等完整性级别的交互式 shell（等同于开始菜单点击）。
排查时排除过的方向：残留进程、隐藏单实例窗口、`Local\lockfile` 等命名互斥体、
userData 可写性与属主、profile 损坏——**都不是原因**。

### 2. 不要在 Antigravity 运行时改写 config.json

运行中的 language server 拥有该文件并会在下一次写入时覆盖你。切换档位前必须先停止
应用——这正是 `agy-tier.ps1` 自动做的，而且它现在会以降权方式把它重新拉起来。

### 3. `hooks.json` 的 `command` 不能用引号开头，且必须丢弃 stderr

这一条踩得最惨，代价是**把用户的 agent 会话搞崩两次**。完整因果链：

```
hooks.json 写成  "C:\python312\python.exe" "…\gate.py"
  → Antigravity 经 cmd /c 执行；cmd 对"以引号开头"的命令行有引号剥离规则
  → cmd 把 `"C:\python312\python.exe"`（连引号）当成程序名 → 找不到
  → cmd 用控制台 OEM 代码页（这里是 cp936）写错误到 stderr
  → Antigravity 把 hook stderr 捕获进 protobuf string value
     （language_server 的 command_hook_executor.go:75 有 `JSON hook command stderr: %s`）
  → GBK 字节不是合法 UTF-8
  → agent executor 崩溃：
     proto: field google.protobuf.Value.string_value contains invalid UTF-8
```

两个必须遵守的规则：

- **`command` 字段不要以引号开头。** 现在指向 `run-gate.cmd`——路径无空格、无引号，
  cmd 能直接执行；解释器路径放在 `.cmd` 内部。
- **hook 的 stderr 要么是纯 ASCII，要么丢弃。** `run-gate.cmd` 用 `2>nul` 丢弃它。
  诊断信息没有丢：`gate.py` 把自身异常以**强制 ASCII** 写进 `logs/gate.log`。

还有一个致命的行为细节：**Stderr 崩溃会连 gate.log 一起吞掉**。钩子运行失败、进程
在写日志之前就结束，于是 gate.log 完全没有记录——表现为"钩子好像根本没被调用"。
我自己就先误判成"插件包的 hooks.json 没被注入"，后来用一次非法 matcher 探针才纠正：
往 `~/.gemini/config/hooks.json` 与 `~/.gemini/config/plugins/<name>/hooks.json`
各放一个非法 RE2 matcher，**两处都被加载**（`jsonhook.go:390` 分别报错）。
**"无日志"不等于"没注册"**——要先用 `command_hook_executor.go` / `jsonhook.go`
的 stderr 记录区分这两种失败。

### 4. 真实工具名 ≠ 文档推导出的名字

内置文档说工具名是 Cortex 步骤类型去掉 `CORTEX_STEP_TYPE_` 前缀再小写，那会得到
`list_directory`。**但真实 `PreToolUse` 载荷给的是 `list_dir`**，于是 `read-only`
档按"未知工具一律 deny"的逻辑**把一次合法读取硬拒了**——只有真实载荷能暴露这一点。
现在：

- `READ_TOOLS` / `WRITE_TOOLS` 收录**实测名**（`list_dir`、`view_file`）与二进制里
  出现的别名（`read_file`、`create_file`、`grep_search`、`code_search`、
  `manage_task`、`execute_url`、`multicall` …）
- **未知工具改为 `force_ask`，不再 `deny`**。理由是权衡方向不对称：`READ_TOOLS`
  猜错只多一次确认，而在 read-only 档对未知名字硬拒会**悄悄让 agent 瘫痪**；
  确认是可恢复的，硬拒不是。

## 协议

Antigravity 的钩子契约（`PreToolUse`，内嵌文档原文）：

- **stdin**：camelCase protojson，公共字段 `conversationId` / `workspacePaths` /
  `transcriptPath` / `artifactDirectoryPath` / `modelName` / `stepIdx`，
  外加 `toolCall.name` 与 `toolCall.args.CommandLine`
- **stdout**：`decision` ∈ `allow` / `deny` / `ask` / `force_ask`，加 `reason`
  与 `permissionOverrides[]`（临时授权）
- `force_ask` 会**无视"Always Allow"缓存**强制弹窗——`read-only` 档要的就是它
- `command` 在 Windows 上经 `cmd /c` 执行，工作目录为 `hooks.json` 所在目录

闸门始终输出**纯 ASCII 的单个 JSON 对象**（`ensure_ascii=True`），stdin 则按原始
字节读入再按 UTF-8 解码——避免控制台代码页（cp936）污染协议与非 ASCII 命令。
