"""Kaeru selective uptake: safe intent routing, no execution fallback."""
import contextlib
import io
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch, Mock
sys.path.insert(0, str(Path(__file__).resolve().parent))
import router

class RouterSafetyUptake(unittest.TestCase):
    def test_unmatched_intent_does_not_probe_or_dispatch(self):
        with patch.object(router, "BASE_REGISTRY", None):
            r = router.analyze_route("zzzyyyxxx-no-registered-tool")
        self.assertEqual(r["error_code"], "ERR_NO_MATCH")
        self.assertIsNone(r["selected_tool"])

    def test_route_command_reports_failure(self):
        with patch.object(sys, "argv", ["dsha", "route", "zzzyyyxxx-no-registered-tool"]):
            with contextlib.redirect_stdout(io.StringIO()) as out:
                rc = router.main()
        self.assertEqual(rc, 2)
        self.assertIn("ERR_NO_MATCH", out.getvalue())

    def test_exec_unmatched_never_invokes_tool(self):
        fake = types.ModuleType("index")
        fake.Call_Tools = Mock(side_effect=AssertionError("must not execute"))
        with patch.dict(sys.modules, {"index": fake}):
            with patch.object(sys, "argv", ["dsha", "exec", "zzzyyyxxx-no-registered-tool", "status"]):
                with contextlib.redirect_stderr(io.StringIO()):
                    rc = router.main()
        self.assertEqual(rc, 126)
        fake.Call_Tools.assert_not_called()

    def test_exec_requires_explicit_action(self):
        fake = types.ModuleType("index")
        fake.Call_Tools = Mock(side_effect=AssertionError("must not execute"))
        chosen = {"status": "READY", "selected_tool": "scribe", "tool_name": "Scribe",
                  "score_share": 1.0, "reasoning": ["explicit"]}
        with patch.dict(sys.modules, {"index": fake}):
            with patch.object(router, "analyze_route", return_value=chosen):
                with patch.object(sys, "argv", ["dsha", "exec", "scribe"]):
                    with contextlib.redirect_stderr(io.StringIO()):
                        rc = router.main()
        self.assertEqual(rc, 126)
        fake.Call_Tools.assert_not_called()

    def test_explicit_action_passes_to_dispatcher(self):
        fake = types.ModuleType("index")
        fake.Call_Tools = Mock(return_value={"success": True, "stderr": "", "exit_code": 0})
        chosen = {"status": "READY", "selected_tool": "scribe", "tool_name": "Scribe",
                  "score_share": 1.0, "reasoning": ["explicit"]}
        with patch.dict(sys.modules, {"index": fake}):
            with patch.object(router, "analyze_route", return_value=chosen):
                with patch.object(sys, "argv", ["dsha", "exec", "scribe", "status"]):
                    with contextlib.redirect_stdout(io.StringIO()):
                        rc = router.main()
        self.assertEqual(rc, 0)
        self.assertEqual(fake.Call_Tools.call_args.args[:2], ("scribe", ["status"]))

if __name__ == "__main__":
    unittest.main()
