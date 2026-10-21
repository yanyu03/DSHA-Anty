---
name: hamasaki-wps
description: WPS Office for Linux runtime readiness; no actual application execution
license: MIT
---

# WPS Tool

WPS Office for Linux runtime readiness; no actual application execution. The tool is registered alongside DSHA tools, not a document engine.

Upstream reference: https://github.com/timxx/pywpsrpc

Local status: python3 tools/wps/adapter.py status
Actual Office/Markdown inspect: python3 tools/wps/adapter.py inspect <file>
WPS requires an installed local WPS desktop and pywpsrpc; otherwise fail closed.
