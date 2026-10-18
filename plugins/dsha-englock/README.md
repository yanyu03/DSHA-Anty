# DSHA-EngLock（独立插件）

工程锁 L1–L9 的**独立钩子载体**。它被拆出来只有一个原因：
`agy-tier.ps1` 每次切换档位都会重写 `plugins\dsh-permissions\hooks.json`（全权档会把它关掉），
所以工程锁不能寄生在那个目录里，否则一换档位就被关掉。

- 校验器与词表仍在 `..\dsh-permissions\scripts\englock.py` 与 `..\dsh-permissions\lexicon.json`（单一源）
- 本插件只负责**在写类工具上触发它**
- 关闭方式：把本目录 `hooks.json` 的 `enabled` 改为 `false`，或删除本插件目录
