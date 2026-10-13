import { ImageResponse } from 'next/og';
import {
  EMPTY_RELEASE_INFO,
  OG_CACHE_HEADERS,
  OgFallbackImage,
  OgFrame,
  getOgReleaseInfo,
  type OgReleaseInfo,
  type OgStat,
} from '@/lib/og';

export const alt = 'Download the MineBench desktop client for Windows, macOS and Linux';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const buildStats = (release: OgReleaseInfo): OgStat[] => [
  { label: 'Client version', value: release.version, accent: true, grow: 1.1 },
  { label: 'Platforms', value: release.platforms, valueSize: 30, grow: 1.5, wrap: true },
  { label: 'Cost', value: 'Free' },
];

export default async function Image() {
  let release = EMPTY_RELEASE_INFO;

  try {
    release = await getOgReleaseInfo();
  } catch (error) {
    console.error('[og] Downloads release info unavailable:', error);
  }

  try {
    return new ImageResponse(
      (
        <OgFrame
          eyebrow="Downloads"
          title={`Download the MineBench client ${release.version}`}
          subtitle="Free desktop client for RandomX CPU mining benchmarks and GPU mining benchmark runs."
          stats={buildStats(release)}
        />
      ),
      { width: 1200, height: 630, headers: OG_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[og] Downloads image render failed:', error);
    return new ImageResponse(<OgFallbackImage />, { width: 1200, height: 630, headers: OG_CACHE_HEADERS });
  }
}
