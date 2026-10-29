"""Windows-only integration: execute the real Scribe batch launcher and receipt path.

Unlike test_runtime_contracts, this test does not mock process execution,
prerequisite probing, launcher resolution, or the permission Gate.
"""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from scripts.base_tool import ScribeTool, TraceStore


@unittest.skipUnless(os.name == "nt", "requires a native Windows runner")
class WindowsScribeLauncherIntegration(unittest.TestCase):
    def test_real_scribe_cmd_and_trace_receipt(self):
        root = Path(__file__).resolve().parents[1]
        launcher = (root / "bin" / "scribe.cmd").resolve()
        self.assertTrue(launcher.is_file(), f"missing launcher: {launcher}")

        # Exercise cmd.exe + the actual .cmd wrapper, without changing host settings.
        direct = subprocess.run(
            ["cmd.exe", "/d", "/c", str(launcher), "status"],
            cwd=root, capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=45,
        )
        self.assertEqual(direct.returncode, 0, direct.stderr[-1500:])
        self.assertIn("Scribe Status", direct.stdout)

        # Exercise the real BaseTool path and persist a real receipt in a temp dir.
        # Only the trace output directory is redirected; no subprocess/Gate mocks.
        with tempfile.TemporaryDirectory() as trace_dir:
            with patch.object(TraceStore, "get_trace_dir", return_value=Path(trace_dir)):
                result = ScribeTool().execute(["status"], {"timeout": 45, "cwd": str(root)})
                self.assertTrue(result["success"], result.get("stderr", "")[-1500:])
                self.assertEqual(result["exit_code"], 0)
                self.assertIn("Scribe Status", result["stdout"])
                self.assertEqual(Path(result["cmd"][0]).resolve(), launcher)
                self.assertEqual(result["protocol"], "dsha-1.2.0-std")

                receipt = result["trace_receipt"]
                self.assertEqual(receipt["protocol"], "dsha-1.2.0-std")
                self.assertEqual(receipt["status"], "PASS")
                self.assertEqual(receipt["exit_code"], 0)
                self.assertEqual(
                    [stage["stage"] for stage in receipt["stages"]],
                    [
                        "ingress_validation", "intent_routing", "envfeel_prerequisites",
                        "tier_authorization", "catalog_containment", "sandbox_execution",
                        "egress_packaging",
                    ],
                )
                self.assertTrue(all(s["status"] == "PASS" for s in receipt["stages"]))
                trace_file = Path(trace_dir) / f'{result["trace_id"]}.json'
                self.assertTrue(trace_file.is_file())
                stored = TraceStore.get(result["trace_id"])
                self.assertEqual(stored["trace_id"], result["trace_id"])
                self.assertEqual(stored["status"], "PASS")


    def test_untrusted_path_shadow_is_refused_before_execution(self):
        # Exercise actual Windows PATH resolution and the real Stage 5 Gate.
        # The shadow launcher must never run; no subprocess or Gate mocks.
        root = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            shadow = temp / "kdi-fatfish-untrusted-scribe.cmd"
            sentinel = temp / "unexpected-execution.txt"
            shadow.write_text(
                "@echo off\n"
                f'> "{sentinel}" echo UNEXPECTED_EXECUTION\n',
                encoding="utf-8",
            )

            tool = ScribeTool()
            tool.cmd = shadow.name
            shadowed_path = str(temp) + os.pathsep + os.environ.get("PATH", "")
            with patch.dict(os.environ, {"PATH": shadowed_path}), patch.object(
                TraceStore, "get_trace_dir", return_value=temp
            ):
                resolved = tool.resolve_executable()
                self.assertIsNotNone(resolved, "Windows PATH fixture not resolved")
                self.assertEqual(Path(resolved).resolve(), shadow.resolve())
                result = tool.execute(["status"], {"timeout": 45, "cwd": str(root)})

                self.assertFalse(result["success"])
                self.assertEqual(result["exit_code"], 125)
                self.assertEqual(result["err_block"]["error_code"], "ERR_TARGET_OUTSIDE_SANDBOX")
                receipt = result["trace_receipt"]
                self.assertEqual(receipt["protocol"], "dsha-1.2.0-std")
                self.assertEqual(receipt["status"], "REFUSED")
                self.assertEqual(receipt["causal_chain"]["failed_stage"], "catalog_containment")
                self.assertEqual(receipt["causal_chain"]["error_code"], "ERR_TARGET_OUTSIDE_SANDBOX")
                self.assertNotIn("sandbox_execution", [s["stage"] for s in receipt["stages"]])
                self.assertFalse(sentinel.exists(), "untrusted launcher was executed")
                self.assertTrue((temp / f'{result["trace_id"]}.json').is_file())


    @unittest.expectedFailure
    def test_launcher_replacement_after_stage5_is_not_yet_blocked(self):
        """Expected failure documents the Stage 5-to-6 launcher identity race.

        A benign temporary batch file is swapped only after the real containment
        check returns. This does not modify repository files or bypass the Gate.
        """
        root = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            trusted_dir = temp / ".gemini" / "config"
            trusted_dir.mkdir(parents=True)
            launcher = trusted_dir / "kdi-fatfish-toctou.cmd"
            sentinel = temp / "replacement-executed.txt"
            launcher.write_text("@echo off\nexit /b 0\n", encoding="utf-8")

            tool = ScribeTool()
            tool.cmd = launcher.name
            real_containment = tool.assert_target_contained

            def replace_after_containment(path):
                ok, err = real_containment(path)
                if ok:
                    launcher.write_text(
                        "@echo off\n"
                        f'> "{sentinel}" echo REPLACED_AFTER_STAGE5\n'
                        "exit /b 0\n",
                        encoding="utf-8",
                    )
                return ok, err

            with (
                patch.dict(os.environ, {"USERPROFILE": str(temp)}),
                patch.object(tool, "assert_target_contained", side_effect=replace_after_containment),
                patch.object(TraceStore, "get_trace_dir", return_value=temp),
            ):
                result = tool.execute(["status"], {"timeout": 45, "cwd": str(root)})

            stages = {stage["stage"]: stage["status"] for stage in result["trace_receipt"]["stages"]}
            self.assertEqual(stages.get("catalog_containment"), "PASS", result.get("stderr"))
            print(
                "TOCTOU_REPRO: stage5=PASS, "
                f"receipt={result['trace_receipt']['status']}, "
                f"replacement_executed={sentinel.exists()}",
                flush=True,
            )
            self.assertFalse(
                sentinel.exists(),
                "KNOWN TOCTOU GAP: launcher changed after Stage 5 was executed",
            )


if __name__ == "__main__":
    unittest.main()
