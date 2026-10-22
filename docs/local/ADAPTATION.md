# Local Host Adaptation Contract · Kaeru Local

## Scope

This is a **reference contract**, not an assertion that a shared executor already exists across operating systems. Kaeru `main` is historically Windows-first. The experimental Hamasaki branch explores Linux-native planning, HotPlug and Office/WPS but is **not** wholesale merged.

## Boundary map

```text
Human / host agent policy (ultimate authorization)
     |
Programer engineering review (guidance, not an execution grant)
     |
Index -> Router (selection only)
     |
Gate + target scope (authorization must be checked independently)
     |
EnvFeel (requested runtime only; observation does not elevate permission)
     |
Platform-specific tool adapter / OS sandbox (only if verified)
     |
Result + exit code + evidence receipt + cleanup
```

### Host capability interface recommendation

Implement platform adapters **outside the common DSHA core**. For each capability report at least:

- `name`, `platform`, `arch`, `runtime_path` (private), `version` (observed), `state` (`UNAVAILABLE|DETECTED|INVOCABLE|ISOLATED|END_TO_END`).
- `probe_kind`, `probe_exit_code`, `probe_stdout_digest`, `checked_at`; never expose secrets or full private paths in public logs.
- `required_permissions`, `side_effects`, `sandbox_kind`, `evidence_path`; a missing record is not success.
- Explicit `NOT_RUN` for capabilities not actually exercised. A detected executable is not proof of correct semantics.

A local Agent may use this schema to guide its own reports; the legacy runtime does not automatically emit these fields.

## Adaptation principles

1. Keep core Tool IDs, routing, risk decisions and receipt semantics stable. Wrap OS-specific runtime discovery and invocation rather than adding OS checks throughout the core.
2. Use explicit configured interpreter first; invalid explicit configuration **refuses**, not silently switches to another runtime. Explicit configuration never bypasses signature, ownership or authorization checks.
3. Prefer minimal probes. A version string is weaker evidence than a small semantic operation.
4. Never use bare `shell=True` fallbacks or `eval`; construct argument arrays, constrain cwd/environment and put a hard timeout on every subprocess.
5. Timeouts are not proof of process termination. Confirm process-group/job-object cleanup and report residual children.
6. Trust needs authorization, tool identity, target scope and host isolation. File hash checks verify bytes, **not** publisher trust.
7. Use a disposable fixture; hashes before/after should agree for read-only operations. A pre-existing Office/WPS process must not be mistaken for an owned process.
8. Never silently change PATH, registry, shell startup files, global Python packages, desktop app associations, OS permissions or agent configuration.
9. Prefer offline tests; network/cloud/SSH/API actions require a separately scoped experiment, not implied by the tool being registered.
10. Stage on an experiment branch; transfer only independently validated, reusable core improvements to Kaeru `main`.

## Suggested target matrix

| Platform | Minimal route | Isolation to validate | Not yet proven here |
|---|---|---|---|
| Windows 10/11 x64 | Python 3.11+, PowerShell, built-in `.cmd` launchers | Non-admin user / disposable VM, processes, document read-only | Office/WPS real COM, cross-version parity, GUI automation |
| Linux x86_64 + KDE | Python 3.11+, Bash, Git, read-only catalogue | User namespace / Bubblewrap where permitted, no network and no home mount | Kaeru Windows launchers on Linux, KDE GUI control, full plugin lifecycle |
| macOS / other | Manual source review only | TBD | Compatibility or support is not claimed |

See [LINUX.md](LINUX.md) or [WINDOWS.md](WINDOWS.md) for host-specific steps; use [ACCEPTANCE.md](ACCEPTANCE.md) for the graduation gate.
