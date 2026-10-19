"""Discovery contracts plus real CLI probes using the current interpreter."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
import environment_smoke as smoke


class EnvironmentSmokeTests(unittest.TestCase):
    def test_env_file_is_explicit_and_process_environment_wins(self):
        with tempfile.TemporaryDirectory() as folder:
            config = Path(folder) / '.env.smoke'
            config.write_text('DSHA_PYTHON="' + sys.executable + '"\n', encoding='utf-8')
            env = dict(os.environ)
            env.pop('DSHA_PYTHON', None)
            command = [sys.executable, smoke.__file__, '--tool', 'python', '--env-file', str(config)]
            first = subprocess.run(command, env=env, capture_output=True, timeout=15)
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertIn('DSHA_PYTHON', json.loads(first.stdout)['env_file_applied_names'])
            env['DSHA_PYTHON'] = str(Path(folder) / 'missing')
            second = subprocess.run(command, env=env, capture_output=True, timeout=15)
            self.assertEqual(second.returncode, 1)
            self.assertEqual(json.loads(second.stdout)['tools'][0]['status'], 'INVALID_OVERRIDE')
            self.assertNotIn('DSHA_PYTHON', json.loads(second.stdout)['env_file_applied_names'])

    def test_real_parameter_beats_invalid_environment_and_invalid_does_not_fallback(self):
        script = Path(smoke.__file__)
        env = dict(os.environ, DSHA_PYTHON=str(script.parent / 'missing private python'))
        good = subprocess.run([sys.executable, str(script), '--tool', 'python', '--binary', 'python=' + sys.executable], env=env, capture_output=True, timeout=15)
        self.assertEqual(good.returncode, 0, good.stderr)
        record = json.loads(good.stdout)['tools'][0]
        self.assertEqual(record['source'], 'parameter')
        self.assertEqual(record['version'], '.'.join(map(str, sys.version_info[:3])))
        refused = subprocess.run([sys.executable, str(script), '--tool', 'python'], env=env, capture_output=True, timeout=15)
        self.assertEqual(refused.returncode, 1)
        self.assertEqual(json.loads(refused.stdout)['tools'][0]['status'], 'INVALID_OVERRIDE')
        self.assertNotIn(env['DSHA_PYTHON'].encode(), refused.stdout)

    def test_wrong_tool_and_failed_probe_cannot_pass(self):
        for code, output in ((0, 'Python 3.12.14'), (7, 'v24.14.1')):
            with self.subTest(code=code), patch.object(smoke.subprocess, 'run', return_value=types.SimpleNamespace(returncode=code, stdout=output, stderr='')):
                self.assertEqual(smoke.version_probe('node', 'private-node')['status'], 'FAIL')

    def test_timeout_summary_never_contains_command(self):
        with patch.object(smoke.subprocess, 'run', side_effect=subprocess.TimeoutExpired('private-command', 10)):
            report = smoke.version_probe('node', 'private-node')
        self.assertEqual(report['status'], 'FAIL')
        self.assertNotIn('private-', json.dumps(report))

    def test_private_output_is_exclusive_and_public_output_has_no_path(self):
        with tempfile.TemporaryDirectory(prefix='private inventory ') as folder:
            output = Path(folder) / 'inventory.local.json'
            command = [sys.executable, smoke.__file__, '--tool', 'python', '--binary', 'python=' + sys.executable, '--private-output', str(output)]
            first = subprocess.run(command, capture_output=True, timeout=15)
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertNotIn(sys.executable.encode(), first.stdout)
            original = output.read_bytes()
            self.assertEqual(json.loads(original)['resolved_executables']['python'], sys.executable)
            repeated = subprocess.run(command, capture_output=True, timeout=15)
            self.assertEqual(repeated.returncode, 2)
            self.assertEqual(output.read_bytes(), original)
            self.assertNotIn(folder.encode(), repeated.stdout + repeated.stderr)

    def test_discovered_sdk_environment_is_restored(self):
        def discovery():
            os.environ['VSINSTALLDIR'] = 'private-sdk'
            return 'fixture'
        with patch.dict(os.environ, {}, clear=True), patch.object(smoke, 'discover_visual_studio', side_effect=discovery):
            report, _ = smoke.inventory([], {})
            self.assertEqual(report['visual_studio_discovery'], 'fixture')
            self.assertNotIn('VSINSTALLDIR', os.environ)


if __name__ == '__main__':
    unittest.main(verbosity=2)
