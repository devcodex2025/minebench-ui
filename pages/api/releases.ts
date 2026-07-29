import type { NextApiRequest, NextApiResponse } from 'next';
import { getLatestClientRelease } from '@/lib/clientRelease';
import { fetchGithubJson } from '@/lib/github';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const [cpuRes, gpuRes, clientData] = await Promise.all([
      fetchGithubJson('https://api.github.com/repos/karbivskyi/MineBench-CPU-ZEPH/releases/latest'),
      fetchGithubJson('https://api.github.com/repos/karbivskyi/MineBench-GPU-RVN/releases/latest'),
      getLatestClientRelease(),
    ]);

    res.status(200).json({ cpu: cpuRes.data, gpu: gpuRes.data, client: clientData });
  } catch (err: any) {
    console.error('Error fetching releases:', err);
    res.status(500).json({ error: err.message });
  }
}
