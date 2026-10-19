"""Download a pinned HTTPS artifact in bounded ranges; require publisher SHA-256."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import os
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    url = urllib.parse.urlparse(args.url)
    if url.scheme != 'https' or url.username or url.password or not re.fullmatch('[a-fA-F0-9]{64}', args.sha256):
        raise ValueError('requires credential-free HTTPS URL and publisher SHA-256')
    expected = args.sha256.lower()
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        if hashlib.sha256(output.read_bytes()).hexdigest() != expected:
            raise ValueError('existing output differs; refusing overwrite')
        print('Existing artifact SHA-256 verified')
        return
    request = urllib.request.Request(args.url, headers={'Range': 'bytes=0-0', 'Accept-Encoding': 'identity'})
    with urllib.request.urlopen(request, timeout=30) as response:
        match = re.fullmatch(r'bytes 0-0/(\d+)', response.headers.get('Content-Range', ''))
        if response.status != 206 or not match:
            raise ValueError('server did not honor range probe')
        total = int(match.group(1))
        if not 0 < total < 1024 * 1024 * 1024:
            raise ValueError('unexpected artifact size')
    chunk_size = 8 * 1024 * 1024
    parts = output.with_name(output.name + '.parts')
    parts.mkdir(exist_ok=True)
    manifest = {'url': args.url, 'sha256': expected, 'bytes': total, 'chunk_bytes': chunk_size}
    manifest_path = parts / 'identity.json'
    if manifest_path.exists():
        if json.loads(manifest_path.read_text()) != manifest:
            raise ValueError('partial download identity differs')
    else:
        manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    count = (total + chunk_size - 1) // chunk_size

    def fetch(index):
        start = index * chunk_size
        end = min(start + chunk_size, total) - 1
        expected_size = end - start + 1
        part = parts / f'{index:04d}.part'
        if part.exists() and part.stat().st_size == expected_size:
            return index
        failure = None
        for attempt in range(3):
            try:
                request = urllib.request.Request(args.url, headers={
                    'Range': f'bytes={start}-{end}', 'Accept-Encoding': 'identity'})
                with urllib.request.urlopen(request, timeout=90) as response:
                    if response.status != 206 or response.headers.get('Content-Range') != f'bytes {start}-{end}/{total}':
                        raise ValueError('range identity mismatch')
                    data = response.read(expected_size + 1)
                if len(data) != expected_size:
                    raise ValueError('incomplete artifact range')
                temp = part.with_suffix('.tmp')
                temp.write_bytes(data)
                os.replace(temp, part)
                return index
            except Exception as error:
                failure = error
                time.sleep(attempt + 1)
        raise RuntimeError(f'range {index} failed: {type(failure).__name__}')

    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = [pool.submit(fetch, index) for index in range(count)]
        done = 0
        for job in as_completed(jobs):
            job.result()
            done += 1
            if done % 4 == 0 or done == count:
                print(json.dumps({'ranges_complete': done, 'ranges_total': count}), flush=True)
    stage = output.with_suffix(output.suffix + '.verified-stage')
    digest = hashlib.sha256()
    with stage.open('xb') as handle:
        for index in range(count):
            data = (parts / f'{index:04d}.part').read_bytes()
            digest.update(data)
            handle.write(data)
    if stage.stat().st_size != total or digest.hexdigest() != expected:
        raise ValueError('publisher SHA-256 mismatch; retained stage, not installed')
    # Exclusive publication avoids replacing another caller's output.
    os.link(stage, output)
    stage.unlink()
    print(json.dumps({'sha256_verified': expected, 'bytes': total, 'path': str(output)}), flush=True)


if __name__ == '__main__':
    main()
