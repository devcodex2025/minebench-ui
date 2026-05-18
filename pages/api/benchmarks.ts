import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // секрет, не публікувати на фронтенді
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;
const MAX_STRING_LENGTH = 256;

const toFiniteNumber = (value: unknown): number | null => {
  const next = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(next) ? next : null;
};

const toStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const next = String(value).trim();
  return next ? next.slice(0, MAX_STRING_LENGTH) : null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const avgHashrate = toFiniteNumber(body.avg_hashrate);
      const maxHashrate = toFiniteNumber(body.max_hashrate);

      if (avgHashrate === null || avgHashrate < 0) {
        return res.status(400).json({ error: 'avg_hashrate must be a non-negative number' });
      }

      const record = {
        avg_hashrate: avgHashrate,
        max_hashrate: maxHashrate,
        duration_seconds: toFiniteNumber(body.duration_seconds),
        device_type: toStringOrNull(body.device_type),
        device_name: toStringOrNull(body.device_name),
        avg_temp: toFiniteNumber(body.avg_temp),
        avg_power: toFiniteNumber(body.avg_power),
        algorithm: toStringOrNull(body.algorithm),
        coin_name: toStringOrNull(body.coin_name),
        solana_wallet_address: toStringOrNull(body.solana_wallet_address),
        device_uid: toStringOrNull(body.device_uid),
        created_at: toStringOrNull(body.created_at) || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('benchmarks')
        .insert([record])
        .select('id, created_at')
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ success: true, benchmark: data });
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : DEFAULT_LIMIT;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    const { data, error } = await supabase
      .from('benchmarks')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, limit - 1);

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
