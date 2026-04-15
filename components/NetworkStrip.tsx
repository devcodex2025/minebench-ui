'use client';

import { useState, useEffect } from 'react';
import { formatHashrate } from '@/lib/utils';
import { TrendingUp, Users, Activity } from 'lucide-react';

export default function NetworkStrip() {
  const [metrics, setMetrics] = useState({
    hashrate: 0,
    miners: 0,
    xmrPrice: 0,
    bmtPrice: 0,
    xmrBmtRatio: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [poolRes, ratesRes] = await Promise.all([
          fetch('/api/pool-stats').catch(() => null),
          fetch('/api/rates').catch(() => null)
        ]);
        const poolData = poolRes?.ok ? await poolRes.json() : {};
        const ratesData = ratesRes?.ok ? await ratesRes.json() : {};
        
        setMetrics({
          hashrate: Number(poolData.poolHashrate || 0),
          miners: Number(poolData.stratum?.connections || poolData.miners || 0),
          xmrPrice: Number(ratesData.xmr_usd || 0),
          bmtPrice: Number(ratesData.bmt_usd || 0),
          xmrBmtRatio: Number(ratesData.rate_xmr_bmt || 0)
        });
      } catch (err) { }
    };
    
    fetchMetrics();
    const id = setInterval(fetchMetrics, 30000);
    return () => clearInterval(id);
  }, []);

  if (metrics.hashrate === 0 && metrics.miners === 0 && metrics.xmrPrice === 0) return null;

  return (
    <div className="w-full bg-yellow-400 border-b border-yellow-500 py-1.5 z-40 relative flex justify-center overflow-hidden shadow-[0_0_15px_rgba(250,204,21,0.2)]">
        <div className="flex items-center gap-4 sm:gap-8 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black/90">
            <div className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-black"/><span>Pool Hashrate: {formatHashrate(metrics.hashrate)}</span></div>
            <span className="text-black/20">|</span>
            <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-black"/><span>Miners: {metrics.miners}</span></div>
            <span className="text-black/20 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1.5"><Activity className="w-3 h-3 text-black"/><span>XMR: ${metrics.xmrPrice.toFixed(2)}</span></div>
            <span className="text-black/20 hidden sm:inline">|</span>
            <a href="https://pump.fun/coin/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"><span>BMT: ${metrics.bmtPrice.toFixed(8)}</span></a>
        </div>
    </div>
  );
}
