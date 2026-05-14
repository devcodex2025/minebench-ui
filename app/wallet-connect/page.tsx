'use client';

import { Suspense, useRef } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@solana/wallet-adapter-react-ui/styles.css';

const WalletConnectContent = () => {
  const searchParams = useSearchParams();
  const { publicKey, signMessage, connected } = useWallet();
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  
  // Use ref to prevent duplicate authentication attempts
  const authAttemptedRef = useRef(false);

  useEffect(() => {
    // Get callback URL from query params
    const url = searchParams?.get('callbackUrl');
    console.log('[WalletConnect] Callback URL from params:', url);
    console.log('[WalletConnect] Wallet connected:', connected);
    console.log('[WalletConnect] Public key:', publicKey?.toBase58());
    if (url) {
      setCallbackUrl(url);
    }
  }, [searchParams, connected, publicKey]);

  useEffect(() => {
    // Only execute if we haven't already succeeded or attempted
    if (success || authAttemptedRef.current) {
      console.log('[WalletConnect] Already authenticated or attempt in progress, skipping');
      return;
    }

    const handleWalletConnection = async () => {
      console.log('[WalletConnect] Checking connection:', { 
        publicKey: !!publicKey, 
        callbackUrl: !!callbackUrl, 
        isProcessing,
        success,
        signMessage: !!signMessage 
      });
      
      // Only process if we have all required data
      if (publicKey && callbackUrl && signMessage && !isProcessing) {
        // Mark that we're attempting authentication
        authAttemptedRef.current = true;
        setIsProcessing(true);
        try {
          console.log('[WalletConnect] Starting authentication...');
          
          // Create message to sign with unique timestamp to prevent replay
          const timestamp = Date.now();
          const message = new TextEncoder().encode(
            `MineBench Wallet Authentication\nTimestamp: ${timestamp}\nPublic Key: ${publicKey.toBase58()}`
          );
          
          console.log('[WalletConnect] Requesting signature from wallet...');
          // Request signature from wallet
          const signature = await signMessage(message);
          
          console.log('[WalletConnect] Got signature, converting to base64...');
          // Convert signature to base64
          const signatureB64 = Buffer.from(signature).toString('base64');
          
          // Send data to Electron callback
          const redirectUrl = new URL(callbackUrl);
          redirectUrl.searchParams.set('publicKey', publicKey.toBase58());
          redirectUrl.searchParams.set('signature', signatureB64);
          redirectUrl.searchParams.set('message', new TextDecoder().decode(message));
          
          console.log('[WalletConnect] Sending callback to:', redirectUrl.toString());
          const response = await fetch(redirectUrl.toString(), {
              method: 'GET',
              mode: 'no-cors' // Allow request to local server without strict CORS
          });
          
          console.log('[WalletConnect] Callback sent successfully');

          // Show success state and start countdown
          setSuccess(true);
          setIsProcessing(false);
          setCountdown(5);
        } catch (err: any) {
          console.error('[WalletConnect] Error during authentication:', err);
          setError(err.message || 'Authentication failed');
          setIsProcessing(false);
          // Reset the attempt flag if there was an error
          authAttemptedRef.current = false;
        }
      }
    };

    handleWalletConnection();
  }, [publicKey, callbackUrl, signMessage]);

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
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <div className="bg-zinc-950 border border-zinc-800 p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Connect Phantom</h2>
              <p className="text-zinc-500 font-mono">Authenticate your mining wallet</p>
            </div>

            {!publicKey ? (
              <>
                <div className="bg-zinc-900 border border-zinc-800 p-4">
                  <p className="text-sm text-zinc-400 font-mono leading-relaxed">
                    Click the button below to connect your Phantom wallet and authenticate with MineBench.
                  </p>
                </div>

                <div className="flex justify-center">
                  <WalletMultiButton 
                    className="!bg-yellow-400 hover:!bg-yellow-500 !text-black !font-bold !uppercase !tracking-wide !transition-all !duration-200" 
                  />
                </div>

                <div className="text-center text-xs text-zinc-500 space-y-1 font-mono">
                  <p className="font-semibold text-yellow-400 uppercase tracking-wider">PHANTOM WALLET</p>
                  <p className="text-zinc-600">Required for MineBench mining</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4">
                    <p className="text-sm text-red-400 font-mono">{error}</p>
                  </div>
                )}
              </>
            ) : success ? (
              // Success state - show within the same styled container
              <div className={`transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
                <div className="bg-zinc-900 border-2 border-yellow-400 p-6">
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
                  <p className="text-xs text-zinc-400 text-center font-mono break-all bg-black border border-zinc-800 p-3 rounded">
                    {publicKey.toBase58()}
                  </p>
                </div>
              </div>
            ) : (
              // Processing state - waiting for signature
              <>
                <div className="bg-zinc-900 border border-zinc-800 p-6">
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
                  <p className="text-xs text-zinc-400 text-center mt-4 font-mono break-all bg-black border border-zinc-800 p-3 rounded">
                    {publicKey.toBase58()}
                  </p>
                </div>

                {isProcessing && (
                  <div className="bg-zinc-900 border border-zinc-800 p-4">
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
                  <div className="bg-red-500/10 border border-red-500/20 p-4">
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-yellow-400 font-mono">Loading...</div>
      </div>
    }>
      <WalletConnectContent />
    </Suspense>
  );
}
