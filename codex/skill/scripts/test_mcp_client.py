"""Transport lifecycle checks; fake server, not native provider qualification."""
from pathlib import Path
import json
import os
import subprocess
import sys
import tempfile
import unittest

from mcp_client import Mcp

SERVER = '''import json,sys,time
count=0
for line in sys.stdin:
 value=json.loads(line)
 if 'id' not in value: continue
 method=value['method']
 if method=='initialize':
  result={'serverInfo':{'name':'isolated-test-server','version':'1'},'protocolVersion':'2025-11-25','capabilities':{}}
 elif method=='tools/list': result={'tools':[]}
 else:
  name=value['params']['name']
  count+=1
  if name=='delayed': time.sleep(.2)
  if name=='error':
   print(json.dumps({'jsonrpc':'2.0','id':value['id'],'error':{'code':-32602,'message':'expected test error'}}),flush=True)
   continue
  result={'content':[],'structuredContent':{'count':count}}
 print(json.dumps({'jsonrpc':'2.0','id':value['id'],'result':result}),flush=True)
'''


class ClientTests(unittest.TestCase):
    def setUp(self):
        self.owned = tempfile.TemporaryDirectory(prefix='dsha-mcp-test-')
        root = Path(self.owned.name).resolve()
        assert root.is_relative_to(Path(tempfile.gettempdir()).resolve())
        server = root / 'server.py'
        server.write_text(SERVER, encoding='utf-8')
        self.client = Mcp({'node': sys.executable, 'rea_entry': str(server), 'env': {'JAVA_HOME': str(root)}}, timeout=3)

    def tearDown(self):
        self.client.close()
        self.owned.cleanup()

    def test_handshake_and_catalog(self):
        self.assertEqual(self.client.initialize['serverInfo']['name'], 'isolated-test-server')
        self.assertEqual(self.client.request('tools/list'), {'tools': []})

    def test_timeout_waits_same_request_without_resend(self):
        self.client.timeout = .03
        with self.assertRaises(TimeoutError):
            self.client.tool('delayed')
        self.assertIsNone(self.client.process.poll())
        self.assertIsNotNone(self.client.pending)
        with self.assertRaises(RuntimeError):
            self.client.tool('delayed')
        self.client.timeout = 3
        self.assertEqual(self.client.wait()['structuredContent']['count'], 1)
        self.assertIsNone(self.client.pending)
        self.assertEqual(self.client.tool('next')['structuredContent']['count'], 2)

    def test_response_error_does_not_poison_next_request(self):
        with self.assertRaises(RuntimeError):
            self.client.tool('error')
        self.assertIsNone(self.client.pending)
        self.assertEqual(self.client.tool('next')['structuredContent']['count'], 2)


class JsonEncodingTests(unittest.TestCase):
    def test_redirected_catalog_is_utf8_even_with_ascii_console(self):
        program = '''import mcp_client,sys
class Fake:
 def __init__(self, **kw): self.initialize = {}
 def request(self, *a): return {'tools':[{'name':'\\u4e2d\\u6587'}]}
 def tool(self, *a): return {}
 def close(self): pass
mcp_client.Mcp = Fake
sys.argv = ['mcp_client.py','--list']
mcp_client.main()
'''
        env = dict(os.environ, PYTHONIOENCODING='ascii')
        proc = subprocess.run([sys.executable, '-c', program], cwd=Path(__file__).parent,
                              env=env, capture_output=True, timeout=5)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(json.loads(proc.stdout.decode('utf-8'))['tools'][0]['name'], '\u4e2d\u6587')


if __name__ == '__main__':
    unittest.main()
