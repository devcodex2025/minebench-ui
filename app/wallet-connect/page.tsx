'use client';

import { Suspense, useCallback, useRef } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toBase58: () => string };
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>;
  signMessage: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array } | Uint8Array>;
};

const getPhantomProvider = (): PhantomProvider | null => {
  if (typeof window === 'undefined') return null;
  const solana = (window as any).solana as PhantomProvider | undefined;
  return solana?.isPhantom ? solana : null;
};

const WalletConnectContent = () => {
  const searchParams = useSearchParams();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [phantomDetected, setPhantomDetected] = useState(false);
  
  // Use ref to prevent duplicate authentication attempts
  const authAttemptedRef = useRef(false);

  useEffect(() => {
    let attempts = 0;
    const detect = () => {
      const found = !!getPhantomProvider();
      setPhantomDetected(found);
      attempts += 1;
      if (!found && attempts < 20) {
        window.setTimeout(detect, 250);
      }
    };
    detect();
  }, []);

  useEffect(() => {
    // Get callback URL from query params
    const url = searchParams?.get('callbackUrl');
    console.log('[WalletConnect] Callback URL from params:', url);
    if (url) {
      setCallbackUrl(url);
    }
  }, [searchParams]);

  const authenticateWallet = useCallback(async (
    publicKeyText: string,
    sign: (message: Uint8Array) => Promise<Uint8Array | { signature: Uint8Array }>
  ) => {
    if (!callbackUrl || success || authAttemptedRef.current || isProcessing) return;

    authAttemptedRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      console.log('[WalletConnect] Starting authentication...');
      const timestamp = Date.now();
      const message = new TextEncoder().encode(
        `MineBench Wallet Authentication\nTimestamp: ${timestamp}\nPublic Key: ${publicKeyText}`
      );

      console.log('[WalletConnect] Requesting signature from wallet...');
      const signed = await sign(message);
      const signature = signed instanceof Uint8Array ? signed : signed.signature;
      const signatureB64 = Buffer.from(signature).toString('base64');

      const redirectUrl = new URL(callbackUrl);
      redirectUrl.searchParams.set('publicKey', publicKeyText);
      redirectUrl.searchParams.set('signature', signatureB64);
      redirectUrl.searchParams.set('message', new TextDecoder().decode(message));

      console.log('[WalletConnect] Sending callback to:', redirectUrl.toString());
      await fetch(redirectUrl.toString(), {
        method: 'GET',
        mode: 'no-cors'
      });

      setSuccess(true);
      setCountdown(5);
    } catch (err: any) {
      console.error('[WalletConnect] Error during authentication:', err);
      setError(err.message || 'Authentication failed');
      authAttemptedRef.current = false;
    } finally {
      setIsProcessing(false);
    }
  }, [callbackUrl, isProcessing, success]);

  const connectPhantomDirectly = useCallback(async () => {
    const provider = getPhantomProvider();
    if (!provider) {
      setError('Phantom extension was not detected in this browser. Open this page in the Chrome profile where Phantom is installed.');
      return;
    }

    const result = await provider.connect();
    const publicKeyText = result.publicKey.toBase58();
    setPublicKey(publicKeyText);
    await authenticateWallet(publicKeyText, (message) => provider.signMessage(message, 'utf8'));
  }, [authenticateWallet]);

  // Countdown timer after success
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Start fade out animation
      setFadeOut(true);
      // Close window after fade out
      setTimeout(() => {
        window.close();
      }, 500); // Match fade duration
    }
  }, [countdown]);

  return (
    <div className="board-page refresh-wallet min-h-screen flex flex-col bg-black">
      <Header />
      
      {/* Main content */}
      <main id="refresh-content" tabIndex={-1} className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Connect Phantom</h2>
              <p className="text-zinc-500 font-mono">Authenticate your mining wallet</p>
            </div>

            {!publicKey ? (
              <>
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                  <p className="text-sm text-zinc-400 font-mono leading-relaxed">
                    Click the button below to connect your Phantom wallet and authenticate with MineBench.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={connectPhantomDirectly}
                    disabled={isProcessing}
                    className="rounded-xl bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold uppercase tracking-wide px-5 py-3"
                  >
                    {phantomDetected ? 'Connect Phantom' : 'Detecting Phantom...'}
                  </button>
                </div>

                <div className="text-center text-xs text-zinc-500 space-y-1 font-mono">
                  <p className="font-semibold text-yellow-400 uppercase tracking-wider">PHANTOM WALLET</p>
                  <p className="text-zinc-600">Required for MineBench mining</p>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                    <p className="text-sm text-red-400 font-mono">{error}</p>
                  </div>
                )}
              </>
            ) : success ? (
              // Success state - show within the same styled container
              <div className={`transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
                <div className="rounded-2xl bg-zinc-900 border border-yellow-400 p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-yellow-400 rounded-full p-2">
                      <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl text-yellow-400 text-center font-bold uppercase tracking-wider mb-4">
                    Wallet Connected
                  </p>
                  <p className="text-sm text-zinc-300 text-center mb-4">
                    {countdown !== null && countdown > 0 
                      ? `Closing in ${countdown}s...` 
                      : 'You can close this window now.'}
                  </p>
                  <p className="text-xs text-zinc-400 text-center font-mono break-all bg-black border border-zinc-800 p-3 rounded-lg">
                    {publicKey}
                  </p>
                </div>
              </div>
            ) : (
              // Processing state - waiting for signature
              <>
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-yellow-400/20 rounded-full p-2">
                      <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xl text-yellow-400 text-center font-bold uppercase tracking-wider mb-2">
                    Wallet Connection
                  </p>
                  <p className="text-xs text-zinc-400 text-center mt-4 font-mono break-all bg-black border border-zinc-800 p-3 rounded-lg">
                    {publicKey}
                  </p>
                </div>

                {isProcessing && (
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-yellow-400 font-mono">AUTHENTICATING...</span>
                    </div>
                  </div>
                )}

                {!callbackUrl && !isProcessing && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                    <p className="text-sm text-red-400 text-center font-mono">
                      Error: No callback URL provided. Please restart from MineBench app.
                    </p>
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
