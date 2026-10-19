"""DSHA's Codex adapter: environment inspection, original selftests and REA CLI."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import shutil
import tempfile

SKILL = Path(__file__).resolve().parents[1]
CODEX_HOME = Path(os.environ.get('CODEX_HOME', Path.home() / '.codex'))
HOST = Path(os.environ.get('DSHA_HOST_CONFIG', CODEX_HOME / 'tools/dsha/host.json'))


def host(path=None):
    config = json.loads(Path(path or HOST).read_text(encoding='utf-8'))
    if not isinstance(config, dict) or not isinstance(config.get('env'), dict):
        raise ValueError('invalid host configuration')
    if any(not isinstance(config.get(key), str) or not config[key] for key in ('python', 'node', 'rea_entry', 'dsha_source')):
        raise ValueError('missing host runtime configuration')
    if any(not isinstance(key, str) or not isinstance(value, str) for key, value in config['env'].items()):
        raise ValueError('invalid host environment')
    for key, variable in [('node', 'DSHA_NODE'), ('python', 'DSHA_PYTHON'), ('rea_entry', 'DSHA_REA_ENTRY')]:
        if variable in os.environ:
            config[key] = os.environ[variable]
    return config


def environment(config):
    env = os.environ.copy()
    env.update({key: os.environ.get(key, value) for key, value in config['env'].items()})
    env['DSHA_PYTHON'] = config.get('python') or sys.executable
    env['PYTHONUTF8'] = '1'
    env['PYTHONIOENCODING'] = 'utf-8'
    env['PATH'] = str(Path(env['JAVA_HOME']) / 'bin') + os.pathsep + env.get('PATH', '')
    return env


def verify_sources(config):
    manifest = json.loads((SKILL / 'references/source-manifest.json').read_text(encoding='utf-8'))
    source = Path(config['dsha_source'])
    failed = []
    for name, expected in manifest['source_sha256'].items():
        path = (source / name).resolve()
        if not path.is_relative_to(source.resolve()) or not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            failed.append(name)
    return {'files': len(manifest['source_sha256']), 'mismatches': failed}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host-config', type=Path, help='Private host configuration; takes precedence over DSHA_HOST_CONFIG')
    parser.add_argument('action', choices=['status', 'selftest', 'englock', 'rea', 'verify-source', 'catalog', 'route'])
    parser.add_argument('args', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    config = host(args.host_config) if args.host_config else host()
    env = environment(config)
    scripts = Path(config['dsha_source']) / 'plugins/dsh-permissions/scripts'
    identity = verify_sources(config)
    if identity['mismatches'] and args.action != 'verify-source':
        print(json.dumps({'status': 'REFUSED', 'source_identity': identity}, ensure_ascii=False))
        return 1
    if args.action == 'verify-source':
        result = verify_sources(config)
        print(json.dumps(result, ensure_ascii=False))
        return 1 if result['mismatches'] else 0
    if args.action == 'status':
        checks = {name: Path(config[name]).is_file() for name in ['node', 'python', 'rea_entry']}
        checks['java'] = (Path(env['JAVA_HOME']) / 'bin/java.exe').is_file()
        checks['ghidra'] = (Path(env['GHIDRA_INSTALL_DIR']) / 'support/analyzeHeadless.bat').is_file()
        result = {'dsha_version': config['dsha_version'], 'rea_version': config['rea_version'],
                  'source_commit': config.get('source_commit'), 'adapter_version': config.get('adapter_version'),
                  'checks': checks, 'source_identity': verify_sources(config),
                  'mcp_server': config.get('mcp_server', 'rea'), 'codex_permissions_modified': False,
                  'provider_readiness': 'use real MCP/provider verification; file presence alone is insufficient'}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if all(checks.values()) and not result['source_identity']['mismatches'] else 1
    if args.action == 'selftest':
        codes = []
        # The original README's gate.py --selftest is stale: gate.py ignores
        # that flag. Its real harness is selftest.py and rewrites tier.json.
        # Run that harness in an isolated owned copy, never in a live plugin.
        test_root = (args.host_config or HOST).resolve().parent / 'verification/selftests'
        test_root.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix='gate-', dir=test_root) as name:
            target = Path(name).resolve()
            if not target.is_relative_to(test_root.resolve()):
                raise ValueError('selftest directory escapes installation')
            shutil.copytree(scripts.parent, target / 'plugin')
            codes.append(subprocess.run([config['python'], str(target / 'plugin/scripts/selftest.py')], env=env).returncode)
        codes.append(subprocess.run([config['python'], str(scripts / 'englock.py'), 'selftest'], env=env).returncode)
        for name in ('base_tool.py', 'router.py'):
            codes.append(subprocess.run([config['python'], str(Path(config['dsha_source']) / 'scripts' / name), 'selftest'], env=env).returncode)
        return 1 if any(codes) else 0
    if args.action == 'catalog':
        return subprocess.run([config['python'], str(Path(config['dsha_source']) / 'scripts/base_tool.py'), 'list', *args.args], env=env).returncode
    if args.action == 'route':
        return subprocess.run([config['python'], str(Path(config['dsha_source']) / 'scripts/router.py'), 'route', *args.args], env=env).returncode
    if args.action == 'englock':
        return subprocess.run([config['python'], str(scripts / 'englock.py'), *(args.args or ['status'])], env=env).returncode
    return subprocess.run([config['node'], config['rea_entry'], *args.args], env=env).returncode


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, TypeError) as error:
        # Configurations are private: do not echo paths, values or tracebacks.
        print(json.dumps({'status': 'REFUSED', 'error': type(error).__name__,
                          'message': 'Check host configuration, source manifest and runtime availability.'}), file=sys.stderr)
        sys.exit(2)
