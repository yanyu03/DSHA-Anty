"""Hash-bound Linux plugin execution. No host-root mounts or external network."""
import json
import os
from pathlib import Path
import signal
import shutil
import subprocess
import sys
import tempfile
import hamasaki_identity as ids
import hamasaki_sandbox as sandbox

def fail(code,attempted=False):
    return {"status":"ERR_BLOCK","error_code":code,"executed":attempted,
            "privacy":"local_only_no_output"}

def run_bounded(argv,*,timeout,env,stdout,stderr):
    """No preexec_fn: safe for multithreaded agents; terminate descendants."""
    with subprocess.Popen(argv,stdout=stdout,stderr=stderr,env=env,
                          start_new_session=True,close_fds=True) as proc:
        try:
            return proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(proc.pid,signal.SIGKILL)
            except ProcessLookupError:
                pass
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=3)
            raise

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
    if any(x["status"]!="PINNED" for x in index["tools"].values()
           if x["source"]=="builtin"):
        return fail("ERR_CORE_PIN_MISMATCH")
    rec=index["tools"].get(alias,{})
    uid,cat=rec.get("uid"),rec.get("category_uid")
    if not uid or not cat or not rec.get("content_sha256"):
        return fail("ERR_HASH_UNAVAILABLE")
    if (expected_uid is not None and uid!=expected_uid or
        expected_category_uid is not None and cat!=expected_category_uid):
        return fail("ERR_HASH_MISMATCH")
    if ids.verify(index,alias,uid,cat)["status"]!="VERIFIED":
        return fail("ERR_TOOL_NOT_APPROVED")
    # Neither subprocess requires network; reject env/PATH forged bwrap/prlimit.
    bwrap=sandbox.trusted_runtime("bwrap")
    if not bwrap:
        return fail("ERR_SANDBOX_MISSING")
    prlimit=sandbox.trusted_runtime("prlimit")
    if not prlimit:
        return fail("ERR_RESOURCE_LIMITER_MISSING")
    with tempfile.TemporaryDirectory(prefix="hamasaki-secure-") as tmp:
        copy=Path(tmp)/alias
        try:
            shutil.copytree(plugs.home()/alias,copy,symlinks=True)
            snapshot=plugs.inspect(copy,known={})
            # Bind execution to the approved hash in the registry, NOT the
            # earlier mutable source-directory observation (TOCTOU).
            if snapshot.get("sha256")!=rec["content_sha256"]:
                return fail("ERR_SNAPSHOT_CHANGED")
            m=plugs.check_manifest(json.loads((copy/"hamasaki-tool.json").read_text("utf-8")),copy)
            spec=m["actions"][action]
            if spec.get("risk")!="read-only":
                return fail("ERR_ACTION_RISK_NOT_ALLOWED")
            argv=sandbox.arguments(bwrap,copy,m["entry"],spec.get("argv",[]))
            # prlimit is a system executable and passes rlimits to its children.
            # Avoid Python preexec_fn deadlocks under threaded agents.
            bounded=[prlimit,"--as=536870912","--cpu=10","--fsize=65536",
                     "--nofile=64","--",*argv]
            with tempfile.TemporaryFile() as out,tempfile.TemporaryFile() as err:
                try:
                    status=run_bounded(bounded,stdout=out,stderr=err,
                                       env=sandbox.safe_environment(),
                                       timeout=spec.get("timeout",5))
                except subprocess.TimeoutExpired:
                    return fail("ERR_TIMEOUT",attempted=True)
            receipt=ids.chain_receipt(index,alias,action,"PASS" if status==0 else "FAILED")
            return {"status":"PASS" if status==0 else "FAILED",
                    "executed":True,"returncode":status,
                    "tool_uid":uid,"category_uid":cat,"trace_receipt":receipt,
                    "privacy":"local_only_no_output","sandbox":"bwrap_unshare_net_prlimit"}
        except (OSError,ValueError,KeyError,TypeError,subprocess.SubprocessError):
            return fail("ERR_SANDBOX_PRECHECK")
