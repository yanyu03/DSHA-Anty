"""Scribe action-specific least privilege and platform directory regression."""
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import base_tool as core
import scribe

class ScribeActionGate(unittest.TestCase):
    def test_status_allowed_under_read_only(self):
        tool=core.TOOL_REGISTRY.get("scribe")
        with patch.object(core,"get_active_tier",return_value="read-only"):
            permitted,err=tool.assert_authorization("read-only",args=["status"])
        self.assertTrue(permitted)
        self.assertIsNone(err)

    def test_mutating_scribe_operations_denied_under_read_only(self):
        tool=core.TOOL_REGISTRY.get("scribe")
        for args in (["harvest"],["dossier"],["dossier","--out","some.md"],[],["selftest"],["unknown"]):
            with self.subTest(args=args), patch.object(core,"get_active_tier",return_value="read-only"):
                permitted,err=tool.assert_authorization("read-only",args=args)
                self.assertFalse(permitted)
                self.assertEqual(err.error_code,"ERR_PERMISSION_DENIED")

    def test_workspace_write_explicitly_allows_harvest(self):
        tool=core.TOOL_REGISTRY.get("scribe")
        with patch.object(core,"get_active_tier",return_value="workspace-write"):
            permitted,err=tool.assert_authorization("workspace-write",args=["harvest"])
        self.assertTrue(permitted)
        self.assertIsNone(err)

    def test_status_harvest_does_not_create_cache(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            paths={"repo_root":root,"scribe_cache":root/"should-not-exist"}
            with patch.object(scribe,"find_gate_logs",return_value=[]),patch.object(
                scribe,"find_task_logs",return_value=[]),patch.object(
                scribe,"get_git_state",return_value={}),patch.object(
                scribe,"get_env_snapshot",return_value={}):
                result=scribe.harvest(paths,persist=False)
            self.assertIn("harvested_at",result)
            self.assertFalse(paths["scribe_cache"].exists())

    def test_git_status_disables_optional_locks(self):
        with tempfile.TemporaryDirectory() as d:
            class Result:
                returncode=0
                stdout=""
            calls=[]
            with patch.object(scribe.subprocess,"run",side_effect=lambda args,**kw:calls.append((args,kw)) or Result()):
                scribe.get_git_state(Path(d))
            status=[opts for argv,opts in calls if argv[1:3]==["status","--short"]]
            self.assertEqual(len(status),1)
            self.assertEqual(status[0]["env"]["GIT_OPTIONAL_LOCKS"],"0")

    def test_posix_scribe_paths_use_xdg_and_do_not_write_repo(self):
        if os.name=="nt":self.skipTest("POSIX only")
        with tempfile.TemporaryDirectory() as d:
            with patch.dict(os.environ,{"XDG_CONFIG_HOME":str(Path(d)/"cfg"),
                                        "XDG_STATE_HOME":str(Path(d)/"state"),
                                        "XDG_CACHE_HOME":str(Path(d)/"cache")}):
                paths=scribe.get_default_paths()
                self.assertTrue(paths["scribe_cache"].is_relative_to(Path(d)/"cache"))
                self.assertTrue(paths["brain_dir"].is_relative_to(Path(d)/"state"))
                self.assertTrue(paths["gemini_cfg"].is_relative_to(Path(d)/"cfg"))
                self.assertNotEqual(paths["scribe_cache"],paths["repo_root"]/".scribe")

if __name__=="__main__":unittest.main()
