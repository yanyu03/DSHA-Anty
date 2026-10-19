import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
import dsha_env as env
import dsha_cf


class ConfigTests(unittest.TestCase):
    def test_explicit_path_beats_environment_and_path(self):
        with tempfile.TemporaryDirectory(prefix='dsha space ') as directory:
            root = Path(directory)
            explicit = root / 'chosen node.exe'; explicit.write_bytes(b'fixture')
            with patch.dict(os.environ, {'DSHA_NODE': str(root / 'missing')}, clear=True), patch.object(env.shutil, 'which', return_value='other'):
                self.assertEqual(env.find_binary('node', str(explicit)), str(explicit))

    def test_invalid_environment_never_falls_back(self):
        with patch.dict(os.environ, {'DSHA_NODE': '/missing/configured/node'}, clear=True), patch.object(env.shutil, 'which', return_value=sys.executable):
            self.assertIsNone(env.find_binary('node'))

    def test_environment_only_and_directory_refusal(self):
        with patch.dict(os.environ, {'DSHA_PYTHON': sys.executable}, clear=True):
            self.assertEqual(env.find_binary('python'), sys.executable)
        with patch.dict(os.environ, {'DSHA_PYTHON': str(Path(sys.executable).parent)}, clear=True):
            self.assertIsNone(env.find_binary('python'))

    def test_config_directory_precedence(self):
        with patch.dict(os.environ, {'DSHA_CONFIG_DIR': '/configured'}, clear=True):
            self.assertEqual(env.config_dir('/explicit'), Path('/explicit'))
            self.assertEqual(env.config_dir(), Path('/configured'))

    def test_default_configuration_ignores_cwd(self):
        self.assertEqual(env.config_dir('/explicit'), Path('/explicit'))
        with patch.dict(os.environ, {}, clear=True), patch.object(Path, 'home', return_value=Path('/test-home')):
            self.assertEqual(env.config_dir(), Path('/test-home/.gemini/config'))

    def test_proxy_requires_configuration(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertNotIn('ALL_PROXY', env.proxy_environment())
        with patch.dict(os.environ, {'DSHA_PROXY': 'test://configured'}, clear=True):
            self.assertEqual(env.proxy_environment('test://explicit')['HTTPS_PROXY'], 'test://explicit')

    def test_redacts_paths_and_credentials(self):
        value = env.redact({'token': 'synthetic-secret', 'log': 'C:/Users/example/data Bearer synthetic-key password=synthetic-pw'})
        self.assertNotIn('example', json.dumps(value))
        self.assertNotIn('synthetic-', json.dumps(value))

    def test_status_does_not_query_or_print_identity(self):
        fake = {'node_path': sys.executable, 'node_version': '24', 'cf_path': None, 'cf_version': None,
                'wrangler_path': sys.executable, 'wrangler_version': 'test', 'workerd_installed': False,
                'cloudflared_version': None}
        output = io.StringIO()
        with patch.object(dsha_cf, 'get_cf_environment', return_value=fake), patch.object(dsha_cf.subprocess, 'run') as run, contextlib.redirect_stdout(output):
            dsha_cf.run_status()
            run.assert_not_called()
        self.assertNotIn(sys.executable, output.getvalue())

    def test_renderer_from_other_cwd_and_no_overwrite(self):
        script = Path(__file__).with_name('render_mcp_config.py')
        with tempfile.TemporaryDirectory(prefix='dsha config ') as directory:
            root = Path(directory); entry = root / 'rea entry.mjs'; entry.write_text('//fixture')
            output = root / 'client.local.json'
            command = [sys.executable, str(script), '--node', sys.executable, '--rea-entry', str(entry), '--output', str(output)]
            first = subprocess.run(command, cwd=root, capture_output=True, timeout=10)
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertNotIn(str(root).encode(), first.stdout)
            self.assertEqual(json.loads(output.read_text())['mcpServers']['dsha-rea']['args'][0], str(entry))
            second = subprocess.run(command, cwd=root, capture_output=True, timeout=10)
            self.assertNotEqual(second.returncode, 0)

    @unittest.skipUnless(os.name == 'nt', 'Windows cmd launcher')
    def test_cmd_launcher_with_explicit_python_and_invalid_override(self):
        launcher = Path(__file__).resolve().parents[1] / 'bin/dsha-index.cmd'
        environment = dict(os.environ, DSHA_PYTHON=sys.executable)
        good = subprocess.run([str(launcher), 'get', 'rea'], env=environment, capture_output=True, timeout=15)
        self.assertEqual(good.returncode, 0, good.stderr)
        self.assertEqual(json.loads(good.stdout)['id'], 'rea')
        environment['DSHA_PYTHON'] = str(launcher.parent / 'missing private python.exe')
        bad = subprocess.run([str(launcher), 'get', 'rea'], env=environment, capture_output=True, timeout=15)
        self.assertEqual(bad.returncode, 126)
        self.assertNotIn(environment['DSHA_PYTHON'].encode(), bad.stderr)


if __name__ == '__main__':
    unittest.main(verbosity=2)
