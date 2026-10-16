'use client';

import { useState, useEffect } from 'react';
import { formatHashrate } from '@/lib/utils';
import { normalizePoolStats } from '@/lib/pool-stats';
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
    let controller: AbortController | null = null;
    let active = true;
    const fetchMetrics = async () => {
      if (document.hidden || controller) return;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 5000);
      try {
        const [poolRes, ratesRes] = await Promise.all([
          fetch('/api/pool-stats', { signal: controller.signal }).catch(() => null),
          fetch('/api/rates', { signal: controller.signal }).catch(() => null)
        ]);
        const poolData = poolRes?.ok ? await poolRes.json() : {};
        const ratesData = ratesRes?.ok ? await ratesRes.json() : {};
        const normalizedPool = normalizePoolStats(poolData);
        
        if (!active || (!poolRes?.ok && !ratesRes?.ok)) return;
        setMetrics({
          hashrate: normalizedPool.poolHashrate,
          miners: normalizedPool.miners,
          xmrPrice: Number(ratesData.xmr_usd || 0),
          bmtPrice: Number(ratesData.bmt_usd || 0),
          xmrBmtRatio: Number(ratesData.rate_xmr_bmt || 0)
        });
      } catch {
        // Keep the last public snapshot while auxiliary services are unavailable.
      } finally {
        clearTimeout(timeout);
        controller = null;
      }
    };
    
    fetchMetrics();
    const id = setInterval(fetchMetrics, 30000);
    const onVisibilityChange = () => { if (!document.hidden) void fetchMetrics(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      active = false;
      clearInterval(id);
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const hasLiveData = metrics.hashrate > 0 || metrics.miners > 0 || metrics.xmrPrice > 0;

  return (
    <div className="relative z-40 w-full overflow-x-auto border-t border-white/5 bg-white/[0.025] py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 whitespace-nowrap px-4 text-[10px] font-medium text-zinc-400 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2"><Server className="w-3 h-3 text-yellow-400"/><span>Pool <span className="text-zinc-300">xmr.minebench.cloud:3334</span></span></div>
            {hasLiveData && (<>
            <div className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-yellow-400"/><span>Hashrate <span className="text-zinc-200">{formatHashrate(metrics.hashrate)}</span></span></div>
            <div className="flex items-center gap-1.5"><Users className="w-3 h-3"/><span>Miners <span className="text-zinc-200">{metrics.miners}</span></span></div>
            <div className="hidden sm:flex items-center gap-1.5"><Activity className="w-3 h-3"/><span>XMR: ${metrics.xmrPrice.toFixed(2)}</span></div>
            <a href="https://pump.fun/coin/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"><span>BMT: ${metrics.bmtPrice.toFixed(8)}</span></a>
            </>)}
        </div>
    </div>
  );
}
