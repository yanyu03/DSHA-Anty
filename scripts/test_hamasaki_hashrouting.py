"""Hamasaki hash routing regression; requires full local repo checkout."""
import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parent))
import hamasaki_pipeline as p
import hamasaki_identity as h

class HashRouterTests(unittest.TestCase):
    def setUp(self):
        self.mock=p.EnvSnapshot(probe=lambda _:{"state":"NATIVE","evidence":"test_stub"})
        self.current=p.identity_snapshot()
        self.core=self.current["tools"]["cf"]
    def test_hash_bound_alias_and_direct_hash_route(self):
        a=p.plan("cf dns",tier="auto",snapshot=self.mock,identity_index=self.current)
        self.assertEqual(a["selected_tool"],"cf")
        self.assertEqual(a["tool_uid"],self.core["uid"])
        self.assertEqual(h.verify_receipt(self.current,a["hash_chain"])["status"],"VERIFIED")
        b=p.plan("sha256:"+self.core["uid"],tier="auto",snapshot=self.mock,
                 identity_index=self.current)
        self.assertEqual(b["selected_tool"],"cf")
    def test_hash_mismatch_refuses_before_probe(self):
        result=p.plan("cf dns",tier="auto",snapshot=self.mock,
                      tool_uid="f"*64,identity_index=self.current)
        self.assertEqual(result["error_code"],"ERR_HASH_MISMATCH")
        self.assertEqual(self.mock.probes,0)
    def test_no_legacy_args_in_protocol_receipt(self):
        result=p.plan("cf dns",tier="auto",snapshot=self.mock,
                      identity_index=self.current)
        self.assertNotIn("args",result["hash_chain"])
        self.assertNotIn("cwd",result["hash_chain"])
    def test_default_core_integrity(self):
        self.assertTrue(all(row["status"]=="PINNED" for row in self.current["tools"].values()
                            if row["source"]=="builtin"))

if __name__=="__main__":unittest.main()
