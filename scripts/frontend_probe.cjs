// Owned challenge samples only. Project libraries execute in a bounded child process.
// This is behavior evidence, not a sandbox or cryptographic package attestation.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const [project, capability, nonce, left, right] = process.argv.slice(2);
const root = fs.realpathSync(project);
const req = createRequire(path.join(root, 'package.json'));
const files = new Map();
let phase = 'resolve';
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function inside(p) {
  const rel = path.relative(root, p);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw Error('OUTSIDE_PROJECT');
}
function remember(p) {
  p = fs.realpathSync(p); inside(p);
  if (fs.statSync(p).size > 32 * 1024 * 1024) throw Error('FILE_LIMIT');
  files.set(p, hash(p));
}
function load(specifier, name, majorCheck, resolver = req) {
  const entry = fs.realpathSync(resolver.resolve(specifier)); inside(entry); remember(entry);
  let dir = path.dirname(entry), metadata;
  for (let depth = 0; depth < 32; depth++) {
    inside(dir);
    const p = path.join(dir, 'package.json');
    if (fs.existsSync(p)) {
      if (fs.statSync(p).size > 1024 * 1024) throw Error('FILE_LIMIT');
      const m = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (m.name === name) { remember(p); metadata = m; break; }
    }
    if (dir === root) break;
    dir = path.dirname(dir);
  }
  if (!metadata || !/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(metadata.version)) throw Error('IDENTITY');
  if (!majorCheck(Number(metadata.version.split('.')[0]))) throw Error('UNSUPPORTED_VERSION');
  phase = 'behavior';
  return {api: resolver(specifier), version: metadata.version};
}
async function main() {
  if (!/^[a-f0-9]{32}$/.test(nonce) || !/^\d+$/.test(left) || !/^\d+$/.test(right)) throw Error('CHALLENGE');
  const answer = Number(left) * Number(right);
  const text = 'DSHA_' + nonce + '_' + answer;
  const manifest = path.join(root, 'package.json'); remember(manifest);
  let version;
  if (capability === 'typescript') {
    const ts = load('typescript', 'typescript', m => m >= 5 && m < 7);
    version = ts.version;
    if (ts.api.version !== version) throw Error('IDENTITY');
    // Ask the compiler to accept an owned program AND reject a type error.
    // No project tsconfig, plugins, disk writes, package scripts or emitted hooks.
    const options = {noLib:true, strict:true, noEmitOnError:true, target:ts.api.ScriptTarget.ES2020,
                     module:ts.api.ModuleKind.CommonJS};
    const declarations = 'interface Array<T> {length:number;} interface Boolean {} interface Function {} '
      + 'interface IArguments {} interface Number {} interface Object {} interface RegExp {} '
      + 'interface String {} interface CallableFunction extends Function {} interface NewableFunction extends Function {}\n';
    function compile(source) {
      let output = '';
      const host = {getSourceFile:(f,l) => f === 'sample.ts' ? ts.api.createSourceFile(f,declarations+source,l,true) : undefined,
        getDefaultLibFileName:()=>'',writeFile:(_f,s)=>{output=s;},getCurrentDirectory:()=>'',getDirectories:()=>[],
        fileExists:f=>f==='sample.ts',readFile:f=>f==='sample.ts'?declarations+source:undefined,
        getCanonicalFileName:f=>f,useCaseSensitiveFileNames:()=>true,getNewLine:()=> '\n'};
      const program = ts.api.createProgram(['sample.ts'],options,host);
      const diagnostics = ts.api.getPreEmitDiagnostics(program);
      const emitted = program.emit();
      return {diagnostics:[...diagnostics,...emitted.diagnostics],output,skipped:emitted.emitSkipped};
    }
    const good = compile(`const pair: [number, number] = [${left},${right}]; const result: number = pair[0]*pair[1];`);
    if (good.diagnostics.length || good.skipped || !good.output) throw Error('COMPILE');
    const bad = compile('const wrong: number = "' + nonce + '";');
    if (!bad.diagnostics.some(d=>d.code===2322) || !bad.skipped) throw Error('TYPECHECK');
    const actual = vm.runInNewContext(good.output + '\nresult',Object.create(null),{timeout:1000});
    if (actual !== answer) throw Error('COMPILE_RUN');
  } else if (capability === 'react') {
    const react = load('react', 'react', m => m >= 18 && m < 20);
    const dom = load('react-dom/server', 'react-dom', m => m >= 18 && m < 20);
    version = react.version;
    if (react.version !== dom.version || react.api.version !== react.version) throw Error('IDENTITY');
    const html = dom.api.renderToStaticMarkup(react.api.createElement('strong',null,text));
    if (html !== '<strong>' + text + '</strong>') throw Error('RENDER');
  } else if (capability === 'vue') {
    const vue = load('vue', 'vue', m => m === 3);
    // vue/server-renderer is a Vue-owned wrapper in some layouts. Resolve its
    // actual renderer dependency relative to Vue, not as an unrelated root peer.
    const renderer = load('@vue/server-renderer', '@vue/server-renderer', m => m === 3,
                          createRequire(req.resolve('vue')));
    version = vue.version;
    if (renderer.version !== vue.version || vue.api.version !== vue.version) throw Error('IDENTITY');
    const state = vue.api.reactive({value:Number(left)});
    const derived = vue.api.computed(()=>state.value * Number(right));
    if (derived.value !== answer) throw Error('REACTIVITY');
    state.value++;
    if (derived.value !== (Number(left)+1)*Number(right)) throw Error('REACTIVITY');
    const html = await renderer.api.renderToString(vue.api.createSSRApp({render:()=>vue.api.h('strong',text)}));
    if (html !== '<strong>' + text + '</strong>') throw Error('RENDER');
  } else throw Error('UNKNOWN_CAPABILITY');
  // Record selected entry/manifest identities, and detect changes during the probe.
  for (const [p, digest] of files) if (hash(p) !== digest) throw Error('IDENTITY_CHANGED');
  return {status:'PASS',capability,version,challenge:nonce,answer,
          files:[...files].map(([file,sha256])=>({file,sha256})),
          scope:capability==='typescript'?'owned typed compile/reject/run':'owned SSR sample' };
}
main().then(result=>console.log(JSON.stringify(result))).catch(error=>{
  const known = new Set(['OUTSIDE_PROJECT','FILE_LIMIT','IDENTITY','UNSUPPORTED_VERSION','CHALLENGE',
    'COMPILE','TYPECHECK','COMPILE_RUN','RENDER','REACTIVITY','IDENTITY_CHANGED','UNKNOWN_CAPABILITY']);
  const reason = error.code === 'MODULE_NOT_FOUND' ? 'PACKAGE_NOT_FOUND'
    : (known.has(error.message) ? error.message : (phase === 'resolve' ? 'RESOLUTION_FAILED' : 'BEHAVIOR_FAILED'));
  console.log(JSON.stringify({status:'FAIL',capability,reason})); process.exitCode=1;
});
