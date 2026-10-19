---
name: dsha
description: "Use DSHA's REA routing and evidence discipline for shipped binaries, packages, archives, or runtime investigations, or when the user invokes DSHA. Includes local REA/Ghidra environment checks. Use normal repository tools for readable source; Antigravity permission switches do not change Codex permissions."
---

# DSHA for Codex

Local adaptation based on the user's `Desktop/GOOGLE/DSHA` Git repository, `https://github.com/yanyu03/DSHA-SharBoy`. Use the pinned `source_commit` in `host.json`, not a stale README version. The upstream VERSION and README labels differ; retain both in installation evidence. Source and paths are recorded in `~/.codex/tools/dsha/host.json` and `verification/`.

## Choose the branch

- When the user asks for Programer, read the pinned source's `skills/DSHA/programer.md` and `docs/PROGRAMER_MINDSET.md`. Apply configuration boundaries, explicit contracts, deterministic cleanup and measured verification; treat absolute wording as guidance, never as evidence of correctness.

- For shipped DLL/EXE, resources, archives, managed assemblies or passive runtime evidence, read the pinned source's `skills/reverse-engineer-anything/SKILL.md` and its relevant references. The older [REA notes](references/rea.md) and [routing table](references/rea-routing.json) are historical cost/routing context; actual server schemas and `host.json` determine current tools, paths and versions.
- For ordinary readable-source work, use repository tools. REA should answer a question about a declared binary/reference artifact, not replace source inspection or functional tests.
- For an evidence report, apply the relevant [engineering locks](references/engineering-lock.md) and [language discipline](references/language-norm.md): retain source identity, sample count, reproducible commands, unknowns and limitations. They are evidence aids, not evidence of correctness themselves.
- The original permission-tier branch is Antigravity-specific. Installing this skill does not change Codex sandbox/approval settings, add hooks, or authorize restarting Antigravity. Only use the preserved Antigravity scripts for an explicit Antigravity request.

## On refusal: stop and explain

If DSHA refuses, returns a failed prerequisite, or a known condition already requires refusal, end the current task immediately. Respond in the user's language: briefly apologize, name the specific failed or unverified condition, state the task was not run (or precisely identify any step already run), and point to the appropriate project/tool owner or documentation with manual parameter/environment configuration instructions. Use `user_response` when present; do not infer "not installed" from an unsupported contract or failed health check.

After refusal, do not continue probing, try an alternative tool/environment, remove a requirement, install, edit configuration, elevate permissions, rebuild a source lock, or retry. Give guidance only; wait for a new explicit user request before a new invocation, even if earlier broad work was authorized. Do not append an offer that implies execution is continuing. Existing owned cleanup and an explicitly requested receipt may finish; they do not authorize repair. This governs DSHA tasks, not unrelated chats or a global operating-system lock.

In an explicitly authorized fault-injection test suite, each refused specimen ends that tested call; only the predeclared test harness may advance to the next independent specimen. Do not use that testing boundary to continue a real refused task or repair its environment automatically.

## Local environment and tools

Use the Python executable recorded in `host.json`, or a working Python 3.11+:

```powershell
python <skill-dir>/scripts/dsha.py status
python <skill-dir>/scripts/dsha.py inventory --smoke --env-file <private.env> --private-output <inventory.local.json>
python <skill-dir>/scripts/dsha.py envfeel --require python --run python -- -c "print('ready')"
python <skill-dir>/scripts/dsha.py selftest
python <skill-dir>/scripts/dsha.py englock status
python <skill-dir>/scripts/dsha.py englock check <report.md>
python <skill-dir>/scripts/dsha.py rea doctor --format json
python <skill-dir>/scripts/dsha.py catalog --json
python <skill-dir>/scripts/dsha.py route "investigate a declared shipped binary" --json
```

Inventory probes allowlisted development tools with parameters, process environment, an explicitly supplied environment file, PATH and SDK locations. It publishes versions/status only; resolved executable paths stay in the optional private inventory. Environment files accept documented KEY=VALUE entries without evaluation or interpolation. Missing discovery is not proof of absence, and version probes do not prove build readiness; owned fixture results are reported separately. A saved inventory is a dated hint, not permission or permanent readiness evidence.

EnvFeel gates declared requirements before execution: fingerprint the runtime, locate tools, prepare a private child environment, then launch identity/version and applicable owned health checks. Unsupported runtime combinations, missing tools, insufficient identity contracts or failed checks refuse execution. It rechecks for every run and does not import saved READY reports. See the pinned source's `docs/ENVFEEL.md` for coverage, version-only limitations and bootstrap requirements. This environment gate does not grant authorization or control direct third-party launches.

For TypeScript/React/Vue readiness, declare the project capability and an explicit absolute project root: `envfeel --require typescript --require react --require vue --project <project-root>`. It automatically checks Node, then requires real project-resolved libraries to answer fresh compile/type-error/run or SSR/reactivity challenges before allowing `--run node`. Use only capabilities needed by the task. `DSHA_PROJECT_ROOT` is the environment alternative; invalid overrides refuse. A package manifest, version string or Node-only READY is not frontend readiness. Project library code actually executes during these probes; scope and limits are in the pinned `docs/ENVFEEL.md`.

Prefer the configured `rea` MCP server and the tools it actually advertises. Verify `tools/list` rather than assuming historical `mcp__rea__*` names or provider readiness. A new registration may require a fresh client session. When tools are not yet exposed, the bundled `scripts/mcp_client.py` can keep one stdio MCP session alive through an interactive shell session; inspect its `--help` and use JSON tool calls. Avoid repeated CLI invocations for the same native target because each can import it again.

When an investigation needs a target, require its explicit path/identity or an already declared project reference. Do not select a nearby binary or old report as a substitute. Environment smoke tests use owned synthetic fixtures and are not investigations of user software.

Catalog and routing results are selection hints, not evidence of readiness or permission. Do not auto-run an inferred tool intent. Upstream meter estimates do not replace this project's official quota gate. Scribe collection, Cloudflare deployment, Antigravity switches and global shell/PATH changes require their own task scope; installing this adapter does not invoke them. Source hashes are verified before adapter actions; mismatches stop execution and require review rather than automatic lock regeneration.

Start with lightweight resources/metadata, then `open_binary` only when function evidence is needed. Inspect session/provider availability and reuse that session for overview, searches, decompilation and references. Tell the user the expected order of cost before large imports. Close owned sessions when done; preserve cleanup failures and evidence rather than deleting arbitrary temporary directories.

Native Windows Ghidra analysis is read-only: do not modify input bytes or claim database mutations are supported. Do not execute, inject into, extract over, or modify an actual target unless the task authorizes that action. String/resource/type-library matches establish static presence, not implemented behavior; runtime observations and functional comparison remain separate evidence.

## Driving Zen engine work

When the project needs reference behavior from a specified shipped artifact, use REA to establish interfaces, resource declarations, function/reference hypotheses and explicit unknowns. Turn supported findings into independent engine implementation tasks and verify through Rust tests and native-file comparisons. Do not copy vendor code/resources into public source or label a preserved object as editable/rendered.

Honor the current task's quota gate, cadence, project instructions and source-of-truth backlog. This skill adds no global scheduler or permission policy. See [local integration details](references/codex-integration.md) for installation identity, startup and rollback.
