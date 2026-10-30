# DeepInfer Architecture Dissection / 全量开发研究索引

> 状态：研究计划已建立；逐批执行。此分支只记录可审计研究文档，不直接修改 DSHA 的代码与运行权限。

## 研究对象与边界

- 源码：<https://github.com/deepseek-ai/DeepInfer>（每轮必须记录实际审查 commit SHA）
- 对照：<https://github.com/yanyu03/DSHA-SharBoy> 的 `fatfish` 分支（仅只读对照；该分支由其他任务负责实际迭代）
- 目的：完整梳理公开源码的**架构、最小执行链、关键模块、设计取舍、可移植理念、测试方法**，而非直接移植 GPU 大规模推理代码。
- 重要边界：公开版重点是离线推理引擎；官方明确指出完整 KV 缓存服务、E/P/D 拆分及多副本负载均衡未全部包含。文档不得凭设计说明把缺失源码写成“已公开实现”。
- 许可：DeepInfer Apache-2.0；研究与复用须保留来源/适用许可，避免直接挪用大段实现。

## 研究原则（逐批、小步、证据优先）

1. 每轮**一个明确问题/一个核心子系统**，优先 1–3 个核心文件（大文件只读关键函数链），不以扫完整仓的速度充当质量。
2. 使用固定源码快照（具体完整 SHA）核验路径、符号、调用关系；如上游更新，区分“原基线研究”和“增量变化”。
3. 证据等级：**S 源码可证实 / D 官方文档声明 / I 工程推断 / H 待验证假设**。不同等级不可混为一谈。
4. 对每一部分给出：功能边界 → 入口和出口 → 数据结构/状态 → 最小伪代码 → 时序与不变量 → 失败与恢复 → 性能/复杂度 → 测试证据 → DSHA 迁移价值/成本/风险。
5. 不能运行真实 GPU 集群测试时明确标注“未运行”；可以提供模拟/单元测试方案，但不可将理论推导写成实测。
6. 外部依赖、vendor、缺失闭源服务记入覆盖清单，逐项说明适用范围；“全量”指有审计覆盖与结论，不等于逐行复制第三方源码。
7. 不读取、提交任何密钥、Cookie、服务商凭据；不在本分支新增执行权限、联网执行器或生产代码。
8. 每轮校验目标分支最新 HEAD；若并发变化，重新读取并合并文档后再提交，冲突则停止，不 force push。

## 阶段规划

| 阶段 | 研究主题 | 关键产出 |
| --- | --- | --- |
| P00 | 版本锚定、源码目录树、许可、依赖、公开边界 | SOURCE_BASELINE、覆盖矩阵 |
| P01 | 最小执行链：entrypoint、LLM、LLMEngine、worker | 最简调用图、可运行链/缺口 |
| P02 | Scheduler、Sequence、BlockManager、生命周期 | 请求状态机、资源准入与回收 |
| P03 | CPU/GPU 异步调度、延迟释放、取消与竞争 | 时序图、竞态风险表 |
| P04 | 结构化输出、采样、协议编码边界（含 recipe） | 输入/输出契约和兼容性策略 |
| P05 | 确定性、批次不变性、回归和观测 | 测试清单、可复现实验 |
| P06 | Python/C++ 边界、配置、构建、测试、CI | 模块最简骨架、依赖与扩展点 |
| P07 | 分布式、并行、算子、硬件适配及发布范围 | 不可移植项/抽象可复用项 |
| P08 | 外部组件与官方设计文档、缺失部分、版本演进 | 证据缺口与非开源功能清单 |
| P09 | DSHA fatfish 映射、实验提案、收益风险排序 | MIGRATION_BACKLOG、总报告 |

每个阶段可拆多批。上一阶段出现关键阻断，允许局部插入溯源补批；不允许凭想象跳过验证。

## 批次文档标准

每轮写入 `docs/research/deepinfer/batches/Bxxx-<topic>.md`：

```yaml
batch: B001
phase: P00
source_repo: https://github.com/deepseek-ai/DeepInfer
source_commit: <full_sha>
research_branch: research/deepinfer-architecture
examined_paths: []
evidence_level: S/D/I/H
tests: not_run | simulated | passed | failed
status: complete | partial | blocked
```

正文顺序：问题 → 已确认事实 → 源码路径/符号/行范围 → 最小结构或伪代码 → 时序/状态 → 反例与失效条件 → 对 DSHA 的适用性（直接借鉴/改写借鉴/不适合） → 可证伪测试 → 尚未覆盖项 → 下一批。

## 持续维护文件

- `INDEX.md`：整体导航、进度、最近批次
- `COVERAGE.md`：仓库目录与模块覆盖矩阵、未读/已读/需复核/未公开
- `ARCHITECTURE.md`：基于证据不断汇总的系统视图和最简链
- `EVIDENCE.md`：源码、文档与推论证据锚点
- `IDEAS.md`：可移植原则、不可移植技术及理由
- `MIGRATION_BACKLOG.md`：映射 DSHA 的建议、成本、风险、验收设计
- `batches/`：每次增量审查原始记录（不可用综合报告覆盖历史证据）

## 首批任务

B001：固定 DeepInfer 源码 SHA，建立完整一级和二级目录分类；读 README、LICENSE、构建文件、离线示例，提取最小启动路径及未开源边界。交付覆盖矩阵初版，不做 fatfish 代码修改。
