const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadPublicBenchmarks(createClient) {
  const source = ts.transpileModule(
    readFileSync(require.resolve('../lib/publicBenchmarks.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
  ).outputText;
  const sandbox = {
    exports: {},
    process,
    AbortController,
    setTimeout,
    clearTimeout,
    require: (name) => {
      if (name === 'server-only') return {};
      if (name === '@supabase/supabase-js') return { createClient };
      if (name.startsWith('@/')) return {};
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(source, sandbox);
  return sandbox.exports;
}

function createQuery({ data = [], error = null, reject = null, capture } = {}) {
  const query = {
    from(table) { capture.table = table; return this; },
    select(fields) { capture.fields = fields; return this; },
    order(column, options) { capture.order = [column, options]; return this; },
    range(start, end) { capture.range = [start, end]; return this; },
    abortSignal(signal) {
      capture.signal = signal;
      return reject ? Promise.reject(reject) : Promise.resolve({ data, error });
    },
  };
  return { from: query.from.bind(query) };
}

const plain = value => JSON.parse(JSON.stringify(value));

test('public benchmark snapshot is unavailable without server credentials', async () => {
  const values = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].map((key) => [key, process.env[key]]);
  values.forEach(([key]) => delete process.env[key]);
  try {
    const { getPublicBenchmarks } = loadPublicBenchmarks(() => { throw new Error('must not create a client'); });
    assert.deepEqual(plain(await getPublicBenchmarks()), { results: [], available: false });
  } finally {
    values.forEach(([key, value]) => { if (value === undefined) delete process.env[key]; else process.env[key] = value; });
  }
});

test('public benchmark snapshot returns whitelisted rows and bounded query', async () => {
  const capture = {};
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  const rows = [{ id: '1', device_type: 'GPU', avg_hashrate: 123 }];
  const { getPublicBenchmarks, PUBLIC_BENCHMARK_LIMIT } = loadPublicBenchmarks(() => createQuery({ data: rows, capture }));
  assert.deepEqual(plain(await getPublicBenchmarks()), { results: rows, available: true });
  assert.equal(capture.table, 'benchmarks');
  assert.match(capture.fields, /^id,device_type,device_name,/);
  assert.equal(capture.order[0], 'created_at');
  assert.deepEqual(capture.range, [0, PUBLIC_BENCHMARK_LIMIT - 1]);
  assert.ok(capture.signal instanceof AbortSignal);
});

test('public benchmark snapshot treats Supabase errors, malformed data, and thrown requests as unavailable', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  for (const options of [{ error: new Error('db down') }, { data: null }, { reject: new Error('network down') }]) {
    const { getPublicBenchmarks } = loadPublicBenchmarks(() => createQuery({ ...options, capture: {} }));
    assert.deepEqual(plain(await getPublicBenchmarks()), { results: [], available: false });
  }
});
