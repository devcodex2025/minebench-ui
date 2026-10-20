'use client';
import dynamic from 'next/dynamic';

const WalletLogin = dynamic(() => import('./AccountWalletLogin'), {
  ssr: false,
  loading: () => <p role="status">Loading wallet controls…</p>
});
const PasskeyLogin = dynamic(() => import('./AccountPasskeyLogin'), {
  loading: () => <p role="status">Loading passkey controls…</p>
});
export default function AccountLoginGate() {
  return <div className="space-y-6">
    <PasskeyLogin />
    <div className="flex items-center gap-4 text-xs uppercase tracking-wider text-zinc-500" aria-hidden="true">
      <span className="h-px flex-1 bg-zinc-800" />
      <span>or use a Solana wallet</span>
      <span className="h-px flex-1 bg-zinc-800" />
    </div>
    <WalletLogin />
  </div>;
}
