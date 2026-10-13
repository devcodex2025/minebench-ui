import { ImageResponse } from 'next/og';
import {
  EMPTY_NETWORK_STATS,
  OG_CACHE_HEADERS,
  OgFallbackImage,
  OgFrame,
  getOgNetworkStats,
  type OgNetworkStats,
  type OgStat,
} from '@/lib/og';

export const alt = 'MineBench live mining pool stats: hashrate, miners online, XMR and BMT prices';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const buildStats = (stats: OgNetworkStats): OgStat[] => [
  { label: 'Pool hashrate', value: stats.hashrate, accent: true },
  { label: 'Miners online', value: stats.miners },
  { label: 'XMR / USD', value: stats.xmrUsd },
  { label: 'BMT / USD', value: stats.bmtUsd },
];

export default async function Image() {
  let stats = EMPTY_NETWORK_STATS;

  try {
    stats = await getOgNetworkStats();
  } catch (error) {
    console.error('[og] Home live stats unavailable:', error);
  }

  try {
    return new ImageResponse(
      (
        <OgFrame
          eyebrow="Live network"
          title="Mining benchmark software and live hardware results"
          subtitle="Compare CPU and GPU mining benchmarks, then follow live pool hashrate, miners and reward rates."
          stats={buildStats(stats)}
          note={`XMR to BMT rate: ${stats.xmrBmtRate}`}
        />
      ),
      { width: 1200, height: 630, headers: OG_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[og] Home image render failed:', error);
    return new ImageResponse(<OgFallbackImage />, { width: 1200, height: 630, headers: OG_CACHE_HEADERS });
  }
}
