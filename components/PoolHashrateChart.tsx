'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Blocks, ExternalLink, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { formatHashrate } from '@/lib/utils';

type Point = { t: string; hashrate: number; miners: number };
type PoolBlock = {
  id: string;
  foundAt: string;
  blockHeight: number;
  blockHash: string | null;
  finderScope: 'local' | 'p2pool_peer' | 'unknown';
  moneroPayoutStatus: 'pending' | 'received' | 'none';
  walletPayoutXmr: number | null;
  payoutDetectedAt: string | null;
  grossBmt: number;
  userBmt: number;
  treasuryBmt: number;
  distributions: number;
  bmtSettlementStatus: 'not_created' | 'processing' | 'credited' | 'partially_paid' | 'paid';
};
type Range = '1h' | '24h' | '7d' | '30d';

const RANGES: { key: Range; label: string }[] = [
  { key: '1h', label: '1H' },
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' }
];
const HEIGHT = 300;
const PAD = { top: 20, right: 20, bottom: 30, left: 64 };

function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    const update = () => setWidth(element.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

function smoothLine(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index++) {
    const p0 = points[index - 1] || points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] || points[index + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

function formatTick(iso: string, range: Range): string {
  const date = new Date(iso);
  return range === '7d' || range === '30d'
    ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function PoolHashrateChart() {
  const [range, setRange] = useState<Range>('24h');
  const [points, setPoints] = useState<Point[]>([]);
  const [blocks, setBlocks] = useState<PoolBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [hoverRewardId, setHoverRewardId] = useState<string | null>(null);
  const [pinnedRewardId, setPinnedRewardId] = useState<string | null>(null);
  const refreshRef = useRef<() => void>(() => undefined);
  const gradientId = `hashrate-fill-${useId().replace(/:/g, '')}`;
  const { ref, width } = useMeasuredWidth();

  const load = useCallback(async (selectedRange: Range, signal: AbortSignal) => {
    try {
      const [historyResult, blocksResult] = await Promise.allSettled([
        fetch(`/api/pool-stats-history?range=${selectedRange}`, { signal }),
        fetch(`/api/pool-blocks?range=${selectedRange}&limit=400`, { signal })
      ]);
      if (historyResult.status !== 'fulfilled' || !historyResult.value.ok) throw new Error('bad status');
      const data = await historyResult.value.json();
      if (signal.aborted) return;
      setPoints(Array.isArray(data.points) ? data.points : []);
      setLastUpdated(data.generatedAt || new Date().toISOString());
      if (blocksResult.status === 'fulfilled' && blocksResult.value.ok) {
        const blocksData = await blocksResult.value.json();
        if (!signal.aborted) setBlocks(Array.isArray(blocksData.blocks) ? blocksData.blocks : []);
      } else {
        setBlocks([]);
      }
      setError(false);
    } catch (loadError) {
      if (signal.aborted || (loadError instanceof Error && loadError.name === 'AbortError')) return;
      setError(true);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setHover(null);
    setHoverRewardId(null);
    setPinnedRewardId(null);
    setPoints([]);
    setBlocks([]);
    let controller: AbortController | null = null;
    let timer: number | null = null;

    const refresh = () => {
      controller?.abort();
      controller = new AbortController();
      void load(range, controller.signal);
    };
    const stop = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      controller?.abort();
    };
    const start = () => {
      if (document.hidden || timer !== null) return;
      refresh();
      timer = window.setInterval(refresh, 30_000);
    };
    const onVisibilityChange = () => {
      stop();
      if (!document.hidden) start();
    };

    refreshRef.current = refresh;
    document.addEventListener('visibilitychange', onVisibilityChange);
    start();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [range, load]);

  const view = useMemo(() => {
    const innerWidth = Math.max(0, width - PAD.left - PAD.right);
    const innerHeight = HEIGHT - PAD.top - PAD.bottom;
    const maxRate = Math.max(...points.map((point) => point.hashrate), 1);
    const yMax = maxRate * 1.15;
    const times = points.map((point) => new Date(point.t).getTime());
    const fromTime = times[0] || 0;
    const toTime = times[times.length - 1] || fromTime;
    const xAt = (timestamp: number) => toTime <= fromTime
      ? PAD.left + innerWidth / 2
      : PAD.left + ((timestamp - fromTime) / (toTime - fromTime)) * innerWidth;
    const y = (value: number) => PAD.top + innerHeight - (value / yMax) * innerHeight;
    const coordinates = points.map((point, index) => ({ x: xAt(times[index]), y: y(point.hashrate) }));
    const baseY = PAD.top + innerHeight;
    const line = smoothLine(coordinates);
    const area = coordinates.length >= 2
      ? `${line} L ${coordinates[coordinates.length - 1].x.toFixed(2)} ${baseY} L ${coordinates[0].x.toFixed(2)} ${baseY} Z`
      : '';
    const gridY = Array.from({ length: 4 }, (_, index) => {
      const value = (yMax / 4) * (index + 1);
      return { value, y: y(value) };
    });
    const blockMarkers = blocks.flatMap((block) => {
      const timestamp = new Date(block.foundAt).getTime();
      if (!Number.isFinite(timestamp) || timestamp < fromTime || timestamp > toTime) return [];
      const nearestIndex = times.reduce((best, pointTime, index) => (
        Math.abs(pointTime - timestamp) < Math.abs(times[best] - timestamp) ? index : best
      ), 0);
      return [{ block, x: xAt(timestamp), y: coordinates[nearestIndex]?.y ?? PAD.top }];
    });
    return { coordinates, line, area, gridY, baseY, innerWidth, fromTime, toTime, times, blockMarkers };
  }, [points, blocks, width]);

  const latest = points.length ? points[points.length - 1].hashrate : 0;
  const first = points.length ? points[0].hashrate : 0;
  const deltaPct = first > 0 ? ((latest - first) / first) * 100 : 0;
  const trendingUp = deltaPct >= 0;

  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (points.length < 2 || view.innerWidth <= 0) return;
    const mouseX = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const ratio = (mouseX - PAD.left) / view.innerWidth;
    const timestamp = view.fromTime + Math.max(0, Math.min(1, ratio)) * (view.toTime - view.fromTime);
    const index = view.times.reduce((best, pointTime, pointIndex) => (
      Math.abs(pointTime - timestamp) < Math.abs(view.times[best] - timestamp) ? pointIndex : best
    ), 0);
    setHover(index);
  };

  const activeRewardId = pinnedRewardId || hoverRewardId;
  const activeMarker = view.blockMarkers.find((marker) => marker.block.id === activeRewardId);

  const retry = () => {
    setLoading(true);
    setError(false);
    refreshRef.current();
  };

  return (
    <div className="glass-panel overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 bg-zinc-950/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-yellow-400" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Pool Hashrate</h2>
              {error && points.length > 0 && <span className="text-[9px] font-bold uppercase text-amber-400">Stale</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-2xl font-black tracking-tighter text-yellow-400">{formatHashrate(latest)}</span>
              {points.length > 1 && (
                <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${trendingUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trendingUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trendingUp ? '+' : ''}{deltaPct.toFixed(1)}%
                </span>
              )}
              {lastUpdated && <span className="text-[9px] uppercase text-zinc-600">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
            </div>
            <div className="mt-2 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rotate-45 border border-emerald-300 bg-emerald-400" />
                {blocks.length} pool {blocks.length === 1 ? 'block' : 'blocks'}
              </span>
              <Link href="/pool-rewards" className="inline-flex items-center gap-1 text-yellow-400 hover:text-white">
                History <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-black p-1" aria-label="Hashrate history range">
          {RANGES.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={range === option.key}
              onClick={() => setRange(option.key)}
              className={`rounded px-3 py-1.5 text-[11px] font-black uppercase tracking-widest transition-colors ${
                range === option.key ? 'bg-yellow-400 text-black' : 'text-zinc-500 hover:text-yellow-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={ref} className="relative pb-2 pt-4">
        {loading && points.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center" role="status" aria-label="Loading pool hashrate history">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
          </div>
        ) : error && points.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-4 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Hashrate history unavailable</span>
            <button type="button" onClick={retry} className="inline-flex items-center gap-2 border border-zinc-700 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:border-yellow-400 hover:text-yellow-400">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Collecting hashrate data</span>
            <span className="text-[10px] text-zinc-600">History appears as the pool reports over time</span>
          </div>
        ) : width > 0 ? (
          <svg
            width={width}
            height={HEIGHT}
            onMouseMove={onMove}
            onMouseLeave={() => {
              setHover(null);
              setHoverRewardId(null);
            }}
            className="block"
            role="img"
            aria-label={`Pool hashrate history for ${range}, latest ${formatHashrate(latest)}, ${view.blockMarkers.length} pool blocks`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(250 204 21)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="rgb(250 204 21)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {view.gridY.map((grid, index) => (
              <g key={index}>
                <line x1={PAD.left} y1={grid.y} x2={width - PAD.right} y2={grid.y} stroke="rgb(39 39 42)" strokeWidth="1" strokeDasharray="3 4" />
                <text x={PAD.left - 10} y={grid.y + 3} textAnchor="end" className="fill-zinc-600 font-mono" fontSize="10">{formatHashrate(grid.value)}</text>
              </g>
            ))}
            {view.area && <path d={view.area} fill={`url(#${gradientId})`} />}
            {view.line && (
              <motion.path d={view.line} fill="none" stroke="rgb(250 204 21)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.4 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
            )}
            {view.blockMarkers.map((marker) => {
              const isActive = marker.block.id === activeRewardId;
              const color = marker.block.moneroPayoutStatus === 'received'
                ? 'rgb(52 211 153)'
                : marker.block.moneroPayoutStatus === 'none'
                  ? 'rgb(113 113 122)'
                  : 'rgb(250 204 21)';
              const fill = marker.block.moneroPayoutStatus === 'pending' ? 'rgb(9 9 11)' : color;
              const payoutLabel = marker.block.moneroPayoutStatus === 'received'
                ? `${marker.block.walletPayoutXmr?.toFixed(6) || 'unknown'} XMR received`
                : marker.block.moneroPayoutStatus === 'none'
                  ? 'no wallet payout'
                  : 'wallet payout pending';
              return (
                <g
                  key={marker.block.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Pool block ${marker.block.blockHeight}, ${payoutLabel}, found ${new Date(marker.block.foundAt).toLocaleString()}`}
                  className="cursor-pointer outline-none"
                  onMouseMove={(event) => event.stopPropagation()}
                  onMouseEnter={() => setHoverRewardId(marker.block.id)}
                  onMouseLeave={() => setHoverRewardId(null)}
                  onFocus={() => setHoverRewardId(marker.block.id)}
                  onBlur={() => setHoverRewardId(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPinnedRewardId((current) => current === marker.block.id ? null : marker.block.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setPinnedRewardId((current) => current === marker.block.id ? null : marker.block.id);
                    }
                  }}
                >
                  <line
                    x1={marker.x}
                    y1={marker.y + 7}
                    x2={marker.x}
                    y2={view.baseY}
                    stroke={color}
                    strokeOpacity={isActive ? 0.65 : 0.25}
                    strokeWidth="1"
                    strokeDasharray="2 4"
                  />
                  <circle cx={marker.x} cy={marker.y} r="12" fill="transparent" />
                  <path
                    d={`M ${marker.x} ${marker.y - (isActive ? 8 : 6)} L ${marker.x + (isActive ? 8 : 6)} ${marker.y} L ${marker.x} ${marker.y + (isActive ? 8 : 6)} L ${marker.x - (isActive ? 8 : 6)} ${marker.y} Z`}
                    fill={fill}
                    stroke={color}
                    strokeWidth={isActive ? 3 : 2}
                  />
                </g>
              );
            })}
            {points.map((point, index) => {
              if (points.length > 12 && index % Math.ceil(points.length / 6) !== 0 && index !== points.length - 1) return null;
              return <text key={point.t} x={view.coordinates[index].x} y={HEIGHT - 8} textAnchor="middle" className="fill-zinc-600 font-mono" fontSize="10">{formatTick(point.t, range)}</text>;
            })}
            {hover !== null && view.coordinates[hover] && (
              <g>
                <line x1={view.coordinates[hover].x} y1={PAD.top} x2={view.coordinates[hover].x} y2={view.baseY} stroke="rgb(250 204 21)" strokeOpacity="0.4" strokeWidth="1" />
                <circle cx={view.coordinates[hover].x} cy={view.coordinates[hover].y} r="4" fill="rgb(250 204 21)" stroke="black" strokeWidth="2" />
              </g>
            )}
          </svg>
        ) : <div className="h-[300px]" />}

        {activeMarker && width > 0 && (
          <div
            className="pointer-events-none absolute z-20 w-64 -translate-x-1/2 rounded-lg border border-zinc-700 bg-black/95 px-4 py-3 shadow-2xl"
            style={{
              left: Math.min(Math.max(activeMarker.x, 136), width - 136),
              top: Math.max(activeMarker.y - 176, 8)
            }}
          >
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white">
              <Blocks className="h-3.5 w-3.5 text-yellow-400" /> Pool block found
            </div>
            <div className="mt-2 font-mono text-sm font-black text-white">Block #{activeMarker.block.blockHeight.toLocaleString()}</div>
            <div className={`mt-2 font-mono text-sm font-black ${
              activeMarker.block.moneroPayoutStatus === 'received'
                ? 'text-emerald-400'
                : activeMarker.block.moneroPayoutStatus === 'none'
                  ? 'text-zinc-500'
                  : 'text-yellow-400'
            }`}>
              {activeMarker.block.moneroPayoutStatus === 'received'
                ? `${activeMarker.block.walletPayoutXmr?.toFixed(6) || '—'} XMR received`
                : activeMarker.block.moneroPayoutStatus === 'none'
                  ? 'No wallet PPLNS payout'
                  : 'Awaiting wallet payout'}
            </div>
            {activeMarker.block.userBmt > 0 ? (
              <div className="mt-1 font-mono text-xs text-yellow-400">
                {activeMarker.block.userBmt.toFixed(2)} BMT · {activeMarker.block.bmtSettlementStatus.replace(/_/g, ' ')}
              </div>
            ) : null}
            <div className="mt-2 text-[10px] text-zinc-500">Found {new Date(activeMarker.block.foundAt).toLocaleString()}</div>
            {activeMarker.block.payoutDetectedAt ? (
              <div className="mt-0.5 text-[10px] text-zinc-600">Payout event {new Date(activeMarker.block.payoutDetectedAt).toLocaleString()}</div>
            ) : null}
            <div className="mt-1 text-[9px] uppercase tracking-widest text-zinc-600">
              {activeMarker.block.finderScope === 'local'
                ? 'Found by this node'
                : activeMarker.block.finderScope === 'p2pool_peer'
                  ? 'Found by a P2Pool peer'
                  : 'Found by P2Pool'}
            </div>
            {activeMarker.block.blockHash ? (
              <div className="mt-1 truncate font-mono text-[9px] text-zinc-700">{activeMarker.block.blockHash}</div>
            ) : null}
            <div className="mt-2 text-[9px] uppercase tracking-widest text-zinc-600">
              {pinnedRewardId === activeMarker.block.id ? 'Click marker to close' : 'Click marker to pin'}
            </div>
          </div>
        )}

        {!activeMarker && hover !== null && points[hover] && width > 0 && (
          <div className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-zinc-700 bg-black/90 px-3 py-2 shadow-xl" style={{ left: Math.min(Math.max(view.coordinates[hover].x, 70), width - 70), top: Math.max(view.coordinates[hover].y - 64, 8) }}>
            <div className="font-mono text-sm font-black text-yellow-400">{formatHashrate(points[hover].hashrate)}</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{points[hover].miners} miners</div>
            <div className="text-[10px] text-zinc-600">{new Date(points[hover].t).toLocaleString()}</div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-900 bg-black/30 px-6 py-3 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rotate-45 border-2 border-yellow-400 bg-zinc-950" /> Block found · payout pending
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rotate-45 border border-emerald-300 bg-emerald-400" /> XMR received
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rotate-45 border border-zinc-400 bg-zinc-500" /> No wallet PPLNS payout
        </span>
      </div>
    </div>
  );
}
