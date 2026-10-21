# Hamasaki v0.7 EnvFeel selective uptake — phase 1

Source considered: `fix/env-config-20261019@8c1bd16f3b07f89873f03b4eda04dddc14d6df2d`, especially `scripts/dsha_env.py` and its tests. **This is a selective clean rewrite**, not a branch merge or an adoption of the Windows SDK discovery stack.

## What is absorbed
1. For already-supported Linux tool probes, runtime precedence is **explicit argument > per-tool DSHA_* process environment > PATH**. Only approved tool names are recognized.
2. An explicitly configured executable that cannot be resolved is a hard failure. It never silently becomes a different PATH command.
3. No implicit .env loading, network, package installation, tool execution by the resolver or proxy injection.
4. Linux capability status hides absolute executable paths and repository checkout directory. Cloudflare CLI status hides executable paths while preserving capability signals.
5. Cloudflare CF CLI / Wrangler / Cloudflared identities remain independent; `DSHA_CF`, `DSHA_WRANGLER`, `DSHA_CLOUDFLARED` must not cross-fallback.
6. Runtime discovery is **not executable authenticity or permission authorization**. Semantic probes, pins, tier checks and sandbox rules remain separate.

## Isolation retained
`main` unchanged. No new Tool or DSHA layer. No Windows registry, MSVC SDK, global SDK PATH injection, writable client configuration or implicit network connection is ported.

The runtime overrides are constrained to: DSHA_BASH, DSHA_GIT, DSHA_GH, DSHA_NODE, DSHA_NPM, DSHA_PWSH, DSHA_DOLPHIN, DSHA_KREADCONFIG, DSHA_CF, DSHA_WRANGLER, DSHA_CLOUDFLARED.
Explicit directory paths and relative paths containing separators fail. A bare executable name can be resolved from PATH, and only literal argument-list calls occur after an independent probe.

## Verification
`python3 -m unittest discover -s scripts -p 'test_hamasaki_*.py' -v`
`python3 -m unittest discover -s scripts -p 'test_cf_routing.py' -v`
`python3 -m compileall -q scripts tools`

The added 15 scenarios cover precedence, missing/directory/bare overrides, CJK paths, Linux probe semantics, CF login isolation, no host path disclosure, and no side effect during resolution. GitHub Actions must report success on the actual commit to claim regression completion.

## Remaining areas deliberately not ported
Windows-only MSVC SDK, registry, host environment activation, frontend project-specific challenge probes; broader legacy Tool CLI output privacy and all requested document write operations stay separately gated. This phase intentionally does not touch the original legacy `BaseTool` dispatch semantics.
