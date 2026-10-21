# Hamasaki v0.5 — local privacy / hashchain / zero-trust adapter
Baseline: 3740327f371606194fae039e88a28e3ab18b0b7b

Every original built-in and the DSHA control files are pinned to immutable Git blob objects in config/hamasaki_builtin_pins_v1.json. At runtime, bytes are compared to the pinned Git objects; each tool obtains a SHA-256 content-addressed identity with separate namespace and logical ID. Categories receive a domain-separated SHA-256 over their sorted active tool IDs. An updated plugin automatically receives a new identity but **never automatically becomes trusted**; the existing content hash approval gate remains mandatory.

Data flow: Alias or sha256 reference → verify core pins → route → bound Tool SHA256 → bound Category SHA256 → EnvFeel → PLAN_ONLY / ERR_BLOCK. Receipts contain tool/category/registry hashes but no prompt, args, stdout, environment, user path, or secrets. All operations are local-only; neither scanning nor hashing uses network.

Plugin runner: per-execution private snapshot, Bubblewrap namespaces, no networking, no inherited secrets or proxy, **NO full-host ro-bind** (old implementation was unsafe), fixed read-only declared action, bounded timeout/output and no raw stdout/stderr returned. Missing Bubblewrap or nonstandard interpreter means fail closed. No arbitrary downloaded binary runs just because it has a hash. Offline hashing cannot prove source authenticity. Supply chain verification needs signed release/index with out-of-band trust anchor.

Known limitations: No actual Bubblewrap/KDE acceptance run on user's host, no Cloudflare live auth, no complete retrofit of legacy BaseTool TraceReceipt (legacy still records args in other execution routes). Hamasaki v0.5 intentionally does not execute legacy BaseTool tasks, so it does not claim global zero-privacy for old Kaeru. Core pin manifest lives in the same repository and does not prevent a malicious editor from replacing both pins and code: use signed releases later.

Validate: python3 -m unittest discover -s scripts -p 'test_hamasaki_identity.py' -v ; python3 -m unittest discover -s scripts -p 'test_hamasaki_sandbox.py' -v ; sh bin-linux/hamasaki identity --json.

## Protocol reachability

`sh bin-linux/hamasaki identity --json` prints the current hash identities and their states. `sh bin-linux/hamasaki plan sha256:<full-tool-uid> --json` routes by the hash, not by classification. Plans include `tool_uid`, `category_uid` and a hash-only DSHA receipt. `verify_receipt` checks receipt checksum and current registry membership; it is **not cryptographic signing** and cannot grant execution privileges. Use an out-of-band signed distribution root for producer identity.

Pinned baseline now includes the actual REA driver (`skills/reverse-engineer-anything/tools/rea/dsha_rea_driver.py`), Scribe plugin mirror, and five central DSHA core control files, in addition to seven built-in tool manifests. Altering any pinned file blocks the v0.5 execution gate; no silent repinning or automatic trust on plugin upgrade.
