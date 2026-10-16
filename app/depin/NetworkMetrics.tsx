'use client';

import { useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { ArrowRight } from 'lucide-react';

export default function NetworkMetrics() {
  preload('/fonts/MineBenchMonoLatin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  const [metrics, setMetrics] = useState<{ label: string; value: string }[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const load = async () => {
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch('/api/pool-stats', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Pool statistics unavailable');
        const data: unknown = await response.json();
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid response');
        const record = data as Record<string, unknown>;
        const values: { label: string; value: string }[] = [];
        if (typeof record.poolHashrate === 'number' && Number.isFinite(record.poolHashrate) && record.poolHashrate >= 0) {
          values.push({ label: 'Pool hashrate', value: `${record.poolHashrate.toLocaleString('en-US', { maximumFractionDigits: 2 })} H/s` });
        }
        if (typeof record.miners === 'number' && Number.isSafeInteger(record.miners) && record.miners >= 0) {
          values.push({ label: 'Pool connections', value: record.miners.toLocaleString('en-US') });
        }
        if (active) { setMetrics(values); setState(values.length ? 'ready' : 'empty'); }
      } catch { if (active) { setMetrics([]); setState('error'); } }
      finally { clearTimeout(timeout); }
    };
    void load();
    return () => { active = false; controller.abort(); };
  }, [attempt]);

  return <div className="depin-metrics" aria-live="polite" aria-busy={state === 'loading'}>
    {state === 'ready' ? <dl>{metrics.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl> : <p>{state === 'loading' ? 'Loading the latest pool snapshot…' : state === 'empty' ? 'No public pool measurements are available in this snapshot.' : 'Pool statistics are temporarily unavailable.'}</p>}
    <div className="depin-metric-footer"><span>Public pool snapshot · Connections are not unique devices or providers.</span><button type="button" disabled={state === 'loading'} onClick={() => { setState('loading'); setMetrics([]); setAttempt(value => value + 1); }}>{state === 'error' || state === 'empty' ? 'Retry' : 'Refresh'} <ArrowRight size={14} aria-hidden="true" /></button></div>
  </div>;
}
