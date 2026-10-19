# EnvFeel项目能力：让实际环境回应

日期：2026-10-19（Asia/Shanghai）。设备与固件：本机Windows x64，固件未采集。工具与版本：Python3.12.14、Node24.14.1、DSHA本机适配器2.5.0；真实测试包为TypeScript5.9.3、React/react-dom19.2.0、Vue及renderer3.5.22。样本数：22项新增测试、72项既有回归，合计94项独立测试通过；安装源码另复跑22项，不重复计入94。是否实测：是，本机源码与安装后的入口均实际执行。结论强度：上述项目能力挑战和拒绝范围通过，不等于完整项目构建、浏览器交互或恶意包身份认证。

实测功能提交：0e2c614d5e99107622e1b4e939c62d1f7dc36bb8（079ec23实现，0e2c614固定复现锁）。首轮本机部署固定此提交，1873个源码文件哈希全部一致；后续报告提交只增加证据，功能身份仍单列。机器可读结果与日志哈希：[证据清单](ENVFEEL_PROJECT_REPLY_2026-10-19.json)。测试包只装在忽略的隔离目录；没有修改全局Node/npm包、系统环境或用户项目，没有启动Office、REA、云端部署，也没有修改Zen任务书。

## 从声明到实际回答

旧测试中，要求TypeScript／React／Vue会被当作未知需求拒绝；若只要求Node，虚假的package.json仍可能到任务导入阶段才失败。这次增加三个有明确范围的项目能力契约：必须声明所需能力与绝对项目根，自动加入Node；先通过工具检查，再实际解析、加载项目依赖和运行新挑战，只有全部正确才启动后续任务。

| 能力 | 环境必须实际回答什么 | 本机观测 |
| --- | --- | --- |
| TypeScript5/6 | 编译严格类型自有程序；错误赋值必须得到2322并拒绝输出；运行生成JS核对随机算术 | 5.9.3 PASS |
| React18/19 | 实际React与同版本react-dom将新挑战渲染为预期HTML | 19.2.0 PASS |
| Vue3 | reactive/computed变更结果及同版本renderer的SSR HTML都正确 | 3.5.22 PASS |
| 只有依赖清单，没有三个实际包 | PACKAGE_NOT_FOUND；任务标记不得产生 | 安装后的组合调用REFUSED / NOT_RUN，退出126，标记未产生 |
| 版本空壳或固定渲染旧标记 | 身份、API或挑战结果不符就拒绝 | 三类自有假包均阻止后续任务 |

项目外祖先包不会成为当前项目的就绪证据；未知版本契约、缺失／相对项目根、无效参数覆盖、畸形／陈旧回复和超时拒绝。普通Node要求保持原范围，不自动把任意框架列为必需。DSHA_PROJECT_ROOT和--project传参共用，错误参数不回退；私有环境文件可显式提供项目根。前端调用子环境移除NODE_OPTIONS/NODE_PATH；父映射不变。探测只运行自有样本，不调用项目npm scripts或tsconfig插件，不自动安装。

## 失败先保留，再修正

初版18项测试实际16通过、2失败：Vue的server-renderer导出入口是包装层，向上寻找元数据时拿不到实际@vue/server-renderer身份，导致真实Vue及三能力组合误拒绝。随后改为从实际Vue入口解析其renderer依赖，再核对版本和行为。原失败日志保留并列SHA256；最终22项0失败0跳过。这里没有把真实误拒绝写成包缺失，也没有降低“加载实际renderer”的条件。

最后22项包含真实编译／SSR、三个清单缺包、三类假包、项目外解析拒绝、父环境保持、参数优先级、环境文件、执行前重查、CLI公开输出脱敏／私有证据、畸形／过期回复、模拟探测超时及实际卡住的自有模块超时。模拟超时与实际0.2秒上限的Node子进程实验分开记录；不声称已停止未知库自行派生的外部后代。

既有回归：test_env*.py共47项（含20项此前Windows极端矩阵），Codex适配器／MCP客户端7项、runtime_contracts9项、configuration_boundaries9项，总72项通过。94项中不含历史结果拼接。固定依赖锁包含27个实际安装依赖；首轮安装使用--ignore-scripts，未执行安装生命周期。已选入口／清单SHA256仅写私有回执，公开JSON不含本机目录、环境原值或任务stdout/stderr。已检查62份第一方运行／模板文件，已知机器字面量规则0项发现；技能格式校验通过，二者不等于任意秘密识别或运行正确性证明。

## 复现

在一个新的私有目录复制scripts/fixtures/frontend-reply的package.json和package-lock.json，使用明确的实际Node/npm执行`npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org`。锁文件仅固定测试依赖身份，没有将node_modules加入Git。设置DSHA_NODE为实际Node，DSHA_TEST_FRONTEND_PROJECT为此绝对目录，再运行：

```text
python scripts/test_project_probe.py
python -m unittest discover -s scripts -p "test_env*.py"
python -m unittest discover -s codex/skill/scripts -p "test*.py"
python -m unittest discover -s scripts -p test_runtime_contracts.py
python -m unittest discover -s scripts -p test_configuration_boundaries.py
python scripts/check_host_literals.py
```

不提供真实测试项目时，正向用例会明确skip；不能拿有跳过的运行代替本报告的22项全执行。实际使用安装入口：

```text
python <skill>/scripts/dsha.py envfeel --require typescript --require react --require vue --project <absolute-project> --private-output <new-receipt.local.json> --run node -- <owned-script>
```

首轮安装后此命令返回COMPLETE，三个能力分别PASS；任务确实输出ENVIRONMENT_REPLIED，仅保留在私有回执。对应缺包调用返回PACKAGE_NOT_FOUND，task=NOT_RUN，后续标记不存在。安装的插件脚本入口另做Vue就绪检查，通过，避免根目录能跑而分发缺模块。源文件清单及本机技能已备份；未改MCP注册、应用权限或全局PATH。

## 回滚和限制

公开分支可按提交撤回本轮源码／技能说明／安装分发改动，保留失败和证据。部署前备份包含技能与host.json；本机回滚只恢复这一对匹配备份并核对其源清单，不用整份旧客户端配置覆盖后来改动。测试依赖和证据留在忽略目录，不递归清除用户工程。

最可能推翻结论的三点：行为一致的恶意包仍可能模拟协议，哈希／版本不是发布者认证；简单类型样本和SSR不代表项目级typecheck、生产打包、SFC或浏览器验收；项目外链接、PnP、纯ESM专用包、TypeScript7及未来版本不在本契约中，当前只在Windows x64实际测试。探测实际执行项目依赖代码，EnvFeel不是隔离恶意代码的沙箱，也不保证检查与后续执行间无文件变化。

API依据：[微软TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)、[React renderToStaticMarkup](https://react.dev/reference/react-dom/server/renderToStaticMarkup)、[Vue renderToString](https://vuejs.org/api/ssr.html#rendertostring)。这些是接口依据，实际通过结论来自本报告的独立样本与运行日志。
