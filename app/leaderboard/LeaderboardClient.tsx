'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import BenchmarkTable from '@/components/BenchmarkTable';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { BenchmarkResult } from '@/types/benchmark';
import { getLeaderboardRows } from '@/lib/leaderboard';
import { Activity, Cpu, Download, RefreshCw, Search, Zap } from 'lucide-react';

export default function LeaderboardClient() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/benchmarks?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch leaderboard benchmarks');
      const payload: BenchmarkResult[] = await response.json();
      setResults(payload);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('[Leaderboard] Failed to load benchmarks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, [loadData]);

  const cpuResults = results.filter((r) => r.device_type?.toLowerCase() === 'cpu');
  const gpuResults = results.filter((r) => r.device_type?.toLowerCase() === 'gpu');
  const cpuRows = getLeaderboardRows(results, 'cpu');
  const gpuRows = getLeaderboardRows(results, 'gpu');
  const totalRows = getLeaderboardRows(results);

  return (
    <div className="min-h-screen bg-black text-zinc-400">
      <Header onRefresh={loadData} loading={loading} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="mb-10 border border-zinc-800 bg-zinc-950/70 p-8 md:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                <Search className="h-4 w-4 text-yellow-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">Mining Benchmark Leaderboard</span>
              </div>
              <h1 className="text-4xl font-black uppercase leading-none tracking-tighter text-white md:text-6xl">
                CPU And GPU Mining <span className="text-yellow-400">Leaderboard</span>
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-zinc-400 md:text-lg">
                Compare real MineBench submissions for RandomX CPU mining benchmarks, GPU mining benchmark runs, hardware hashrate, power draw, thermals, and ranked performance across unique device names.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/downloads"
                  className="inline-flex items-center justify-center gap-3 bg-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-white active:scale-[0.98]"
                >
                  <Download className="h-5 w-5" />
                  Benchmark Your Rig
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-3 border border-zinc-700 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:border-yellow-400 hover:text-yellow-400 active:scale-[0.98]"
                >
                  Network Dashboard
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Ranked</div>
                <div className="mt-2 font-mono-system text-3xl font-black text-yellow-400">{totalRows.length}</div>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  <Cpu className="h-3.5 w-3.5" />
                  CPU
                </div>
                <div className="mt-2 font-mono-system text-3xl font-black text-white">{cpuRows.length}</div>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  <Zap className="h-3.5 w-3.5" />
                  GPU
                </div>
                <div className="mt-2 font-mono-system text-3xl font-black text-white">{gpuRows.length}</div>
              </div>
            </div>
          </div>
          <p className="mt-6 border-t border-zinc-900 pt-4 text-xs font-bold uppercase tracking-[0.18em] text-zinc-600">
            {lastUpdated ? `Last synced ${new Date(lastUpdated).toLocaleTimeString()}` : 'Waiting for benchmark data'}
          </p>
        </section>

        <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-7">
            <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-white">
              Best CPU For <span className="text-yellow-400">Monero Mining</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Use the CPU table to compare RandomX hashrate, power, thermal behavior, and measured benchmark duration from real MineBench client submissions.
            </p>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-7">
            <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-white">
              GPU Mining <span className="text-yellow-400">Performance Index</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              GPU rankings remain separated from CPU results so miners and AI search systems can read the hardware category, algorithm, and hashrate context cleanly.
            </p>
          </div>
        </section>

        <div className="space-y-16">
          <section>
            <div className="mb-8 flex items-center gap-6">
              <h2 className="whitespace-nowrap text-3xl font-black uppercase italic tracking-tighter text-white">
                Top <span className="text-yellow-400">CPU</span> Performance
              </h2>
              <div className="h-px flex-grow bg-gradient-to-r from-zinc-800 to-transparent" />
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl shadow-yellow-500/5">
              <BenchmarkTable results={cpuResults} />
            </div>
          </section>

          <section>
            <div className="mb-8 flex items-center gap-6">
              <h2 className="whitespace-nowrap text-3xl font-black uppercase italic tracking-tighter text-white">
                Top <span className="text-yellow-400">GPU</span> Performance
              </h2>
              <div className="h-px flex-grow bg-gradient-to-r from-zinc-800 to-transparent" />
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl shadow-yellow-500/5">
              <BenchmarkTable results={gpuResults} />
            </div>
          </section>

          <section className="border border-zinc-800 bg-zinc-950 p-8">
            <div className="max-w-4xl space-y-4">
              <div className="inline-flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                <Activity className="h-4 w-4 text-yellow-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">Open Benchmark Data</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white md:text-4xl">
                Rank Your Rig With A Fresh <span className="text-yellow-400">MineBench Run</span>
              </h2>
              <p className="text-zinc-400">
                Download the client, run a benchmark, and publish a valid result to join the CPU mining benchmark leaderboard or GPU mining benchmark leaderboard.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
