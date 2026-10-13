const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../lib/poolRewardTotals.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const row = (n, amount) => ({ id: id(n), amount });
function load(env = {}, browser = false) {
  const exports = {};
  vm.runInNewContext(compiled, { exports, require, URL, URLSearchParams, Buffer, AbortController, setTimeout, clearTimeout, fetch,
    ...(browser ? {window:{}} : {}), process: {env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'a.' + Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url') + '.c', ...env,
    }},
  });
  return exports.getPoolRewardTotals;
}
function mock(data, mutate = r => r, pageSize = 500) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const u = new URL(url);
    const table = u.pathname.split('/').pop();
    const offset = Number(u.searchParams.get('offset'));
    const all = data[table];
    const rows = all.slice(offset, offset + pageSize);
    calls.push({u, init});
    const result = {rows, range: all.length ? `${offset}-${offset+rows.length-1}/${all.length}` : '*/0', status:200};
    const changed = mutate(result, table, calls.length) || result;
    return new Response(JSON.stringify(changed.rows), {status:changed.status, headers:{'content-range':changed.range}});
  };
  return {fetchImpl, calls};
}
const data = () => ({payouts:[row(1,'9007199254740993.000000001'), row(2,'0.999999999')],pool_block_events:[row(1,'0.000000000001'),row(2,'1.2')]});

test('exact sums above safe integer, multiple pages and explicit source filters', async () => {
  const m = mock(data(), undefined, 1);
  const totals = await load()(m);
  assert.equal(totals.totalPaidBmt, '9007199254740994');
  assert.equal(totals.totalReceivedXmr, '1.200000000001');
  assert.equal(m.calls.length, 8);
  for (const {u, init} of m.calls) {
    assert.equal(init.method,'GET'); assert.equal(init.redirect,'error'); assert.equal(init.cache,'no-store');
    assert.equal(init.headers.Prefer,'count=exact');
    assert.equal(u.searchParams.get('order'),'id.asc');
    assert.match(u.searchParams.get('select'),/^id,amount:.*::text$/);
    if(u.pathname.endsWith('/payouts')) {
      assert.equal(u.searchParams.get('status'),'eq.completed');
      assert.equal(u.searchParams.get('tx_signature'),'not.is.null');
      assert.equal(u.searchParams.get('and'),'(tx_signature.neq.)');
    } else assert.equal(u.searchParams.get('monero_payout_status'),'eq.received');
  }
});
test('verified empty tables produce zero', async () => {
  const result = await load()(mock({payouts:[],pool_block_events:[]}));
  assert.equal(result.totalPaidBmt,'0'); assert.equal(result.totalReceivedXmr,'0');
});
test('equal amounts on distinct rows remain counted', async () => {
  const result = await load()(mock({payouts:[row(1,'1.50'),row(2,'1.50')],pool_block_events:[]}));
  assert.equal(result.totalPaidBmt,'3');
});
for (const [name, mutate] of [
  ['missing count', r => ({...r,range:'0-1/*'})],
  ['oversized history', r => ({...r,range:'0-1/10001'})],
  ['truncated page metadata', r => ({...r,range:'0-2/3'})],
  ['duplicate rows', r => ({...r,rows:[r.rows[0],r.rows[0]]})],
  ['null amount', r => ({...r,rows:[row(1,null),row(2,'1')]})],
  ['numeric JSON amount', r => ({...r,rows:[row(1,1),row(2,'1')]})],
  ['negative amount', r => ({...r,rows:[row(1,'-1'),row(2,'1')]})],
  ['nonfinite amount', r => ({...r,rows:[row(1,'NaN'),row(2,'1')]})],
  ['source error', r => ({...r,status:403})],
  ['change between scans', (r, table, n) => n>2 ? {...r,rows:[row(1,'4'),row(2,'1')]} : r],
]) test(`fails closed: ${name}`, async () => {
  await assert.rejects(load()(mock(data(),mutate)), {message:'Complete pool reward totals are unavailable'});
});
test('count changes between pages fail closed', async () => {
  await assert.rejects(load()(mock(data(), (r,t,n) => n>2 ? {...r,range:r.range.replace('/2','/3')} : r, 1)));
});
test('network exceptions are sanitized', async () => {
  await assert.rejects(load()({fetchImpl:async()=>{throw Error('secret upstream detail')}}),{message:'Complete pool reward totals are unavailable'});
});
test('browser, missing key, anon key and unsafe endpoint fail without network access', async () => {
  let calls = 0;
  const options = {fetchImpl:async()=>{calls++;throw Error('unexpected')}};
  for (const env of [
    {SUPABASE_SERVICE_ROLE_KEY:''},
    {SUPABASE_SERVICE_ROLE_KEY:'a.'+Buffer.from('{"role":"anon"}').toString('base64url')+'.c'},
    {NEXT_PUBLIC_SUPABASE_URL:'http://test.supabase.co'},
    {NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co.evil.test'},
    {NEXT_PUBLIC_SUPABASE_URL:'https://user:pass@test.supabase.co'},
  ]) await assert.rejects(load(env)(options));
  await assert.rejects(load({},true)(options));
  assert.equal(calls,0);
});
