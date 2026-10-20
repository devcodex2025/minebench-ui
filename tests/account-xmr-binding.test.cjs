const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function loadRoute(file, accountServer) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true
  } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === '@/lib/accountServer') return accountServer;
    throw new Error(`Unexpected import ${name}`);
  }, process, Request, Response, URL, URLSearchParams, AbortSignal, TextEncoder, Buffer });
  return module.exports;
}

function fixture() {
  const calls = [];
  const failure = error => Response.json({ error: error.code || 'ACCOUNT_UNAVAILABLE' }, { status: error.status || 503 });
  const server = {
    AccountError: class AccountError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } },
    PRIVATE_HEADERS: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    requireAccountFeature() {}, assertAccountOrigin(request) {
      if (request.headers.get('origin') !== 'https://minebench.cloud') throw { status: 403, code: 'ORIGIN_DENIED' };
    },
    verifiedAccount: async () => ({ token: 'verified-session' }),
    boundedAccountJson: async (request, max) => {
      const value = await request.json();
      if (Buffer.byteLength(JSON.stringify(value), 'utf8') > max) throw { status: 400, code: 'INVALID_SESSION' };
      return value;
    },
    accountFetch: async (route, token, _statistics, init) => {
      calls.push({ route, token, method: init?.method || 'GET', body: init?.body ? JSON.parse(init.body) : undefined });
      return { json: async () => route.endsWith('/sources')
        ? { sources: [{ id: '00000000-0000-4000-8000-000000000001', rail: 'direct-xmr' }] }
        : route.endsWith('/bindings') ? { bindings: [] } : { bound: true, rail: 'direct-xmr', effectiveAfter: '2026-10-18T23:00:00.000Z' } };
    },
    accountFailure: failure
  };
  return { server, calls };
}

test('private XMR source and binding reads require verified account and never cache', async () => {
  const f = fixture();
  const sources = loadRoute('app/(account)/api/account/xmr/binding/sources/route.ts', f.server);
  const bindings = loadRoute('app/(account)/api/account/xmr/bindings/route.ts', f.server);
  const sourceResponse = await sources.GET();
  const bindingResponse = await bindings.GET();
  assert.equal(sourceResponse.status, 200);
  assert.equal(sourceResponse.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await sourceResponse.json(), { sources: [{ id: '00000000-0000-4000-8000-000000000001', rail: 'direct-xmr' }] });
  assert.deepEqual(await bindingResponse.json(), { bindings: [] });
  assert.deepEqual(f.calls.map(call => [call.route, call.token]), [
    ['/api/auth/xmr/binding/sources', 'verified-session'], ['/api/auth/xmr/bindings', 'verified-session']
  ]);
});

test('XMR binding verify enforces same-origin and forwards only the bounded proof over the verified session', async () => {
  const f = fixture();
  const route = loadRoute('app/(account)/api/account/xmr/binding/[action]/route.ts', f.server);
  const body = { challengeId: 'opaque-challenge', message: 'exact proof message', signature: 'SigV2proof' };
  const request = new Request('https://minebench.cloud/api/account/xmr/binding/verify', { method: 'POST',
    headers: { origin: 'https://minebench.cloud', 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const response = await route.POST(request, { params: Promise.resolve({ action: 'verify' }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), { bound: true, rail: 'direct-xmr', effectiveAfter: '2026-10-18T23:00:00.000Z' });
  assert.deepEqual(f.calls[0], { route: '/api/auth/xmr/binding/verify', token: 'verified-session', method: 'POST', body });
});

test('XMR binding BFF denies cross-origin and rejects extra proof fields before upstream access', async () => {
  const f = fixture();
  const route = loadRoute('app/(account)/api/account/xmr/binding/[action]/route.ts', f.server);
  const denied = await route.POST(new Request('https://minebench.cloud/api/account/xmr/binding/challenge', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
  { params: Promise.resolve({ action: 'challenge' }) });
  assert.equal(denied.status, 403);
  const invalid = await route.POST(new Request('https://minebench.cloud/api/account/xmr/binding/verify', {
    method: 'POST', headers: { origin: 'https://minebench.cloud', 'content-type': 'application/json' },
    body: JSON.stringify({ challengeId: 'id', message: 'message', signature: 'sig', accountId: 'attacker' }) }),
  { params: Promise.resolve({ action: 'verify' }) });
  assert.equal(invalid.status, 400);
  assert.equal(f.calls.length, 0);
});

test('verified-address worker credential forwards only the owned binding and validates its proof method', async () => {
  const f = fixture();
  const bindingSourceId = '00000000-0000-4000-8000-000000000003';
  let method = 'monero_spend';
  f.server.accountFetch = async (route, token, _statistics, init) => {
    f.calls.push({ route, token, body: JSON.parse(init.body) });
    return { json: async () => ({ rail: 'direct-xmr', rotated: true, password: 'a'.repeat(43),
      ownershipMethod: method, effectiveAfter: '2026-10-19T12:05:00.000Z' }) };
  };
  const route = loadRoute('app/(account)/api/account/xmr/worker-credential/route.ts', f.server);
  const request = body => new Request('https://minebench.cloud/api/account/xmr/worker-credential', {
    method: 'POST', headers: { origin: 'https://minebench.cloud', 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const response = await route.POST(request({ bindingSourceId }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
  assert.deepEqual(f.calls[0], { route: '/api/auth/xmr/worker-credential', token: 'verified-session', body: { bindingSourceId } });
  const ambiguous = await route.POST(request({ bindingSourceId, sourceRegistrationId: bindingSourceId }));
  assert.equal(ambiguous.status, 400);
  assert.equal(f.calls.length, 1);
  method = 'account_worker_credential';
  assert.equal((await route.POST(request({ bindingSourceId }))).status, 503);
});
