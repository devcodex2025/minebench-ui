'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BenchmarkResult, BenchmarkSummary } from '@/types/benchmark';
import { calculateSummary, formatHashCount, formatHashrate } from '@/lib/utils';
import { getLeaderboardRows } from '@/lib/leaderboard';
import StatsCards, { RecentTests } from '@/components/StatsCards';
import PoolHashrateChart from '@/components/PoolHashrateChart';
import { Activity, Award, Cpu, Download, RefreshCw, TrendingUp, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type PoolStatsResponse = {
  poolHashrate?: number;
  miners?: number;
  pools?: PoolNodeStats[];
  verifiedShares?: number;
  stratum?: {
    connections?: number;
    current_effort?: number;
  };
};

type PoolNodeStats = {
  id?: string;
  region?: string;
  poolHashrate?: number;
  miners?: number;
  updatedAt?: string;
  stratum?: {
    connections?: number;
    incoming_connections?: number;
    current_effort?: number;
    average_effort?: number;
    hashrate_15m?: number;
    hashrate_1h?: number;
    hashrate_24h?: number;
    total_hashes?: number;
    total_stratum_shares?: number;
    shares_found?: number;
    shares_failed?: number;
    workers?: string[];
  };
};

type PoolCard = {
  key: 'default' | 'us' | 'eu';
  label: string;
};

type RatesResponse = {
  xmr_usd?: number;
  bmt_usd?: number;
  rate_xmr_bmt?: number;
};

const POOL_STATS_URL = '/api/pool-stats';
const RATES_URL = '/api/rates';
const POOL_CARDS: PoolCard[] = [
  { key: 'default', label: 'Default Proxy' },
  { key: 'us', label: 'US Proxy' },
  { key: 'eu', label: 'EU Proxy' },
];

export default function DashboardClient() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<BenchmarkResult[]>([]);
  const [totalHashrate, setTotalHashrate] = useState(0);
  const [onlineClients, setOnlineClients] = useState(0);
  const [poolEffort, setPoolEffort] = useState<number | null>(null);
  const [verifiedShares, setVerifiedShares] = useState(0);
  const [poolNodes, setPoolNodes] = useState<PoolNodeStats[]>([]);
  const [rates, setRates] = useState<RatesResponse>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [benchmarksResponse, poolStatsResponse, ratesResponse] = await Promise.allSettled([
        fetch(`/api/benchmarks?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`${POOL_STATS_URL}?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`${RATES_URL}?t=${Date.now()}`, { cache: 'no-store' })
      ]);

      if (benchmarksResponse.status === 'fulfilled' && benchmarksResponse.value.ok) {
        const benchmarkPayload: BenchmarkResult[] = await benchmarksResponse.value.json();

        setResults(benchmarkPayload);
        const cpuRows = getLeaderboardRows(benchmarkPayload, 'cpu');
        setTests(cpuRows);

        const summaryData = cpuRows.map((item) => ({
          id: item.id,
          algorithm: item.algorithm,
          device_name: item.device_name,
          device_type: item.device_type,
          hashrate: Number(item.avg_hashrate),
          powerConsumption: item.avg_power ? Number(item.avg_power) : undefined,
          efficiency: Number(item.efficiency),
          created_at: item.created_at,
          timestamp: item.created_at ? String(item.created_at) : undefined,
          gpu_model: item.gpu_model || item.device_name,
          gpuModel: item.gpu_model || item.device_name,
        }));

        setSummary(calculateSummary(summaryData));
      } else {
        console.error('Failed to fetch benchmark data');
      }

      if (poolStatsResponse.status === 'fulfilled' && poolStatsResponse.value.ok) {
        const poolStatsPayload: PoolStatsResponse = await poolStatsResponse.value.json();
        setTotalHashrate(Number(poolStatsPayload.poolHashrate || 0));
        setOnlineClients(Number(poolStatsPayload.stratum?.connections || poolStatsPayload.miners || 0));
        setPoolEffort(poolStatsPayload.stratum?.current_effort !== undefined ? poolStatsPayload.stratum.current_effort : null);
        setVerifiedShares(Number(poolStatsPayload.verifiedShares || 0));
        setPoolNodes(Array.isArray(poolStatsPayload.pools) ? poolStatsPayload.pools : []);
        setLastUpdated(new Date().toISOString());
      } else {
        setTotalHashrate(0);
        setOnlineClients(0);
        setPoolEffort(null);
        setVerifiedShares(0);
        setPoolNodes([]);
        setLastUpdated(null);
      }

      if (ratesResponse.status === 'fulfilled' && ratesResponse.value.ok) {
        const ratesPayload: RatesResponse = await ratesResponse.value.json();
        setRates(ratesPayload);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const intervalId = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadData]);

  const handleRefresh = () => loadData();

  const cpuLeaderboardCount = getLeaderboardRows(results, 'cpu').length;
  const nonAggregatePools = poolNodes.filter((pool) => (pool.id || '').toLowerCase() !== 'aggregate');
  const visiblePoolCards = POOL_CARDS.filter((card) => (
    card.key === 'default' || nonAggregatePools.some((pool) => {
      const id = (pool.id || '').toLowerCase();
      const region = (pool.region || '').toLowerCase();
      if (card.key === 'eu') return id.includes('eu') || region.includes('eu');
      if (card.key === 'us') return id.includes('us') || region.includes('us');
      return false;
    })
  ));
  const findPoolNode = (card: PoolCard) => nonAggregatePools.find((pool) => {
    const id = (pool.id || '').toLowerCase();
    const region = (pool.region || '').toLowerCase();

    if (card.key === 'eu') return id.includes('eu') || region.includes('eu');
    if (card.key === 'us') return id.includes('us') || region.includes('us');
    return id.includes('default') || id.includes('proxy') || id.includes('primary') || (
      !id.includes('eu') && !region.includes('eu') && !id.includes('us') && !region.includes('us')
    );
  });

  return (
    <div className="min-h-screen bg-black text-zinc-400">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <section className="border border-zinc-800 bg-zinc-950/60 p-8 md:p-10 mb-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">Live Network Feed</span>
                </div>
              <h1 className="text-[2rem] sm:text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                  CPU Mining Benchmark <span className="text-yellow-400">Dashboard</span>
                </h1>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Track live hashrate, active benchmark clients, and the strongest CPU result across the MineBench network. Use this page to compare RandomX CPU mining benchmark data and see where your rig stands in the live results feed.
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-3 self-start border border-zinc-700 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:border-yellow-400 hover:text-yellow-400"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh Live Data'}
              </button>
            </div>

            {loading && results.length === 0 && (
              <div className="flex items-center gap-3 border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading live dashboard data...
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border border-zinc-800 bg-black p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Total Pool Hashrate</span>
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="font-black text-yellow-400 font-mono-system tracking-tighter leading-none whitespace-nowrap">
                  {(() => {
                    const [value, unit] = formatHashrate(totalHashrate).split(' ');
                    return (
                      <>
                        <span className="text-4xl md:text-5xl">{value}</span>
                        <span className="ml-1.5 text-xl md:text-2xl text-yellow-400/80">{unit}</span>
                      </>
                    );
                  })()}
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">
                  Combined live performance from reward proxies
                </p>
              </div>
              <div className="border border-zinc-800 bg-black p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Miners Online</span>
                  <Users className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-4xl md:text-5xl font-black text-white font-mono-system tracking-tighter">
                  {onlineClients.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">
                  Network participants
                </p>
              </div>
              <div className="border border-zinc-800 bg-black p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Verified Shares</span>
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-4xl md:text-5xl font-black text-white font-mono-system tracking-tighter">
                  {verifiedShares.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">
                  P2Pool shares found this window
                </p>
              </div>
              <div className="border border-zinc-800 bg-black p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">XMR / BMT Exchange</span>
                  <Activity className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">XMR Price</span>
                    <span className="text-xl font-black text-white font-mono-system tracking-tighter tabular-nums">
                      ${rates.xmr_usd ? rates.xmr_usd.toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">BMT Price</span>
                    <a
                      href="https://pump.fun/coin/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl font-black text-yellow-400 font-mono-system tracking-tighter tabular-nums hover:text-white transition-colors"
                    >
                      ${rates.bmt_usd ? rates.bmt_usd.toFixed(8) : '0.00'}
                    </a>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mt-3 pt-3 border-t border-zinc-900">
                  Last synced {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'just now'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Pool Performance</h2>
                  <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Total above, each reward proxy below</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">
                  {visiblePoolCards.length} {visiblePoolCards.length === 1 ? 'proxy' : 'proxies'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {visiblePoolCards.map((card) => {
                  const pool = findPoolNode(card);
                  const s = pool?.stratum;
                  const hashrate15m = Number(pool?.poolHashrate || s?.hashrate_15m || 0);
                  const hashrate1h = Number(s?.hashrate_1h || 0);
                  const hashrate24h = Number(s?.hashrate_24h || 0);
                  const connections = Number(pool?.miners || s?.connections || 0);
                  const workers = Number(s?.workers?.length || s?.incoming_connections || 0);
                  const effort = s?.current_effort;
                  const stratumShares = Number(s?.total_stratum_shares || 0);
                  const failedShares = Number(s?.shares_failed || 0);
                  const totalHashes = Number(s?.total_hashes || 0);
                  const sharesFound = Number(s?.shares_found || 0);
                  const isOnline = Boolean(pool);

                  return (
                    <div key={card.key} className="border border-zinc-800 bg-black p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{card.label}</span>
                        <div className="flex items-center gap-2">
                          {effort !== undefined && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                              {Number(effort).toFixed(1)}% effort
                            </span>
                          )}
                          <Activity className={`h-4 w-4 ${isOnline ? 'text-yellow-400' : 'text-zinc-700'}`} />
                        </div>
                      </div>

                      <p className="font-mono-system text-3xl font-black tracking-tighter text-yellow-400 md:text-4xl">
                        {formatHashrate(hashrate15m)}
                      </p>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-4">15m avg</p>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900 mb-4">
                        <div>
                          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">1h avg</div>
                          <div className="text-sm font-black text-white font-mono-system">{formatHashrate(hashrate1h)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">24h avg</div>
                          <div className="text-sm font-black text-white font-mono-system">{formatHashrate(hashrate24h)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-zinc-900">
                        <div>
                          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Workers</div>
                          <div className="text-sm font-black text-white font-mono-system">{workers.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Connections</div>
                          <div className="text-sm font-black text-white font-mono-system">{connections.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Stratum Shares</div>
                          <div className="text-sm font-black text-white font-mono-system">{stratumShares.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Failed Shares</div>
                          <div className="text-sm font-black text-white font-mono-system">{failedShares.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Total Hashes</div>
                          <div className="text-sm font-black text-white font-mono-system">{formatHashCount(totalHashes)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Verified Shares</div>
                          <div className="text-sm font-black text-yellow-400 font-mono-system">{sharesFound.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/downloads"
                className="inline-flex items-center justify-center gap-3 bg-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-white"
              >
                <Download className="w-5 h-5" />
                Run Performance Check
              </Link>
              <Link
                href="/downloads"
                className="inline-flex items-center justify-center gap-3 border border-zinc-700 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:border-yellow-400 hover:text-yellow-400"
              >
                Download Benchmark Client
              </Link>
              <Link
                href="/premium"
                className="inline-flex items-center justify-center gap-3 border border-zinc-700 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:border-yellow-400 hover:text-yellow-400"
              >
                Unlock Premium Controls
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-14">
          <PoolHashrateChart />
        </section>

        {summary && <StatsCards summary={summary} />}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          <div className="border border-zinc-800 bg-zinc-950 p-7">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
              Search The Best <span className="text-yellow-400">CPU Mining Benchmark</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              If you are looking for a CPU mining benchmark, RandomX benchmark results, or the best CPU for Monero mining, this dashboard gives you live performance data from real MineBench client submissions.
            </p>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-7">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
              Review <span className="text-yellow-400">The Best CPU Mining Result</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Use the dashboard to review current hashrate, validate your own rig, and focus on the strongest CPU benchmark submitted by real MineBench clients.
            </p>
          </div>
        </section>

        <div className="space-y-16 pb-20">
          <section className="border border-zinc-800 bg-zinc-950 p-8 md:p-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">Ranked Hardware Moved</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                  Benchmark tables now live on the <span className="text-yellow-400">Leaderboard</span>
                </h2>
                <p className="max-w-3xl text-sm md:text-base leading-relaxed text-zinc-400">
                  Dashboard stays focused on live pool health, rewards, network totals, and the best CPU result. The leaderboard page owns full hardware ranking tables.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-zinc-800 bg-black p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Best CPU Rows</div>
                  <div className="mt-2 font-mono-system text-3xl font-black text-yellow-400">{cpuLeaderboardCount}</div>
                </div>
                <div className="border border-zinc-800 bg-black p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Best Result</div>
                  <div className="mt-2 font-mono-system text-3xl font-black text-white">
                    {summary ? formatHashrate(summary.bestPerformer.hashrate) : formatHashrate(0)}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/leaderboard"
                className="inline-flex items-center justify-center gap-3 bg-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-white active:scale-[0.98]"
              >
                Open Mining Leaderboard
              </Link>
              <Link
                href="/downloads"
                className="inline-flex items-center justify-center gap-3 border border-zinc-700 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:border-yellow-400 hover:text-yellow-400 active:scale-[0.98]"
              >
                Submit New Benchmark
              </Link>
            </div>
          </section>
          <section className="border border-zinc-800 bg-zinc-950 p-8">
            <div className="max-w-4xl space-y-5">
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                Run Your Own <span className="text-yellow-400">Hardware Performance Check</span>
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                Want to see where your processor ranks? Download the MineBench client, run a benchmark, and publish your result to the live mining benchmark dashboard. This is the fastest way to test CPU mining performance, compare RandomX benchmark output, and measure your rig against real network data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/downloads"
                  className="inline-flex items-center justify-center gap-3 bg-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-white"
                >
                  <Download className="w-5 h-5" />
                  Download And Test Your Rig
                </Link>
                <Link
                  href="/premium"
                  className="inline-flex items-center justify-center gap-3 border border-zinc-700 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:border-yellow-400 hover:text-yellow-400"
                >
                  Explore Premium Mining Controls
                </Link>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12 border-t border-zinc-900/50 mt-12">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 overflow-hidden relative group shadow-xl h-[270px] flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 h-16 text-yellow-400" />
              </div>
              <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tighter italic">Network Health</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Sync Status</span>
                    <span className="text-[10px] font-mono text-yellow-400">100%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1">
                    <div className="bg-yellow-400 h-full w-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm pt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-zinc-400 uppercase tracking-widest font-black text-[9px]">All Pool Nodes Optimal</span>
                </div>
              </div>
            </div>

            <div className="bg-black border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors shadow-xl h-[270px] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white uppercase tracking-tight italic">System Index</h3>
                <Cpu className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500 uppercase">VERSION:</span>
                  <span className="text-white font-bold">v0.1.5.0</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500 uppercase">NETWORK:</span>
                  <span className="text-white font-bold text-blue-400 text-[9px]">SOLANA MAINNET</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500 uppercase">WORKERS (LIVE):</span>
                  <span className="text-white font-bold text-yellow-400">{onlineClients}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500 uppercase">CURRENT EFFORT:</span>
                  <span className="text-white font-bold">{poolEffort !== null ? poolEffort.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase">XMR/BMT RATIO:</span>
                  <span className="text-white font-bold">{rates.rate_xmr_bmt ? rates.rate_xmr_bmt.toFixed(0) : '0'}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 h-[270px]">
              <RecentTests tests={tests} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
