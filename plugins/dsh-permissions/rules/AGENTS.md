# DSH Permissions -- permission tier rules

This environment runs the **DSH Permissions** plugin. It ports the four DeepSeek
Harness permission presets onto Antigravity and enforces them with a `PreToolUse`
lifecycle hook.

This file is deliberately pure ASCII: it is injected into the agent prompt, and
keeping every injected byte ASCII removes any encoding as a variable.

## The four tiers

The active tier is recorded in `tier.json` in the plugin directory (field
`tier`) and is written by `agy-tier.ps1`.

| Tier | File writes | Command approval | Enforced by |
|---|---|---|---|
| `read-only` | blocked / must be confirmed | observation commands pass, the rest are denied or need confirmation | hook |
| `workspace-write` | workspace + permitted temp dirs only | approval outside the allowlist | Antigravity native settings |
| `danger-full-access` | unrestricted | never asks | Antigravity native settings |
| `auto` | unrestricted | every call judged by a local policy engine | hook |

## Rules for the agent

1. **Do not work around a denial.** If the hook returns `deny`, the current tier
   forbids that operation. Do not rewrite the command to slip past the
   classifier (for example by substituting an equivalent destructive command, or
   by splitting a write into several steps). Tell the user instead: which tier is
   active, what was refused, and why.

2. **Do not attempt writes under `read-only`.** That tier means "nothing is
   writable". Do not reach for `echo >`, `Set-Content`, `New-Item`, `git commit`
   and similar. If a write is genuinely required, ask the user to switch tiers
   first.

3. **`auto` is not a model review.** That tier is decided by a deterministic local
   regular-expression policy, not by the "same model reviews each call" scheme
   used in DeepSeek Harness. It can allow or block the wrong thing. If a decision
   looks wrong, say so rather than silently proceeding.

4. **State your intent.** Before a destructive or irreversible operation, explain
   the command and its expected effect to the user even when the active tier
   would auto-approve it.

5. **The audit trail is available.** Every decision that is not a plain allow is
   appended to `logs/gate.log` in the plugin directory (rotated to `gate.log.1`
   past 512 KB).

## Engineering Lock (L1-L8)

This environment also runs the **Engineering Lock**, a second and independent gate.
The permission tiers above decide *whether* an action is allowed; the lock decides
whether the *result* is trustworthy. It is separate from the tier system and can be
enabled or disabled on its own.

Checker: `scripts\englock.py` (same stdin/stdout protocol as `gate.py`).
Config:  `englock.json` (default `mode: "advisory"`).

### The eight locks

| ID | Lock | Requirement |
|----|------|-------------|
| L1 | Source | Every number or conclusion carries a source: a command, a file, a log, or a turn index. Computed/estimated values MUST be tagged `[EXTRAPOLATED]`. |
| L2 | Sample | Any word like verified / proved / confirmed / established MUST be accompanied by a sample size. With n=1, write "single observation" instead. |
| L3 | Retraction | If a new conclusion contradicts an earlier one, the text MUST contain an explicit retraction note: what was withdrawn, when, and where. |
| L4 | Triple delivery | A finished task delivers three things: the report, the command to reproduce it, and the way to roll it back. |
| L5 | Report header | A report MUST carry six fields: date; device and firmware; tool and version; sample size; measured vs extrapolated; conclusion strength. |
| L6 | Wording | Absolute wording is banned: epic, flawless, perfect, 100%, completely, universal, absolute, invincible. Quantify instead. |
| L7 | Re-entry | After a gap longer than six hours, or when a new session takes over, first print a state reconciliation: last conclusions, open items, rollback points. Only then act. |
| L8 | External review | Before anything is published externally, list the three claims most likely to be overturned. |

### Rules for the agent

1. When `englock` returns `deny`, the content violates a hard lock. Fix the content;
   do not reword the check away.
2. When it returns `allow` with an `ENG LOCK (advisory)` reason, the lock found
   issues. Address them in the document; do not silently ignore them.
3. Report findings honestly, including when they concern your own earlier output.

## Language Norm Lock (L9)

The lock also governs *language quality*, so that fluent output never outruns the
evidence behind it. Word lists are data, not code: edit `lexicon.json` and the
behaviour changes immediately.

### Sub-rules

| ID | Rule | Trigger | Level |
|----|------|---------|-------|
| L9.1 | Banned wording | any hit in `ban_absolute` / `ban_marketing` / `ban_promise` / `ban_selfpraise` (epic, flawless, perfect, 100%, ultimate, guaranteed, "I fully solved", ...) | HARD (denied in strict) |
| L9.2 | Source-less authority | "official", "industry consensus", "widely known", "authoritative" with no source marker anywhere | advisory |
| L9.3 | Fake precision | two or more decimal places with no sample size, error bar, or precision note | advisory |
| L9.4 | Premature completion | "fixed", "resolved", "done", "now live", "shipped" with no validation marker (verified / retested / n= / pending) | advisory |
| L9.5 | Terminology drift | two or more spellings from the same `term_groups` entry inside one document | advisory |
| L9.6 | Unresolvable citation | a `file:///...` path in the text that does not exist on disk | advisory |
| L9.7 | Forward-looking without uncertainty | "will / plan to / expected to" with no uncertainty marker | advisory |

### Rules for the agent

1. **Write the strength of your evidence, not the strength of your feelings.**
   If the sample is n=1, say "single observation"; if a value was computed, tag it
   `[EXTRAPOLATED]`; if a conclusion was withdrawn, say so in the same document.
2. When L9 fires, **rewrite the sentence**, do not delete the finding. The point is
   accurate wording, not a clean log.
3. If a word is flagged but is being used with technical precision, fix the wording
   rather than arguing with the lock -- or amend `lexicon.json` if the entry is
   genuinely wrong.
