"""Host configuration: explicit value > DSHA environment > system discovery.

No config values or subprocess output are included in discovery errors.
"""
import os
import re
from pathlib import Path
import shutil
import sys


def config_dir(value=None):
    return Path(value or os.environ.get('DSHA_CONFIG_DIR') or Path.home() / '.gemini/config').expanduser()


def optional_path(name, default=None):
    value = os.environ.get(name)
    return Path(value).expanduser() if value else default


def find_binary(name, explicit=None):
    override = explicit if explicit is not None else os.environ.get('DSHA_' + name.upper())
    if override is not None:
        # An invalid override must not silently select a different executable.
        candidate = Path(override).expanduser()
        if candidate.is_absolute():
            return str(candidate) if candidate.is_file() else None
        located = shutil.which(str(override)) if override and not candidate.parent.parts else None
        return located if located and 'windowsapps' not in located.lower() else None
    located = shutil.which(name)
    if located and 'windowsapps' not in located.lower():
        return located
    home = Path.home()
    local = Path(os.environ.get('LOCALAPPDATA') or home / 'AppData/Local')
    app = Path(os.environ.get('APPDATA') or home / 'AppData/Roaming')
    pf = optional_path('ProgramFiles')
    choices = {
        'python': [Path(sys.executable)],
        'node': [local / 'Programs/nodejs/node.exe'],
        'wrangler': [app / 'npm/wrangler.cmd', app / 'npm/wrangler'],
        'cf': [app / 'npm/cloudflare.cmd', app / 'npm/cf.cmd'],
        'cloudflared': [home / 'bin/cloudflared.exe', config_dir() / 'bin/cloudflared.exe'],
        'pwsh': [config_dir() / 'pwsh/pwsh.exe'],
        'gh': [],
    }
    cargo_home = optional_path('CARGO_HOME', home / '.cargo')
    for tool in ('cargo', 'rustc', 'rustup'):
        choices[tool] = [cargo_home / 'bin' / (tool + ('.exe' if os.name == 'nt' else ''))]
    java_home = optional_path('JAVA_HOME')
    if java_home:
        for tool in ('java', 'javac'):
            choices[tool] = [java_home / 'bin' / (tool + ('.exe' if os.name == 'nt' else ''))]
    dotnet_root = optional_path('DOTNET_ROOT')
    if dotnet_root:
        choices['dotnet'] = [dotnet_root / ('dotnet.exe' if os.name == 'nt' else 'dotnet')]
    android_root = optional_path('ANDROID_SDK_ROOT') or optional_path('ANDROID_HOME')
    if android_root:
        choices['adb'] = [android_root / 'platform-tools' / ('adb.exe' if os.name == 'nt' else 'adb')]
    for tool in ('npm', 'npx'):
        choices[tool] = [app / 'npm' / (tool + '.cmd')]
    vs_root = optional_path('VSINSTALLDIR')
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
    vc_tools = optional_path('VCToolsInstallDir')
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
