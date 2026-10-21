"""Hamasaki v0.6 safety regressions: isolated local files, no cloud credentials."""
import concurrent.futures
import json
import os
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import base_tool as base
import hamasaki_hotplug as hp
import dsha_cf as cf

class HardenedContracts(unittest.TestCase):
    def test_missing_tier_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            fake=Path(d)/"scripts/base_tool.py";fake.parent.mkdir()
            with patch.object(base, "__file__", str(fake)),patch.dict(os.environ,{"HOME":d,"USERPROFILE":d}):
                self.assertEqual(base.get_active_tier(),"UNKNOWN")

    def test_known_tier_read_only(self):
        with tempfile.TemporaryDirectory() as d:
            fake=Path(d)/"scripts/base_tool.py";fake.parent.mkdir()
            p=Path(d)/"plugins/dsh-permissions/tier.json"
            p.parent.mkdir(parents=True);p.write_text('{"tier":"read-only"}')
            with patch.object(base, "__file__", str(fake)),patch.dict(os.environ,{"HOME":d,"USERPROFILE":d}):
                self.assertEqual(base.get_active_tier(),"read-only")

    def test_custom_env_cannot_override_secrets_or_loader(self):
        e=base.ExecutionEnvelope(custom_env={
            "PATH":"/tmp/evil", "LD_PRELOAD":"/tmp/a.so",
            "CLOUDFLARE_API_TOKEN":"SECRET_X",
            "PYTHONPATH":"/tmp/evil",
            "TZ":"UTC", "NO_COLOR":"1"
        })
        got=e.build_subprocess_env()
        self.assertNotEqual(got.get("PATH"),"/tmp/evil")
        for key in ("LD_PRELOAD","CLOUDFLARE_API_TOKEN","PYTHONPATH"):
            self.assertNotIn(key,got)
        self.assertEqual(got["TZ"],"UTC")
        self.assertEqual(got["NO_COLOR"],"1")

    def test_trace_id_malformed_is_regenerated(self):
        e=base.ExecutionEnvelope(trace_id="../../outside")
        self.assertIsNone(e.trace_id)
        e2=base.ExecutionEnvelope(trace_id="safe_id-42")
        self.assertEqual(e2.trace_id,"safe_id-42")

    def test_receipt_strips_argument_values_and_fingerprint(self):
        r=base.TraceReceipt(trace_id="tr_safe",caller="private_person",
                            tool_id="cf",tool_name="test",
                            category="WebEdge",args=["--token=SECRET_X","/home/private/file"])
        r.finalize("PASS",0,1)
        raw=json.dumps(r.to_dict(),ensure_ascii=False)
        for secret in ("SECRET_X","private_person","/home/private/file"):
            self.assertNotIn(secret,raw)
        self.assertIn("args_redacted",raw)

    def test_trace_store_refuses_path_traversal(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"traces";p.mkdir()
            class Fake:
                trace_id="../../escape"
                def to_dict(self):return {"test":True}
            with patch.object(base.TraceStore,"get_trace_dir",return_value=p):
                self.assertIsNone(base.TraceStore.save(Fake()))
            self.assertFalse((Path(d)/"escape.json").exists())

    def test_trace_store_is_private_and_cannot_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"traces";p.mkdir()
            class Fake:
                trace_id="tr_safe42"
                def to_dict(self):return {"args":["[redacted]"]}
            with patch.object(base.TraceStore,"get_trace_dir",return_value=p):
                a=base.TraceStore.save(Fake())
                b=base.TraceStore.save(Fake())
            self.assertEqual(Path(a).read_text(encoding="utf-8").count("redacted"),1)
            self.assertIsNone(b)
            self.assertEqual(stat.S_IMODE(Path(a).stat().st_mode),0o600)

    def test_parallel_approvals_dont_lose_records(self):
        with tempfile.TemporaryDirectory() as d:
            parent=Path(d)/"tools";parent.mkdir()
            for j in range(12):
                name="ext-%02d"%j
                sub=parent/name;sub.mkdir()
                (sub/"main.py").write_text("print('ok')\n")
                m={"schema":"hamasaki.tool/v1","id":name,"name":name,
                   "version":"1","entry":"main.py","keywords":[name],
                   "actions":{"status":{"risk":"read-only","argv":[]}}}
                (sub/"hamasaki-tool.json").write_text(json.dumps(m))
            env={"HAMASAKI_TOOLS_DIR":str(parent),
                 "HAMASAKI_TRUST_FILE":str(Path(d)/"approvals.json")}
            with patch.dict(os.environ,env):
                names=["ext-%02d"%i for i in range(12)]
                sha={n:hp.inspect(parent/n,known={})["sha256"] for n in names}
                with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
                    results=list(pool.map(lambda n:hp.approve(n,sha[n]),names))
                self.assertTrue(all(r["status"]=="APPROVED" for r in results),results)
                self.assertEqual(set(hp.approvals()),set(names))
                with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
                    rev=list(pool.map(hp.revoke,names))
                self.assertTrue(all(x["status"]=="REVOKED" for x in rev))
                self.assertFalse(hp.approvals())

    def test_capacity_more_than_eighty_explicitly_blocks(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)/"tools";root.mkdir()
            for i in range(81):(root/("ext-%03d"%i)).mkdir()
            with patch.dict(os.environ,{"HAMASAKI_TOOLS_DIR":str(root)}):
                found=hp.scan()
                self.assertEqual(len(found),1)
                self.assertEqual(found[0]["reason"],"ERR_TOOL_CAPACITY")
                self.assertEqual(hp.catalog(),{})

    def test_cf_command_has_timeout(self):
        calls=[]
        class Completed:returncode=0
        with patch.object(cf,"locate",return_value="/mock/cloudflare"),patch.object(
             cf,"run_bounded",side_effect=lambda argv,**kw:calls.append(kw) or 0):
            status,response=cf.dispatch(["whoami"])
        self.assertEqual(status,0)
        self.assertEqual(calls[0]["timeout"],90)

    def test_cf_timeout_returns_structured_err(self):
        with patch.object(cf,"locate",return_value="/mock/cloudflare"),patch.object(
             cf,"run_bounded",side_effect=subprocess.TimeoutExpired(["cf"],90)):
            status,response=cf.dispatch(["whoami"])
        self.assertEqual(status,124)
        self.assertEqual(response["error_code"],"ERR_EXEC_TIMEOUT")

    def test_process_group_timeout(self):
        import time
        if os.name!="posix":
            self.skipTest("POSIX process group test")
        command=[sys.executable,"-c",
                 "import subprocess;subprocess.Popen(['sleep','30']).wait()"]
        start=time.monotonic()
        with self.assertRaises(subprocess.TimeoutExpired):
            cf.run_bounded(command,timeout=0.3)
        self.assertLess(time.monotonic()-start,4)

    def test_core_seven_plus_three_productivity(self):
        self.assertEqual(len(base.TOOL_REGISTRY.all()),10)
        for tool in ("markdown","office","wps"):
            item=base.TOOL_REGISTRY.get(tool)
            self.assertIsNotNone(item)
            self.assertEqual(item.risk_level,base.RiskLevel.READ_ONLY)

if __name__=="__main__":unittest.main()
