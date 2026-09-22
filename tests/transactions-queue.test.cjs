const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const element = (type, props, key) => ({ type, props: props || {}, key: key ?? null });
const text = (node) => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join('');
  if (node && typeof node === 'object') return text(node.props?.children);
  return '';
};
const walk = (node, found = []) => {
  if (Array.isArray(node)) node.forEach(value => walk(value, found));
  else if (node && typeof node === 'object') {
    found.push(node);
    walk(node.props?.children, found);
  }
  return found;
};

function loadPage(fetch) {
  const source = fs.readFileSync(require.resolve('../app/transactions/page.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const context = vm.createContext({
    module, exports: module.exports, fetch, process: { env: {} },
    AbortSignal: { timeout: () => 'timeout' },
    require(id) {
      if (id === 'react/jsx-runtime') return { jsx: element, jsxs: element, Fragment: 'fragment' };
      if (id === 'next/link') return ({ children, ...props }) => element('a', { ...props, children });
      if (id === '@/components/Header') return () => element('header', { children: 'header' });
      if (id === '@/components/Footer') return () => element('footer', { children: 'footer' });
      if (id === './TransactionsRefresh') return function TransactionsRefresh() { return element('refresh-control', { children: 'refresh-control' }); };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  new vm.Script(compiled).runInContext(context);
  return module.exports.default;
}

const bmtPayment = (overrides = {}) => ({
  id: 'payout-1', status: 'pending', amount: '1.25', fee: '0.01', transaction_hash: null,
  created_at: '2026-01-01T00:00:00.000Z', ...overrides,
});
const response = (data, ok = true) => ({ ok, json: async () => data });

test('SSR renders exact global BMT queue totals and distinguishes queued from submitted pending', async () => {
  const fetches = [];
  const Page = loadPage(async (url) => {
    fetches.push(url);
    return response({
      queue: { pendingCount: 1200, amountBmt: '999.123456', feeBmt: '1.000001' },
      transactions: [bmtPayment(), bmtPayment({ id: 'payout-2', transaction_hash: 'A'.repeat(80) })], hasMore: true,
    });
  });
  const view = await Page({ searchParams: Promise.resolve({ type: 'bmt', page: '8' }) });
  const rendered = text(view);

  assert.match(fetches[0], /transactions\?type=bmt&page=8$/);
  assert.match(rendered, /Network-wide totals across all wallets, independent of the history page below\./);
  assert.match(rendered, /1,200/);
  assert.match(rendered, /999\.123456 BMT/);
  assert.match(rendered, /1\.000001 BMT/);
  assert.match(rendered, /Queued/);
  assert.match(rendered, /Awaiting confirmation/);
  assert.match(rendered, /Amount and fee estimated/);
});

test('queue summary exists only for BMT and keeps unavailable history distinct from zero totals', async () => {
  const xmrPage = loadPage(async () => response({ transactions: [bmtPayment({ transaction_hash: 'a'.repeat(64) })], hasMore: false }));
  const xmr = text(await xmrPage({ searchParams: Promise.resolve({ type: 'xmr' }) }));
  assert.doesNotMatch(xmr, /BMT payout queue|Queue totals are temporarily unavailable|refresh-control/);

  const supportPage = loadPage(async () => response({ conversions: [], hasMore: false }));
  const support = text(await supportPage({ searchParams: Promise.resolve({ type: 'support' }) }));
  assert.doesNotMatch(support, /BMT payout queue|refresh-control/);

  const zeroPage = loadPage(async () => response({ queue: { pendingCount: 0, amountBmt: '0', feeBmt: '0' }, transactions: [], hasMore: false }));
  const zero = text(await zeroPage({ searchParams: Promise.resolve({ type: 'bmt' }) }));
  assert.match(zero, /No BMT payouts are currently queued\./);
  assert.match(zero, /Estimated amount to wallets0 BMT/);

  const unavailablePage = loadPage(async () => response({}, false));
  const unavailable = text(await unavailablePage({ searchParams: Promise.resolve({ type: 'bmt' }) }));
  assert.match(unavailable, /Queue totals are temporarily unavailable/);
  assert.match(unavailable, /Transaction history is temporarily unavailable/);
  assert.doesNotMatch(unavailable, /No BMT payouts are currently queued\./);
});

test('malformed or missing BMT queue is unavailable rather than displayed as a zero queue', async () => {
  for (const queue of [undefined, { pendingCount: -1, amountBmt: '0', feeBmt: '0' }, { pendingCount: 1, amountBmt: 'bad', feeBmt: '0' }]) {
    const Page = loadPage(async () => response({ queue, transactions: [], hasMore: false }));
    const rendered = text(await Page({ searchParams: Promise.resolve({ type: 'bmt' }) }));
    assert.match(rendered, /Queue totals are temporarily unavailable/);
    assert.doesNotMatch(rendered, /No BMT payouts are currently queued\./);
  }
});

function loadRefresh({ pending = false, visible = true } = {}) {
  const source = fs.readFileSync(require.resolve('../app/transactions/TransactionsRefresh.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  let effectCleanup;
  let timer;
  let cleared;
  let refreshes = 0;
  const react = {
    useTransition: () => [pending, callback => callback()],
    useEffect: effect => { effectCleanup = effect(); },
  };
  const context = vm.createContext({
    module, exports: module.exports,
    window: { setInterval: callback => { timer = callback; return 17; }, clearInterval: id => { cleared = id; } },
    document: { visibilityState: visible ? 'visible' : 'hidden' },
    require(id) {
      if (id === 'react') return react;
      if (id === 'react/jsx-runtime') return { jsx: element, jsxs: element, Fragment: 'fragment' };
      if (id === 'next/navigation') return { useRouter: () => ({ refresh: () => { refreshes += 1; } }) };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  new vm.Script(compiled).runInContext(context);
  return { view: module.exports.default(), timer: () => timer, cleanup: () => effectCleanup?.(), cleared: () => cleared, refreshes: () => refreshes };
}

test('refresh control polls only while visible, supports manual refresh, and cleans up', () => {
  const active = loadRefresh();
  assert.match(text(active.view), /Updates every 30 seconds while this tab is visible/);
  assert.equal(typeof active.timer(), 'function');
  active.timer()();
  const button = walk(active.view).find(node => node.type === 'button');
  button.props.onClick();
  assert.equal(active.refreshes(), 2);
  active.cleanup();
  assert.equal(active.cleared(), 17);

  const hidden = loadRefresh({ visible: false });
  hidden.timer()();
  assert.equal(hidden.refreshes(), 0);

  const pending = loadRefresh({ pending: true });
  const pendingButton = walk(pending.view).find(node => node.type === 'button');
  assert.equal(pending.timer(), undefined);
  assert.equal(pendingButton.props.disabled, true);
  assert.match(text(pending.view), /Refreshing…/);
});
