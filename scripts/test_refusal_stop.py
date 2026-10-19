"""Fault-injection specimens: each refused call must do no subsequent work."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import Mock, patch
import base_tool
from envfeel import EnvFeel
from project_probe import probe_frontend
from refusal import halt


class RefusalStopTests(unittest.TestCase):
    def assert_stop(self, report):
        self.assertEqual(report['status'],'REFUSED')
        self.assertTrue(report['stop'])
        self.assertEqual(report['task']['status'],'NOT_RUN')
        self.assertTrue(report['user_response']['apology'])
        self.assertTrue(report['user_response']['where_to_check'])
        self.assertTrue(report['user_response']['manual_configuration'])
        self.assertEqual(report['user_response']['automatic_actions'],[])

    def test_missing_project_stops_before_tool_discovery(self):
        with tempfile.TemporaryDirectory() as d, patch('envfeel.find_binary') as find:
            r=EnvFeel(['react'],project=Path(d)/'missing').check()
            self.assert_stop(r)
            find.assert_not_called()

    def test_undeclared_execution_stops_before_check(self):
        gate=EnvFeel(['python'])
        with patch.object(gate,'check') as check:
            r,_=gate.execute('node',[])
            self.assert_stop(r)
            check.assert_not_called()

    def test_invalid_api_timeout_stops_before_check(self):
        gate=EnvFeel(['python'])
        with patch.object(gate,'check') as check:
            r,_=gate.execute('python',[],timeout=0)
            self.assert_stop(r)
            check.assert_not_called()

    def test_first_missing_tool_stops_next_discovery(self):
        with patch('envfeel.find_binary',return_value=None) as find:
            r=EnvFeel(['python','node']).check()
            self.assert_stop(r)
            self.assertEqual(find.call_count,1)
            self.assertEqual(len(r['tools']),1)

    def test_first_failed_version_stops_next_version_and_health(self):
        with patch('envfeel.find_binary',return_value=Path(sys.executable)), \
             patch('environment_smoke.version_probe',return_value={'status':'FAIL'}) as version, \
             patch('environment_smoke.fixture_probe') as health:
            r=EnvFeel(['python','node']).check()
            self.assert_stop(r)
            self.assertEqual(version.call_count,1)
            health.assert_not_called()

    def test_first_failed_health_stops_next_health(self):
        with patch('envfeel.find_binary',return_value=Path(sys.executable)), \
             patch('environment_smoke.version_probe',return_value={'status':'PASS','identity_check':'brand-and-version'}), \
             patch('environment_smoke.fixture_probe',return_value={'status':'FAIL'}) as health:
            r=EnvFeel(['python','node']).check()
            self.assert_stop(r)
            self.assertEqual(health.call_count,1)

    def test_runtime_query_timeout_stops_with_guidance(self):
        with patch('envfeel.find_binary',return_value=Path(sys.executable)), \
             patch('environment_smoke.version_probe',return_value={'status':'PASS','identity_check':'brand-and-version'}), \
             patch('envfeel.subprocess.run',side_effect=subprocess.TimeoutExpired('owned-query',1)):
            r=EnvFeel(['rustc']).check()
        self.assert_stop(r)
        self.assertEqual(r['reason'],'PROBE_TIMEOUT')

    def test_missing_launcher_has_guidance_and_no_run(self):
        tool=base_tool.ScribeTool()
        with patch.object(tool,'assert_authorization',return_value=(True,None)), \
             patch.object(tool,'assert_environment',return_value=(True,None)), \
             patch.object(tool,'resolve_executable',return_value=None), \
             patch('base_tool.subprocess.run') as run:
            r=tool.execute([])
        self.assert_stop(r)
        self.assertEqual(r['exit_code'],127)
        run.assert_not_called()

    def test_first_failed_capability_marks_later_unrun(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'package.json').write_text('{}')
            answer=subprocess.CompletedProcess([],1,json.dumps({'status':'FAIL','reason':'PACKAGE_NOT_FOUND'}),'')
            with patch('project_probe.subprocess.run',return_value=answer) as run:
                r,_=probe_frontend(sys.executable,root,['typescript','react','vue'],os.environ)
            self.assertEqual(run.call_count,1)
            self.assertEqual([x['status'] for x in r],['FAIL','NOT_RUN','NOT_RUN'])

    def test_refusal_is_latched_for_same_gate_even_if_caller_retries(self):
        gate=EnvFeel(['python'])
        with patch('envfeel.find_binary',return_value=None) as find:
            first=gate.check()
            first['stop']=False
            second,_=gate.execute('python',['-c','raise Exception("must not run")'])
            third=gate.check()
        self.assert_stop(second);self.assert_stop(third)
        self.assertEqual(find.call_count,1)
        self.assertEqual(gate.executables,{})
        self.assertEqual(gate.environment,{})

    def test_known_authorization_refusal_precedes_environment(self):
        tool=base_tool.ScribeTool()
        err=base_tool.ErrBlock('ERR_PERMISSION_DENIED','owned','owned','owned','refused',[],[])
        with patch.object(tool,'assert_authorization',return_value=(False,err)), \
             patch.object(tool,'assert_environment') as environment, \
             patch.object(tool,'resolve_executable') as launcher:
            result=tool.execute([])
        environment.assert_not_called();launcher.assert_not_called()
        self.assertTrue(result['err_block']['stop'])
        self.assertEqual(result['exit_code'],126)

    def test_base_tool_stops_first_missing_prerequisite_location(self):
        tool=base_tool.ScribeTool()
        first=types.SimpleNamespace(binary='python',locate_binary=Mock(return_value=None))
        second=types.SimpleNamespace(binary='node',locate_binary=Mock())
        tool.prerequisites=[first,second]
        ok,err=tool.assert_environment()
        self.assertFalse(ok);second.locate_binary.assert_not_called()
        self.assertTrue(err.to_dict()['stop'])

    def test_base_tool_stops_first_health_failure(self):
        tool=base_tool.ScribeTool()
        tool.prerequisites=[types.SimpleNamespace(binary=name,locate_binary=Mock(return_value=sys.executable),
            verify=Mock(return_value={'satisfied':True})) for name in ('python','node')]
        with patch('base_tool.fixture_probe',return_value={'status':'FAIL'}) as health:
            ok,err=tool.assert_environment()
        self.assertFalse(ok);self.assertEqual(health.call_count,1)
        self.assertTrue(err.to_dict()['stop'])

    def test_help_guidance_does_not_echo_untrusted_private_values(self):
        r=halt({'reason':'private-token-and-host-path','tools':[{'tool':'secret-location','status':'INVALID_OVERRIDE'}]})
        response=json.dumps(r['user_response'],ensure_ascii=False)
        self.assertNotIn('secret-location',response)
        self.assertNotIn('private-token-and-host-path',response)
        self.assertEqual(r['user_response']['automatic_actions'],[])

    def test_source_identity_guidance_never_advises_resealing(self):
        r=halt({},'SOURCE_IDENTITY')
        self.assert_stop(r)
        self.assertIn('原始',r['user_response']['where_to_check'])

    def test_invalid_cli_returns_guidance_without_attempting_task(self):
        done=subprocess.run([sys.executable,str(Path(__file__).with_name('envfeel.py')),
            '--require','unsupported-private-claim'],capture_output=True,text=True,encoding='utf-8',timeout=10)
        self.assertEqual(done.returncode,2)
        self.assert_stop(json.loads(done.stdout))
        self.assertNotIn('unsupported-private-claim',done.stdout+done.stderr)


if __name__=='__main__':unittest.main(verbosity=2)
