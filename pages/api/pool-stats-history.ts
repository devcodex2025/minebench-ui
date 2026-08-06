import type { NextApiRequest, NextApiResponse } from 'next';

const ALLOWED_RANGES = ['1h', '6h', '24h', '7d', '30d'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend.minebench.cloud';
    const rawRange = Array.isArray(req.query.range) ? req.query.range[0] : req.query.range;
    const range = ALLOWED_RANGES.includes(String(rawRange)) ? String(rawRange) : '24h';

    const response = await fetch(`${backendUrl}/api/pool/stats/history?range=${range}`, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch pool hashrate history', range, points: [] });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message, points: [] });
  }
}
