const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// QA reproduction for the dashboard's "Recent Activity" panel (test tooling only — no production code).
//
// app/dashboard/DashboardClient.tsx fetches `/api/benchmarks` **without a limit**, so the payload is the
// API's default page (DEFAULT_LIMIT = 500 rows, pages/api/benchmarks.ts:12). The same handler builds
// `cpuRows = getLeaderboardRows(benchmarkPayload, 'cpu')` (deduplicated best-row-per-CPU-device) and uses
// it for the summary cards and the leaderboard count, but the panel that lists submissions is fed the raw
// payload:
//
//     const cpuRows = getLeaderboardRows(benchmarkPayload, 'cpu');
//     setTests(benchmarkPayload);            // <- raw rows (up to 500)
//     ...
//     {summary && <StatsCards summary={summary} />}
//     <RecentTests tests={tests} />
//
// `RecentTests` (components/StatsCards.tsx:109-189) renders *every* entry it receives and staggers them
// linearly with the row index (`transition={{ delay: index * 0.05 }}`, :150). With the API's own page
// size the last row therefore starts animating 499 × 50 ms ≈ 25 s after render, in a panel that mixes
// GPU/KawPow submissions and repeated submissions of the same device into a page whose figures come from
// the deduplicated CPU rows. MineBench-UI-refresh carries the same panel but feeds it `cpuRows`
// (`setTests(cpuRows)`), i.e. the newer copy fixed the wiring while keeping the linear stagger.
//
// This test pins the invariants that make the panel safe regardless of how many rows the API returns:
//   1. the list is fed the same deduplicated CPU rows the rest of the page uses;
//   2. the number of rendered rows is capped;
//   3. the per-row stagger stays inside a second for the whole page size.
//
// Usage (from MineBench-UI):
//   node --test tests/dashboard-recent-tests.test.cjs

const ROOT = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const dashboard = read(path.join('app', 'dashboard', 'DashboardClient.tsx'));
const statsCards = read(path.join('components', 'StatsCards.tsx'));
const benchmarksApi = read(path.join('pages', 'api', 'benchmarks.ts'));

const failures = [];
const check = (label, actual, expected) => {
  if (actual !== expected) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

// Ground the impact: the dashboard's request has no `limit`, so the API's default page size bounds the array.
const defaultLimit = Number((benchmarksApi.match(/DEFAULT_LIMIT\s*=\s*([\d_]+)/) || [])[1]?.replace(/_/g, ''));
check('contrast: the benchmark API page size is 500', defaultLimit, 500);

// 1. The panel must receive the deduplicated CPU rows used by every other surface on the page.
check('the recent-tests panel is fed the deduplicated CPU rows', /setTests\(\s*cpuRows\s*\)/.test(dashboard), true);

// 2. The panel must cap how many rows it renders.
const capMatch = statsCards.match(/\.slice\(\s*-\s*(\d+)\s*\)|\.slice\(\s*0\s*,\s*(\d+)\s*\)/);
check('the recent-tests panel caps the number of rendered rows', Boolean(capMatch), true);

// 3. The stagger must stay bounded for a full page of rows.
const staggerMatch = statsCards.match(/delay:\s*index\s*\*\s*([\d.]+)/);
const staggerSeconds = staggerMatch ? Number(staggerMatch[1]) : 0;
const renderedRows = capMatch ? Number(capMatch[1] || capMatch[2]) : defaultLimit;
const worstCaseSeconds = Number(((renderedRows - 1) * staggerSeconds).toFixed(2));
check(
  `the last of ${renderedRows} rows animates in within 1s (worst case ${worstCaseSeconds}s)`,
  worstCaseSeconds <= 1,
  true
);

// Contrasts: the panel's own behaviour is otherwise sound and must not regress.
check('contrast: zero-hashrate submissions are filtered out', /avg_hashrate\s*!=\s*null\s*&&\s*t\.avg_hashrate\s*>\s*0/.test(statsCards), true);
check('contrast: rows are sorted newest first', /return bTime - aTime/.test(statsCards), true);
check('contrast: the summary cards use the deduplicated rows', /setSummary\(calculateSummary\(summaryData\)\)/.test(dashboard), true);

assert.deepEqual(failures, [], `dashboard recent tests panel:\n  ${failures.join('\n  ')}`);

console.log('dashboard recent tests panel tests passed');
