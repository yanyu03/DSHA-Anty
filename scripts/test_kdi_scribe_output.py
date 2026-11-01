"""Isolated KDI-01 managed-output tests; no production Scribe calls."""
import os
from pathlib import Path
import tempfile
import unittest

from scripts.kdi_scribe_output import ManagedOutputError, open_managed_output, validate_relative_output


class ManagedOutputTests(unittest.TestCase):
    def test_portable_acceptance(self):
        self.assertEqual(validate_relative_output('reports/incident.md'), ('reports', 'incident.md'))
        self.assertEqual(validate_relative_output('日本語.md'), ('日本語.md',))

    def test_portable_rejections(self):
        cases = ('', '.', '..', 'a/../b', 'a//b', 'a/./b', 'a/', '/tmp/out.md',
                 r'C:\temp\out.md', 'C:out.md', r'\\server\share\out.md',
                 r'\\?\C:\out.md', r'\rooted.md', 'a\\b', 'a\x00b')
        for name in cases:
            with self.subTest(name=name), self.assertRaises(ManagedOutputError):
                validate_relative_output(name)

    def test_trusted_root_must_be_absolute(self):
        with self.assertRaises(ManagedOutputError):
            open_managed_output('relative', 'out.md')
        with self.assertRaises(ManagedOutputError):
            open_managed_output(None, 'out.md')

    @unittest.skipUnless(os.name == 'nt', 'Windows fail-closed check')
    def test_windows_managed_open_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ManagedOutputError):
                open_managed_output(Path(tmp), 'out.md')
            self.assertFalse((Path(tmp) / 'out.md').exists())

    @unittest.skipUnless(os.name == 'posix' and hasattr(os, 'O_NOFOLLOW'), 'POSIX no-follow only')
    def test_create_and_exclusive_no_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / 'exports'
            (root / 'reports').mkdir(parents=True)
            with open_managed_output(root, 'reports/incident.md') as f:
                f.write('safe')
            self.assertEqual((root / 'reports/incident.md').read_text(), 'safe')
            with self.assertRaises(ManagedOutputError):
                open_managed_output(root, 'reports/incident.md')
            self.assertEqual((root / 'reports/incident.md').read_text(), 'safe')

    @unittest.skipUnless(os.name == 'posix' and hasattr(os, 'O_NOFOLLOW'), 'POSIX no-follow only')
    def test_symlink_ancestor_and_leaf_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / 'exports'
            outside = Path(tmp) / 'outside'
            root.mkdir()
            outside.mkdir()
            (root / 'link').symlink_to(outside, target_is_directory=True)
            (root / 'file.md').symlink_to(outside / 'target.md')
            for name in ('link/escape.md', 'file.md'):
                with self.subTest(name=name), self.assertRaises(ManagedOutputError):
                    open_managed_output(root, name)
            self.assertFalse((outside / 'escape.md').exists())
            self.assertFalse((outside / 'target.md').exists())
            alias = Path(tmp) / 'alias'
            alias.symlink_to(root, target_is_directory=True)
            with self.assertRaises(ManagedOutputError):
                open_managed_output(alias, 'new.md')

    @unittest.skipUnless(os.name == 'posix' and hasattr(os, 'O_NOFOLLOW'), 'POSIX no-follow only')
    def test_missing_parent_and_directory_leaf_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / 'exports'
            root.mkdir()
            (root / 'existing').mkdir()
            for name in ('missing/out.md', 'existing'):
                with self.subTest(name=name), self.assertRaises(ManagedOutputError):
                    open_managed_output(root, name)
            self.assertFalse((root / 'missing').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
