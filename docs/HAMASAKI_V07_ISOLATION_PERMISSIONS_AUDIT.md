# Hamasaki v0.7 security hardening: scoped Linux branch

Baseline commit `42ee250505aea43c717a92b5668080042c969e0b` (2026-10-21). No changes to `main`.

## Source-confirmed risks / fixes

1. **Default privilege regression**: the committed permission config explicitly contained `"tier": "danger-full-access"`. The Linux default now ships as `read-only`, with manual review. Runtime tier files intentionally remain mutable configuration and are NOT immutable code pins.
2. **Policy precedence**: BaseTool previously skipped malformed high-priority configurations and could inherit a more permissive fallback. Now any existing invalid, oversized or symlinked configuration returns UNKNOWN (fail closed); Linux bootstrap rejects symlinks too.
3. **Hardcoded platform roots**: BaseTool constructed Windows C:/Program Files/AppData paths on Linux. A POSIX-aware early return uses `/`, `/usr` and XDG data/config/state. Fixed `/usr`, `/bin`, `/lib` in the Bubblewrap profile remain intentional *read-only isolation policy*, not site-specific executable paths.
4. **Sensitive trace storage**: Linux trace storage now defaults to private XDG state, rather than repo logs; owner, directory permissions and symlink checks apply. Trace lookups reject traversal IDs. Existing persistent receipt redaction remains active.
5. **Duplicate registration**: `ToolRegistry.register()` refuses duplicate/invalid tool IDs rather than silently replacing registered implementations.
6. **HotPlug enumeration**: caps scans at 81 inspected directories; rejects a symlink approval file, keeping the established 80-tool upper bound explicit. Full-package rehashing is still required before execution.
7. **Deadlock-prone preexec**: old plugin launcher used `subprocess.run(..., preexec_fn=limits)`. Python warns that `preexec_fn` is unsafe in threaded programs. New launcher spawns a fresh process session, kills the process group on timeout and uses verified root-owned `prlimit` for `RLIMIT_AS=512MiB`, CPU=10s, file size=64KiB, FD=64; no preexec hook.
8. **Sandbox input integrity**: the copied package fingerprint is now checked against the hash included in the approved DSHA identity index, not merely an earlier observation of mutable source. Only fixed, read-only action declarations may launch.
9. **Runtime trust**: Bubblewrap and prlimit must be root-owned, non-group/world-writable executable files in standard system roots. Missing/invalid paths fail closed; no shell fallback. Bubblewrap mounts only necessary read-only system directories and the private tool snapshot, no host root/home and no network.

## Testing discipline

Run `python3 -m unittest discover -s scripts -p 'test_hamasaki_*.py' -v` and CF routing regression in GitHub Actions. `test_hamasaki_isolation_v07.py` contains 15 additional tests: fail-closed tier, symlink/precedence checks, XDG roots, trace confinement, duplicate registration, approval symlinks, scanner capacity, OS process-group timeout and no `preexec_fn` in the subprocess API. An additional bootstrap test checks tier symlinks.

The workflow is a real CI Python runtime, but does **not** establish that unprivileged Bubblewrap namespaces work on the user's KDE system; the production document inspection actions remain disabled until separately validated.

## Still open

- Production Bubblewrap user namespace/mount policy and actual WPS RPC are not end-to-end tested.
- The legacy BaseTool call path for original 7 tools is NOT the same OS sandbox as HotPlug. The legacy CF CLI uses network and can return stdout/stderr; its privilege boundary requires a dedicated policy review. Existing root-owned runtime approval only covers third-party HotPlug.
- Receipt and tracing redaction is local-only; it is not cryptographic encryption or a signed supply-chain provenance assertion.
- Automatic plugin upgrade/re-approval remains prohibited. An approved package that changes requires fresh review.
- No heavy performance benchmark or actual SQL/CF deployment was run.

## Reproducer commands (test host only)

`python3 -m compileall -q scripts tools`

`python3 -m unittest discover -s scripts -p 'test_hamasaki_isolation_v07.py' -v`

`python3 -m unittest discover -s scripts -p 'test_hamasaki_*.py' -v`

`python3 -m unittest discover -s scripts -p 'test_cf_routing.py' -v`
