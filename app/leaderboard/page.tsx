import type { Metadata } from 'next';
import LeaderboardClient from './LeaderboardClient';

export const metadata: Metadata = {
  title: 'Mining Benchmark Leaderboard | CPU and GPU Mining Rankings | MineBench',
  description: 'Compare MineBench CPU and GPU mining benchmark rankings, RandomX hashrate, power draw, thermals, and unique hardware performance results.',
  alternates: {
    canonical: '/leaderboard',
  },
  openGraph: {
    title: 'MineBench Mining Benchmark Leaderboard',
    description: 'Ranked CPU and GPU mining benchmark results from real MineBench client submissions.',
    url: '/leaderboard',
    type: 'website',
  },
};

export default function LeaderboardPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'MineBench Mining Benchmark Leaderboard',
    description: 'CPU and GPU mining benchmark rankings with hashrate, power, thermal, and hardware performance data.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LeaderboardClient />
    </>
  );
}
