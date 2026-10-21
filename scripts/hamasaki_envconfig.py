"""Bounded discovery for an existing DSHA Tool, adapted from fix/env-config.

Discovery is NOT permission, executable authenticity or a command-execution grant.
Explicit invalid overrides fail closed without a PATH or sibling-tool fallback.
No .env loading, process execution, account queries or logging of machine paths.
"""
from __future__ import annotations
import os
from pathlib import Path
import re
import shutil

ENV_KEYS = {
    "bash":"DSHA_BASH", "git":"DSHA_GIT", "gh":"DSHA_GH",
    "node":"DSHA_NODE", "npm":"DSHA_NPM", "pwsh":"DSHA_PWSH",
    "dolphin":"DSHA_DOLPHIN", "kreadconfig":"DSHA_KREADCONFIG",
    "cfcli":"DSHA_CF", "wrangler":"DSHA_WRANGLER",
    "cloudflared":"DSHA_CLOUDFLARED",
}
BARE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._+-]{0,127}\Z")

def resolve_runtime(name, aliases, *, explicit=None, environ=None):
    """Return private path and public status; never execute the result.

    Order: explicit > DSHA_<tool> > PATH aliases. A present but empty override
    is INVALID_OVERRIDE, not a request to fall through.
    """
    if name not in ENV_KEYS or not aliases:
        raise ValueError("ERR_UNKNOWN_RUNTIME")
    env=os.environ if environ is None else environ
    key=ENV_KEYS[name]
    forced=explicit is not None or key in env
    override=explicit if explicit is not None else env.get(key)
    if forced:
        if not isinstance(override,str) or not override or "\x00" in override or len(override)>4096:
            return {"state":"INVALID_OVERRIDE","path":None,"source":"explicit"}
        candidate=Path(override).expanduser()
        if candidate.is_absolute():
            # Only user-specified *files*, never directories or bare parent paths.
            try:
                if candidate.is_file() and os.access(candidate,os.X_OK):
                    return {"state":"CONFIGURED","path":str(candidate),"source":"explicit"}
            except OSError:
                pass
            return {"state":"INVALID_OVERRIDE","path":None,"source":"explicit"}
        if not BARE.fullmatch(override):
            return {"state":"INVALID_OVERRIDE","path":None,"source":"explicit"}
        path=shutil.which(override,path=env.get("PATH",os.defpath))
        return {"state":"CONFIGURED" if path else "INVALID_OVERRIDE",
                "path":path,"source":"explicit"}
    for alias in aliases:
        path=shutil.which(alias,path=env.get("PATH",os.defpath))
        if path:
            return {"state":"DISCOVERED","path":path,"source":"path"}
    return {"state":"UNAVAILABLE","path":None,"source":"none"}
