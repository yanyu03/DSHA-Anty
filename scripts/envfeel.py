"""EnvFeel: runtime facts -> required tools -> child environment -> health -> execution."""
import json
import os
from pathlib import Path
import platform
import re
import struct
import subprocess
import copy

from dsha_env import find_binary, normalize_environment, machine_environment
from project_probe import CAPABILITIES, probe_frontend
from refusal import halt


def detect_architecture():
    if os.name != 'nt':
        return os.uname().machine.lower(), 'uname'
    # Avoid platform.machine()'s Windows environment fallback when WMI fails.
    try:
        import ctypes
        from ctypes import wintypes
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        current = kernel.GetCurrentProcess
        current.argtypes, current.restype = [], wintypes.HANDLE
        query = kernel.IsWow64Process2
        query.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.WORD), ctypes.POINTER(wintypes.WORD)]
        query.restype = wintypes.BOOL
        process, native = wintypes.WORD(), wintypes.WORD()
        if query(current(), ctypes.byref(process), ctypes.byref(native)):
            return {0x8664: 'amd64', 0xAA64: 'arm64', 0x14c: 'x86'}.get(native.value, 'unrecognized'), 'windows-native-api'
    except (OSError, AttributeError):
        pass
    return 'unrecognized', 'native-query-unavailable'


def runtime_context():
    system = platform.system()
    machine, architecture_source = detect_architecture()
    families = {'Windows': 'nt', 'Linux': 'posix', 'Darwin': 'posix'}
    architectures = {'amd64': 'x86_64', 'x86_64': 'x86_64', 'arm64': 'arm64',
                     'aarch64': 'arm64', 'x86': 'x86', 'i386': 'x86', 'i686': 'x86'}
    supported = system in families and families[system] == os.name and machine in architectures
    return {'status': 'PASS' if supported else 'REFUSED',
            'os': system if system in families else 'unrecognized',
            'architecture_reported': architectures.get(machine, 'unrecognized'),
            'architecture_source': architecture_source,
            'process_bits': struct.calcsize('P') * 8,
            'scope': 'runtime-reported facts, not hardware attestation',
            'reason': None if supported else 'unsupported runtime OS/architecture combination'}


def activate_environment(executables, environ=None):
    """Prepare a private mapping; never mutate caller/system environment."""
    result = normalize_environment(environ)
    directories = []
    for name, executable in executables.items():
        path = Path(executable).resolve(strict=True)
        if not path.is_file():
            raise ValueError('executable is not a file')
        result['DSHA_' + name.upper()] = str(path)
        parent = str(path.parent)
        if parent not in directories:
            directories.append(parent)
        if name == 'java' and path.parent.name.lower() == 'bin':
            result['JAVA_HOME'] = str(path.parent.parent)
    result['PATH'] = os.pathsep.join(directories + [result.get('PATH', '')])
    result['PYTHONUTF8'] = '1'
    result['PYTHONIOENCODING'] = 'utf-8'
    return result


class EnvFeel:
    def __init__(self, required, overrides=None, environ=None, env_file=None, project=None):
        self.required = list(dict.fromkeys(required))
        self.overrides = dict(overrides or {})
        self.base_env = dict(os.environ if environ is None else environ)
        self.env_file = env_file
        self.project = project
        self.project_evidence = []
        self.project_root = None
        self.executables = {}
        self.environment = {}
        self._stopped = None

    def _stop(self, report):
        self._stopped = halt(report)
        self.executables = {}
        self.environment = {}
        self.project_root = None
        return copy.deepcopy(self._stopped)

    def check(self):
        if self._stopped is not None:
            return copy.deepcopy(self._stopped)
        try:
            report = self._check()
            return self._stop(report) if report['status'] == 'REFUSED' else report
        except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
            self.executables = {}
            self.environment = {}
            self.project_evidence = []
            self.project_root = None
            return self._stop({'status': 'REFUSED', 'error': type(error).__name__,
                               'reason':'PROBE_TIMEOUT' if isinstance(error,subprocess.TimeoutExpired) else 'configuration check failed',
                               'task': {'status': 'NOT_RUN'}})

    def _check(self):
        from environment_smoke import TOOLS, apply_env_file, discover_visual_studio, version_probe, fixture_probe, activate_msvc_sdk
        context = runtime_context()
        report = {'status': 'REFUSED', 'context': context, 'tools': [], 'health': {}, 'task': {'status': 'NOT_RUN'}}
        self.executables = {}
        self.environment = {}
        self.project_evidence = []
        self.project_root = None
        if context['status'] != 'PASS':
            return report
        capabilities = [name for name in self.required if name in CAPABILITIES]
        tools = [name for name in self.required if name in TOOLS]
        if capabilities and 'node' not in tools:
            tools.append('node')
        if not self.required or any(name not in TOOLS and name not in CAPABILITIES for name in self.required) or any(name not in tools for name in self.overrides):
            report['reason'] = 'undeclared or unsupported requirement'
            return report
        env = machine_environment(self.base_env)
        report['env_file_applied_names'] = apply_env_file(self.env_file, env) if self.env_file else []
        selected_project = self.project if self.project is not None else env.get('DSHA_PROJECT_ROOT')
        if capabilities:
            root = Path(selected_project) if isinstance(selected_project, (str, os.PathLike)) and str(selected_project) else None
            if root is None or not root.is_absolute() or not root.is_dir() or not (root/'package.json').is_file():
                report['capabilities'] = [{'capability':capabilities[0], 'status':'FAIL', 'reason':'PROJECT_REQUIRED'}]
                report['capabilities'].extend({'capability':c, 'status':'NOT_RUN', 'reason':'EARLIER_REQUIREMENT_FAILED'} for c in capabilities[1:])
                return report
        report['visual_studio_discovery'] = discover_visual_studio(env) if set(self.required) & {'cl', 'cmake', 'msbuild', 'ninja'} else 'NOT_RUN'
        names = list(tools)
        dependencies = {'java': ('javac',), 'javac': ('java',), 'cargo': ('rustc',)}
        for name in tools:
            names.extend(dep for dep in dependencies.get(name, ()) if dep not in names)
        for name in names:
            path = find_binary(name, explicit=self.overrides.get(name), environ=env)
            configured = name in self.overrides or 'DSHA_' + name.upper() in env
            record = {'tool': name, 'located': bool(path), 'source': 'parameter' if name in self.overrides else ('environment' if 'DSHA_' + name.upper() in env else 'PATH/SDK')}
            report['tools'].append(record)
            if not path:
                record['status'] = 'INVALID_OVERRIDE' if configured else 'NOT_DISCOVERED'
                report['reason'] = 'required tool location failed'
                return report
            else:
                record['status'] = 'LOCATED'
                self.executables[name] = str(Path(path).resolve())
        if any(record['status'] != 'LOCATED' for record in report['tools']):
            report['reason'] = 'required tool location failed'
            return report
        self.environment = activate_environment(self.executables, env)
        if capabilities:
            for key in list(self.environment):
                if key.upper() in ('NODE_OPTIONS', 'NODE_PATH'):
                    del self.environment[key]
        report['activation'] = {'status': 'PREPARED', 'scope': 'child mapping only',
                                'variable_names': ['PATH', 'PYTHONUTF8', 'PYTHONIOENCODING', *['DSHA_' + name.upper() for name in names], *(['JAVA_HOME'] if 'java' in names else [])]}
        for record in report['tools']:
            record.update(version_probe(record['tool'], self.executables[record['tool']], self.environment))
            if record['status'] == 'PASS' and record.get('identity_check') == 'version-format-only':
                record['status'] = 'INSUFFICIENT_CONTRACT'
            if record['status'] != 'PASS':
                report['reason'] = 'required tool launch/version/identity contract failed'
                return report
        if any(record['status'] != 'PASS' for record in report['tools']):
            report['reason'] = 'required tool launch/version/identity contract failed'
            return report
        sdk_required = os.name == 'nt' and 'cl' in self.executables
        if os.name == 'nt' and set(self.executables) & {'rustc', 'cl'}:
            profile = {'x86_64': 'x64', 'x86': 'x86', 'arm64': 'arm64'}.get(context['architecture_reported'])
            host = profile
        if os.name == 'nt' and 'rustc' in self.executables:
            host_info = subprocess.run([self.executables['rustc'], '-vV'], env=self.environment,
                                       capture_output=True, encoding='utf-8', errors='replace', timeout=10)
            target = re.search(r'^host:\s*(\S+)', host_info.stdout, re.MULTILINE)
            if host_info.returncode or not target:
                report['reason'] = 'Rust host target contract unavailable'
                return report
            if target.group(1).endswith('-pc-windows-msvc'):
                sdk_required = True
                profile = {'x86_64': 'x64', 'i686': 'x86', 'aarch64': 'arm64'}.get(target.group(1).split('-')[0])
        if sdk_required:
            report['visual_studio_discovery'] = discover_visual_studio(self.environment)
            report['sdk_activation'] = activate_msvc_sdk(self.environment, profile, host)
            if report['sdk_activation']['status'] != 'PASS':
                report['reason'] = 'required MSVC linker/SDK activation failed'
                return report
            self.environment = activate_environment(self.executables, self.environment)
        for name in names:
            if name in ('python', 'node', 'rustc', 'java', 'cl', 'pwsh', 'bash', 'sh'):
                report['health'][name] = fixture_probe(name, self.executables, self.environment)
                if report['health'][name]['status'] != 'PASS':
                    report['reason'] = 'required health check failed'
                    return report
        if any(value['status'] != 'PASS' for value in report['health'].values()):
            report['reason'] = 'required health check failed'
            return report
        if capabilities:
            report['capabilities'], self.project_evidence = probe_frontend(
                self.executables['node'], selected_project, capabilities, self.environment)
            if any(item['status'] != 'PASS' for item in report['capabilities']):
                report['reason'] = 'required project capability did not reply correctly'
                return report
            self.project_root = str(Path(selected_project).resolve())
            self.environment['DSHA_PROJECT_ROOT'] = self.project_root
        report['status'] = 'READY'
        report['scope'] = 'declared requirements only; version probes plus listed owned health checks'
        return report

    def execute(self, tool, arguments, timeout=60):
        if self._stopped is not None:
            return copy.deepcopy(self._stopped), {}
        allowed = (tool in self.required and tool not in CAPABILITIES) or (tool == 'node' and any(c in self.required for c in CAPABILITIES))
        if not allowed:
            return self._stop({'reason':'execution tool not declared'}), {}
        if type(timeout) is not int or timeout <= 0 or not isinstance(arguments,(list,tuple)) or any(not isinstance(a,str) for a in arguments):
            return self._stop({'reason':'INVALID_ARGUMENTS'}), {}
        # A saved READY report is never an execution ticket; always check again.
        report = self.check()
        allowed = tool in self.required or (tool == 'node' and any(c in self.required for c in CAPABILITIES))
        if report['status'] != 'READY' or not allowed or tool not in self.executables:
            report['status'] = 'REFUSED'
            report.setdefault('reason', 'execution tool not declared')
            return self._stop(report), {}
        try:
            result = subprocess.run([self.executables[tool], *arguments], env=self.environment,
                                    capture_output=True, encoding='utf-8', errors='replace', timeout=timeout,
                                    cwd=self.project_root)
            report['task'] = {'status': 'PASS' if result.returncode == 0 else 'FAIL', 'exit_code': result.returncode}
            report['status'] = 'COMPLETE' if result.returncode == 0 else 'TASK_FAILED'
            return report, {'stdout': result.stdout, 'stderr': result.stderr}
        except (OSError, subprocess.TimeoutExpired) as error:
            report['task'] = {'status': 'FAIL', 'error': type(error).__name__}
            report['status'] = 'TASK_FAILED'
            return report, {}


def main():
    from environment_smoke import TOOLS, PrivateParser
    parser = PrivateParser(description=__doc__)
    parser.add_argument('--require', action='append', choices=(*TOOLS, *CAPABILITIES), default=[])
    parser.add_argument('--project', type=str, help='Explicit absolute project root for required frontend capabilities')
    parser.add_argument('--binary', action='append', default=[])
    parser.add_argument('--env-file', type=Path)
    parser.add_argument('--private-output', type=Path)
    parser.add_argument('--run', choices=tuple(TOOLS))
    parser.add_argument('--timeout', type=int, default=60)
    parser.add_argument('arguments', nargs=__import__('argparse').REMAINDER)
    args = parser.parse_args()
    try:
        overrides = {}
        for value in args.binary:
            name, separator, path = value.partition('=')
            if not separator or name not in TOOLS or not path or name in overrides:
                raise ValueError('invalid override')
            overrides[name] = path
        if args.timeout <= 0:
            raise ValueError('invalid timeout')
        if args.private_output and (not args.private_output.name.endswith('.local.json') or args.private_output.exists()):
            raise ValueError('private output must be a new ignored file')
        gate = EnvFeel(args.require, overrides, env_file=args.env_file, project=args.project)
        arguments = args.arguments[1:] if args.arguments[:1] == ['--'] else args.arguments
        report, output = gate.execute(args.run, arguments, args.timeout) if args.run else (gate.check(), {})
        if args.private_output:
            with args.private_output.open('x', encoding='utf-8') as stream:
                json.dump({'report': report, 'resolved_executables': gate.executables,
                           'project_evidence': gate.project_evidence, 'task_output': output}, stream, indent=2)
        print(json.dumps(report, ensure_ascii=True, indent=2))
        return 0 if report['status'] in ('READY', 'COMPLETE') else 126
    except (OSError, ValueError, RuntimeError) as error:
        print(json.dumps(halt({'status': 'REFUSED', 'error': type(error).__name__, 'task': {'status': 'NOT_RUN'}}),ensure_ascii=True))
        return 126


if __name__ == '__main__':
    raise SystemExit(main())
