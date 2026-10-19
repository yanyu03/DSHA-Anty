"""Keep a single owned REA MCP session alive; JSON-line tool calls on stdin.

Input: {"tool":"binary_session","arguments":{}}; {"method":"tools/list"};
{"wait":true} observes a timed-out live request; {"quit":true} closes the
owned session. Output is JSON. A session can be held by exec/write_stdin.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import queue
import subprocess
import sys
import threading
import time

from dsha import environment, host


class Mcp:
    def __init__(self, config=None, timeout=120, log_path=None):
        self.config = config or host()
        self.timeout = timeout
        self.next_id = 0
        self.pending = None
        self.queue = queue.Queue()
        self.log = Path(log_path).open('a', encoding='utf-8') if log_path else None
        self.process = subprocess.Popen(
            [self.config['node'], self.config['rea_entry'], 'mcp'],
            env=environment(self.config), stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=self.log or subprocess.DEVNULL, text=True, encoding='utf-8',
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        self.reader_thread = threading.Thread(target=self._read, daemon=True)
        self.reader_thread.start()
        try:
            self.initialize = self.request('initialize', {
                'protocolVersion': '2025-11-25', 'capabilities': {},
                'clientInfo': {'name': 'dsha-codex-local-validation', 'version': '1.0'}})
            self.notify('notifications/initialized')
        except Exception:
            self.close()
            raise

    def _read(self):
        try:
            for line in self.process.stdout:
                try:
                    self.queue.put(json.loads(line))
                except ValueError:
                    pass
        finally:
            self.queue.put({'_closed': True})

    def notify(self, method, params=None):
        value = {'jsonrpc': '2.0', 'method': method}
        if params is not None:
            value['params'] = params
        self.process.stdin.write(json.dumps(value) + '\n')
        self.process.stdin.flush()

    def request(self, method, params=None):
        if self.pending is not None:
            raise RuntimeError('An MCP request is still live; send {"wait":true} instead of resending or restarting it')
        self.next_id += 1
        value = {'jsonrpc': '2.0', 'id': self.next_id, 'method': method}
        if params is not None:
            value['params'] = params
        self.process.stdin.write(json.dumps(value) + '\n')
        self.process.stdin.flush()
        self.pending = {'id': self.next_id, 'method': method}
        return self.wait()

    def wait(self):
        if self.pending is None:
            raise RuntimeError('No in-flight MCP request to observe')
        method = self.pending['method']
        deadline = time.monotonic() + self.timeout
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError(f'MCP timeout for {method}; do not assume the remote operation stopped')
            try:
                message = self.queue.get(timeout=remaining)
            except queue.Empty:
                raise TimeoutError(f'MCP timeout for {method}; do not restart an unobserved live operation') from None
            if message.get('_closed'):
                raise RuntimeError('REA MCP exited; see owned stderr log if enabled')
            if message.get('id') != self.pending['id']:
                continue
            self.pending = None
            if 'error' in message:
                raise RuntimeError(json.dumps(message['error'], ensure_ascii=False))
            return message.get('result', {})

    def tool(self, name, arguments=None):
        return self.request('tools/call', {'name': name, 'arguments': arguments or {}})

    def close(self):
        if self.process.poll() is None:
            if not self.process.stdin.closed:
                self.process.stdin.close()
            try:
                self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.process.terminate()
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.process.kill()
                    self.process.wait(timeout=5)
        self.reader_thread.join(timeout=3)
        if not self.process.stdin.closed:
            self.process.stdin.close()
        if not self.process.stdout.closed:
            self.process.stdout.close()
        if self.log:
            self.log.close()


def main():
    # A redirected Windows console can otherwise emit locale bytes into JSONL.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--list', action='store_true', help='list real advertised tools and exit')
    parser.add_argument('--timeout', type=int, default=120)
    args = parser.parse_args()
    client = Mcp(timeout=args.timeout)
    try:
        if args.list:
            print(json.dumps(client.request('tools/list'), ensure_ascii=False))
            return
        print(json.dumps({'ready': True, 'server': client.initialize.get('serverInfo')}), flush=True)
        for line in sys.stdin:
            if not line.strip():
                continue
            try:
                value = json.loads(line)
                if value.get('quit'):
                    break
                if value.get('wait'):
                    result = client.wait()
                elif value.get('method') == 'tools/list':
                    result = client.request('tools/list')
                else:
                    result = client.tool(value['tool'], value.get('arguments'))
                print(json.dumps({'result': result}, ensure_ascii=False), flush=True)
            except Exception as error:
                print(json.dumps({'error': str(error)}, ensure_ascii=False), flush=True)
    finally:
        # Close only an owned binary session; preserve errors in the caller's transcript.
        try:
            client.tool('close_binary')
        except Exception as error:
            print(json.dumps({'cleanup_warning': str(error), 'binary_cleanup_confirmed': False}), file=sys.stderr)
        client.close()


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, RuntimeError) as error:
        print(json.dumps({'status': 'REFUSED', 'error': type(error).__name__,
                          'message': 'MCP startup or transport failed; inspect private configuration and owned logs.'}), file=sys.stderr)
        sys.exit(2)
