"""Project capability replies from actual bounded Node challenges, never manifest claims."""
import json
import os
from pathlib import Path
import secrets
import subprocess

CAPABILITIES = ('typescript', 'react', 'vue')


def probe_frontend(node, project, capabilities, environ, timeout=20):
    private = []
    public = []
    # A project must be selected explicitly; no guessing from cwd or HOME.
    root = Path(project) if isinstance(project, (str, os.PathLike)) and str(project) else None
    if root is None or not root.is_absolute() or not root.is_dir() or not (root / 'package.json').is_file():
        return [{'capability': c, 'status': 'FAIL', 'reason': 'PROJECT_REQUIRED'} for c in capabilities], private
    child = dict(environ)
    # Do not allow NODE_OPTIONS hooks or NODE_PATH to select unrelated project libraries.
    for key in list(child):
        if key.upper() in ('NODE_OPTIONS', 'NODE_PATH'):
            del child[key]
    helper = Path(__file__).with_name('frontend_probe.cjs')
    for capability in capabilities:
        nonce = secrets.token_hex(16)
        left, right = secrets.randbelow(9000) + 1000, secrets.randbelow(9000) + 1000
        record = {'capability': capability, 'status': 'FAIL'}
        try:
            result = subprocess.run([node, str(helper), str(root.resolve()), capability,
                                     nonce, str(left), str(right)], cwd=root,
                                    env=child, capture_output=True, encoding='utf-8', errors='replace', timeout=timeout)
            # Last line allows libraries' informational output, but only nonce-bound JSON is accepted.
            payload = json.loads(result.stdout.splitlines()[-1])
            if not isinstance(payload, dict):
                raise ValueError('invalid reply shape')
            if (result.returncode == 0 and payload.get('status') == 'PASS'
                    and payload.get('capability') == capability and payload.get('challenge') == nonce
                    and payload.get('answer') == left * right and payload.get('files')):
                record.update(status='PASS', version=payload['version'],
                              proof=payload['scope'], challenge_verified=True)
                private.append(payload)
            else:
                reasons = {'PACKAGE_NOT_FOUND','OUTSIDE_PROJECT','FILE_LIMIT','IDENTITY','UNSUPPORTED_VERSION',
                           'CHALLENGE','COMPILE','TYPECHECK','COMPILE_RUN','RENDER','REACTIVITY',
                           'IDENTITY_CHANGED','RESOLUTION_FAILED','BEHAVIOR_FAILED'}
                record['reason'] = payload.get('reason') if payload.get('reason') in reasons else 'INVALID_REPLY'
        except subprocess.TimeoutExpired:
            record['reason'] = 'PROBE_TIMEOUT'
        except (OSError, ValueError, IndexError, KeyError, TypeError):
            record['reason'] = 'INVALID_REPLY'
        public.append(record)
    return public, private
