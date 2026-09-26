const assert = require('node:assert/strict');

// New coverage for lib/leaderboard.ts (test tooling only — no production code).
//
// The module has no test in either MineBench-UI or MineBench-UI-refresh, yet it defines how every public
// surface reads the benchmark history: the dashboard summary and its "devices" count, the
// `BenchmarkTable` rows and ranks, and `components/LiveMinerLeaderboard.tsx`. Its contract, as the module
// documents it and its callers rely on:
//   * rows are identified per *device name* (case/whitespace-insensitive), one row per device;
//   * within a device the row with the highest hashrate wins, ties going to the newest timestamp;
//   * rows without a usable hashrate (missing, zero, negative, non-numeric) never appear;
//   * `deviceType` filters case-insensitively when supplied, and is not supplied by the table;
//   * the result is ordered by hashrate, descending;
//   * legacy shapes (`gpuModel`/`hashrate`/`timestamp`) are understood, because the API and older
//     submissions differ in field names.
//
// Usage (from MineBench-UI):
//   node --experimental-loader ./tests/qa-loader.mjs --test tests/leaderboard.test.cjs

(async () => {
  const {
    getBenchmarkHashrate,
    getBenchmarkTimestamp,
    normalizeDeviceName,
    getLeaderboardDeviceKey,
    getLeaderboardRows,
    getLeaderboardDeviceCount
  } = await import('../lib/leaderboard.ts');

  const failures = [];
  const check = (label, actual, expected) => {
    if (actual !== expected) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  };

  const row = (overrides = {}) => ({
    id: 'row',
    device_name: 'AMD Ryzen 9 5950X',
    device_type: 'cpu',
    algorithm: 'RandomX',
    coin_name: 'XMR',
    avg_hashrate: 10_000,
    max_hashrate: 12_000,
    avg_power: 95,
    avg_temp: 70,
    duration_seconds: 300,
    created_at: '2026-09-10T10:00:00.000Z',
    ...overrides
  });

  // ---- field readers ---------------------------------------------------------------------------
  check('reads avg_hashrate', getBenchmarkHashrate(row({ avg_hashrate: 1_234 })), 1_234);
  check('falls back to the legacy hashrate field', getBenchmarkHashrate({ hashrate: 99 }), 99);
  check('coerces a numeric string', getBenchmarkHashrate({ avg_hashrate: '1500' }), 1_500);
  check('missing hashrate reads as 0', getBenchmarkHashrate({}), 0);
  check('non-numeric hashrate reads as 0', getBenchmarkHashrate({ avg_hashrate: 'fast' }), 0);
  check('non-finite hashrate reads as 0', getBenchmarkHashrate({ avg_hashrate: Infinity }), 0);

  check('reads created_at as epoch ms', getBenchmarkTimestamp({ created_at: '2026-09-10T10:00:00.000Z' }), Date.parse('2026-09-10T10:00:00.000Z'));
  check('falls back to the legacy timestamp field', getBenchmarkTimestamp({ timestamp: '2026-09-10T10:00:00.000Z' }), Date.parse('2026-09-10T10:00:00.000Z'));
  check('missing timestamp reads as 0', getBenchmarkTimestamp({}), 0);

  check('trims and collapses a device name', normalizeDeviceName({ device_name: '  AMD   Ryzen 9  ' }), 'AMD Ryzen 9');
  check('falls back to gpuModel', normalizeDeviceName({ gpuModel: 'RTX 4090' }), 'RTX 4090');
  check('falls back to a placeholder', normalizeDeviceName({}), 'Unknown device');
  check('device key is case-insensitive', getLeaderboardDeviceKey({ device_name: 'RTX 4090' }), 'rtx 4090');

  // ---- dedupe and ordering ---------------------------------------------------------------------
  const best = getLeaderboardRows([
    row({ id: 'slow', avg_hashrate: 1_000 }),
    row({ id: 'fast', avg_hashrate: 5_000 }),
    row({ id: 'other', device_name: 'Intel Core i9-13900K', avg_hashrate: 3_000 }),
    row({ id: 'zero', device_name: 'Zero Device', avg_hashrate: 0 }),
    row({ id: 'missing', device_name: 'Missing Device', avg_hashrate: undefined, max_hashrate: undefined }),
    row({ id: 'gpu', device_name: 'RTX 4090', device_type: 'gpu', avg_hashrate: 9_000 })
  ]);
  check('one row per device', best.length, 3);
  check('the highest hashrate of a device wins', best.find((item) => item.device_name === 'AMD Ryzen 9 5950X')?.id, 'fast');
  check('rows are ordered by hashrate descending', best.map((item) => item.id).join(','), 'gpu,fast,other');
  check('rows without a usable hashrate are dropped', best.some((item) => ['zero', 'missing'].includes(item.id)), false);

  const tie = getLeaderboardRows([
    row({ id: 'older', avg_hashrate: 4_000, created_at: '2026-09-01T00:00:00.000Z' }),
    row({ id: 'newer', avg_hashrate: 4_000, created_at: '2026-09-09T00:00:00.000Z' })
  ]);
  check('equal hashrate keeps the newest submission', tie[0].id, 'newer');

  const whitespace = getLeaderboardRows([
    row({ id: 'spaced', device_name: 'AMD  Ryzen 9 5950X', avg_hashrate: 2_000 }),
    row({ id: 'plain', device_name: 'amd ryzen 9 5950x', avg_hashrate: 2_000, created_at: '2026-09-11T00:00:00.000Z' })
  ]);
  check('case and spacing do not create a second device', whitespace.length, 1);

  // ---- device type filter ----------------------------------------------------------------------
  const cpus = getLeaderboardRows([
    row({ id: 'cpu', device_type: 'CPU', avg_hashrate: 2_000 }),
    row({ id: 'gpu', device_name: 'RTX 4090', device_type: 'GPU', avg_hashrate: 8_000 })
  ], 'cpu');
  check('the filter is case-insensitive', cpus.length, 1);
  check('the filter keeps the requested device type', cpus[0].id, 'cpu');
  check('no filter keeps every device', getLeaderboardDeviceCount([
    row({ id: 'cpu', device_type: 'CPU', avg_hashrate: 2_000 }),
    row({ id: 'gpu', device_name: 'RTX 4090', device_type: 'GPU', avg_hashrate: 8_000 })
  ]), 2);

  // ---- legacy shapes ---------------------------------------------------------------------------
  const legacy = getLeaderboardRows([
    { id: 'legacy-1', gpuModel: 'RTX 3080', hashrate: 1_100, timestamp: '2026-09-01T00:00:00.000Z' },
    { id: 'legacy-2', gpuModel: 'RTX 3080', hashrate: 1_400, timestamp: '2026-09-02T00:00:00.000Z' }
  ]);
  check('legacy rows are grouped by gpuModel', legacy.length, 1);
  check('legacy rows keep the best hashrate', legacy[0].id, 'legacy-2');

  check('an empty history yields no rows', getLeaderboardRows([]).length, 0);

  assert.deepEqual(failures, [], `leaderboard:\n  ${failures.join('\n  ')}`);
  console.log('leaderboard tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
