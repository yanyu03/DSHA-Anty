"""Adapter dispatch and source-drift checks; no real tool is executed."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
import dsha


class AdapterTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.source = self.root / 'source'
        self.source.mkdir()
        (self.source / 'VERSION').write_bytes(b'1.0.0')
        (self.root / 'references').mkdir()
        (self.root / 'references/source-manifest.json').write_text(json.dumps({
            'source_sha256': {'VERSION': hashlib.sha256(b'1.0.0').hexdigest()}}), encoding='utf-8')
        self.config = {'python': sys.executable, 'dsha_source': str(self.source),
                       'env': {'JAVA_HOME': str(self.root)}}

    def test_json_catalog_uses_json_capable_cli(self):
        with patch.object(dsha, 'prepare_action_environment', return_value=({}, None)), patch.object(dsha, 'SKILL', self.root), patch.object(dsha, 'host', return_value=self.config), patch.object(sys, 'argv', ['dsha.py', 'catalog', '--json']), patch.object(dsha.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0)) as run:
            self.assertEqual(dsha.main(), 0)
            args = run.call_args.args[0]
            self.assertEqual(Path(args[1]).name, 'base_tool.py')
            self.assertEqual(args[2:], ['list', '--json'])

    def test_failed_envfeel_does_not_launch_action(self):
        with patch.object(dsha, 'prepare_action_environment', return_value=(None, {'status': 'REFUSED'})), patch.object(dsha, 'SKILL', self.root), patch.object(dsha, 'host', return_value=self.config), patch.object(sys, 'argv', ['dsha.py', 'catalog']), patch.object(dsha.subprocess, 'run') as run:
            self.assertEqual(dsha.main(), 126)
            run.assert_not_called()

    def test_source_drift_refuses_before_launch(self):
        (self.source / 'VERSION').write_bytes(b'changed')
        with patch.object(dsha, 'SKILL', self.root), patch.object(dsha, 'host', return_value=self.config), patch.object(sys, 'argv', ['dsha.py', 'catalog']), patch.object(dsha.subprocess, 'run') as run:
            self.assertEqual(dsha.main(), 1)
            run.assert_not_called()


if __name__ == '__main__':
    unittest.main()
