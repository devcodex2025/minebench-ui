const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(readFileSync(require.resolve('../app/downloads/DownloadActions.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const href = 'https://github.com/approved/client/releases/download/v1.2.3/windows.exe';
const initial = { provider: 'github', version: '1.2.3', sourceSha: 'a'.repeat(40), releaseId: 123, catalogDigest: 'b'.repeat(64), assets: [{ browser_download_url: href }] };

function mount(release, fetch) {
  const states = []; let cleanup; let options;
  const timers = new Map(); let nextTimer = 0;
  const jsx = (type, props) => ({ type, props });
  const context = {
    exports: {}, AbortController,
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch: (...args) => { options = args[1]; return fetch(...args); },
    require(name) {
      if (name === 'react') return {
        createContext: () => ({ Provider: 'provider' }),
        useContext: () => states[0],
        useState(value) { states[0] = value; return [value, next => { states[0] = next; }]; },
        useEffect(effect) { cleanup = effect(); },
      };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      return { ButtonLink: 'download-link' };
    },
  };
  vm.runInNewContext(source, context);
  context.exports.DownloadReleaseProvider({ initialClientRelease: release, children: 'server cards' });
  return {
    availability: () => states[0],
    link: () => context.exports.DownloadBuildLink({ href, platform: 'windows', arch: 'x64' }),
    notes: () => context.exports.DownloadReleaseNotesLink({ href: 'https://github.com/approved/client/releases/tag/v1.2.3' }),
    cleanup: () => cleanup(), options: () => options,
    timers: () => timers,
    expire() { for (const { callback, delay } of [...timers.values()]) { assert.equal(delay, 10_000); callback(); } },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('verified links fail closed after network, HTTP, parsing or missing-catalog errors', async () => {
  const responses = [
    async () => { throw new Error('offline'); },
    async () => ({ ok: false, status: 503 }),
    async () => ({ ok: true, json: async () => { throw new Error('invalid JSON'); } }),
    async () => ({ ok: true, json: async () => ({ client: null }) }),
  ];
  for (const fetch of responses) {
    const page = mount(initial, fetch); await settle();
    assert.equal(page.link(), null);
    assert.equal(page.notes(), null);
    assert.match(page.availability().message, /temporarily unavailable/);
    assert.equal(page.options().cache, 'no-store');
  }
});

test('a changed immutable selection never puts new bytes behind static old-version labels', async () => {
  for (const changed of [{ version: '1.2.4' }, { sourceSha: 'c'.repeat(40) }, { catalogDigest: 'd'.repeat(64) }, { releaseId: 124 }, { provider: 'bitbucket' }]) {
    const page = mount(initial, async () => ({ ok: true, json: async () => ({ client: { ...initial, ...changed } }) }));
    await settle();
    assert.equal(page.link(), null);
    assert.equal(page.notes(), null);
    assert.match(page.availability().message, /selected release has changed/);
  }
});

test('only current catalog URLs remain clickable, and legacy Bitbucket failure stays compatible', async () => {
  const current = mount(initial, async () => ({ ok: true, json: async () => ({ client: initial }) }));
  await settle(); assert.notEqual(current.link(), null);
  const missing = mount(initial, async () => ({ ok: true, json: async () => ({ client: { ...initial, assets: [] } }) }));
  await settle(); assert.equal(missing.link(), null);
  const legacy = mount({ provider: 'bitbucket', assets: [{ browser_download_url: href }] }, async () => { throw new Error('offline'); });
  await settle(); assert.notEqual(legacy.link(), null);
});

test('unmounted revalidation aborts and ignores a later response', async () => {
  let resolve;
  const page = mount(initial, () => new Promise(done => { resolve = done; }));
  page.cleanup();
  assert.equal(page.options().signal.aborted, true);
  resolve({ ok: true, json: async () => ({ client: null }) });
  await settle();
  assert.equal(page.availability().urls, undefined);
});


test('a hung verification expires, aborts and cannot restore links with a late success', async () => {
  let resolve;
  const page = mount(initial, () => new Promise(done => { resolve = done; }));
  assert.notEqual(page.link(), null);
  assert.notEqual(page.notes(), null);
  page.expire();
  assert.equal(page.link(), null);
  assert.equal(page.notes(), null);
  assert.equal(page.options().signal.aborted, true);
  assert.match(page.availability().message, /temporarily unavailable/);
  resolve({ ok: true, json: async () => ({ client: initial }) });
  await settle();
  assert.equal(page.link(), null);
  assert.equal(page.notes(), null);
  assert.equal(page.timers().size, 0);
});

test('settled and unmounted verification clear the deadline, and download labels identify the target', async () => {
  const page = mount(initial, async () => ({ ok: true, json: async () => ({ client: initial }) }));
  await settle();
  assert.equal(page.timers().size, 0);
  assert.equal(page.link().props['aria-label'], 'Download MineBench Client for Windows x86-64 (EXE)');
  const pending = mount(initial, () => new Promise(() => {}));
  assert.equal(pending.timers().size, 1);
  pending.cleanup();
  assert.equal(pending.timers().size, 0);
});
