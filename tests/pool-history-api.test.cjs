const assert = require('node:assert/strict');
const path = require('node:path');

// QA coverage for the public pool-history API routes of this module (test tooling only — no production
// code). The three handlers are Next.js API routes with no runtime imports (only `import type ... from
// 'next'`, which Node erases), so they can be driven directly with fake `req`/`res` objects and a stubbed
// `fetch`. This is the first test coverage these handlers have; `npm run test:security` only runs
// tests/benchmark-security.test.cjs.
//
// Contract being pinned (from the handlers themselves and their client in
// app/pool-rewards/PoolRewardsClient.tsx / components/PoolHashrateChart.tsx):
//   * GET only, otherwise 405 with an `Allow` header and an empty payload;
//   * `limit` is clamped to [1, 400] and `offset` to >= 0 before being forwarded;
//   * `range` is only forwarded when it is one of 1h/24h/7d/30d (pool-stats-history defaults to 24h);
//   * rows are validated and normalized, malformed rows are dropped, and the result is sorted
//     (blocks/rewards newest first, hashrate points oldest first, capped to the newest 400);
//   * upstream failures map to 502 (or 504 on abort) with the same empty payload shape;
//   * responses are publicly cacheable with a short s-maxage.
//
// Usage (from MineBench-UI):
//   node --test tests/pool-history-api.test.cjs
// Node prints a MODULE_TYPELESS_PACKAGE_JSON warning while importing the `.ts` routes (the package has no
// "type" field); it does not affect the result.

const loadRoute = (file) => import(path.join('..', 'pages', 'api', file).replace(/\\/g, '/')).then((mod) => mod.default);

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

const createReq = (query = {}, method = 'GET') => ({ method, query });

const fakeResponse = (body, { status = 200, ok = true, headers = {} } = {}) => ({
  ok,
  status,
  headers: { get: (name) => headers[String(name).toLowerCase()] ?? null },
  json: async () => body
});

const withFetch = async (impl, run) => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return impl(String(url), init);
  };
  try {
    return { result: await run(), calls };
  } finally {
    globalThis.fetch = original;
  }
};

const failures = [];
const check = (label, actual, expected) => {
  if (actual !== expected) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

const block = (overrides = {}) => ({
  id: 'block-1',
  blockHeight: 3_200_000,
  blockHash: 'abc',
  foundAt: '2026-09-14T10:00:00.000Z',
  foundAtSource: 'p2pool-log',
  finderScope: 'local',
  moneroPayoutStatus: 'received',
  walletPayoutXmr: 0.6,
  payoutDetectedAt: '2026-09-14T10:05:00.000Z',
  accountingStatus: 'credited',
  grossBmt: 100,
  userBmt: 80,
  treasuryBmt: 20,
  distributions: 4,
  paidDistributions: 4,
  creditedDistributions: 4,
  bmtSettlementStatus: 'paid',
  sharedCompensation: null,
  ...overrides
});

const reward = (overrides = {}) => ({
  id: 'reward-1',
  timestamp: '2026-09-14T10:00:00.000Z',
  blockHeight: 3_200_000,
  xmrReward: 0.6,
  grossBmt: 100,
  userBmt: 80,
  treasuryBmt: 20,
  distributions: 4,
  paidDistributions: 4,
  creditedDistributions: 4,
  payoutStatus: 'paid',
  ...overrides
});

(async () => {
  // ---- pool-blocks ------------------------------------------------------------------------------
  const poolBlocks = await loadRoute('pool-blocks.ts');

  {
    const res = createRes();
    await poolBlocks(createReq({}, 'POST'), res);
    check('blocks: non-GET is rejected', res.statusCode, 405);
    check('blocks: non-GET advertises GET', res.headers.allow, 'GET');
    check('blocks: non-GET returns an empty payload', JSON.stringify(res.payload), JSON.stringify({ error: 'Method not allowed', blocks: [], total: 0 }));
  }

  {
    const { result, calls } = await withFetch(
      () => Promise.resolve(fakeResponse({
        blocks: [
          block({ id: 'b-old', foundAt: '2026-09-14T08:00:00.000Z' }),
          block({
            id: 'b-new',
            foundAt: '2026-09-14T12:00:00.000Z',
            sharedCompensation: {
              totalRecipients: 88,
              creditedRecipients: 90,
              paidRecipients: 91
            }
          }),
          block({ id: 'b-no-payout', foundAt: '2026-09-14T11:00:00.000Z', moneroPayoutStatus: 'none' }),
          // Dropped by normalizeBlock: no id, unparsable date, and a non-positive height.
          block({ id: '' }),
          block({ id: 'b-bad-date', foundAt: 'not-a-date' }),
          block({ id: 'b-zero-height', blockHeight: 0 })
        ],
        total: 9,
        generatedAt: '2026-09-14T12:00:00.000Z'
      })),
      () => poolBlocks(createReq({ limit: '9999', offset: '-5', range: '1y' }), createRes())
    );
    check('blocks: upstream status is passed through', result.statusCode, 200);
    check('blocks: malformed rows are dropped', result.payload.blocks.length, 2);
    check('blocks: no-PPLNS-payout rows are hidden', result.payload.blocks.some((row) => row.id === 'b-no-payout'), false);
    check('blocks: newest first', result.payload.blocks[0].id, 'b-new');
    check('blocks: shared compensation total is preserved', result.payload.blocks[0].sharedCompensation.totalRecipients, 88);
    check('blocks: shared credited count is clamped to total', result.payload.blocks[0].sharedCompensation.creditedRecipients, 88);
    check('blocks: shared paid count is clamped to credited', result.payload.blocks[0].sharedCompensation.paidRecipients, 88);
    check('blocks: total comes from upstream', result.payload.total, 9);
    check('blocks: generatedAt is normalized', result.payload.generatedAt, '2026-09-14T12:00:00.000Z');
    check('blocks: limit is clamped to 400', calls[0].url.includes('limit=400'), true);
    check('blocks: negative offset is clamped to 0', calls[0].url.includes('offset=0'), true);
    check('blocks: unknown range is not forwarded', calls[0].url.includes('range='), false);
    check('blocks: only unpaid blocks are requested', calls[0].url.includes('excludeNoPayout=true'), true);
    check('blocks: response is publicly cacheable', typeof result.headers['cache-control'], 'string');
  }

  {
    const { result, calls } = await withFetch(
      () => Promise.resolve(fakeResponse({ blocks: [], total: 0 })),
      () => poolBlocks(createReq({ limit: '0', range: '7d' }), createRes())
    );
    const forwarded = Number(new URL(calls[0].url).searchParams.get('limit'));
    check('blocks: limit stays inside [1,400]', forwarded >= 1 && forwarded <= 400, true);
    check('blocks: allowed range is forwarded', calls[0].url.includes('range=7d'), true);
    check('blocks: empty history is a normal 200', result.statusCode, 200);
    check('blocks: empty history keeps the payload shape', JSON.stringify(result.payload.blocks), '[]');
  }

  {
    const { result } = await withFetch(() => Promise.resolve(fakeResponse({ error: 'nope' }, { status: 503, ok: false })), () => poolBlocks(createReq(), createRes()));
    check('blocks: upstream failure maps to 502', result.statusCode, 502);
    check('blocks: upstream failure keeps the payload shape', JSON.stringify(result.payload.blocks), '[]');
  }

  {
    const { result } = await withFetch(() => Promise.resolve({ ok: true, status: 200, headers: { get: () => null }, json: async () => { throw new Error('not json'); } }), () => poolBlocks(createReq(), createRes()));
    check('blocks: unparsable upstream body maps to 502', result.statusCode, 502);
  }

  {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const { result } = await withFetch(() => Promise.reject(abortError), () => poolBlocks(createReq(), createRes()));
    check('blocks: timeout maps to 504', result.statusCode, 504);
    check('blocks: timeout is reported as a timeout', result.payload.error, 'Pool block history request timed out');
  }

  // ---- pool-rewards -----------------------------------------------------------------------------
  const poolRewards = await loadRoute('pool-rewards.ts');

  {
    const res = createRes();
    await poolRewards(createReq({}, 'PUT'), res);
    check('rewards: non-GET is rejected', res.statusCode, 405);
    check('rewards: non-GET returns an empty payload', JSON.stringify(res.payload), JSON.stringify({ error: 'Method not allowed', rewards: [], total: 0 }));
  }

  {
    const { result } = await withFetch(
      () => Promise.resolve(fakeResponse({
        rewards: [
          reward({ id: 'r-old', timestamp: '2026-09-14T08:00:00.000Z' }),
          reward({ id: 'r-new', timestamp: '2026-09-14T12:00:00.000Z' }),
          reward({ id: 'r-zero-xmr', xmrReward: 0 }),
          reward({ id: '', timestamp: '2026-09-14T12:00:00.000Z' }),
          reward({ id: 'r-bad-paid', paidDistributions: 99 })
        ],
        total: 3
      })),
      () => poolRewards(createReq({ limit: '20' }), createRes())
    );
    check('rewards: zero and id-less rows are dropped', result.payload.rewards.length, 3);
    check('rewards: newest first', result.payload.rewards[0].id, 'r-new');
    const capped = result.payload.rewards.find((item) => item.id === 'r-bad-paid');
    check('rewards: paid distributions cannot exceed distributions', capped.paidDistributions <= capped.distributions, true);
    check('rewards: total is never below the returned page', result.payload.total >= result.payload.rewards.length, true);
  }

  // ---- pool-stats-history -----------------------------------------------------------------------
  const poolHistory = await loadRoute('pool-stats-history.ts');

  {
    const res = createRes();
    await poolHistory(createReq({}, 'DELETE'), res);
    check('history: non-GET is rejected', res.statusCode, 405);
    check('history: non-GET advertises GET', res.headers.allow, 'GET');
  }

  {
    const points = Array.from({ length: 500 }, (_, index) => ({
      t: new Date(Date.UTC(2026, 8, 1, 0, index)).toISOString(),
      hashrate: 1_000 + index,
      miners: 10 + index / 2
    }));
    const { result, calls } = await withFetch(
      () => Promise.resolve(fakeResponse({
        points: [
          ...points,
          { t: 'not-a-date', hashrate: 1, miners: 1 },
          { t: '2026-09-01T00:00:00.000Z', hashrate: -5, miners: -3 }
        ],
        generatedAt: '2026-09-14T12:00:00.000Z'
      })),
      () => poolHistory(createReq({ range: 'bogus' }), createRes())
    );
    check('history: invalid range falls back to 24h', result.payload.range, '24h');
    check('history: the fallback range is forwarded', calls[0].url.includes('range=24h'), true);
    check('history: points are capped to the newest 400', result.payload.points.length, 400);
    check('history: oldest points are the ones dropped', result.payload.points[0].t, new Date(Date.UTC(2026, 8, 1, 0, 100)).toISOString());
    check('history: newest point is kept', result.payload.points[399].t, new Date(Date.UTC(2026, 8, 1, 0, 499)).toISOString());
    check('history: points are in ascending time order', result.payload.points[0].t < result.payload.points[1].t, true);
    check('history: negative hashrate is clamped', result.payload.points.every((point) => point.hashrate >= 0), true);
    check('history: negative miners are clamped', result.payload.points.every((point) => point.miners >= 0), true);
    check('history: miners are integers', result.payload.points.every((point) => Number.isInteger(point.miners)), true);
  }

  {
    const { result } = await withFetch(() => Promise.resolve(fakeResponse({ points: [] })), () => poolHistory(createReq({ range: '30d' }), createRes()));
    check('history: allowed range is echoed', result.payload.range, '30d');
    check('history: missing generatedAt is replaced', Number.isFinite(Date.parse(result.payload.generatedAt)), true);
  }

  assert.deepEqual(failures, [], `pool history API:\n  ${failures.join('\n  ')}`);
  console.log('pool history API tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
