export type AccountTab = 'overview' | 'workers' | 'rewards' | 'payouts';
export type AccountMode = 'bmt' | 'premium-xmr' | 'direct-xmr';
export type AccountRange = '1h' | '24h' | '7d' | '30d';
export interface AccountRecord {
  id: string; createdAt: string; asset: string; amountAtomic: string | null; amountDecimal: string | null; decimals: number;
  type?: string; status?: string; feeAtomic?: string | null; feeDecimal?: string | null; completedAt?: string | null;
  reservedAtomic?: string; settledAtomic?: string | null; releasedAtomic?: string | null;
}
export interface AccountWorker {
  workerEpochId: string; asset: 'BMT' | 'XMR'; acceptedEvents: number | null;
  acceptedDifficulty: string | null; lastAcceptedAt: string | null;
  canonicalAcceptedEvents?: number | null; rejectedEvents?: number | null; staleEvents?: number | null; invalidEvents?: number | null;
  effectiveHashrateHps?: string | null; averageHashrateHps?: string | null;
  activity?: 'recent_accepted_work' | 'no_recent_accepted_work' | 'unknown';
  presence?: { source: 'proxy_observed_connection.v1'; state: 'connected' | 'disconnected' | 'unknown';
    observedAt: string | null; receivedAt: string | null; freshness: 'fresh' | 'stale' | 'missing' };
}
export interface AccountWorkWindow {
  seconds: number; acceptedEvents: number | null; rejectedEvents: number | null;
  staleEvents: number | null; invalidEvents: number | null; lastAcceptedAt: string | null;
  canonicalAcceptedEvents?: number | null; acceptedDifficulty?: string | null; hashrateHps?: string | null;
}
export interface AccountWorkMetrics {
  source: 'verified_proxy_journal';
  workBasis?: { version: string };
  coverageCheckpoint?: { closedThroughAt?: string | null };
  effectiveHashrateHps: string | null; averageHashrateHps: string | null; lastAcceptedAt: string | null;
  window1h?: AccountWorkWindow; window30d?: AccountWorkWindow;
  window24h: AccountWorkWindow; window7d: AccountWorkWindow;
  completeness: { status: string; reasons: string[] };
}
export function formatAccountHashrate(value: string | null | undefined): string {
  return typeof value === 'string' && /^\d{1,40}(?:\.\d{1,40})?$/.test(value) ? `${value} H/s` : 'Unavailable';
}
export function formatConversionStage(stage: string | undefined, status: string): string {
  const labels: Record<string, string> = {
    awaiting_conversion: 'Awaiting conversion', xmr_transfer: 'XMR transfer', exchange_deposit: 'Exchange deposit',
    exchange_conversion: 'Exchange conversion', sol_transfer: 'SOL transfer', bmt_purchase: 'BMT purchase',
    ledger_reconciliation: 'Ledger reconciliation', complete: 'Canonical BMT credited', unknown: 'Unknown stage'
  };
  return stage ? Object.prototype.hasOwnProperty.call(labels, stage) ? labels[stage] : 'Unknown stage' : status === 'completed' ? 'Canonical BMT credited'
    : status === 'pending' ? 'Awaiting conversion' : 'Unknown stage';
}
export interface AccountStatistics {
  accountId: string;
  asOf: string | null;
  freshness: { status: string; ageSeconds: number | null };
  completeness: { status: string; reasons: string[] };
  nextCursor: string | null;
  data: null | {
    balances?: null | { availableAtomic: string | null; availableDecimal: string; reservedAtomic: string | null; reservedDecimal: string; decimals: number; asset: string };
    telemetry?: null | { source: string; reportedHashrateHps: number; reportedAt: string };
    workMetrics?: AccountWorkMetrics | null;
    financeAvailable?: boolean;
    reason?: string;
    items?: AccountRecord[];
    workers?: AccountWorker[];
    conversions?: { referenceId: string; createdAt: string; status: string; xmrInputAtomic: string;
      bmtOutputAtomic: string | null; bmtOutputDecimal: string | null; decimals: number;
      stage?: string; stageUpdatedAt?: string | null; completedAt?: string | null }[];
  };
}
export class AccountRequestError extends Error {
  constructor(readonly status: number) { super('Account statistics unavailable'); }
}

export async function loadAccountStatistics(tab: AccountTab, mode: AccountMode, range: AccountRange,
  cursor: string | null, signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<AccountStatistics> {
  const query = new URLSearchParams({ mode, range, limit: '25' });
  if (cursor) query.set('cursor', cursor);
  const response = await fetchImpl(`/api/account/statistics/${tab}?${query}`, {
    credentials: 'same-origin', cache: 'no-store', signal
  });
  if (!response.ok) throw new AccountRequestError(response.status);
  const data = await response.json();
  if (!data || typeof data.accountId !== 'string' || !data.freshness || !data.completeness
    || !Array.isArray(data.completeness.reasons) || !('data' in data)) throw new AccountRequestError(503);
  return data;
}

export function formatAccountAmount(atomic: string | null | undefined, decimal: string | null | undefined, decimals: number): string {
  if (atomic === null || atomic === undefined) return typeof decimal === 'string' ? decimal : 'Unavailable';
  if (!/^-?\d{1,40}$/.test(atomic) || !Number.isInteger(decimals) || decimals < 0 || decimals > 18) return 'Unavailable';
  const sign = atomic.startsWith('-') ? '-' : '';
  const digits = atomic.replace(/^-/, '').padStart(decimals + 1, '0');
  if (!decimals) return sign + digits;
  const fraction = digits.slice(-decimals).replace(/0+$/, '');
  return sign + digits.slice(0, -decimals) + (fraction ? `.${fraction}` : '');
}

export const coverageMessage = (reason: string): string => ({
  ACCOUNT_BOUND_XMR_HISTORY_REQUIRED: 'XMR finances require complete canonical attribution of future authenticated account work. An address or worker password does not grant address-wide history or prove recipient delivery.',
  UNASSIGNED_AND_LEGACY_XMR_EXCLUDED: 'Only canonical XMR portions attributed to this account’s authenticated work are shown. Legacy and unassigned wallet amounts remain excluded.',
  XMR_ATTRIBUTION_RECONCILIATION_REQUIRED: 'An XMR source did not reconcile exactly. Affected amounts are excluded from personal available balances until reconciled.',
  XMR_REWARD_HISTORY_TRUNCATED: 'The XMR reward history is capped; older attributed records may be omitted.',
  XMR_PAYOUT_HISTORY_TRUNCATED: 'The XMR payout history is capped; older attributed payout portions may be omitted.',
  VERIFIED_WORKER_BINDING_REQUIRED: 'Verified worker bindings are not available. Effective hashrate, accepted shares and individual workers cannot yet be shown.',
  HASHRATE_UNAVAILABLE_PROTOCOL_OBSERVED_WORK: 'Hashrate is unavailable because protocol-observed difficulty is not independently verified proof of work.',
  STALE_OUTCOME_UNAVAILABLE: 'Stale-share outcomes are not yet recorded as a trusted journal category.',
  WORK_JOURNAL_COVERAGE_INCOMPLETE: 'The journal checkpoint does not cover the full seven-day history window.',
  WORK_JOURNAL_SOURCE_MISSING: 'No authenticated journal source is available. Work counts and hashrate are unknown.',
  WORK_JOURNAL_CHECKPOINT_MISSING: 'A journal source has no coverage checkpoint. Work counts and hashrate are unavailable.',
  WORK_JOURNAL_SOURCE_STALE: 'Journal coverage is more than two minutes old. Recent work may be missing; hashrate estimates are unavailable.',
  FORWARD_ONLY_WORK_COVERAGE: 'Only work submitted after authenticated enrollment is included. Earlier unowned history is excluded.',
  LEGACY_OR_UNBOUND_BMT_WORK_EXCLUDED: 'Legacy or unbound BMT work is excluded because it cannot be securely assigned to this account.',
  VERIFIED_WORK_HISTORY_TRUNCATED: 'The verified work projection is capped; this list may omit older workers or events.',
  WORKER_IDENTITY_UNAVAILABLE: 'Some accepted work is verified but has no stable worker epoch, so it is not assigned to a worker row.',
  WORKER_EPOCH_UNAVAILABLE: 'Some accepted work is verified but has no stable worker epoch, so it is not assigned to a worker row.',
  PROJECTION_NOT_READY: 'Your statistics have not been prepared yet. Try again later.',
  PROJECTION_STALE: 'These statistics are older than one minute. Recent activity may be missing.',
  HISTORY_TRUNCATED: 'Only part of the available history is included.',
  CONVERSION_HISTORY_TRUNCATED: 'Only the first page of linked conversions is included.',
  CONVERSION_OUTPUT_UNAVAILABLE: 'A conversion input is recorded, but its canonical BMT output has not been linked yet.',
  CONVERSION_STATUS_UNAVAILABLE: 'The conversion stage cannot be confirmed from the available records.',
  CONVERSION_RECONCILIATION_REQUIRED: 'A linked conversion needs reconciliation before its BMT output can be confirmed.',
  REJECTION_REASONS_UNAVAILABLE: 'Trusted rejection reasons are missing from part of this window. Stale and invalid counts are unavailable.',
  REJECTION_CLASSIFICATION_UNKNOWN: 'Some upstream rejections have no verified classification. Stale and invalid counts remain unknown.',
  FRACTIONAL_ATOMIC_AMOUNT: 'Some ledger amounts cannot be represented in whole token atomic units. Their exact recorded decimal values are shown.'
} as Record<string, string>)[reason] || 'Coverage is incomplete. Some historical or worker data is unavailable.';
