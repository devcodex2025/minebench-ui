import { BenchmarkResult } from '@/types/benchmark';

export const getBenchmarkHashrate = (result: BenchmarkResult) => {
  const rate = Number(result.avg_hashrate ?? result.hashrate ?? 0);
  return Number.isFinite(rate) ? rate : 0;
};

export const getBenchmarkTimestamp = (result: BenchmarkResult) => {
  const timestamp = result.created_at ?? result.timestamp;
  return timestamp ? new Date(String(timestamp)).getTime() : 0;
};

export const normalizeDeviceName = (result: BenchmarkResult) => {
  const name = result.device_name ?? result.gpuModel ?? 'Unknown device';
  return String(name).trim().replace(/\s+/g, ' ');
};

export const getLeaderboardDeviceKey = (result: BenchmarkResult) => {
  return normalizeDeviceName(result).toLowerCase();
};

export const getLeaderboardRows = (
  results: BenchmarkResult[],
  deviceType?: 'cpu' | 'gpu'
) => {
  const deduped = results.reduce((acc, current) => {
    const type = String(current.device_type || '').toLowerCase();
    if (deviceType && type !== deviceType) return acc;

    const currentHashrate = getBenchmarkHashrate(current);
    if (currentHashrate <= 0) return acc;

    const key = getLeaderboardDeviceKey(current);
    const existing = acc[key];
    const existingHashrate = existing ? getBenchmarkHashrate(existing) : 0;
    const currentTimestamp = getBenchmarkTimestamp(current);
    const existingTimestamp = existing ? getBenchmarkTimestamp(existing) : 0;

    if (
      !existing ||
      currentHashrate > existingHashrate ||
      (currentHashrate === existingHashrate && currentTimestamp > existingTimestamp)
    ) {
      acc[key] = current;
    }

    return acc;
  }, {} as Record<string, BenchmarkResult>);

  return Object.values(deduped).sort((a, b) => getBenchmarkHashrate(b) - getBenchmarkHashrate(a));
};

export const getLeaderboardDeviceCount = (results: BenchmarkResult[]) => {
  return getLeaderboardRows(results).length;
};
