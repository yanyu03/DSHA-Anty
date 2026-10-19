# DSHA-SharBoy · 开源许可证与第三方声明 (Open Source Notices & Attributions)

本项目依据 **MIT 许可证** 开源发布。以下列出项目所引用、启发或协同工作的第三方开源组件及知识产权声明。

---

## 1. 核心许可证 (Primary License)

DSHA-SharBoy 核心套件（包括 `DSHA-Gate`, `DSHA-EngLock`, `DSHA-Meter`, `BaseTool`, `DSHA-Index`, `DSHA-Router`, `The Scribe` 等组件）均在 [LICENSE](LICENSE) 文件的 MIT 许可证条款下提供。

---

## 2. 启发与致敬声明 (Inspirations & Acknowledgements)

- **DeepSeek Harness**  
  项目四级权限档位模型（`read-only` / `workspace-write` / `danger-full-access` / `auto`）与本地门禁策略引擎的思想发轫于 DeepSeek Harness 开源实践。
- **Programer 系统级代码思维体系**  
  系统底层穿透律、防御性契约设计、高内聚切面与五步启发教学范式，来源于资深系统级工程体系的脱敏与蒸馏沉淀。

---

## 3. 第三方组件与协同工具说明 (Third-Party Ecosystem)

- **Reverse Engineer Anything (REA)**  
  逆向分析模块与工具集来源于 `morluto/rea` 开源项目，遵循 MIT License。
- **PowerShell 7 (pwsh)**  
  PowerShell 跨平台自动化引擎由 Microsoft Corporation 依据 MIT License 开源。
- **Cloudflare Wrangler CLI & Workers SDK**  
  Cloudflare 边缘计算与部署工具链遵循 Apache-2.0 / MIT License。
- **GNU Bash & POSIX 工具链**  
  用于 Windows 环境防咬人终端的 GNU Bash、Git 工具由 Git for Windows 社区维护（遵循 GPLv2 / LGPL 规范）。

---

## 4. 纯净运行时与合规边界 (Runtime Decoupling & Compliance Guarantee)

DSHA 恪守 **“不臃肿合并外部运行时 (No Bundled Runtimes)”** 的工程洁癖原则：
1. 仓库本体不打包、不随附、不分发任何第三方 GPL 二进制分发包或大型运行时；
2. 宿主环境通过 `PrerequisiteEnv` 与 `HostEnvPerceiver` 在本地执行动态触探与安全寻径；
3. 执行时通过单向参数包络（`ExecutionEnvelope`）实施进程级隔离调用，杜绝任何许可证传染或静态绑定风险。
