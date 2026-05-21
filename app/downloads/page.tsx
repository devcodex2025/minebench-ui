import type { Metadata } from 'next';
import DownloadsPageClient from './DownloadsPageClient';
import { getLatestClientRelease } from '@/lib/clientRelease';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const release = await getLatestClientRelease();
  const version = release.version || release.tag_name;

  return {
    title: `Downloads - Minebench ${version} | CPU & GPU Mining Benchmark Clients`,
    description: `Download the latest MineBench ${version} stable clients for Windows, Linux, and macOS. Optimized for RandomX (Monero) and GPU algorithms with real-time performance tracking.`,
    alternates: {
      canonical: 'https://minebench.cloud/downloads',
    },
    openGraph: {
      title: `Downloads - Minebench ${version}`,
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
      title: `Downloads - Minebench ${version}`,
      description: 'Get the latest MineBench clients for Windows, Linux, and macOS. Optimized for maximum hashrate.',
      images: ['https://minebench.cloud/og-downloads.png'],
      creator: '@MineBenchdapp',
    },
  };
}

export default async function DownloadsPage() {
  const clientRelease = await getLatestClientRelease();
  return <DownloadsPageClient initialClientRelease={clientRelease} />;
}
