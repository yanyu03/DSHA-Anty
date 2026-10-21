# Hamasaki CF CLI / Wrangler authentication isolation (v0.4)

Cloudflare official CLI is installed as `cf` / `cloudflare` (npm package `cf`). Its OAuth credentials are independent from Wrangler's OAuth credentials. A shared `CLOUDFLARE_API_TOKEN` environment variable, when present, takes precedence over locally stored OAuth profiles; do not log token contents or infer account ownership from a binary being installed.

## Explicit dispatch

| Request | Tool chosen | Auth check |
| --- | --- | --- |
| `cf status` | Local tool identity only | NONE |
| `cf whoami` | Cloudflare CLI: `cf auth whoami` | cf only |
| `cf wrangler whoami` | Wrangler: `wrangler whoami` | Wrangler only |
| `cf login` | Cloudflare CLI: `cf auth login` | User-interactive |
| `cf wrangler login` | Wrangler login | User-interactive |
| `cf zones list`, `cf dns ...`, `cf api ...` | Cloudflare CLI | cf only |
| `cf search 'task'` | `cf cli search` | NONE |
| `cf dev/build/deploy` with `cloudflare.config.ts` | Cloudflare CLI | cf only |
| `cf dev/build/deploy` with `wrangler.jsonc/json/toml` but no cf config | Wrangler | Wrangler only |
| No project config | Cloudflare CLI preferred | Review before potentially creating config |
| `cf tail`, `cf pages deploy` | Wrangler-specific | Wrangler only |
| `cf tunnel` | cloudflared | Separate |

**Never** retry the same action on the other backend after an authentication failure; never convert existing Wrangler projects automatically. The cf CLI login profile is not evidence that Wrangler is authenticated. Use `cf auth whoami` versus `wrangler whoami` to check separately. When running noninteractively supply scoped `CLOUDFLARE_API_TOKEN` and explicit account selection; check `CLOUDFLARE_ACCOUNT_ID` before mutations.

Existing `dsha_cf.py` and its plugin mirror now share a deterministic router. The previous `whoami -> wrangler` delegation, unverified cf→Wrangler fallback, and automatic localhost SOCKS/HTTP proxy injection have been removed.

On Linux Hamasaki plans `cf` (cf CLI, default) and `wrangler` as independent tool identities with independent EnvFeel probes. These are *planning capabilities* and do not yet imply production-ready remote execution.

Smoke checks (no credentials or API use):

```bash
python3 -m unittest discover -s scripts -p 'test_cf_routing.py' -v
python3 scripts/dsha_cf.py --route-only whoami
python3 scripts/dsha_cf.py --route-only wrangler whoami
python3 scripts/dsha_cf.py status
```

Official docs: https://developers.cloudflare.com/cf/get-started/ ; https://developers.cloudflare.com/cf/agents/ ; https://developers.cloudflare.com/workers/wrangler/commands/general/
