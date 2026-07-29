'use client';

import { useState, useEffect } from 'react';
import { formatHashrate } from '@/lib/utils';
import { TrendingUp, Users, Activity, Server } from 'lucide-react';

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

  const hasLiveData = metrics.hashrate > 0 || metrics.miners > 0 || metrics.xmrPrice > 0;

  return (
    <div className="relative z-40 w-full overflow-hidden border-b border-yellow-500 bg-yellow-400 py-1.5 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
        <div className="mx-auto flex min-h-4 max-w-6xl items-center justify-between gap-3 px-3 font-mono text-[9px] font-black uppercase text-black/90 sm:gap-5 sm:px-6 sm:text-[10px] lg:px-8">
            <div className="flex shrink-0 items-center gap-1.5"><Server className="h-3 w-3 shrink-0 text-black"/><span><span className="hidden sm:inline">Pool: </span>xmr.minebench.cloud:3333</span></div>
            {hasLiveData && (<>
            <div className="hidden shrink-0 items-center gap-1.5 min-[420px]:flex"><TrendingUp className="h-3 w-3 shrink-0 text-black"/><span>Hashrate: {formatHashrate(metrics.hashrate)}</span></div>
            <div className="flex shrink-0 items-center gap-1.5"><Users className="h-3 w-3 shrink-0 text-black"/><span>Miners: {metrics.miners}</span></div>
            <div className="hidden shrink-0 items-center gap-1.5 md:flex"><Activity className="h-3 w-3 shrink-0 text-black"/><span>XMR: ${metrics.xmrPrice.toFixed(2)}</span></div>
            <a href="https://pump.fun/coin/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev" target="_blank" rel="noopener noreferrer" className="hidden shrink-0 items-center gap-1.5 transition-colors hover:text-white lg:flex"><span>BMT: ${metrics.bmtPrice.toFixed(8)}</span></a>
            </>)}
        </div>
    </div>
  );
}
