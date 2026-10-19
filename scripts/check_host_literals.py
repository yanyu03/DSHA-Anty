"""Check owned runtime/templates for known machine literals; print locations only."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
RULES = {
    'machine_absolute_path': re.compile(r'(?i)[a-z]:[\\/]+(?:Users|Program Files|python\d)[^\r\n]*'),
    'implicit_proxy_endpoint': re.compile(r'(?:127\.0\.0\.1|localhost):(?:10808|10809)\b'),
    'credential_in_url': re.compile(r'https?://[^/\s"\']+:[^/@\s"\']+@'),
}


def files():
    for folder in ('scripts', 'bin', 'plugins', 'chatgpt', 'codex/skill/scripts'):
        for path in (ROOT / folder).rglob('*'):
            if path.suffix not in ('.py', '.ps1', '.cmd', '.json') or path.name.startswith('test') or path.name == 'selftest.py':
                continue
            if path.name == Path(__file__).name or '__pycache__' in path.parts:
                continue
            yield path
    for name in ('install.ps1', 'verify.ps1', 'skills/reverse-engineer-anything/tools/rea/dsha_rea_driver.py'):
        yield ROOT / name


def main():
    failures = []
    checked = 0
    for path in files():
        checked += 1
        for number, line in enumerate(path.read_text(encoding='utf-8-sig').splitlines(), 1):
            for rule, pattern in RULES.items():
                if pattern.search(line):
                    failures.append((path.relative_to(ROOT).as_posix(), number, rule))
    for path, number, rule in failures:
        print(f'{path}:{number}: {rule}; value omitted')
    print(f'Owned runtime/template files checked: {checked}; findings: {len(failures)}')
    return bool(failures)


if __name__ == '__main__':
    raise SystemExit(main())
