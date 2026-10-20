const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => mocks[name] || require(name), process, URLSearchParams });
  return module.exports;
}

test('formatAccountAmount preserves exact atomic units and rejects unsafe shapes', () => {
  const { formatAccountAmount } = load('lib/accountStatistics.ts');
  assert.equal(formatAccountAmount('123456789012345678901234567890', null, 12), '123456789012345678.90123456789');
  assert.equal(formatAccountAmount('-1000', null, 2), '-10');
  assert.equal(formatAccountAmount('0', null, 12), '0');
  assert.equal(formatAccountAmount(null, '1.25', 6), '1.25');
  assert.equal(formatAccountAmount('1e3', 'bad', 2), 'Unavailable');
  assert.equal(formatAccountAmount('1', null, 19), 'Unavailable');
});

test('statistics loader sends fixed bounded inputs and rejects malformed upstream DTOs', async () => {
  const { loadAccountStatistics, AccountRequestError } = load('lib/accountStatistics.ts');
  const calls = [];
  const good = await loadAccountStatistics('overview', 'bmt', '24h', null, new AbortController().signal, async (url, init) => {
    calls.push([url, init]);
    return { ok: true, json: async () => ({ accountId: 'a', asOf: null, freshness: {}, completeness: { reasons: [] }, data: null, nextCursor: null }) };
  });
  assert.equal(good.accountId, 'a');
  assert.match(calls[0][0], /mode=bmt&range=24h&limit=25/);
  assert.equal(calls[0][1].cache, 'no-store');
  await assert.rejects(() => loadAccountStatistics('workers', 'direct-xmr', '7d', 'cursor', new AbortController().signal, async () => ({ ok: true, json: async () => ({}) })), AccountRequestError);
});

test('upstream hashrate estimates retain PostgreSQL precision and reject malformed values', () => {
  const { formatAccountHashrate } = load('lib/accountStatistics.ts');
  assert.equal(formatAccountHashrate('0.00027777777777777778'), '0.00027777777777777778 H/s');
  assert.equal(formatAccountHashrate(null), 'Unavailable');
  assert.equal(formatAccountHashrate('-1'), 'Unavailable');
  assert.equal(formatAccountHashrate('1e3'), 'Unavailable');
  assert.equal(formatAccountHashrate('0.' + '1'.repeat(41)), 'Unavailable');
});

test('conversion stages use safe labels and preserve missing legacy progress', () => {
  const { formatConversionStage } = load('lib/accountStatistics.ts');
  assert.equal(formatConversionStage('xmr_transfer', 'processing'), 'XMR transfer');
  assert.equal(formatConversionStage('ledger_reconciliation', 'reconciliation_required'), 'Ledger reconciliation');
  assert.equal(formatConversionStage('complete', 'completed'), 'Canonical BMT credited');
  assert.equal(formatConversionStage(undefined, 'pending'), 'Awaiting conversion');
  assert.equal(formatConversionStage(undefined, 'completed'), 'Canonical BMT credited');
  assert.equal(formatConversionStage('xmr_preparing', 'processing'), 'Unknown stage');
  assert.equal(formatConversionStage('__proto__', 'processing'), 'Unknown stage');
});
