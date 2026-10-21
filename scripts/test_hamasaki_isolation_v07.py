"""Hard-coded environment, permissions and isolation regression checks."""
import concurrent.futures
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parent))
import base_tool as core
import hamasaki_executor as exe
import hamasaki_sandbox as sand
import hamasaki_hotplug as plugs

class HardenedIsolationV07(unittest.TestCase):
    def test_safe_default_tier_is_read_only(self):
        from hamasaki_linux import tier_status
        repo=Path(__file__).resolve().parents[1]
        self.assertEqual(tier_status(repo),"read-only")
        self.assertEqual(core.get_active_tier(),"read-only")

    def test_corrupted_primary_tier_never_falls_through(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            fake=root/"scripts/base_tool.py";fake.parent.mkdir()
            (root/"tier.json").write_text('{"tier":"whatsoever"}')
            p=root/"plugins/dsh-permissions/tier.json";p.parent.mkdir(parents=True)
            p.write_text('{"tier":"danger-full-access"}')
            with patch.object(core,"__file__",str(fake)):
                self.assertEqual(core.get_active_tier(),"UNKNOWN")

    def test_tier_symlink_denied(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            fake=root/"scripts/base_tool.py";fake.parent.mkdir()
            p=root/"plugins/dsh-permissions/tier.json";p.parent.mkdir(parents=True)
            real=root/"actual.json";real.write_text('{"tier":"danger-full-access"}')
            p.symlink_to(real)
            with patch.object(core,"__file__",str(fake)):
                self.assertEqual(core.get_active_tier(),"UNKNOWN")

    def test_duplicate_tool_id_denied(self):
        reg=core.ToolRegistry()
        reg.register(core.ProductivityTool("markdown"))
        with self.assertRaisesRegex(ValueError,"ERR_DUPLICATE_TOOL_ID"):
            reg.register(core.ProductivityTool("markdown"))

    def test_linux_roots_are_real_posix_paths(self):
        if os.name=="nt":self.skipTest("Linux only")
        roots=core.HostEnvPerceiver.get_system_roots()
        self.assertEqual(roots["sys_root"],Path("/"))
        self.assertEqual(roots["prog_files"],Path("/usr"))
        self.assertNotIn("AppData",str(roots["local_data"]))

    def test_tier_permission_cannot_be_elevated_by_context(self):
        admin=core.TOOL_REGISTRY.get("tier")
        allowed,err=admin.assert_authorization("danger-full-access")
        self.assertFalse(allowed)
        self.assertEqual(err.error_code,"ERR_PERMISSION_DENIED")

    def test_trace_directory_private_outside_checkout(self):
        with tempfile.TemporaryDirectory() as d:
            with patch.dict(os.environ,{"XDG_STATE_HOME":d}):
                folder=core.TraceStore.get_trace_dir()
                self.assertTrue(folder.is_relative_to(Path(d)))
                self.assertEqual(stat.S_IMODE(folder.stat().st_mode),0o700)

    def test_trace_path_input_denied(self):
        self.assertIsNone(core.TraceStore.get("../../etc/passwd"))

    def test_hotplug_capacity_scan_is_bounded(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            for i in range(82):(root/("ext-%03d"%i)).mkdir()
            with patch.dict(os.environ,{"HAMASAKI_TOOLS_DIR":str(root)}):
                result=plugs.scan()
                self.assertEqual(result[0]["reason"],"ERR_TOOL_CAPACITY")

    def test_approval_symlink_location_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            valid=Path(d)/"valid.json";valid.write_text("{}")
            alias=Path(d)/"link.json";alias.symlink_to(valid)
            with patch.dict(os.environ,{"HAMASAKI_TRUST_FILE":str(alias)}):
                with self.assertRaises(ValueError):
                    with plugs.approval_transaction():pass

    def test_untrusted_runtime_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            exe=Path(d)/"bwrap";exe.write_text("#!/bin/sh\nexit 0");exe.chmod(0o755)
            with patch.object(sand.shutil,"which",return_value=str(exe)):
                self.assertIsNone(sand.trusted_runtime("bwrap"))

    def test_sandbox_has_no_host_home_or_network(self):
        with tempfile.TemporaryDirectory() as d:
            args=sand.arguments("/usr/bin/bwrap",Path(d),"main.py",[],
                                python_bin="/usr/bin/python3")
        self.assertIn("--unshare-net",args)
        self.assertNotIn("--new-session",args)
        self.assertNotIn("--bind",args)
        self.assertNotIn("/",args)
        self.assertNotIn("/etc",args)

    def test_resource_limiter_missing_refuses(self):
        with patch.object(sand,"trusted_runtime",side_effect=lambda name:"/usr/bin/bwrap" if name=="bwrap" else None):
            with patch.object(plugs,"inspect",return_value={"status":"READY","actions":["status"]}),patch.object(
                 exe.ids,"snapshot",return_value={"tools":{"ext-test":{"uid":"a","category_uid":"b","content_sha256":"c","source":"plugin","status":"READY","approved":True}}, "registry_uid":"x"}),patch.object(
                 exe.ids,"verify",return_value={"status":"VERIFIED"}):
                with patch("hamasaki_linux.tier_status",return_value="read-only"):
                    value=exe.execute("ext-test","status")
        self.assertEqual(value["error_code"],"ERR_RESOURCE_LIMITER_MISSING")

    def test_kill_process_group_on_timeout(self):
        if sys.platform!="linux":self.skipTest("Linux-only")
        command=[sys.executable,"-c",
                 "import subprocess;subprocess.Popen(['sleep','30']).wait()"]
        start=time.monotonic()
        with tempfile.TemporaryFile() as out,tempfile.TemporaryFile() as err:
            with self.assertRaises(subprocess.TimeoutExpired):
                exe.run_bounded(command,timeout=0.25,env=sand.safe_environment(),
                                stdout=out,stderr=err)
        self.assertLess(time.monotonic()-start,4.0)

    def test_no_preexec_fn(self):
        import inspect
        self.assertNotIn("preexec_fn=",inspect.getsource(exe.run_bounded))

if __name__=="__main__":unittest.main()
