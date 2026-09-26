const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');

// New coverage for the public benchmark API's write path (test tooling only — no production code).
//
// `pages/api/benchmarks.ts` is the only endpoint in MineBench-UI that accepts user data, and it has no test:
// `npm run test:security` runs `tests/benchmark-security.test.cjs`, which covers `lib/benchmarkSecurity.js`
// (token verification + payload validation) but never the route that wires those two helpers to Supabase.
// This test drives the real handler with fake `req`/`res` objects and a controlled Supabase stub, and pins
// the properties the route is responsible for:
//   * POST requires a valid backend-issued JWT (401 without one, 401 on a tampered token);
//   * the body's wallet must equal the token's wallet (403), and the inserted row takes the wallet from the
//     token, never from the body;
//   * a preview of the row inserted by a valid request shows the server's own `created_at`, so a client
//     cannot backdate a submission (`lib/benchmarkSecurity.js` never returns the client's `created_at`);
//   * the 60 s per-wallet/device cooldown short-circuits with 429 + `Retry-After` and performs **no insert**;
//   * GET never selects the private columns (`solana_wallet_address`, `device_uid`) and clamps `limit` to
//     [1, 2000] with a 500-row default.
//
// Setup notes: the route builds its Supabase client at module scope, so the stub and the env vars must exist
// before the dynamic import; `@supabase/supabase-js` itself is replaced by `tests/qa-loader.mjs`.
//
// Usage (from MineBench-UI):
//   node --no-warnings --experimental-loader ./tests/qa-loader.mjs --test tests/benchmarks-api.test.cjs

const SECRET = 'qa-benchmark-secret-that-is-at-least-32-bytes-long';
const WALLET = '2C3LWVjZNyMp4dSsrkYPWB7HLhXbgm7CQFoA24nFTaCA';
// A second, distinct Solana-shaped address: 44 base58 characters, none of the characters base58 excludes.
// (`benchmark-security.test.cjs` uses `7YWHMfk9JZe0LM0g1RVhWnJuBmgZ2Q6E2M1XgRGpQHLv` for its wallet-binding
// case, but that string contains `0`, which `verifyBenchmarkToken` rejects before the comparison, so it
// cannot exercise the route's 403 path.)
const OTHER_WALLET = '7YWHMfk9JZe1LM1g1RVhWnJuBmgZ2Q6E2M1XgRGpQHLv';

process.env.JWT_SECRET = SECRET;
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://qa.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'qa-service-role-key';
delete process.env.BENCHMARK_METADATA_ENABLED;

// ---- controlled Supabase stub ---------------------------------------------------------------------
const db = {
  cooldownRows: [],
  inserted: [],
  selectRows: [],
  builders: []
};

const builderFor = (table) => {
  const calls = [];
  const resolve = () => {
    const kind = calls[0] && calls[0][0];
    if (kind === 'insert') {
      const rows = calls[0][1];
      db.inserted.push({ table, rows });
      return { data: { id: 'bench-1', created_at: rows[0].created_at }, error: null };
    }
    return { data: table === 'benchmarks' && calls[0] && calls[0][0] === 'select' && calls.some(([name]) => name === 'order') ? db.selectRows : db.cooldownRows, error: null };
  };
  const builder = {
    select: (...args) => (calls.push(['select', ...args]), builder),
    insert: (...args) => (calls.push(['insert', ...args]), builder),
    eq: (...args) => (calls.push(['eq', ...args]), builder),
    gte: (...args) => (calls.push(['gte', ...args]), builder),
    neq: (...args) => (calls.push(['neq', ...args]), builder),
    limit: (...args) => (calls.push(['limit', ...args]), builder),
    order: (...args) => (calls.push(['order', ...args]), builder),
    range: (...args) => (calls.push(['range', ...args]), builder),
    single: () => (calls.push(['single']), Promise.resolve(resolve())),
    maybeSingle: () => Promise.resolve(resolve()),
    then: (onFulfilled, onRejected) => Promise.resolve(resolve()).then(onFulfilled, onRejected),
    catch: (onRejected) => Promise.resolve(resolve()).catch(onRejected)
  };
  builder.__calls = calls;
  builder.__table = table;
  db.builders.push(builder);
  return builder;
};

globalThis.__QA_SUPABASE__ = { from: (table) => builderFor(table) };

// ---- request/response helpers ---------------------------------------------------------------------
const createRes = () => ({
  statusCode: null,
  payload: null,
  headers: {},
  setHeader(key, value) {
    this.headers[String(key).toLowerCase()] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return this;
  }
});

const signToken = (payload, header = { alg: 'HS256', typ: 'JWT' }) => {
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', SECRET).update(`${encodedHeader}.${encodedPayload}`).digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const validToken = (wallet = WALLET) => signToken({ sub: 'user-1', walletAddress: wallet, exp: Math.floor(Date.now() / 1000) + 3600 });

const validBody = (overrides = {}) => ({
  avg_hashrate: 12_500,
  max_hashrate: 13_200,
  duration_seconds: 300,
  device_type: 'CPU',
  device_name: 'AMD Ryzen QA test',
  avg_temp: 70,
  avg_power: 95,
  algorithm: 'RandomX',
  coin_name: 'XMR',
  solana_wallet_address: WALLET,
  device_uid: 'qa-device-0001',
  created_at: '2000-01-01T00:00:00.000Z',
  ...overrides
});

const resetDb = ({ cooldown = [], selectRows = [] } = {}) => {
  db.cooldownRows = cooldown;
  db.selectRows = selectRows;
  db.inserted.length = 0;
  db.builders.length = 0;
};

const insertCalls = () => db.builders.filter((builder) => builder.__calls[0] && builder.__calls[0][0] === 'insert');
const selectCalls = () => db.builders.filter((builder) => builder.__calls[0] && builder.__calls[0][0] === 'select');

(async () => {
  const handler = (await import('../pages/api/benchmarks.ts')).default;

  const failures = [];
  const check = (label, actual, expected) => {
    if (actual !== expected) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  };

  // ---- authentication ---------------------------------------------------------------------------
  resetDb();
  {
    const res = createRes();
    await handler({ method: 'POST', headers: {}, body: validBody() }, res);
    check('POST without a token is rejected', res.statusCode, 401);
    check('POST without a token is reported as unauthorized', res.payload.error, 'Authentication required');
    check('POST without a token touches no table', db.builders.length, 0);
  }
  {
    const res = createRes();
    await handler({ method: 'POST', headers: { authorization: `Bearer ${validToken()}x` }, body: validBody() }, res);
    check('POST with a tampered token is rejected', res.statusCode, 401);
    check('POST with a tampered token inserts nothing', insertCalls().length, 0);
  }
  {
    const res = createRes();
    await handler({ method: 'POST', headers: { authorization: `Bearer ${validToken(OTHER_WALLET)}` }, body: validBody() }, res);
    check('a body wallet that differs from the token is rejected', res.statusCode, 403);
    check('a mismatched wallet inserts nothing', insertCalls().length, 0);
  }

  // ---- cooldown ---------------------------------------------------------------------------------
  resetDb({ cooldown: [{ id: 'recent-row' }] });
  {
    const res = createRes();
    await handler({ method: 'POST', headers: { authorization: `Bearer ${validToken()}` }, body: validBody() }, res);
    check('a submission inside the cooldown is rate limited', res.statusCode, 429);
    check('the cooldown advertises the retry delay', res.headers['retry-after'], '60');
    check('the cooldown performs no insert', insertCalls().length, 0);
    const cooldownQuery = selectCalls()[0];
    check('the cooldown is scoped to the wallet', cooldownQuery.__calls.some(([name, column, value]) => name === 'eq' && column === 'solana_wallet_address' && value === WALLET), true);
    check('the cooldown is scoped to the device', cooldownQuery.__calls.some(([name, column, value]) => name === 'eq' && column === 'device_uid' && value === 'qa-device-0001'), true);
    check('the cooldown window is bounded', cooldownQuery.__calls.some(([name, column]) => name === 'gte' && column === 'created_at'), true);
  }

  // ---- accepted submission ----------------------------------------------------------------------
  resetDb();
  {
    const res = createRes();
    await handler({ method: 'POST', headers: { authorization: `Bearer ${validToken()}` }, body: validBody() }, res);
    check('a valid submission is accepted', res.statusCode, 201);
    check('a valid submission is reported as successful', res.payload.success, true);
    const insert = insertCalls()[0];
    check('exactly one insert happens', insertCalls().length, 1);
    const row = db.inserted[0].rows[0];
    check('the stored wallet comes from the token', row.solana_wallet_address, WALLET);
    check('the client created_at is discarded', row.created_at === '2000-01-01T00:00:00.000Z', false);
    check('the server sets created_at', Number.isFinite(Date.parse(row.created_at)) && Date.parse(row.created_at) > Date.parse('2026-01-01T00:00:00.000Z'), true);
    check('the validated hashrate is stored', row.avg_hashrate, 12_500);
    check('the device identifier is stored', row.device_uid, 'qa-device-0001');
    check('the algorithm is normalized', row.algorithm, 'RandomX');
    check('no private column is added by the route', Object.keys(row).includes('id'), false);
  }
  resetDb();
  {
    const res = createRes();
    await handler({ method: 'POST', headers: { authorization: `Bearer ${validToken()}` }, body: { ...validBody(), admin: true } }, res);
    check('unsupported fields are rejected before the database is touched', res.statusCode, 400);
    check('unsupported fields insert nothing', insertCalls().length, 0);
  }
  resetDb();
  {
    const res = createRes();
    await handler({ method: 'POST', headers: { authorization: `Bearer ${validToken()}` }, body: { ...validBody(), avg_hashrate: 999_999, max_hashrate: 999_999 } }, res);
    check('an implausible hashrate is rejected', res.statusCode, 400);
    check('an implausible hashrate inserts nothing', insertCalls().length, 0);
  }

  // ---- public read ------------------------------------------------------------------------------
  resetDb({ selectRows: [{ id: 'bench-1', avg_hashrate: 12_500 }] });
  {
    const res = createRes();
    await handler({ method: 'GET', headers: {}, query: {} }, res);
    check('GET returns the rows', res.statusCode, 200);
    check('GET returns a bare array', Array.isArray(res.payload), true);
    const select = selectCalls()[0];
    const columns = String(select.__calls[0][1]);
    check('GET does not expose the wallet column', columns.includes('solana_wallet_address'), false);
    check('GET does not expose the device identifier', columns.includes('device_uid'), false);
    check('GET selects the public fields', ['id', 'device_type', 'device_name', 'avg_hashrate', 'max_hashrate', 'duration_seconds', 'algorithm', 'coin_name', 'created_at', 'avg_power', 'avg_temp'].every((field) => columns.includes(field)), true);
    check('GET uses a 500-row default window', JSON.stringify(select.__calls.find(([name]) => name === 'range').slice(1)), JSON.stringify([0, 499]));
    check('GET orders newest first', JSON.stringify(select.__calls.find(([name]) => name === 'order').slice(1)), JSON.stringify(['created_at', { ascending: false }]));
  }
  resetDb({ selectRows: [] });
  {
    const res = createRes();
    await handler({ method: 'GET', headers: {}, query: { limit: '99999' } }, res);
    const select = selectCalls()[0];
    check('GET clamps an oversized limit', JSON.stringify(select.__calls.find(([name]) => name === 'range').slice(1)), JSON.stringify([0, 1999]));
  }
  resetDb({ selectRows: [] });
  {
    const res = createRes();
    await handler({ method: 'GET', headers: {}, query: { limit: '-5' } }, res);
    const select = selectCalls()[0];
    check('GET falls back to the default for a non-positive limit', JSON.stringify(select.__calls.find(([name]) => name === 'range').slice(1)), JSON.stringify([0, 499]));
  }

  // ---- method handling --------------------------------------------------------------------------
  resetDb();
  {
    const res = createRes();
    await handler({ method: 'DELETE', headers: {}, query: {} }, res);
    check('an unsupported method is rejected', res.statusCode, 405);
    check('an unsupported method advertises the allowed ones', res.headers.allow, 'GET, POST');
    check('an unsupported method touches no table', db.builders.length, 0);
  }

  assert.deepEqual(failures, [], `benchmarks API:\n  ${failures.join('\n  ')}`);
  console.log('benchmarks API tests passed');
})().catch((error) => {
  // Surface the checks collected before an unexpected throw (a fixture that does not match the route's
  // chain, for instance) instead of only the throw itself.
  console.error(error);
  process.exitCode = 1;
});
