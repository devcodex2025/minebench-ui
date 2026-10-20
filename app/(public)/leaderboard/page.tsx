import type { Metadata } from 'next';
import LeaderboardClient from './LeaderboardClient';
import { getPublicBenchmarks } from '@/lib/publicBenchmarks';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'RandomX & Mining Benchmark Leaderboard | MineBench',
  description: 'Compare RandomX CPU mining benchmarks and public hardware results by hashrate, power, temperature, algorithm, and benchmark duration.',
  alternates: {
    canonical: 'https://minebench.cloud/leaderboard',
  },
  openGraph: {
    title: 'RandomX & Mining Benchmark Leaderboard | MineBench',
    description: 'Compare public RandomX CPU benchmarks and GPU mining benchmark submissions with visible hashrate and test context.',
    url: 'https://minebench.cloud/leaderboard',
    type: 'website',
  },
};

export default async function LeaderboardPage() {
  const initialResults = await getPublicBenchmarks();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'RandomX and Mining Benchmark Leaderboard',
    description: 'Public CPU and GPU mining benchmark results with algorithm, hashrate, power, temperature, and duration when submitted.',
    about: [
      'CPU mining benchmark',
      'GPU mining benchmark',
      'RandomX hashrate leaderboard',
      'Monero mining hardware comparison'
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <LeaderboardClient initialSnapshot={initialResults} initialUpdatedAt={initialResults.available ? new Date().toISOString() : null} />
    </>
  );
}
