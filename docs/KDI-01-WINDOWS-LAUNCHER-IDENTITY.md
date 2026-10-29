# KDI-01 / Windows .cmd launcher identity: Stage 5→6 design gate

> Status: DESIGN ONLY / NOT IMPLEMENTED / NOT SECURITY-APPROVED  
> Branch: `fatfish` exclusively; PR: #6 (Draft)  
> Protocol: DSHA private `v1.2.0-std` (unchanged)  
> Baseline: `b43df4ac0bee4df9bdc06c5eac3c3cbaf587de94`  
> Scope: Windows batch launchers only; no changes to Gate, request/response/receipt, seven stages, or other branches.

## Observed baseline (not a proposed guarantee)

- `scripts/base_tool.py` resolves an executable path and applies `assert_target_contained(exec_path)` in Stage 5, then constructs a command list and calls `subprocess.run(...)` in Stage 6. The executable is **not bound to an already-validated file object**.
- The Windows negative integration test `test_launcher_replacement_after_stage5_is_not_yet_blocked` is marked `expectedFailure`; CI reproduced `stage5=PASS, receipt=PASS, replacement_executed=True` ([run 40798784353](https://github.com/yanyu03/DSHA-SharBoy/actions/runs/40798784353)).
- The independent feasibility test `test_windows_read_handle_blocks_launcher_mutation` uses `CreateFileW(GENERIC_READ, FILE_SHARE_READ, OPEN_EXISTING)`; Windows CI confirmed the tested in-place rewrite and `os.replace` were denied, and a read-only `cmd.exe /d /c` invocation still ran ([run 40855606898](https://github.com/yanyu03/DSHA-SharBoy/actions/runs/40855606898)). This is **not** a production fix or a general identity guarantee.

## Threat model and required invariant

Assume a local actor can change files in a launcher directory during the Stage 5→6 interval. A successful Stage 5 path check must not be treated as proof that Stage 6 executes the same file bytes. The desired invariant is: **the launched batch content corresponds to the object validated under the trusted-root policy, or execution is refused**. Path-string equality, a second hash, or an earlier `Path.resolve()` check alone cannot establish this invariant.

`.cmd` is interpreted by `cmd.exe`; Windows does not expose a direct `CreateProcess`-from-file-handle path for executing batch contents. Keeping a handle to the original batch file does not automatically force `cmd.exe` to read that handle rather than reopen a pathname. Handle-sharing behavior is a mitigation candidate, not proof of handle-to-child identity binding.

## Candidate A: acquire/validate/hold (first isolated prototype only)

1. Resolve a candidate without trusting it. Open its file handle **before** accepting the Stage 5 decision, requesting read access and disallowing write/delete sharing. If opening fails, the opt-in prototype must refuse, not silently fall back.
2. Obtain canonical path and stable file identity from the opened handle (e.g. `GetFinalPathNameByHandleW` plus volume/file ID where available). Validate trusted-root containment against the handle-derived target, not only the original string. Define handling of reparse points, junctions, hard links and inaccessible metadata before production use.
3. Retain the handle across the entire child launch and completion, including timeout/error paths; close it in `finally`. Preserve existing Stage 4 authorization and Stage 5 refusal semantics; do not weaken them.
4. Test whether directory renames, reparse-point changes, alternate path aliases, or a pre-existing writable handle can redirect the pathname that `cmd.exe` actually opens. A blocked direct file rewrite is **insufficient**. If any redirect works, reject Candidate A as a complete mitigation.
5. Do not change default `BaseTool.execute()` or the mirrored plugin implementation until native Windows positive/negative tests and Linux regressions pass.

## Candidate B: verified private snapshot (fallback to evaluate separately)

Read the validated file into a uniquely named, access-controlled staging location, verify that the bytes being launched are the bytes reviewed, and launch that snapshot instead of the mutable original path. The staging directory must have enforced ACL ownership and secure creation/cleanup. This may change batch semantics (`%~dp0`, relative paths, sibling resources, signatures and launcher discovery), so it is **not** automatically backward compatible. It requires its own compatibility study and cannot be silently enabled.

## Minimum acceptance gate before any production patch

- Windows: real trusted `scribe.cmd` positive execution and seven-stage receipt still pass.
- Windows: post-Stage-5 replacement is prevented or refused; the existing TOCTOU `XFAIL` becomes an ordinary **PASS** only when the negative assertion succeeds without `expectedFailure`.
- Windows: test parent-directory rename/path redirection and reparse-point/alias behavior while a handle is held; test error and timeout cleanup. Do not infer results before running these tests.
- Linux: Stage 5 focused regression and full runtime contract suite remain green; platform-specific guard does not change Linux execution.
- Both mirrored `base_tool.py` implementations remain consistent if production code eventually changes; protocol `v1.2.0-std`, permission Gate, `DSHARequest`, `DSHAResponse`, `TraceReceipt` and seven-stage lifecycle remain compatible.
- CI logs and branch HEAD are verified before any security PASS claim. No OS-level sandbox claim.

## Decision and rollback

**Decision: no production implementation this round.** Candidate A is the smallest testable hypothesis but is not yet established as safe against pathname redirection. Next independent step: one Windows-only parent-directory/path-alias negative feasibility test; do not bundle it with runtime changes. This design note can be reverted by a single non-force commit on `fatfish` after checking the latest remote HEAD. Do not merge PR #6 automatically.
