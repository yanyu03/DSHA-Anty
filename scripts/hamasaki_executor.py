"""Hash-bound untrusted plugin execution. Linux-only, no host-root mounts."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import hamasaki_identity as ids
import hamasaki_sandbox as sandbox

def fail(code,attempted=False):
    return {"status":"ERR_BLOCK","error_code":code,"executed":attempted,
            "privacy":"local_only_no_output"}

def execute(alias,action,expected_uid=None,expected_category_uid=None):
    import hamasaki_hotplug as plugs
    if not isinstance(alias,str) or not plugs.IDENT.fullmatch(alias):
        return fail("ERR_INVALID_TOOL")
    if sys.platform!="linux":
        return fail("ERR_PLATFORM_UNSUPPORTED")
    from hamasaki_linux import tier_status
    repo=Path(__file__).resolve().parents[1]
    if tier_status(repo) not in ("read-only","auto","workspace-write","danger-full-access"):
        return fail("ERR_POLICY_UNKNOWN")
    observed=plugs.inspect(plugs.home()/alias)
    if observed.get("status")!="READY":
        return fail("ERR_TOOL_NOT_APPROVED")
    if action not in observed.get("actions",()):
        return fail("ERR_UNKNOWN_ACTION")
    try:
        index=ids.snapshot(repo,plugs.scan())
    except (ValueError,OSError,KeyError,TypeError):
        return fail("ERR_CORE_PINS_UNAVAILABLE")
    if any(x["status"]!="PINNED" for x in index["tools"].values() if x["source"]=="builtin"):
        return fail("ERR_CORE_PIN_MISMATCH")
    rec=index["tools"].get(alias,{})
    uid,cat=rec.get("uid"),rec.get("category_uid")
    if not uid or not cat:
        return fail("ERR_HASH_UNAVAILABLE")
    if (expected_uid is not None and uid!=expected_uid) or (expected_category_uid is not None and cat!=expected_category_uid):
        return fail("ERR_HASH_MISMATCH")
    if ids.verify(index,alias,uid,cat)["status"]!="VERIFIED":
        return fail("ERR_TOOL_NOT_APPROVED")
    binary=shutil.which("bwrap")
    if not binary:
        return fail("ERR_SANDBOX_MISSING")
    with tempfile.TemporaryDirectory(prefix="hamasaki-v05-") as tmp:
        copy=Path(tmp)/alias
        try:
            shutil.copytree(plugs.home()/alias,copy,symlinks=True)
            if plugs.inspect(copy,known={}).get("sha256")!=observed.get("sha256"):
                return fail("ERR_SNAPSHOT_CHANGED")
            m=plugs.check_manifest(json.loads((copy/"hamasaki-tool.json").read_text("utf-8")),copy)
            spec=m["actions"][action]
            argv=sandbox.arguments(binary,copy,m["entry"],spec.get("argv",[]))
            with tempfile.TemporaryFile() as out,tempfile.TemporaryFile() as err:
                try:
                    import resource
                    def limits():
                        resource.setrlimit(resource.RLIMIT_FSIZE,(65536,65536))
                        resource.setrlimit(resource.RLIMIT_NOFILE,(32,32))
                        resource.setrlimit(resource.RLIMIT_CPU,(10,10))
                    result=subprocess.run(argv,stdout=out,stderr=err,
                                          env=sandbox.safe_environment(),
                                          timeout=spec.get("timeout",5),
                                          preexec_fn=limits,check=False)
                except subprocess.TimeoutExpired:
                    return fail("ERR_TIMEOUT",attempted=True)
            receipt=ids.chain_receipt(index,alias,action,"PASS" if result.returncode==0 else "FAILED")
            return {"status":"PASS" if result.returncode==0 else "FAILED",
                    "executed":True,"returncode":result.returncode,
                    "tool_uid":uid,"category_uid":cat,"trace_receipt":receipt,
                    "privacy":"local_only_no_output","sandbox":"bwrap_minimal_no_net"}
        except (OSError,ValueError,KeyError,TypeError):
            return fail("ERR_SANDBOX_PRECHECK")
