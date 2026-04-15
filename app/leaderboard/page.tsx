import type { Metadata } from 'next';
import LeaderboardClient from './LeaderboardClient';

export const metadata: Metadata = {
  title: 'Leaderboard - Top Mining Hardware | GPU & CPU Performance Rankings',
  description: 'Who has the most powerful rig? Compare NVIDIA, AMD, and Intel hardware performance. Live rankings for Monero (RandomX) and GPU mining efficiency.',
  openGraph: {
    title: 'Mining Leaderboard - Minebench',
    description: 'Real-time mining hardware rankings. Compare GPU and CPU efficiency.',
    url: 'https://minebench.cloud/leaderboard',
    images: [{ url: 'https://minebench.cloud/og-leaderboard.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leaderboard - Minebench Hardware Rankings',
    description: 'Top performing GPUs and CPUs in the mining world.',
    images: ['https://minebench.cloud/og-leaderboard.png'],
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
