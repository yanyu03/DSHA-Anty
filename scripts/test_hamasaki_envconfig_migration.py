"""Selective Windows→Hamasaki migration: Linux runtime discovery contracts.

No third-party commands, account login, system installs or network are run.
"""
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import hamasaki_envconfig as cfg
import hamasaki_linux as linux
import dsha_cf as cf

class EnvConfigMigration(unittest.TestCase):
    def test_explicit_override_wins_over_environment_and_path(self):
        with tempfile.TemporaryDirectory() as d:
            candidate=Path(d)/"工 具 unicode executable"
            candidate.write_text("#!/bin/sh\nexit 0\n")
            candidate.chmod(0o700)
            with patch.object(cfg.shutil,"which",side_effect=AssertionError("explicit path must not scan PATH")):
                result=cfg.resolve_runtime("bash",("bash",),explicit=str(candidate),
                                           environ={"DSHA_BASH":"/configured/other","PATH":"/bad"})
            self.assertEqual(result["state"],"CONFIGURED")
            self.assertEqual(result["path"],str(candidate))

    def test_configured_but_missing_refuses_without_path_fallback(self):
        with patch.object(cfg.shutil,"which",side_effect=AssertionError("must not fall through")):
            result=cfg.resolve_runtime("git",("git",),environ={"DSHA_GIT":"/definitely/missing/tool","PATH":"/bin"})
        self.assertEqual(result["state"],"INVALID_OVERRIDE")
        self.assertIsNone(result["path"])

    def test_empty_override_refuses_without_path_fallback(self):
        with patch.object(cfg.shutil,"which",side_effect=AssertionError("must not fall through")):
            result=cfg.resolve_runtime("pwsh",("pwsh",),environ={"DSHA_PWSH":"","PATH":"/usr/bin"})
        self.assertEqual(result["state"],"INVALID_OVERRIDE")

    def test_directory_and_relative_path_override_refused(self):
        with tempfile.TemporaryDirectory() as d:
            for value in [d,"./evil.sh","../evil.sh","nested/evil.sh"]:
                got=cfg.resolve_runtime("bash",("bash",),explicit=value,environ={"PATH":"/usr/bin"})
                self.assertEqual(got["state"],"INVALID_OVERRIDE",value)

    def test_explicit_bare_name_must_exist_on_path(self):
        with patch.object(cfg.shutil,"which",return_value="/private/test-cli") as which:
            result=cfg.resolve_runtime("node",("node",),explicit="node-fixture",
                                       environ={"PATH":"/private"})
        self.assertEqual(result["state"],"CONFIGURED")
        self.assertEqual(result["path"],"/private/test-cli")
        which.assert_called_once_with("node-fixture",path="/private")

    def test_automatic_discovery_checks_allowed_aliases_only(self):
        with patch.object(cfg.shutil,"which",side_effect=[None,"/usr/bin/ok"]) as which:
            got=cfg.resolve_runtime("cfcli",("cloudflare","cf"),environ={"PATH":"/usr/bin"})
        self.assertEqual(got["state"],"DISCOVERED")
        self.assertEqual(which.call_count,2)

    def test_linux_semantic_probe_required_even_for_explicit(self):
        with tempfile.TemporaryDirectory() as d:
            fake=Path(d)/"bash";fake.write_text("#!/bin/sh\nexit 0\n");fake.chmod(0o700)
            with patch.dict(os.environ,{"DSHA_BASH":str(fake)}),patch.object(
                 linux,"run_probe",return_value=(True,"malicious-tool")):
                got=linux.capability("bash")
            self.assertNotEqual(got["state"],"NATIVE")

    def test_linux_invalid_explicit_does_not_probe_path(self):
        with patch.dict(os.environ,{"DSHA_BASH":"/absent/invalid"}),patch.object(
             linux,"run_probe",side_effect=AssertionError("must not run")):
            got=linux.capability("bash")
        self.assertEqual(got["state"],"UNAVAILABLE")
        self.assertEqual(got["evidence"],"invalid_explicit_runtime_no_fallback")

    def test_linux_public_capability_output_hides_real_path(self):
        with tempfile.TemporaryDirectory() as d:
            fake=Path(d)/"private-client";fake.write_text("#!/bin/sh\nexit 0\n");fake.chmod(0o700)
            with patch.dict(os.environ,{"DSHA_GIT":str(fake)}),patch.object(
                 linux,"run_probe",return_value=(True,"git version 2.50")):
                got=linux.capability("git")
            self.assertEqual(got["state"],"NATIVE")
            self.assertNotIn(d,str(got))

    def test_cf_invalid_override_never_queries_other_backend(self):
        with patch.dict(os.environ,{"DSHA_CF":"/absent/identity","DSHA_WRANGLER":"/absent/other"}):
            with patch.object(cf,"_identity_probe",side_effect=AssertionError("no probe")):
                self.assertIsNone(cf.locate("cfcli"))
                self.assertIsNone(cf.locate("wrangler"))

    def test_cf_explicit_option_is_identity_checked(self):
        with tempfile.TemporaryDirectory() as d:
            fake=Path(d)/"cf"
            fake.write_text("#!/bin/sh\nexit 0\n");fake.chmod(0o700)
            with patch.dict(os.environ,{"DSHA_CF":str(fake)}),patch.object(
                 cf,"_identity_probe",return_value=False) as probe:
                self.assertIsNone(cf.locate("cfcli"))
            probe.assert_called_once_with("cfcli",str(fake))

    def test_cf_status_does_not_publish_host_paths(self):
        with patch.object(cf,"locate",side_effect=lambda n:"/home/private/secret/bin/"+n):
            result=cf.status()
        self.assertNotIn("/home/private",str(result))
        self.assertEqual(result["cfcli"]["path"],"[available]")
        self.assertEqual(result["cfcli"]["auth"],"NOT_CHECKED")

    def test_linux_observe_does_not_publish_checkout_root(self):
        with patch.object(linux.platform,"system",return_value="Linux"),patch.object(
             linux,"capability",return_value={"state":"UNAVAILABLE","binary":None}),patch.object(
             linux.shutil,"which",return_value=None):
            result=linux.observe(Path("/home/private/hidden-checkout"))
        self.assertEqual(result["root"],"[local]")
        self.assertNotIn("hidden-checkout",str(result))

    def test_no_shell_env_file_or_side_effect_on_discovery(self):
        with patch.object(cfg.shutil,"which",return_value=None):
            result=cfg.resolve_runtime("npm",("npm",),environ={"PATH":"/not-existing"})
        self.assertEqual(result["state"],"UNAVAILABLE")

    def test_unknown_environment_key_rejected(self):
        with self.assertRaises(ValueError):
            cfg.resolve_runtime("unknown",("unknown",),environ={})

if __name__=="__main__":unittest.main()
