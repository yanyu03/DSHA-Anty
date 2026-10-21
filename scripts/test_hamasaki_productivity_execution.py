"""Cross-index execution contract for three Product Tools. No document IO."""
from pathlib import Path
import importlib.util
import os
import sys
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parent))
import base_tool as core
import hamasaki_builtin_tool as tool
import hamasaki_identity as ids

ROOT=Path(__file__).resolve().parents[1]

class ProductivityContractTests(unittest.TestCase):
    def test_three_peers_registered_in_real_execution_catalog(self):
        self.assertEqual(len(core.TOOL_REGISTRY.all()),10)
        found={x.id for x in core.TOOL_REGISTRY.get_by_category("Productivity")}
        self.assertEqual(found,{"markdown","office","wps"})
        for alias in found:
            self.assertEqual(core.TOOL_REGISTRY.get(alias).risk_level,core.RiskLevel.READ_ONLY)
            self.assertTrue((ROOT/"bin"/("dsha-"+alias)).is_file())

    def test_status_receipt_is_bound_to_current_hashes(self):
        hashes=ids.snapshot(ROOT,[])
        code,result=tool.run("markdown",["status"])
        self.assertIn(code,(0,126))
        self.assertEqual(result["tool_uid"],hashes["tools"]["markdown"]["uid"])
        self.assertEqual(result["category_uid"],hashes["tools"]["markdown"]["category_uid"])
        self.assertEqual(result["executed_action"],"status")

    def test_all_document_actions_fail_closed_pending_real_sandbox(self):
        with patch.object(tool.subprocess,"run",side_effect=AssertionError("must not execute")):
            for alias in ("markdown","office","wps"):
                for cmd in (["inspect","secret.docx"],["deploy"],[],["status","--run-macro"]):
                    code,out=tool.run(alias,cmd)
                    self.assertEqual(code,126)
                    self.assertEqual(out["error_code"],"ERR_SANDBOX_NOT_VALIDATED")

    def test_missing_registered_hash_blocks_before_execution(self):
        broken=ids.snapshot(ROOT,[])
        broken["tools"]["office"]["status"]="BLOCKED_PIN_MISMATCH"
        with patch.object(tool.identity,"snapshot",return_value=broken):
            with patch.object(tool.subprocess,"run",side_effect=AssertionError("must not execute")):
                code,out=tool.run("markdown",["status"])
        self.assertEqual(code,126)
        self.assertEqual(out["error_code"],"ERR_CORE_PIN_MISMATCH")

    def test_call_tools_exists_but_document_unsafe_action_fails(self):
        response=core.Call_Tools("markdown",["inspect","confidential.md"],{"tier":"read-only","timeout":12})
        self.assertFalse(response["success"])
        self.assertEqual(response["exit_code"],126)
        self.assertNotIn("confidential.md",str(response["trace_receipt"]))

if __name__=="__main__":unittest.main()
