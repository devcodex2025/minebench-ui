import type { ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getLatestClientRelease } from '@/lib/clientRelease';
import { getBenchmarkHashrate, getLeaderboardRows, normalizeDeviceName } from '@/lib/leaderboard';
import { normalizePoolStats } from '@/lib/pool-stats';
import { formatHashrate } from '@/lib/utils';
import type { BenchmarkResult } from '@/types/benchmark';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend.minebench.cloud';
const FETCH_TIMEOUT_MS = 4000;
const UNAVAILABLE = '—';

export const UNAVAILABLE_VALUE = UNAVAILABLE;

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[og] Live data request failed for ${url}:`, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const timeoutFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const externalSignal = init?.signal;
  const abortFromExternal = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', abortFromExternal);
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
};

const formatUsd = (value: unknown, digits: number): string => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return UNAVAILABLE;
  return `$${number.toFixed(digits)}`;
};

const formatRate = (value: unknown): string => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return UNAVAILABLE;
  return number.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const formatCount = (value: unknown): string => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return UNAVAILABLE;
  return number.toLocaleString('en-US');
};

export type OgNetworkStats = {
  hashrate: string;
  miners: string;
  xmrUsd: string;
  bmtUsd: string;
  xmrBmtRate: string;
};

export const EMPTY_NETWORK_STATS: OgNetworkStats = {
  hashrate: UNAVAILABLE,
  miners: UNAVAILABLE,
  xmrUsd: UNAVAILABLE,
  bmtUsd: UNAVAILABLE,
  xmrBmtRate: UNAVAILABLE,
};

export async function getOgNetworkStats(): Promise<OgNetworkStats> {
  const [poolStats, rates] = await Promise.all([
    fetchJson<Record<string, unknown>>(`${BACKEND_BASE_URL}/api/pool/stats`),
    fetchJson<Record<string, unknown>>(`${BACKEND_BASE_URL}/api/rates/current`),
  ]);

  const normalized = poolStats ? normalizePoolStats(poolStats) : null;

  return {
    hashrate: normalized && normalized.poolHashrate > 0 ? formatHashrate(normalized.poolHashrate) : UNAVAILABLE,
    miners: normalized ? formatCount(normalized.miners) : UNAVAILABLE,
    xmrUsd: rates ? formatUsd(rates.xmr_usd, 2) : UNAVAILABLE,
    bmtUsd: rates ? formatUsd(rates.bmt_usd, 8) : UNAVAILABLE,
    xmrBmtRate: rates ? formatRate(rates.rate_xmr_bmt) : UNAVAILABLE,
  };
}

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

export type OgReleaseInfo = { version: string; platforms: string };

export const EMPTY_RELEASE_INFO: OgReleaseInfo = {
  version: UNAVAILABLE,
  platforms: UNAVAILABLE,
};

export async function getOgReleaseInfo(): Promise<OgReleaseInfo> {
  try {
    const release = await getLatestClientRelease();
    const version = release?.version || release?.tag_name || '';
    const platforms = resolvePlatformLabel(release?.assets);

    return {
      version: version || UNAVAILABLE,
      platforms: platforms || UNAVAILABLE,
    };
  } catch (error) {
    console.error('[og] Latest client release unavailable:', error);
    return EMPTY_RELEASE_INFO;
  }
}

export type OgLeaderboardTop = { device: string; hashrate: string; devices: string };

export async function getOgLeaderboardTop(): Promise<OgLeaderboardTop | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, { global: { fetch: timeoutFetch } });
    const { data, error } = await supabase
      .from('benchmarks')
      .select('device_name, device_type, avg_hashrate, algorithm, created_at')
      .limit(500);

    if (error || !Array.isArray(data)) {
      if (error) console.error('[og] Leaderboard query failed:', error.message);
      return null;
    }

    const cpuRows = getLeaderboardRows(data as BenchmarkResult[], 'cpu');
    const top = cpuRows[0];
    if (!top) return null;

    return {
      device: normalizeDeviceName(top),
      hashrate: getBenchmarkHashrate(top) > 0 ? formatHashrate(getBenchmarkHashrate(top)) : UNAVAILABLE,
      devices: formatCount(cpuRows.length),
    };
  } catch (error) {
    console.error('[og] Leaderboard data unavailable:', error);
    return null;
  }
}

export type OgStat = {
  label: string;
  value: string;
  accent?: boolean;
  valueSize?: number;
  grow?: number;
  wrap?: boolean;
};

export const OG_CACHE_HEADERS = {
  'cache-control': 'public, max-age=0, must-revalidate',
};

const resolveValueSize = (value: string, explicit?: number): number => {
  if (explicit) return explicit;
  if (value.length <= 7) return 44;
  if (value.length <= 11) return 34;
  return 26;
};

function OgStatCard({ label, value, accent, valueSize, grow, wrap }: OgStat) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: grow ?? 1,
        flexBasis: 0,
        minWidth: 0,
        padding: '20px 22px',
        border: '1px solid #27272A',
        borderRadius: 18,
        backgroundColor: 'rgba(9, 10, 11, 0.72)',
      }}
    >
      <div style={{ display: 'flex', fontSize: 19, color: '#A1A1AA', letterSpacing: 1.4 }}>
        {label.toUpperCase()}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: resolveValueSize(value, valueSize),
          lineHeight: wrap ? 1.16 : 1.25,
          marginTop: 10,
          whiteSpace: wrap ? 'normal' : 'nowrap',
          color: accent ? '#FACC15' : '#F4F4F5',
        }}
      >
        {value}
      </div>
    </div>
  );
}

type OgFrameProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: OgStat[];
  note?: string;
};

export function OgFrame({ eyebrow, title, subtitle, stats, note }: OgFrameProps): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#090A0B',
        backgroundImage: 'linear-gradient(135deg, #090A0B 0%, #101114 58%, #18191C 100%)',
      }}
    >
      <div style={{ display: 'flex', width: '100%', height: 12, backgroundColor: '#FACC15' }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'space-between',
          padding: '44px 64px 40px',
        }}
      >
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', width: 16, height: 16, backgroundColor: '#FACC15', marginRight: 14 }} />
            <div style={{ display: 'flex', fontSize: 32, color: '#F4F4F5', letterSpacing: -0.5 }}>MineBench</div>
          </div>
          <div style={{ display: 'flex', fontSize: 24, color: '#A1A1AA' }}>minebench.cloud</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div style={{ display: 'flex', fontSize: 23, color: '#FACC15', letterSpacing: 2.2 }}>
            {eyebrow.toUpperCase()}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              lineHeight: 1.06,
              letterSpacing: -1.5,
              color: '#F4F4F5',
              marginTop: 14,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', fontSize: 26, lineHeight: 1.35, color: '#A1A1AA', marginTop: 16, maxWidth: 1010 }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {stats.length > 0 ? (
            <div style={{ display: 'flex', width: '100%', gap: 16 }}>
              {stats.map((stat) => (
                <OgStatCard key={stat.label} {...stat} />
              ))}
            </div>
          ) : null}
          {note ? <div style={{ display: 'flex', marginTop: 20, fontSize: 21, color: '#71717A' }}>{note}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function OgFallbackImage(): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#090A0B',
        color: '#F4F4F5',
      }}
    >
      <div style={{ display: 'flex', fontSize: 66, letterSpacing: -1.5 }}>MineBench</div>
      <div style={{ display: 'flex', fontSize: 28, marginTop: 18, color: '#FACC15' }}>minebench.cloud</div>
    </div>
  );
}

