import type { NextApiRequest, NextApiResponse } from 'next';

const DISCORD_INVITE_CODE = 'vsDyYh4rma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true&with_expiration=true`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch Discord invite data' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Discord API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
