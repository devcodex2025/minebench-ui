import type { NextApiRequest, NextApiResponse } from 'next';
import { getLatestClientRelease } from '@/lib/clientRelease';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const GITHUB_TOKEN =
    process.env.GITHUB_SERVER_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
  const githubHeaders: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  if (GITHUB_TOKEN) {
    githubHeaders.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const fetchGithubRelease = async (url: string) => {
    let response = await fetch(url, { headers: githubHeaders });

    if ((response.status === 401 || response.status === 403) && githubHeaders.Authorization) {
      const { Authorization: _authorization, ...publicHeaders } = githubHeaders;
      response = await fetch(url, { headers: publicHeaders });
    }

    return response;
  };

  try {
    const [cpuRes, gpuRes, clientData] = await Promise.all([
      fetchGithubRelease('https://api.github.com/repos/karbivskyi/MineBench-CPU-ZEPH/releases/latest'),
      fetchGithubRelease('https://api.github.com/repos/karbivskyi/MineBench-GPU-RVN/releases/latest'),
      getLatestClientRelease()
    ]);

    const cpuData = cpuRes.ok ? await cpuRes.json() : null;
    const gpuData = gpuRes.ok ? await gpuRes.json() : null;

    res.status(200).json({ cpu: cpuData, gpu: gpuData, client: clientData });
  } catch (err: any) {
    console.error("Error fetching releases:", err);
    res.status(500).json({ error: err.message });
  }
}
