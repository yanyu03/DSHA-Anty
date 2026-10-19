"""Host configuration: explicit value > DSHA environment > system discovery.

No config values or subprocess output are included in discovery errors.
"""
import os
import re
from pathlib import Path
import shutil
import sys


def normalize_environment(environ=None):
    result = {}
    for key, value in (os.environ if environ is None else environ).items():
        normalized = key.upper() if os.name == 'nt' else key
        if normalized in result and result[normalized] != value:
            raise ValueError('ambiguous environment keys')
        result[normalized] = value
    return result


def home_directory(environ=None):
    env = normalize_environment(environ)
    value = env.get('USERPROFILE') or env.get('HOME')
    if value:
        path = Path(value)
        return path if path.is_absolute() else None
    # An explicit child mapping must not borrow the parent process's HOME.
    if environ is None:
        try:
            return Path.home()
        except RuntimeError:
            pass
    return None


def machine_environment(environ=None):
    """Fill missing machine folders from native metadata, not parent variables."""
    env = normalize_environment(environ)
    if os.name != 'nt':
        return env
    system = env.get('SYSTEMROOT') or env.get('WINDIR')
    if system and Path(system).is_absolute():
        env.setdefault('SYSTEMDRIVE', Path(system).drive)
    try:
        import winreg
        access = winreg.KEY_READ | winreg.KEY_WOW64_64KEY
        specifications = [
            ('PROGRAMFILES', r'SOFTWARE\Microsoft\Windows\CurrentVersion', 'ProgramFilesDir'),
            ('PROGRAMFILES(X86)', r'SOFTWARE\Microsoft\Windows\CurrentVersion', 'ProgramFilesDir (x86)'),
            ('PROGRAMDATA', r'SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList', 'ProgramData'),
        ]
        for name, registry_key, registry_value in specifications:
            if env.get(name):
                continue
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, registry_key, 0, access) as key:
                    value, kind = winreg.QueryValueEx(key, registry_value)
                if kind not in (winreg.REG_SZ, winreg.REG_EXPAND_SZ) or not isinstance(value, str):
                    continue
                if kind == winreg.REG_EXPAND_SZ and env.get('SYSTEMDRIVE'):
                    value = re.sub(r'(?i)%SystemDrive%', lambda _: env['SYSTEMDRIVE'], value)
                if '%' not in value and Path(value).is_absolute() and Path(value).is_dir():
                    env[name] = value
            except OSError:
                continue
    except ImportError:
        pass
    return env


def config_dir(value=None, environ=None):
    env = normalize_environment(environ)
    configured = value or env.get('DSHA_CONFIG_DIR')
    if configured:
        return Path(configured).expanduser()
    home = home_directory(environ)
    if home is None:
        raise RuntimeError('home directory unavailable; configure DSHA_CONFIG_DIR')
    return home / '.gemini/config'


def optional_path(name, default=None, environ=None):
    env = normalize_environment(environ)
    value = env.get(name.upper() if os.name == 'nt' else name)
    return Path(value).expanduser() if value else default


def find_binary(name, explicit=None, environ=None):
    env = machine_environment(environ)
    override = explicit if explicit is not None else env.get('DSHA_' + name.upper())
    if override is not None:
        # An invalid override must not silently select a different executable.
        candidate = Path(override).expanduser()
        if candidate.is_absolute():
            return str(candidate) if candidate.is_file() else None
        located = shutil.which(str(override), path=env.get('PATH', os.defpath)) if override and not candidate.parent.parts else None
        return located if located and 'windowsapps' not in located.lower() else None
    located = shutil.which(name, path=env.get('PATH', os.defpath))
    if located and 'windowsapps' not in located.lower():
        return located
    home = home_directory(environ)
    local = optional_path('LOCALAPPDATA', home / 'AppData/Local' if home else None, env)
    app = optional_path('APPDATA', home / 'AppData/Roaming' if home else None, env)
    configuration = optional_path('DSHA_CONFIG_DIR', home / '.gemini/config' if home else None, env)
    pf = optional_path('ProgramFiles', environ=env)
    choices = {
        'python': [Path(sys.executable)],
        'node': [local / 'Programs/nodejs/node.exe'] if local else [],
        'wrangler': [app / 'npm/wrangler.cmd', app / 'npm/wrangler'] if app else [],
        'cf': [app / 'npm/cloudflare.cmd', app / 'npm/cf.cmd'] if app else [],
        'cloudflared': ([home / 'bin/cloudflared.exe'] if home else []) + ([configuration / 'bin/cloudflared.exe'] if configuration else []),
        'pwsh': [configuration / 'pwsh/pwsh.exe'] if configuration else [],
        'gh': [],
    }
    cargo_home = optional_path('CARGO_HOME', home / '.cargo' if home else None, environ=env)
    for tool in ('cargo', 'rustc', 'rustup'):
        choices[tool] = [cargo_home / 'bin' / (tool + ('.exe' if os.name == 'nt' else ''))] if cargo_home else []
    java_home = optional_path('JAVA_HOME', environ=env)
    if java_home:
        for tool in ('java', 'javac'):
            choices[tool] = [java_home / 'bin' / (tool + ('.exe' if os.name == 'nt' else ''))]
    dotnet_root = optional_path('DOTNET_ROOT', environ=env)
    if dotnet_root:
        choices['dotnet'] = [dotnet_root / ('dotnet.exe' if os.name == 'nt' else 'dotnet')]
    android_root = optional_path('ANDROID_SDK_ROOT', environ=env) or optional_path('ANDROID_HOME', environ=env)
    if android_root:
        choices['adb'] = [android_root / 'platform-tools' / ('adb.exe' if os.name == 'nt' else 'adb')]
    for tool in ('npm', 'npx'):
        choices[tool] = [app / 'npm' / (tool + '.cmd')] if app else []
    vs_root = optional_path('VSINSTALLDIR', environ=env)
    if vs_root:
        choices['msbuild'] = [vs_root / 'MSBuild/Current/Bin/MSBuild.exe']
        choices.setdefault('cmake', []).append(vs_root / 'Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe')
        choices['ninja'] = [vs_root / 'Common7/IDE/CommonExtensions/Microsoft/CMake/Ninja/ninja.exe']
        version_file = vs_root / 'VC/Auxiliary/Build/Microsoft.VCToolsVersion.default.txt'
        try:
            version = version_file.read_text(encoding='utf-8-sig').strip()
            if re.fullmatch(r'\d+(?:\.\d+)+', version):
                choices['cl'] = [vs_root / 'VC/Tools/MSVC' / version / 'bin/Hostx64/x64/cl.exe']
        except (OSError, UnicodeError):
            pass
    vc_tools = optional_path('VCToolsInstallDir', environ=env)
    if vc_tools:
        choices['cl'] = [vc_tools / 'bin/Hostx64/x64/cl.exe', *choices.get('cl', [])]
    if pf:
        choices.setdefault('node', []).append(pf / 'nodejs/node.exe')
        choices.setdefault('pwsh', []).append(pf / 'PowerShell/7/pwsh.exe')
        choices.setdefault('git', []).append(pf / 'Git/cmd/git.exe')
        choices['gh'].append(pf / 'GitHub CLI/gh.exe')
        choices.setdefault('dotnet', []).append(pf / 'dotnet/dotnet.exe')
        choices.setdefault('cmake', []).append(pf / 'CMake/bin/cmake.exe')
        choices.setdefault('go', []).append(pf / 'Go/bin/go.exe')
        for tool in ('npm', 'npx'):
            choices[tool].append(pf / 'nodejs' / (tool + '.cmd'))
        choices.setdefault('cloudflared', []).append(pf / 'cloudflared/cloudflared.exe')
        for shell in ('bash', 'sh'):
            choices[shell] = [pf / f'Git/bin/{shell}.exe', pf / f'Git/usr/bin/{shell}.exe']
    return next((str(p) for p in choices.get(name, []) if p.is_file()), None)


def proxy_environment(explicit=None):
    env = os.environ.copy()
    value = explicit if explicit is not None else env.get('DSHA_PROXY')
    if value:
        env.update(ALL_PROXY=value, HTTPS_PROXY=value, HTTP_PROXY=value)
    return env


def display_path(value):
    return str(value) if os.environ.get('DSHA_SHOW_PATHS') == '1' else ('[available]' if value else '[missing]')


def redact(value):
    """Best-effort publication hygiene, not a secret-detection guarantee."""
    if isinstance(value, dict):
        return {key: ('[REDACTED]' if isinstance(key, str) and re.search(r'(?i)(?:^|[_-])(?:password|secret|token|api[_-]?key|authorization)$', key)
                      else redact(item)) for key, item in value.items()}
    if isinstance(value, list):
        return [redact(item) for item in value]
    if isinstance(value, str):
        value = re.sub(r'(?i)[a-z]:[\\/](?:Users|Documents and Settings)[\\/][^\\/\r\n"\']+', '<USER_HOME>', value)
        value = re.sub(r'/(?:home|Users)/[^/\s"\']+', '<USER_HOME>', value)
        value = re.sub(r'(?i)([a-z][a-z0-9+.-]*://)[^/\s@]+@', r'\1[REDACTED]@', value)
        value = re.sub(r'(?i)(Bearer\s+)[A-Za-z0-9._~+/=-]+', r'\1[REDACTED]', value)
        value = re.sub(r'(?i)((?:api[_-]?key|password|secret|token)\s*[=:]\s*)[^\s,;]+', r'\1[REDACTED]', value)
    return value
