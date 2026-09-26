const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');

// New coverage for MineBench-UI-refresh's benchmark environment metadata (test tooling only — no production
// code). This is the newest behaviour in the module and the only functional difference from
// MineBench-UI's route: `pages/api/benchmarks.ts` accepts the six environment-metadata fields that
// `lib/benchmarkSecurity.js` validates (`os_name`, `os_arch`, `client_version`, `cpu_cores`,
// `ram_total_bytes`, `xmrig_version`) and then deletes exactly those fields from the record unless
// `BENCHMARK_METADATA_ENABLED === 'true'`:
//
//     if (process.env.BENCHMARK_METADATA_ENABLED !== 'true') {
//       for (const field of ['os_name', 'os_arch', 'client_version', 'cpu_cores', 'ram_total_bytes', 'xmrig_version']) delete record[field];
//     }
//
// That gate exists so the metadata columns can be rolled out after the migration
// (`database/migrations/2026-09-12_benchmark_environment_metadata.sql`) is applied: with the flag unset the
// route must still accept and store legacy-style submissions, and it must never write a metadata column.
// This test drives the real handler with a controlled Supabase stub (see `tests/qa-loader.mjs`) and pins:
//   * flag unset → the row is inserted with **none** of the six metadata keys, the core fields intact;
//   * flag `true` → the row keeps all six metadata values unchanged;
//   * either way the wallet comes from the token, the server sets `created_at`, and no private column is
//     added by the route;
//   * the metadata values themselves are still validated (unsafe name, fractional cores, unknown field).
//
// Usage (from MineBench-UI-refresh):
//   node --no-warnings --experimental-loader ./tests/qa-loader.mjs --test tests/benchmarks-metadata-gate.test.cjs

const SECRET = 'qa-refresh-metadata-secret-at-least-32-bytes';
const WALLET = '2C3LWVjZNyMp4dSsrkYPWB7HLhXbgm7CQFoA24nFTaCA';

process.env.JWT_SECRET = SECRET;
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://qa.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'qa-service-role-key';
delete process.env.BENCHMARK_METADATA_ENABLED;

const METADATA_FIELDS = ['os_name', 'os_arch', 'client_version', 'cpu_cores', 'ram_total_bytes', 'xmrig_version'];
const db = { cooldownRows: [], inserted: [], builders: [] };

const builderFor = (table) => {
  const calls = [];
  const resolve = () => {
    const kind = calls[0] && calls[0][0];
    if (kind === 'insert') {
      db.inserted.push({ table, rows: calls[0][1] });
      return { data: { id: 'bench-1', created_at: calls[0][1][0].created_at }, error: null };
    }
    return { data: db.cooldownRows, error: null };
  };
  const builder = {
    select: (...args) => (calls.push(['select', ...args]), builder),
    insert: (...args) => (calls.push(['insert', ...args]), builder),
    eq: (...args) => (calls.push(['eq', ...args]), builder),
    gte: (...args) => (calls.push(['gte', ...args]), builder),
    limit: (...args) => (calls.push(['limit', ...args]), builder),
    order: (...args) => (calls.push(['order', ...args]), builder),
    range: (...args) => (calls.push(['range', ...args]), builder),
    single: () => (calls.push(['single']), Promise.resolve(resolve())),
    then: (onFulfilled, onRejected) => Promise.resolve(resolve()).then(onFulfilled, onRejected),
    catch: (onRejected) => Promise.resolve(resolve()).catch(onRejected)
  };
  builder.__calls = calls;
  builder.__table = table;
  db.builders.push(builder);
  return builder;
};

globalThis.__QA_SUPABASE__ = { from: (table) => builderFor(table) };

const createRes = () => ({
  statusCode: null,
  payload: null,
  headers: {},
  setHeader(key, value) { this.headers[String(key).toLowerCase()] = value; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; }
});

const signToken = (wallet) => {
  const encodedHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify({
    sub: 'user-1', walletAddress: wallet, exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  return `${encodedHeader}.${encodedPayload}.${createHmac('sha256', SECRET).update(`${encodedHeader}.${encodedPayload}`).digest('base64url')}`;
};

const metadata = () => ({
  os_name: 'linux',
  os_arch: 'x86_64',
  client_version: '0.8.33',
  cpu_cores: 16,
  ram_total_bytes: 34359738368,
  xmrig_version: '6.25.0'
});

const body = (overrides = {}) => ({
  avg_hashrate: 12_500,
  max_hashrate: 13_200,
  duration_seconds: 300,
  device_type: 'CPU',
  device_name: 'AMD Ryzen metadata test',
  avg_temp: 70,
  avg_power: 95,
  algorithm: 'RandomX',
  coin_name: 'XMR',
  solana_wallet_address: WALLET,
  device_uid: 'qa-device-0002',
  ...overrides
});

const reset = () => { db.cooldownRows = []; db.inserted.length = 0; db.builders.length = 0; };

(async () => {
  const handler = (await import('../pages/api/benchmarks.ts')).default;
  const failures = [];
  const check = (label, actual, expected) => {
    if (actual !== expected) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  };
  const post = async () => {
    const res = createRes();
    await handler({ method: 'POST', headers: { authorization: `Bearer ${signToken(WALLET)}` }, body: body({ ...metadata() }) }, res);
    return res;
  };

  // ---- flag unset: accept the submission, store no metadata column ---------------------------------
  reset();
  {
    const res = await post();
    check('metadata payload is accepted while the flag is unset', res.statusCode, 201);
    check('exactly one insert happens', db.inserted.length, 1);
    const row = db.inserted[0].rows[0];
    for (const field of METADATA_FIELDS) {
      check(`the ${field} column is not written while the flag is unset`, Object.prototype.hasOwnProperty.call(row, field), false);
    }
    check('legacy fields survive the gate', row.avg_hashrate, 12_500);
    check('the device identifier survives the gate', row.device_uid, 'qa-device-0002');
    check('the wallet still comes from the token', row.solana_wallet_address, WALLET);
    check('the server still sets created_at', Number.isFinite(Date.parse(row.created_at)), true);
  }

  // ---- flag enabled: keep every metadata value ------------------------------------------------------
  reset();
  process.env.BENCHMARK_METADATA_ENABLED = 'true';
  {
    const res = await post();
    check('metadata payload is accepted while the flag is enabled', res.statusCode, 201);
    const row = db.inserted[0].rows[0];
    for (const [field, value] of Object.entries(metadata())) {
      check(`the ${field} column is stored while the flag is enabled`, row[field], value);
    }
    check('core fields survive the enabled gate', row.max_hashrate, 13_200);
    check('the algorithm is normalized while enabled', row.algorithm, 'RandomX');
  }
  delete process.env.BENCHMARK_METADATA_ENABLED;

  // ---- the metadata values are still validated ------------------------------------------------------
  reset();
  {
    const res = createRes();
    await handler({ method: 'POST', headers: { authorization: `Bearer ${signToken(WALLET)}` }, body: body({ os_name: 'user@hostname' }) }, res);
    check('an unsafe os_name is rejected', res.statusCode, 400);
    check('an unsafe os_name inserts nothing', db.inserted.length, 0);
  }
  reset();
  {
    const res = createRes();
    await handler({ method: 'POST', headers: { authorization: `Bearer ${signToken(WALLET)}` }, body: body({ cpu_cores: 1.5 }) }, res);
    check('fractional cpu_cores are rejected', res.statusCode, 400);
    check('fractional cpu_cores insert nothing', db.inserted.length, 0);
  }
  reset();
  {
    const res = createRes();
    await handler({ method: 'POST', headers: { authorization: `Bearer ${signToken(WALLET)}` }, body: body({ hostname: 'private-machine' }) }, res);
    check('an unknown metadata field is rejected', res.statusCode, 400);
    check('an unknown metadata field inserts nothing', db.inserted.length, 0);
  }

  assert.deepEqual(failures, [], `benchmark metadata gate:\n  ${failures.join('\n  ')}`);
  console.log('benchmark metadata gate tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
