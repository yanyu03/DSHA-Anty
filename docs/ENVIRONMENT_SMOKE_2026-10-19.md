# DSHA本机开发环境冒烟

日期：2026-10-19。环境：Windows x64。执行源码：e5c49ee8c63c1f42059f255a1cf1d5bd86e1406b，Codex适配器2.2.0，Programer规范。结果来自已安装适配器的inventory入口；结构化原始摘要见同目录ENVIRONMENT_SMOKE_2026-10-19.json，不含真实工具路径或厂商原始stdout。

## 实测结果

27项允许列表版本探测，19项PASS，8项NOT_DISCOVERED。发现工具不等于所有开发任务可用；仅下列五项另做了自制样本冒烟。

| 环境或工具 | 实测版本 | 功能样本 |
| --- | --- | --- |
| Python | 3.12.14 | 执行自制程序PASS |
| Node.js | 24.14.1 | 执行自制程序PASS |
| npm / npx | 11.11.0 | 版本探测；包安装NOT_RUN |
| Rust / Cargo | 1.99.1 | rustc编译并执行自制程序PASS；Cargo项目构建NOT_RUN |
| rustup | 1.29.1 | 版本探测 |
| Java / javac | 21.0.12.1 | 编译并执行自制类PASS |
| .NET SDK | 10.0.402 | 版本探测；项目构建NOT_RUN |
| MSVC | 19.51.36260 | 自制C源码编译生成对象PASS；C链接NOT_RUN |
| MSBuild | 18.11.0.47511 | 版本探测；项目构建NOT_RUN |
| CMake | 4.3.1-msvc1 | 版本探测；项目配置/生成NOT_RUN |
| Ninja | 1.13.2 | 版本探测；项目构建NOT_RUN |
| Git / GitHub CLI | 2.55.0 / 2.102.0 | 版本探测；身份信息未收集 |
| PowerShell | 7.6.5 | 版本探测 |
| Bash / Sh | 5.3.15 | 版本探测 |

未发现：Go、GCC、Clang、GNU Make、Docker CLI、SQLite CLI、uv、ADB。仅表示本轮配置、PATH及SDK候选未发现，不证明未安装。未穷举全部磁盘、注册表、GUI程序或第三方目录。

## 配置与真实边界验证

- 已安装适配器按私有host及当前进程环境准备子进程，环境文件提供DSHA_GIT和DSHA_RUSTC，实际输出确认两键被采用。
- 显式--binary提供Node路径，结果标parameter；Python由DSHA_PYTHON选择，Java由host环境派生的PATH找到。没有硬写本机用户名或盘符。
- 通过vswhere发现VC安装位置，以该作用域的VSINSTALLDIR找到MSVC/MSBuild/CMake/Ninja，结束恢复进程环境，不更改系统/用户环境。第一次仅按PATH及普通位置发现时遗漏这些工具；补SDK发现后再做实际探测，未将第一次遗漏宣称未安装。
- 已安装入口另做三个实际负向/优先级样本：无效DSHA_NODE返回INVALID_OVERRIDE；有效显式参数覆盖该无效环境；将Python解释器当Node传入返回FAIL。均符合预期，没有靠替换默认工具制造通过结果。
- 六项新增配置测试与既有34项回归通过，共40项；55份第一方运行文件/模板字面量检查0命中。技能quick_validate通过。

功能样本均在自有临时目录生成并按作用域清理，无项目源码或真实目标修改。版本探测超时10秒，单条功能命令超时45秒。版本格式检查能力有限；未展示身份品牌的工具明确标version-format-only，不将其等同于完整真实性验证。

## 后续使用与保管

```text
python <skill-dir>/scripts/dsha.py inventory --smoke --env-file <private.env> --private-output <new-inventory.local.json>
python <skill-dir>/scripts/dsha.py inventory --tool node --binary node=<executable>
```

参数优先于进程环境，进程环境优先于显式环境文件，再进行PATH/SDK发现。环境文件仅接受说明中的KEY=VALUE，不执行或展开内容，不自动搜索邻近.env。无效显式覆盖拒绝，私有清单独占新建，公开结果不回显路径、配置值或原始错误内容。

本轮工具实际解析位置保存在本机verification目录的私有*.local.json，host.environment_inventory指向该清单并记录采集时间。该指针便于后续查询，不自动加载旧路径或宣称永久可用，工具升级/环境变化后应重新识别。源码快照1854文件哈希一致，客户端注册和REA版本保持原状态。

未测范围：完整.NET/CMake/MSBuild项目、C链接、Cargo项目依赖构建、Docker守护进程、真实云服务、原生逆向语义、全磁盘完整性。回滚可恢复本轮前技能/host备份及旧源码快照，保留本轮私有证据；不覆盖整份客户端配置或改写远程main。
