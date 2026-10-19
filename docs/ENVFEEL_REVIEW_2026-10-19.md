# EnvFeel实现实况

日期：2026-10-19。目标：将“先感知、定位、激活、自检，通过才执行”变为DSHA执行路径中的环境门禁。范围为当前维护分支、Codex适配器和BaseTool；原生第三方直调不因此自动受控。

## 变化

- 新增EnvFeel声明依赖入口，运行时OS/架构识别，绝对工具路径解析，同一子进程环境贯穿探测、健康检查和执行。
- 未知组合、缺失依赖、错误覆盖、仅有数字版本的不足身份契约、健康检查失败均拒绝，任务NOT_RUN；execute不接受旧READY作为通行证。
- Codex适配器执行动作接入启动检查；BaseTool保留权限、最低版本、目标边界并追加环境准备与实际健康样本。无最低版本不再等于只看文件存在。安装闭包补齐新模块依赖。
- 公共结果只给阶段与状态；实际位置和任务原始输出可写新建私有*.local.json，不更改全局环境。

## 验证

本轮52项unittest通过：EnvFeel 10、配置11、配置边界9、执行边界9、环境盘点6、适配器/MCP客户端7。EnvFeel覆盖未知OS、未知架构、缺失依赖、健康失败、数字版本不足、旧READY复用拒绝、无版本要求仍需启动、环境字典隔离、CLI真实执行及输出私有化、BaseTool未知平台不拉起任务。

失败样本以任务标记文件不存在或subprocess未被调用作为“不执行”证据，不仅检查返回文案。实际Windows根脚本BaseTool自检15/15、Index自检8/8，安装器语法解析0错误；58份第一方运行文件/模板扫描0命中，Codex技能quick_validate通过。

真实中间失败：新增品牌校验使原测试中不含Node标识的纯数字stdout在两个副本上拒绝。将正样本修正为实际Node的v前缀，并新增“纯数字必须拒绝”负样本，没有放宽品牌契约。子环境HOME改造中曾在显式配置分支过早求HOME，导致缺HOME的既有测试1项异常；修复为优先解析显式配置，不改测试条件。

复现：

```text
python -X utf8 scripts/test_envfeel.py
python -X utf8 scripts/test_env_config.py
python -X utf8 scripts/test_configuration_boundaries.py
python -X utf8 scripts/test_runtime_contracts.py
python -X utf8 scripts/test_environment_smoke.py
python -X utf8 -m unittest discover -s codex/skill/scripts -p test*.py
python -X utf8 scripts/base_tool.py selftest
python -X utf8 scripts/index.py selftest
```

## 边界与回滚

未知OS/架构为受控模拟，真实环境仅Windows x64；Linux/macOS未做本机端到端验证。不声称能在无法启动引导Python的OS自举，不做硬件真实性认证。品牌版本和已有小样本只覆盖明确条件，不替代项目依赖、SDK链接、原生逆向、服务端和账号验收。仅数字版本的工具在盘点中仍可出现，EnvFeel未提供充分身份契约时拒绝执行。

回滚使用本轮前技能/host备份及旧固定源码快照，保留本轮证据；不覆盖整份客户端配置、不强推main。源码测试和安装验证分别记录，后续安装证据追加，不回改历史实测含义。
