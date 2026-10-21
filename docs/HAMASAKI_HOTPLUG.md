# Hamasaki Tools Hotplug v0.3 (Linux)

Drop in a reviewed tool adapter; tool catalog reloads on every request without a host restart. Files are parsed as data, never imported during discovery. Changing any package file invalidates approval. A removed folder disappears from the next scan.

Default root: ~/.local/share/hamasaki/tools/ (override HAMASAKI_TOOLS_DIR). Default approval DB: ~/.config/hamasaki/tool-approvals.json.

Example ext-demo/hamasaki-tool.json:
```json
{"schema":"hamasaki.tool/v1","id":"ext-demo","name":"Demo","version":"1","entry":"main.py","keywords":["demo"],"actions":{"status":{"risk":"read-only","argv":["status"],"timeout":5}}}
```

Entry `main.py` must be in the same folder. Unknown .exe/npm/zip integrations need an explicit reviewed Python wrapper and manifest, not blind execution. All commands are predefined; writable/admin actions unsupported.

```sh
sh bin-linux/hamasaki tools list
sh bin-linux/hamasaki tools inspect ext-demo
sh bin-linux/hamasaki tools approve ext-demo --sha256 DIGEST --acknowledge-code-risk
sh bin-linux/hamasaki plan 'ext-demo status' --json
sh bin-linux/hamasaki tools run ext-demo status
sh bin-linux/hamasaki tools revoke ext-demo
```

Actual invocation requires bubblewrap: no user home, no network, read-only host mount, isolated snapshot, fixed args, timeout. If unavailable there is NO unsafe host fallback. This is defense in depth, not a guarantee that arbitrary third-party code is safe; inspect source before approval.

Current limitations: original Oyasmi code not migrated, no full Kaeru Call_Tools adapter parity, no real KDE/bwrap acceptance, only read-only Python actions. Scanner rejects symlinks, traversal, >128 files, and >32MiB packages. Already-running calls may finish after removal; subsequent calls revalidate hashes.