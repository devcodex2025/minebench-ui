import type { NextApiRequest, NextApiResponse } from 'next';

type Point = { t: string; hashrate: number; bmtHashrate: number; xmrHashrate: number; miners: number };
const RANGES = new Set(['1h', '24h', '7d', '30d']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ points: [] });
  const requested = Array.isArray(req.query.range) ? req.query.range[0] : req.query.range;
  const range = RANGES.has(String(requested)) ? String(requested) : '24h';
  const backend = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://backend.minebench.cloud').replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${backend}/api/pool/stats/history?range=${encodeURIComponent(range)}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) return res.status(502).json({ range, points: [] });
    const payload = await response.json();
    const points = (Array.isArray(payload?.points) ? payload.points : []).map((raw: Record<string, unknown>): Point | null => {
      if (!raw || typeof raw !== 'object') return null;
      const timestamp = new Date(String(raw.t));
      if (!Number.isFinite(timestamp.getTime())) return null;
      const total = Math.max(0, Number(raw.hashrate) || 0);
      const rawBmt = Math.max(0, Number(raw.bmtHashrate) || 0);
      const rawXmr = Math.max(0, Number(raw.xmrHashrate) || 0);
      const splitTotal = rawBmt + rawXmr;
      const scale = splitTotal > total && splitTotal > 0 ? total / splitTotal : 1;
      const hasSplit = splitTotal > 0;
      return {
        t: timestamp.toISOString(),
        hashrate: total,
        bmtHashrate: hasSplit ? rawBmt * scale : total,
        xmrHashrate: rawXmr * scale,
        miners: Math.max(0, Number(raw.miners) || 0)
      };
    }).filter((point: Point | null): point is Point => point !== null).slice(-400);
    return res.status(200).json({ range, generatedAt: payload?.generatedAt || new Date().toISOString(), points });
  } catch { return res.status(502).json({ range, points: [] }); }
  finally { clearTimeout(timeout); }
}
