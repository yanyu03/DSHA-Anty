# Kaeru Local · Local Agent Reference

**Publication date:** 2026-10-22  
**Profile:** `kaeru-local/0.1-reference`  
**Upstream:** `yanyu03/DSHA-SharBoy`, `main` commit `e24abe7d4e7fa6a82967af8972de0e11bf6cf5d4`  
**Type:** **source + guidance**, not a signed release, executable installer, production-certified Agent, or automatically enabled integration.

## Why this exists

For local Agents (Codex, Claude Code, Gemini CLI, human-operated coding agents and comparable tools) to **understand DSHA before attempting host adaptation**. It expresses stable engineering interfaces and a bounded, host-by-host acceptance route.

The goal is **not** to add more Skills. Keep Kaeru stable; experimental Linux HotPlug, Bubblewrap and Windows COM test modules stay on Hamasaki and require their own validation.

## Quick-start map

| Want to do | Read |
|---|---|
| Let an Agent understand the repo | [AGENTS.md](AGENTS.md) |
| Discover existing architecture and constraints | [docs/local/ADAPTATION.md](docs/local/ADAPTATION.md) |
| Adapt a Linux/KDE test host | [docs/local/LINUX.md](docs/local/LINUX.md) |
| Adapt a Windows host | [docs/local/WINDOWS.md](docs/local/WINDOWS.md) |
| Prove capability on a real host | [docs/local/ACCEPTANCE.md](docs/local/ACCEPTANCE.md) |
| Review scope and publication limits | [docs/local/RELEASE_NOTES.md](docs/local/RELEASE_NOTES.md) |
| Consume machine-readable reference profile | [kaeru-local.manifest.json](kaeru-local.manifest.json) |

## Validated vs. unvalidated

- The source inherits Kaeru `main` and its existing router safety uptake; its five router-safety tests passed in a GitHub Actions PR prior to this reference profile.
- Upstream `README.md` identifies **Windows x64** as the primary historically tested platform for V1.0; it does not establish support for every fresh Windows host.
- Linux native execution isolation, universal Windows Office/WPS COM automation, cloud account operations and real host-to-host parity are **NOT VERIFIED for this reference profile**.
- The **current** repo permission file is **`danger-full-access`**. A local Agent must not interpret this as a user authorization. Apply host-level controls and keep operations read-only until expressly approved.
- There is no automatic credential loading, background startup, system modification or dependency installation in this documentation-only profile.

## Suggested sequence

1. Inspect only: checkout SHA, `AGENTS.md`, manifests, environment and allowed workspace.
2. Confirm permissions: separate `Agent authorization`, `DSHA Gate tier`, `OS sandbox`, `provider account`; none implies another.
3. On a disposable fixture, verify `catalog -> route -> gate -> runtime probe -> approved action -> output -> receipt -> cleanup`.
4. Distinguish `L0 detected`, `L1 invoked`, `L2 isolated`, `L3 business end-to-end`.
5. Capture `PASS / FAIL / BLOCKED / NOT_RUN`; only after L3 consider production adoption.

No new tool modules or core execution behaviors are introduced in Kaeru Local. Use [original DSHA V1.0 release](https://github.com/yanyu03/DSHA-SharBoy/releases/tag/V1.0) when you need the published V1.0 assets rather than this branch-based reference.
