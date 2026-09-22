'use client';

import FadeContent from '@/components/reactbits/FadeContent';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import BenchmarkTable from '@/components/BenchmarkTable';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { BenchmarkResult } from '@/types/benchmark';
import { getLeaderboardRows } from '@/lib/leaderboard';
import { Activity, Cpu, Gpu, Trophy, Download, RefreshCw, Search } from 'lucide-react';

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
    <div className="board-page refresh-leaderboard min-h-screen bg-black text-zinc-400">
      <Header onRefresh={loadData} loading={loading} />
      <main id="refresh-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <FadeContent as="section" className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 md:p-10">
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
                  className="btn-secondary"
                >
                  Network Dashboard
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-xs font-semibold tracking-normal text-zinc-500">Ranked</div>
                <div className="mt-2 tabular-nums text-3xl font-semibold text-yellow-400">{totalRows.length}</div>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-normal text-zinc-500">
                  <Cpu className="h-3.5 w-3.5" />
                  CPU
                </div>
                <div className="mt-2 tabular-nums text-3xl font-semibold text-white">{cpuRows.length}</div>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-normal text-zinc-500">
                  <Gpu className="h-3.5 w-3.5" />
                  GPU
                </div>
                <div className="mt-2 tabular-nums text-3xl font-semibold text-white">{gpuRows.length}</div>
              </div>
            </div>
          </div>
          <p className="mt-6 border-t border-zinc-900 pt-4 text-xs font-bold tracking-normal text-zinc-400">
            {lastUpdated ? `Last synced ${new Date(lastUpdated).toLocaleTimeString()}` : 'Waiting for benchmark data'}
          </p>
        </FadeContent>

        <FadeContent as="section" className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-7">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-white">
                <span className="benchmark-section-icon"><Cpu size={22}/></span>
              Best CPU For <span className="text-yellow-400">Monero Mining</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Use the CPU table to compare RandomX hashrate, power, thermal behavior, and measured benchmark duration from real MineBench client submissions.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-7">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-white">
                <span className="benchmark-section-icon"><Gpu size={22}/></span>
              GPU Mining <span className="text-yellow-400">Performance Index</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              CPU and GPU results are listed separately. Check each run’s algorithm and units before comparing devices.
            </p>
          </div>
        </FadeContent>

        <div className="space-y-16">
          <FadeContent as="section">
            <div className="mb-8 flex items-center gap-6">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter text-white">
                <span className="benchmark-section-icon"><Cpu size={22}/></span>
                Top <span className="text-yellow-400">CPU</span> Performance
              </h2>
              <div className="h-px flex-grow bg-gradient-to-r from-zinc-800 to-transparent" />
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl shadow-yellow-500/5">
              <BenchmarkTable results={cpuResults} showRank />
            </div>
          </FadeContent>

          <FadeContent as="section">
            <div className="mb-8 flex items-center gap-6">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter text-white">
                <span className="benchmark-section-icon"><Gpu size={22}/></span>
                Top <span className="text-yellow-400">GPU</span> Performance
              </h2>
              <div className="h-px flex-grow bg-gradient-to-r from-zinc-800 to-transparent" />
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl shadow-yellow-500/5">
              <BenchmarkTable results={gpuResults} showRank />
            </div>
          </FadeContent>

          <FadeContent as="section" duration={0.4} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
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
          </FadeContent>
        </div>
      </main>
      <Footer />
    </div>
  );
}
