import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend.minebench.cloud';
    // Server-side fetch to bypass CORS restrictions
    const response = await fetch(`${backendUrl}/api/rates/current`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch rates from backend' });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
