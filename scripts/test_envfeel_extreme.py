"""Extreme-condition smoke on owned fixtures; OS/ACL outages are explicitly simulated."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
import envfeel
from dsha_env import find_binary
from environment_smoke import discover_visual_studio


@unittest.skipUnless(os.name == 'nt', 'Native matrix targets this Windows host')
class ExtremeEnvFeel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='EnvFeel 极端 工况 ')
        cls.addClassCleanup(cls.temp.cleanup)
        cls.root = Path(cls.temp.name)
        cls.full = os.environ.copy()
        codex = Path(os.environ.get('CODEX_HOME') or Path.home() / '.codex')
        config = Path(os.environ.get('DSHA_HOST_CONFIG') or codex / 'tools/dsha/host.json')
        if config.is_file():
            host = json.loads(config.read_text(encoding='utf-8'))
            for key, value in host['env'].items():
                cls.full.setdefault(key, value)
            cls.full.setdefault('DSHA_NODE', host['node'])
        discover_visual_studio(cls.full)
        cls.paths = {name: find_binary(name, environ=cls.full) for name in ('node', 'rustc', 'java', 'javac', 'cl')}
        cls.paths['python'] = sys.executable
        if not cls.paths['node'] or not cls.paths['rustc']:
            raise unittest.SkipTest('Matrix fixture generation needs local Node and Rust')
        cls.minimal = {key: value for key, value in cls.full.items()
                       if key.upper() in ('SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'COMSPEC', 'PATHEXT')}
        cls.minimal.update(PATH='', PYTHONUTF8='1')
        fake_source = cls.root / 'counterfeit.rs'
        fake_source.write_text('''fn main() {
 if std::env::args().next().unwrap().contains("stall") { std::thread::sleep(std::time::Duration::from_secs(90)); }
 if std::env::args().any(|a| a == "--version") { println!("v99.0.0"); }
 else { println!("DSHA_SMOKE_OK"); }
}''', encoding='utf-8')
        cls.fake = cls.root / 'node.exe'
        result = subprocess.run([cls.paths['rustc'], str(fake_source), '-o', str(cls.fake)], env=cls.full, capture_output=True, timeout=45)
        if result.returncode:
            raise RuntimeError('Owned counterfeit fixture build failed; diagnostic output kept private')

    def run_cli(self, required, overrides=None, extra_env=None, extra_args=None):
        env = dict(self.minimal, **(extra_env or {}))
        command = [sys.executable, envfeel.__file__]
        for name in required:
            command += ['--require', name]
        for name, path in (overrides or {}).items():
            command += ['--binary', name + '=' + str(path)]
        result = subprocess.run(command + (extra_args or []), env=env, cwd=self.root, capture_output=True, timeout=25)
        self.assertNotIn(b'Traceback', result.stdout + result.stderr)
        return result.returncode, json.loads(result.stdout)

    def assert_ready(self, result):
        code, report = result
        self.assertEqual(code, 0, report)
        self.assertEqual(report['status'], 'READY', report)

    def refused_task(self, required, overrides=None, extra_env=None, extra_args=None):
        marker = self.root / (self._testMethodName + '.marker')
        tool = 'node' if 'node' in required and 'python' not in required else 'python'
        program = ('require("fs").writeFileSync(' + json.dumps(str(marker)) + ', "TASK")') if tool == 'node' else ('from pathlib import Path; Path(' + repr(str(marker)) + ').touch()')
        command = (extra_args or []) + ['--run', tool, '--', '-e' if tool == 'node' else '-c', program]
        code, report = self.run_cli(required, overrides, extra_env, command)
        self.assertEqual(code, 126, report)
        self.assertEqual(report['status'], 'REFUSED', report)
        self.assertEqual(report['task']['status'], 'NOT_RUN', report)
        self.assertFalse(marker.exists())
        return report

    def test_bootstrap_python_with_no_home_path_or_sdk(self):
        self.assert_ready(self.run_cli(['python']))

    def test_explicit_tools_survive_empty_environment_and_foreign_cwd(self):
        self.assert_ready(self.run_cli(['python', 'node'], {name: self.paths[name] for name in ('python', 'node')}))

    def test_java_sdk_only_without_home(self):
        if not self.paths['java']:
            self.skipTest('JDK not discovered')
        self.assert_ready(self.run_cli(['java'], extra_env={'JAVA_HOME': str(Path(self.paths['java']).parent.parent)}))

    def test_rust_sdk_only_without_home(self):
        rustup_home = self.full.get('RUSTUP_HOME') or str(Path.home() / '.rustup')
        self.assert_ready(self.run_cli(['rustc'], extra_env={'CARGO_HOME': str(Path(self.paths['rustc']).parent.parent), 'RUSTUP_HOME': rustup_home}))

    def test_msvc_sdk_only_without_home(self):
        if not self.full.get('VSINSTALLDIR'):
            self.skipTest('VC SDK not discovered')
        self.assert_ready(self.run_cli(['cl'], extra_env={'VSINSTALLDIR': self.full['VSINSTALLDIR']}))

    def test_explicit_env_file_without_home(self):
        config = self.root / 'SDK 环境.env'
        config.write_text('JAVA_HOME="' + str(Path(self.paths['java']).parent.parent) + '"\n', encoding='utf-8')
        self.assert_ready(self.run_cli(['java'], extra_args=['--env-file', str(config)]))

    def test_parameter_overrides_invalid_environment(self):
        self.assert_ready(self.run_cli(['node'], {'node': self.paths['node']}, {'DSHA_NODE': str(self.root / 'missing')}))

    def test_standard_install_root_case_insensitive_without_home(self):
        program_files = os.environ.get('ProgramFiles')
        if not program_files or not (Path(program_files) / 'nodejs/node.exe').is_file():
            self.skipTest('No standard Node installation')
        self.assert_ready(self.run_cli(['node'], extra_env={'pRoGrAmFiLeS': program_files}))

    def test_absent_home_cannot_borrow_parent_rust_location(self):
        self.refused_task(['python', 'rustc'], {'python': sys.executable})
        code, report = self.run_cli(['rustc'])
        self.assertEqual(code, 126)
        self.assertEqual(report['tools'][0]['status'], 'NOT_DISCOVERED')

    def test_failed_native_architecture_query_refuses_without_environment_fallback(self):
        import ctypes
        with patch.object(ctypes, 'WinDLL', side_effect=OSError('simulated native failure')):
            report = envfeel.EnvFeel(['python'], {'python': sys.executable}).check()
            self.assertEqual(report['status'], 'REFUSED')
            self.assertEqual(report['context']['architecture_source'], 'native-query-unavailable')

    def test_invalid_environment_never_falls_back_to_real_path_tool(self):
        self.refused_task(['node'], extra_env={'DSHA_NODE': str(self.root / 'missing'), 'PATH': str(Path(self.paths['node']).parent)})

    def test_directory_is_not_executable(self):
        self.refused_task(['node'], {'node': self.root})

    def test_corrupted_executable_is_refused(self):
        corrupt = self.root / 'corrupt.exe'
        corrupt.write_bytes(b'MZ\x00not-an-executable')
        self.refused_task(['node'], {'node': corrupt})

    def test_counterfeit_static_version_and_health_is_refused(self):
        self.refused_task(['node'], {'node': self.fake})

    def test_poisoned_path_static_counterfeit_is_refused(self):
        self.refused_task(['node'], extra_env={'PATH': str(self.root)})

    def test_spaces_unicode_in_real_executable_location(self):
        folder = self.root / '真实 工具'
        folder.mkdir()
        linked = folder / 'node.exe'
        try:
            os.link(self.paths['node'], linked)
        except OSError:
            shutil.copy2(self.paths['node'], linked)
        self.assert_ready(self.run_cli(['node'], {'node': linked}))

    def test_native_architecture_ignores_environment_when_wmi_unavailable(self):
        expected = envfeel.runtime_context()['architecture_reported']
        spoof = 'ARM64' if expected != 'arm64' else 'AMD64'
        with patch.dict(os.environ, {'PROCESSOR_ARCHITECTURE': spoof, 'PROCESSOR_ARCHITEW6432': ''}), patch.object(envfeel.platform, '_wmi_query', side_effect=OSError('simulated unavailable WMI')), patch.object(envfeel.platform, '_uname_cache', None):
            self.assertEqual(envfeel.runtime_context()['architecture_reported'], expected)

    def test_temporary_storage_failure_cannot_launch_task(self):
        with patch('environment_smoke.tempfile.TemporaryDirectory', side_effect=PermissionError('simulated storage denial')):
            report, _ = envfeel.EnvFeel(['python'], {'python': sys.executable}).execute('python', ['--version'])
            self.assertEqual(report['status'], 'REFUSED')
            self.assertEqual(report['task']['status'], 'NOT_RUN')

    def test_env_file_does_not_execute_shell_content(self):
        config = self.root / 'untrusted.env'
        marker = self.root / 'env-code-must-not-run'
        config.write_text('DSHA_NODE="$(touch ' + str(marker) + ')"', encoding='utf-8')
        self.refused_task(['node'], extra_args=['--env-file', str(config)])
        self.assertFalse(marker.exists())

    def test_real_hanging_probe_is_bounded(self):
        stall = self.root / 'stall.exe'
        shutil.copy2(self.fake, stall)
        started = time.monotonic()
        report = self.refused_task(['node'], {'node': stall})
        self.assertEqual(report['tools'][0].get('error'), 'TimeoutExpired')
        self.assertGreaterEqual(time.monotonic() - started, 9)
        self.assertLess(time.monotonic() - started, 20)


if __name__ == '__main__':
    unittest.main(verbosity=2)
