import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import {
  BenchmarkSecurityError,
  validateBenchmarkPayload,
  verifyBenchmarkToken,
} from '../../lib/benchmarkSecurity';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // секрет, не публікувати на фронтенді
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;
const SUBMISSION_COOLDOWN_SECONDS = 60;
const PUBLIC_FIELDS = [
  'id',
  'device_type',
  'device_name',
  'avg_temp',
  'avg_hashrate',
  'max_hashrate',
  'duration_seconds',
  'algorithm',
  'coin_name',
  'created_at',
  'avg_power',
].join(',');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const auth = verifyBenchmarkToken(req.headers.authorization, process.env.JWT_SECRET);
      const record = validateBenchmarkPayload(req.body, auth.walletAddress);
      const createdAt = new Date().toISOString();
      const cooldownStart = new Date(Date.now() - SUBMISSION_COOLDOWN_SECONDS * 1000).toISOString();

      const { data: recent, error: cooldownError } = await supabase
        .from('benchmarks')
        .select('id')
        .eq('solana_wallet_address', auth.walletAddress)
        .eq('device_uid', record.device_uid)
        .gte('created_at', cooldownStart)
        .limit(1);

      if (cooldownError) {
        console.error('Benchmark cooldown check failed:', cooldownError.message);
        return res.status(500).json({ error: 'Unable to submit benchmark' });
      }
      if (recent && recent.length > 0) {
        res.setHeader('Retry-After', String(SUBMISSION_COOLDOWN_SECONDS));
        return res.status(429).json({ error: 'Benchmark submission rate limit exceeded' });
      }

      const { data, error } = await supabase
        .from('benchmarks')
        .insert([{ ...record, created_at: createdAt }])
        .select('id, created_at')
        .single();

      if (error) {
        console.error('Benchmark insert failed:', error.message);
        return res.status(500).json({ error: 'Unable to submit benchmark' });
      }
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
      .select(PUBLIC_FIELDS)
      .order('created_at', { ascending: false })
      .range(0, limit - 1);

    if (error) {
      console.error('Benchmark read failed:', error.message);
      return res.status(500).json({ error: 'Unable to load benchmarks' });
    }
    res.status(200).json(data);
  } catch (err: unknown) {
    if (err instanceof BenchmarkSecurityError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Benchmark API failed:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Benchmark API request failed' });
  }
}
