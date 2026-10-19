"""Synthetic configuration failures; no credentials or real targets are used."""
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
import base_tool
import dsha_env
import dsha_cf
import router

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('rea_driver', ROOT / 'skills/reverse-engineer-anything/tools/rea/dsha_rea_driver.py')
driver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(driver)


class ConfigurationBoundaries(unittest.TestCase):
    def test_owned_wrapper_errors_do_not_echo_exception_values(self):
        failure = OSError('synthetic-secret private-path')
        tool = base_tool.ScribeTool()
        with patch.object(tool, 'assert_environment', return_value=(True, None)), patch.object(tool, 'assert_authorization', return_value=(True, None)), patch.object(tool, 'resolve_executable', return_value=sys.executable), patch.object(tool, 'assert_target_contained', return_value=(True, None)), patch.object(base_tool.subprocess, 'run', side_effect=failure):
            result = tool.execute()
            self.assertFalse(result['success'])
            self.assertNotIn('synthetic-secret', result['stderr'])
        output = io.StringIO()
        with patch.object(dsha_cf, 'find_tool', return_value=sys.executable), patch.object(dsha_cf.subprocess, 'run', side_effect=failure), contextlib.redirect_stderr(output):
            self.assertNotEqual(dsha_cf.run_wrangler_cmd(['--version']), 0)
        with patch.dict(sys.modules, {'index': types.SimpleNamespace(Call_Tools=lambda *args: (_ for _ in ()).throw(failure))}), patch.object(sys, 'argv', ['router.py', 'pwsh']), contextlib.redirect_stderr(output):
            self.assertEqual(router.main(), 126)
        self.assertNotIn('synthetic-secret', output.getvalue())

    @unittest.skipUnless(os.name == 'nt', 'Windows CMD resolver')
    def test_shell_resolver_path_and_invalid_explicit_directory(self):
        resolver = ROOT / 'bin/dsha-env.cmd'
        with tempfile.TemporaryDirectory(prefix='private shell ') as folder:
            for shell in ('pwsh', 'bash', 'sh'):
                executable = Path(folder) / (shell + '.exe')
                executable.write_bytes(b'fixture: discovery only')
                variable = 'DSHA_' + shell.upper()
                env = {key: value for key, value in os.environ.items() if key != variable}
                env['PATH'] = folder + os.pathsep + env.get('PATH', '')
                wrapper = Path(folder) / 'check.cmd'
                wrapper.write_text(f'@echo off\ncall "{resolver}" {shell}\nif errorlevel 1 exit /b 126\nif not "%{variable}%"=="{executable}" exit /b 125\nexit /b 0\n', encoding='utf-8')
                found = subprocess.run([str(wrapper)], env=env, capture_output=True, timeout=10)
                self.assertEqual(found.returncode, 0, found.stderr)
                env[variable] = folder
                refused = subprocess.run([str(resolver), shell], env=env, capture_output=True, timeout=10)
                self.assertEqual(refused.returncode, 126)
                self.assertNotIn(folder.encode(), refused.stderr)

    def test_driver_bad_timeout_does_not_echo_value(self):
        with tempfile.TemporaryDirectory() as folder:
            entry = Path(folder) / 'fixture.mjs'
            entry.write_text('// not executed', encoding='utf-8')
            env = dict(os.environ, DSHA_NODE=sys.executable, DSHA_REA_ENTRY=str(entry), DSHA_REA_TIMEOUT='synthetic-secret')
            result = subprocess.run([sys.executable, str(Path(driver.__file__))], env=env, capture_output=True, timeout=10)
            self.assertNotEqual(result.returncode, 0)
            self.assertNotIn(b'synthetic-secret', result.stdout + result.stderr)
            self.assertNotIn(b'Traceback', result.stdout + result.stderr)

    def test_explicit_broken_tier_never_falls_back(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'tier.json'
            for value in (None, '{bad json', '{}', '[]'):
                if value is not None:
                    path.write_text(value, encoding='utf-8')
                with self.subTest(value=value), patch.dict(os.environ, {'DSHA_TIER_FILE': str(path)}):
                    self.assertEqual(base_tool.get_active_tier(), 'invalid')
                    self.assertFalse(base_tool.PwshTool().assert_authorization()[0])

    def test_adapter_config_failures_do_not_disclose_path_or_content(self):
        with tempfile.TemporaryDirectory(prefix='private fixture ') as folder:
            path = Path(folder) / 'host.json'
            for value in (None, '{synthetic-secret', '[]', '{}', '{"env": []}'):
                if value is not None:
                    path.write_text(value, encoding='utf-8')
                commands = [('dsha.py', ['--host-config', str(path), 'status']), ('mcp_client.py', ['--list'])]
                for name, args in commands:
                    script = ROOT / 'codex/skill/scripts' / name
                    result = subprocess.run([sys.executable, str(script), *args], env=dict(os.environ, DSHA_HOST_CONFIG=str(path)), capture_output=True, timeout=10)
                    with self.subTest(value=value, entry=name):
                        self.assertNotEqual(result.returncode, 0)
                        output = (result.stdout + result.stderr).decode('utf-8')
                        self.assertNotIn(folder, output)
                        self.assertNotIn('synthetic-secret', output)
                        self.assertNotIn('Traceback', output)
                        self.assertIn('REFUSED', output)

    def test_driver_failed_probe_is_not_pass_and_is_bounded(self):
        output = io.StringIO()
        with patch.object(driver.subprocess, 'run', return_value=types.SimpleNamespace(returncode=7, stdout='synthetic-secret', stderr='private')), contextlib.redirect_stdout(output):
            code = driver.run_self_test('private-node')
        self.assertNotEqual(code, 0)
        self.assertNotIn('[PASS]', output.getvalue())
        self.assertNotIn('synthetic-secret', output.getvalue())
        self.assertNotIn('private-node', output.getvalue())

    def test_driver_success_does_not_claim_provider_validation(self):
        output = io.StringIO()
        with patch.dict(os.environ, {'GHIDRA_INSTALL_DIR': 'private-provider'}), patch.object(driver.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0, stdout='6.7.0', stderr='')) as run, contextlib.redirect_stdout(output):
            self.assertEqual(driver.run_self_test('private-node'), 0)
        self.assertEqual(run.call_args.kwargs['timeout'], 10)
        self.assertIn('NOT_RUN', output.getvalue())
        self.assertNotIn('private-provider', output.getvalue())
        self.assertNotIn('零崩溃', output.getvalue())

    def test_driver_timeout_reports_failure_without_raw_exception(self):
        output = io.StringIO()
        with patch.object(driver.subprocess, 'run', side_effect=subprocess.TimeoutExpired('private-node', 10)), contextlib.redirect_stdout(output):
            self.assertNotEqual(driver.run_self_test('private-node'), 0)
        self.assertNotIn('private-node', output.getvalue())

    def test_redaction_handles_url_credentials_and_home_with_spaces(self):
        sample = {'access_token': 'synthetic-secret', 'client_secret': 'synthetic-secret',
                  'message': 'https://synthetic-user:synthetic-pw@example.invalid/path C:/Users/Private Name/data /home/private-user/data'}
        result = json.dumps(dsha_env.redact(sample))
        for private in ('synthetic-secret', 'synthetic-user', 'synthetic-pw', 'Private Name', 'private-user'):
            self.assertNotIn(private, result)


if __name__ == '__main__':
    unittest.main(verbosity=2)
