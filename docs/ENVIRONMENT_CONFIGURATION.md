# 配置边界与隐私输出

本轮按杨老师模型，把宿主配置与执行规则分开：参数明确意图、解析器统一优先级、无效配置拒绝、句柄由上下文关闭，再以独立输入验证。源码中的常量并非全部需要搬走：格式名称、协议常量、公共项目出处与本机身份不同；安全默认值也不能因为可配置而失去约束。

配置优先级为显式参数、对应DSHA环境变量、PATH及标准系统目录发现。显式无效的解释器覆盖不得静默换成另一程序。没有自动读取.env文件；.env.example仅列出可选项，不要把空值整批导入环境。每个进程只设置需要的项，私有配置保存在版本控制之外。

| 配置 | 环境变量或参数 |
| --- | --- |
| Python/Node/PowerShell/Bash/Sh/Git | DSHA_PYTHON、DSHA_NODE、DSHA_PWSH、DSHA_BASH、DSHA_SH、DSHA_GIT；Python发现接口也可传explicit/custom_paths |
| 其他外部工具 | DSHA_WRANGLER、DSHA_CF、DSHA_CLOUDFLARED；不自带账号、不自动登录或部署 |
| Antigravity配置根 | DSHA_CONFIG_DIR；安装器和agy管理脚本也支持ConfigDir参数；默认从当前用户HOME派生 |
| Codex运行配置 | CODEX_HOME、DSHA_HOST_CONFIG或dsha.py --host-config；DSHA_REA_ENTRY覆盖REA入口；JAVA_HOME、GHIDRA_INSTALL_DIR等进程环境覆盖私有host记录 |
| 启动器源码/驱动 | DSHA_SCRIPT_DIR、DSHA_REA_DRIVER；默认相对启动器定位 |
| 网络代理 | DSHA_PROXY或调用上下文proxy，继承已有HTTP_PROXY/HTTPS_PROXY/ALL_PROXY；不注入固定本机端口 |
| Scribe/Meter数据位置 | DSHA_BRAIN_DIR、DSHA_PRESENCE_DIR、DSHA_SCRIBE_CACHE、DSHA_METER_CONFIG、DSHA_WORKERD_DIR |
| Meter本地服务 | DSHA_METER_HOST、DSHA_METER_PORT；默认保留原回环地址/端口，可选空闲端口0；拒绝非回环地址，不开放遥测到局域网 |
| 指定运维对象 | DSHA_EXTRA_HOOK、DSHA_PATCHER_PATH、DSHA_ANTIGRAVITY_EXE；没有配置就不扫描旧机器的私人工作目录 |
| 权限配置 | DSHA_TIER_FILE；显式设置但文件缺失、损坏、空值或结构错误时返回invalid并拒绝执行，不回退到auto |
| REA任务超时 | DSHA_REA_TIMEOUT；正整数秒，默认180；非法值拒绝，不回显输入。--self-test版本探测固定10秒上限，不等于真实分析超时 |
| 本地路径诊断 | DSHA_SHOW_PATHS=1仅用于明确的本机调试；默认CF状态和Scribe导出不打印宿主路径。此开关不取消凭据脱敏 |

PowerShell脚本通过bin/dsha-env.ps1取配置；安装分发包含该助手和Python dsha_env.py，避免开发环境能跑、安装后缺依赖。安装预演在自制临时位置实际验证不创建配置目录。Bash缺失时明确失败，不再把Bash代码交给cmd执行。

Cloudflare status默认只检查本机运行时，不查询或回显whoami账号。需要网络鉴权探测时显式使用status --check-auth，输出仅摘要。用户明确调用whoami等厂商命令的原始输出不属于自动公开报告，执行工具输出仍需按目标范围审查。

Scribe缓存和简报增加常见用户目录、Bearer和命名凭据字段脱敏。它是辅助清理，不是任意文本的秘密识别保证；分享前仍审查产物。已有私有日志不递归改写。原始工具stdout也不能被当作已脱敏材料直接提交Git。

chatgpt/mcp_config.json及钩子JSON是模板，客户端不一定支持环境占位符替换，不能把模板原样作为已配置结果。用以下命令把实际值渲染到忽略的私有新文件：

```text
python scripts/render_mcp_config.py --node <解释器绝对路径> --rea-entry <REA入口绝对路径> --output <新的client.local.json>
```

也可提前设置DSHA_NODE与DSHA_REA_ENTRY，省略对应参数。渲染器独占创建，不覆盖原客户端配置；stdout和失败提示不回显参数值。将生成的单个MCP条目合入目标客户端时保留其他配置。钩子由安装器按所选ConfigDir生成真实路径；公开模板不含用户名。

复现：python scripts/test_env_config.py、scripts/test_runtime_contracts.py、codex/skill/scripts/test_adapter.py、codex/skill/scripts/test_mcp_client.py；静态检查python scripts/check_host_literals.py。机器字面量检查限定列出的第一方运行文件与模板，不扫描第三方REA dist、测试构造、完整Git历史或任意二进制；输出只有位置和规则名。研究文档中的历史版本、哈希与公开仓库出处保留，不将它们计作运行配置。

回滚按提交撤回本轮改造；本机技能、host和源快照另有更新前备份。不用旧整份客户端配置覆盖后续无关改动。此次未运行真实Antigravity安装/重启、Meter GUI/HTTP端到端或Cloudflare账号操作；这些与解析、模板渲染和目录查询的通过结果分别记录。

后续补审增加scripts/test_configuration_boundaries.py：私有host配置失败输出、权限配置拒绝、REA探测失败/超时/证据边界、URL凭据及用户目录脱敏、真实CMD的PATH发现与显式目录拒绝。CMD PowerShell/Bash/Sh按显式环境、PATH、安装位置依次解析，不再只依赖标准安装位置。REA自定义驱动仅报告版本探测是否完成，不发布原始版本stdout、宿主路径或“零崩溃”等未经验证结论；厂商分析命令原始输出仍需单独审查。
