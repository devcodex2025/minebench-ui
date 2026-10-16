import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { BenchmarkResult } from '@/types/benchmark';

export const PUBLIC_BENCHMARK_LIMIT = 500;
const FETCH_TIMEOUT_MS = 5000;
const PUBLIC_FIELDS = 'id,device_type,device_name,avg_temp,avg_hashrate,max_hashrate,duration_seconds,algorithm,coin_name,created_at,avg_power';

export interface PublicBenchmarkSnapshot { results: BenchmarkResult[]; available: boolean }

export async function getPublicBenchmarks(): Promise<PublicBenchmarkSnapshot> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return { results: [], available: false };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const { data, error } = await createClient(supabaseUrl, serviceKey)
      .from('benchmarks').select(PUBLIC_FIELDS).order('created_at', { ascending: false })
      .range(0, PUBLIC_BENCHMARK_LIMIT - 1).abortSignal(controller.signal);
    if (error || !data) return { results: [], available: false };
    return { results: data as BenchmarkResult[], available: true };
  } catch {
    return { results: [], available: false };
  } finally {
    clearTimeout(timeout);
  }
}
