import assert from 'node:assert/strict';

const origin = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:3001';
const flattenSchemas = (schemas) => schemas.flatMap(schema => schema['@graph'] || [schema]);
const pages = [
  '/', '/downloads', '/premium', '/leaderboard', '/dashboard', '/whitepaper', '/depin', '/guides',
  '/guides/randomx-benchmarking', '/guides/measure-hashrate-per-watt',
  '/guides/mining-profitability-calculator', '/guides/verify-minebench-download'
];
for (const path of [...pages, '/robots.txt', '/sitemap.xml', '/llms.txt', '/pricing.txt', '/wallet-connect']) {
  const response = await fetch(origin + path);
  const html = await response.text();
  assert.equal(response.status, 200, path);
  if (pages.includes(path)) {
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${path}: one main heading`);
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical?.replace(/\/$/, ''), `https://minebench.cloud${path}`.replace(/\/$/, ''), `${path}: canonical`);
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const graph = flattenSchemas(schemas);
    if (path === '/leaderboard') {
      const collection = graph.find(schema => schema['@type'] === 'CollectionPage');
      assert.equal(collection?.name, 'RandomX and Mining Benchmark Leaderboard', `${path}: CollectionPage name`);
      assert.match(collection?.description || '', /public CPU and GPU mining benchmark results/i, `${path}: CollectionPage description`);
    }
    if (path === '/whitepaper') assert.doesNotMatch(html, /"@type"\s*:\s*"(?:Review|AggregateRating)"/, `${path}: unsupported trust schema`);
    if (path === '/premium') {
      assert.match(html, /One-time payment/);
      assert.match(html, /29[\s\S]*?USDC/);
    }
    if (path === '/') {
      const faq = schemas.flatMap(schema => schema['@graph'] || [schema]).find(schema => schema['@type'] === 'FAQPage');
      assert.ok(faq?.mainEntity.length >= 4, `${path}: shared FAQ schema`);
      for (const question of faq.mainEntity) assert.ok(html.includes(question.name), `${path}: visible FAQ question`);
    }
  }
  if (path === '/wallet-connect') assert.match(html, /content="noindex, nofollow"/);
  if (path === '/sitemap.xml') {
    assert.doesNotMatch(html, /wallet-connect|<lastmod>/);
    for (const page of pages) assert.match(html, new RegExp(`<loc>https://minebench\\.cloud${page === '/' ? '' : page}</loc>`), `${page}: sitemap entry`);
  }
  if (path === '/pricing.txt') assert.match(html, /29 USDC once/);
  if (path === '/robots.txt') assert.match(html, /Sitemap: https:\/\/minebench.cloud\/sitemap.xml/);
  if (path === '/llms.txt') {
    assert.match(html, /https:\/\/minebench.cloud\/pricing.txt/);
    assert.match(html, /https:\/\/minebench.cloud\/guides\/mining-profitability-calculator/);
  }
  console.log(`PASS ${path}`);
}
