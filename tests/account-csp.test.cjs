const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadCspModule() {
  const source = ts.transpileModule(
    readFileSync(require.resolve('../lib/accountCsp.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
  ).outputText;
  const sandbox = { exports: {}, URL, crypto, btoa, process };
  vm.runInNewContext(source, sandbox);
  return sandbox.exports;
}

const csp = loadCspModule();

test('account CSP nonces are fresh and unpredictable per request', () => {
  const first = csp.createAccountCspNonce();
  const second = csp.createAccountCspNonce();
  assert.match(first, /^[A-Za-z0-9+/]{20,24}={0,2}$/);
  assert.notEqual(first, second);
});

test('production account CSP allows only HTTPS API origin without URL credentials or suffix data', () => {
  const valid = csp.buildAccountContentSecurityPolicy('abcdefghijklmnop1234==', 'https://backend.minebench.cloud/api', 'production');
  assert.match(valid, /connect-src 'self' https:\/\/backend\.minebench\.cloud/);
  for (const apiUrl of ['https://attacker.example', 'https://backend.minebench.cloud:444', 'http://backend.minebench.cloud', 'https://user:pass@backend.minebench.cloud',
    'https://backend.minebench.cloud?token=secret', 'https://backend.minebench.cloud#fragment', 'not a URL']) {
    const policy = csp.buildAccountContentSecurityPolicy('abcdefghijklmnop1234==', apiUrl, 'production');
    assert.match(policy, /connect-src 'self' https:\/\/backend\.minebench\.cloud/);
  }
  assert.equal(csp.resolveAccountApiOrigin('https://attacker.example', 'production'), 'https://backend.minebench.cloud');
  assert.equal(csp.resolveAccountApiOrigin('https://backend.minebench.cloud/api', 'production'), 'https://backend.minebench.cloud');
});

test('loopback HTTP is available only outside production and CSP has no third-party allowances', () => {
  const development = csp.buildAccountContentSecurityPolicy('abcdefghijklmnop1234==', 'http://localhost:3001', 'development');
  const production = csp.buildAccountContentSecurityPolicy('abcdefghijklmnop1234==', 'http://localhost:3001', 'production');
  assert.match(development, /connect-src 'self' http:\/\/localhost:3001/);
  assert.match(production, /connect-src 'self' https:\/\/backend\.minebench\.cloud/);
  assert.doesNotMatch(production, /unsafe-inline|googletagmanager|google-analytics/);
});
