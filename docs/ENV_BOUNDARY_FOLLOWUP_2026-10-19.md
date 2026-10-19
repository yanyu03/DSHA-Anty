# 配置边界补审

日期：2026-10-19。用户要求：继续挖出硬编码、统一环境变量或参数并避免信息暴露。依据：DSHA杨老师模型的配置边界、防御契约、受限子进程和真实证据；普通源码使用Git/Python审查，本轮未运行REA原生目标分析。

## 缺陷及处理

1. 显式DSHA_TIER_FILE不可读、损坏或格式错误后静默回退。改为invalid；现有授权检查拒绝，不提高权限。
2. Codex适配器和MCP客户端私有host错误会输出带路径的堆栈。增加结构检查与CLI受控错误摘要；selftest临时目录跟随所选--host-config，JAVA/Ghidra检测跟随实际生效环境。BaseTool、CF及路由包装层错误仅输出异常类型；厂商原始stdout/stderr和MCP工具结果仍属私有待审输出。
3. REA驱动在版本命令失败时仍打印PASS；无超时、回显路径并宣称未验证能力。改为10秒有界探测，失败非零，仅报告探测结果，provider及分析标为NOT_RUN；运行超时参数必须为正整数，异常摘要不回显路径和值。
4. 脱敏遗漏access_token/client_secret、URL userinfo、含空格Windows用户名和POSIX用户目录。增加对应合成样本及递归字段处理；仍是辅助清理，不保证任意秘密识别。
5. CMD的PowerShell/Bash/Sh忽略PATH并接受目录充当解释器。补PATH发现及目录拒绝；未配置才使用安装位置回退。Scribe/CF默认HOME改用Path.home()，取消当前目录隐式回退。CF默认不测鉴权时标NOT_RUN，修正已找到Wrangler却提示未安装的问题。

Python根脚本与插件分发副本同步维护。协议常量、公开仓库出处、默认受限超时及安全回环地址不是账号机密，不机械移除。私有配置和运行日志不入Git，未修改Zen冻结任务书。

## 实证与未测

修复前6项新测试实际产生11个失败和2个错误（含子样本），原始输出保存在本地忽略目录。没有把这些失败标成已通过。修复后新测试扩为9项，全部通过；覆盖两种CLI各5类host错误、4类tier错误、3类shell的真实CMD发现/拒绝、三个自有包装层异常，以及受控REA探测失败、超时和成功的输出边界。

已有配置测试11通过、执行边界8通过、适配器/MCP客户端6通过；与新增9项合计34项。BaseTool自检15/15、路由自检8/8。第一方54份运行文件/模板字面量检查0命中。具体检查范围继承scripts/check_host_literals.py，不能推论第三方分发、Git历史或任意文档没有秘密。安装后核验另记于本报告收尾。

复现命令：

```text
python -X utf8 scripts/test_configuration_boundaries.py
python -X utf8 scripts/test_env_config.py
python -X utf8 scripts/test_runtime_contracts.py
python -X utf8 -m unittest discover -s codex/skill/scripts -p test*.py
python -X utf8 scripts/check_host_literals.py
```

未测：真实Antigravity安装/重启、跨平台安装、复杂CMD元字符、任意秘密格式、原生目标分析、云账号/外网代理。REA探测的故障注入是合成测试，不能替代真实逆向语义验证。

最可能推翻当前结论的三点：未受检文件仍可能有硬编码；启发式脱敏仍有漏报/误报；只存在文件并不证明解释器或provider真正可用。测试中CMD假exe只用于发现，不宣称它可执行。

回滚：按本轮提交撤回；本机保留更新前技能、host及源码快照备份，禁止以旧整份客户端配置覆盖无关设置。继续更新现有PR #2，不新建重复PR，也不宣称已合入main。
