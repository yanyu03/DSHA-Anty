# DSHA本地更新与运行缺陷报告

日期：2026-10-19。设备与固件：Windows x64，本调查不涉及固件。基准仓库：用户指定的Desktop/GOOGLE/DSHA，远程https://github.com/yanyu03/DSHA-SharBoy；原main为6274d27e8170f70d547cfa61ab030b299ee4133b，本轮安装源码固定为a605e30c371003ed5a2bb6f551c03d4afd5f43a2。

工具：Python 3.12、Node 24.14.1、REA 6.7.0、Ghidra 12.1.4、JDK 21.0.12.1、Git、unittest。样本：两套重复派发脚本的5项原始失败场景、8项最终回归方法；4项MCP客户端检查、2项适配器检查；1份1024字节自制PE64的单次Ghidra会话。是否实测：本机脚本及REA/Ghidra实际执行，未运行PE样本；不调查Office算法、不执行Cloudflare部署、不改变Antigravity设置。结论强度：列出的局部缺陷已复现并修复，列出的本地验证通过，不构成全套工具或安全边界验收。

## 发现与修复

| ID | 复现事实 | 修复与结果 |
| --- | --- | --- |
| R001 版本探测误放行 | 版本子进程exit=7但stdout带高版本号，PrerequisiteEnv仍给satisfied=true；两份base_tool均复现 | 非零探测退出立即判失败；正向exit=0兼容测试仍通过 |
| R002 上下文覆盖档位 | 实际档位read-only时，context传danger-full-access可让中风险工具继续到执行；使用mock证明调用路径，没有执行真实命令 | 同时约束宿主档位和请求档位；请求只能收紧。测试确认拒绝码126且不启动工具子进程 |
| R003 未知档位误放行 | typo-tier使中风险工具授权通过 | 未知宿主或请求档位拒绝；不把无法识别的标签当授权。读取策略文件失败时的既有回退行为未在本轮扩展审计 |
| R004 隐式代理污染 | 没有配置代理时仍向子进程注入socks5://127.0.0.1:10808 | 去掉默认注入；继承已有环境或采用调用方明确提供的proxy；负向和显式代理正向用例通过 |
| R005 调度异常降级直跑 | router工具简称路径中，Call_Tools抛异常后会直接执行启动器，绕过统一断言 | 异常后返回126并报告拒绝，不启动原始命令。两份router均覆盖 |
| R006 Codex MCP JSON编码 | Windows重定向的工具目录含中文时产生本地编码字节，按UTF-8读取实际失败；原输出用GBK能解析出207个工具 | CLI显式输出UTF-8；重新枚举207个工具可按UTF-8解析。强制ASCII控制台的独立子进程回归通过 |
| I001 本次适配接线错误 | 新增catalog --json最初接到index.py list；该入口忽略--json，返回表格而非JSON，更新后的真实检查发现失败 | 改接支持JSON的base_tool.py list；新增适配器用例；安装后实际JSON为7项。本项是本次集成中发现并纠正的问题，不能归为原先已有缺陷 |

原始5项回归在未修复代码上运行：5个测试方法、两份脚本各一组，共10个失败子用例；修复后8个方法（含3个正向/约束回归）在两份脚本均通过。它们使用模拟版本响应/授权/启动调用，不执行提权或修改目标。顶层与plugins副本同步更新，防止安装路径仍运行旧逻辑。

## 本地安装身份

- 当前依据从旧的governance DSHA 1.3.0切换为指定GOOGLE仓库的固定Git快照；安装副本1840个文件SHA256核对无差异。源码留在技能扫描目录外，Codex适配技能在~/.codex/skills/dsha。
- 上游VERSION写1.0.0，README标题写2.2.0且带其他组件版本。未擅自给上游重新编号；本机明确记录VERSION=1.0.0、源码提交a605e30、Codex adapter=2.0.0。版本文案统一作为待维护项，不能称已修复。
- REA从独立6.4.0前缀切换到独立6.7.0前缀；npm明确请求rea-agents@6.7.0，省略可选依赖且禁用安装脚本。注册表给出的包完整性为`sha512-yhIx2ioJYYT1C/tONfYeitC6LhnKmCh+ZwRUOgYuhSc733lGhkkt73zhug9WmLgxoMdKuqIYGCoBfD4fXkOhFw==`。同版本标签不表示仓库内嵌包与npm载荷逐文件相同。
- host.json和Codex配置均先备份；对配置只替换rea的args[0]运行时路径，解析后的其他字段保持相同。旧技能、host、配置和运行时保留。没有全局PATH/权限/电源/Antigravity配置更改；没有替换Zen额度门禁或冻结任务书。
- 新增catalog/route只做目录查询与建议，不自动执行推断的意图。源哈希异常时适配器拒绝启动；用临时自制清单和篡改样本验证拒绝且未启动子进程。

## 实际验证

| 检查 | 本次结果与限制 |
| --- | --- |
| scripts/test_runtime_contracts.py | 8方法通过，逐一覆盖两份脚本；修复前失败日志保留本地 |
| codex/skill/scripts/test_mcp_client.py | 4通过，含延迟请求/错误恢复与UTF-8输出；假服务器测试不是Ghidra验收 |
| codex/skill/scripts/test_adapter.py | 2通过：JSON入口和源漂移阻断；真实目录JSON另读到7项，中文路由选择rea且无替换字符 |
| 已安装dsha.py selftest | gate 62通过/0失败（隔离副本），englock 30/30，base_tool 13/13，router 8/8 |
| 既有index selftest、skill integration | 本轮分别8/8、14/14；integration会临时改tier文件，本次结束原内容一致，后续应优先隔离副本运行 |
| 技能语法与源身份 | quick_validate通过；1840文件哈希无差异 |
| REA scoped doctor | 指定ghidra时healthy=true，10项scope检查均true；environment_healthy=false反映未安装的其他引擎，不能隐去或称全环境健康 |
| 实际MCP/原生分析 | 207工具；8项REA操作完成；自制PE的伪代码return 0x2a，汇编MOV EAX,0x2a / RET；目标前后哈希一致、样本未执行、close_binary完成 |

PE SHA256：`4e163bdc1a2834bc95e5c7c273dd102451e01b2d2dae3454e853270248acce06`。原生伪代码证据`ev_132e913d081735ee60e503002e21b31f50c0b967a5ffe53b9053a4cf16c2d9ec`；汇编证据`ev_49745400a00bc07babf4a07a4a4906aade6d071ef05ac3c3ebacd25480ee8f15`。实际会话12.297秒；原始JSON、stderr、清单和备份仅留本地，不上传账号、配置原文或机器日志。

原生验证器的自动状态为OPERATIONS_COMPLETED_SEMANTICS_REVIEW_REQUIRED，本轮随后人工读取上述伪代码/汇编、版本及身份完成语义复核；没有将工具退出成功直接作为反编译正确性证据。当前桌面已连接的MCP不宣称热更新，独立新客户端实际验证了6.7.0，新连接使用更新注册。

## 复现与撤回

在固定提交的仓库根，用Python运行scripts/test_runtime_contracts.py、codex/skill/scripts/test_mcp_client.py、codex/skill/scripts/test_adapter.py；源码base_tool.py/router.py/index.py的selftest按本报告范围运行。运行gate或integration前复制到独立目录，避免暂改活跃tier；不要以gate.py --selftest代替真正的selftest.py。

本机适配器用host.json指定的Python运行dsha.py status、verify-source、selftest、catalog --json、route <意图> --json。MCP用mcp_client.py --list检查实际目录。真实原生复现用verify_native.py --output <全新目录>；只处理自行生成的PE，不替换成未指定目标。明确GHIDRA_INSTALL_DIR与JAVA_HOME，不做无边界doctor后把未安装引擎当本轮失败或忽略其缺失。

仓库中的codex/skill是适配模板；本机部署须先备份、固定Git快照、由该快照生成逐文件source-manifest.json并配置host.json。它不是下载后无需环境配置即可执行的成品。更新后再核对源清单、独立运行时版本、实际工具Schema和本报告范围的验证。

撤回保留当前证据后恢复2026-10-19首次更新前的技能/host备份，并仅将现行Codex配置中rea运行时路径改回旧版；不能用旧整份配置覆盖后来的无关设置。代码回退按提交撤回，冻结输入与旧证据不删除。尚未做模拟断电/安装中断恢复验收。

## 尚未解决及最可能推翻结论的三点

1. 本地档位与风险标签只约束这条调度路径，不是通用沙箱；低风险工具参数、策略文件失效默认行为、任意绕开启动器、Windows批处理参数边界尚未全面审计。
2. 一个自制PE只证明当前Windows/Ghidra链路的这一条路径；Frida、浏览器、Android、IDA、其他原生后端和真实大目标未验收，可选依赖未安装不能冒称支持。
3. 源码镜像与两套脚本今后可能再次漂移，VERSION/README命名仍不一致；Git固定提交、重复副本回归与本地哈希只能发现所列范围的变化，不能证明没有其他暗病。
