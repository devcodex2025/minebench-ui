import { ImageResponse } from 'next/og';
import {
  OG_CACHE_HEADERS,
  OgFallbackImage,
  OgFrame,
  getOgLeaderboardTop,
  type OgLeaderboardTop,
  type OgStat,
} from '@/lib/og';

export const alt = 'MineBench mining benchmark leaderboard with ranked CPU and GPU results';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const buildStats = (top: OgLeaderboardTop | null): OgStat[] => [
  {
    label: 'Top CPU result',
    value: top?.device ?? '—',
    valueSize: 30,
    grow: 1.5,
    wrap: true,
  },
  { label: 'Top CPU hashrate', value: top?.hashrate ?? '—', accent: true },
  { label: 'CPU devices ranked', value: top?.devices ?? '—' },
];

export default async function Image() {
  let top: OgLeaderboardTop | null = null;

  try {
    top = await getOgLeaderboardTop();
  } catch (error) {
    console.error('[og] Leaderboard data unavailable:', error);
  }

  try {
    return new ImageResponse(
      (
        <OgFrame
          eyebrow="Leaderboard"
          title="Mining benchmark leaderboard"
          subtitle="Ranked CPU and GPU mining benchmark results from real MineBench client submissions."
          stats={buildStats(top)}
          note="CPU and GPU hashrate, power, thermals and hardware comparisons"
        />
      ),
      { width: 1200, height: 630, headers: OG_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[og] Leaderboard image render failed:', error);
    return new ImageResponse(<OgFallbackImage />, { width: 1200, height: 630, headers: OG_CACHE_HEADERS });
  }
}
