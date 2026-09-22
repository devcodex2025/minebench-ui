import { createHash } from 'node:crypto';

export type PoolRewardTotals = { totalPaidBmt: string; totalReceivedXmr: string };

// All retained history across all wallets, networks and sidechains; no date filter.
// BMT is net payouts, counted per row even when transaction signatures repeat.
// XMR is pool wallet receipts, not miner withdrawals or gross block rewards.
export const POOL_REWARD_TOTAL_SCOPES = {
  totalPaidBmt: 'payouts.amount_bmt; status=completed; tx_signature non-null and nonempty; each row counted',
  totalReceivedXmr: 'pool_block_events.wallet_payout_xmr; monero_payout_status=received; each row counted',
} as const;

const PAGE_SIZE = 500;
const MAX_ROWS = 10_000;
const MAX_PAGES = 100;
const TIMEOUT_MS = 15_000;
const SOURCES = [
  { table: 'payouts', column: 'amount_bmt', filters: { status: 'eq.completed', tx_signature: 'not.is.null', and: '(tx_signature.neq.)' } },
  { table: 'pool_block_events', column: 'wallet_payout_xmr', filters: { monero_payout_status: 'eq.received' } },
] as const;

function unavailable(): never {
  // Do not propagate upstream messages, URLs, credentials or source records.
  throw new Error('Complete pool reward totals are unavailable');
}

function decimal(value: unknown): { units: bigint; scale: number } {
  if (typeof value !== 'string' || value.length > 200 || !/^\d+(?:\.\d+)?$/.test(value)) unavailable();
  const [whole, fraction = ''] = value.split('.');
  return { units: BigInt(whole + fraction), scale: fraction.length };
}

function formatDecimal(units: bigint, scale: number): string {
  if (!scale) return units.toString();
  const digits = units.toString().padStart(scale + 1, '0');
  return `${digits.slice(0, -scale)}.${digits.slice(-scale)}`.replace(/\.?0+$/, '');
}

/** Server API only. Throws rather than returning zero/partial totals on any failure.
 * Two matching scans detect ordinary concurrent changes, but REST cannot provide
 * a transaction snapshot across pages or tables. Caller may cache successful totals.
 */
export async function getPoolRewardTotals(
  { fetchImpl = fetch }: { fetchImpl?: typeof fetch } = {},
): Promise<PoolRewardTotals> {
  if (typeof window !== 'undefined') unavailable();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !rawUrl) unavailable();
  let origin: string;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
      || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/') unavailable();
    origin = url.origin;
    // Fail closed if an anon/authenticated JWT is mistakenly supplied as the server key.
    if (!key.startsWith('sb_secret_')) {
      const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
      if (claims.role !== 'service_role') unavailable();
    }
  } catch { unavailable(); }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const deadline = Date.now() + TIMEOUT_MS;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact', Accept: 'application/json' };

  async function scan(source: typeof SOURCES[number]) {
    let offset = 0;
    let count: number | undefined;
    let units = BigInt(0);
    let scale = 0;
    let previousId = '';
    const hash = createHash('sha256');
    for (let page = 0; page < MAX_PAGES; page++) {
      if (Date.now() >= deadline || controller.signal.aborted) unavailable();
      const params = new URLSearchParams({
        select: `id,amount:${source.column}::text`, ...source.filters,
        order: 'id.asc', limit: String(PAGE_SIZE), offset: String(offset),
      });
      const response = await fetchImpl(`${origin}/rest/v1/${source.table}?${params}`, {
        method: 'GET', headers, signal: controller.signal, redirect: 'error', cache: 'no-store',
      });
      if (!response.ok) unavailable();
      const rows: unknown = await response.json();
      const range = /^(?:(\d+)-(\d+)|\*)\/(\d+)$/.exec(response.headers.get('content-range') || '');
      if (!range || !Array.isArray(rows)) unavailable();
      const total = Number(range[3]);
      if (!Number.isSafeInteger(total) || total > MAX_ROWS || (count !== undefined && total !== count)) unavailable();
      count = total;
      if (!total) {
        if (offset || rows.length || range[1] !== undefined) unavailable();
        return { total: '0', fingerprint: hash.digest('hex'), count };
      }
      if (!rows.length || rows.length > PAGE_SIZE || Number(range[1]) !== offset
        || Number(range[2]) !== offset + rows.length - 1 || offset + rows.length > total) unavailable();
      for (const row of rows) {
        if (!row || typeof row !== 'object' || typeof row.id !== 'string'
          || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(row.id)
          || row.id <= previousId) unavailable();
        previousId = row.id;
        const amount = decimal(row.amount);
        const nextScale = Math.max(scale, amount.scale);
        units = units * BigInt('1' + '0'.repeat(nextScale - scale))
          + amount.units * BigInt('1' + '0'.repeat(nextScale - amount.scale));
        scale = nextScale;
        hash.update(`${row.id}:${row.amount}\n`);
      }
      offset += rows.length;
      if (offset === total) return { total: formatDecimal(units, scale), fingerprint: hash.digest('hex'), count };
    }
    unavailable();
  }

  try {
    const first = await Promise.all(SOURCES.map(scan));
    const second = await Promise.all(SOURCES.map(scan));
    if (Date.now() >= deadline || first.some((result, i) => result.count !== second[i].count
      || result.fingerprint !== second[i].fingerprint)) unavailable();
    return { totalPaidBmt: second[0].total, totalReceivedXmr: second[1].total };
  } catch { unavailable(); }
  finally { controller.abort(); clearTimeout(timer); }
}
