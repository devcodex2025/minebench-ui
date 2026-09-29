import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'MineBench Dashboard | Live CPU Mining Benchmark And Hardware Results',
  description: 'Track live hashrate, online benchmark clients, CPU mining benchmark results, GPU mining performance, and ranked hardware results for MineBench.',
  alternates: {
    canonical: 'https://minebench.cloud/dashboard',
  },
  keywords: [
    'cpu mining benchmark',
    'randomx benchmark',
    'gpu mining benchmark',
    'live hashrate dashboard',
    'monero mining benchmark',
    'hardware benchmark results',
    'cpu mining performance',
    'mining results dashboard',
  ],
  openGraph: {
    title: 'MineBench Dashboard | Live CPU Mining Benchmark',
    description: 'Live hashrate, online clients, CPU mining benchmark results, and ranked GPU and CPU data from MineBench.',
    url: 'https://minebench.cloud/dashboard',
    siteName: 'Minebench',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MineBench Dashboard | Live Mining Benchmark Results',
    description: 'Monitor live hashrate, online clients, CPU benchmark results, and GPU mining performance.',
    creator: '@MineBenchdapp',
  },
};

export default function Dashboard() {
  return <DashboardClient />;
}
