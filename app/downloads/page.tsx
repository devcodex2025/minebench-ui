import type { Metadata } from 'next';
import DownloadsPageClient from './DownloadsPageClient';

export const metadata: Metadata = {
  title: 'Downloads - Minebench v0.8.9 | CPU & GPU Mining Benchmark Clients',
  description: 'Download the latest MineBench v0.8.9 stable clients for Windows, Linux, and macOS. Optimized for RandomX (Monero) and GPU algorithms with real-time performance tracking.',
  alternates: {
    canonical: 'https://minebench.cloud/downloads',
  },
  openGraph: {
    title: 'Downloads - Minebench v0.8.9',
    description: 'Get the latest MineBench clients for Windows, Linux, and macOS. Optimized for maximum hashrate and efficiency.',
    url: 'https://minebench.cloud/downloads',
    siteName: 'Minebench',
    images: [
      {
        url: 'https://minebench.cloud/og-downloads.png',
        width: 1200,
        height: 630,
        alt: 'Minebench Downloads - Multi-OS Support',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Downloads - Minebench v0.8.9',
    description: 'Get the latest MineBench clients for Windows, Linux, and macOS. Optimized for maximum hashrate.',
    images: ['https://minebench.cloud/og-downloads.png'],
    creator: '@MineBenchdapp',
  },
};

export default function DownloadsPage() {
  return <DownloadsPageClient />;
}
