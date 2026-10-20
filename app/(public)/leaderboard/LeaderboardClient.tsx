'use client';


import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import BenchmarkTable from '@/components/BenchmarkTable';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { BenchmarkResult } from '@/types/benchmark';
import type { PublicBenchmarkSnapshot } from '@/lib/publicBenchmarks';
import { getLeaderboardRows } from '@/lib/leaderboard';
import { Activity, Cpu, Gpu, Trophy, Download, RefreshCw, Search } from 'lucide-react';

export default function LeaderboardClient({ initialSnapshot = { results: [], available: false }, initialUpdatedAt = null }: { initialSnapshot?: PublicBenchmarkSnapshot; initialUpdatedAt?: string | null }) {
  const { results: initialResults, available: initialAvailable } = initialSnapshot;
  const [results, setResults] = useState<BenchmarkResult[]>(initialResults);
  const [loading, setLoading] = useState(!initialAvailable);
  const [lastUpdated, setLastUpdated] = useState<string | null>(initialUpdatedAt);
  const [available, setAvailable] = useState(initialAvailable);
  const [refreshError, setRefreshError] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (document.visibilityState === 'hidden' || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch('/api/benchmarks?limit=500', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Failed to fetch leaderboard benchmarks');
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error('Invalid benchmark response');
      if (mountedRef.current) {
        setResults(payload as BenchmarkResult[]);
        setAvailable(true);
        setRefreshError(false);
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      if (mountedRef.current) setRefreshError(true);
      if (!(err instanceof DOMException && err.name === 'AbortError')) console.error('[Leaderboard] Failed to load benchmarks:', err);
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === controller) requestRef.current = null;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!initialAvailable) loadData();
    const intervalId = setInterval(() => loadData(), 30000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [initialAvailable, loadData]);

  const cpuResults = results.filter((r) => r.device_type?.toLowerCase() === 'cpu');
  const gpuResults = results.filter((r) => r.device_type?.toLowerCase() === 'gpu');
  const cpuRows = getLeaderboardRows(results, 'cpu');
  const gpuRows = getLeaderboardRows(results, 'gpu');
  const totalRows = getLeaderboardRows(results);

  return (
    <div className="board-page refresh-leaderboard min-h-screen bg-black text-zinc-400">
      <Header onRefresh={loadData} loading={loading} />
      <main id="refresh-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 md:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-semibold tracking-normal text-yellow-400">Mining Benchmark Leaderboard</span>
              </div>
              <h1 className="text-4xl font-semibold leading-none tracking-tighter text-white md:text-6xl">
                Hardware <span className="text-yellow-400">leaderboard</span>
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-zinc-400 md:text-lg">
                Compare real MineBench submissions for RandomX CPU mining benchmarks, GPU mining benchmark runs, hardware hashrate, power draw, thermals, and ranked performance across unique device names.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/downloads"
                  className="btn-primary"
                >
                  <Download className="h-5 w-5" />
                  Benchmark Your Rig
                </Link>
                <Link
                  href="/dashboard"
                  prefetch={false}
                  className="btn-secondary"
                >
                  Network Dashboard
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-xs font-semibold tracking-normal text-zinc-500">Ranked</div>
                <div className="mt-2 tabular-nums text-3xl font-semibold text-yellow-400">{available ? totalRows.length : '—'}</div>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-normal text-zinc-500">
                  <Cpu className="h-3.5 w-3.5" />
                  CPU
                </div>
                <div className="mt-2 tabular-nums text-3xl font-semibold text-white">{available ? cpuRows.length : '—'}</div>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-normal text-zinc-500">
                  <Gpu className="h-3.5 w-3.5" />
                  GPU
                </div>
                <div className="mt-2 tabular-nums text-3xl font-semibold text-white">{available ? gpuRows.length : '—'}</div>
              </div>
            </div>
          </div>
          <p className="mt-6 border-t border-zinc-900 pt-4 text-xs font-bold tracking-normal text-zinc-400">
            {lastUpdated ? `Last synced ${lastUpdated.slice(11, 19)} UTC` : available ? 'Public benchmark snapshot' : loading ? 'Loading public benchmark data' : 'Public benchmark data unavailable'}
            {' · Rankings cover up to 500 latest submissions; refreshes every 30s while visible.'}
          </p>
        </section>

        <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-7">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-white">
                <span className="benchmark-section-icon"><Cpu size={22}/></span>
              Best CPU For <span className="text-yellow-400">Monero Mining</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Use the CPU table to compare RandomX hashrate, power, thermal behavior, and measured benchmark duration from real MineBench client submissions.
            </p>
            <Link href="/guides/randomx-benchmarking" className="mt-4 inline-flex text-sm font-semibold text-yellow-400 hover:text-yellow-300">
              How to run a repeatable RandomX benchmark →
            </Link>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-7">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-white">
                <span className="benchmark-section-icon"><Gpu size={22}/></span>
              GPU Mining <span className="text-yellow-400">Performance Index</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              CPU and GPU results are listed separately. Check each run’s algorithm and units before comparing devices.
            </p>
            <Link href="/guides/measure-hashrate-per-watt" className="mt-4 inline-flex text-sm font-semibold text-yellow-400 hover:text-yellow-300">
              Measure hashrate per watt →
            </Link>
          </div>
        </section>

        {refreshError && <p role="status" className="mb-6 text-sm">The latest refresh is unavailable. {available ? 'Showing the previous snapshot.' : 'Try refreshing again.'}</p>}
        <div className="space-y-16">
          <section>
            <div className="mb-8 flex items-center gap-6">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter text-white">
                <span className="benchmark-section-icon"><Cpu size={22}/></span>
                Top <span className="text-yellow-400">CPU</span> Performance
              </h2>
              <div className="h-px flex-grow bg-gradient-to-r from-zinc-800 to-transparent" />
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl shadow-yellow-500/5">
              {available ? <BenchmarkTable results={cpuResults} showRank /> : <p role="status" className="p-6">{loading ? 'Loading benchmark data…' : 'Benchmark data is currently unavailable.'}</p>}
            </div>
          </section>

          <section>
            <div className="mb-8 flex items-center gap-6">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter text-white">
                <span className="benchmark-section-icon"><Gpu size={22}/></span>
                Top <span className="text-yellow-400">GPU</span> Performance
              </h2>
              <div className="h-px flex-grow bg-gradient-to-r from-zinc-800 to-transparent" />
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl shadow-yellow-500/5">
              {available ? <BenchmarkTable results={gpuResults} showRank /> : <p role="status" className="p-6">{loading ? 'Loading benchmark data…' : 'Benchmark data is currently unavailable.'}</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="max-w-4xl space-y-4">
              <div className="inline-flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                <Activity className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-semibold tracking-normal text-yellow-400">Open Benchmark Data</span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">
                Rank Your Rig With A Fresh <span className="text-yellow-400">MineBench Run</span>
              </h2>
              <p className="text-zinc-400">
                Results show the highest submitted positive average hashrate per device name. Test settings vary between systems, so use the rankings as a comparison reference rather than a controlled lab result.
              </p>
              <Link href="/downloads" className="btn-primary inline-flex">Run your own benchmark</Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
