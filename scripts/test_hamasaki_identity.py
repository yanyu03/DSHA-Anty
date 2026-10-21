"""Hamasaki v0.5 hash identity contract. Offline, synthetic temp fixtures."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parent))
import hamasaki_identity as h

class TestHashChain(unittest.TestCase):
    def setUp(self):
        d=tempfile.TemporaryDirectory()
        self.addCleanup(d.cleanup)
        self.root=Path(d.name)
        (self.root/"config").mkdir()
        (self.root/"builtin").mkdir()
        self.pins={"schema":"hamasaki.builtin-pins/v1","tools":{}}
        for alias,cat in [("cf","WebEdge"),("rea","ReverseEngineering"),
                          ("scribe","Archivist"),("pwsh","SysAdmin"),
                          ("sh","SysAdmin"),("tier","PolicyRadar"),("meter","PolicyRadar")]:
            rel="builtin/"+alias+".py"
            payload=("# demo fixture "+alias).encode()
            (self.root/rel).write_bytes(payload)
            self.pins["tools"][alias]={"category":cat,"files":{rel:h.git_blob(payload)}}
        (self.root/"config/hamasaki_builtin_pins_v1.json").write_text(json.dumps(self.pins))

    def index(self,plugins=(),virtual=None):
        return h.snapshot(self.root,list(plugins),self.pins,virtual)

    def test_deterministic_unique_tool_hashes(self):
        a=self.index();b=self.index()
        self.assertEqual(a,b)
        self.assertEqual(len({r["uid"] for r in a["tools"].values()}),7)
        self.assertEqual(len(a["categories"]),5)
        self.assertEqual(len(a["registry_uid"]),64)

    def test_core_pin_tamper_blocks(self):
        (self.root/"builtin/cf.py").write_bytes(b"altered")
        result=self.index()
        self.assertEqual(result["tools"]["cf"]["status"],"BLOCKED_PIN_MISMATCH")
        self.assertIsNone(result["tools"]["cf"]["uid"])

    def test_file_link_blocks(self):
        link=self.root/"builtin/rea.py"
        link.unlink();link.symlink_to(self.root/"builtin/cf.py")
        self.assertEqual(self.index()["tools"]["rea"]["status"],"BLOCKED_MISSING_OR_LINKED")

    def test_plugin_upgrade_issues_new_id_but_no_trust(self):
        a=self.index([{"id":"ext-demo","sha256":"a"*64,"status":"READY"}])
        b=self.index([{"id":"ext-demo","sha256":"b"*64,"status":"CHANGED_REVIEW_REQUIRED"}])
        self.assertNotEqual(a["tools"]["ext-demo"]["uid"],b["tools"]["ext-demo"]["uid"])
        self.assertFalse(b["tools"]["ext-demo"]["approved"])
        self.assertIsNone(b["tools"]["ext-demo"]["category_uid"])

    def test_two_tools_same_code_have_different_ids(self):
        rows=[{"id":"ext-alpha","sha256":"c"*64,"status":"READY"},
              {"id":"ext-beta","sha256":"c"*64,"status":"READY"}]
        snap=self.index(rows)
        self.assertNotEqual(snap["tools"]["ext-alpha"]["uid"],snap["tools"]["ext-beta"]["uid"])

    def test_category_membership_hash_changes(self):
        base=self.index()
        new=self.index([{"id":"ext-demo","sha256":"d"*64,"status":"READY"}])
        self.assertEqual(base["categories"]["SysAdmin"],new["categories"]["SysAdmin"])
        self.assertNotEqual(base["registry_uid"],new["registry_uid"])
        self.assertIn("ThirdParty",new["categories"])

    def test_hash_bound_retrace_and_tampering(self):
        snap=self.index()
        tool=snap["tools"]["cf"]
        self.assertEqual(h.verify(snap,"cf",tool["uid"],tool["category_uid"])["status"],"VERIFIED")
        self.assertEqual(h.verify(snap,"cf","a"*64,tool["category_uid"])["error_code"],"ERR_HASH_MISMATCH")
        r=h.chain_receipt(snap,"cf","plan")
        self.assertEqual(h.verify_receipt(snap,r)["status"],"VERIFIED")
        r["status"]="PASS"
        self.assertEqual(h.verify_receipt(snap,r)["error_code"],"ERR_RECEIPT_TAMPERED")

    def test_changed_registry_refuses_old_receipt(self):
        snap=self.index()
        r=h.chain_receipt(snap,"cf","plan")
        next_snapshot=self.index([{"id":"ext-demo","sha256":"d"*64,"status":"READY"}])
        self.assertEqual(h.verify_receipt(next_snapshot,r)["error_code"],"ERR_REGISTRY_CHANGED")

    def test_receipt_contains_no_secrets(self):
        snap=self.index()
        r=h.chain_receipt(snap,"cf","plan")
        self.assertNotIn("args",r)
        self.assertNotIn("cwd",r)
        self.assertNotIn("caller",r)
        self.assertNotIn("secret",repr(r).lower())

    def test_bad_pin_path_rejected(self):
        p=self.root/"config/hamasaki_builtin_pins_v1.json"
        invalid=json.loads(p.read_text())
        invalid["tools"]["cf"]["files"]={"../escape": "a"*40}
        p.write_text(json.dumps(invalid))
        with self.assertRaises(ValueError):h.read_pins(self.root)

    def test_virtual_tool_not_executable(self):
        snap=self.index(virtual={"wrangler":{"category":"WebEdge","api":"plan-only"}})
        self.assertEqual(snap["tools"]["wrangler"]["status"],"PLAN_ONLY")
        self.assertEqual(h.verify(snap,"wrangler",snap["tools"]["wrangler"]["uid"],
                                  snap["tools"]["wrangler"]["category_uid"])["error_code"],
                         "ERR_TOOL_NOT_APPROVED")

    def test_real_repo_pins_match_files(self):
        project=Path(__file__).resolve().parents[1]
        snap=h.snapshot(project,[])
        self.assertTrue(all(x["status"]=="PINNED" for x in snap["tools"].values()
                            if x["source"]=="builtin"))

if __name__=="__main__":unittest.main()
