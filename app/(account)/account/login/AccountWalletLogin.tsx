'use client';
import { useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { authenticateAccountWallet } from '@/lib/accountWalletAuth';

export default function AccountWalletLogin() {
  const { publicKey, signMessage } = useWallet();
  const wallet = publicKey?.toBase58();
  const current = useRef(wallet); current.current = wallet;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function login() {
    if (!wallet || !signMessage || busy) return;
    const expected = wallet;
    const assertWallet = () => { if (current.current !== expected) throw new Error('Wallet changed. Sign in again.'); };
    setBusy(true); setError('');
    try {
      const token = await authenticateAccountWallet(expected, signMessage, fetch, assertWallet);
      assertWallet();
      const response = await fetch('/api/account/session', { method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }), signal: AbortSignal.timeout(10000) });
      assertWallet();
      if (!response.ok || (await response.json()).valid !== true) throw new Error('Account verification is unavailable. Try signing in again.');
      if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel('minebench-account'); channel.postMessage('changed'); channel.close(); }
      try { window.localStorage.setItem('minebench:account-change', String(Date.now())); } catch { /* No credentials are persisted. */ }
      window.location.replace('/account');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Sign-in failed. Try again.'); setBusy(false); }
  }
  return <div className="space-y-5 rounded-xl border border-zinc-800 p-6">
    <WalletMultiButton />
    <button type="button" disabled={busy || !wallet || !signMessage} className="btn-primary" onClick={login}>
      {busy ? 'Verifying account…' : 'Sign in to your account'}
    </button>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </div>;
}
