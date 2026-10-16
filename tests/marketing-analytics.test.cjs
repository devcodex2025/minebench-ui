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


function loadBridge(pathname = '/downloads') {
  const sent = [];
  const target = new EventTarget();
  target.location = { origin: 'https://minebench.cloud', pathname };
  target.gtag = (...args) => sent.push(args);
  const sandbox = { exports: {}, window: target, CustomEvent };
  vm.runInNewContext(source, sandbox);
  let allowed = false;
  const unsubscribe = sandbox.exports.subscribeMarketingAnalytics(target, () => allowed);
  return { target, sent, track: sandbox.exports.trackMarketingEvent, allow: value => { allowed = value; }, unsubscribe };
}

test('bridge forwards live consented actions once and never replays diagnostic history', () => {
  const bridge = loadBridge();
  bridge.track('download_selected', { platform: 'windows', arch: 'x64' });
  assert.equal(bridge.sent.length, 0);
  bridge.allow(true);
  assert.equal(bridge.sent.length, 0);
  bridge.track('download_selected', { platform: 'windows', arch: 'x64' });
  assert.equal(bridge.sent.length, 1);
  assert.equal(bridge.sent[0][1], 'download_selected');
  assert.equal(bridge.sent[0][2].page_location, 'https://minebench.cloud/downloads');
  bridge.track('page_viewed');
  assert.equal(bridge.sent.length, 1, 'local page_viewed must not duplicate manual page_view');
  bridge.allow(false);
  bridge.track('download_selected');
  assert.equal(bridge.sent.length, 1, 'revocation stops sending');
  bridge.allow(true);
  bridge.unsubscribe();
  bridge.track('download_selected');
  assert.equal(bridge.sent.length, 1, 'unmount removes the listener');
});

test('guides and DePIN actions are covered without accepting arbitrary guide paths', () => {
  for (const path of ['/guides', '/guides/randomx-benchmarking', '/guides/measure-hashrate-per-watt', '/guides/mining-profitability-calculator', '/guides/verify-minebench-download', '/depin']) {
    const bridge = loadBridge(path);
    bridge.allow(true);
    bridge.track('download_cta_clicked', { placement: 'content' });
    assert.equal(bridge.sent.length, 1, path);
  }
  const bridge = loadBridge('/guides/private-token');
  bridge.allow(true);
  bridge.track('download_cta_clicked');
  assert.equal(bridge.sent.length, 0);
});

test('bridge revalidates custom-event fields and rejects spoofed paths and names', () => {
  const bridge = loadBridge();
  bridge.allow(true);
  const emit = detail => bridge.target.dispatchEvent(new CustomEvent('minebench:analytics', { detail }));
  emit({ event: 'purchase', page_path: '/downloads' });
  emit({ event: 'download_selected', page_path: '/wallet-connect' });
  emit(null);
  assert.equal(bridge.sent.length, 0);
  emit({ event: 'download_selected', page_path: '/downloads', platform: 'wallet-address', arch: 'token', wallet: 'private', placement: 'content' });
  assert.equal(JSON.stringify(bridge.sent[0][2]), JSON.stringify({ page_path: '/downloads', page_location: 'https://minebench.cloud/downloads', placement: 'content' }));
});
