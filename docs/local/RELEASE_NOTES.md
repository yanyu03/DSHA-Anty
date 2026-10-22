# Kaeru Local 0.1 — Branch publication notes

**Date:** 2026-10-22  
**Published branch:** `kaeru-local`  
**Parent:** Kaeru `main` commit `e24abe7d4e7fa6a82967af8972de0e11bf6cf5d4`  
**Release type:** documentation-only **local-agent reference snapshot** (not a GitHub Release tag or signed binary package).

## What was published

- `AGENTS.md`: conservative local-agent interaction policy.
- `KAERU_LOCAL.md`: entry document for host-local Agents.
- `kaeru-local.manifest.json`: machine-readable reference metadata and non-claims.
- `docs/local/ADAPTATION.md`: architecture boundary and platform interface suggestions.
- `docs/local/LINUX.md` / `docs/local/WINDOWS.md`: OS-specific host routes.
- `docs/local/ACCEPTANCE.md`: L0-L3 acceptance rubric and structured evidence schema.
- Branch `README.md`: a link to the reference profile.

## Not included

No copied Hamasaki runtime, experimental Office/WPS module, third-party credential, global OS configuration change, new dependency or execution-permission grant. This profile does not auto-start or register agents.

## Known limitations

- Mainline DSHA is Windows-first; Linux needs an adapter, verified sandbox and real-host tests.
- The inherited `plugins/dsh-permissions/tier.json` contains `danger-full-access`; use host-level constraints and explicit permission. Merely reading this file is not a reason to loosen host approvals.
- This branch has no independently confirmed native Office/WPS COM activation, KDE desktop automation, cloud deployment or untrusted plugin execution.
- Reference checklists and semantic acceptance are recommendations, not pre-existing implementations.

## Use and rollback

Clone `kaeru-local` into a dedicated path for reading. For production code or a stable source distribution, use the Kaeru `main`/V1.0 release. Removing this checkout removes only the reference copy; it does not uninstall DSHA components installed previously by other procedures.
