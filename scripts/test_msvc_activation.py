"""Regression for VS core/VC staged INCLUDE assembly; owned data only."""
import os
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch
import environment_smoke as smoke


@unittest.skipUnless(os.name == 'nt', 'Windows SDK activation contract')
class MsvcActivation(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='msvc include ')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.vs = self.root / 'VS'
        for name in ('Common7/Tools/VsDevCmd.bat', 'Common7/Tools/vsdevcmd/ext/vcvars.bat', 'bin/link.exe'):
            path = self.vs / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.touch()
        self.system = self.root / 'system'
        (self.system / 'System32').mkdir(parents=True)
        (self.system / 'System32/cmd.exe').touch()
        self.vc = self.vs / 'VC include'; self.vc.mkdir()
        self.sdk = self.root / 'SDK include'; self.sdk.mkdir()
        for name in ('excpt.h', 'vcruntime.h'): (self.vc / name).touch()
        (self.sdk / 'windows.h').touch()
        self.env = {'VSINSTALLDIR': str(self.vs), 'SYSTEMROOT': str(self.system), 'PATH': 'original'}

    def activate(self, include, accumulator=None):
        output = f'PATH={self.vs / "bin"}\nINCLUDE={include}\nLIB=owned-lib\nPRIVATE_SENTINEL=do-not-import\n'
        if accumulator is not None: output += f'__VSCMD_VCVARS_INCLUDE={accumulator}\n'
        with patch.object(smoke.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0, stdout=output)), \
             patch.object(smoke.shutil, 'which', return_value=str(self.vs / 'bin/link.exe')):
            return smoke.activate_msvc_sdk(self.env)

    def test_deferred_vc_headers_precede_sdk_and_duplicates_are_removed(self):
        self.assertEqual(self.activate(str(self.sdk), f'{self.vc};{self.sdk};')['status'], 'PASS')
        self.assertEqual(self.env['INCLUDE'].split(';'), [str(self.vc), str(self.sdk)])
        self.assertNotIn('__VSCMD_VCVARS_INCLUDE', self.env)
        self.assertNotIn('PRIVATE_SENTINEL', self.env)

    def test_already_combined_include_remains_valid(self):
        combined = f'{self.vc};{self.sdk}'
        self.assertEqual(self.activate(combined)['status'], 'PASS')
        self.assertEqual(self.env['INCLUDE'], combined)

    def test_missing_required_header_does_not_publish_partial_environment(self):
        (self.vc / 'excpt.h').unlink()
        before = dict(self.env)
        result = self.activate(str(self.sdk), str(self.vc))
        self.assertEqual(result['status'], 'FAIL')
        self.assertEqual(self.env, before)
        self.assertNotIn(str(self.root), str(result))

    def test_sdk_only_include_cannot_claim_ready(self):
        before = dict(self.env)
        self.assertEqual(self.activate(str(self.sdk))['status'], 'FAIL')
        self.assertEqual(self.env, before)


if __name__ == '__main__': unittest.main(verbosity=2)
