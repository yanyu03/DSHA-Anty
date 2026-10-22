# Kaeru Local · Real-host acceptance rubric

## Evidence grades

| Level | Required observation | What cannot be inferred |
|---|---|---|
| L0 DISCOVERED | Runtime, declared tool and version/identity discovered | The tool can run |
| L1 INVOCABLE | Real bounded command, exit and semantic result | The command was safely isolated |
| L2 ISOLATED | Process, filesystem, credential and network boundaries tested including negatives | An end-user business task works |
| L3 END_TO_END | Task -> route -> auth -> sandbox -> real tool -> checked output -> receipt -> cleanup, repeatably | Other tools/hosts will also work |

Mock and static tests may support L0/L1 *contracts*, not an unobserved L2 or L3 on a real host.

## Suggested first scenario (read-only)

**Input:** synthetic `test.md`, with a correct heading and an intentional level jump.

**Expected:** Markdown heading report identifying the jump; unchanged SHA256; authorized read-only execution; trace ID that corresponds to the actual action.

```text
[ ] Capture source SHA, dirty working tree and runtime paths privately.
[ ] Record host OS, architecture, available command and permission context.
[ ] Establish disposable workspace and fixture hashes.
[ ] Route without falling back to arbitrary tool or shell.
[ ] Check Gate tier AND host-agent authorization before invoking.
[ ] Confirm actual sandbox isolation; if unavailable stop as BLOCKED.
[ ] Invoke the selected tool with explicit arguments and bounded resources.
[ ] Check output against expected fixture ground truth, not just exit 0.
[ ] Check pre/post hashes, children/process cleanup and side effects.
[ ] Verify receipt: actual execution must not be marked PLANNED.
[ ] Repeat and inject no-match, no-runtime, denied permission, timeout, corrupt input.
[ ] Record PASS/FAIL/BLOCKED/NOT_RUN individually with evidence.
```

For Windows, a separate optional synthetic DOCX/XLSX/PPTX read-only suite can follow. For Linux, pursue the Markdown native sandbox first.

## Minimum local evidence fields

```json
{
  "profile": "kaeru-local/0.1-reference",
  "source_commit": "<observed commit>",
  "host": "<OS/arch>",
  "scenario": "<owned fixture, expected semantic result>",
  "agent_authorization": "EXPLICIT|DENIED|NOT_REQUESTED",
  "dsha_tier_observed": "<tier read from disk>",
  "sandbox": "VERIFIED|UNAVAILABLE|NOT_RUN",
  "execution": "PASS|FAIL|BLOCKED|NOT_RUN",
  "exit_code": null,
  "input_sha256_before": "<hash>",
  "input_sha256_after": "<hash>",
  "result_verified": false,
  "children_cleaned": "YES|NO|NOT_RUN",
  "evidence_path": "<private local path>",
  "limitations": []
}
```

This is a recommended **report** schema, not a claim the current core emits this JSON. Never publish user paths, workspace contents, sensitive environment variables, tokens or private source material.
