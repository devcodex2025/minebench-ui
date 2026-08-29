import type { NextApiRequest, NextApiResponse } from 'next';

const ALLOWED_RANGES = new Set(['1h', '24h', '7d', '30d']);
const REQUEST_TIMEOUT_MS = 8_000;

type PoolReward = {
  id: string;
  timestamp: string;
  blockHeight: number | null;
  xmrReward: number;
  grossBmt: number;
  userBmt: number;
  treasuryBmt: number;
  distributions: number;
  paidDistributions: number;
  creditedDistributions: number;
  payoutStatus: 'processing' | 'credited' | 'partially_paid' | 'paid';
};

const PAYOUT_STATUSES = new Set(['processing', 'credited', 'partially_paid', 'paid']);

function normalizeReward(value: unknown): PoolReward | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const timestamp = new Date(String(raw.timestamp));
  const xmrReward = Number(raw.xmrReward);
  if (!raw.id || !Number.isFinite(timestamp.getTime()) || !Number.isFinite(xmrReward) || xmrReward <= 0) return null;

  const blockHeight = raw.blockHeight === null || raw.blockHeight === undefined
    ? null
    : Number(raw.blockHeight);
  const distributions = Math.max(0, Math.round(Number(raw.distributions) || 0));
  const paidDistributions = Math.min(
    distributions,
    Math.max(0, Math.round(Number(raw.paidDistributions) || 0))
  );
  const creditedDistributions = Math.min(
    distributions,
    Math.max(0, Math.round(Number(raw.creditedDistributions) || 0))
  );
  const payoutStatus = PAYOUT_STATUSES.has(String(raw.payoutStatus))
    ? String(raw.payoutStatus) as PoolReward['payoutStatus']
    : 'processing';

  return {
    id: String(raw.id),
    timestamp: timestamp.toISOString(),
    blockHeight: Number.isSafeInteger(blockHeight) && Number(blockHeight) > 0 ? Number(blockHeight) : null,
    xmrReward,
    grossBmt: Math.max(0, Number(raw.grossBmt) || 0),
    userBmt: Math.max(0, Number(raw.userBmt) || 0),
    treasuryBmt: Math.max(0, Number(raw.treasuryBmt) || 0),
    distributions,
    paidDistributions,
    creditedDistributions,
    payoutStatus
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed', rewards: [], total: 0 });
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
  if (range) params.set('range', range);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${backendUrl}/api/pool/rewards/history?${params}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Pool reward history is unavailable', rewards: [], total: 0 });
    }

    const data = await response.json();
    const rewards = (Array.isArray(data?.rewards) ? data.rewards : [])
      .map(normalizeReward)
      .filter((reward: PoolReward | null): reward is PoolReward => reward !== null)
      .sort((a: PoolReward, b: PoolReward) => b.timestamp.localeCompare(a.timestamp));

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({
      rewards,
      total: Math.max(rewards.length, Number(data?.total) || 0),
      generatedAt: Number.isFinite(new Date(data?.generatedAt).getTime())
        ? new Date(data.generatedAt).toISOString()
        : new Date().toISOString()
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? 'Pool reward history request timed out' : 'Pool reward history is unavailable',
      rewards: [],
      total: 0
    });
  } finally {
    clearTimeout(timeout);
  }
}
