const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function loadRoute(file, deps) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true
  } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === 'next/headers') return deps.headers;
    if (name === '@/lib/accountServer') return deps.accountServer;
    throw new Error(`Unexpected import ${name}`);
  }, process, Request, Response, URL, URLSearchParams, AbortSignal, TextEncoder, Buffer });
  return module.exports;
}

function loadAccountServer({ cookie = null, upstream } = {}) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'lib/accountServer.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const headers = { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined }) };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === 'server-only') return {};
    if (name === 'next/headers') return headers;
    throw new Error(`Unexpected import ${name}`);
  }, process, fetch: upstream, Request, Response, Headers, URL, URLSearchParams, AbortSignal, TextEncoder, Buffer, setTimeout, clearTimeout });
  return module.exports;
}

function fixture() {
  let cookie = 'old-token';
  const setCalls = [];
  const calls = [];
  const errors = [];
  const accountError = class AccountError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } };
  const accountServer = {
    ACCOUNT_COOKIE: '__Host-minebench-account', PRIVATE_HEADERS: { 'Cache-Control': 'private, no-store' },
    AccountError: accountError, requireAccountFeature: () => {}, assertAccountOrigin: () => {},
    boundedAccountJson: async request => JSON.parse(await request.text()),
    verifiedAccount: async token => {
      token ??= cookie;
      calls.push(['verify', token]);
      if (token === 'old-token') return { token, id: '00000000-0000-0000-0000-000000000001', sessionVersion: 1, expiresAt: new Date(Date.now() + 600000).toISOString() };
      if (token === 'new-token') return { token, id: '00000000-0000-0000-0000-000000000002', sessionVersion: 2, expiresAt: new Date(Date.now() + 600000).toISOString() };
      throw new accountError(401, 'ACCOUNT_AUTHENTICATION_REQUIRED');
    },
    accountFetch: async (path, token, _statistics, init) => {
      calls.push([path, token, init?.method]);
      if (path === '/api/auth/logout') {
        if (errors.includes('logout')) throw new Error('IAM outage');
        return { json: async () => ({ success: true }) };
      }
      throw new Error(`Unexpected fetch ${path}`);
    },
    accountFailure: error => Response.json({ error: error.code || 'ACCOUNT_UNAVAILABLE' }, { status: error.status || 503 })
  };
  const headers = { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined, set: (...args) => { setCalls.push(args); cookie = args[1]; } }) };
  return { accountServer, headers, setCalls, calls, errors, set cookie(value) { cookie = value; }, get cookie() { return cookie; } };
}

test('account switch revokes the previous account before setting a strict private cookie', async () => {
  const f = fixture();
  const route = loadRoute('app/(account)/api/account/session/route.ts', f);
  const body = JSON.stringify({ token: 'new-token' });
  const response = await route.POST(new Request('https://minebench.cloud/api/account/session', { method: 'POST', headers: { origin: 'https://minebench.cloud', 'content-type': 'application/json', 'content-length': String(body.length) }, body }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { valid: true });
  assert.equal(f.calls.find(call => call[0] === '/api/auth/logout')[1], 'old-token');
  assert.equal(f.setCalls[0][0], '__Host-minebench-account');
  assert.deepEqual(f.setCalls[0][2].sameSite, 'strict');
  assert.equal(f.setCalls[0][2].httpOnly, true);
});

test('logout revokes upstream session and clears the private cookie', async () => {
  const f = fixture();
  const route = loadRoute('app/(account)/api/account/logout/route.ts', f);
  const response = await route.POST(new Request('https://minebench.cloud/api/account/logout', { method: 'POST', headers: { origin: 'https://minebench.cloud' } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(f.calls.find(call => call[0] === '/api/auth/logout')[1], 'old-token');
  assert.equal(f.setCalls[0][0], '__Host-minebench-account');
  assert.equal(f.setCalls[0][2].maxAge, 0);
});

test('logout and account switching retain the cookie when upstream revocation fails', async () => {
  for (const file of ['app/(account)/api/account/logout/route.ts', 'app/(account)/api/account/session/route.ts']) {
    const f = fixture(); f.errors.push('logout');
    // The route reads the current cookie through verifiedAccount() with no argument.
    const original = f.accountServer.verifiedAccount;
    f.accountServer.verifiedAccount = value => original(value ?? f.cookie);
    const route = loadRoute(file, f);
    const response = await route.POST(new Request('https://minebench.cloud/api/account', { method: 'POST',
      headers: { origin: 'https://minebench.cloud', 'content-type': 'application/json' }, body: JSON.stringify({ token: 'new-token' }) }));
    assert.equal(response.status, 503);
    assert.equal(f.cookie, 'old-token');
    assert.equal(f.setCalls.length, 0);
  }
});

test('oversized or malformed session input is rejected before verification', async () => {
  const f = fixture();
  const route = loadRoute('app/(account)/api/account/session/route.ts', f);
  const response = await route.POST(new Request('https://minebench.cloud/api/account/session', { method: 'POST', headers: { origin: 'https://minebench.cloud', 'content-type': 'application/json' }, body: JSON.stringify({ token: 'new-token', extra: 'x' }) }));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'INVALID_SESSION' });
  assert.equal(f.calls.length, 0);
});

test('real account server rejects cross-origin requests and feature-disabled access', async () => {
  const previous = { ...process.env };
  process.env.MINING_STATISTICS_ENABLED = 'true'; process.env.ACCOUNT_WEB_ORIGIN = 'https://minebench.cloud';
  const server = loadAccountServer();
  assert.throws(() => server.assertAccountOrigin(new Request('https://minebench.cloud/api', { headers: { origin: 'https://evil.example' } })), error => error.code === 'ORIGIN_DENIED');
  assert.doesNotThrow(() => server.assertAccountOrigin(new Request('https://minebench.cloud/api', { headers: { 'sec-fetch-site': 'same-origin' } })));
  assert.throws(() => server.assertAccountOrigin(new Request('https://minebench.cloud/api', { headers: { 'sec-fetch-site': 'cross-site' } })), error => error.code === 'ORIGIN_DENIED');
  for (const fetchSite of ['same-site', 'none']) {
    assert.throws(() => server.assertAccountOrigin(new Request('https://minebench.cloud/api', { headers: { 'sec-fetch-site': fetchSite } })), error => error.code === 'ORIGIN_DENIED');
  }
  assert.throws(() => server.assertAccountOrigin(new Request('https://minebench.cloud/api')), error => error.code === 'ORIGIN_DENIED');
  assert.throws(() => server.assertAccountOrigin(new Request('https://minebench.cloud/api', { headers: { origin: 'https://minebench.cloud', 'sec-fetch-site': 'cross-site' } })), error => error.code === 'ORIGIN_DENIED');
  assert.throws(() => server.assertAccountOrigin(new Request('https://minebench.cloud/api', { method: 'POST', headers: { 'sec-fetch-site': 'same-origin' } })), error => error.code === 'ORIGIN_DENIED');
  assert.throws(() => server.assertAccountOrigin(new Request('https://minebench.cloud/api', { method: 'DELETE', headers: { 'sec-fetch-site': 'same-origin' } })), error => error.code === 'ORIGIN_DENIED');
  process.env.MINING_STATISTICS_ENABLED = 'false';
  assert.throws(() => server.requireAccountFeature(), error => error.status === 404 && error.code === 'NOT_FOUND');
  process.env = previous;
});

test('real account server enforces streamed body limit before JSON use', async () => {
  const server = loadAccountServer();
  const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"token":"' + 'x'.repeat(9000) + '"}')); controller.close(); } });
  await assert.rejects(() => server.boundedAccountJson(new Request('https://minebench.cloud', { method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half' })), error => error.code === 'INVALID_SESSION');
});

test('real account server rejects malformed and expired IAM responses', async () => {
  process.env.MINING_STATISTICS_ENABLED = 'true'; process.env.ACCOUNT_IAM_ORIGIN = 'https://iam.minebench.cloud';
  for (const data of [{ valid: false }, { valid: true, user: { id: 'bad', sessionVersion: 1 }, expiresAt: new Date(Date.now() + 10000).toISOString() }, { valid: true, user: { id: '00000000-0000-0000-0000-000000000001', sessionVersion: 1 }, expiresAt: new Date(Date.now() - 10000).toISOString() }]) {
    const server = loadAccountServer({ cookie: 'token', upstream: async url => { assert.equal(url, 'https://iam.minebench.cloud/api/auth/account-session'); return { ok: true, json: async () => data }; } });
    await assert.rejects(() => server.verifiedAccount(), error => error.code === 'ACCOUNT_AUTHENTICATION_REQUIRED');
  }
});

test('real account server uses fixed upstream origin, bearer auth, no-store and redirect rejection', async () => {
  process.env.MINING_STATISTICS_ENABLED = 'true'; process.env.ACCOUNT_STATISTICS_ORIGIN = 'https://stats.minebench.cloud';
  const seen = [];
  const server = loadAccountServer({ upstream: async (url, init) => { seen.push([url, init]); return { ok: true, json: async () => ({ ok: true }) }; } });
  const response = await server.accountFetch('/api/stats/me/overview?mode=bmt', 'token_123', true);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(seen[0][0], 'https://stats.minebench.cloud/api/stats/me/overview?mode=bmt');
  assert.equal(seen[0][1].headers.get('authorization'), 'Bearer token_123');
  assert.equal(seen[0][1].cache, 'no-store');
  assert.equal(seen[0][1].redirect, 'error');
});

test('passkey BFF forwards a fixed login action and returns private no-store challenge data', async () => {
  const calls = [];
  const accountServer = {
    requireAccountFeature() {}, assertAccountOrigin() {},
    accountPublicFetch: async (path, init) => { calls.push([path, init]); return { json: async () => ({ challengeId: 'challenge-id', options: { challenge: 'opaque' } }) }; },
    accountFailure: error => Response.json({ error: error.code || 'failed' }, { status: error.status || 503 }),
    PRIVATE_HEADERS: { 'Cache-Control': 'private, no-store' }
  };
  const route = loadRoute('app/(account)/api/account/passkey/[action]/route.ts', {
    headers: {}, accountServer
  });
  const response = await route.POST(new Request('https://minebench.cloud/api/account/passkey/login-options', {
    method: 'POST', headers: { origin: 'https://minebench.cloud' }
  }), { params: Promise.resolve({ action: 'login-options' }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), { challengeId: 'challenge-id', options: { challenge: 'opaque' } });
  assert.equal(calls[0][0], '/api/auth/passkey/login/options');
  assert.equal(calls[0][1].method, 'POST');
});

test('passkey BFF keeps verified bearer tokens in the HttpOnly session cookie', async () => {
  const calls = [];
  const accountServer = {
    requireAccountFeature() {}, assertAccountOrigin() {},
    boundedAccountJson: async request => JSON.parse(await request.text()),
    accountPublicFetch: async (path, init) => { calls.push([path, JSON.parse(init.body)]); return { json: async () => ({ token: 'private-jwt' }) }; },
    establishAccountSession: async token => { calls.push(['cookie', token]); return { id: 'user-id' }; },
    accountFailure: error => Response.json({ error: error.code || 'failed' }, { status: error.status || 503 }),
    PRIVATE_HEADERS: { 'Cache-Control': 'private, no-store' }
  };
  const route = loadRoute('app/(account)/api/account/passkey/[action]/route.ts', { headers: {}, accountServer });
  const body = JSON.stringify({ challengeId: 'challenge-id', credential: { type: 'public-key' } });
  const response = await route.POST(new Request('https://minebench.cloud/api/account/passkey/login-verify', {
    method: 'POST', headers: { origin: 'https://minebench.cloud', 'content-type': 'application/json', 'content-length': String(body.length) }, body
  }), { params: Promise.resolve({ action: 'login-verify' }) });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload, { valid: true });
  assert.equal(JSON.stringify(payload).includes('private-jwt'), false);
  assert.equal(calls[0][0], '/api/auth/passkey/login/verify');
  assert.deepEqual(calls[1], ['cookie', 'private-jwt']);
});

test('passkey settings BFF authorizes private reads and clears the cookie after revocation', async () => {
  const calls = [];
  let cleared = false;
  const accountServer = {
    ACCOUNT_COOKIE: '__Host-minebench-account', PRIVATE_HEADERS: { 'Cache-Control': 'private, no-store' },
    requireAccountFeature() {}, assertAccountOrigin() {}, verifiedAccount: async () => ({ token: 'private-jwt' }),
    accountFetch: async (path, token, _statistics, init = {}) => { calls.push([path, token, init.method || 'GET']);
      return { json: async () => path.endsWith('/passkeys')
        ? { authenticators: [{ id: '00000000-0000-4000-8000-000000000001', createdAt: '2026-01-01T00:00:00.000Z', transports: [] }] }
        : { revoked: true } }; },
    accountFailure: error => Response.json({ error: error.code || 'failed' }, { status: error.status || 503 })
  };
  const headers = { cookies: async () => ({ delete: name => { assert.equal(name, '__Host-minebench-account'); cleared = true; } }) };
  const get = loadRoute('app/(account)/api/account/passkeys/route.ts', { headers, accountServer });
  const listed = await get.GET(new Request('https://minebench.cloud/api/account/passkeys', { headers: { origin: 'https://minebench.cloud' } }));
  assert.equal(listed.status, 200);
  assert.equal(listed.headers.get('cache-control'), 'private, no-store');
  assert.equal((await listed.json()).authenticators.length, 1);

  const revoke = loadRoute('app/(account)/api/account/passkeys/[authenticatorId]/route.ts', { headers, accountServer });
  const removed = await revoke.DELETE(new Request('https://minebench.cloud/api/account/passkeys/id', {
    method: 'DELETE', headers: { origin: 'https://minebench.cloud' }
  }), { params: Promise.resolve({ authenticatorId: '00000000-0000-4000-8000-000000000001' }) });
  assert.equal(removed.status, 200);
  assert.deepEqual(await removed.json(), { revoked: true });
  assert.equal(cleared, true);
  assert.deepEqual(calls, [
    ['/api/auth/passkeys', 'private-jwt', 'GET'],
    ['/api/auth/passkeys/00000000-0000-4000-8000-000000000001', 'private-jwt', 'DELETE']
  ]);
});
