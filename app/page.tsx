import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import LandingPageClient from './LandingPageClient';
import type { LandingStats } from './LandingPageClient';
import { getLeaderboardDeviceCount } from '@/lib/leaderboard';
import { getLatestClientRelease } from '@/lib/clientRelease';
import type { BenchmarkResult } from '@/types/benchmark';
import { HOME_FAQS } from '@/lib/marketing';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mining Benchmarks & Hardware Comparison | MineBench',
  description: 'Run CPU and GPU mining benchmarks, compare public hardware results, and follow live pool activity. Download the free MineBench client for Windows and Linux.',
  alternates: {
    canonical: 'https://minebench.cloud/',
  },
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
    siteName: 'MineBench',
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

const homepageJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://minebench.cloud/#organization',
      name: 'MineBench',
      alternateName: ['MineBench Mining', 'minebench.cloud'],
      url: 'https://minebench.cloud/',
      description: 'MineBench develops mining benchmark software, a public hardware results database, and live mining pool telemetry.',
      logo: {
        '@type': 'ImageObject',
        '@id': 'https://minebench.cloud/#logo',
        url: 'https://minebench.cloud/android-chrome-512x512.png',
        contentUrl: 'https://minebench.cloud/android-chrome-512x512.png',
        width: 512,
        height: 512,
        caption: 'MineBench',
      },
      image: { '@id': 'https://minebench.cloud/#logo' },
      sameAs: [
        'https://x.com/MineBenchdapp',
        'https://bitbucket.org/minebenchapp/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://minebench.cloud/#website',
      url: 'https://minebench.cloud/',
      name: 'MineBench',
      alternateName: ['MineBench Mining', 'minebench.cloud'],
      description: 'Mining benchmark software, RandomX hardware comparisons, live hashrate, and pool reward data.',
      publisher: { '@id': 'https://minebench.cloud/#organization' },
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://minebench.cloud/#software',
      name: 'MineBench',
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'Cryptocurrency Mining and Hardware Benchmarking',
      operatingSystem: 'Windows, Linux',
      description: 'Mining benchmark software for CPU and GPU miners with RandomX hardware comparisons, live hashrate, pool statistics, and miner telemetry.',
      url: 'https://minebench.cloud/',
      downloadUrl: 'https://minebench.cloud/downloads',
      mainEntityOfPage: { '@id': 'https://minebench.cloud/#website' },
      provider: { '@id': 'https://minebench.cloud/#organization' },
      image: { '@id': 'https://minebench.cloud/#logo' },
      screenshot: 'https://minebench.cloud/og-home.png',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'CPU and GPU mining benchmark runs',
        'RandomX hardware comparison',
        'Live hashrate and pool statistics',
        'Mining hardware leaderboard',
        'Windows and Linux client downloads',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://minebench.cloud/#faq',
      mainEntity: HOME_FAQS.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
};

async function getLandingStats(): Promise<LandingStats> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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

export default async function LandingPage() {
  const [initialStats, clientRelease] = await Promise.all([
    getLandingStats(),
    getLatestClientRelease(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homepageJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <LandingPageClient
        initialStats={initialStats}
        clientVersion={clientRelease?.version || clientRelease?.tag_name || 'Latest'}
      />
    </>
  );
}
