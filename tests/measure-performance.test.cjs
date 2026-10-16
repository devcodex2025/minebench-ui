const test = require('node:test');
const assert = require('node:assert/strict');

test('measurement helpers reject error pages and accept real MineBench HTML', async () => {
  const { contentPrecheck } = await import('../scripts/measure-performance.mjs');
  const good = '<html><head><link rel="canonical" href="https://minebench.cloud/leaderboard"></head><body><h1>MineBench leaderboard</h1><main>' + 'Verified MineBench benchmark results. '.repeat(8) + '</main></body></html>';
  assert.equal(contentPrecheck(good, 'http://127.0.0.1:3000/leaderboard').valid, true);
  assert.equal(contentPrecheck('<html><body><h1>Not found</h1></body></html>', 'http://127.0.0.1:3000/leaderboard', 'http://127.0.0.1:3000/leaderboard', 200).valid, false);
  assert.equal(contentPrecheck(good, 'http://127.0.0.1:3000/leaderboard', 'http://127.0.0.1:3000/error', 404).valid, false);
});

test('default route set matches the eleven public plan targets', async () => {
  const { DEFAULT_ROUTES, parseArgs } = await import('../scripts/measure-performance.mjs');
  assert.equal(DEFAULT_ROUTES.length, 11);
  assert.deepEqual(parseArgs(['--profiles', 'mobile', '--runs', '1']).profiles, ['mobile']);
  assert.throws(() => parseArgs(['--profiles', 'tablet']), /Invalid measurement options/);
});


test('content gate rejects error HTTP status, wrong routes, incorrect canonical and empty page', async () => {
  const { contentPrecheck, parseArgs } = await import('../scripts/measure-performance.mjs');
  const good = '<link rel="canonical" href="https://minebench.cloud/guides"><h1>MineBench guides</h1><main>' + 'Mining benchmark methodology and limitations. '.repeat(8) + '</main>';
  const url = 'http://127.0.0.1:3001/guides';
  assert.equal(contentPrecheck(good, url, url, 404).valid, false);
  assert.equal(contentPrecheck(good, url, 'http://127.0.0.1:3001/error', 200).valid, false);
  assert.equal(contentPrecheck(good.replace('https://minebench.cloud/guides', 'https://minebench.cloud/'), url).valid, false);
  assert.equal(contentPrecheck('<h1>MineBench</h1>', url).valid, false);
  assert.throws(() => parseArgs(['--profiles', '']), /Invalid/);
  assert.throws(() => parseArgs(['--routes', '']), /Invalid/);
  assert.throws(() => parseArgs(['--min-score', '101']), /Invalid/);
  assert.throws(() => parseArgs(['--routes', '//other.example/']), /Invalid/);
});


test('performance-only reports require a real 200 document and valid navigation', async () => {
  const { lighthouseReportValid } = await import('../scripts/measure-performance.mjs');
  const url = 'http://127.0.0.1:3002/downloads';
  const report = { requestedUrl: url, finalDisplayedUrl: url, categories: { performance: { score: 0.88 } }, audits: { 'network-requests': { details: { items: [{ resourceType: 'Document', statusCode: 200 }] } } } };
  assert.equal(lighthouseReportValid(report, url), true);
  assert.equal(lighthouseReportValid({ ...report, runtimeError: { code: 'NO_FCP' } }, url), false);
  assert.equal(lighthouseReportValid({ ...report, finalDisplayedUrl: 'http://127.0.0.1:3002/error' }, url), false);
  assert.equal(lighthouseReportValid({ ...report, audits: {} }, url), false);
  assert.equal(lighthouseReportValid({ ...report, audits: { 'network-requests': { details: { items: [{ resourceType: 'Document', statusCode: 404 }] } } } }, url), false);
  assert.equal(lighthouseReportValid({ ...report, audits: { ...report.audits, 'http-status-code': { score: 0 } } }, url), false);
  assert.equal(lighthouseReportValid({ ...report, categories: {} }, url), false);
});


test('CI restricts measurements to the canonical production origin', async () => {
  const { parseArgs } = await import('../scripts/measure-performance.mjs');
  assert.equal(parseArgs(['--origin', 'https://minebench.cloud'], { ci: true }).origin, 'https://minebench.cloud');
  for (const origin of ['http://169.254.169.254', 'http://127.0.0.1:3002', 'http://10.0.0.1', 'http://192.168.1.1', 'https://user:password@minebench.cloud', 'https://minebench.cloud:8443', 'https://example.com', 'https://minebench.cloud/path', 'https://minebench.cloud?key=value', 'https://minebench.cloud#fragment']) {
    assert.throws(() => parseArgs(['--origin', origin], { ci: true }), /Invalid measurement origin/);
  }
  for (const route of ['/' + String.fromCharCode(92) + '169.254.169.254/', '/' + String.fromCharCode(9) + '/169.254.169.254/']) {
    assert.throws(() => parseArgs(['--origin', 'https://minebench.cloud', '--routes', route], { ci: true }), /Invalid measurement options/);
  }
  assert.equal(parseArgs(['--origin', 'http://127.0.0.1:3002'], { ci: false }).origin, 'http://127.0.0.1:3002');
});

test('rejected CI origin performs no network request', async () => {
  const { main } = await import('../scripts/measure-performance.mjs');
  const previousBuild = process.env.BITBUCKET_BUILD_NUMBER;
  const previousFetch = global.fetch;
  let calls = 0;
  process.env.BITBUCKET_BUILD_NUMBER = 'qa';
  global.fetch = async () => { calls += 1; throw new Error('Unexpected request'); };
  try {
    await assert.rejects(() => main(['--origin', 'http://169.254.169.254']), /Invalid measurement origin/);
    await assert.rejects(() => main(['--origin', 'https://minebench.cloud', '--routes', '/' + String.fromCharCode(92) + '169.254.169.254/']), /Invalid measurement options/);
    assert.equal(calls, 0);
  } finally {
    global.fetch = previousFetch;
    if (previousBuild === undefined) delete process.env.BITBUCKET_BUILD_NUMBER;
    else process.env.BITBUCKET_BUILD_NUMBER = previousBuild;
  }
});
