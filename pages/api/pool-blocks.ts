import type { NextApiRequest, NextApiResponse } from 'next';

const ALLOWED_RANGES = new Set(['1h', '24h', '7d', '30d']);
const MONERO_STATUSES = new Set(['pending', 'received', 'none']);
const BMT_STATUSES = new Set(['not_created', 'processing', 'credited', 'partially_paid', 'paid']);
const REQUEST_TIMEOUT_MS = 8_000;

export type PoolBlock = {
  id: string;
  blockHeight: number;
  blockHash: string | null;
  foundAt: string;
  foundAtSource: string;
  finderScope: 'local' | 'p2pool_peer' | 'unknown';
  moneroPayoutStatus: 'pending' | 'received' | 'none';
  walletPayoutXmr: number | null;
  payoutDetectedAt: string | null;
  accountingStatus: string;
  grossBmt: number;
  userBmt: number;
  treasuryBmt: number;
  distributions: number;
  paidDistributions: number;
  creditedDistributions: number;
  bmtSettlementStatus: 'not_created' | 'processing' | 'credited' | 'partially_paid' | 'paid';
  sharedCompensation: {
    totalRecipients: number;
    creditedRecipients: number;
    paidRecipients: number;
  } | null;
};

function normalizeBlock(value: unknown): PoolBlock | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const foundAt = new Date(String(raw.foundAt));
  const blockHeight = Number(raw.blockHeight);
  if (!raw.id || !Number.isFinite(foundAt.getTime()) || !Number.isSafeInteger(blockHeight) || blockHeight <= 0) {
    return null;
  }

  const walletPayoutXmr = raw.walletPayoutXmr === null || raw.walletPayoutXmr === undefined
    ? null
    : Number(raw.walletPayoutXmr);
  const payoutDetectedAt = raw.payoutDetectedAt ? new Date(String(raw.payoutDetectedAt)) : null;
  const distributions = Math.max(0, Math.round(Number(raw.distributions) || 0));
  const rawCompensation = raw.sharedCompensation && typeof raw.sharedCompensation === 'object'
    ? raw.sharedCompensation as Record<string, unknown>
    : null;
  const totalRecipients = Math.max(0, Math.round(Number(rawCompensation?.totalRecipients) || 0));
  const creditedRecipients = Math.min(totalRecipients, Math.max(0, Math.round(Number(rawCompensation?.creditedRecipients) || 0)));
  const paidRecipients = Math.min(creditedRecipients, Math.max(0, Math.round(Number(rawCompensation?.paidRecipients) || 0)));

  return {
    id: String(raw.id),
    blockHeight,
    blockHash: typeof raw.blockHash === 'string' && raw.blockHash ? raw.blockHash : null,
    foundAt: foundAt.toISOString(),
    foundAtSource: String(raw.foundAtSource || 'unknown'),
    finderScope: ['local', 'p2pool_peer'].includes(String(raw.finderScope))
      ? raw.finderScope as PoolBlock['finderScope']
      : 'unknown',
    moneroPayoutStatus: MONERO_STATUSES.has(String(raw.moneroPayoutStatus))
      ? raw.moneroPayoutStatus as PoolBlock['moneroPayoutStatus']
      : 'pending',
    walletPayoutXmr: walletPayoutXmr !== null && Number.isFinite(walletPayoutXmr) && walletPayoutXmr > 0
      ? walletPayoutXmr
      : null,
    payoutDetectedAt: payoutDetectedAt && Number.isFinite(payoutDetectedAt.getTime())
      ? payoutDetectedAt.toISOString()
      : null,
    accountingStatus: String(raw.accountingStatus || 'waiting_for_payout'),
    grossBmt: Math.max(0, Number(raw.grossBmt) || 0),
    userBmt: Math.max(0, Number(raw.userBmt) || 0),
    treasuryBmt: Math.max(0, Number(raw.treasuryBmt) || 0),
    distributions,
    paidDistributions: Math.min(distributions, Math.max(0, Math.round(Number(raw.paidDistributions) || 0))),
    creditedDistributions: Math.min(distributions, Math.max(0, Math.round(Number(raw.creditedDistributions) || 0))),
    bmtSettlementStatus: BMT_STATUSES.has(String(raw.bmtSettlementStatus))
      ? raw.bmtSettlementStatus as PoolBlock['bmtSettlementStatus']
      : 'not_created',
    sharedCompensation: rawCompensation
      ? { totalRecipients, creditedRecipients, paidRecipients }
      : null
  };
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed', blocks: [], total: 0 });
  }

  const rawRange = Array.isArray(req.query.range) ? req.query.range[0] : req.query.range;
  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const rawOffset = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
  const limit = Math.min(Math.max(parseInt(String(rawLimit || '20'), 10) || 20, 1), 400);
  const offset = Math.max(parseInt(String(rawOffset || '0'), 10) || 0, 0);
  const range = ALLOWED_RANGES.has(String(rawRange)) ? String(rawRange) : null;
  const backendUrl = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://backend.minebench.cloud')
    .replace(/\/+$/, '');
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  params.set('excludeNoPayout', 'true');
  if (range) params.set('range', range);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${backendUrl}/api/pool/blocks/history?${params}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) {
      return res.status(502).json({ error: 'Pool block history is unavailable', blocks: [], total: 0 });
    }

    const data = await response.json();
    const blocks = (Array.isArray(data?.blocks) ? data.blocks : [])
      .map(normalizeBlock)
      .filter((block: PoolBlock | null): block is PoolBlock => block !== null)
      .filter((block: PoolBlock) => block.moneroPayoutStatus !== 'none')
      .sort((a: PoolBlock, b: PoolBlock) => b.foundAt.localeCompare(a.foundAt));

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=15, stale-while-revalidate=30');
    return res.status(200).json({
      blocks,
      total: Math.max(blocks.length, Number(data?.total) || 0),
      generatedAt: Number.isFinite(new Date(data?.generatedAt).getTime())
        ? new Date(data.generatedAt).toISOString()
        : new Date().toISOString()
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? 'Pool block history request timed out' : 'Pool block history is unavailable',
      blocks: [],
      total: 0
    });
  } finally {
    clearTimeout(timeout);
  }
}
