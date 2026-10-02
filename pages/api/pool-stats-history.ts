import type { NextApiRequest, NextApiResponse } from 'next';

const ALLOWED_RANGES = new Set(['1h', '24h', '7d', '30d']);
const REQUEST_TIMEOUT_MS = 8_000;

type HistoryPoint = { t: string; hashrate: number; bmtHashrate: number; xmrHashrate: number; miners: number };

function normalizePoint(value: unknown): HistoryPoint | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const timestamp = new Date(String(raw.t));
  const hashrate = Number(raw.hashrate);
  const miners = Number(raw.miners);
  if (!Number.isFinite(timestamp.getTime()) || !Number.isFinite(hashrate) || !Number.isFinite(miners)) return null;
  const bmtHashrate = Number(raw.bmtHashrate);
  const xmrHashrate = Number(raw.xmrHashrate);
  return {
    t: timestamp.toISOString(),
    hashrate: Math.max(0, hashrate),
    bmtHashrate: Number.isFinite(bmtHashrate) ? Math.max(0, bmtHashrate) : 0,
    xmrHashrate: Number.isFinite(xmrHashrate) ? Math.max(0, xmrHashrate) : 0,
    miners: Math.max(0, Math.round(miners))
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed', points: [] });
  }

  const rawRange = Array.isArray(req.query.range) ? req.query.range[0] : req.query.range;
  const range = ALLOWED_RANGES.has(String(rawRange)) ? String(rawRange) : '24h';
  const backendUrl = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://backend.minebench.cloud')
    .replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${backendUrl}/api/pool/stats/history?range=${encodeURIComponent(range)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Pool hashrate history is unavailable', range, points: [] });
    }

    const data = await response.json();
    const rawPoints: unknown[] = Array.isArray(data?.points) ? data.points : [];
    const points = rawPoints
      .map(normalizePoint)
      .filter((point): point is HistoryPoint => point !== null)
      .sort((a, b) => a.t.localeCompare(b.t))
      .slice(-400);

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({
      range,
      generatedAt: Number.isFinite(new Date(data?.generatedAt).getTime())
        ? new Date(data.generatedAt).toISOString()
        : new Date().toISOString(),
      points
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? 'Pool hashrate history request timed out' : 'Pool hashrate history is unavailable',
      range,
      points: []
    });
  } finally {
    clearTimeout(timeout);
  }
}
