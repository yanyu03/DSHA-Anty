"""No-network, no host-private-filesystem sandbox argument tests."""
import sys
from pathlib import Path
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parent))
import hamasaki_sandbox as s

class SandboxContracts(unittest.TestCase):
    def test_no_host_root_or_network(self):
        with tempfile.TemporaryDirectory() as d:
            argv=s.arguments("/usr/bin/bwrap",Path(d),"main.py",["status"],
                             python_bin="/usr/bin/python3")
        self.assertIn("--unshare-net",argv)
        self.assertIn("--clearenv",argv)
        self.assertNotIn("/",argv)
        self.assertNotIn("/etc",argv)
        self.assertNotIn("--bind",argv)
        self.assertNotIn("--share-net",argv)
    def test_path_traversal(self):
        with tempfile.TemporaryDirectory() as d:
            for entry in ("../x.py","/tmp/main.py",".hidden.py"):
                with self.assertRaises(ValueError):
                    s.arguments("/usr/bin/bwrap",Path(d),entry,[],python_bin="/usr/bin/python3")
    def test_env_credentials_not_forwarded(self):
        out=s.safe_environment()
        self.assertNotIn("CLOUDFLARE_API_TOKEN",out)
        self.assertNotIn("SSH_AUTH_SOCK",out)
        self.assertNotIn("ALL_PROXY",out)

if __name__=="__main__":unittest.main()
