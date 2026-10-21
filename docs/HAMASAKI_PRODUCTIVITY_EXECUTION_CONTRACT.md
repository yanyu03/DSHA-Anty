# Hamasaki default Tools contract — remediation stage 2

The original `BaseTool.TOOL_REGISTRY` contained seven builtins; the three productivity peers were present only in Linux planning metadata. This stage registers Markdown, Office and WPS as ordinary `BaseTool` entries under `Productivity`, adds fixed launchers in `bin/`, and routes their **read-only status** through a pinned, hash-verifying tool bridge (`scripts/hamasaki_builtin_tool.py`). Main branch remains unchanged.

**No new document engine, no additional platform layer**. The bridge is an ordinary Tool entry executable with independent risk and hash identity checks.

Important fail-closed constraint: real `inspect`, edit, write, macro execution and other document-bearing actions still report `ERR_SANDBOX_NOT_VALIDATED` from `Call_Tools`. They are **not** silently executed on the host. This closes a mismatch in registration without falsely claiming a production-suitable Office document sandbox.

The standalone `tools/{markdown,office,wps}/adapter.py` files still support laboratory read-only inspect directly, but those direct CLI paths should only be used with trusted test fixtures until OS sandbox validation is complete.

Smoke: `python3 -m unittest discover -s scripts -p test_hamasaki_productivity_execution.py -v`; `python3 scripts/index.py get markdown`; `python3 scripts/index.py call markdown status`.

Source baseline: the `dsha-core`, `hamasaki-security` and three `Productivity` Tool pin groups must match **all** files. The entrypoint refuses `status` when any builtin pin is invalid.

Subsequent work: verify real Bubblewrap, file mount confinement, Linux WPS GUI RPC and input file CPU/memory budgets, then expand permitted verbs one at a time with isolated tests.
