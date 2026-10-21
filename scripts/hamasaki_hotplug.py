#!/usr/bin/env python3
"""Manifest-first Linux hot plug; never import code during discovery."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tempfile

IDENT = re.compile(r"ext-[a-z0-9][a-z0-9_-]{1,45}\Z")
ENTRY = re.compile(r"[a-zA-Z][a-zA-Z0-9_-]*\.py\Z")
SCHEMA = "hamasaki.tool/v1"

def home():
    return Path(os.getenv("HAMASAKI_TOOLS_DIR") or Path(os.getenv("XDG_DATA_HOME", str(Path.home()/".local/share")))/"hamasaki/tools")

def trust_file():
    return Path(os.getenv("HAMASAKI_TRUST_FILE") or Path(os.getenv("XDG_CONFIG_HOME", str(Path.home()/".config")))/"hamasaki/tool-approvals.json")

def isfile(p):
    try: return stat.S_ISREG(p.lstat().st_mode)
    except OSError: return False

def isdir(p):
    try: return stat.S_ISDIR(p.lstat().st_mode)
    except OSError: return False

def approvals():
    p=trust_file()
    if not isfile(p) or p.stat().st_size>65536: return {}
    try:
        data=json.loads(p.read_text("utf-8"))
        return data if isinstance(data,dict) else {}
    except (ValueError,OSError): return {}

def save(data):
    p=trust_file();p.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    if not isdir(p.parent) or (p.exists() and not isfile(p)): raise ValueError("unsafe approval path")
    with tempfile.NamedTemporaryFile(mode="w",dir=p.parent,delete=False) as f:
        t=Path(f.name);os.chmod(t,0o600);json.dump(data,f,sort_keys=True);f.flush();os.fsync(f.fileno())
    try: os.replace(t,p)
    finally: t.unlink(missing_ok=True)

def check_manifest(m,folder):
    if not isinstance(m,dict) or m.get("schema")!=SCHEMA or m.get("id")!=folder.name:
        raise ValueError("invalid schema/id")
    if not IDENT.fullmatch(folder.name): raise ValueError("bad id")
    if not isinstance(m.get("name"),str) or not 1<=len(m["name"])<=100: raise ValueError("name")
    if not isinstance(m.get("version"),str): raise ValueError("version")
    if "category" in m and (not isinstance(m["category"],str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,39}",m["category"])):
        raise ValueError("category")
    if not isinstance(m.get("entry"),str) or not ENTRY.fullmatch(m["entry"]) or not isfile(folder/m["entry"]):
        raise ValueError("entry")
    kws=m.get("keywords",[])
    if not isinstance(kws,list) or len(kws)>20 or not all(isinstance(x,str) and 0<len(x)<=48 for x in kws):
        raise ValueError("keywords")
    acts=m.get("actions")
    if not isinstance(acts,dict) or not acts or len(acts)>16: raise ValueError("actions")
    for key,a in acts.items():
        if not isinstance(key,str) or not re.fullmatch(r"[a-z][a-z0-9_-]{0,31}",key) or not isinstance(a,dict):
            raise ValueError("action name")
        args=a.get("argv",[])
        if a.get("risk")!="read-only" or not isinstance(args,list) or len(args)>16 or not all(
            isinstance(x,str) and len(x)<=128 and "\x00" not in x for x in args):
            raise ValueError("v1 only accepts fixed read-only actions")
        if type(a.get("timeout",5)) is not int or not 1<=a.get("timeout",5)<=15: raise ValueError("timeout")
    return m

def fingerprint(folder):
    if not isdir(folder): raise ValueError("linked tool directory")
    digest=hashlib.sha256();total=count=0
    for root,dirs,files in os.walk(folder,followlinks=False):
        dirs.sort();files.sort()
        for d in dirs:
            if not isdir(Path(root)/d): raise ValueError("linked subdirectory")
        for name in files:
            p=Path(root)/name
            if not isfile(p): raise ValueError("linked file")
            rel=p.relative_to(folder)
            if any(x in (".git","__pycache__") for x in rel.parts): raise ValueError("git/cache")
            size=p.stat().st_size;total+=size;count+=1
            if total>32*1024*1024 or count>128: raise ValueError("package too large")
            digest.update(rel.as_posix().encode()+b"\x00"+str(size).encode()+b"\x00")
            with p.open("rb") as f:
                while block:=f.read(65536): digest.update(block)
    return digest.hexdigest()

def inspect(folder,known=None):
    item={"id":folder.name,"status":"BLOCKED","executable":False}
    try:
        p=folder/"hamasaki-tool.json"
        if not isfile(p) or p.stat().st_size>32768: raise ValueError("missing/oversized manifest")
        m=check_manifest(json.loads(p.read_text("utf-8")),folder)
        digest=fingerprint(folder);approved=(approvals() if known is None else known).get(folder.name)
        status="READY" if digest==approved else "CHANGED_REVIEW_REQUIRED" if approved else "UNTRUSTED"
        return {**item,"status":status,"executable":status=="READY","sha256":digest,
                "name":m["name"],"keywords":m["keywords"],"category":m.get("category","ThirdParty"),"actions":sorted(m["actions"])}
    except (OSError,ValueError,KeyError,TypeError,UnicodeError) as e:
        return {**item,"reason":str(e)[:160]}

def scan():
    root=home()
    if not root.exists():return []
    if not isdir(root):return [{"id":"[root]","status":"BLOCKED","reason":"invalid root"}]
    known=approvals()
    return [inspect(p,known) for p in sorted(root.iterdir())[:80] if isdir(p) or p.is_symlink()]

def catalog():
    return {x["id"]:{"name":x["name"],"keywords":x["keywords"],"extensions":[],
                    "exact_filenames":[],"weight":1,"hotplug":True,"hotplug_status":x["status"]}
            for x in scan() if x["status"]!="BLOCKED"}

def approve(id,digest):
    if not IDENT.fullmatch(id) or not re.fullmatch(r"[0-9a-f]{64}",digest):
        return {"status":"ERR_BLOCK","error_code":"ERR_INVALID_APPROVAL"}
    result=inspect(home()/id,known={})
    if result.get("sha256")!=digest:return {"status":"ERR_BLOCK","error_code":"ERR_PACKAGE_CHANGED"}
    data=approvals();data[id]=digest;save(data)
    return {"status":"APPROVED","id":id,"sha256":digest}

def revoke(id):
    if not IDENT.fullmatch(id):return {"status":"ERR_BLOCK","error_code":"ERR_INVALID_TOOL"}
    data=approvals();data.pop(id,None);save(data)
    return {"status":"REVOKED","id":id}

def issued_index():
    import hamasaki_identity as identities
    return identities.snapshot(Path(__file__).resolve().parents[1],scan())

def run(id,action):
    # Alias and sha256:hash are both supported; cryptographic identity wins.
    from hamasaki_executor import execute
    if isinstance(id,str) and id.startswith("sha256:"):
        value=id.removeprefix("sha256:")
        if not re.fullmatch(r"[0-9a-f]{64}",value):
            return {"status":"ERR_BLOCK","error_code":"ERR_INVALID_TOOL"}
        try:
            current=issued_index()
        except (ValueError,OSError,KeyError):
            return {"status":"ERR_BLOCK","error_code":"ERR_CORE_PINS_UNAVAILABLE"}
        choices=[x for x in current["tools"].values() if x.get("uid")==value and x.get("source")=="plugin"]
        if len(choices)!=1:
            return {"status":"ERR_BLOCK","error_code":"ERR_TOOL_HASH_UNKNOWN"}
        row=choices[0]
        return execute(row["alias"],action,expected_uid=value,
                       expected_category_uid=row.get("category_uid"))
    return execute(id,action)

def main(argv=None):
    ap=argparse.ArgumentParser(description="Hamasaki manifest-first local tools")
    sub=ap.add_subparsers(dest="cmd",required=True);sub.add_parser("list")
    a=sub.add_parser("inspect");a.add_argument("id")
    a=sub.add_parser("approve");a.add_argument("id");a.add_argument("--sha256",required=True)
    a.add_argument("--acknowledge-code-risk",action="store_true")
    a=sub.add_parser("revoke");a.add_argument("id")
    a=sub.add_parser("run");a.add_argument("id");a.add_argument("action")
    opts=ap.parse_args(argv)
    if opts.cmd=="list":
        import hamasaki_identity as hi
        repo=Path(__file__).resolve().parents[1]
        try: r={"status":"CATALOG_ONLY","identity":hi.snapshot(repo,scan()),"executed":False}
        except (ValueError,OSError): r={"status":"ERR_BLOCK","error_code":"ERR_CORE_PINS_UNAVAILABLE","executed":False}
    elif opts.cmd=="inspect":
        r=inspect(home()/opts.id) if IDENT.fullmatch(opts.id) else {"status":"ERR_BLOCK","error_code":"ERR_INVALID_TOOL"}
        if r.get("sha256"):
            try:
                row=issued_index()["tools"].get(opts.id,{})
                r={**r,"tool_uid":row.get("uid"),"category_uid":row.get("category_uid"),
                   "identity_schema":"dsha-hashchain-v1"}
            except (ValueError,OSError,KeyError):
                r={"status":"ERR_BLOCK","error_code":"ERR_CORE_PINS_UNAVAILABLE"}
    elif opts.cmd=="approve":r=approve(opts.id,opts.sha256) if opts.acknowledge_code_risk else {"status":"ERR_BLOCK","error_code":"ERR_EXPLICIT_ACK_REQUIRED"}
    elif opts.cmd=="revoke":r=revoke(opts.id)
    else:r=run(opts.id,opts.action)
    print(json.dumps(r,ensure_ascii=False,indent=2))
    return 2 if r["status"] in ("ERR_BLOCK","BLOCKED","FAILED") else 0

if __name__=="__main__":raise SystemExit(main())
