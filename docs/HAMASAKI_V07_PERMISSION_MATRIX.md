# Hamasaki v0.7 — second-pass permission matrix + deterministic selftest

Baseline `4e19fb7d52763ddf0c4a3d1acbbfa9bebccf135a`. No changes to `main` or any real Cloudflare account.

## Additional problems confirmed from source

- Legacy authorization treated **LOW** as safe under read-only although some LOW tools can create output artifacts.
- `workspace-write` and `auto` implicitly permitted `ADMIN` risk tools. Caller-supplied tier was never allowed to raise host authorization but the intrinsic matrix was too broad.
- The old `BaseTool.run_selftest()` still assumed five categories and seven tools, required Windows executables on Linux, accepted a custom environment key that is no longer allowed, mutated the shared registry, and invoked real tools during a nominal self-test. This contradicted the current Linux safety model.

## Patch contract

- Effective tier is the **minimum** of host and caller requests. `auto` is treated as workspace-write authority, never as ADMIN.
- `read-only`: only tools whose declared risk is `READ_ONLY`.
- `workspace-write` and `auto`: permit READ_ONLY, LOW, MEDIUM but not ADMIN.
- `danger-full-access`: all risk classes, only when host and caller policy both permit it.
- `run_selftest` now checks ten static, deterministic, non-executing contracts. It neither launches CF/WPS/PowerShell nor writes traces or registers test tools globally. Repeated runs must preserve the ten-tool catalog.

## Remaining limitation

Risk classes are still per-Tool, not per-action. A READ_ONLY-labelled tool could contain a writing subcommand; therefore real mutating work still requires a separate action-policy gate and validated OS sandbox. The native original seven-tool BaseTool execution path is **not** equivalent to the HotPlug Bubblewrap isolation profile.

Reproduce in CI: `python3 -m unittest discover -s scripts -p 'test_hamasaki_*.py' -v`, then `python3 -m unittest discover -s scripts -p 'test_cf_routing.py' -v`.
