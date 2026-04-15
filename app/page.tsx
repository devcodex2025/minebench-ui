import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

export const metadata: Metadata = {
  title: 'MineBench | Mining Benchmark Software, RandomX Benchmark, Monero Mining App',
  description: 'MineBench is desktop mining benchmark software for CPU and GPU miners. Compare hardware performance, track RandomX benchmark results, explore the mining leaderboard, and use a Monero mining app with a cleaner UI.',
  keywords: [
    'mining benchmark software',
    'cpu mining benchmark',
    'gpu mining benchmark',
    'randomx benchmark',
    'monero mining app',
    'mining leaderboard',
    'desktop mining software',
    'monero mining software',
    'hardware benchmark software',
    'hashrate benchmark',
  ],
  openGraph: {
    title: 'MineBench | Mining Benchmark Software And Monero Mining App',
    description: 'Compare CPU and GPU mining performance, track RandomX benchmark results, and explore a cleaner desktop mining workflow with MineBench.',
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
    title: 'MineBench | RandomX Benchmark And Mining Leaderboard',
    description: 'Desktop mining benchmark software for CPU and GPU miners with RandomX benchmarking, hardware comparison, and Solana-based rewards.',
    images: ['https://minebench.cloud/og-home.png'],
    creator: '@MineBenchdapp',
  },
};

export default function LandingPage() {
  return <LandingPageClient />;
}
