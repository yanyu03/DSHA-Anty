"""Hamasaki hotplug regression tests (non-executing)."""
import json, os, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
import hamasaki_hotplug as h

class HotplugTests(unittest.TestCase):
    def setUp(self):
        t=tempfile.TemporaryDirectory();self.addCleanup(t.cleanup)
        self.root=Path(t.name)/"tools";self.root.mkdir()
        p=patch.dict(os.environ,{"HAMASAKI_TOOLS_DIR":str(self.root),
              "HAMASAKI_TRUST_FILE":str(Path(t.name)/"trust.json")})
        p.start();self.addCleanup(p.stop)
    def install(self):
        d=self.root/"ext-demo";d.mkdir()
        m={"schema":h.SCHEMA,"id":"ext-demo","name":"Demo","version":"1",
           "entry":"main.py","keywords":["demo"],
           "actions":{"status":{"risk":"read-only","argv":["status"],"timeout":2}}}
        (d/"hamasaki-tool.json").write_text(json.dumps(m))
        (d/"main.py").write_text("print('ok')")
        return d
    def test_add_approve_update_revoke(self):
        d=self.install();self.assertEqual(h.scan()[0]["status"],"UNTRUSTED")
        digest=h.scan()[0]["sha256"];self.assertEqual(h.approve("ext-demo",digest)["status"],"APPROVED")
        self.assertEqual(h.catalog()["ext-demo"]["hotplug_status"],"READY")
        (d/"main.py").write_text("print('changed')")
        self.assertEqual(h.scan()[0]["status"],"CHANGED_REVIEW_REQUIRED")
        self.assertEqual(h.run("ext-demo","status")["error_code"],"ERR_TOOL_NOT_APPROVED")
        self.assertEqual(h.revoke("ext-demo")["status"],"REVOKED")
    def test_reject_link(self):
        d=self.install();(d/"link").symlink_to("/etc/passwd")
        self.assertEqual(h.scan()[0]["status"],"BLOCKED")
    def test_sandbox_required(self):
        self.install();h.approve("ext-demo",h.scan()[0]["sha256"])
        with patch.object(h.shutil,"which",return_value=None):
            self.assertEqual(h.run("ext-demo","status")["error_code"],"ERR_SANDBOX_MISSING")
    def test_path_traversal(self):
        self.assertEqual(h.run("../ext-demo","status")["error_code"],"ERR_INVALID_TOOL")

if __name__=="__main__":unittest.main()
