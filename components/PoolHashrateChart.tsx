'use client';

import { useEffect, useState } from 'react';
import { formatHashrate } from '@/lib/utils';

type Point = { t: string; hashrate: number; bmtHashrate: number; xmrHashrate: number };

export default function PoolHashrateChart() {
  const [points, setPoints] = useState<Point[]>([]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try { const response = await fetch('/api/pool-stats-history?range=24h', { cache: 'no-store' }); const data = await response.json(); if (active) setPoints(Array.isArray(data.points) ? data.points : []); } catch { if (active) setPoints([]); }
    };
    void load(); const timer = window.setInterval(load, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const latest = points[points.length - 1];
  const max = Math.max(1, ...points.map((point) => point.hashrate));
  const path = (key: keyof Pick<Point, 'hashrate' | 'bmtHashrate' | 'xmrHashrate'>) => points.map((point, index) => `${index ? 'L' : 'M'} ${(index / Math.max(1, points.length - 1)) * 100} ${100 - (Number(point[key]) / max) * 90}`).join(' ');
  return <section className="border border-zinc-800 bg-black p-6">
    <div className="mb-4 flex items-end justify-between"><div><h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Pool Hashrate</h2><p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Total, BMT and direct XMR history</p></div><span className="font-mono text-xl font-black text-zinc-200">{formatHashrate(latest?.hashrate || 0)}</span></div>
    {points.length > 1 ? <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-64 w-full" role="img" aria-label="Total, BMT and XMR pool hashrate history"><path d={path('hashrate')} fill="none" stroke="rgb(212 212 216)" strokeWidth="1" vectorEffect="non-scaling-stroke" /><path d={path('bmtHashrate')} fill="none" stroke="rgb(250 204 21)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /><path d={path('xmrHashrate')} fill="none" stroke="rgb(251 146 60)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg> : <div className="flex h-64 items-center justify-center text-xs uppercase tracking-widest text-zinc-600">Collecting hashrate history</div>}
    <div className="mt-3 flex gap-5 text-[10px] font-black uppercase tracking-widest text-zinc-500"><span className="text-zinc-300">— Total</span><span className="text-yellow-400">— BMT</span><span className="text-orange-400">— XMR</span></div>
  </section>;
}
