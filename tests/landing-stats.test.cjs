const assert = require('node:assert/strict');

(async () => {
  const { LANDING_STATS_TIMEOUT_MS, landingStatsFromResponses } = await import('../lib/landingStats.ts');

  assert.equal(LANDING_STATS_TIMEOUT_MS, 5_000, 'homepage stat requests keep a bounded timeout');
  assert.deepEqual(landingStatsFromResponses({
    benchmarks: { count: 0, error: null },
    downloads: { data: { total_downloads: 0 }, error: null },
  }), { benchmarks: 0, miners: null, downloads: 0 }, 'real zero counts remain visible');
  assert.deepEqual(landingStatsFromResponses({
    benchmarks: null,
    downloads: { data: null, error: { message: 'request timed out' } },
  }), { benchmarks: null, miners: null, downloads: null }, 'failed or timed-out requests are unavailable');
  assert.deepEqual(landingStatsFromResponses({
    benchmarks: { count: 42, error: null },
    downloads: { data: { total_downloads: '17' }, error: null },
  }), { benchmarks: 42, miners: null, downloads: 17 }, 'exact counts and numeric API values are retained');

  console.log('landing stats tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
