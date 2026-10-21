"""Cloudflare + Hamasaki cross-layer contract regressions (no network/actions)."""
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import dsha_cf as cf
import hamasaki_pipeline as p
import hamasaki_hotplug as hp

META = {
    "cf": {"name":"Cloudflare cf", "keywords":["cloudflare","cf","dns"],
           "extensions":[], "exact_filenames":[], "weight":1.0},
    "wrangler": p.EXTENSIONS["wrangler"],
}

class CfInteropTests(unittest.TestCase):
    def setUp(self):
        self.probes=[]
        self.snapshot=p.EnvSnapshot(
            probe=lambda name: self.probes.append(name) or
            {"state":"NATIVE","evidence":"mocked_environment"})

    def test_cf_and_wrangler_do_not_share_whoami(self):
        events=[]
        class Result: returncode=0
        with patch.object(cf,"locate",side_effect=lambda name:"/mock/"+name),patch.object(
                cf,"run_bounded",side_effect=lambda args,**kw:events.append(args) or 0):
            a,_=cf.dispatch(["whoami"])
            b,_=cf.dispatch(["wrangler","whoami"])
        self.assertEqual((a,b),(0,0))
        self.assertEqual(events,[["/mock/cfcli","auth","whoami"],["/mock/wrangler","whoami"]])

    def test_cf_failure_does_not_try_wrangler(self):
        events=[]
        class Result: returncode=13
        with patch.object(cf,"locate",side_effect=lambda name:"/mock/"+name),patch.object(
                cf,"run_bounded",side_effect=lambda args,**kw:events.append(args) or 13):
            code,_=cf.dispatch(["whoami"])
        self.assertEqual(code,13)
        self.assertEqual(events,[["/mock/cfcli","auth","whoami"]])

    def test_envfeel_probes_selected_backend_only(self):
        a=p.plan("cf dns",tools=META,tier="auto",snapshot=self.snapshot)
        b=p.plan("wrangler tail",tools=META,tier="auto",snapshot=self.snapshot)
        self.assertEqual((a["selected_tool"],b["selected_tool"]),("cf","wrangler"))
        self.assertEqual(self.probes,["cfcli","wrangler"])

    def test_explicit_wrangler_cannot_be_rewritten_as_cf(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/"cloudflare.config.ts").write_text("export default {}")
            out=p.plan("wrangler deploy",tools=META,tier="auto",snapshot=self.snapshot,
                       project_root=Path(d))
            self.assertEqual(out["error_code"],"ERR_PROJECT_BACKEND_MISMATCH")
            self.assertEqual(self.probes,[])

    def test_config_detection_without_changing_cwd(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/"wrangler.toml").write_text("name='example'")
            out=p.plan("cloudflare deploy",tools=META,tier="auto",snapshot=self.snapshot,
                       project_root=Path(d))
            self.assertEqual(out["error_code"],"ERR_PROJECT_BACKEND_MISMATCH")
            out2=p.plan("cf deploy",tools=META,tier="auto",snapshot=self.snapshot,
                        project_root=Path(d))
            self.assertEqual(out2["selected_tool"],"wrangler")

    def test_hotplug_change_blocks_at_planner(self):
        with tempfile.TemporaryDirectory() as d:
            item=Path(d)/"ext-demo01";item.mkdir()
            (item/"hamasaki-tool.json").write_text('{"schema":"hamasaki.tool/v1","id":"ext-demo01","name":"Demo","version":"1","entry":"main.py","keywords":["demo"],"actions":{"status":{"risk":"read-only","argv":[]}}}')
            (item/"main.py").write_text("print('hello')")
            with patch.dict(os.environ,{"HAMASAKI_TOOLS_DIR":d,"HAMASAKI_TRUST_FILE":d+"/approval.json"}):
                stamp=hp.scan()[0]["sha256"]
                self.assertEqual(hp.approve("ext-demo01",stamp)["status"],"APPROVED")
                before=p.plan("ext-demo01 status",tools=hp.catalog(),tier="auto",snapshot=self.snapshot)
                self.assertEqual(before["status"],"PLAN_ONLY")
                (item/"main.py").write_text("print('updated')")
                after=p.plan("ext-demo01 status",tools=hp.catalog(),tier="auto",snapshot=self.snapshot)
                self.assertEqual(after["error_code"],"ERR_TOOL_UNTRUSTED")

if __name__=="__main__":unittest.main()
