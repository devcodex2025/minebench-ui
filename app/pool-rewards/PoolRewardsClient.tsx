'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Blocks, CircleDollarSign, Coins, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type PoolReward = {
  id: string;
  timestamp: string;
  blockHeight: number | null;
  xmrReward: number;
  grossBmt: number;
  userBmt: number;
  treasuryBmt: number;
  distributions: number;
  paidDistributions: number;
  creditedDistributions: number;
  payoutStatus: 'processing' | 'credited' | 'partially_paid' | 'paid';
};

const PAGE_SIZE = 30;

const PAYOUT_STATUS = {
  processing: { label: 'Processing', className: 'border-zinc-600 bg-zinc-800/60 text-zinc-300' },
  credited: { label: 'BMT credited', className: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300' },
  partially_paid: { label: 'Partially paid', className: 'border-orange-400/40 bg-orange-400/10 text-orange-300' },
  paid: { label: 'Paid on Solana', className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
} as const;

function RewardCoin({ asset, className }: { asset: 'XMR' | 'BMT'; className: string }) {
  const isMonero = asset === 'XMR';

  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center rounded-full border-2 shadow-2xl ${
        isMonero
          ? 'border-orange-200/70 bg-[radial-gradient(circle_at_35%_28%,#fff7ed_0%,#fb923c_22%,#ea580c_58%,#431407_100%)] shadow-orange-500/20'
          : 'border-yellow-200/70 bg-[radial-gradient(circle_at_35%_28%,#fefce8_0%,#facc15_24%,#65a30d_62%,#052e16_100%)] shadow-lime-400/20'
      } ${className}`}
    >
      <span className="absolute inset-[8%] rounded-full border border-white/30" />
      <span className="absolute inset-[17%] rounded-full border border-black/20" />
      <span className={`relative font-black tracking-tighter text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.65)] ${isMonero ? 'text-4xl' : 'text-xl'}`}>
        {isMonero ? 'ɱ' : 'BMT'}
      </span>
      <span className="absolute bottom-[13%] text-[7px] font-black uppercase tracking-[0.22em] text-white/70">
        {isMonero ? 'Monero' : 'Reward'}
      </span>
    </div>
  );
}

export default function PoolRewardsClient() {
  const [rewards, setRewards] = useState<PoolReward[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadRewards = useCallback(async (offset = 0, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const response = await fetch(`/api/pool-rewards?limit=${PAGE_SIZE}&offset=${offset}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Pool reward history is unavailable');
      const payload = await response.json();
      const nextRewards: PoolReward[] = Array.isArray(payload.rewards) ? payload.rewards : [];
      setRewards((current) => append ? [...current, ...nextRewards] : nextRewards);
      setTotal(Number(payload.total || nextRewards.length));
      setLastUpdated(payload.generatedAt || new Date().toISOString());
      setError(false);
    } catch (loadError) {
      console.error('[PoolRewards] Failed to load reward history:', loadError);
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadRewards();
    const intervalId = window.setInterval(() => void loadRewards(), 30_000);
    return () => window.clearInterval(intervalId);
  }, [loadRewards]);

  const summary = useMemo(() => rewards.reduce((totals, reward) => ({
    xmr: totals.xmr + reward.xmrReward,
    minerBmt: totals.minerBmt + reward.userBmt,
    distributions: totals.distributions + reward.distributions,
    paidBlocks: totals.paidBlocks + (reward.payoutStatus === 'paid' ? 1 : 0)
  }), { xmr: 0, minerBmt: 0, distributions: 0, paidBlocks: 0 }), [rewards]);

  return (
    <div className="min-h-screen bg-black text-zinc-400">
      <Header onRefresh={() => void loadRewards()} loading={loading} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="relative mb-8 overflow-hidden border border-zinc-800 bg-zinc-950/70 p-8 md:p-10">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_65%)]" />
          <div className="pointer-events-none absolute -right-7 -top-10 hidden h-52 w-56 sm:block">
            <RewardCoin asset="XMR" className="absolute left-0 top-1 h-28 w-28 -rotate-12 opacity-90" />
            <RewardCoin asset="BMT" className="absolute bottom-0 right-0 h-32 w-32 rotate-12 opacity-85" />
          </div>
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">
                <Blocks className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Pool receipt ledger</span>
              </div>
              <h1 className="mt-5 text-4xl font-black uppercase leading-none tracking-tighter text-white md:text-6xl">
                Pool Block <span className="text-yellow-400">Rewards</span>
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-400 md:text-lg">
                Monero payouts received by the MineBench pool, with block heights, XMR amounts, and resulting BMT allocations. The status column separately confirms whether BMT was only credited or already paid on Solana.
              </p>
              <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to live dashboard
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">Pool payouts</div>
                <div className="mt-2 font-mono-system text-3xl font-black text-white">{total}</div>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">Loaded XMR</div>
                <div className="mt-2 font-mono-system text-xl font-black text-yellow-400">{summary.xmr.toFixed(4)}</div>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">Miner BMT</div>
                <div className="mt-2 font-mono-system text-xl font-black text-emerald-400">{summary.minerBmt.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 px-6 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-white">
                <CircleDollarSign className="h-4 w-4 text-yellow-400" /> Reward history
              </h2>
              <p className="mt-1 text-[9px] uppercase tracking-widest text-zinc-600">
                {lastUpdated ? `Synced ${new Date(lastUpdated).toLocaleString()}` : 'Waiting for pool data'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadRewards()}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-zinc-700 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:border-yellow-400 hover:text-yellow-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loading && rewards.length === 0 ? (
            <div className="flex h-72 items-center justify-center" role="status">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-800 border-t-yellow-400" />
            </div>
          ) : error && rewards.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center gap-4 text-center">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Reward history unavailable</span>
              <button type="button" onClick={() => void loadRewards()} className="border border-zinc-700 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-yellow-400 hover:border-yellow-400">
                Try again
              </button>
            </div>
          ) : rewards.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
              <Coins className="h-8 w-8 text-zinc-700" />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500">No confirmed pool rewards yet</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left">
                  <thead className="border-b border-zinc-900 bg-black text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    <tr>
                      <th className="px-6 py-3">Found at</th>
                      <th className="px-4 py-3">Monero block</th>
                      <th className="px-4 py-3 text-right">Reward</th>
                      <th className="px-4 py-3 text-right">BMT allocated</th>
                      <th className="px-6 py-3 text-right">BMT payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {rewards.map((reward, index) => (
                      <tr key={reward.id} className="group transition-colors hover:bg-yellow-400/[0.03]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`h-2.5 w-2.5 rotate-45 border ${index === 0 ? 'border-yellow-200 bg-yellow-400' : 'border-emerald-300 bg-emerald-400'}`} />
                            <div>
                              <div className="font-mono text-xs font-bold text-white">{new Date(reward.timestamp).toLocaleDateString()}</div>
                              <div className="mt-0.5 font-mono text-[10px] text-zinc-600">{new Date(reward.timestamp).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs font-bold text-zinc-400">
                          {reward.blockHeight ? `#${reward.blockHeight.toLocaleString()}` : 'Pending metadata'}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm font-black text-yellow-400">{reward.xmrReward.toFixed(6)} XMR</td>
                        <td className="px-4 py-4 text-right font-mono text-xs font-bold text-emerald-400">{reward.userBmt > 0 ? reward.userBmt.toFixed(2) : '—'}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${PAYOUT_STATUS[reward.payoutStatus].className}`}>
                            {PAYOUT_STATUS[reward.payoutStatus].label}
                          </span>
                          <div className="mt-1 font-mono text-[9px] text-zinc-600">
                            {reward.paidDistributions}/{reward.distributions} allocations paid
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-zinc-900 bg-black/40 px-6 py-4 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rotate-45 border border-yellow-200 bg-yellow-400" />
                  Latest pool XMR payout
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rotate-45 border border-emerald-300 bg-emerald-400" />
                  Earlier pool payouts
                </span>
                <span className="normal-case tracking-normal text-zinc-600">
                  Diamond color shows chronology, not BMT payout status.
                </span>
              </div>

              {rewards.length < total && (
                <div className="border-t border-zinc-900 p-5 text-center">
                  <button
                    type="button"
                    onClick={() => void loadRewards(rewards.length, true)}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 border border-zinc-700 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:border-yellow-400 hover:text-yellow-400 disabled:opacity-50"
                  >
                    {loadingMore && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    Load older rewards
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <p className="mt-5 text-[10px] leading-relaxed text-zinc-600">
          This ledger separates XMR received by the pool, BMT credited to miner balances, and completed Solana payouts. Individual miner identities and wallet addresses are never exposed.
        </p>
      </main>
      <Footer />
    </div>
  );
}
