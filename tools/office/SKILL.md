---
name: hamasaki-office
description: Local read-only OOXML DOCX XLSX PPTX inspection
license: MIT
---

# Office Tool

Local read-only OOXML DOCX XLSX PPTX inspection. The tool is registered alongside DSHA tools, not a document engine.

Upstream reference: https://github.com/microsoft/markitdown

Local status: python3 tools/office/adapter.py status
Actual Office/Markdown inspect: python3 tools/office/adapter.py inspect <file>
WPS requires an installed local WPS desktop and pywpsrpc; otherwise fail closed.
