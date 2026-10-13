import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { formatBmtAmount } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Mining-funded BMT purchases | MineBench',
  description: 'Track XMR → USDT → SOL on MEXC, then native SOL → BMT on Solana. BMT rewards are credited only after confirmed treasury receipt.',
  alternates: { canonical: 'https://minebench.cloud/conversions' }
};

type Receipt = {
  id: string; status: string; xmr_atomic: string; sol_lamports: string | null;
  bmt_atomic: string | null; bmt_decimals: number; solana_signature: string | null;
  cluster: string; accounting_commitment: string; created_at: string;
  residual_xmr?: string | null; residual_usdt?: string | null; residual_sol?: string | null; residual_wsol_lamports?: string | null;
};
const labels: Record<string, string> = {
  pending: 'Awaiting exchange', exchanging: 'XMR → USDT → SOL', buying_bmt: 'Buying BMT',
  confirmed: 'Confirmed', refunded: 'Refunded', reconciliation_required: 'Under review'
};

function amount(value: string | null, decimals: number) {
  if (value === null) return '—';
  const padded = value.padStart(decimals + 1, '0');
  if (decimals === 0) return padded;
  const fraction = padded.slice(-decimals).replace(/0+$/, '');
  return padded.slice(0, -decimals) + (fraction ? `.${fraction}` : '');
}

function isReceipt(value: unknown): value is Receipt {
  if (!value || typeof value !== 'object') return false;
  const row = value as Receipt;
  const units = (v: unknown) => typeof v === 'string' && /^(0|[1-9][0-9]{0,29})$/.test(v);
  return typeof row.id === 'string' && typeof row.status === 'string'
    && Object.prototype.hasOwnProperty.call(labels, row.status)
    && units(row.xmr_atomic) && (row.sol_lamports === null || units(row.sol_lamports))
    && (row.bmt_atomic === null || units(row.bmt_atomic))
    && Number.isInteger(row.bmt_decimals) && row.bmt_decimals >= 0 && row.bmt_decimals <= 18
    && ['mainnet-beta', 'devnet', 'testnet'].includes(row.cluster)
    && (row.solana_signature === null || /^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(row.solana_signature))
    && typeof row.accounting_commitment === 'string' && /^[0-9a-f]{64}$/.test(row.accounting_commitment)
    && [row.residual_xmr, row.residual_usdt, row.residual_sol].every(v => v == null || (typeof v === 'string' && /^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(v)))
    && (row.residual_wsol_lamports == null || units(row.residual_wsol_lamports))
    && typeof row.created_at === 'string' && Number.isFinite(Date.parse(row.created_at));
}

export default async function ConversionsPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const query = await searchParams;
  const rawPage = typeof query.page === 'string' ? query.page : '0';
  const page = /^\d{1,5}$/.test(rawPage) ? Math.min(Number(rawPage), 10000) : 0;
  let receipts: Receipt[] = [];
  let hasMore = false;
  let unavailable = false;
  try {
    const base = (process.env.BACKEND_API_URL || 'https://backend.minebench.cloud').replace(/\/+$/, '');
    const response = await fetch(`${base}/api/conversions?page=${page}`, {
      cache: 'no-store', signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Unavailable');
    const data = await response.json();
    if (!Array.isArray(data.conversions) || !data.conversions.every(isReceipt)) throw new Error('Invalid history');
    receipts = data.conversions;
    hasMore = data.hasMore === true;
  } catch {
    unavailable = true;
  }

  return <div className="board-page refresh-conversions min-h-screen bg-zinc-950 text-zinc-100">
    <Header />
    <main id="refresh-content" tabIndex={-1} className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <Link href="/pool-rewards" className="text-sm text-zinc-400 hover:text-white">← Pool rewards</Link>
      <p className="mt-10 text-sm uppercase tracking-widest text-emerald-400">Treasury activity</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Mining-funded BMT purchases</h1>
      <p className="mt-5 max-w-2xl leading-relaxed text-zinc-400">
        Follow mining-funded BMT purchases: XMR → USDT → SOL on MEXC, then native SOL → BMT
        on Solana. USDT stays inside the exchange. BMT rewards are credited only after
        the purchase and confirmed receipt of the purchased BMT by the treasury. Individual miner wallets
        are kept private.
      </p>
      <div className="mt-6 max-w-3xl space-y-3 text-sm leading-relaxed text-zinc-400">
        <p>The conversion threshold is the exchange’s minimum for the first order (XMR → USDT) plus 20%. This buffer applies only to that first order.
          SOL trading and withdrawal requirements, fees, and available liquidity are checked separately.
          Amounts below the required threshold remain pending.</p>
        <p>Mining revenue funds BMT purchases; it does not guarantee a fixed token price
          or a right to redeem BMT for XMR. Exchange custody applies during the MEXC steps.</p>
        <p>Treasury: <a className="break-all text-emerald-400 underline" href="https://explorer.solana.com/address/BmTy7pxPKk3YgGchEQidnuhEuor2SNx9YUQ5RAKzqtRe" target="_blank" rel="noopener noreferrer">BmTy7pxPKk3YgGchEQidnuhEuor2SNx9YUQ5RAKzqtRe</a></p>
        <p>BMT mint: <a className="break-all text-emerald-400 underline" href="https://explorer.solana.com/address/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev" target="_blank" rel="noopener noreferrer">67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev</a></p>
      </div>
      <div className="mt-12 overflow-x-auto rounded-xl border border-zinc-800">
        {unavailable ? <p role="alert" className="p-8 text-amber-200">Conversion history is temporarily unavailable. Please reload to try again.</p>
          : receipts.length === 0 ? <p className="p-8 text-zinc-400">No conversions recorded on this page.</p>
            : <table className="w-full text-left text-sm">
              <caption className="sr-only">Mining-funded conversion history</caption>
              <thead className="border-b border-zinc-800 text-zinc-400"><tr>
                {['Date (UTC)', 'Status', 'XMR assigned', 'SOL received', 'BMT acquired', 'Evidence'].map((title) => <th key={title} scope="col" className="whitespace-nowrap p-4 font-medium">{title}</th>)}
              </tr></thead>
              <tbody>{receipts.map((row) => <tr key={row.id} className="border-b border-zinc-800 last:border-0">
                <td className="whitespace-nowrap p-4">{new Date(row.created_at).toISOString().slice(0, 16).replace('T', ' ')}</td>
                <td className="p-4">{labels[row.status]}{row.cluster !== 'mainnet-beta' && <span className="block text-amber-300">{row.cluster}</span>}</td>
                <td className="p-4 tabular-nums">{amount(row.xmr_atomic, 12)}</td>
                <td className="p-4 tabular-nums">{amount(row.sol_lamports, 9)}</td>
                <td className="p-4 tabular-nums">{formatBmtAmount(amount(row.bmt_atomic, row.bmt_decimals))}</td>
                <td className="p-4">{row.solana_signature && <a className="text-emerald-400 underline" href={`https://explorer.solana.com/tx/${row.solana_signature}${row.cluster === 'mainnet-beta' ? '' : `?cluster=${row.cluster}`}`} target="_blank" rel="noopener noreferrer">Solana transaction</a>}
                  {(row.residual_xmr != null || row.residual_usdt != null || row.residual_sol != null || row.residual_wsol_lamports != null) && <details className="mt-2 text-zinc-400">
                    <summary className="cursor-pointer">Unconverted balances</summary>
                    <p className="mt-2">{row.residual_xmr ?? '0'} XMR · {row.residual_usdt ?? '0'} USDT · {row.residual_sol ?? '0'} SOL</p>
                    {row.residual_wsol_lamports != null && <p className="mt-1">{amount(row.residual_wsol_lamports, 9)} WSOL held in the conversion wallet</p>}
                    <p className="mt-1 max-w-64 text-xs">These balances remain assigned to the original mining contributions and are not credited as BMT.</p>
                  </details>}
                  <details className="mt-2 text-zinc-400"><summary className="cursor-pointer">Accounting commitment</summary><code className="mt-2 block max-w-48 break-all text-xs">{row.accounting_commitment}</code></details>
                </td>
              </tr>)}</tbody>
            </table>}
      </div>
      <nav aria-label="Conversion history pages" className="mt-6 flex gap-6 text-sm">
        {page > 0 && <Link href={`/conversions?page=${page - 1}`} className="underline">Previous</Link>}
        {!unavailable && hasMore && <Link href={`/conversions?page=${page + 1}`} className="underline">Next</Link>}
      </nav>
    </main>
    <Footer />
  </div>;
}
