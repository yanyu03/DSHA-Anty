# Kaeru Local · Instructions for local agents

> Scope: **this repository checkout only**. Human requests and the host agent's own security policy always take precedence. This file is guidance, **not a permission grant**.

## Identity and purpose

- Profile: `Kaeru Local`, a local-agent reference snapshot of DSHA-SharBoy `main` at commit `e24abe7d4e7fa6a82967af8972de0e11bf6cf5d4`.
- This branch is a **documentation-only adaptation baseline**, not a new executable product or certified Linux/Windows integration.
- Start with [KAERU_LOCAL.md](KAERU_LOCAL.md), then [docs/local/ADAPTATION.md](docs/local/ADAPTATION.md) and the relevant host guide.

## Mandatory local workflow

1. Record actual `git rev-parse HEAD`, `git status --short`, host OS, architecture, active shell, Python executable and proposed workspace. Do not confuse a git checkout with an installed plugin.
2. Observe first: inspect manifest, existing code and read-only metadata; run no installs, dependency downloads, service logins, background daemons or external deployments without specific permission.
3. **Inspect the permission config before any dispatch**: `plugins/dsh-permissions/tier.json` in this snapshot declares `danger-full-access` and `auto_reviewer: local`. Treat it as an unsafe default for unattended work. The host sandbox/approvals are independent and authoritative. Do not change permission tiers silently.
4. Treat `Index/Router` output as a *candidate selection*, not authorization or proven runtime capability. A parsed intent alone is never sufficient to invoke a tool. Use explicit, reviewed action arguments.
5. Never infer root/system powers, environment credentials, cloud identity, office COM availability, or verified execution isolation from the manifest.
6. Work only on user-authorized, preferably synthetic fixtures inside a dedicated workspace. No writes to a real document, production cloud service, or private home directory unless separately authorized.
7. For any execution record: source commit, selected tool and action, target identity, permissions, actual command, exit code, produced output, whether it really ran, side effects, remaining uncertainty and cleanup.
8. Refuse unsafe/missing/ambiguous capability instead of silently falling back to arbitrary shells, alternate tools or a higher tier.

## Useful verification (read-only / offline after dependency review)

```sh
python3 scripts/index.py list
python3 scripts/router.py route "zzzyyyxxx-no-registered-tool" --json
python3 -m unittest discover -s scripts -p 'test_kaeru_router_safety.py' -v
```

The included core is predominantly Windows-oriented. On Linux, these commands are *candidates for a local probe*, not a promise of compatibility. Do not run `install.ps1` or `verify.ps1` merely to inspect the repository: those workflows can change local state.

## Stop rules

- No match, missing runtime or invalid authorization -> stop and explain.
- A failed probe -> record `FAIL` or `NOT_RUN`; do not report a pass.
- Timeout -> inspect the process and cleanup before considering retry.
- Unknown/old samples -> do not substitute another target.
- Hash/identity mismatch -> stop; never auto-regenerate a trusted pin.

See [docs/local/ACCEPTANCE.md](docs/local/ACCEPTANCE.md) for evidence levels and a host acceptance checklist.
