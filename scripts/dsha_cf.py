#!/usr/bin/env python3
"""DSHA Cloudflare dispatch: official cf CLI first; Wrangler credentials isolated.

No automatic login, proxy insertion, or fallback to a different CLI on failure.
The two copies of this module intentionally match for legacy plugin installs.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

PROJECT_OPS = {"init", "dev", "build", "deploy"}
WRANGLER_ONLY = {"tail", "secret", "types"}
CFCLI_ONLY = {"zones", "dns", "radar", "zero-trust", "migrate", "workflows",
              "vectorize", "queues", "pipelines", "schema", "docs", "workers",
              "accounts", "kv", "d1", "r2", "ai"}

def project_kind(path=None):
    root = Path(path) if path is not None else Path.cwd()
    if (root / "cloudflare.config.ts").is_file():
        return "cfcli"
    if any((root / x).is_file() for x in ("wrangler.jsonc", "wrangler.json", "wrangler.toml")):
        return "wrangler"
    return "unspecified"

def _is_own_wrapper(path):
    # The standalone and plugin mirror have different parent depths.
    # Avoid recursing back into DSHA's own cf.cmd while looking for Cloudflare cf.
    try:
        for root in Path(__file__).resolve().parents:
            wrapper = root / "bin" / "cf.cmd"
            if wrapper.exists() and Path(path).samefile(wrapper):
                return True
    except OSError:
        return True
    return False

def _identity_probe(name, path):
    if _is_own_wrapper(path):
        return False
    # Never run whoami, login, or any remote API command as a discovery probe.
    argv = ([path, "cli", "search", "--help"] if name == "cfcli"
            else [path, "whoami", "--help"] if name == "wrangler"
            else [path, "--version"])
    try:
        r = subprocess.run(argv, capture_output=True, text=True, errors="replace",
                           timeout=5, check=False)
        return r.returncode == 0 and bool((r.stdout or r.stderr).strip())
    except (subprocess.TimeoutExpired, OSError):
        return False

def locate(name):
    options = {
        "cfcli": ("cloudflare", "cf", "cloudflare.cmd", "cf.cmd"),
        "wrangler": ("wrangler", "wrangler.cmd"),
        "cloudflared": ("cloudflared", "cloudflared.exe"),
    }.get(name, ())
    candidates = []
    for alias in options:
        path = shutil.which(alias)
        if path:
            candidates.append(path)
    if os.name == "nt":
        npm = Path(os.environ.get("APPDATA") or Path.home() / "AppData/Roaming") / "npm"
        candidates.extend(str(npm / x) for x in options if (npm / x).is_file())
    for path in dict.fromkeys(candidates):
        if Path(path).is_file() and _identity_probe(name, path):
            return path
    return None

def select_command(args, cwd=None):
    """Return a deterministic single-backend plan, never execute or authorize."""
    args = list(args)
    if not args or args[0] == "status":
        return {"status": "STATUS"}
    op, rest = args[0].lower(), args[1:]
    if op in ("wrangler", "cfcli", "cloudflare"):
        if not rest:
            return {"status": "ERR_BLOCK", "error_code": "ERR_COMMAND_REQUIRED"}
        backend = "wrangler" if op == "wrangler" else "cfcli"
        if rest[0] in PROJECT_OPS and project_kind(cwd) not in ("unspecified",backend):
            return {"status": "ERR_BLOCK", "error_code": "ERR_PROJECT_BACKEND_MISMATCH",
                    "reason": "Do not run a project CLI against the other CLI's configuration."}
        return {"status": "ROUTED", "backend": backend, "argv": rest, "explicit": True}
    if op == "whoami":
        return {"status": "ROUTED", "backend": "cfcli", "argv": ["auth", "whoami", *rest]}
    if op == "login":
        return {"status": "ROUTED", "backend": "cfcli", "argv": ["auth", "login", *rest],
                "interactive": True}
    if op == "search":
        if not rest:
            return {"status": "ERR_BLOCK", "error_code": "ERR_QUERY_REQUIRED"}
        return {"status": "ROUTED", "backend": "cfcli",
                "argv": ["cli", "search", " ".join(rest)]}
    if op == "api":
        if not rest:
            return {"status": "ERR_BLOCK", "error_code": "ERR_COMMAND_REQUIRED"}
        return {"status": "ROUTED", "backend": "cfcli", "argv": rest}
    if op in ("auth", "cli", "mcp"):
        return {"status": "ROUTED", "backend": "cfcli", "argv": args}
    if op == "tunnel":
        return {"status": "ROUTED", "backend": "cloudflared", "argv": rest}
    if op in PROJECT_OPS:
        kind = project_kind(cwd)
        return {"status": "ROUTED", "backend": "wrangler" if kind == "wrangler" else "cfcli",
                "argv": args, "project": kind, "needs_project_review": kind == "unspecified"}
    if op == "pages":
        backend = "wrangler" if rest and rest[0] in ("deploy", "dev", "functions", "secret") else "cfcli"
        return {"status": "ROUTED", "backend": backend, "argv": args}
    if op in WRANGLER_ONLY:
        return {"status": "ROUTED", "backend": "wrangler", "argv": args}
    if op in CFCLI_ONLY:
        return {"status": "ROUTED", "backend": "cfcli", "argv": args}
    return {"status": "ERR_BLOCK", "error_code": "ERR_UNKNOWN_CF_COMMAND",
            "reason": "Use explicit 'cfcli <command>' or 'wrangler <command>'. No fallback."}

def status():
    # API token can override both CLIs' profile selection. Never print its value.
    return {"status": "TOOLCHAIN_ONLY", "preferred": "cfcli",
            "cfcli": {"path": locate("cfcli"), "auth": "NOT_CHECKED"},
            "wrangler": {"path": locate("wrangler"), "auth": "NOT_CHECKED"},
            "cloudflared": {"path": locate("cloudflared"), "auth": "NOT_CHECKED"},
            "api_token_env_set": bool(os.getenv("CLOUDFLARE_API_TOKEN")),
            "account_id_env_set": bool(os.getenv("CLOUDFLARE_ACCOUNT_ID")),
            "note": "cf auth whoami != wrangler whoami; never reuse OAuth sessions",
            "proxy_injected": False}

def dispatch(args, cwd=None, execute=True):
    route = select_command(args,cwd)
    if route["status"] == "STATUS":
        return 0,status()
    if route["status"] != "ROUTED":
        return 2,route
    binary = locate(route["backend"])
    if not binary:
        return 2,{"status":"ERR_BLOCK","error_code":"ERR_BACKEND_UNAVAILABLE",
                  "backend":route["backend"],"reason":"No identity-verified executable; no fallback"}
    if not execute:
        return 0,{**route,"status":"PLAN_ONLY","binary":binary,"executed":False}
    if route.get("needs_project_review"):
        return 2,{"status":"ERR_BLOCK","error_code":"ERR_PROJECT_REVIEW_REQUIRED",
                  "backend":route["backend"],"reason":"No recognized project config. Use explicit cfcli command after reviewing project setup."}
    try:
        process = subprocess.run([binary,*route["argv"]],cwd=cwd,check=False)
        return process.returncode,{"status":"EXECUTED","backend":route["backend"],
                                   "returncode":process.returncode}
    except OSError:
        return 2,{"status":"ERR_BLOCK","error_code":"ERR_EXEC_FAILED","backend":route["backend"]}

def run_selftest():
    cases=[(["whoami"],"cfcli"),(["wrangler","whoami"],"wrangler"),
           (["dns","records","list"],"cfcli"),(["tail","worker"],"wrangler")]
    results=[select_command(x).get("backend")==expected for x,expected in cases]
    print(json.dumps({"selftest":"PASS" if all(results) else "FAIL",
                      "passed":sum(results),"total":len(results)}))
    return all(results)

def main(args=None):
    argv=list(sys.argv[1:] if args is None else args)
    if argv and argv[0]=="selftest":
        return 0 if run_selftest() else 1
    if argv and argv[0] in ("--help","-h"):
        print("cf [--route-only] status|whoami|login|search|api|wrangler|cfcli|dev|deploy|...")
        return 0
    dry="--route-only" in argv
    argv=[x for x in argv if x!="--route-only"]
    code,out=dispatch(argv,execute=not dry)
    if out.get("status")!="EXECUTED":
        print(json.dumps(out,ensure_ascii=False,indent=2))
    return code

if __name__=="__main__":
    raise SystemExit(main())
