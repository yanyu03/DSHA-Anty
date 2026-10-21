# Hamasaki staged remediation — 2026-10-21

Baseline `bd46846dc40abdbd4cfcf5d8e268661addfd3d28`. Scope: **hamasaki branch only; main unchanged**.

## Step 1: confirmed issues reproduced before change
- `get_active_tier()` returned `auto` on missing config instead of refusing.
- TraceReceipt persisted raw `args`, reproducible commands, caller and host identity.
- Caller-supplied `trace_id` could contain path separators and TraceStore used it in a filesystem path.
- `custom_env` appended arbitrary keys, potentially loader hooks and token overrides.
- CF CLI dispatch lacked a subprocess timeout.
- Concurrent approvals used a read/modify/write sequence without cross-process locking.
- Scanner silently truncated past 80 plugin directories.

## Step 2: changes applied in this commit
- Missing tiers now yield `UNKNOWN` (authorization must fail closed). Both legacy BaseTool mirrors match.
- Only strict 1–96 char alphanumeric/underscore/dash trace IDs are accepted; invalid IDs are regenerated. TraceStore uses exclusive `0600` creation (no existing trace replacement).
- TraceReceipt persistent serialization omits raw arguments, host details, caller identity, stage evidence and messages, arbitrary reproducers and causal payloads; keeps high-level status and error code.
- `custom_env` permits only bounded `TZ` and `NO_COLOR` values, no generic environment injection.
- HotPlug approve/revoke transactions now protect read-modify-write with an exclusive Linux `flock`; exceeding 80 entries returns explicit capacity error instead of silently hiding a plugin.
- CF CLI/Wrangler execution receives a fixed bounded timeout (90s commands, 120s interactive login) and structured timeout code. No cross-CLI fallback.

## Step 3: regressions
- Added `scripts/test_hamasaki_hardening.py` with 12 offline tests for these contracts, concurrent approvals, permission fallback and secrets redaction.
- Added an `hamasaki`-scoped GitHub Actions workflow for Python syntax, hardening tests and hash identity tests. **Passing status must be verified from the actual workflow run**; source presence alone is not proof.

## Deliberately unresolved / remaining work
- **AUD-07**: Markdown, Office and WPS are *planning* entries and directly callable inspection adapters; they are not registered in the original seven-tool `BaseTool.TOOL_REGISTRY` execution path. Never claim full Call_Tools support without additional integration and permission-aware execution tests.
- **AUD-08**: Repeated hashing and synchronous file operations still amplify I/O under load. Require profiling and validated snapshot cache with mandatory pre-exec verification.
- **AUD-Office**: OOXML input parser has no independent kernel-level CPU/memory sandbox in the direct CLI path.
- CF timeout only bounds the directly spawned CLI process; its grandchildren may outlive it. Needs process-group cancellation regression.
- Old `Call_Tools` results can still include command `stdout`/`stderr` explicitly. Redacted persisted receipts do not make arbitrary command execution `zero privacy`; policy must gate output delivery and explicit network use.
- Three new productivity tools do not automatically become production-ready merely because their source is hash-pinned.
- The 80-tool ceiling is still intentional; it now fails visibly rather than silently dropping tools.

## Operational tests on a genuine machine
Use only test fixtures. Run `python3 -m unittest discover -s scripts -p 'test_hamasaki_hardening.py' -v`; review CI. Before shipping verify WPS runtime, real Bubblewrap file policy, actual Cloudflare authentication and simulated blocking CLI recovery.
