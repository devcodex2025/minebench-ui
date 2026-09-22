'use client';

import AnimatedContent from '@/components/reactbits/AnimatedContent';
import FadeContent from '@/components/reactbits/FadeContent';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BenchmarkResult, BenchmarkSummary } from '@/types/benchmark';
import { calculateSummary, formatHashCount, formatHashrate } from '@/lib/utils';
import { getLeaderboardRows } from '@/lib/leaderboard';
import { normalizePoolStats } from '@/lib/pool-stats';
import StatsCards, { RecentTests } from '@/components/StatsCards';
import PoolHashrateChart from '@/components/PoolHashrateChart';
import LiveMinerLeaderboard, { LiveMiner } from '@/components/LiveMinerLeaderboard';
import { Activity, Award, Cpu, Download, RefreshCw, TrendingUp, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ThinkingOrb } from 'thinking-orbs';

type PoolStatsResponse = {
  poolHashrate?: number;
  miners?: number;
  pools?: PoolNodeStats[];
  p2poolSharesFound?: number;
  p2poolLastShareFoundAt?: number;
  currentEffort?: number | null;
  verifiedShares?: number;
  minerLeaderboard?: LiveMiner[];
  rewards?: { totalBmtRewards?: number; availableBmtRewards?: number };
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
  const [p2poolSharesFound, setP2PoolSharesFound] = useState(0);
  const [p2poolLastShareFoundAt, setP2PoolLastShareFoundAt] = useState<number | null>(null);
  const [poolNodes, setPoolNodes] = useState<PoolNodeStats[]>([]);
  const [liveMiners, setLiveMiners] = useState<LiveMiner[]>([]);
  const [rates, setRates] = useState<RatesResponse>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [availableRewards, setAvailableRewards] = useState(0);

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
        const normalizedPoolStats = normalizePoolStats(poolStatsPayload);
        setTotalHashrate(normalizedPoolStats.poolHashrate);
        setOnlineClients(normalizedPoolStats.miners);
        setPoolEffort(poolStatsPayload.currentEffort ?? poolStatsPayload.stratum?.current_effort ?? null);
        setP2PoolSharesFound(normalizedPoolStats.p2poolSharesFound);
        const lastShare = Number(poolStatsPayload.p2poolLastShareFoundAt || 0);
        setP2PoolLastShareFoundAt(lastShare > 0 ? (lastShare < 10_000_000_000 ? lastShare * 1000 : lastShare) : null);
        setPoolNodes(normalizedPoolStats.pools);
        setLiveMiners(normalizedPoolStats.minerLeaderboard as LiveMiner[]);
        setAvailableRewards(Number(poolStatsPayload.rewards?.availableBmtRewards || 0));
        setLastUpdated(new Date().toISOString());
      } else {
        setTotalHashrate(0);
        setOnlineClients(0);
        setPoolEffort(null);
        setP2PoolSharesFound(0);
        setP2PoolLastShareFoundAt(null);
        setPoolNodes([]);
        setLiveMiners([]);
        setAvailableRewards(0);
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
    <div className="board-page refresh-dashboard min-h-screen bg-black text-zinc-400">
      <Header />
      <main id="refresh-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <FadeContent as="section" className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 md:p-10 mb-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-semibold tracking-normal text-yellow-400">Live Network Feed</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tighter">
                  Network <span className="text-yellow-400">overview</span>
                </h1>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Pool activity, live hashrate and CPU benchmark results across the MineBench network.
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="btn-secondary self-start disabled:opacity-50"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh Live Data'}
              </button>
            </div>

            {loading && results.length === 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-xs font-semibold tracking-normal text-yellow-400">
                <ThinkingOrb state="searching" size={20} theme="dark" aria-hidden="true" />
                Loading live dashboard data...
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,1.35fr)] xl:gap-6">
              <div className="board-stat flex min-h-44 min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6">
                <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0 text-xs font-semibold leading-relaxed tracking-normal text-zinc-500">Total Pool Hashrate</span>
                  <TrendingUp className="h-5 w-5 shrink-0 text-yellow-400" />
                </div>
                <p className="whitespace-nowrap tabular-nums text-3xl font-semibold leading-none tracking-tighter text-yellow-400 sm:text-4xl">
                  {formatHashrate(totalHashrate)}
                </p>
                <p className="mt-auto pt-4 text-xs leading-relaxed tracking-normal text-zinc-500">
                  Combined live performance from reward proxies
                </p>
              </div>
              <div className="board-stat flex min-h-44 min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6">
                <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0 text-xs font-semibold leading-relaxed tracking-normal text-zinc-500">Miners Online</span>
                  <Users className="h-5 w-5 shrink-0 text-yellow-400" />
                </div>
                <p className="tabular-nums text-3xl font-semibold leading-none tracking-tighter text-white sm:text-4xl">
                  {onlineClients.toLocaleString()}
                </p>
                <p className="mt-auto pt-4 text-xs leading-relaxed tracking-normal text-zinc-500">
                  Network participants
                </p>
              </div>
              <div className="board-stat flex min-h-44 min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6">
                <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0 text-xs font-semibold leading-relaxed tracking-normal text-zinc-500">P2Pool Shares · 24h</span>
                  <Award className="h-5 w-5 shrink-0 text-yellow-400" />
                </div>
                <p className="tabular-nums text-3xl font-semibold leading-none tracking-tighter text-white sm:text-4xl">
                  {p2poolSharesFound.toLocaleString()}
                </p>
                <p className="mt-auto pt-4 text-xs leading-relaxed tracking-normal text-zinc-500">
                  Native P2Pool shares found by the pool · {p2poolLastShareFoundAt ? `last ${new Date(p2poolLastShareFoundAt).toLocaleString()}` : 'no recent timestamp'}
                </p>
              </div>
              <div className="board-stat flex min-h-44 min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6">
                <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0 text-xs font-semibold leading-relaxed tracking-normal text-zinc-500">Available BMT Rewards</span>
                  <Award className="h-5 w-5 shrink-0 text-yellow-400" />
                </div>
                <p className="whitespace-nowrap tabular-nums text-3xl font-semibold leading-none tracking-tighter text-yellow-400 sm:text-4xl">
                  {availableRewards.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                </p>
                <p className="mt-auto pt-4 text-xs leading-relaxed tracking-normal text-zinc-500">Credited mining rewards not yet paid</p>
              </div>
              <div className="board-stat flex min-h-44 min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6">
                <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0 text-xs font-semibold leading-relaxed tracking-normal text-zinc-500">XMR / BMT Exchange</span>
                  <Activity className="h-5 w-5 shrink-0 text-yellow-400" />
                </div>
                <div className="grid min-w-0 grid-cols-2 items-end gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500 font-mono mb-1">XMR Price:</div>
                    <p className="whitespace-nowrap tabular-nums text-lg font-semibold tracking-tighter text-white sm:text-xl">
                      ${rates.xmr_usd ? rates.xmr_usd.toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="text-xs text-zinc-500 font-mono mb-1">BMT Price:</div>
                    <a
                      href="https://pump.fun/coin/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block max-w-full whitespace-nowrap tabular-nums text-lg font-semibold tracking-tighter text-yellow-400 transition-colors hover:text-white sm:text-xl"
                    >
                      ${rates.bmt_usd ? rates.bmt_usd.toFixed(8) : '0.00'}
                    </a>
                  </div>
                </div>
                <p className="mt-auto border-t border-zinc-900 pt-4 text-xs tracking-normal text-zinc-500">
                  Last synced {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'just now'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-normal text-white">Pool Performance</h2>
                  <p className="mt-1 text-xs tracking-normal text-zinc-500">Total above, each reward proxy below</p>
                </div>
                <span className="text-xs font-semibold tracking-normal text-yellow-400">
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
                  const isOnline = Boolean(pool);

                  return (
                    <div key={card.key} className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-6">
                      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-xs font-semibold tracking-normal text-zinc-500">{card.label}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          {effort !== undefined && (
                            <span className="text-[9px] font-semibold tracking-normal text-zinc-400">
                              {Number(effort).toFixed(1)}% effort
                            </span>
                          )}
                          <Activity className={`h-4 w-4 ${isOnline ? 'text-yellow-400' : 'text-zinc-700'}`} />
                        </div>
                      </div>

                      <p className="tabular-nums text-3xl font-semibold tracking-tighter text-yellow-400 md:text-4xl">
                        {formatHashrate(hashrate15m)}
                      </p>
                      <p className="text-[9px] text-zinc-400 tracking-normal mb-4">15m avg</p>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900 mb-4">
                        <div>
                          <div className="text-[9px] text-zinc-400 tracking-normal mb-0.5">1h avg</div>
                          <div className="text-sm font-semibold text-white tabular-nums">{formatHashrate(hashrate1h)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-400 tracking-normal mb-0.5">24h avg</div>
                          <div className="text-sm font-semibold text-white tabular-nums">{formatHashrate(hashrate24h)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-zinc-900">
                        <div>
                          <div className="text-[9px] text-zinc-400 tracking-normal mb-0.5">Workers</div>
                          <div className="text-sm font-semibold text-white tabular-nums">{workers.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-400 tracking-normal mb-0.5">Connections</div>
                          <div className="text-sm font-semibold text-white tabular-nums">{connections.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-400 tracking-normal mb-0.5">Stratum Shares</div>
                          <div className="text-sm font-semibold text-white tabular-nums">{stratumShares.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-400 tracking-normal mb-0.5">Failed Shares</div>
                          <div className="text-sm font-semibold text-white tabular-nums">{failedShares.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-400 tracking-normal mb-0.5">Total Hashes</div>
                          <div className="text-sm font-semibold text-white tabular-nums">{formatHashCount(totalHashes)}</div>
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
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-yellow-400 px-8 py-4 text-sm font-semibold tracking-normal text-black transition-all hover:bg-white"
              >
                <Download className="w-5 h-5" />
                Run Performance Check
              </Link>
              <Link
                href="/downloads"
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-zinc-700 px-8 py-4 text-sm font-semibold tracking-normal text-white transition-all hover:border-yellow-400 hover:text-yellow-400"
              >
                Download Benchmark Client
              </Link>
              <Link
                href="/premium"
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-zinc-700 px-8 py-4 text-sm font-semibold tracking-normal text-white transition-all hover:border-yellow-400 hover:text-yellow-400"
              >
                Unlock Premium Controls
              </Link>
            </div>
          </div>
        </FadeContent>

        <FadeContent as="section" className="mb-14 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.65fr)]">
          <PoolHashrateChart />
          <LiveMinerLeaderboard miners={liveMiners} onlineConnections={onlineClients} />
        </FadeContent>

        {summary && <StatsCards summary={summary} />}

        <FadeContent as="section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-7">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-4">
              Search The Best <span className="text-yellow-400">CPU Mining Benchmark</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              If you are looking for a CPU mining benchmark, RandomX benchmark results, or the best CPU for Monero mining, this dashboard gives you live performance data from real MineBench client submissions.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-7">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-4">
              Review <span className="text-yellow-400">The Best CPU Mining Result</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Use the dashboard to review current hashrate, validate your own rig, and focus on the strongest CPU benchmark submitted by real MineBench clients.
            </p>
          </div>
        </FadeContent>

        <div className="space-y-16 pb-20">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 md:p-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-semibold tracking-normal text-yellow-400">Ranked Hardware Moved</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter">
                  Benchmark tables now live on the <span className="text-yellow-400">Leaderboard</span>
                </h2>
                <p className="max-w-3xl text-sm md:text-base leading-relaxed text-zinc-400">
                  Dashboard stays focused on live pool health, rewards, network totals, and the best CPU result. The leaderboard page owns full hardware ranking tables.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-zinc-800 bg-black p-4">
                  <div className="text-xs font-semibold tracking-normal text-zinc-500">Best CPU Rows</div>
                  <div className="mt-2 tabular-nums text-3xl font-semibold text-yellow-400">{cpuLeaderboardCount}</div>
                </div>
                <div className="border border-zinc-800 bg-black p-4">
                  <div className="text-xs font-semibold tracking-normal text-zinc-500">Best Result</div>
                  <div className="mt-2 tabular-nums text-3xl font-semibold text-white">
                    {summary ? formatHashrate(summary.bestPerformer.hashrate) : formatHashrate(0)}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/leaderboard"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-yellow-400 px-8 py-4 text-sm font-semibold tracking-normal text-black transition-all hover:bg-white active:scale-[0.98]"
              >
                Open Mining Leaderboard
              </Link>
              <Link
                href="/downloads"
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-zinc-700 px-8 py-4 text-sm font-semibold tracking-normal text-white transition-all hover:border-yellow-400 hover:text-yellow-400 active:scale-[0.98]"
              >
                Submit New Benchmark
              </Link>
            </div>
          </section>
          <AnimatedContent as="section" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="max-w-4xl space-y-5">
              <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tighter">
                Run Your Own <span className="text-yellow-400">Hardware Performance Check</span>
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                Want to see where your processor ranks? Download the MineBench client, run a benchmark, and publish your result to the live mining benchmark dashboard. This is the fastest way to test CPU mining performance, compare RandomX benchmark output, and measure your rig against real network data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/downloads"
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-yellow-400 px-8 py-4 text-sm font-semibold tracking-normal text-black transition-all hover:bg-white"
                >
                  <Download className="w-5 h-5" />
                  Download And Test Your Rig
                </Link>
                <Link
                  href="/premium"
                  className="inline-flex items-center justify-center gap-3 rounded-xl border border-zinc-700 px-8 py-4 text-sm font-semibold tracking-normal text-white transition-all hover:border-yellow-400 hover:text-yellow-400"
                >
                  Explore Premium Mining Controls
                </Link>
              </div>
            </div>
          </AnimatedContent>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12 border-t border-zinc-900/50 mt-12">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 overflow-hidden relative group shadow-xl h-[270px] flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 h-16 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-4 tracking-tighter">Network Health</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-mono text-zinc-500">Sync Status</span>
                    <span className="text-xs font-mono text-yellow-400">100%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1">
                    <div className="bg-yellow-400 h-full w-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm pt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-zinc-400 tracking-normal font-semibold text-[9px]">All Pool Nodes Optimal</span>
                </div>
              </div>
            </div>

            <div className="bg-black border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors shadow-xl h-[270px] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white tracking-tight">System Index</h3>
                <Cpu className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500">VERSION:</span>
                  <span className="text-white font-bold">v0.1.5.0</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500">NETWORK:</span>
                  <span className="text-white font-bold text-blue-400 text-[9px]">SOLANA MAINNET</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500">WORKERS (LIVE):</span>
                  <span className="text-white font-bold text-yellow-400">{onlineClients}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500">CURRENT EFFORT:</span>
                  <span className="text-white font-bold">{poolEffort !== null ? poolEffort.toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">XMR/BMT RATIO:</span>
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
