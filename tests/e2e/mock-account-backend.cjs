const http = require('node:http');

const accountId = '11111111-1111-4111-8111-111111111111';
const directSourceId = '44444444-4444-4444-8444-444444444444';
const now = '2026-10-19T12:00:00.000Z';

function send(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  response.end(JSON.stringify(value));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:4310');
  if (url.pathname === '/health') return send(response, 200, { ok: true });

  const token = request.headers.authorization?.replace(/^Bearer /, '');
  if (!token || !['account-test-token', 'other-account-test-token', 'account-binding-test-token', 'account-credential-only-test-token', 'account-unattributed-test-token'].includes(token)) {
    return send(response, 401, { error: 'unauthorized' });
  }
  const userId = token === 'other-account-test-token' ? '22222222-2222-4222-8222-222222222222'
    : token === 'account-binding-test-token' ? '33333333-3333-4333-8333-333333333333' : accountId;
  if (url.pathname === '/api/auth/account-session' && request.method === 'GET') {
    return send(response, 200, { valid: true, user: { id: userId, sessionVersion: 1 }, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() });
  }
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') return send(response, 200, { success: true });
  if (url.pathname === '/api/auth/passkeys' && request.method === 'GET') return send(response, 200, { authenticators: [] });
  if (url.pathname === '/api/auth/xmr/bindings' && request.method === 'GET') return send(response, 200, {
    bindings: token === 'account-binding-test-token' && server.bound ? [server.bound] : []
  });
  if (url.pathname === '/api/auth/xmr/binding/sources' && request.method === 'GET') return send(response, 200, {
    sources: token === 'account-binding-test-token' ? [{ id: directSourceId, rail: 'direct-xmr' }] : []
  });
  if (url.pathname === '/api/auth/xmr/binding/challenge' && request.method === 'POST') {
    let body; try { body = JSON.parse(await new Promise((resolve, reject) => { let raw = ''; request.setEncoding('utf8'); request.on('data', chunk => raw += chunk); request.on('end', () => resolve(raw)); request.on('error', reject); })); }
    catch { return send(response, 400, { error: 'invalid_body' }); }
    if (token !== 'account-binding-test-token' || body.sourceRegistrationId !== directSourceId || typeof body.address !== 'string') return send(response, 400, { error: 'invalid_source' });
    return send(response, 200, { challengeId: 'challenge-1', rail: 'direct-xmr', message: 'MineBench direct-XMR ownership challenge for account 33333333-3333-4333-8333-333333333333', expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(), effectiveAfter: now });
  }
  if (url.pathname === '/api/auth/xmr/binding/verify' && request.method === 'POST') {
    let body; try { body = JSON.parse(await new Promise((resolve, reject) => { let raw = ''; request.setEncoding('utf8'); request.on('data', chunk => raw += chunk); request.on('end', () => resolve(raw)); request.on('error', reject); })); }
    catch { return send(response, 400, { error: 'invalid_body' }); }
    if (token !== 'account-binding-test-token' || body.challengeId !== 'challenge-1' || body.signature !== 'mock-proof-pass') return send(response, 400, { error: 'invalid_proof' });
    server.bound = { bindingSourceId: directSourceId, rail: 'direct-xmr', addressSuffix: '44444444', verifiedAt: now, effectiveAfter: now };
    return send(response, 200, { bound: true, rail: 'direct-xmr', effectiveAfter: now });
  }
  if (url.pathname === '/api/auth/xmr/worker-credential' && request.method === 'POST') {
    if (token !== 'account-binding-test-token') return send(response, 403, { error: 'not_allowed' });
    let body; try { body = JSON.parse(await new Promise((resolve, reject) => { let raw = ''; request.setEncoding('utf8'); request.on('data', chunk => raw += chunk); request.on('end', () => resolve(raw)); request.on('error', reject); })); }
    catch { return send(response, 400, { error: 'invalid_body' }); }
    if (Object.keys(body).length !== 1 || body.sourceRegistrationId !== directSourceId
      && (body.bindingSourceId !== directSourceId || !server.bound)) return send(response, 400, { error: 'invalid_source' });
    return send(response, 200, { rail: 'direct-xmr', rotated: true, password: 'A'.repeat(43),
      ownershipMethod: body.bindingSourceId ? 'monero_spend' : 'account_worker_credential', effectiveAfter: now });
  }

  const stats = url.pathname.match(/^\/api\/stats\/me\/(overview|workers|rewards|payouts)$/);
  if (stats && request.method === 'GET') {
    const mode = url.searchParams.get('mode');
    const tab = stats[1];
    const base = { accountId: userId, asOf: now, freshness: { status: 'fresh', ageSeconds: 1 },
      completeness: { status: 'complete', reasons: [] }, nextCursor: null };
    if (token === 'account-unattributed-test-token' && mode !== 'bmt') {
      if (tab === 'workers') return send(response, 200, { ...base, data: { workers: [{
        workerEpochId: 'ffffffff-ffff-4fff-8fff-ffffffffffff', asset: 'XMR', acceptedEvents: 3,
        acceptedDifficulty: '12600', lastAcceptedAt: now
      }] } });
      return send(response, 200, { ...base, asOf: null, freshness: { status: 'unknown', ageSeconds: null },
        completeness: { status: 'unavailable', reasons: ['ACCOUNT_BOUND_XMR_HISTORY_REQUIRED'] }, data: null });
    }
    if (token === 'account-credential-only-test-token' && mode !== 'bmt') {
      const data = tab === 'overview' ? { balances: { asset: 'XMR', availableAtomic: '6000000000', availableDecimal: '0.006', reservedAtomic: '0', reservedDecimal: '0', decimals: 12 } }
        : tab === 'workers' ? { workers: [{ workerEpochId: 'ffffffff-ffff-4fff-8fff-ffffffffffff', asset: 'XMR', acceptedEvents: 3, acceptedDifficulty: '12600', lastAcceptedAt: now }] }
        : tab === 'rewards' ? { items: [{ id: 'scoped-reward', asset: 'XMR', createdAt: now, amountAtomic: '8000000000', amountDecimal: '0.008', decimals: 12, type: 'MINING_REWARD' }] }
        : { items: [{ id: 'scoped-payout', asset: 'XMR', createdAt: now, amountAtomic: null, amountDecimal: null, decimals: 12, status: 'confirmed', reservedAtomic: '2000000000', settledAtomic: '2000000000', releasedAtomic: '0', completedAt: now }] };
      return send(response, 200, { ...base, completeness: { status: 'partial', reasons: ['UNASSIGNED_AND_LEGACY_XMR_EXCLUDED'] }, data });
    }
    if (mode === 'premium-xmr' || mode === 'direct-xmr') {
      const premium = mode === 'premium-xmr';
      const available = premium ? '1230000000000' : '4560000000000';
      const xmrBase = { ...base, completeness: { status: 'partial', reasons: ['UNASSIGNED_AND_LEGACY_XMR_EXCLUDED'] } };
      let xmrData = null;
      if (tab === 'overview') xmrData = { balances: { asset: 'XMR', availableAtomic: available,
        availableDecimal: premium ? '1.23' : '4.56', reservedAtomic: '250000000000', reservedDecimal: '0.25', decimals: 12 } };
      if (tab === 'workers') xmrData = { workers: [{ workerEpochId: premium ? 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' : 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        asset: 'XMR', acceptedEvents: 2, acceptedDifficulty: '8400', lastAcceptedAt: now }] };
      if (tab === 'rewards') xmrData = { items: [{ id: premium ? 'premium-xmr-reward' : 'direct-xmr-reward', createdAt: now,
        asset: 'XMR', amountAtomic: available, amountDecimal: premium ? '1.23' : '4.56', decimals: 12, type: 'MINING_REWARD' }] };
      if (tab === 'payouts') xmrData = { items: [{ id: premium ? 'premium-xmr-payout' : 'direct-xmr-payout', createdAt: now, asset: 'XMR',
        amountAtomic: null, amountDecimal: null, decimals: 12, status: 'confirmed', reservedAtomic: '250000000000',
        settledAtomic: '200000000000', releasedAtomic: '50000000000', completedAt: now }] };
      return send(response, 200, { ...xmrBase, data: xmrData });
    }
    let data = null;
    if (tab === 'overview') {
      const otherAccount = userId !== accountId;
      data = { balances: { availableAtomic: otherAccount ? '111000000' : '987654321000',
        availableDecimal: otherAccount ? '0.111' : '987.654321', reservedAtomic: '250000000', reservedDecimal: '0.25', decimals: 9, asset: 'BMT' } };
    }
    if (tab === 'workers') data = { workers: [{ workerEpochId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', asset: 'BMT', acceptedEvents: 3, acceptedDifficulty: '6000', lastAcceptedAt: now }] };
    if (tab === 'rewards') data = { items: [{ id: 'reward-1', createdAt: now, asset: 'BMT', amountAtomic: '300000000', amountDecimal: '0.3', decimals: 9, type: 'mining_reward' }] };
    if (tab === 'payouts') data = { items: [{ id: 'payout-1', createdAt: now, asset: 'BMT', amountAtomic: '200000000', amountDecimal: '0.2', decimals: 9, status: 'confirmed', feeAtomic: '10000000', feeDecimal: '0.01' }] };
    return send(response, 200, { ...base, data });
  }
  return send(response, 404, { error: 'not_found' });
});

server.listen(4310, '127.0.0.1');
