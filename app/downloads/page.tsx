import type { Metadata } from 'next';
import DownloadsPageClient from './DownloadsPageClient';
import { getLatestClientRelease } from '@/lib/clientRelease';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const release = await getLatestClientRelease();
  const version = release?.version || release?.tag_name || 'latest';
  const description = 'Download the free MineBench client. Choose an available build for your operating system, run mining benchmarks, and compare your hardware with public results.';

  return {
    title: `Download MineBench ${version} | Free Mining Benchmark`,
    description: description,
    alternates: {
      canonical: 'https://minebench.cloud/downloads',
    },
    openGraph: {
      title: `Downloads - Minebench ${version}`,
      description: description,
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
      description: description,
      images: ['https://minebench.cloud/og-downloads.png'],
      creator: '@MineBenchdapp',
    },
  };
}

export default async function DownloadsPage() {
  const clientRelease = await getLatestClientRelease();
  return <DownloadsPageClient initialClientRelease={clientRelease} />;
}
