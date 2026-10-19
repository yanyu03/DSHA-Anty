"""Regression tests for dispatch boundaries; no real target or shell is executed."""
import importlib.util
import os
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class RuntimeContracts(unittest.TestCase):
    def copies(self, filename):
        for folder in (ROOT / 'scripts', ROOT / 'plugins/dsh-permissions/scripts'):
            path = folder / filename
            if path.exists():
                yield load(path, 'regression_' + str(folder.name) + filename[:-3])

    def test_failed_version_probe_is_not_ready(self):
        for m in self.copies('base_tool.py'):
            with self.subTest(module=m.__file__), patch.object(m.PrerequisiteEnv, 'locate_binary', return_value=sys.executable), patch.object(m.subprocess, 'run', return_value=types.SimpleNamespace(returncode=7, stdout='24.99.0', stderr='probe failed')):
                self.assertFalse(m.PrerequisiteEnv('node', min_version='24.11.0').verify()['satisfied'])

    def test_context_cannot_elevate_actual_read_only(self):
        for m in self.copies('base_tool.py'):
            tool = m.PwshTool()
            with self.subTest(module=m.__file__), patch.object(m, 'get_active_tier', return_value='read-only'), patch.object(tool, 'assert_environment', return_value=(True, None)), patch.object(tool, 'resolve_executable', return_value=sys.executable), patch.object(tool, 'assert_target_contained', return_value=(True, None)), patch.object(m.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0, stdout='', stderr='')) as run:
                result = tool.execute(['--version'], {'tier': 'danger-full-access'})
                self.assertEqual(result['exit_code'], 126)
                run.assert_not_called()

    def test_successful_version_probe_still_passes(self):
        for m in self.copies('base_tool.py'):
            with self.subTest(module=m.__file__), patch.object(m.PrerequisiteEnv, 'locate_binary', return_value=sys.executable), patch.object(m.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0, stdout='v24.14.1', stderr='')):
                self.assertTrue(m.PrerequisiteEnv('node', min_version='24.11.0').verify()['satisfied'])

    def test_number_without_tool_identity_is_refused(self):
        for m in self.copies('base_tool.py'):
            with self.subTest(module=m.__file__), patch.object(m.PrerequisiteEnv, 'locate_binary', return_value=sys.executable), patch.object(m.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0, stdout='24.14.1', stderr='')):
                self.assertFalse(m.PrerequisiteEnv('node', min_version='24.11.0').verify()['satisfied'])

    def test_context_can_restrict_actual_permissive_tier(self):
        for m in self.copies('base_tool.py'):
            with self.subTest(module=m.__file__), patch.object(m, 'get_active_tier', return_value='danger-full-access'):
                self.assertFalse(m.PwshTool().assert_authorization('read-only')[0])

    def test_explicit_proxy_is_preserved(self):
        for m in self.copies('base_tool.py'):
            tool = m.ScribeTool()
            with self.subTest(module=m.__file__), patch.object(m, 'get_active_tier', return_value='auto'), patch.object(tool, 'assert_environment', return_value=(True, None)), patch.object(tool, 'resolve_executable', return_value=sys.executable), patch.object(tool, 'assert_target_contained', return_value=(True, None)), patch.object(m.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0, stdout='', stderr='')) as run:
                self.assertTrue(tool.execute(context={'proxy': 'http://127.0.0.1:9999'})['success'])
                self.assertEqual(run.call_args.kwargs['env']['HTTPS_PROXY'], 'http://127.0.0.1:9999')

    def test_unknown_tier_is_refused(self):
        for m in self.copies('base_tool.py'):
            with self.subTest(module=m.__file__), patch.object(m, 'get_active_tier', return_value='typo-tier'):
                self.assertFalse(m.PwshTool().assert_authorization()[0])

    def test_proxy_is_not_invented(self):
        for m in self.copies('base_tool.py'):
            tool = m.ScribeTool()
            with self.subTest(module=m.__file__), patch.dict(os.environ, {}, clear=True), patch.object(m, 'get_active_tier', return_value='auto'), patch.object(tool, 'assert_environment', return_value=(True, None)), patch.object(tool, 'resolve_executable', return_value=sys.executable), patch.object(tool, 'assert_target_contained', return_value=(True, None)), patch.object(m.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0, stdout='', stderr='')) as run:
                self.assertTrue(tool.execute()['success'])
                self.assertNotIn('ALL_PROXY', run.call_args.kwargs['env'])

    def test_router_failure_does_not_fall_back_to_raw_execution(self):
        for m in self.copies('router.py'):
            def broken(*args, **kwargs):
                raise RuntimeError('dispatcher unavailable')
            with self.subTest(module=m.__file__), patch.dict(sys.modules, {'index': types.SimpleNamespace(Call_Tools=broken)}), patch.object(sys, 'argv', ['router.py', 'pwsh', '--version']), patch.object(m.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0)) as run:
                self.assertEqual(m.main(), 126)
                run.assert_not_called()


if __name__ == '__main__':
    unittest.main(verbosity=2)
