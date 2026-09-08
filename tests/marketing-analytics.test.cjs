const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(readFileSync(require.resolve('../lib/marketingAnalytics.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function loadTracker(pathname) {
  const events = [];
  const sandbox = {
    exports: {},
    window: { location: { pathname, search: '?wallet=private&token=secret' }, dispatchEvent: event => events.push(event.detail) },
    CustomEvent: class { constructor(name, { detail }) { this.type = name; this.detail = detail; } },
  };
  vm.runInNewContext(source, sandbox);
  return { track: sandbox.exports.trackMarketingEvent, events, window: sandbox.window };
}

test('marketing events exclude arbitrary fields, addresses, query parameters and unknown variants', () => {
  const { track, events } = loadTracker('/downloads');
  track('download_selected', { platform: 'windows', arch: 'msi', wallet: 'private', token: 'secret' });
  track('download_selected', { platform: 'wallet-address', arch: 'private-value', placement: 'private-value' });
  assert.equal(JSON.stringify(events), JSON.stringify([
    { event: 'download_selected', page_path: '/downloads', platform: 'windows', arch: 'msi' },
    { event: 'download_selected', page_path: '/downloads' },
  ]));
});

test('wallet callback routes emit nothing and local event history remains bounded', () => {
  const callback = loadTracker('/wallet-connect');
  callback.track('page_viewed');
  assert.equal(callback.events.length, 0);
  const publicPage = loadTracker('/premium');
  for (let i = 0; i < 75; i++) publicPage.track('page_viewed');
  assert.equal(publicPage.window.minebenchEvents.length, 50);
});
