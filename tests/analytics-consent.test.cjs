const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadConsentModule() {
  const source = ts.transpileModule(
    readFileSync(require.resolve('../components/analytics/consent.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
  ).outputText;
  const sandbox = { exports: {}, URL };
  vm.runInNewContext(source, sandbox);
  return sandbox.exports;
}

function createStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: key => store.delete(key),
    _store: store,
  };
}

const consent = loadConsentModule();
const { CONSENT_STORAGE_KEY } = consent;

test('readStoredConsent only accepts explicit granted/denied values', () => {
  assert.equal(consent.readStoredConsent(createStorage()), 'unknown');
  assert.equal(consent.readStoredConsent(createStorage({ [CONSENT_STORAGE_KEY]: 'granted' })), 'granted');
  assert.equal(consent.readStoredConsent(createStorage({ [CONSENT_STORAGE_KEY]: 'denied' })), 'denied');
  assert.equal(consent.readStoredConsent(createStorage({ [CONSENT_STORAGE_KEY]: 'yes' })), 'unknown');
  assert.equal(consent.readStoredConsent(createStorage({ [CONSENT_STORAGE_KEY]: '' })), 'unknown');
});

test('readStoredConsent tolerates blocked storage', () => {
  const blocked = { getItem: () => { throw new Error('SecurityError'); } };
  assert.equal(consent.readStoredConsent(blocked), 'unknown');
});

test('writeConsent persists a decision and clears it for re-consent', () => {
  const storage = createStorage();
  consent.writeConsent(storage, 'denied');
  assert.equal(storage.getItem(CONSENT_STORAGE_KEY), 'denied');
  consent.writeConsent(storage, 'granted');
  assert.equal(storage.getItem(CONSENT_STORAGE_KEY), 'granted');
  consent.writeConsent(storage, null);
  assert.equal(storage.getItem(CONSENT_STORAGE_KEY), null);
});

test('writeConsent does not throw when storage is blocked', () => {
  const blocked = { setItem: () => { throw new Error('QuotaExceededError'); }, removeItem: () => { throw new Error('SecurityError'); } };
  assert.doesNotThrow(() => consent.writeConsent(blocked, 'granted'));
  assert.doesNotThrow(() => consent.writeConsent(blocked, null));
});

test('sanitizedPageLocation strips query strings and hashes', () => {
  const location = { origin: 'https://minebench.cloud', pathname: '/wallet-connect', search: '?callbackUrl=x&state=secret', hash: '#step' };
  assert.equal(consent.sanitizedPageLocation(location), 'https://minebench.cloud/wallet-connect');
  assert.equal(consent.sanitizedPageLocation({ origin: 'https://minebench.cloud', pathname: '/' }), 'https://minebench.cloud/');
});

test('isTrackablePath excludes wallet callback routes only', () => {
  assert.equal(consent.isTrackablePath('/wallet-connect'), false);
  assert.equal(consent.isTrackablePath('/wallet-connect/'), false);
  assert.equal(consent.isTrackablePath('/'), true);
  assert.equal(consent.isTrackablePath('/premium'), true);
  assert.equal(consent.isTrackablePath('/dashboard'), true);
});

test('GA4 is hard-gated behind consent and sends sanitized manual pageviews', () => {
  const component = readFileSync(require.resolve('../components/analytics/GoogleAnalyticsConsent.tsx'), 'utf8');
  assert.match(component, /consent === 'granted'/, 'GA scripts must be gated by granted consent');
  assert.match(component, /send_page_view:\s*false/, 'automatic pageview must be disabled for manual tracking');
  assert.match(component, /sanitizedPageLocation\(window\.location\)/, 'page_location must be sanitized');
  assert.match(component, /isTrackablePath\(pathname\)/, 'excluded routes must be skipped');
  const initialization = component.slice(component.indexOf('id="google-analytics"'));
  assert.ok(
    initialization.indexOf("gtag('consent', 'default'") < initialization.indexOf("gtag('config'"),
    'consent default must be declared before config',
  );
});


test('production analytics excludes previews, development and IQ hosts', () => {
  assert.equal(consent.isProductionAnalyticsHost('minebench.cloud'), true);
  for (const host of ['localhost', '127.0.0.1', 'iq.minebench.cloud', 'preview.minebench.cloud', 'minebench.cloud.evil.test']) {
    assert.equal(consent.isProductionAnalyticsHost(host), false);
  }
});

test('referrers retain attribution origin/path without query or fragment secrets', () => {
  assert.equal(consent.sanitizedReferrer('https://www.google.com/search?q=private#token'), 'https://www.google.com');
  assert.equal(consent.sanitizedReferrer('https://publisher.example/users/alice@example.com?token=private'), 'https://publisher.example');
  assert.equal(consent.sanitizedReferrer('javascript:secret'), '');
  assert.equal(consent.sanitizedReferrer(''), '');
});
