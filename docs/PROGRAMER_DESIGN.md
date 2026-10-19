# Programer 模块设计

目的：提供不依赖个人姓名和课程语料的DSHA工程审查入口。模块独立整理配置、输入契约、资源、执行状态和实证要求。

入口为skills/DSHA/programer.md，规范为docs/PROGRAMER_MINDSET.md。Codex适配器从固定提交加载它们；Scribe产物、REA包装器和公开提示词统一使用Programer名称。

先确认对象与范围，识别失败边界，再实施有限改动并验证。说明围绕用户目标，不要求模仿讲师口吻、复现课程案例或固定修辞。验证深度与变更风险相称。

迁移前的课程全文和蒸馏正文只保留本地备份，不随当前分支或新安装快照分发。历史报告名称归一不表示旧实验重新执行。来源与历史边界见docs/PROGRAMER_PROVENANCE.md。
