import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import LandingPageClient from './LandingPageClient';
import type { LandingStats, PoolStatus } from './LandingPageClient';
import { getLeaderboardDeviceCount } from '@/lib/leaderboard';
import { getLatestClientRelease } from '@/lib/clientRelease';
import type { BenchmarkResult } from '@/types/benchmark';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MineBench | Mining Benchmark Software And RandomX Hardware Comparison',
  description: 'Compare CPU and GPU mining hardware, track RandomX benchmark results, inspect the live dashboard, and download the MineBench client for a cleaner mining workflow.',
  keywords: [
    'mining benchmark software',
    'cpu mining benchmark',
    'gpu mining benchmark',
    'randomx benchmark',
    'hardware comparison for miners',
    'mining results dashboard',
    'desktop mining software',
    'monero mining software',
    'hardware benchmark software',
    'hashrate benchmark',
  ],
  openGraph: {
    title: 'MineBench | Mining Benchmark Software And RandomX Comparison',
    description: 'Compare mining hardware, inspect the live dashboard, and download the MineBench client.',
    url: 'https://minebench.cloud',
    siteName: 'Minebench',
    images: [
      {
        url: 'https://minebench.cloud/og-home.png',
        width: 1200,
        height: 630,
        alt: 'Minebench - Hardware Benchmarking Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MineBench | RandomX Benchmark And Hardware Results Dashboard',
    description: 'Mining benchmark software for CPU and GPU miners with hardware comparison and cleaner client UX.',
    images: ['https://minebench.cloud/og-home.png'],
    creator: '@MineBenchdapp',
  },
};

async function getLandingStats(): Promise<LandingStats> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { benchmarks: 0, miners: 0, downloads: 0 };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const [benchmarksResult, globalStatsResult] = await Promise.allSettled([
    supabase
      .from('benchmarks')
      .select('id, device_uid, device_name, device_type, avg_hashrate, created_at'),
    supabase
      .from('global_stats')
      .select('total_downloads')
      .eq('id', 1)
      .single()
  ]);

  const benchmarks = benchmarksResult.status === 'fulfilled' && !benchmarksResult.value.error
    ? (benchmarksResult.value.data || []) as BenchmarkResult[]
    : [];
  const downloads = globalStatsResult.status === 'fulfilled' && !globalStatsResult.value.error
    ? Number(globalStatsResult.value.data?.total_downloads || 0)
    : 0;

  return {
    benchmarks: benchmarks.length,
    miners: getLeaderboardDeviceCount(benchmarks),
    downloads: Number.isFinite(downloads) ? downloads : 0,
  };
}

async function getPoolStats(): Promise<PoolStatus> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend.minebench.cloud';
  try {
    const response = await fetch(`${backendUrl}/api/pool/stats`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return { hashrate: 0, miners: 0 };
    const data = await response.json();
    return {
      hashrate: Number(data.poolHashrate || data.stratum?.hashrate_15m || 0),
      miners: Number(data.miners || data.stratum?.connections || data.stratum?.workers?.length || 0),
    };
  } catch {
    return { hashrate: 0, miners: 0 };
  }
}

export default async function LandingPage() {
  const [initialStats, clientRelease, initialPoolStatus] = await Promise.all([
    getLandingStats(),
    getLatestClientRelease(),
    getPoolStats(),
  ]);

  return (
    <LandingPageClient
      initialStats={initialStats}
      clientVersion={clientRelease?.version || clientRelease?.tag_name || 'Latest'}
      initialPoolStatus={initialPoolStatus}
    />
  );
}
