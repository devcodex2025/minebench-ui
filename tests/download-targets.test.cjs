const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const source = ts.transpileModule(readFileSync(require.resolve('../app/downloads/DownloadsPageClient.tsx'),'utf8'), { compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX} }).outputText;
const context = { exports:{}, require:()=>({}), console };
vm.runInNewContext(source,context);
const build = context.exports.createBuildVariants;
const asset = (name,platform,architecture,pkg) => ({name,platform,architecture,package:pkg,browser_download_url:`https://github.com/approved/client/releases/download/v1.2.3/${name}`});
test('Downloads uses explicit native metadata and shows only DMG installers on Mac',()=> {
  const result=build({assets:[asset('win.exe','windows','x86_64','nsis'),asset('intel.app.tar.gz','macos','x86_64','app-tar-gz'),asset('intel.dmg','macos','x86_64','dmg'),asset('silicon.dmg','macos','aarch64','dmg'),asset('linux.AppImage','linux','x86_64','appimage')]});
  assert.equal(result.windows.length,1);assert.equal(result.linux.length,1);
  assert.deepEqual(Array.from(result.macos,a=>a.arch),['x86_64','aarch64']);
  assert.ok(result.macos.every(a=>a.url.endsWith('.dmg')));
});
test('a misleading filename cannot override declared OS or architecture',()=> {
  const result=build({assets:[asset('thing_x64-setup.exe','macos','aarch64','nsis'),asset('intel.dmg','windows','x86_64','dmg'),asset('linux.AppImage','macos','aarch64','appimage')]});
  assert.equal(result.windows.length,0);assert.equal(result.macos.length,0);assert.equal(result.linux.length,0);
});
test('unavailable releases and ambiguous legacy DMGs do not invent Universal downloads',()=> {
  for(const release of [null,{assets:[{name:'unknown-universal.dmg',browser_download_url:'https://example.org/unknown.dmg'}]}]) {
    const result=build(release);assert.equal(result.macos.length,0);
  }
});

