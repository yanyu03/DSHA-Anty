"""Project-capability gate regressions: real packages and owned counterfeits."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from dsha_env import find_binary
from envfeel import EnvFeel
from project_probe import probe_frontend


class ProjectProbeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.node = find_binary('node')
        if not cls.node:
            raise RuntimeError('Node is required to run this regression suite')
        cls.real = os.environ.get('DSHA_TEST_FRONTEND_PROJECT')

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='DSHA project 环境 ')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'package.json').write_text(json.dumps({'private':True,
            'dependencies':{'typescript':'999.999.999','react':'999.999.999','vue':'999.999.999'}}),encoding='utf-8')

    def fake(self, name, source, version):
        folder = self.root / 'node_modules' / name
        folder.mkdir(parents=True)
        (folder / 'package.json').write_text(json.dumps({'name':name,'version':version,'main':'index.cjs'}),encoding='utf-8')
        (folder / 'index.cjs').write_text(source,encoding='utf-8')

    def require_real(self):
        if not self.real:
            self.skipTest('Set DSHA_TEST_FRONTEND_PROJECT to an isolated real-package fixture')
        return self.real

    def assert_blocked(self, capability, project=None, env=None):
        marker = self.root / 'task-marker'
        gate = EnvFeel([capability], {'node':self.node}, env, project=project or self.root)
        report, _ = gate.execute('node',['-e','require("fs").writeFileSync(process.argv[1],"ran")',str(marker)])
        self.assertEqual(report['status'],'REFUSED',report)
        self.assertEqual(report['task']['status'],'NOT_RUN',report)
        self.assertFalse(marker.exists())
        return report

    def test_typescript_manifest_only_blocks_task(self): self.assert_blocked('typescript')
    def test_react_manifest_only_blocks_task(self): self.assert_blocked('react')
    def test_vue_manifest_only_blocks_task(self): self.assert_blocked('vue')

    def test_typescript_version_only_counterfeit_blocks(self):
        self.fake('typescript','exports.version="5.9.3";','5.9.3')
        self.assert_blocked('typescript')

    def test_react_fixed_render_counterfeit_blocks(self):
        self.fake('react','exports.version="19.2.0";exports.createElement=()=>({});','19.2.0')
        self.fake('react-dom','exports.renderToStaticMarkup=()=>"<strong>DSHA_SMOKE_OK</strong>";','19.2.0')
        (self.root/'node_modules/react-dom/server.js').write_text('module.exports=require("./index.cjs");')
        self.assert_blocked('react')

    def test_vue_version_only_counterfeit_blocks(self):
        self.fake('vue','exports.version="3.5.22";','3.5.22')
        self.fake('@vue/server-renderer','exports.renderToString=()=>"fixed";','3.5.22')
        self.assert_blocked('vue')

    def test_project_is_required_not_assumed_from_cwd(self):
        env={k:v for k,v in os.environ.items() if k.upper()!='DSHA_PROJECT_ROOT'}
        report=EnvFeel(['react'],{'node':self.node},env).check()
        self.assertEqual(report['status'],'REFUSED')
        self.assertEqual(report['capabilities'][0]['reason'],'PROJECT_REQUIRED')

    def test_invalid_parameter_does_not_fallback_to_valid_env(self):
        env=dict(os.environ,DSHA_PROJECT_ROOT=self.require_real())
        report=self.assert_blocked('react',self.root/'does-not-exist',env)
        self.assertEqual(report['capabilities'][0]['reason'],'PROJECT_REQUIRED')

    def test_ancestor_package_is_not_project_proof(self):
        self.fake('react','exports.version="19.2.0";','19.2.0')
        nested=self.root/'nested';nested.mkdir()
        (nested/'package.json').write_text('{"private":true}')
        report=self.assert_blocked('react',nested)
        self.assertEqual(report['capabilities'][0]['reason'],'OUTSIDE_PROJECT')

    def test_real_typescript_compiles_rejects_type_error_and_runs(self):
        report=EnvFeel(['typescript'],{'node':self.node},project=self.require_real()).check()
        self.assertEqual(report['status'],'READY',report)
        self.assertTrue(report['capabilities'][0]['challenge_verified'])

    def test_real_react_renders(self):
        report=EnvFeel(['react'],{'node':self.node},project=self.require_real()).check()
        self.assertEqual(report['status'],'READY',report)

    def test_real_vue_reacts_and_renders(self):
        report=EnvFeel(['vue'],{'node':self.node},project=self.require_real()).check()
        self.assertEqual(report['status'],'READY',report)

    def test_combined_real_capabilities_execute_in_project(self):
        project=self.require_real()
        env=dict(os.environ,NODE_OPTIONS='--require=nonexistent-injected-hook',NODE_PATH=str(self.root))
        original=env.copy()
        gate=EnvFeel(['typescript','react','vue'],{'node':self.node},env,project=project)
        report,out=gate.execute('node',['-e','process.stdout.write(process.cwd())'])
        self.assertEqual(report['status'],'COMPLETE',report)
        self.assertEqual(Path(out['stdout']).resolve(),Path(project).resolve())
        self.assertEqual(env,original)
        self.assertNotIn('NODE_OPTIONS',gate.environment)
        self.assertNotIn('NODE_PATH',gate.environment)
        self.assertNotIn(str(Path(project).resolve()),json.dumps(report))
        self.assertEqual(len(gate.project_evidence),3)

    def test_env_file_project_is_applied(self):
        project=self.require_real()
        env={k:v for k,v in os.environ.items() if k.upper()!='DSHA_PROJECT_ROOT'}
        envfile=self.root/'project.env';envfile.write_text('DSHA_PROJECT_ROOT='+project,encoding='utf-8')
        report=EnvFeel(['react'],{'node':self.node},env,envfile).check()
        self.assertEqual(report['status'],'READY',report)

    def test_execute_rechecks_project_after_prior_ready(self):
        gate=EnvFeel(['react'],{'node':self.node},project=self.require_real())
        self.assertEqual(gate.check()['status'],'READY')
        gate.project=self.root
        report,_=gate.execute('node',['-e','throw Error("must not run")'])
        self.assertEqual(report['status'],'REFUSED')
        self.assertEqual(report['task']['status'],'NOT_RUN')

    def test_probe_timeout_refuses(self):
        with patch('project_probe.subprocess.run',side_effect=subprocess.TimeoutExpired('owned-probe',1)):
            report,_=probe_frontend(self.node,self.root,['react'],os.environ,timeout=1)
        self.assertEqual(report[0]['reason'],'PROBE_TIMEOUT')

    def test_actual_nonresponsive_package_times_out(self):
        self.fake('react','while(true) {}','19.2.0')
        report,_=probe_frontend(self.node,self.root,['react'],os.environ,timeout=0.2)
        self.assertEqual(report[0]['reason'],'PROBE_TIMEOUT')

    def test_future_contract_version_is_rejected_before_load(self):
        marker=self.root/'module-loaded'
        self.fake('typescript','require("fs").writeFileSync('+json.dumps(str(marker))+',"loaded");','999.0.0')
        report=self.assert_blocked('typescript')
        self.assertEqual(report['capabilities'][0]['reason'],'UNSUPPORTED_VERSION')
        self.assertFalse(marker.exists())

    def test_malformed_reply_refuses(self):
        result=subprocess.CompletedProcess([],0,'[]','')
        with patch('project_probe.subprocess.run',return_value=result):
            report,_=probe_frontend(self.node,self.root,['react'],os.environ)
        self.assertEqual(report[0]['reason'],'INVALID_REPLY')

    def test_wrong_challenge_cannot_replay_success(self):
        result=subprocess.CompletedProcess([],0,json.dumps({'status':'PASS','capability':'react',
            'version':'19.2.0','challenge':'stale-challenge','answer':1,'files':[{}]}),'')
        with patch('project_probe.subprocess.run',return_value=result):
            report,_=probe_frontend(self.node,self.root,['react'],os.environ)
        self.assertEqual(report[0]['status'],'FAIL')
        self.assertEqual(report[0]['reason'],'INVALID_REPLY')

    def test_relative_project_refuses(self):
        report=EnvFeel(['react'],{'node':self.node},project='.').check()
        self.assertEqual(report['status'],'REFUSED')
        self.assertEqual(report['capabilities'][0]['reason'],'PROJECT_REQUIRED')

    def test_cli_private_evidence_and_public_redaction(self):
        private=self.root/'receipt.local.json'
        args=[sys.executable,str(Path(__file__).with_name('envfeel.py')),'--require','react',
              '--binary','node='+self.node,'--project',self.require_real(),'--private-output',str(private),
              '--run','node','--','-e','console.log("owned-private-text")']
        done=subprocess.run(args,capture_output=True,text=True,encoding='utf-8',timeout=30)
        self.assertEqual(done.returncode,0,done.stdout)
        self.assertNotIn('owned-private-text',done.stdout)
        self.assertNotIn(str(Path(self.real).resolve()),done.stdout)
        data=json.loads(private.read_text(encoding='utf-8'))
        self.assertTrue(data['project_evidence'][0]['files'])
        self.assertIn('owned-private-text',data['task_output']['stdout'])


if __name__=='__main__': unittest.main(verbosity=2)
