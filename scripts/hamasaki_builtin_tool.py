#!/usr/bin/env python3
"""Built-in productivity Tool adapter: pinned status-only execution contract.

No extra middle layer in DSHA architecture. This module is an ordinary Tool
launcher that verifies the existing Hash Registry before invoking its adapter.
File-bearing actions intentionally ERR_BLOCK until real OS sandbox validation.
"""
from __future__ import annotations
import json
from pathlib import Path
import os
import subprocess
import sys
import hamasaki_identity as identity

SUPPORTED = frozenset({"markdown", "office", "wps"})

def run(tool, args):
    if tool not in SUPPORTED:
        return 126, {"status":"ERR_BLOCK","error_code":"ERR_TOOL_UNKNOWN"}
    if not isinstance(args,list) or args!=["status"]:
        return 126, {"status":"ERR_BLOCK","error_code":"ERR_SANDBOX_NOT_VALIDATED",
                     "tool":tool,"executed":False}
    root=Path(__file__).resolve().parents[1]
    try:
        current=identity.snapshot(root,[])
        if any(row["status"]!="PINNED" for row in current["tools"].values()
               if row["source"]=="builtin"):
            raise ValueError("ERR_CORE_PIN_MISMATCH")
        record=current["tools"].get(tool)
        if not record or record["status"]!="PINNED":
            raise ValueError("ERR_HASH_MISMATCH")
        if identity.verify(current,tool,record["uid"],record["category_uid"])["status"]!="VERIFIED":
            raise ValueError("ERR_HASH_MISMATCH")
    except (OSError,ValueError,KeyError,TypeError):
        return 126,{"status":"ERR_BLOCK","error_code":"ERR_CORE_PIN_MISMATCH",
                    "tool":tool,"executed":False}
    adapter=root/"tools"/tool/"adapter.py"
    try:
        minimal={"PATH":"/usr/bin:/bin","HOME":"/nonexistent",
                 "LANG":"C.UTF-8","PYTHONDONTWRITEBYTECODE":"1"}
        process=subprocess.run([sys.executable,"-I","-B",str(adapter),"status"],
                               timeout=8,capture_output=True,text=True,
                               errors="replace",check=False,env=minimal)
        # Only document readiness flags may cross this boundary, never raw logs.
        summary=json.loads(process.stdout.strip())
        if not isinstance(summary,dict) or summary.get("tool")!=tool:
            raise ValueError("ERR_INVALID_ADAPTER_OUTPUT")
        allow=("status","tool","runtime","dependencies","applications",
               "pywpsrpc","graphical_session","executed_application","side_effects")
        result={k:summary[k] for k in allow if k in summary}
        result["tool_uid"]=record["uid"]
        result["category_uid"]=record["category_uid"]
        result["executed_action"]="status"
        return (0 if process.returncode==0 else 126),result
    except subprocess.TimeoutExpired:
        return 124,{"status":"ERR_BLOCK","error_code":"ERR_STATUS_TIMEOUT",
                    "tool":tool,"executed":False}
    except (OSError,ValueError,KeyError,TypeError):
        return 126,{"status":"ERR_BLOCK","error_code":"ERR_ADAPTER_FAILED",
                    "tool":tool,"executed":False}

def main(tool, args=None):
    argv=list(sys.argv[1:] if args is None else args)
    status,out=run(tool,argv)
    print(json.dumps(out,ensure_ascii=False))
    return status
