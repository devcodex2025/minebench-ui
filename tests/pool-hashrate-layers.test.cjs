const assert = require('node:assert/strict');
const test = require('node:test');

test('hashrate layers preserve a reported BMT/XMR split', async () => {
  const { getHashrateLayers } = await import('../lib/pool-hashrate.ts');
  assert.deepEqual(
    getHashrateLayers({ t: '2026-10-04T00:00:00.000Z', hashrate: 100, bmtHashrate: 40, xmrHashrate: 70, miners: 2 }),
    { total: 110, bmt: 40, xmr: 70 }
  );
});

test('live pool and XMR miners are appended as the current XMR layer', async () => {
  const { mergeLiveMinerHashrate } = await import('../lib/pool-hashrate.ts');
  const points = [{ t: '2026-10-04T00:00:00.000Z', hashrate: 300, bmtHashrate: 300, xmrHashrate: 0, miners: 1 }];
  const merged = mergeLiveMinerHashrate(points, {
    telemetryUpdatedAt: '2026-10-04T00:01:15.000Z',
    miners: 2,
    minerLeaderboard: [
      { minerType: 'pool', miningAsset: 'XMR', hashrate: 3_700 },
      { minerType: 'xmr', miningAsset: 'XMR', hashrate: 500 },
      { minerType: 'minebench', miningAsset: 'BMT', hashrate: 800 }
    ]
  }, new Date('2026-10-04T00:02:00.000Z'));

  assert.equal(merged.length, 2);
  assert.deepEqual(merged[1], {
    t: '2026-10-04T00:01:15.000Z',
    hashrate: 5_000,
    bmtHashrate: 800,
    xmrHashrate: 4_200,
    miners: 2
  });
});

test('live telemetry replaces the matching minute instead of duplicating it', async () => {
  const { mergeLiveMinerHashrate } = await import('../lib/pool-hashrate.ts');
  const merged = mergeLiveMinerHashrate(
    [{ t: '2026-10-04T00:01:00.000Z', hashrate: 100, miners: 1 }],
    {
      telemetryUpdatedAt: '2026-10-04T00:01:30.000Z',
      miners: 1,
      minerLeaderboard: [{ minerType: 'xmr', hashrate: 900 }]
    },
    new Date('2026-10-04T00:02:00.000Z')
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].xmrHashrate, 900);
});

test('stale, old, and implausibly future telemetry are ignored', async () => {
  const { mergeLiveMinerHashrate } = await import('../lib/pool-hashrate.ts');
  const now = new Date('2026-10-04T00:10:00.000Z');
  const liveMiner = { miners: 1, minerLeaderboard: [{ minerType: 'pool', hashrate: 900 }] };

  assert.deepEqual(mergeLiveMinerHashrate([], {
    ...liveMiner,
    telemetryStale: true,
    telemetryUpdatedAt: '2026-10-04T00:09:00.000Z'
  }, now), []);
  assert.deepEqual(mergeLiveMinerHashrate([], {
    ...liveMiner,
    telemetryUpdatedAt: '2026-10-04T00:04:59.000Z'
  }, now), []);
  assert.deepEqual(mergeLiveMinerHashrate([], {
    ...liveMiner,
    telemetryUpdatedAt: '2026-10-04T00:11:01.000Z'
  }, now), []);
});

test('smooth line control points stay inside adjacent vertical bounds', async () => {
  const { buildSmoothLine } = await import('../lib/pool-hashrate.ts');
  const path = buildSmoothLine([
    { x: 0, y: 100 },
    { x: 10, y: 100 },
    { x: 20, y: 0 },
    { x: 30, y: 0 }
  ]);
  const numbers = path.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const yValues = numbers.filter((_, index) => index % 2 === 1);
  assert.equal(yValues.every((value) => value >= 0 && value <= 100), true);
});
