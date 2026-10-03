export type PoolHashratePoint = {
  t: string;
  hashrate: number;
  miners: number;
  bmtHashrate?: number;
  xmrHashrate?: number;
};

function finitePositive(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function buildSmoothLine(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index++) {
    const p0 = points[index - 1] || points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] || points[index + 1];
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = Math.min(maxY, Math.max(minY, p1.y + (p2.y - p0.y) / 6));
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = Math.min(maxY, Math.max(minY, p2.y - (p3.y - p1.y) / 6));
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

export function getHashrateLayers(point: PoolHashratePoint) {
  const reportedTotal = finitePositive(point.hashrate);
  const bmt = finitePositive(point.bmtHashrate);
  const xmr = finitePositive(point.xmrHashrate);
  const splitTotal = bmt + xmr;

  if (splitTotal > 0) return { total: splitTotal, bmt, xmr };
  return { total: reportedTotal, bmt: reportedTotal, xmr: 0 };
}

export function mergeLiveMinerHashrate(
  points: PoolHashratePoint[],
  payload: unknown,
  now = new Date()
): PoolHashratePoint[] {
  if (!payload || typeof payload !== 'object') return points;
  const stats = payload as Record<string, unknown>;
  if (stats.telemetryStale === true) return points;
  const miners = Array.isArray(stats.minerLeaderboard) ? stats.minerLeaderboard : [];
  let bmtHashrate = 0;
  let xmrHashrate = 0;

  miners.forEach((value) => {
    if (!value || typeof value !== 'object') return;
    const miner = value as Record<string, unknown>;
    const hashrate = finitePositive(miner.hashrate);
    const asset = String(miner.miningAsset || '').toUpperCase();
    const minerType = String(miner.minerType || '').toLowerCase();

    if (asset === 'XMR' || minerType === 'xmr' || minerType === 'pool') {
      xmrHashrate += hashrate;
    } else if (asset === 'BMT' || minerType === 'minebench') {
      bmtHashrate += hashrate;
    }
  });

  const hashrate = bmtHashrate + xmrHashrate;
  if (!(hashrate > 0)) return points;

  const timestamp = new Date(String(stats.telemetryUpdatedAt || ''));
  if (!Number.isFinite(timestamp.getTime())) return points;
  const nowTime = now.getTime();
  const liveTime = timestamp.getTime();
  if (!Number.isFinite(nowTime) || liveTime > nowTime + 60_000 || nowTime - liveTime > 5 * 60_000) return points;

  const livePoint: PoolHashratePoint = {
    t: timestamp.toISOString(),
    hashrate,
    bmtHashrate,
    xmrHashrate,
    miners: Math.max(0, Math.round(finitePositive(stats.miners)))
  };
  if (points.length === 0) return [livePoint];

  const last = points[points.length - 1];
  const lastTime = new Date(last.t).getTime();
  if (!Number.isFinite(lastTime) || liveTime < lastTime) return points;

  const next = points.slice();
  if (Math.floor(lastTime / 60_000) === Math.floor(liveTime / 60_000)) {
    next[next.length - 1] = livePoint;
  } else {
    next.push(livePoint);
  }
  return next.slice(-400);
}
