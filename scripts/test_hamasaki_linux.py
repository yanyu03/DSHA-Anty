"""Read-only Hamasaki bootstrap contract tests."""
import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

SRC = Path(__file__).with_name("hamasaki_linux.py")
spec = importlib.util.spec_from_file_location("hamasaki_linux", SRC)
h = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = h
spec.loader.exec_module(h)

class LinuxBootstrapContracts(unittest.TestCase):
    def test_missing_binary_must_not_claim_native(self):
        with patch.object(h.shutil, "which", return_value=None):
            self.assertEqual(h.capability("bash")["state"], "UNAVAILABLE")

    def test_bash_must_pass_semantic_probe(self):
        with patch.object(h.shutil, "which", return_value="/bin/bash"), patch.object(h, "run_probe", return_value=(True, "not-a-bash")):
            self.assertEqual(h.capability("bash")["state"], "COMPATIBLE")
        with patch.object(h.shutil, "which", return_value="/bin/bash"), patch.object(h, "run_probe", return_value=(True, "HAMASAKI_BASH:ok")):
            self.assertEqual(h.capability("bash")["state"], "NATIVE")

    def test_pwsh_version_string_alone_is_not_semantic_proof(self):
        with patch.object(h.shutil, "which", return_value="/usr/bin/pwsh"), patch.object(h, "run_probe", return_value=(True, "PowerShell 7.6.6")):
            self.assertEqual(h.capability("pwsh")["state"], "COMPATIBLE")
        with patch.object(h.shutil, "which", return_value="/usr/bin/pwsh"), patch.object(h, "run_probe", return_value=(True, "True\\n2026")):
            self.assertEqual(h.capability("pwsh")["state"], "NATIVE")

    def test_nonzero_exit_cannot_claim_native(self):
        with patch.object(h.shutil, "which", return_value="/usr/bin/git"), patch.object(h, "run_probe", return_value=(False, "git version 9.0")):
            self.assertEqual(h.capability("git")["state"], "COMPATIBLE")

    def test_missing_core_marks_incomplete(self):
        with patch.object(h.platform, "system", return_value="Linux"), patch.object(h, "capability", return_value={"state": "UNAVAILABLE"}), patch.object(h.shutil, "which", return_value=None):
            out = h.observe(Path("/definitely/missing/hamasaki"))
        self.assertEqual(out["status"], "INCOMPLETE_BASELINE")
        self.assertEqual(out["side_effects"], "none")

    def test_non_linux_fails_closed(self):
        with patch.object(h.platform, "system", return_value="Windows"):
            self.assertEqual(h.observe(Path("."))["status"], "UNSUPPORTED")

    def test_package_plan_never_installs(self):
        with patch.object(h.shutil, "which", return_value="/usr/bin/apt-get"):
            plan = h.package_plan()
        self.assertEqual(plan["status"], "PLAN_ONLY")
        self.assertFalse(plan["executed"])
        self.assertTrue(plan["authorization_required"])

    def test_tier_malformed_does_not_grant_access(self):
        with patch.object(h.Path, "read_text", return_value='{"tier":"typo"}'):
            self.assertEqual(h.tier_status(Path(".")), "INVALID")

if __name__ == "__main__":
    unittest.main()
