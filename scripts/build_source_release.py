"""Build and verify matching ZIP/TAR directly from a committed Git tree."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tarfile
import zipfile


def git(*args):
    return subprocess.check_output(['git', *args])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ref', default='HEAD')
    parser.add_argument('--version', default='V1.0')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', args.version):
        parser.error('version must be a filename-safe label')
    commit = git('rev-parse', '--verify', args.ref + '^{commit}').decode().strip()
    tree = {}
    for entry in git('ls-tree', '-rz', '--full-tree', commit).split(b'\0'):
        if not entry: continue
        metadata, name = entry.split(b'\t', 1)
        mode, kind, oid = metadata.decode().split()
        if kind != 'blob' or mode not in ('100644', '100755'):
            raise ValueError('release requires regular source files, not submodules or symlinks')
        tree[name.decode('utf-8')] = oid
    args.output.mkdir(parents=True, exist_ok=False)
    stem = 'DSHA-SharBoy-' + args.version
    prefix = stem + '/'
    archives = {}
    for fmt in ('zip', 'tar'):
        target = args.output / (stem + '-source.' + fmt)
        subprocess.run(['git', 'archive', '--format=' + fmt, '--prefix=' + prefix,
                        '--output=' + str(target.resolve()), commit], check=True)
        archives[fmt] = target
    with zipfile.ZipFile(archives['zip']) as z:
        if z.testzip() is not None: raise ValueError('ZIP CRC failure')
        zip_files = {item.filename[len(prefix):]: z.read(item) for item in z.infolist() if not item.is_dir()}
    with tarfile.open(archives['tar'], 'r:') as t:
        tar_files = {item.name[len(prefix):]: t.extractfile(item).read() for item in t if item.isfile()}
    if set(zip_files) != set(tree) or set(tar_files) != set(tree):
        raise ValueError('archive file list differs from committed tree')
    files = {}
    for name, oid in tree.items():
        data = zip_files[name]
        if data != tar_files[name]: raise ValueError('ZIP/TAR content mismatch')
        blob = b'blob ' + str(len(data)).encode() + b'\0' + data
        if hashlib.new('sha1' if len(oid) == 40 else 'sha256', blob).hexdigest() != oid:
            raise ValueError('archive content differs from Git blob: ' + name)
        files[name] = hashlib.sha256(data).hexdigest()
    manifest = {'release': args.version, 'commit': commit, 'file_count': len(files),
                'verification': 'ZIP CRC and every ZIP/TAR entry matched to committed Git blob',
                'source_sha256': files}
    manifest_path = args.output / 'SOURCE_MANIFEST.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    assets = [archives['zip'], archives['tar'], manifest_path]
    checksums = ''.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.name + '\n' for p in assets)
    (args.output / 'SHA256SUMS.txt').write_text(checksums, encoding='utf-8')
    print(json.dumps({'commit': commit, 'files': len(files), 'status': 'PASS',
                      'assets': [p.name for p in assets] + ['SHA256SUMS.txt']}))


if __name__ == '__main__': main()
