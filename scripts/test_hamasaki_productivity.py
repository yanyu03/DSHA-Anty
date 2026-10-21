"""Hamasaki independent Productivity Tools, local read-only smoke tests."""
from pathlib import Path
import importlib.util
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parent))
import hamasaki_pipeline as router

ROOT=Path(__file__).resolve().parents[1]
def module(name):
    spec=importlib.util.spec_from_file_location("trial_"+name,ROOT/"tools"/name/"adapter.py")
    m=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m
md=module("markdown");office=module("office");wps=module("wps")

class ProductToolTests(unittest.TestCase):
    def test_markdown_outline(self):
        value=md.inspect("# Title\n\n## Part\n")
        self.assertEqual(value["heading_count"],2)
    def test_markdown_jump(self):
        self.assertEqual(md.check("# Title\n### Jump\n")[0]["rule"],"MD001")
    def test_markdown_symlink_refused(self):
        with tempfile.TemporaryDirectory() as d:
            a=Path(d)/"real.md";a.write_text("# Okay\n")
            b=Path(d)/"linked.md";b.symlink_to(a)
            with self.assertRaises(ValueError):md.read_checked(b)
    def test_office_macro_refused(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"infected.docm";p.write_bytes(b"not office")
            with self.assertRaises(ValueError):office.inspect(p)
    def test_office_bad_archive_refused(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"bad.docx";p.write_bytes(b"not zip")
            with self.assertRaises(ValueError):office.inspect(p)
    def test_wps_missing_software(self):
        with patch.object(wps.shutil,"which",return_value=None),patch.object(wps.importlib.util,"find_spec",return_value=None):
            result=wps.status()
        self.assertEqual(result["status"],"DEPENDENCY_MISSING")
        self.assertFalse(result["executed_application"])
    def test_route_three_tools(self):
        meta={k:router.EXTENSIONS[k] for k in ("markdown","office","wps")}
        for query,expected in [
            ("检查 README.md 标题","markdown"),
            ("检查合同.docx文档","office"),
            ("读取表格.xlsx","office"),
            ("读取课件.pptx","office"),
            ("WPS打不开文档","wps"),
            ("WPS表格打开 data.xlsx","wps"),
        ]:
            self.assertEqual(router.rank(query,meta)[0].id,expected)
    def test_manifest_is_side_effect_free(self):
        import json
        for name in ("markdown","office","wps"):
            manifest=json.loads((ROOT/"tools"/name/"manifest.json").read_text("utf-8"))
            self.assertFalse(manifest["network"])
            self.assertEqual(manifest["default_permissions"],["read-only"])
    def test_hash_pins(self):
        import hamasaki_identity as identity
        result=identity.snapshot(ROOT,[])
        for name in ("markdown","office","wps"):
            self.assertEqual(result["tools"][name]["status"],"PINNED")
if __name__=="__main__":unittest.main()
