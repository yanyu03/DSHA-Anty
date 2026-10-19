# Codex local integration

Basis: Desktop/GOOGLE/DSHA and its Git remote yanyu03/DSHA-SharBoy. Deployment pins a source commit and generates references/source-manifest.json from that installed snapshot; do not distribute an old machine's source lock. host.json records the DSHA VERSION label, source commit, adapter version and exact REA runtime identity.

Keep source under ~/.codex/tools/dsha outside skill discovery. Use a separate Python environment and versioned REA npm prefix with existing JDK/Ghidra. Do not run the Antigravity installer, alter approval settings, install hooks, change global PATH or restart applications. Catalog/route only select tools. DSHA meter estimates do not replace official Codex quota readings. Tier checks are local dispatch checks, not an OS sandbox or replacement for client permissions.

After runtime updates inspect actual tools/list and schemas, then qualify an owned synthetic PE64 through a separate MCP session. File presence and tool counts alone do not prove provider readiness. Only after qualification update this host's rea entry. Existing clients may need a fresh connection; do not claim they hot-reloaded.

Checks: dsha.py status, verify-source, selftest, catalog --json, route <intent> --json; scripts/test_mcp_client.py; source scripts/test_runtime_contracts.py. Gate selftests run in an isolated plugin copy because they rewrite tier.json. Keep raw logs, configuration backups and host.json local; publish sanitized findings and reproducible tests.

Rollback: preserve current state, restore the exact backed-up skill and host.json, then replace only the rea runtime argument in current Codex configuration. Do not overwrite unrelated later configuration with an entire old backup. Retain previous runtimes, source snapshots and evidence.