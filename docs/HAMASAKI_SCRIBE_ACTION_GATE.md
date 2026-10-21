# Scribe action-aware permission and XDG isolation check

Scribe was tagged `READ_ONLY` but the `status` subcommand called `harvest()`, which wrote `latest_harvest.json` into `.scribe`; `harvest` and `dossier` also persist data.

Fix in this branch:
- `status` now gathers information with `harvest(..., persist=False)`; it must not create a cache.
- BaseTool checks Scribe's verb: only a single `status` argument retains READ_ONLY risk; all other verbs including no arguments and unrecognized commands require at least workspace-write.
- `git status --short` sets `GIT_OPTIONAL_LOCKS=0` to reduce optional Git index writes.
- Linux Scribe user paths use XDG config/state/cache; Windows-compatible legacy paths remain only on Windows. Data is not written into the checkout during a Linux Scribe status operation.

Six offline tests validate permission classification, no-cache status, Git optional locks and XDG path policy.

Still not complete: all original seven legacy Tools use BaseTool launcher containment but do not automatically inherit HotPlug's Bubblewrap runtime sandbox. `status` remains a local filesystem/metadata inspection and may expose sensitive information in returned stdout if upstream prompts request too much; restrict at caller policy.
