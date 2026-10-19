import type { NextApiRequest, NextApiResponse } from 'next';
import { getLatestClientRelease } from '@/lib/clientRelease';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const client = await getLatestClientRelease();
    res.status(200).json({ cpu: null, gpu: null, client });
  } catch (err: any) {
    console.error('Error fetching client release metadata:', err);
    res.status(503).json({ cpu: null, gpu: null, client: null, metadataStatus: 'unavailable', error: 'Client release metadata is temporarily unavailable' });
  }
}
