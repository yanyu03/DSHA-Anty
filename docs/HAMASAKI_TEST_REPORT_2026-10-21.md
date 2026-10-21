# Hamasaki v0.4 — isolated Linux regression and microbenchmark

Date: 2026-10-21. Baseline branch: `hamasaki` at `334cb4595b0cbc7f0315f505426b617e36cc97c9`. This commit only fixes observed bugs and adds tests. The `main` branch is unchanged.

## Provenance and limitations

The CF dispatcher, hotplug registry, Linux adapter, and planner under test were reconstructed from GitHub *blob-verified* files into an isolated Linux test directory. They were byte-for-byte checked with `git hash-object` against the exact remote blob SHAs before changes. No live Cloudflare login, GitHub write through tested code, package installation, deployment, user KDE device access, or real unknown third-party tool execution was attempted. The sandbox host lacks `bwrap` and the actual Cloudflare/Wrangler CLIs.

The original baseline tests: 11 standalone CF routing tests + 1 wrapper check; 4 hotplug tests; 8 Linux bootstrap tests; 12 planner tests. One CF `CFTool` prerequisite integration test requires the entire 98 KB `base_tool.py` and was not executed in this isolated harness; it was reviewed at source level. Six additional cross-layer tests were added and executed locally. Total isolated tests run after fixes: **42 passed, 0 failed**.

## Problems discovered by running the real blob

- **CF-01 (confirmed, P1)**: in the CF dispatcher `{"status":"PLAN_ONLY", **route}`, the unpacked `route.status=ROUTED` overwrote `PLAN_ONLY`; the no-execution test failed. Fixed by setting status after unpacking.
- **CF-02 (confirmed, P1)**: the planner silently changed an explicitly requested `wrangler deploy` into `cf` in a CF project, which could mix backend/credential expectations. Fixed: refuse explicit mismatch, preserve explicit routing, allow an injected `project_root`, flag unspecified project directory for review.

## Positive behaviors observed

- CF CLI `auth whoami` and Wrangler `whoami` stay separate; CF authentication failure does not try Wrangler.
- CF + Wrangler use **separate EnvFeel probes**; only the selected backend is probed.
- A new hotplug tool appears, approval is content-hash-specific, code changes invalidate approval, and missing bubblewrap refuses execution.
- Read-only permissions and unrecognized operations do not fall back to unrestricted Bash.
- No test executed `cf auth login` or any external API.

## Small local microbenchmarks

Python 3.13.5, isolated Linux container, no external subprocesses, fixed sample:
- Four-tool router ranking: **0.039 ms / call** (2,000 calls).
- Four-tool full planning with mocked EnvFeel: **0.059 ms / call** (2,000 calls).
- Hotplug scan: 0 tools **0.033 ms**; 1 **0.170 ms**; 10 **1.251 ms**; 40 **5.565 ms** (small files only).
These are local dispatch microbenchmarks, **not a Kaeru→Hamasaki end-to-end speedup** nor a claim for actual KDE host performance. Hotplug scans still rehash full file content per invocation and can become costly on large packages.

## Remaining gates

- Real Linux/KDE, Bubblewrap filesystem isolation, package-manager adapters, privilege boundaries, and actual cf/wrangler CLI execution are **NOT_RUN**.
- Re-test the full `base_tool.py` integration and duplicate mirrors on the actual repository checkout.
- Authenticate each Cloudflare backend separately, check account/profile and token scope, and test deploy only against a disposable Cloudflare project after explicit user approval.
- Do not claim original Oyasmi source parity; that source has not been supplied.
