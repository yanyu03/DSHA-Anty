# KDI-01 / Scribe dossier output containment contract (design only)

Status: **PROPOSED / NOT ENFORCED** · Scope: `fatfish` P01/P04 security boundary · Baseline: `a3cd90e0bef23e34732c620452466d7a53dcfcea` · DSHA private protocol: `v1.2.0-std` unchanged.

## Evidence and threat model

- At this baseline, `scripts/scribe.py` parses `dossier --out PATH` and directly invokes `out_p.parent.mkdir(...)` followed by `open(out_p, "w", ...)`; `plugins/dsh-permissions/scripts/scribe.py` is a second Scribe implementation and must be assessed before a runtime change.
- `scripts/test_runtime_contracts.py::RuntimeContractTests.test_scribe_dossier_out_outside_repo_currently_accepted` reproduces the current external-absolute-path acceptance with mocked writes. This is a **known failing security boundary**, even though the reproduction test passes.
- Scribe's tool-level `RiskLevel.MEDIUM` prevents use under the DSHA read-only tier; it does **not** constrain file destinations under a write-capable tier.
- `harvest` and `status` also write `.scribe/latest_harvest.json`. This contract's first implementation slice concerns only **`dossier --out`**; it must not be described as a general Scribe filesystem sandbox.

## Compatibility decision

1. Introduce a **trusted, opt-in managed-output policy** for the DSHA-managed Scribe entrypoint before enforcing it by default. Do not silently change the existing standalone `scribe.py dossier --out` CLI contract in this first slice.
2. The trusted output root must come from an administrator-controlled registration/configuration, **not** the model's JSON arguments, `DSHARequest.context`, arbitrary environment variables, or caller-controlled working directory. A model cannot nominate or enlarge its own trusted root.
3. Under the managed policy, `--out` is interpreted as a **relative path beneath a configured export root** (proposed default: `<repo>/.scribe/exports`). The existing no-`--out` cache behavior remains separate. Explicit absolute paths, including absolute paths *inside* the root, are rejected in the first slice to avoid cross-platform ambiguity.
4. For the initial implementation, fail closed on all ambiguous cases. No implicit fallback to legacy unrestricted output when policy validation fails. The standalone legacy path must remain clearly documented as **uncontained**, not as a security guarantee.
5. Never change `DSHARequest`, `DSHAResponse`, `TraceReceipt`, stage numbering, or the permission Gate to carry output-path policy. The trusted policy is an internal, opt-in execution configuration.

## Proposed validation contract (not implemented)

For managed `dossier --out`:
- Accept only a nonempty relative string without NUL; reject `.`, empty components where ambiguous, and any `..` component. Resolve against the trusted root, not `cwd`.
- Reject POSIX absolute paths, Windows drive-absolute (`C:\\x`), drive-relative (`C:x`), rooted (`\\x`), UNC (`\\\\server\\share`), and extended/device (`\\\\?\\`, `\\\\.\\`) syntax on **both** Linux and Windows. Do not let host-specific `Path` interpretation silently accept foreign-platform path forms.
- Canonicalize the trusted root and candidate, and require the candidate to be a strict descendant of the root. Reject existing symlink/reparse-point ancestors and an existing symlink/reparse-point output leaf; do not follow links to a different target.
- Reject directories as output leaves. File replacement is not allowed in the first managed slice: use exclusive create semantics so an existing dossier is not overwritten. Decide separately whether named overwrites should be introduced with explicit authority.
- Avoid creating parent directories or opening files until all validation passes. Validate the **actual opened target** when possible, not merely a previously resolved string.
- A path-based precheck alone cannot prevent a concurrent directory swap (TOCTOU). Race-resistant directory-handle/no-follow operations require separate OS-specific implementation and testing. If the host cannot enforce the promised property, refuse the managed operation or require a separately validated OS sandbox. Do not claim OS-level isolation.

## Acceptance matrix for the next isolated implementation

| Input / condition | Managed policy expectation |
| --- | --- |
| `reports/incident.md` below trusted root, absent file | ACCEPT only after safe open |
| `incident.md` with empty parent path | ACCEPT only after safe open |
| `../outside.md`, `reports/../../outside.md` | REJECT |
| `/tmp/out.md`, `C:\\temp\\out.md`, `C:out.md` | REJECT |
| `\\\\server\\share\\out.md`, `\\\\?\\C:\\out.md` | REJECT |
| Existing symlink ancestor or output leaf / Windows junction | REJECT |
| Existing ordinary file / directory as output leaf | REJECT |
| Missing trusted root / untrusted caller-provided root | REJECT |
| Validation/open race or unverifiable containment | REJECT |
| Standalone legacy `--out` without managed policy | UNCHANGED, explicitly **not contained** |

## Required verification and release gate

- First isolate a **pure validator and open contract**; do not wire it to the production Router until the test matrix is covered on Linux and Windows, including negative cases and actual temporary-directory writes.
- Review **both** Scribe copies and their launcher call paths. Confirm the managed policy cannot be disabled through `context`, argv, `custom_env`, or PATH fallback.
- Re-run P01/P02/P03, runtime contracts, Stage 5 and Windows launcher suites. Retain known Windows Stage 5→6 TOCTOU XFAIL as an explicit unresolved issue; no blanket PASS claims.
- No change to existing permission Gate or other branches. If managed containment cannot be proven, retain the present rejection of experimental `null` mapping and do not connect the adapter to production.
- Rollback for this design-only commit: after confirming the current `fatfish` HEAD, create a normal revert commit. Never force push.

**This document records a proposed boundary, not a deployed mitigation or a passing containment test.**
