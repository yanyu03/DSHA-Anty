# Hamasaki v0.2 — Oyasmi-compatible Linux microarchitecture scaffold

Base: Kaeru (DSHA-SharBoy) main cfd166a; branch hamasaki. Original Oyasmi source unavailable; this is an independent reconstruction, NOT source migration or proven feature parity.

## Hand-drawn routing sketch → a bounded one-pass decision pipeline

Agent -> DSHA-Index -> DSHA-Router -> rank -> policy gate -> selected-only EnvFeel -> Choose-Tool -> TraceReceipt / ERR_BLOCK -> Stop.

The sketch includes parallel Tool-list, EnvFeel, Choose-tool, If-Env-True, ERR_BLOCK, Bash/Pwsh/Cmd and retry paths. Consolidating decision logic prevents repeated probes and uncontrolled raw-shell fallback.

## Implemented now

- Reuse Kaeru router.TOOL_REGISTRY as the single source for existing seven tools; add Linux-specific GitHub, KDE/Dolphin, package source, Python/PyPI planning metadata.
- Route by explicit tool, filename, extension and bounded keyword matches. No-match returns ERR_NO_MATCH, never a default tool.
- Lazy EnvFeel: check only the winning candidate's declared runtime, not all tools.
- In-process TTL capability cache (15 seconds). Every CLI invocation starts cold; the cache never grants permission.
- Fail closed for unknown tiers, and for modifying requests in read-only before any runtime probe.
- Structured errors and planned receipts. NO command execution, silent Bash fallback, package changes, repository pushes, credential reads or system privilege escalation.
- Feature parity, OS-level isolation, actual speedup and live KDE behavior are NOT YET VERIFIED.

## Read-only usage

    sh bin-linux/hamasaki plan "github repository status" --json
    sh bin-linux/hamasaki plan "KDE Dolphin" --json
    sh bin-linux/hamasaki catalog --json
    python3 -m unittest discover -s scripts -p 'test_hamasaki_pipeline.py' -v

## Next audited migration

1. Audit local Oyasmi snapshot later (install.sh, verify.sh, agy-tier/agy-meter.py, GitHubTool, KDE, APT/Neon/PyPI/npm, POSIX fixes).
2. Implement Linux native adapters behind existing DSHA Index/Call_Tools + Gate/EngLock + evidence receipts, never independent raw-shell permission bypass.
3. Add explicit approval for writes, package sources and remote mutations; independently test OS sandbox boundary, rollback, timeouts and failure injection.
4. Benchmark on the real Linux/KDE host before claiming measured latency or correctness.
5. Batch changes; preserve main; no PR, release or force push automatically.
