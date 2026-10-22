# Linux / KDE adaptation route (experimental)

**Status: guidance only.** Kaeru `main` is Windows-first and does **not** ship the Hamasaki `bin-linux/hamasaki` CLI or its `tools/office,wps` experimental adapters.

## Stage 0: passive host inventory

Run manually from an authorized clone. Commands below do not install packages or modify global configuration:

```bash
uname -srm
python3 --version
for x in python3 git bash pwsh node npm bwrap; do
  printf '%-10s ' "$x"
  command -v "$x" || printf 'NOT_FOUND\n'
done
printf 'Desktop: %s\nSession: %s\n' "${XDG_CURRENT_DESKTOP:-unknown}" "${XDG_SESSION_TYPE:-unknown}"
git rev-parse HEAD
git status --short
```

Do not paste complete `env` output into public issues: it can contain tokens.

## Stage 1: source-level smoke only

```bash
python3 -m unittest discover -s scripts -p 'test_kaeru_router_safety.py' -v
python3 scripts/index.py list
python3 scripts/router.py route "zzzyyyxxx-no-registered-tool" --json
```

The intentionally unmatched route should fail closed (process exit 2). Some legacy modules and wrappers may expect Windows and should not be treated as native Linux just because imports succeed. Review imports and optional prerequisites first.

## Stage 2: execution adapter, separate branch

- Put Linux launch wrappers and dependency probes in a dedicated adapter. Avoid changing Windows `.cmd` assumptions in-place.
- For an untrusted tool use an OS-enforced sandbox actually available on the host; e.g. Bubblewrap **after** confirming user-namespace policy. No host-home, SSH-agent or cloud-token mounts and no network unless separately approved.
- Bind only a disposable input fixture, verify read-only mounts and output paths, use resource/time limits and kill/verify children on timeout.
- The old `BaseTool` subprocess wrapper must **not** be represented as equivalent to Linux Bubblewrap.
- If namespaces/Bubblewrap are unavailable, emit `BLOCKED`; do not auto-run unsandboxed.
- Avoid KDE GUI automation until session type (X11/Wayland), authorization, focus and cleanup have real-host evidence.

## Stage 3: one business acceptance

Owned `test.md` -> explicit task -> correct route -> Gate -> verified sandbox -> Markdown read-only analysis -> validated output -> receipt -> cleanup. Check file SHA256 before/after. Repeat, then inject missing runtime, no permission and timeout failures.

**Graduation condition:** L3 according to [ACCEPTANCE.md](ACCEPTANCE.md). Scripts that merely list or plan tools are L0, not an execution certificate.
