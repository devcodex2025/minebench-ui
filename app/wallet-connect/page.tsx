'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Any Wallet Standard wallet (Phantom, Solflare, Backpack, Glow, Magic Eden, ...)
// is discovered automatically by @solana/wallet-adapter-react; no per-wallet code.
const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.minebench.cloud').replace(/\/+$/, '');

interface LoginNonce {
  nonce: string;
  message: string;
  issuedAt: string;
  expiresAt: string;
}

const fetchLoginNonce = async (walletAddress: string): Promise<LoginNonce> => {
  const response = await fetch(
    `${BACKEND_URL}/api/auth/nonce?walletAddress=${encodeURIComponent(walletAddress)}`,
    { cache: 'no-store' }
  );
  if (!response.ok) throw new Error(`Could not start authentication (${response.status})`);
  return response.json() as Promise<LoginNonce>;
};

const WalletConnectContent = () => {
  const searchParams = useSearchParams();
  const { publicKey, connected, signMessage, wallet } = useWallet();
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  // Prevent duplicate authentication attempts.
  const authAttemptedRef = useRef(false);

  useEffect(() => {
    const url = searchParams?.get('callbackUrl');
    if (url) setCallbackUrl(url);
  }, [searchParams]);

  const authenticateWallet = useCallback(async () => {
    if (!callbackUrl || !publicKey || !signMessage || success || authAttemptedRef.current) return;

    authAttemptedRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      const walletAddress = publicKey.toBase58();
      // Server-issued single-use nonce; sign the exact server message.
      const nonce = await fetchLoginNonce(walletAddress);
      const signed = await signMessage(new TextEncoder().encode(nonce.message));
      if (!signed) throw new Error('Wallet did not return a signature');
      const signatureB64 = Buffer.from(signed).toString('base64');

      // POST the signed payload so it never appears in the URL/history/logs; only
      // the CSRF `state` stays in the callback query.
      await fetch(callbackUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          publicKey: walletAddress,
          signature: signatureB64,
          message: nonce.message
        })
      });

      setSuccess(true);
      setCountdown(5);
    } catch (err: any) {
      console.error('[WalletConnect] Error during authentication:', err);
      setError(err?.message || 'Authentication failed');
      authAttemptedRef.current = false;
    } finally {
      setIsProcessing(false);
    }
  }, [callbackUrl, publicKey, signMessage, success]);

  useEffect(() => {
    if (connected && publicKey && signMessage) {
      void authenticateWallet();
    }
  }, [connected, publicKey, signMessage, authenticateWallet]);

  // Countdown timer after success
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setFadeOut(true);
      setTimeout(() => {
        try { window.close(); } catch { /* ignore */ }
      }, 500);
    }
  }, [countdown]);

  return (
    <div className="board-page refresh-wallet min-h-screen flex flex-col bg-black">
      <Header />

      <main id="refresh-content" tabIndex={-1} className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Connect Wallet</h2>
              <p className="text-zinc-500 font-mono">Authenticate your mining wallet</p>
            </div>

            {success ? (
              <div className={`transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
                <div className="rounded-2xl bg-zinc-900 border border-yellow-400 p-6">
                  <p className="text-2xl text-yellow-400 text-center font-bold uppercase tracking-wider mb-4">
                    Wallet Connected
                  </p>
                  <p className="text-sm text-zinc-300 text-center mb-4">
                    {countdown !== null && countdown > 0
                      ? `Closing in ${countdown}s...`
                      : 'You can close this window now.'}
                  </p>
                  <p className="text-xs text-zinc-400 text-center font-mono break-all bg-black border border-zinc-800 p-3 rounded-lg">
                    {publicKey?.toBase58()}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                  <p className="text-sm text-zinc-400 font-mono leading-relaxed">
                    Select your Solana wallet to authenticate with MineBench. Phantom, Solflare, Backpack,
                    Glow, Magic Eden and other Wallet Standard wallets are supported.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <WalletMultiButton />
                </div>

                {isProcessing && (
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                    <p className="text-sm text-yellow-400 font-mono text-center">
                      AUTHENTICATING{wallet?.adapter?.name ? ` WITH ${wallet.adapter.name.toUpperCase()}` : '...'}
                    </p>
                  </div>
                )}

                {!callbackUrl && !isProcessing && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                    <p className="text-sm text-red-400 text-center font-mono">
                      Error: No callback URL provided. Please restart from MineBench app.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                    <p className="text-sm text-red-400 font-mono">{error}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-900">
            <p className="text-xs text-zinc-600 text-center font-mono uppercase tracking-wide">
              Authenticating with MineBench...
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default function WalletConnectPage() {
  return (
    <Suspense fallback={
      <div className="board-page refresh-wallet min-h-screen flex items-center justify-center bg-black">
        <div className="text-yellow-400 font-mono">Loading...</div>
      </div>
    }>
      <WalletConnectContent />
    </Suspense>
  );
}
