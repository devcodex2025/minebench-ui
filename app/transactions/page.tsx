import { Suspense } from 'react';
import TransactionsSkeleton from './TransactionsSkeleton';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransactionsRefresh from './TransactionsRefresh';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Transactions | MineBench',
  description: 'Track queued BMT payouts, XMR miner payments and mining-funded BMT purchases on MineBench.',
  alternates: { canonical: 'https://minebench.cloud/transactions' }
};

const tabs = { xmr: 'XMR payouts', support: 'BMT purchases', bmt: 'MineBench payouts' };
const statuses: Record<string, string> = {
  reserved: 'Reserved', preparing: 'Preparing', prepared: 'Prepared', submitting: 'Submitting',
  submitted: 'Awaiting confirmation', confirmed: 'Confirmed', reconciliation_required: 'Under review',
  pending: 'Pending', processing: 'Processing', completed: 'Completed', failed: 'Failed',
  exchanging: 'Exchanging XMR', buying_bmt: 'Buying BMT', refunded: 'Refunded'
};
type Payment = { id: string; status: string; amount: string; fee: string | null;
  transaction_hash: string | null; created_at: string };
type Purchase = { id: string; status: string; xmr_atomic: string; sol_lamports: string | null;
  bmt_atomic: string | null; bmt_decimals: number; solana_signature: string | null;
  cluster: string; created_at: string };
type BatchQueue = { pendingCount: number; targetSize: number };
type BatchQueues = { existing_ata: BatchQueue; missing_ata: BatchQueue };
type PayoutQueue = { pendingCount: number; amountBmt: string; feeBmt: string; batches?: unknown };

function validBatches(value: unknown, total: number): value is BatchQueues {
  if (!value || typeof value !== 'object') return false;
  const batches = value as BatchQueues;
  const validBatch = (batch: BatchQueue, max: number) => batch && Number.isSafeInteger(batch.pendingCount)
    && batch.pendingCount >= 0 && Number.isSafeInteger(batch.targetSize) && batch.targetSize > 0 && batch.targetSize <= max;
  return Boolean(validBatch(batches.existing_ata, 16) && validBatch(batches.missing_ata, 6)
    && batches.existing_ata.pendingCount + batches.missing_ata.pendingCount === total);
}

function BatchProgress({ label, batch }: { label: string; batch: BatchQueue | null }) {
  const filled = batch ? Math.min(batch.pendingCount, batch.targetSize) : 0;
  const ready = batch ? Math.floor(batch.pendingCount / batch.targetSize) : 0;
  return <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5" aria-label={label}>
    <h3 className="text-sm font-medium text-zinc-100">{label}</h3>
    {batch ? <>
      <p className="mt-3 text-2xl font-medium tabular-nums text-yellow-400">{filled} / {batch.targetSize}<span className="ml-2 text-xs font-normal text-zinc-400">next batch</span></p>
      <progress aria-label={`${label}: next batch`} aria-valuetext={`${filled} of ${batch.targetSize} payouts queued for the next batch`} value={filled} max={batch.targetSize} className="mt-3 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-zinc-800 [&::-webkit-progress-value]:bg-yellow-400 [&::-moz-progress-bar]:bg-yellow-400" />
      <p className="mt-3 text-sm text-zinc-300">{batch.pendingCount === 0 ? 'No payouts queued' : ready > 0 ? 'Batch full — awaiting processing' : `Waiting for ${batch.targetSize - filled} more ${batch.targetSize - filled === 1 ? 'payout' : 'payouts'}`}</p>
      <p className="mt-2 text-xs text-zinc-400">{batch.pendingCount.toLocaleString('en-US')} queued in total{ready > 0 ? ` · ${ready} full ${ready === 1 ? 'batch' : 'batches'}` : ''}</p>
    </> : <p className="mt-3 text-sm text-amber-200">Batch progress is temporarily unavailable.</p>}
  </section>;
}

function validQueue(value: unknown): value is PayoutQueue {
  if (!value || typeof value !== 'object') return false;
  const queue = value as PayoutQueue;
  const decimal = (amount: unknown) => typeof amount === 'string' && /^\d{1,40}(\.\d{1,20})?$/.test(amount);
  return Number.isSafeInteger(queue.pendingCount) && queue.pendingCount >= 0
    && decimal(queue.amountBmt) && decimal(queue.feeBmt);
}

function atomic(value: string | null, decimals: number) {
  if (value === null) return '—';
  if (decimals === 0) return value;
  const digits = value.padStart(decimals + 1, '0');
  const fraction = digits.slice(-decimals).replace(/0+$/, '');
  return digits.slice(0, -decimals) + (fraction ? `.${fraction}` : '');
}
function valid(row: any, support: boolean) {
  const integer = (v: unknown) => typeof v === 'string' && /^(0|[1-9][0-9]{0,29})$/.test(v);
  const decimal = (v: unknown) => typeof v === 'string' && /^\d{1,30}(\.\d{1,20})?$/.test(v);
  const signature = (v: unknown) => v === null || (typeof v === 'string' && /^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(v));
  if (!row || typeof row.id !== 'string' || !Object.prototype.hasOwnProperty.call(statuses, row.status)
    || typeof row.created_at !== 'string' || !Number.isFinite(Date.parse(row.created_at))) return false;
  return support ? integer(row.xmr_atomic) && (row.sol_lamports === null || integer(row.sol_lamports))
    && (row.bmt_atomic === null || integer(row.bmt_atomic)) && Number.isInteger(row.bmt_decimals)
    && row.bmt_decimals >= 0 && row.bmt_decimals <= 18 && signature(row.solana_signature)
    && ['mainnet-beta', 'devnet', 'testnet'].includes(row.cluster)
    : decimal(row.amount) && (row.fee === null || decimal(row.fee))
      && (signature(row.transaction_hash) || (typeof row.transaction_hash === 'string' && /^[0-9a-f]{64}$/.test(row.transaction_hash)));
}

export default async function TransactionsPage({ searchParams }: {
  searchParams: Promise<{ type?: string | string[]; page?: string | string[] }>
}) {
  const query = await searchParams;
  const type = typeof query.type === 'string' && Object.prototype.hasOwnProperty.call(tabs, query.type) ? query.type as keyof typeof tabs : 'xmr';
  const page = typeof query.page === 'string' && /^\d{1,5}$/.test(query.page) ? Math.min(Number(query.page), 10000) : 0;
  const support = type === 'support';

  return <div className="board-page refresh-transactions min-h-screen bg-zinc-950 text-zinc-100">
    <Header />
    <main id="refresh-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-6 lg:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-yellow-400">MineBench / Activity</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Transactions</h1>
      <p className="mt-5 max-w-2xl leading-relaxed text-zinc-400">Follow miner payments and mining-funded BMT purchases, with transaction evidence and processing status.</p>
      <nav aria-label="Transaction categories" className="mt-10 flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        {Object.entries(tabs).map(([key, label]) => <Link key={key} href={`/transactions?type=${key}`} aria-current={type === key ? 'page' : undefined}
          className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${type === key ? 'bg-yellow-400 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>{label}</Link>)}
      </nav>
      <div className="my-6 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-medium">{tabs[type]}</h2><span className="text-xs text-zinc-500">All dates in UTC · Page {page + 1}</span>
      </div>
      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-zinc-400">{support
        ? 'Purchases funded by XMR allocated to BMT mining. Completed purchases appear as confirmed; the BMT market price can still change.'
        : type === 'xmr' ? 'XMR transfers to miner wallets. Reserved and pending payments are not yet confirmed on the network.'
          : 'BMT transfers to MineBench user wallets. Mining balance credits are shown separately on the pool rewards page.'}</p>
      <Suspense key={`${type}:${page}`} fallback={<TransactionsSkeleton />}>
        <TransactionHistory type={type} page={page} />
      </Suspense>
    </main><Footer />
  </div>;
}

async function TransactionHistory({ type, page }: { type: keyof typeof tabs; page: number }) {
  const support = type === 'support';
  let rows: Array<Payment | Purchase> = [];
  let unavailable = false;
  let hasMore = false;
  let queue: PayoutQueue | null = null;
  try {
    const base = (process.env.BACKEND_API_URL || 'https://backend.minebench.cloud').replace(/\/+$/, '');
    const response = await fetch(`${base}/api/${support ? `conversions?page=${page}` : `transactions?type=${type}&page=${page}`}`, {
      cache: 'no-store', signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Unavailable');
    const data = await response.json();
    if (type === 'bmt' && validQueue(data.queue)) queue = data.queue;
    const entries = support ? data.conversions : data.transactions;
    if (!Array.isArray(entries) || entries.length > 25 || !entries.every(row => valid(row, support))) throw new Error('Invalid history');
    rows = entries;
    hasMore = data.hasMore === true;
  } catch { unavailable = true; }

  const batches = queue && validBatches(queue.batches, queue.pendingCount) ? queue.batches : null;

  return <>
      {type === 'bmt' && <section aria-labelledby="payout-queue-title" className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="payout-queue-title" className="text-lg font-medium">BMT payout queue</h2>
            <p className="mt-2 text-sm text-zinc-400">Network-wide totals across all wallets, independent of the history page below.</p>
          </div>
          <TransactionsRefresh />
        </div>
        {queue ? <>
          <dl aria-live="polite" aria-atomic="true" className="mt-6 grid gap-5 sm:grid-cols-3">
            <div><dt className="text-xs text-zinc-400">Pending payouts</dt><dd className="mt-2 text-2xl font-medium tabular-nums text-yellow-400">{queue.pendingCount.toLocaleString('en-US')}</dd></div>
            <div className="min-w-0"><dt className="text-xs text-zinc-400">Estimated amount to wallets</dt><dd className="mt-2 break-words text-xl font-medium tabular-nums">{queue.amountBmt} BMT</dd></div>
            <div className="min-w-0"><dt className="text-xs text-zinc-400">Estimated total fees</dt><dd className="mt-2 break-words text-xl font-medium tabular-nums">{queue.feeBmt} BMT</dd></div>
          </dl>
          <p className="mt-5 text-sm text-zinc-400">{queue.pendingCount === 0
            ? 'No BMT payouts are currently queued.'
            : 'Payouts are sent in batches. Pending amounts and fees are estimates until the payouts are confirmed.'}</p>
        </> : <p role="status" className="mt-5 text-sm text-amber-200">Queue totals are temporarily unavailable. Use Refresh payouts to try again.</p>}
        <div className="mt-6 grid gap-4 md:grid-cols-2" aria-live="polite">
          <BatchProgress label="Standard queue" batch={batches?.existing_ata ?? null} />
          <BatchProgress label="Account-creation queue" batch={batches?.missing_ata ?? null} />
        </div>
        <div className="mt-6 grid gap-5 border-t border-zinc-800 pt-6 text-sm leading-relaxed text-zinc-400 md:grid-cols-2">
          <p><strong className="font-medium text-zinc-100">Standard batch.</strong>{' '}Payouts to wallets that already have a BMT token account wait until their batch reaches the target shown above. Sending them together shares the transaction network fee across the batch. Each bar shows the next batch for that queue across all wallets. The client shows the batch containing your payout, while the pending total includes both queue types.</p>
          <p><strong className="font-medium text-zinc-100">Account-creation batch.</strong>{' '}Payouts that need a BMT token account wait until their separate batch reaches its target. Creating the account adds instructions and requires a SOL rent deposit, so this queue has its own batch target to accommodate Solana transaction-size limits. These requests do not fill a standard batch; each full batch can be processed once funding and transaction checks pass.</p>
        </div>
      </section>}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/30">
        {unavailable ? <div role="alert" className="p-8 text-amber-200">Transaction history is temporarily unavailable. <Link href={`/transactions?type=${type}&page=${page}`} className="underline">Try again</Link></div>
          : rows.length === 0 ? <p className="p-10 text-zinc-400">No transactions recorded on this page.</p>
            : <table className="w-full text-left text-sm">
              <caption className="sr-only">{tabs[type]}</caption>
              <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500"><tr>
                {(support ? ['Date', 'Status', 'XMR allocated', 'SOL received', 'BMT purchased', 'Transaction'] : ['Date', 'Status', `Amount (${type.toUpperCase()})`, `Fee (${type.toUpperCase()})`, 'Transaction']).map(label => <th key={label} scope="col" className="whitespace-nowrap p-4 font-medium">{label}</th>)}
              </tr></thead>
              <tbody>{rows.map(row => {
                const purchase = row as Purchase;
                const payment = row as Payment;
                const hash = support ? purchase.solana_signature : payment.transaction_hash;
                // BMT legacy records do not persist their cluster: show the hash without guessing an explorer network.
                const href = support && hash ? `https://explorer.solana.com/tx/${hash}${purchase.cluster === 'mainnet-beta' ? '' : `?cluster=${purchase.cluster}`}` : null;
                return <tr key={row.id} className="border-b border-zinc-800 last:border-0">
                  <td className="whitespace-nowrap p-4 text-zinc-400">{new Date(row.created_at).toISOString().slice(0, 16).replace('T', ' ')}</td>
                  <td className="p-4"><span className={['confirmed', 'completed'].includes(row.status) ? 'text-emerald-400' : type === 'bmt' && row.status === 'pending' ? 'text-yellow-400' : 'text-zinc-300'}>{type === 'bmt' && row.status === 'pending' ? hash ? 'Awaiting confirmation' : 'Queued' : statuses[row.status]}</span>{type === 'bmt' && row.status === 'pending' && <span className="mt-1 block text-xs text-zinc-400">Amount and fee estimated</span>}{support && purchase.cluster !== 'mainnet-beta' && <span className="block text-xs text-amber-300">{purchase.cluster}</span>}</td>
                  {support ? <><td className="p-4 tabular-nums">{atomic(purchase.xmr_atomic, 12)}</td><td className="p-4 tabular-nums">{atomic(purchase.sol_lamports, 9)}</td><td className="p-4 tabular-nums">{atomic(purchase.bmt_atomic, purchase.bmt_decimals)}</td></>
                    : <><td className="p-4 tabular-nums">{payment.amount}</td><td className="p-4 tabular-nums">{payment.fee ?? '—'}</td></>}
                  <td className="p-4">{hash ? href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline">View transaction ↗</a>
                    : <details><summary className="cursor-pointer font-mono text-xs text-yellow-400">{hash.slice(0, 8)}…{hash.slice(-6)}</summary><code className="mt-2 block max-w-56 break-all text-xs text-zinc-400">{hash}</code></details> : <span className="text-zinc-500">Not submitted</span>}</td>
                </tr>;
              })}</tbody>
            </table>}
      </div>
      <nav aria-label="Transaction history pages" className="mt-6 flex gap-6 text-sm text-zinc-300">
        {page > 0 && <Link href={`/transactions?type=${type}&page=${page - 1}`} className="underline">Previous</Link>}
        {!unavailable && hasMore && page < 10000 && <Link href={`/transactions?type=${type}&page=${page + 1}`} className="underline">Next</Link>}
      </nav>
  </>;
}
