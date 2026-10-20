import { notFound } from 'next/navigation';
import Link from 'next/link';
import { accountEnabled } from '@/lib/accountServer';
import AccountLoginGate from './AccountLoginGate';

export default function AccountLoginPage() {
  if (!accountEnabled()) notFound();
  return <main className="min-h-[100dvh] bg-zinc-950 px-4 py-12 text-zinc-100">
    <div className="mx-auto max-w-xl space-y-8">
      <Link href="/" className="text-sm text-zinc-400 underline underline-offset-4">MineBench</Link>
      <div><p className="text-sm text-yellow-300">Private miner account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your mining, in one place</h1>
        <p className="mt-4 leading-7 text-zinc-400">Use a passkey or sign the MineBench authentication message with your Solana wallet to view your own history. Account statistics are free. No transaction or Premium purchase is required.</p></div>
      <AccountLoginGate />
      <p className="text-sm leading-6 text-zinc-400">Direct and Premium XMR miners can create an account with a passkey. A scoped worker password links future verified work and its account-allocated XMR records. A Monero spend-key proof can also bind a supported self-custody address. Neither method grants another miner’s history. Never share a seed, spend key, or view key.</p>
      <Link href="/dashboard" className="inline-block text-sm text-zinc-400 underline underline-offset-4">View public benchmarks</Link>
    </div>
  </main>;
}
