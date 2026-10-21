"""Cloudflare routing is side-effect free until explicit dispatch."""
import sys, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parent))
import dsha_cf as cf

class CfRoutingTests(unittest.TestCase):
    def test_auth_identity(self):
        self.assertEqual(cf.select_command(["whoami"])["argv"],["auth","whoami"])
        self.assertEqual(cf.select_command(["wrangler","whoami"])["backend"],"wrangler")
        self.assertEqual(cf.select_command(["login"])["backend"],"cfcli")
        self.assertEqual(cf.select_command(["auth","whoami"])["backend"],"cfcli")
    def test_default_cfcli(self):
        for x in (["zones","list"],["dns","records","list"],["d1","list"],["mcp"]):
            self.assertEqual(cf.select_command(x)["backend"],"cfcli")
        self.assertEqual(cf.select_command(["search","create","D1"])["argv"],["cli","search","create D1"])
    def test_wrangler_explicit(self):
        self.assertEqual(cf.select_command(["wrangler","whoami"])["argv"],["whoami"])
        self.assertEqual(cf.select_command(["tail","worker"])["backend"],"wrangler")
        self.assertEqual(cf.select_command(["pages","deploy","./dist"])["backend"],"wrangler")
    def test_project_config(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d);(p/"wrangler.toml").write_text("name='w'")
            self.assertEqual(cf.select_command(["deploy"],p)["backend"],"wrangler")
            self.assertEqual(cf.select_command(["cfcli","deploy"],p)["error_code"],"ERR_PROJECT_BACKEND_MISMATCH")
            (p/"cloudflare.config.ts").write_text("export default {}")
            self.assertEqual(cf.select_command(["deploy"],p)["backend"],"cfcli")
            self.assertEqual(cf.select_command(["wrangler","deploy"],p)["error_code"],"ERR_PROJECT_BACKEND_MISMATCH")
    def test_no_config_priority(self):
        with tempfile.TemporaryDirectory() as d:
            res=cf.select_command(["deploy"],d)
            self.assertEqual(res["backend"],"cfcli")
            self.assertTrue(res["needs_project_review"])
    def test_no_fallback(self):
        with patch.object(cf,"locate",return_value=None):
            code,res=cf.dispatch(["whoami"])
        self.assertEqual(code,2)
        self.assertEqual(res["backend"],"cfcli")
    def test_status_never_checks_login(self):
        with patch.object(cf,"locate",return_value=None):
            res=cf.status()
        self.assertEqual(res["cfcli"]["auth"],"NOT_CHECKED")
        self.assertFalse(res["proxy_injected"])
    def test_unknown_command(self):
        self.assertEqual(cf.select_command(["unknown"])["status"],"ERR_BLOCK")
    def test_plan_does_not_execute(self):
        with patch.object(cf,"locate",return_value="/tmp/cli"),patch.object(cf.subprocess,"run") as p:
            code,res=cf.dispatch(["whoami"],execute=False)
        self.assertEqual(res["status"],"PLAN_ONLY")
        p.assert_not_called()
    def test_probe_rejects_bad_binary(self):
        with patch.object(cf.subprocess,"run",return_value=type("R",(),{"returncode":1,"stdout":"","stderr":"unknown"})()):
            self.assertFalse(cf._identity_probe("cfcli","/tmp/fakecf"))

if __name__=="__main__":unittest.main()


class CfPrerequisiteIsolation(unittest.TestCase):
    def test_cf_does_not_require_wrangler(self):
        import base_tool
        tool = base_tool.CFTool()
        binaries = [x.binary for x in tool.prerequisites]
        self.assertNotIn("wrangler", binaries)
        self.assertNotIn("cfcli", binaries)
        self.assertIn("python", binaries)

    def test_own_wrapper_is_never_a_cfcli_binary(self):
        from unittest.mock import patch
        with patch.object(cf, "_is_own_wrapper", return_value=True):
            self.assertFalse(cf._identity_probe("cfcli", "/tmp/cf.cmd"))
