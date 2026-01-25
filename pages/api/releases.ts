import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }

  try {
    const [cpuRes, gpuRes, clientRes] = await Promise.all([
      fetch('https://api.github.com/repos/karbivskyi/MineBench-CPU-ZEPH/releases/latest', {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }),
      fetch('https://api.github.com/repos/karbivskyi/MineBench-GPU-RVN/releases/latest', {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }),
      fetch('https://api.github.com/repos/devcodex2025/MineBench-Client/releases/latest', {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    ]);

    // Check responses specifically
    if (!cpuRes.ok) {
       console.error(`CPU Release fetch failed: ${cpuRes.status} ${cpuRes.statusText}`);
    }
    if (!gpuRes.ok) {
        console.error(`GPU Release fetch failed: ${gpuRes.status} ${gpuRes.statusText}`);
    }
    if (!clientRes.ok) {
        console.error(`Client Release fetch failed: ${clientRes.status} ${clientRes.statusText}`);
    }

    const cpuData = cpuRes.ok ? await cpuRes.json() : null;
    const gpuData = gpuRes.ok ? await gpuRes.json() : null;
    const clientData = clientRes.ok ? await clientRes.json() : null;

    res.status(200).json({ cpu: cpuData, gpu: gpuData, client: clientData });
  } catch (err: any) {
    console.error("Error fetching releases:", err);
    res.status(500).json({ error: err.message });
  }
}
