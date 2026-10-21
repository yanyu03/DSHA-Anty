# Hamasaki v0.6-pre — Markdown, Office, WPS as DSHA Tools

**Architecture unchanged:** three peers in the existing DSHA Router `EXTENSIONS` and `Productivity` category, not a document kernel. `scripts/router.py`, `scripts/index.py` and original Kaeru `main` are unchanged.

| Tool | Source research | Local adapter | Readiness |
|---|---|---|---|
| markdown | markdown-it MIT, implemented using markdown-it-py | heading outline and basic checks | local read-only smoke PASS |
| office | microsoft/markitdown MIT, python-docx, openpyxl, python-pptx | local OOXML docx/xlsx/pptx inspection only | local read-only smoke PASS |
| wps | Bwkyd/wps-skills MIT instructions and timxx/pywpsrpc MIT Linux WPS RPC adapter | detects local WPS binaries, pywpsrpc, GUI | no WPS runtime in test container, correctly refuses |

Upstream references pinned during research: Bwkyd/wps-skills@50b04859b7768ed23477d7d2af9b8fb83b27adf3, timxx/pywpsrpc@c930c7c19584b51d9d67e452321bbcd8da6f9190, microsoft/markitdown@69e208746aa5804087e9984d585eab21667e9b0f.

The popular Anthropic docx/pptx/xlsx `skills/` code includes restrictive proprietary licenses; their materials were **not** vendored, copied or included. WPS instruction repository is not the same thing as a runnable WPS RPC integration and contains prompts + embedded examples, not a ready-made standalone runtime.

Local CLI smoke:
  python3 tools/markdown/adapter.py status
  python3 tools/markdown/adapter.py inspect README.md
  python3 tools/office/adapter.py status
  python3 tools/office/adapter.py inspect file.docx
  python3 tools/wps/adapter.py status
  python3 -m unittest discover -s scripts -p test_hamasaki_productivity.py -v

**Identity:** each tool `adapter.py`, `manifest.json`, `SKILL.md` file gets a pinned Git blob hash in `config/hamasaki_builtin_pins_v1.json`; identity layer hashes the content into SHA-256 Tool UID and Productivity category UID. Source updates are review events, not silent trust.

**Safety:** no network or in-place modifications in pilot adapters; no macros executed. File validation is intentionally preliminary; these adapters are not yet mounted in a verified Bubblewrap/DSHA Call_Tools execution gate. They are registered for **planning** and separately smoke-tested, not production execution.

**Remaining:** Windows Office COM, actual Linux WPS RPC, document creation/editing (needs write gates), full end-to-end permission checks. No new general Doc Engine or changes to DSHA protocol hierarchy.
