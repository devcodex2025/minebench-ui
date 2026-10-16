export type LandingStats = {
  benchmarks: number | null;
  miners: number | null;
  downloads: number | null;
};

export const LANDING_STATS_TIMEOUT_MS = 5_000;

type BenchmarkCountResponse = {
  count: unknown;
  error: unknown;
};

type DownloadCountResponse = {
  data: { total_downloads?: unknown } | null;
  error: unknown;
};

const parseNonNegativeNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return null;

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

export const landingStatsFromResponses = ({
  benchmarks,
  downloads,
}: {
  benchmarks: BenchmarkCountResponse | null;
  downloads: DownloadCountResponse | null;
}): LandingStats => ({
  benchmarks: benchmarks?.error ? null : parseNonNegativeNumber(benchmarks?.count),
  // This must remain unavailable until a database aggregate applies the same
  // normalized-name and positive-hashrate rules as the public leaderboard.
  miners: null,
  downloads: downloads?.error ? null : parseNonNegativeNumber(downloads?.data?.total_downloads),
});
