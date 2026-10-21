"""Hamasaki v0.5: local-only, content-addressed DSHA tool and category identities.

SHA256 identities DO NOT prove publisher authenticity or grant permissions.
Legacy files are verified against pinned Git blob hashes (baseline manifest).
No user input, secrets, runtime environment, or file paths enter receipts.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import re
import stat

PROTO = "dsha-1.2.0-std"
CHAIN = "dsha-hashchain-v1"
HASH256 = re.compile(r"^[0-9a-f]{64}$")
GIT_HASH = re.compile(r"^[0-9a-f]{40}$")

def canonical(data):
    return json.dumps(data, sort_keys=True, ensure_ascii=False, separators=(",",":"),
                      allow_nan=False).encode("utf-8")

def digest(kind, data):
    return hashlib.sha256(b"DSHA/"+kind.encode("ascii")+b"/v1\0"+canonical(data)).hexdigest()

def git_blob(raw):
    return hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\0"+raw).hexdigest()

def regular(path):
    try:
        return stat.S_ISREG(path.lstat().st_mode)
    except OSError:
        return False

def read_pins(repo):
    path=repo/"config/hamasaki_builtin_pins_v1.json"
    if not regular(path) or path.stat().st_size>256*1024:
        raise ValueError("ERR_PIN_MANIFEST_UNAVAILABLE")
    data=json.loads(path.read_text("utf-8"))
    if not isinstance(data,dict) or data.get("schema")!="hamasaki.builtin-pins/v1":
        raise ValueError("ERR_PIN_SCHEMA")
    tools=data.get("tools")
    if not isinstance(tools,dict) or not tools:
        raise ValueError("ERR_PIN_EMPTY")
    for name,row in tools.items():
        if not isinstance(name,str) or not re.fullmatch(r"[a-z][a-z0-9_-]{1,50}",name):
            raise ValueError("ERR_PIN_TOOL_ID")
        if not isinstance(row,dict) or not isinstance(row.get("category"),str):
            raise ValueError("ERR_PIN_CATEGORY")
        if not isinstance(row.get("files"),dict) or not row["files"]:
            raise ValueError("ERR_PIN_FILES")
        for rel,oid in row["files"].items():
            if not isinstance(rel,str) or not isinstance(oid,str):
                raise ValueError("ERR_PIN_FORMAT")
            p=Path(rel)
            if p.is_absolute() or not p.parts or any(x in ("..",".","") for x in p.parts) or not GIT_HASH.fullmatch(oid):
                raise ValueError("ERR_PIN_PATH_OR_DIGEST")
    return data

def builtin(repo,pins=None):
    pins=pins if pins is not None else read_pins(repo)
    root=repo.resolve()
    out={}
    for alias,item in sorted(pins["tools"].items()):
        state="PINNED";checks=[]
        for rel,oid in sorted(item["files"].items()):
            path=repo/rel
            if not regular(path) or not path.resolve().is_relative_to(root):
                state="BLOCKED_MISSING_OR_LINKED";break
            try:
                raw=path.read_bytes()
            except OSError:
                state="BLOCKED_UNREADABLE";break
            if git_blob(raw)!=oid:
                state="BLOCKED_PIN_MISMATCH";break
            checks.append({"path":rel,"sha256":hashlib.sha256(raw).hexdigest()})
        uid=digest("tool",{"namespace":"builtin","name":alias,"category":item["category"],
                           "files":checks}) if state=="PINNED" else None
        out[alias]={"alias":alias,"category":item["category"],"uid":uid,"status":state,
                    "source":"builtin"}
    return out

def extensions(rows):
    out={}
    for item in rows:
        alias=item.get("id")
        blob=item.get("sha256")
        if not isinstance(alias,str) or not alias.startswith("ext-"):
            continue
        cat=item.get("category","ThirdParty")
        if not isinstance(cat,str) or not 1<=len(cat)<=72:
            cat="ThirdParty"
        valid=isinstance(blob,str) and bool(HASH256.fullmatch(blob))
        uid=digest("tool",{"namespace":"plugin","name":alias,"category":cat,
                           "package_sha256":blob}) if valid else None
        out[alias]={"alias":alias,"category":cat,"uid":uid,"content_sha256":blob if valid else None,
                    "source":"plugin","status":item.get("status","BLOCKED"),
                    "approved":item.get("status")=="READY"}
    return out

def snapshot(repo,plugin_scan=None,pins=None,virtual=None):
    core=builtin(repo,pins)
    plugins=extensions(plugin_scan or [])
    for alias in set(core)&set(plugins):
        plugins[alias]["status"]="BLOCKED_ALIAS_COLLISION"
        plugins[alias]["uid"]=None
    simulated={}
    for alias,entry in sorted((virtual or {}).items()):
        if alias in core or alias in plugins:
            continue
        category=entry.get("category","Virtual")
        if not isinstance(category,str):
            raise ValueError("ERR_VIRTUAL_CATEGORY")
        uid=digest("tool",{"namespace":"virtual","name":alias,"category":category,
                           "metadata":entry})
        simulated[alias]={"alias":alias,"category":category,"uid":uid,
                          "status":"PLAN_ONLY","source":"virtual"}
    all_tools={**core,**plugins,**simulated}
    buckets={}
    for tool in all_tools.values():
        if tool["uid"] and tool["status"] in ("PINNED","READY","PLAN_ONLY"):
            buckets.setdefault(tool["category"],[]).append(tool["uid"])
    categories={name:digest("category",{"name":name,"tools":sorted(identities)})
                for name,identities in sorted(buckets.items())}
    for row in all_tools.values():
        row["category_uid"]=categories.get(row["category"])
    return {"protocol":PROTO,"schema":CHAIN,"privacy":"local_only",
            "tools":all_tools,"categories":categories,
            "registry_uid":digest("registry",{"categories":categories})}

def verify(index,alias,tool_uid,category_uid,require_approved=True):
    row=index.get("tools",{}).get(alias)
    if not row or not row.get("uid"):
        return {"status":"ERR_BLOCK","error_code":"ERR_HASH_UNAVAILABLE"}
    if row["uid"]!=tool_uid or row.get("category_uid")!=category_uid:
        return {"status":"ERR_BLOCK","error_code":"ERR_HASH_MISMATCH"}
    if row["status"] not in ("PINNED","READY"):
        return {"status":"ERR_BLOCK","error_code":"ERR_TOOL_NOT_APPROVED"}
    if require_approved and row["source"]=="plugin" and not row.get("approved"):
        return {"status":"ERR_BLOCK","error_code":"ERR_TOOL_NOT_APPROVED"}
    return {"status":"VERIFIED","tool_uid":tool_uid,"category_uid":category_uid}

def chain_receipt(index,alias,action,receipt_status="PLANNED"):
    row=index["tools"].get(alias)
    if not row or not row.get("uid"):
        return {"protocol":PROTO,"schema":CHAIN,"status":"ERR_BLOCK",
                "error_code":"ERR_HASH_UNAVAILABLE","executed":False}
    out={"protocol":PROTO,"schema":CHAIN,"tool_uid":row["uid"],
         "category_uid":row.get("category_uid"),
         "registry_uid":index["registry_uid"],"action":action,
         "status":receipt_status,"executed":False}
    out["receipt_uid"]=digest("receipt",out)
    return out


def verify_receipt(index, receipt):
    """Verify a hash-only DSHA protocol receipt; NOT a signature or execution grant."""
    from collections.abc import Mapping
    import hmac
    fields={"protocol","schema","tool_uid","category_uid","registry_uid",
            "action","status","executed","receipt_uid"}
    if not isinstance(receipt, Mapping) or set(receipt)!=fields:
        return {"status":"ERR_BLOCK","error_code":"ERR_RECEIPT_SCHEMA"}
    if receipt["protocol"]!=PROTO or receipt["schema"]!=CHAIN:
        return {"status":"ERR_BLOCK","error_code":"ERR_PROTOCOL_MISMATCH"}
    if receipt["registry_uid"]!=index.get("registry_uid"):
        return {"status":"ERR_BLOCK","error_code":"ERR_REGISTRY_CHANGED"}
    computed=digest("receipt",{k:v for k,v in receipt.items() if k!="receipt_uid"})
    if not isinstance(receipt["receipt_uid"],str) or not hmac.compare_digest(computed,receipt["receipt_uid"]):
        return {"status":"ERR_BLOCK","error_code":"ERR_RECEIPT_TAMPERED"}
    matches=[key for key,row in index["tools"].items() if row.get("uid")==receipt["tool_uid"]]
    if len(matches)!=1:
        return {"status":"ERR_BLOCK","error_code":"ERR_TOOL_HASH_UNKNOWN"}
    if index["tools"][matches[0]]["category_uid"]!=receipt["category_uid"]:
        return {"status":"ERR_BLOCK","error_code":"ERR_CATEGORY_HASH_MISMATCH"}
    return {"status":"VERIFIED","alias":matches[0],"tool_uid":receipt["tool_uid"]}
