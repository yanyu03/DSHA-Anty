"""EnvFeel refusal means task markers are never created."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import base_tool
import envfeel


class EnvFeelTests(unittest.TestCase):
    def test_numeric_version_only_is_not_readiness(self):
        gate = envfeel.EnvFeel(['dotnet'], {'dotnet': sys.executable})
        report, _ = gate.execute('dotnet', ['--version'])
        self.assertEqual(report['status'], 'REFUSED')
        self.assertEqual(report['tools'][0]['status'], 'INSUFFICIENT_CONTRACT')
        self.assertEqual(report['task']['status'], 'NOT_RUN')

    def test_unknown_os_blocks_before_any_command(self):
        with patch.object(envfeel.platform, 'system', return_value='UnknownOS'), patch.object(envfeel.subprocess, 'run') as run:
            report, _ = envfeel.EnvFeel(['python']).execute('python', ['--version'])
            self.assertEqual(report['status'], 'REFUSED')
            self.assertEqual(report['task']['status'], 'NOT_RUN')
            run.assert_not_called()

    def test_unknown_architecture_blocks_before_any_command(self):
        with patch.object(envfeel, 'detect_architecture', return_value=('unknown-cpu', 'simulated')), patch.object(envfeel.subprocess, 'run') as run:
            self.assertEqual(envfeel.EnvFeel(['python']).check()['status'], 'REFUSED')
            run.assert_not_called()

    def test_child_environment_activation_does_not_mutate_parent(self):
        base = dict(os.environ, PATH='', DSHA_PYTHON=sys.executable)
        original = base.copy()
        gate = envfeel.EnvFeel(['python'], environ=base)
        report = gate.check()
        self.assertEqual(report['status'], 'READY')
        self.assertIn(str(Path(sys.executable).parent), gate.environment['PATH'])
        self.assertEqual(base, original)
        self.assertNotIn(sys.executable, json.dumps(report))

    def test_missing_dependency_cannot_execute_task(self):
        with tempfile.TemporaryDirectory() as folder:
            marker = Path(folder) / 'must-not-exist'
            env = dict(os.environ, DSHA_NODE=str(Path(folder) / 'missing-node'))
            gate = envfeel.EnvFeel(['python', 'node'], {'python': sys.executable}, env)
            report, _ = gate.execute('python', ['-c', 'from pathlib import Path; Path(' + repr(str(marker)) + ').touch()'])
            self.assertEqual(report['status'], 'REFUSED')
            self.assertFalse(marker.exists())

    def test_failed_health_check_cannot_execute_task(self):
        with tempfile.TemporaryDirectory() as folder, patch('environment_smoke.fixture_probe', return_value={'status': 'FAIL'}):
            marker = Path(folder) / 'must-not-exist'
            report, _ = envfeel.EnvFeel(['python'], {'python': sys.executable}).execute('python', ['-c', 'from pathlib import Path; Path(' + repr(str(marker)) + ').touch()'])
            self.assertEqual(report['status'], 'REFUSED')
            self.assertFalse(marker.exists())

    def test_saved_readiness_does_not_bypass_fresh_check(self):
        gate = envfeel.EnvFeel(['python'], {'python': sys.executable})
        self.assertEqual(gate.check()['status'], 'READY')
        with patch.object(envfeel.platform, 'system', return_value='UnknownOS'), patch.object(envfeel.subprocess, 'run') as run:
            self.assertEqual(gate.execute('python', ['--version'])[0]['status'], 'REFUSED')
            run.assert_not_called()

    def test_cli_executes_only_after_health_and_keeps_output_private(self):
        with tempfile.TemporaryDirectory() as folder:
            private = Path(folder) / 'run.local.json'
            command = [sys.executable, envfeel.__file__, '--require', 'python', '--binary', 'python=' + sys.executable,
                       '--private-output', str(private), '--run', 'python', '--', '-c', "print('synthetic-private-output')"]
            result = subprocess.run(command, capture_output=True, timeout=15)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout)['status'], 'COMPLETE')
            self.assertNotIn(b'synthetic-private-output', result.stdout)
            self.assertIn('synthetic-private-output', json.loads(private.read_text())['task_output']['stdout'])

    def test_versionless_requirement_must_still_launch(self):
        with tempfile.TemporaryDirectory() as folder:
            invalid = Path(folder) / 'not-an-executable'
            invalid.write_text('owned non-executable fixture', encoding='utf-8')
            result = base_tool.PrerequisiteEnv('fixture', custom_paths=[invalid]).verify()
            self.assertFalse(result['satisfied'])

    def test_base_tool_unknown_os_does_not_invoke_launcher(self):
        with patch.object(envfeel.platform, 'system', return_value='UnknownOS'), patch.object(base_tool.subprocess, 'run') as run:
            result = base_tool.ScribeTool().execute(['status'])
            self.assertEqual(result['exit_code'], 126)
            run.assert_not_called()


if __name__ == '__main__':
    unittest.main(verbosity=2)
