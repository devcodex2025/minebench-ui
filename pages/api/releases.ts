import type { NextApiRequest, NextApiResponse } from 'next';
import { getLatestBitbucketRelease, getLatestClientRelease } from '@/lib/clientRelease';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const [cpuData, gpuData, clientData] = await Promise.all([
      getLatestBitbucketRelease('minebench-cpu-zeph').catch(() => null),
      getLatestBitbucketRelease('minebench-gpu-rvn').catch(() => null),
      getLatestClientRelease()
    ]);

    res.status(200).json({ cpu: cpuData, gpu: gpuData, client: clientData });
  } catch (err: any) {
    console.error("Error fetching releases:", err);
    res.status(500).json({ error: err.message });
  }
}
