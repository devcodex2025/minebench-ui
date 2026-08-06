'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { formatHashrate } from '@/lib/utils';

type Point = { t: string; hashrate: number; miners: number };

const RANGES: { key: string; label: string }[] = [
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
    const el = ref.current;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

function smoothLine(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function formatTick(iso: string, range: string): string {
  const d = new Date(iso);
  if (range === '7d' || range === '30d') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function PoolHashrateChart() {
  const [range, setRange] = useState('24h');
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const { ref, width } = useMeasuredWidth();

  const load = useCallback(async (r: string) => {
    try {
      const res = await fetch(`/api/pool-stats-history?range=${r}&t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      setPoints(Array.isArray(data.points) ? data.points : []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setHover(null);
    load(range);
    const id = setInterval(() => load(range), 30000);
    return () => clearInterval(id);
  }, [range, load]);

  const view = useMemo(() => {
    const n = points.length;
    const innerW = Math.max(0, width - PAD.left - PAD.right);
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const maxRate = Math.max(...points.map((p) => p.hashrate), 1);
    const yMax = maxRate * 1.15;
    const x = (i: number) => (n <= 1 ? PAD.left + innerW / 2 : PAD.left + (i / (n - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;
    const coords = points.map((p, i) => ({ x: x(i), y: y(p.hashrate) }));
    const baseY = PAD.top + innerH;
    const line = smoothLine(coords);
    const area = coords.length >= 2
      ? `${line} L ${coords[coords.length - 1].x.toFixed(2)} ${baseY} L ${coords[0].x.toFixed(2)} ${baseY} Z`
      : '';
    const gridY = Array.from({ length: 4 }, (_, i) => {
      const v = (yMax / 4) * (i + 1);
      return { v, y: y(v) };
    });
    return { coords, line, area, gridY, baseY, innerW, innerH, yMax };
  }, [points, width]);

  const latest = points.length ? points[points.length - 1].hashrate : 0;
  const first = points.length ? points[0].hashrate : 0;
  const deltaPct = first > 0 ? ((latest - first) / first) * 100 : 0;
  const up = deltaPct >= 0;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length < 2 || width === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const ratio = (mx - PAD.left) / view.innerW;
    const i = Math.round(ratio * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/60">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 bg-zinc-950/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-yellow-400" />
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Pool Hashrate</h2>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-black tracking-tighter text-yellow-400">{formatHashrate(latest)}</span>
              {points.length > 1 && (
                <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {up ? '+' : ''}{deltaPct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-black p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded px-3 py-1.5 text-[11px] font-black uppercase tracking-widest transition-colors ${
                range === r.key ? 'bg-yellow-400 text-black' : 'text-zinc-500 hover:text-yellow-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={ref} className="relative px-2 pb-2 pt-4">
        {loading && points.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-yellow-400" />
          </div>
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center text-xs font-bold uppercase tracking-widest text-zinc-600">
            Hashrate history unavailable
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
            onMouseLeave={() => setHover(null)}
            className="block"
          >
            <defs>
              <linearGradient id="hashrateFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(250 204 21)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="rgb(250 204 21)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {view.gridY.map((g, i) => (
              <g key={i}>
                <line x1={PAD.left} y1={g.y} x2={width - PAD.right} y2={g.y} stroke="rgb(39 39 42)" strokeWidth="1" strokeDasharray="3 4" />
                <text x={PAD.left - 10} y={g.y + 3} textAnchor="end" className="fill-zinc-600 font-mono" fontSize="10">
                  {formatHashrate(g.v)}
                </text>
              </g>
            ))}

            {view.area && <path d={view.area} fill="url(#hashrateFill)" />}
            {view.line && (
              <motion.path
                d={view.line}
                fill="none"
                stroke="rgb(250 204 21)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0.4 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.35))' }}
              />
            )}

            {points.map((p, i) => {
              if (points.length > 12 && i % Math.ceil(points.length / 6) !== 0 && i !== points.length - 1) return null;
              return (
                <text key={i} x={view.coords[i].x} y={HEIGHT - 8} textAnchor="middle" className="fill-zinc-600 font-mono" fontSize="10">
                  {formatTick(p.t, range)}
                </text>
              );
            })}

            {hover !== null && view.coords[hover] && (
              <g>
                <line x1={view.coords[hover].x} y1={PAD.top} x2={view.coords[hover].x} y2={view.baseY} stroke="rgb(250 204 21)" strokeOpacity="0.4" strokeWidth="1" />
                <circle cx={view.coords[hover].x} cy={view.coords[hover].y} r="4" fill="rgb(250 204 21)" stroke="black" strokeWidth="2" />
              </g>
            )}
          </svg>
        ) : (
          <div className="h-[300px]" />
        )}

        {hover !== null && points[hover] && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-zinc-700 bg-black/90 px-3 py-2 shadow-xl"
            style={{
              left: Math.min(Math.max(view.coords[hover].x, 70), width - 70),
              top: Math.max(view.coords[hover].y - 64, 8)
            }}
          >
            <div className="font-mono text-sm font-black text-yellow-400">{formatHashrate(points[hover].hashrate)}</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {points[hover].miners} miners
            </div>
            <div className="text-[10px] text-zinc-600">{new Date(points[hover].t).toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
