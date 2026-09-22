import type { NextApiRequest, NextApiResponse } from 'next';
import { getPoolRewardTotals } from '@/lib/poolRewardTotals';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const totals = await getPoolRewardTotals();
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=30');
    return res.status(200).json({ ...totals, generatedAt: new Date().toISOString() });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Pool reward totals are temporarily unavailable' });
  }
}
