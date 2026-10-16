const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const transpile = file => ts.transpileModule(readFileSync(require.resolve(file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function loadRelease(fetch) {
  const constants = { exports: {}, process: { env: {} } };
  vm.runInNewContext(transpile('../lib/clientReleaseConstants.ts'), constants);
  const module = { exports: {}, fetch, AbortSignal, console: { error() {} },
    require: name => name === 'react' ? { cache: fn => fn } : constants.exports };
  vm.runInNewContext(transpile('../lib/publicClientRelease.ts'), module);
  return module.exports.getLatestClientRelease;
}

test('unavailable live metadata is explicitly a reference build and has no invented platform assets', async () => {
  const release = await loadRelease(async () => ({ ok: false, status: 402 }))();
  assert.equal(release.metadataStatus, 'fallback');
  assert.equal(release.version, 'v0.8.28');
  assert.equal(release.assets.length, 4);
  assert.ok(release.assets.every(a => !/\.(dmg|msi)$/.test(a.name)));
});

test('live release selection compares numeric versions and retains only matching public assets', async () => {
  let options;
  const release = await loadRelease(async (_, opts) => { options = opts; return { ok: true, json: async () => ({ values: [
    { name: 'MineBench.Client_0.8.9_x64-setup.exe' },
    { name: 'MineBench.Client_0.8.28_amd64.AppImage' },
    { name: 'MineBench.Client_0.8.28_x64-setup.exe' },
    { name: 'README.txt' },
  ] }) }; })();
  assert.equal(release.metadataStatus, 'live');
  assert.equal(release.version, 'v0.8.28');
  assert.equal(release.assets.length, 2);
  assert.ok(options.signal instanceof AbortSignal);
  assert.ok(release.assets.every(a => a.browser_download_url.startsWith('https://bitbucket.org/minebenchapp/minebench-client/downloads/')));
});

test('network errors and empty release lists do not masquerade as verified metadata', async () => {
  for (const fetch of [async () => { throw new Error('timeout'); }, async () => ({ ok: true, json: async () => ({ values: [] }) })]) {
    assert.equal((await loadRelease(fetch)()).metadataStatus, 'fallback');
  }
});
