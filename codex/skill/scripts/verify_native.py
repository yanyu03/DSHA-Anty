"""Qualify one owned synthetic PE64 through a single real REA/Ghidra MCP session."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time

from mcp_client import Mcp


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if output.exists():
        raise SystemExit('Refusing existing verification output')
    output.mkdir(parents=True)
    fixture = output / 'synthetic-win64.exe'
    subprocess.run([sys.executable, str(Path(__file__).with_name('make_smoke_pe.py')), '--output', str(fixture)], check=True)
    before = hashlib.sha256(fixture.read_bytes()).hexdigest()
    results = []
    client = None
    started = time.monotonic()

    def invoke(name, arguments=None):
        response = client.tool(name, arguments)
        (output / (name + '.json')).write_text(json.dumps(response, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        if response.get('isError'):
            raise RuntimeError(f'{name} failed; see recorded response')
        data = response.get('structuredContent')
        if data is None:
            text = next((x['text'] for x in response.get('content', []) if x.get('type') == 'text'), '{}')
            data = json.loads(text)
        results.append({'tool': name, 'evidence_id': data.get('evidence_id'), 'response_saved': True})
        print(json.dumps({'tool': name, 'result': data.get('normalized_result', data)}, ensure_ascii=False)[:3200], flush=True)
        return data

    status = 'FAILED'
    closed = False
    try:
        client = Mcp(timeout=240, log_path=output / 'mcp.stderr.log')
        invoke('inspect_pe_resources', {'path': str(fixture)})
        invoke('open_binary', {'path': str(fixture), 'provider_id': 'ghidra'})
        invoke('binary_session')
        invoke('binary_overview')
        invoke('procedure_pseudo_code', {'procedure': '0x140001000'})
        invoke('procedure_assembly', {'procedure': '0x140001000'})
        invoke('export_evidence_bundle', {'path': str(output / 'evidence-bundle.json')})
        invoke('close_binary')
        closed = True
        status = 'OPERATIONS_COMPLETED_SEMANTICS_REVIEW_REQUIRED'
    finally:
        if client:
            if not closed:
                try:
                    invoke('close_binary')
                    closed = True
                except Exception:
                    pass
            client.close()
        after = hashlib.sha256(fixture.read_bytes()).hexdigest()
        result = {'status': status, 'fixture_sha256_before': before, 'fixture_sha256_after': after,
                  'target_unchanged': before == after, 'sample_executed': False,
                  'session_close_operation_completed': closed, 'operations': results,
                  'elapsed_seconds': round(time.monotonic() - started, 3),
                  'scope': 'one synthetic PE64; not arbitrary Office binaries or other providers'}
        (output / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(result, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
