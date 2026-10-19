"""Discover configured development tools and probe owned fixtures, without publishing paths."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import tempfile

from dsha_env import find_binary, machine_environment

TOOLS = {name: ['--version'] for name in (
    'python', 'node', 'npm', 'npx', 'git', 'gh', 'pwsh', 'bash', 'sh',
    'rustc', 'cargo', 'rustup', 'dotnet', 'cmake', 'ninja', 'go',
    'gcc', 'clang', 'make', 'docker', 'sqlite3', 'uv')}
TOOLS.update(java=['-version'], javac=['-version'], adb=['version'],
             msbuild=['-version', '-nologo'], cl=['/Bv'])
SDK_VARIABLES = ('JAVA_HOME', 'CARGO_HOME', 'RUSTUP_HOME', 'DOTNET_ROOT',
                 'ANDROID_SDK_ROOT', 'ANDROID_HOME', 'VSINSTALLDIR', 'VCToolsInstallDir')
BRANDS = {'python': r'^Python\s', 'node': r'^v\d', 'git': r'^git version\s',
          'gh': r'^gh version\s', 'pwsh': r'^PowerShell\s', 'bash': r'GNU bash',
          'sh': r'GNU bash|\bsh\b', 'rustc': r'^rustc\s', 'cargo': r'^cargo\s',
          'rustup': r'^rustup\s', 'java': r'openjdk|java version', 'javac': r'^javac\s',
          'cmake': r'^cmake version\s', 'clang': r'clang version', 'go': r'^go version\s',
          'cl': r'C/C\+\+', 'docker': r'^Docker version', 'adb': r'Android Debug Bridge'}


def source_of(name, path, overrides):
    if name in overrides:
        return 'parameter'
    if 'DSHA_' + name.upper() in os.environ:
        return 'environment:DSHA_' + name.upper()
    if not path:
        return 'not-discovered'
    located = shutil.which(name)
    if located and path and Path(located).resolve() == Path(path).resolve():
        return 'PATH'
    return 'SDK/environment-derived-location'


def version_probe(name, executable, environ=None):
    try:
        result = subprocess.run([executable, *TOOLS[name]], capture_output=True,
                                encoding='utf-8', errors='replace', timeout=10, env=environ)
    except (OSError, subprocess.TimeoutExpired) as error:
        return {'status': 'FAIL', 'error': type(error).__name__}
    # Never publish untrusted raw version output (it can contain private paths).
    output = result.stdout + '\n' + result.stderr
    version = re.search(r'(?<![\w.])(?:go|v)?(\d+\.\d+(?:\.\d+)?(?:\.\d+)?(?:[-+][\w.]+)?)', output)
    acceptable = result.returncode in ((0, 2) if name == 'cl' else (0,))
    identity = name not in BRANDS or bool(re.search(BRANDS[name], output, re.MULTILINE | re.IGNORECASE))
    return {'status': 'PASS' if acceptable and version and identity else 'FAIL',
            'identity_check': 'brand-and-version' if name in BRANDS else 'version-format-only',
            'version': version.group(1) if version else None, 'exit_code': result.returncode}


def command_ok(command, cwd, marker=False, environ=None):
    result = subprocess.run(command, cwd=cwd, capture_output=True,
                            encoding='utf-8', errors='replace', timeout=45, env=environ)
    expected = 'DSHA_SMOKE_OK' if marker is True else marker
    return result.returncode == 0 and (not marker or result.stdout.strip() == expected)


def fixture_probe(name, executables, environ=None):
    if not executables.get(name):
        return {'status': 'NOT_RUN', 'reason': 'required executable not discovered'}
    try:
        with tempfile.TemporaryDirectory(prefix='dsha smoke ') as folder:
            root = Path(folder)
            executable = executables[name]
            nonce = secrets.token_hex(16)
            left, right = secrets.randbelow(9000) + 1000, secrets.randbelow(9000) + 1000
            prefix = 'DSHA_SMOKE_' + nonce + '_'
            expected = prefix + str(left * right)
            if name == 'python':
                program = f'print({prefix!r} + str({left} * {right}))'
                passed = command_ok([executable, '-c', program], root, expected, environ)
            elif name == 'node':
                program = f'console.log({prefix!r} + ({left} * {right}))'
                passed = command_ok([executable, '-e', program], root, expected, environ)
            elif name == 'rustc':
                source = root / 'main.rs'
                source.write_text(f'fn main() {{ println!("{prefix}{{}}", {left} * {right}); }}', encoding='utf-8')
                binary = root / ('smoke.exe' if os.name == 'nt' else 'smoke')
                passed = command_ok([executable, str(source), '-o', str(binary)], root, environ=environ) and command_ok([str(binary)], root, expected, environ)
            elif name == 'java':
                if not executables.get('javac'):
                    return {'status': 'NOT_RUN', 'reason': 'javac not discovered'}
                source = root / 'DshaSmoke.java'
                source.write_text(f'class DshaSmoke {{ public static void main(String[] args) {{ System.out.println("{prefix}" + ({left} * {right})); }} }}', encoding='utf-8')
                passed = command_ok([executables['javac'], str(source)], root, environ=environ) and command_ok([executable, '-cp', str(root), 'DshaSmoke'], root, expected, environ)
            elif name == 'cl':
                source = root / 'smoke.c'
                source.write_text(f'int dsha_smoke_{nonce}(void) {{ return {left} * {right}; }}', encoding='utf-8')
                obj = root / 'smoke.obj'
                passed = command_ok([executable, '/nologo', '/c', str(source), '/Fo' + str(obj)], root, environ=environ) and obj.is_file()
                if passed:
                    import struct
                    with obj.open('rb') as stream:
                        header = stream.read(20)
                    machine, sections = struct.unpack('<HH', header[:4]) if len(header) == 20 else (0, 0)
                    passed = machine in (0x8664, 0x14c, 0xAA64) and sections > 0 and obj.stat().st_size >= 20 + sections * 40
                return {'status': 'PASS' if passed else 'FAIL', 'sample': 'owned C file compiled to object; link NOT_RUN'}
            elif name == 'pwsh':
                program = f"Write-Output ('{prefix}' + ({left} * {right}))"
                passed = command_ok([executable, '-NoProfile', '-NonInteractive', '-Command', program], root, expected, environ)
            elif name in ('bash', 'sh'):
                program = f"printf '%s%s\\n' '{prefix}' $(({left} * {right}))"
                passed = command_ok([executable, '-c', program], root, expected, environ)
            else:
                return {'status': 'NOT_RUN', 'reason': 'no fixture defined'}
            return {'status': 'PASS' if passed else 'FAIL', 'sample': 'owned minimal program'}
    except (OSError, subprocess.TimeoutExpired) as error:
        return {'status': 'FAIL', 'error': type(error).__name__}


def discover_visual_studio(environ=None):
    env = os.environ if environ is None else environ
    if env.get('VSINSTALLDIR'):
        return 'environment'
    discovery_env = machine_environment(env)
    program_files = discovery_env.get('PROGRAMFILES(X86)' if os.name == 'nt' else 'ProgramFiles(x86)')
    if not program_files:
        return 'NOT_DISCOVERED'
    helper = Path(program_files) / 'Microsoft Visual Studio/Installer/vswhere.exe'
    if not helper.is_file():
        return 'NOT_DISCOVERED'
    try:
        result = subprocess.run([str(helper), '-latest', '-products', '*', '-requires',
                                 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-property', 'installationPath'],
                                capture_output=True, encoding='utf-8', errors='replace', timeout=10, env=discovery_env)
        root = result.stdout.strip()
        if result.returncode == 0 and root and Path(root).is_dir():
            if environ is not None:
                env.update(discovery_env)
            env['VSINSTALLDIR'] = root
            return 'vswhere'
    except (OSError, subprocess.TimeoutExpired):
        pass
    return 'NOT_DISCOVERED'


def activate_msvc_sdk(environ, target='x64', host='x64'):
    """Import selected installed SDK variables from an owned child cmd session."""
    if os.name != 'nt' or target not in ('x64', 'x86', 'arm64') or host not in ('x64', 'x86', 'arm64'):
        return {'status': 'FAIL', 'reason': 'unsupported SDK activation profile'}
    root = environ.get('VSINSTALLDIR')
    system = environ.get('SYSTEMROOT') or environ.get('WINDIR')
    if not root or not system:
        return {'status': 'FAIL', 'reason': 'installed SDK or system command runtime not located'}
    script = Path(root) / 'Common7/Tools/VsDevCmd.bat'
    vc_script = Path(root) / 'Common7/Tools/vsdevcmd/ext/vcvars.bat'
    command = Path(system) / 'System32/cmd.exe'
    if not script.is_file() or not vc_script.is_file() or not command.is_file():
        return {'status': 'FAIL', 'reason': 'SDK activation entry missing'}
    if any(character in str(script) + str(command) for character in ('"', '%', '!', '&', '|', '<', '>', '^', '\r', '\n')):
        return {'status': 'FAIL', 'reason': 'unsupported SDK command path syntax'}
    try:
        # Only core SDK + VC are required; unrelated optional VS extensions can fail.
        invocation = f'call "{script}" -no_logo -no_ext -arch={target} -host_arch={host} >nul && call "{vc_script}" >nul && set'
        command_env = dict(environ)
        command_env['VSINSTALLDIR'] = str(Path(root)) + os.sep
        system_root = Path(system)
        bootstrap = [system_root / 'System32', system_root, system_root / 'System32/Wbem',
                     system_root / 'System32/WindowsPowerShell/v1.0']
        command_env['PATH'] = os.pathsep.join([str(path) for path in bootstrap if path.is_dir()] + [environ.get('PATH', '')])
        # cmd uses its own quoting grammar; list2cmdline's backslash quotes are wrong here.
        command_line = f'"{command}" /d /u /s /c "{invocation}"'
        result = subprocess.run(command_line,
                                env=command_env, capture_output=True, encoding='utf-16le', errors='replace', timeout=20)
        if result.returncode:
            return {'status': 'FAIL', 'reason': 'SDK activation command failed', 'exit_code': result.returncode}
        allowed = {'PATH', 'INCLUDE', 'LIB', 'LIBPATH', 'VCTOOLSINSTALLDIR', 'WINDOWSSDKDIR',
                   'WINDOWSSDKVERSION', 'UNIVERSALCRTSDKDIR', 'UCRTVERSION'}
        selected = {}
        for line in result.stdout.splitlines():
            key, separator, value = line.partition('=')
            if separator and key.upper() in allowed:
                selected[key.upper()] = value
        if not all(selected.get(name) for name in ('PATH', 'INCLUDE', 'LIB')):
            return {'status': 'FAIL', 'reason': 'SDK activation incomplete'}
        linker = shutil.which('link.exe', path=selected['PATH'])
        if not linker or not Path(linker).resolve().is_relative_to(Path(root).resolve()):
            return {'status': 'FAIL', 'reason': 'SDK linker identity/location not established'}
        environ.update(selected)
        return {'status': 'PASS', 'scope': 'child mapping only', 'variable_names': sorted(selected), 'linker_located': True}
    except (OSError, subprocess.TimeoutExpired) as error:
        return {'status': 'FAIL', 'error': type(error).__name__}


def inventory(names, overrides, smoke=False):
    previous = os.environ.get('VSINSTALLDIR')
    try:
        return _inventory(names, overrides, smoke, discover_visual_studio())
    finally:
        if previous is None:
            os.environ.pop('VSINSTALLDIR', None)
        else:
            os.environ['VSINSTALLDIR'] = previous


def _inventory(names, overrides, smoke, vs_source):
    executables = {}
    tools = []
    for name in names:
        executable = find_binary(name, explicit=overrides.get(name))
        configured = name in overrides or 'DSHA_' + name.upper() in os.environ
        record = {'tool': name, 'source': source_of(name, executable, overrides)}
        if executable:
            record.update(version_probe(name, executable))
            if record['status'] == 'PASS':
                executables[name] = executable
        else:
            record['status'] = 'INVALID_OVERRIDE' if configured else 'NOT_DISCOVERED'
        tools.append(record)
    fixtures = {name: fixture_probe(name, executables) for name in ('python', 'node', 'rustc', 'java', 'cl')} if smoke else {}
    public = {'schema': 1, 'time_utc': datetime.now(timezone.utc).isoformat(),
              'scope': 'whitelisted tool version probes; absence means not discovered, not proven uninstalled',
              'sdk_variables_present': [name for name in SDK_VARIABLES if os.environ.get(name)],
              'visual_studio_discovery': vs_source,
              'tools': tools, 'summary': dict(Counter(item['status'] for item in tools)), 'fixtures': fixtures}
    return public, executables


class PrivateParser(argparse.ArgumentParser):
    def error(self, message):
        self.exit(2, 'Invalid inventory arguments; use --help. Values omitted.\n')


def apply_env_file(path, environ=None):
    """Explicit allowlisted KEY=VALUE file; no interpolation or shell evaluation."""
    env = os.environ if environ is None else environ
    allowed = set(SDK_VARIABLES) | {'DSHA_' + name.upper() for name in TOOLS} | {'DSHA_PROJECT_ROOT'}
    values = {}
    for line in path.read_text(encoding='utf-8-sig').splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        key, separator, value = line.partition('=')
        key, value = key.strip(), value.strip()
        if not separator or key not in allowed or key in values:
            raise ValueError('invalid environment file')
        if value[:1] in ('"', "'"):
            if len(value) < 2 or value[-1] != value[0]:
                raise ValueError('unclosed environment value')
            value = value[1:-1]
        values[key] = value
    applied = []
    for key, value in values.items():
        if key not in env:
            env[key] = value
            applied.append(key)
    return applied


def main():
    parser = PrivateParser(description=__doc__)
    parser.add_argument('--tool', action='append', choices=tuple(TOOLS), help='Repeat to select tools; defaults to all')
    parser.add_argument('--binary', action='append', default=[], metavar='TOOL=PATH', help='Explicit executable, ahead of DSHA_* and discovery')
    parser.add_argument('--smoke', action='store_true', help='Run owned Python/Node/Rust/Java fixtures')
    parser.add_argument('--env-file', type=Path, help='Explicit allowlisted KEY=VALUE file; existing process environment wins')
    parser.add_argument('--private-output', type=Path, help='Exclusive new private *.local.json inventory with resolved paths')
    args = parser.parse_args()
    try:
        overrides = {}
        for value in args.binary:
            name, separator, path = value.partition('=')
            if not separator or name not in TOOLS or not path or name in overrides:
                raise ValueError('invalid executable override')
            overrides[name] = path
        if args.private_output and not args.private_output.name.endswith('.local.json'):
            raise ValueError('private output must use ignored suffix')
        if args.private_output and args.private_output.exists():
            raise FileExistsError('private inventory already exists')
        applied = apply_env_file(args.env_file) if args.env_file else []
        public, executables = inventory(args.tool or list(TOOLS), overrides, args.smoke)
        public['env_file_applied_names'] = applied
        if args.private_output:
            with args.private_output.open('x', encoding='utf-8') as stream:
                json.dump({'report': public, 'resolved_executables': executables}, stream, indent=2)
        print(json.dumps(public, ensure_ascii=False, indent=2))
        failed = any(item['status'] in ('FAIL', 'INVALID_OVERRIDE') for item in public['tools'])
        failed |= any(item['status'] == 'FAIL' for item in public['fixtures'].values())
        return 1 if failed else 0
    except (OSError, ValueError) as error:
        print(json.dumps({'status': 'REFUSED', 'error': type(error).__name__, 'message': 'Check configuration or private output; values omitted.'}))
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
