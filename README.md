# DSHA-SharBoy V1.0

> **Kaeru Local 参考分支**：本分支提供面向本地 Agent 的适配指南和真机验收清单，不改变 DSHA 执行内核，也不代表 Linux/Office/WPS 已完成实机适配。请先阅读 [Kaeru Local 使用说明](KAERU_LOCAL.md) 与 [本地 Agent 规则](AGENTS.md)。正式 V1.0 发布仍见下方原有链接。

面向本地 AI 开发工作流的工具调度与工程记录套件。

**发行版本：V1.0** · 机器版本：`1.0.0` · 主要验证环境：Windows x64

[下载 V1.0](https://github.com/yanyu03/DSHA-SharBoy/releases/tag/V1.0) · [发行说明](docs/releases/V1.0.md) · [更新记录](CHANGELOG.md) · [MIT 许可证](LICENSE)

## 提供的功能

| 模块 | 用途与边界 |
| --- | --- |
| Gate | 本地权限档位及调用策略；不替代宿主权限或操作系统隔离 |
| EngLock | 工程报告、措辞和证据记录检查；不证明结论正确 |
| Meter | 根据可用宿主记录展示用量估计；以服务商官方额度为准 |
| Programer | 配置边界、输入契约、资源管理和验证指导；不分发课程全文 |
| Index / Router / BaseTool | 工具目录、依赖探测、路由、执行结果及收据；按声明条件检查 |
| Scribe | 本地日志整理和研究简报；收录范围需要明确配置 |
| REA 接入 | 对明确目标进行分析；工具、提供者和目标仍须单独验证 |

开放协议保留其独立标识 `v1.2.0-std`，这是本项目的接口规范版本，不是发行版本，也不表示外部标准组织认证。见[协议说明](DSHA_OPEN_PROTOCOL_SPEC.md)。

## 下载与安装

发行页提供 `DSHA-SharBoy-V1.0-source.zip`、`DSHA-SharBoy-V1.0-source.tar`、`SHA256SUMS.txt` 和 `SOURCE_MANIFEST.json`。ZIP 与 TAR 包含同一提交的源码，根目录统一为 `DSHA-SharBoy-V1.0/`。它们是源码分发包，不是独立可执行安装包。

解压后，先阅读[安装教程](安装教程.md)并预演：

```powershell
powershell -NoProfile -File .\install.ps1 -WhatIfOnly
```

确认目标目录、宿主及依赖后，可手动运行安装与检查：

```powershell
powershell -NoProfile -File .\install.ps1
powershell -NoProfile -File .\verify.ps1
```

运行脚本仍受本机执行策略限制。安装器、验证脚本可能写入本机配置；源码下载本身不会安装或修改环境。

## 环境与外部工具

- 第一方 Python 工具以 Python 3.10+ 为基础；部分 Codex 适配器工作流要求 Python 3.11+，以具体入口要求为准。
- REA 运行需要 Node.js；原生分析提供者可能另需 Java、Ghidra 等。
- PowerShell、Bash、Cloudflare 等按实际任务安装和配置。下载依赖、更新工具及远程服务可能需要网络。
- Codex 入口说明位于 `codex/skill/`；复制提示词或安装技能不自动授予本机工具、MCP 或更高权限。
- 工具被发现、版本探测成功、功能样本通过是不同证据。主分支不自动包含维护分支的所有修复。

## 验证与已知范围

本次发行只执行发行说明中列出的源码和包装检查。测试项数、跳过项和未测范围分别记录，不以旧报告或文件存在代替运行结果。Windows 以外环境、全新机器安装、真实账号服务及任意第三方项目不作通用可用性承诺。

版本与证据：[发行说明](docs/releases/V1.0.md)、[版本方案](VERSION_SCHEME.md)、[Programer 来源](docs/PROGRAMER_PROVENANCE.md)。

## 许可证与第三方

第一方代码按 [MIT](LICENSE) 提供；第三方文件保留其自身许可证。仓库含 REA 的 JavaScript 分发文件及包装器，不含本机 Node.js、Java、Ghidra、VS 或 Rust 安装环境。第三方来源、随附与外部调用的区别见 [NOTICE.md](NOTICE.md)。名称调整不授予第三方资料权利，也不删除 Git 历史。
