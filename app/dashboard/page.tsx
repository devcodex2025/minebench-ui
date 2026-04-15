import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'MineBench Dashboard | Live CPU Mining Benchmark And Hashrate Leaderboard',
  description: 'Track live hashrate, online benchmark clients, CPU mining benchmark results, GPU mining performance, and the hardware leaderboard for MineBench.',
  keywords: [
    'cpu mining benchmark',
    'randomx benchmark',
    'gpu mining benchmark',
    'mining leaderboard',
    'live hashrate dashboard',
    'monero mining benchmark',
    'hardware benchmark leaderboard',
    'cpu mining performance',
  ],
  openGraph: {
    title: 'MineBench Dashboard | Live CPU Mining Benchmark',
    description: 'Live hashrate, online clients, CPU mining benchmark results, and GPU mining leaderboard data from MineBench.',
    url: 'https://minebench.cloud/dashboard',
    siteName: 'Minebench',
    images: [
      {
        url: 'https://minebench.cloud/og-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Minebench Network Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MineBench Dashboard | Live Mining Benchmark Leaderboard',
    description: 'Monitor live hashrate, online clients, CPU benchmark results, and GPU mining performance.',
    images: ['https://minebench.cloud/og-dashboard.png'],
    creator: '@MineBenchdapp',
  },
};

export default function Dashboard() {
  return <DashboardClient />;
}
