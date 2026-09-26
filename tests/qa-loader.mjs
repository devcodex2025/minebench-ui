// QA test loader for MineBench-UI (test tooling only — no production code).
//
// `lib/leaderboard.ts` and `lib/utils.ts` import their types from the `@/types/benchmark` path alias, which
// only the bundler/`tsconfig` resolves. The import is type-only in intent, but Node's strip-only type
// removal keeps the statement, so the module must exist at runtime and must export the names used in value
// positions (`BenchmarkResult`, `BenchmarkSummary`) or ESM linking fails. Vite resolves the alias in the
// real app; here the alias is mapped to a stub that provides those names as inert values.
//
// Usage:
//   node --experimental-loader ./tests/qa-loader.mjs --test tests/<file>.cjs
import { readFile } from 'node:fs/promises';

const ALIAS_PREFIX = '@/';
const TYPE_MODULES = new Set(['types/benchmark', 'types/benchmark.ts']);

const STUB_NAMES = ['Test', 'StatsCardsProps', 'BenchmarkTableProps', 'BenchmarkResult', 'BenchmarkSummary', 'FilterOptions'];
const TYPE_STUB = `data:text/javascript,${STUB_NAMES.map((name) => `export const ${name} = undefined;`).join('')}export default {};`;

// `@supabase/supabase-js` is a real dependency, but the API-route tests must not open a network client: the
// stub hands back whatever the test placed on `globalThis.__QA_SUPABASE__` (a chainable fake builder), so a
// route under test runs its real logic against a controlled database.
const SUPABASE_STUB = 'data:text/javascript,export const createClient = () => globalThis.__QA_SUPABASE__;export default { createClient };';

const CANDIDATE_EXTENSIONS = ['.js', '.ts', '.tsx', '.json', '.mjs', '.cjs'];

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@supabase/supabase-js') {
    return { url: SUPABASE_STUB, shortCircuit: true };
  }
  if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$|\.json$|\.mjs$|\.cjs$/.test(specifier)) {
    for (const extension of CANDIDATE_EXTENSIONS) {
      try {
        return await nextResolve(specifier + extension, context);
      } catch {
        // try the next extension
      }
    }
  }
  if (specifier.startsWith(ALIAS_PREFIX)) {
    const relative = specifier.slice(ALIAS_PREFIX.length);
    if (TYPE_MODULES.has(relative)) {
      return { url: TYPE_STUB, shortCircuit: true };
    }
    const target = new URL(`../${relative}`, import.meta.url).href;
    return nextResolve(target, context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  // `lib/utils.test.ts` and other module files live in the same tree; nothing to rewrite, but keep JSON
  // imports working if a test pulls one in transitively.
  if (url.endsWith('.json')) {
    const source = await readFile(new URL(url), 'utf8');
    return { format: 'module', shortCircuit: true, source: `export default ${source};` };
  }
  return nextLoad(url, context);
}
