# Hamasaki — Oyasmi Linux successor (integration staging)

Base: `yanyu03/DSHA-SharBoy` main at `cfd166a188283a63b3f82bc38ab95584a7b9df06`.
Branch: `hamasaki`. This branch does not change `main`, create a new user account, or publish a release.

## Provenance and exact limitations

- **Kaeru/SharBoy source**: GitHub repository above; common Gate, EngLock, Index/Router, BaseTool/EnvFeel, Trace/Retrace and Scribe remain intact.
- **Oyasmi historical reference**: `CodeerOyasmi/DSHA` at remembered commit `29adb50`, currently inaccessible through the GitHub API because the account/repository returns 404. This branch does **not** claim to include that original source.
- **This commit**: a newly implemented, read-only Linux adapter scaffold based on known Oyasmi requirements. Linux extensions from the user's full local copy must be compared and transplanted explicitly before parity is claimed.

## Available now

On a Linux host from the repository root:

```sh
sh bin-linux/hamasaki status --json
sh bin-linux/hamasaki package-plan --json
python3 -m unittest discover -s scripts -p 'test_hamasaki_linux.py' -v
```

The adapter checks DSHA core file presence, reads the declared local tier, and reports Linux runtime capabilities. It distinguishes `NATIVE` (validated), `COMPATIBLE` (discovered but not verified) and `UNAVAILABLE` (not found). Bash and PowerShell require semantic probes. Package managers, KDE environment, and GitHub CLI discovery **do not** authorize their use. There is no package installation, external network request, privilege escalation, configuration write, or GitHub push in the adapter.

## Oyasmi migration queue (not yet ported)

1. Obtain the user's **local** Oyasmi source snapshot, including `.git` when available; save its tree hash and compare with Kaeru core before moving files.
2. Diff Oyasmi `bin-linux/`, `install.sh`, `verify.sh`, `agy-tier.py`, `agy-meter.py` and Linux tests; port code with attribution and preservation of compatible Kaeru contracts.
3. Migrate `gh` routing, KDE radar / Dolphin integration, APT/Neon/PyPI/npm adapters **behind explicit opt-in gates**; never silently modify software sources.
4. Normalize the execution envelope, refuse permission escalation, and validate containment at the OS boundary; current directory checks are not a sandbox.
5. Validate rollback behavior, actual KDE + Linux execution, concurrent subprocesses, failure receipts, package manager dry-run, and `NATIVE/COMPATIBLE/UNAVAILABLE` diagnostics.
6. Only after source parity, tests, and sensitive-data/license audit: prepare a review PR; do not merge or cut release automatically.

## Remote write policy

Work locally. Batch reviewed changes into infrequent commits. `main` is never force-pushed. Repository actions are auditable; there is no claimed rate threshold that avoids GitHub enforcement.
