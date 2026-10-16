import type { Metadata } from 'next';
import DownloadsPageClient from './DownloadsPageClient';
import { getLatestClientRelease } from '@/lib/publicClientRelease';

export const dynamic = 'force-dynamic';

const DETAIL_TAIL = 'Run a RandomX CPU mining benchmark and compare your hardware to public results.';
const FALLBACK_PLATFORMS_LABEL = 'Windows and Linux';

const PLATFORM_MATCHERS: Array<{ label: string; matches: (name: string) => boolean }> = [
  { label: 'Windows', matches: (name) => /\.(exe|msi)$/i.test(name) },
  { label: 'macOS', matches: (name) => /\.dmg$/i.test(name) },
  { label: 'Linux', matches: (name) => /\.(appimage|deb|rpm)$/i.test(name) },
];

const resolvePlatformLabel = (assets?: Array<{ name: string }>): string => {
  const names = (assets || [])
    .map((asset) => asset?.name || '')
    .filter((name) => name.length > 0);

  const labels = PLATFORM_MATCHERS
    .filter((matcher) => names.some((name) => matcher.matches(name)))
    .map((matcher) => matcher.label);

  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
};

const buildDescription = (version: string, platformLabel: string): string => {
  const versionLabel = version && version !== 'latest' ? `${version} ` : '';
  return `Download the free MineBench ${versionLabel}desktop client for ${platformLabel}. ${DETAIL_TAIL}`;
};

const FALLBACK_DESCRIPTION = `Download the MineBench desktop client for ${FALLBACK_PLATFORMS_LABEL}. ${DETAIL_TAIL}`;

export async function generateMetadata(): Promise<Metadata> {
  const release = await getLatestClientRelease();
  const isFallback = release?.metadataStatus === 'fallback';
  const version = !isFallback ? (release?.version || release?.tag_name || '') : '';
  const platformLabel = resolvePlatformLabel(release?.assets);
  const description = platformLabel
    ? buildDescription(version, platformLabel)
    : FALLBACK_DESCRIPTION;

  return {
    title: `CPU Mining Benchmark Software Download | MineBench${version ? ` ${version}` : ''}`,
    description: description,
    alternates: {
      canonical: 'https://minebench.cloud/downloads',
    },
    openGraph: {
      title: `CPU Mining Benchmark Software Download | MineBench${version ? ` ${version}` : ''}`,
      description: description,
      url: 'https://minebench.cloud/downloads',
      siteName: 'MineBench',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `CPU Mining Benchmark Software Download | MineBench${version ? ` ${version}` : ''}`,
      description: description,
      creator: '@MineBenchdapp',
    },
  };
}

export default async function DownloadsPage() {
  const clientRelease = await getLatestClientRelease();
  return <DownloadsPageClient initialClientRelease={clientRelease} />;
}
