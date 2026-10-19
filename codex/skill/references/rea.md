# REA 分支 —— 逆向一切（Reverse Engineer Anything）

> DSHA 的**第三条分支**。前两条是「权限档位」（能不能做）与「工程锁 L1–L9」（做得对不对）；
> 本条管「**要不要动逆向工具、动哪一个**」。
> 上游：[morluto/rea](https://github.com/morluto/rea)（MIT）｜本机版本：`rea-agents` **6.4.0** + Ghidra **12.1.4**

本分支只在**结论依赖"出厂产物"而不是"可读源码"**时进入。它不是"分析代码"的同义词——
读一个完整源码仓库用普通工具，不要碰这条分支。

---

## 一、什么时候进这条分支

| 触发 | 例子 |
|---|---|
| 目标只有二进制/安装包，没有源码 | 已安装的商业软件、DLL/EXE、APK、IPA、MSIX |
| 结论必须来自反编译或反汇编 | "这个功能的入口函数在哪""这段算法怎么算的" |
| 需要读**打包产物内部的资源与声明** | PE 资源/类型库、ASAR、ZIP/APK 成员、firmware |
| 需要被动观察**运行时**（不注入、不改目标） | 浏览器页面、Electron 页面、Node/Electron Inspector、HAR 抓包 |
| 需要和某个**版本**的行为做差异对比 | 升级前后、两版 DLL 的接口差异 |

## 二、什么时候**不要**进

| 情况 | 该用什么 |
|---|---|
| 有完整可读源码，普通架构分析 | 普通仓库工具，**不要**做 REA 就绪检查、不要开 provider |
| 只是想知道某个字符串在不在文件里 | `Select-String` / `findstr` 级别的本地扫描即可 |
| 目标未指定（"我的应用"但没名字/路径） | **先问用户是哪个应用**，不要自己挑一个 |
| 只想验证文件完整性（哈希、大小、版本） | 普通文件工具；只有需要**资源级**身份才用 `inspect_pe_resources` |

**关键区分**：REA 的价值在"证据链"，不在"跑得快"。轻量问题用它反而更慢（见第四节成本表）。

---

## 三、按目标选工具（决策表）

用**实际已注册的工具名**（Antigravity 里形如 `mcp__rea__<工具名>`）；不要调用列表里没有的工具。

| 目标 | 首选调用 | 之后 |
|---|---|---|
| 原生 EXE/DLL、分析数据库 | `open_binary` | `binary_session` 看可用性 → `binary_overview` 侦察 → 聚焦工具 |
| PE 资源类型/名称/语言树、图标组 | `inspect_pe_resources`（**无需**开目标） | 需要具体函数时再 `open_binary` |
| PE/CLI 托管程序集（.NET） | `inspect_managed_artifact` | `inspect_managed_members` → `inspect_managed_native_boundaries` |
| API/COM 类型库声明 | `inspect_pe_resources` 取 TYPELIB 证据 → 本地提取载荷 | 类型库读取要用 `LoadTypeLibEx(REGKIND_NONE)`，**不注册库** |
| 归档/安装包成员清单（ZIP/APK/IPA/MSIX/AppX/DMG） | `open_binary` 绑定目标 → `inspect_artifact` | `extract_artifact` 需要用户指定新目录 |
| Android APK 代码 | `inspect_android_package` | `search_android_classes` → `inspect_android_method` → `trace_android_references` |
| ASAR / 解包后的 JS/Electron 树 | `analyze_javascript_application` | `inspect_analysis_view` 分页看模块 |
| 已打开的浏览器页面 | `list_browser_targets` | `inspect_web_page`（被动）／`capture_browser_scenario`（受控回放） |
| 已打开的 Electron 页面 | `list_electron_targets` | `inspect_electron_page` |
| Node/Electron 运行时进程 | `list_javascript_runtime_targets` | `observe_javascript_runtime`（被动，不求值） |
| HAR / mitmproxy 抓包 | `inspect_web_network_capture` | 按记录序号取，**不重放 URL** |
| firmware 镜像 | `inspect_firmware_regions` | `extract_firmware`（Linux + 自带 binwalk/unblob） |
| Linux ELF 布局/符号 | `inspect_binary_layout`（**只支持 Linux x64**） | —— |
| Linux 崩溃转储（core） | `inspect_recorded_crash` | —— |
| Android 真机/模拟器 | `list_adb_devices` | `pull_adb_package`、`read_adb_logcat`、`capture_adb_screen` |
| 需要留证据/收尾 | `export_evidence_bundle`、`get_evidence_bundle`、`record_unknown` | 未知项**必须**落 `record_unknown`，不要口头带过 |

**本机实测的两个能力边界**（写死在这里，别再试）：

1. **`inspect_binary_layout` 对 PE 直接拒绝**：provider 是 `pwntools-elf`，只支持 Linux x64，
   返回 `capability_unavailable`。Windows PE 的结构分析改用 `inspect_pe_resources` + 本地 pefile。
2. **Windows Ghidra P0 没有写权限**：`annotate_native_function` 返回 `available:false`
   （*"Windows Ghidra P0 does not admit database mutation"*）。**只能只读分析**，不能改函数名/注释，
   分析库是临时库、目标字节永不被写。

---

## 四、成本与超时（必须先看，再动手）

| 事实 | 数值 |
|---|---|
| 单个 9 MB PE 的 Ghidra 首次导入 | **约 433 s**（实测 `wpsapi.dll`） |
| 单个 36 MB PE 的完整自动分析 | **1879.4 s ≈ 31.3 分钟**（实测 `etmain.dll`：252 254 个函数 / 64 610 个字符串） |
| 43–46 MB 的更大 DLL | 按比例 **30–40 分钟以上** |
| CLI 每次调用 | 独立进程，**每次重新导入**（90 分钟内 `--snapshot` 不会省下这一次导入） |
| MCP 会话 | 一次 `open_binary` 建会话，后续 `search_strings` / `decompile` / `xrefs` 复用同一份已分析状态 |

**由此得出的三条硬规则：**

1. **大批次必须走 MCP 会话，不要走 CLI**。一次 31 分钟的分析要支撑几十次查询才划算；
   用 CLI 一个模块问三个问题 = 一个半小时。
2. **开大目标之前先告知预计耗时**（含数量级即可），或在用户不知情时**先用小目标侦察**
   （先 `inspect_pe_resources`，它不需要开 provider、秒级返回）。
3. **同一目标的多问题合并成一次会话一次问完**。会话超时在本机已放宽到 90 分钟
   （`REA_GHIDRA_STARTUP_TIMEOUT_MS=5400000`），不是 60 秒。

---

## 五、本机环境（Anty 这台机器）

| 项 | 值 |
|---|---|
| REA 运行时 | `rea-agents@6.4.0`，全局安装于 `%APPDATA%\npm\node_modules\rea-agents\` |
| Node | `C:\Program Files\nodejs\node.exe`（24.14.1） |
| Ghidra | `C:\Users\Administrator\Desktop\MYSQL\MTK8400\rea_workspace\ghidra_12.1.4_PUBLIC` |
| JDK | `C:\Program Files\Eclipse Adoptium\jdk-26.0.2+10` |
| Antigravity 的 MCP 注册 | `~\.gemini\config\mcp_config.json` 的 `mcpServers.rea`，由 `agy-rea.ps1` 维护 |
| 工程环境包装 | `rea_workspace\rea-env.ps1`（设置 provider/超时变量） |

**依赖不是可选项**：MCP 子进程的环境变量会被清洗，`GHIDRA_INSTALL_DIR` 与 `JAVA_HOME`
必须显式写进 `mcpServers.rea.env`，否则 provider 不可用。**Ghidra 目录被移动或删除 →
工具还在，但原生分析会报 `provider_unavailable`。**

自检（只读，随时可跑）：

```powershell
pwsh -NoProfile -File "$env:USERPROFILE\.gemini\config\agy-rea.ps1" -Status
```

---

## 六、会话纪律（省时间，也省掉重做）

```text
open_binary            ← 绑定目标（提供本地路径；不要用"附近的文件"当目标）
binary_session {}      ← 看 provider 与工具可用性（返回 tool_availability）
binary_overview        ← 概览：段/函数数/字符串数/编译器线索
search_strings / search_procedures / list_procedures / list_strings
analyze_function / procedure_pseudo_code / procedure_assembly
xrefs / procedure_callers / procedure_callees / trace_feature
close_binary           ← 调查结束就关，别把会话挂着
```

1. **先摘要后细节**：默认结果很小；大结果（JS 应用图、ELF 布局）先用 `detail:"summary"`，
   再用 `inspect_analysis_view` 按页看。
2. **不重复分析**：同一目标同一问题不要跑第二遍；结果被截断时用保留的
   `parent_evidence_id` 去看小视图，或 `export_evidence_bundle` 导出完整证据。
3. **不做无依据的扩大**：运行时工具会**真的执行目标**（浏览器/Electron/进程捕获），
   目标与动作不得超出用户要求的范围。
4. **字符串命中 ≠ 行为结论**。字节串只能提供代码线索；行为必须由函数语义、
   引用关系或运行时观测佐证。

### 两个已经踩过的坑（同类任务直接复用）

| 坑 | 现象 | 正确做法 |
|---|---|---|
| `search` 默认 **literal** 模式 | `search <文件> "A\|B\|C"` 把整串当字面量 → **0 命中**，极易误判为"文件里没有这些字符串" | 显式加 `--mode regex`；先用本地字节扫描交叉确认，再花时间做原生导入 |
| 把"存在"当成"可用" | TYPELIB 里声明了某个成员 → 直接写进结论"支持该功能" | 声明面（类型库）/ 文档面（官方帮助）/ 运行面必须分开写；只有实测才能升为"可用" |

---

## 七、与工程锁的衔接（收尾前自查）

REA 的产出天然是"证据型报告"，因此工程锁几乎全部适用：

| 锁 | 在逆向任务里的具体动作 |
|---|---|
| **L1 出处锁** | 每条结论后挂 Evidence ID（`ev_…`）或文件+偏移+哈希；推算值标 `[EXTRAPOLATED]` |
| **L2 样本锁** | "验证/证明"必须配样本量；单个模块分析一遍 = **单次观测**，不是"已验证" |
| **L3 撤回锁** | 推翻旧结论时写"撤回：<旧结论>（时间/轮次）" |
| **L4 三件套锁** | 报告 + **复现命令** + **回滚方式**（回滚 = 关会话/删临时分析库，目标字节本就不被动） |
| **L5 报告头锁** | 日期 / 目标与版本+哈希 / 工具与版本（REA 6.4.0 + Ghidra 12.1.4）/ 样本数 / 是否实测 / 结论强度 |
| **L6/L9 措辞锁** | 不写"完全掌握""彻底逆向"；写"已定位到 X，函数体 N 字节，调用关系未验证" |
| **L8 外部审查锁** | 对外发布前列出 3 个最可能被推翻的点（典型：间接调用未解、字符串无引用证明、声明≠实现） |

**强制区分三档措辞**（这是逆向任务最容易翻车的地方）：

| 证据来源 | 只能说 |
|---|---|
| 字节串 / 资源 / 类型库成员 | **"静态声明存在"** |
| 反编译伪代码 + 引用链 | **"已定位到可疑实现，函数体 N 字节"** |
| 实际运行观测（含对拍） | **"单次观测"**（n=1），复测后才谈"稳定" |

---

## 八、收尾产物模板

```markdown
# <目标> 逆向结论 — <日期>

**目标**：<文件/包> ｜ 版本 <x.y.z> ｜ SHA256 <全量 64 位>
**工具**：REA 6.4.0 + Ghidra 12.1.4（provider=ghidra，只读）
**样本**：<分析了几个模块 / 几次运行>
**是否实测**：静态分析（未启动目标）／含运行时观测（已启动，n=…）

## 已确认（带 Evidence ID）
- [ev_…] ……

## 定位到但未验证
- ……

## 否定结论（已验证"这里找不到"）
- ……

## 未知项（已 record_unknown）
- ……

## 复现命令
……

## 回滚方式
……
```

---

## 九、相关

- 权限档位（能不能做）：本目录 `SKILL.md` §四个档位
- 工程锁全文：本目录 `engineering-lock.md`；语言锁：`language-norm.md`
- 机器可读路由表：本目录 `rea-routing.json`（按目标类型 → 首选工具 → 成本）
- 上游文档：<https://github.com/morluto/rea>（Windows Ghidra 支持仍是**实验性只读**边界）
