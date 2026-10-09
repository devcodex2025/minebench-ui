import { CheckCircle2, Clock3, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { formatHashrate } from '@/lib/utils';

export type DynamicFeeTier = {
  minimumHashrate?: number;
  minHashrate?: number;
  hashrate?: number;
  feeBps?: number;
  feePercent?: number;
};

export type DynamicFeeDecision = {
  decidedAt?: string;
  feePercent?: number;
  reason?: string;
};

export type DynamicFeePolicy = {
  unavailable?: boolean;
  currentFeeBps?: number;
  currentFeePercent?: number;
  effectiveAt?: string;
  sevenDayEligibleHashrate?: number;
  coverageRatio?: number;
  currentTierMinimum?: number;
  nextLowerFeeTier?: { feePercent?: number; feeBps?: number; minimumHashrate?: number; minHashrate?: number } | null;
  belowCurrentMinimumSince?: string | null;
  evaluationCadence?: 'hourly';
  policyVersion?: string;
  recentDecisions?: DynamicFeeDecision[];
  schedule?: DynamicFeeTier[];
};

type Props = { policy?: DynamicFeePolicy | null };

function percent(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function feePercent(tier: DynamicFeeTier) {
  const direct = percent(tier.feePercent, NaN);
  return Number.isFinite(direct) ? direct : percent(tier.feeBps, 0) / 100;
}

function tierHashrate(tier: DynamicFeeTier) {
  return percent(tier.minimumHashrate ?? tier.minHashrate ?? tier.hashrate, 0);
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
}

export default function DynamicManagedFeePanel({ policy }: Props) {
  if (!policy || policy.unavailable) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6" aria-labelledby="managed-fee-title">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" aria-hidden="true" />
          <div>
            <h2 id="managed-fee-title" className="text-lg font-semibold text-white">Dynamic managed fee</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">Fee policy data is temporarily unavailable. Native direct P2Pool payouts remain 0%.</p>
          </div>
        </div>
      </section>
    );
  }

  const currentFee = percent(policy.currentFeePercent, percent(policy.currentFeeBps, 0) / 100);
  const keepPercent = Math.max(0, 100 - currentFee);
  const nextTier = policy.nextLowerFeeTier;
  const nextFee = nextTier ? (nextTier.feePercent !== undefined ? percent(nextTier.feePercent) : percent(nextTier.feeBps, 0) / 100) : null;
  const schedule = Array.isArray(policy.schedule) ? policy.schedule : [];
  const coverage = percent(policy.coverageRatio, NaN);
  const belowMinimum = Boolean(policy.belowCurrentMinimumSince);

  return (
    <section className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 via-zinc-950/80 to-zinc-950/70 p-6 sm:p-8" aria-labelledby="managed-fee-title">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
            <TrendingDown className="h-4 w-4" aria-hidden="true" />
            Dynamic reward policy
          </div>
          <h2 id="managed-fee-title" className="mt-4 text-2xl font-semibold tracking-tight text-white">More shared hashrate, lower fees</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">MineBench-managed rewards follow the published schedule. The policy is evaluated using the trailing seven-day eligible hashrate.</p>
        </div>
        <div className="rounded-xl border border-yellow-400/30 bg-black/40 px-5 py-4 text-left lg:min-w-48 lg:text-right">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current fee</div>
          <div className="mt-1 text-4xl font-semibold tabular-nums tracking-tighter text-yellow-400">{currentFee.toFixed(currentFee % 1 ? 1 : 0)}%</div>
          <div className="text-sm font-medium text-white">Miners keep {keepPercent.toFixed(keepPercent % 1 ? 1 : 0)}%</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4"><div className="text-xs text-zinc-500">Trailing 7d eligible hashrate</div><div className="mt-2 text-lg font-semibold tabular-nums text-white">{formatHashrate(percent(policy.sevenDayEligibleHashrate))}</div></div>
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4"><div className="text-xs text-zinc-500">Next lower fee</div><div className="mt-2 text-lg font-semibold tabular-nums text-white">{nextFee !== null ? `${nextFee}%` : '—'}</div><div className="text-xs text-zinc-500">at {nextTier ? formatHashrate(tierHashrate(nextTier)) : '—'}</div></div>
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4"><div className="text-xs text-zinc-500">Evaluation cadence</div><div className="mt-2 text-sm font-semibold text-white">Hourly</div></div>
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4"><div className="text-xs text-zinc-500">Coverage ratio</div><div className="mt-2 text-lg font-semibold tabular-nums text-white">{Number.isFinite(coverage) ? `${(coverage * 100).toFixed(0)}%` : '—'}</div></div>
      </div>

      <div className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${belowMinimum ? 'border-orange-400/30 bg-orange-400/10 text-orange-200' : 'border-emerald-400/20 bg-emerald-400/5 text-emerald-200'}`}>
        {belowMinimum ? <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
        <span>{belowMinimum ? `The pool has been below the current tier minimum since ${formatDate(policy.belowCurrentMinimumSince)}. The fee will increase after the one-week confirmation window.` : 'The current tier is confirmed by the trailing seven-day hashrate.'}</span>
      </div>

      {schedule.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-white">Published fee schedule</h3><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{schedule.map((tier, index) => <div key={`${tierHashrate(tier)}-${index}`} className="rounded-lg border border-zinc-800 bg-black/25 px-3 py-2"><div className="text-sm font-semibold text-yellow-400">{feePercent(tier)}%</div><div className="text-[11px] text-zinc-500">from {formatHashrate(tierHashrate(tier))}</div></div>)}</div></div>}

      <p className="mt-6 flex items-start gap-2 border-t border-zinc-800 pt-4 text-xs leading-relaxed text-zinc-500"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />Native direct P2Pool payouts remain 0%. This fee applies only to rewards managed through MineBench or an optional conversion flow.{policy.policyVersion ? ` Policy ${policy.policyVersion}.` : ''}</p>
    </section>
  );
}
