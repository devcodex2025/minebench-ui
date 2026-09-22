export type PoolStatsNode = {
  id: string;
  region: string;
  poolHashrate: number;
  miners: number;
  updatedAt?: string;
  stratum?: Record<string, unknown>;
};

function finiteNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizePoolStats(payload: Record<string, unknown>) {
  // Keep the direct payload fields as the primary contract: payload.poolHashrate, payload.pools.
  const source = payload.data && typeof payload.data === 'object'
    ? { ...(payload as Record<string, unknown>), ...(payload.data as Record<string, unknown>) }
    : payload;
  const stratum = source.stratum && typeof source.stratum === 'object'
    ? source.stratum as Record<string, unknown>
    : undefined;
  const poolHashrate = finiteNumber(source.poolHashrate ?? stratum?.hashrate_15m ?? stratum?.hashrate_1h);
  const miners = finiteNumber(source.miners ?? stratum?.connections ?? stratum?.incoming_connections);
  const pools = Array.isArray(source.pools)
    ? source.pools.filter((pool): pool is Record<string, unknown> => Boolean(pool && typeof pool === 'object'))
    : [];

  const normalizedPools: PoolStatsNode[] = pools.map((pool, index) => {
    const poolStratum = pool.stratum && typeof pool.stratum === 'object'
      ? pool.stratum as Record<string, unknown>
      : undefined;
    return {
      id: String(pool.id || `pool-${index}`),
      region: String(pool.region || ''),
      poolHashrate: finiteNumber(pool.poolHashrate ?? poolStratum?.hashrate_15m ?? poolStratum?.hashrate_1h),
      miners: finiteNumber(pool.miners ?? poolStratum?.connections),
      updatedAt: typeof pool.updatedAt === 'string' ? pool.updatedAt : undefined,
      stratum: poolStratum
    };
  });

  if (normalizedPools.length === 0 && (poolHashrate > 0 || miners > 0 || stratum)) {
    normalizedPools.push({
      id: 'default',
      region: '',
      poolHashrate,
      miners,
      stratum
    });
  }

  return {
    poolHashrate,
    miners,
    pools: normalizedPools,
    p2poolSharesFound: finiteNumber(source.p2poolSharesFound ?? source.verifiedShares),
    minerLeaderboard: Array.isArray(source.minerLeaderboard)
      ? source.minerLeaderboard
      : Array.isArray(source.liveMiners) ? source.liveMiners : []
  };
}
