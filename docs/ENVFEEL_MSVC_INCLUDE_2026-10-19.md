# MSVC staged INCLUDE defect and repair

Date: 2026-10-19, Windows x64. User authorized local environment diagnosis, repair and repository reporting. Baseline source: 974a3b78da56356ec0eaa890f4e97401811a7771, adapter 2.5.1. No vendor source or runtime payload is included here.

## Observed failure

Python 3.12.14, Cargo/rustc 1.99.1 and cl 19.51.36260 passed identity checks. Rust compiled, linked and executed an owned offline Cargo sample. The old header-free C object health check also passed. However, the separate C++ Windows sample failed at windows.h with C1083: excpt.h not found. The task was TASK_FAILED, not an environment refusal; the wrapper returned126. Neither successful SDK variable initialization nor the old object sample established C++ header readiness.

The user supplemented VS components, but the same failure remained. Read-only inspection found excpt.h in installed MSVC14.51.36231 and14.52.36815 toolsets. This disproves the inference that the failing include lookup alone proves installation absence. Recommending repeated installation before inspecting the actual include mapping was an investigation error.

## Root cause

The adapter runs core VsDevCmd with no optional extensions, then explicitly initializes VC. Core initialization had already assembled INCLUDE. The later VC step supplied its include directories through __VSCMD_VCVARS_INCLUDE, which the adapter ignored. PATH and LIB were available, allowing Rust linking, while the compiler headers were absent from INCLUDE. This was our integration defect, not demonstrated corruption of the installed SDK.

## Repair and bounded evidence

Merge the deferred VC includes ahead of SDK includes, deduplicate normalized entries, and do not publish that internal accumulator or unrelated variables. Before updating the caller's private child mapping, require excpt.h, vcruntime.h and windows.h to resolve through that mapping. Initialize SDK/VC also for cl-only calls; the old activation was coupled to a Rust requirement. The cl COFF health sample now includes Windows SDK and MSVC headers.

Four owned regression cases verify staged merging/order/deduplication and variable isolation, already merged compatibility, missing-header rejection without partial publication, and rejection of SDK-only headers. They do not execute a vendor installer. Native source smoke then passed two independent samples: Cargo offline build/link/run and C++ Windows-header compile/link/run. Both executables answered a new random argument and arithmetic result; temporary build directories were cleaned. Tool versions remained unchanged, with no installation or global PATH/INCLUDE changes.

Local evidence directory: verification/msvc-repair-20261019-181551 under the private DSHA host installation. It retains source-gate.local.json, samples.local.json and regression logs. Earlier failed dev-smoke receipts remain intact. Installed-adapter validation is recorded separately after deploying the fixed source revision; source-only PASS is not an installed-adapter claim.

Scope: owned synthetic native programs on this Windows x64 host. Visual Studio IDE GUI, arbitrary third-party projects, cross-targets, external dependencies and ZenOffice product acceptance remain NOT_RUN. No Computer Use native control was available; the investigation used source, installation metadata and filesystem evidence.

## Installed result

Fixed code fd2fedc755bfd071dff8caae0c71826cf75ed606 was deployed as adapter2.5.2 in a new source snapshot. All1883 snapshot files passed the installed manifest check; the old snapshot and complete skill/host backup were retained. The installed adapter independently passed both Cargo and Windows C++ compile/link/run samples. A cl-only call also passed SDK activation and the header-bearing COFF health check without requiring Rust. Local receipts are under the above directory's installed/ child.

Final source regression run:107 discovered,99 PASS,8 SKIPPED,0 failures. All eight skips require an explicit real TypeScript/React/Vue project fixture, which was not selected for this native-toolchain task; no frontend readiness claim is made. The separate adapter suite passed3 tests. Four new INCLUDE regression cases are included in the99 passes. Git branch synchronization was checked by comparing the remote branch SHA with local HEAD; no external CI was run for this repository.
