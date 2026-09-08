'use client';

import FadeContent from '@/components/reactbits/FadeContent';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  PublicKey, 
  Transaction
} from '@solana/web3.js';
import { 
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PREMIUM_PRICE_USDC, PREMIUM_FAQS } from '@/lib/marketing';
import { trackMarketingEvent } from '@/lib/marketingAnalytics';
import { supabase } from '../../lib/supabaseClient';
import { Check, Zap, Wallet, ArrowRight } from 'lucide-react';
import { BorderBeam } from 'border-beam';

const USDC_MINT = new PublicKey('EPjFW36vc7J741696u75Rqd6j5uv69eeMT1p8rkAKz2w');
const TREASURY_WALLET = new PublicKey('kUMEKAPv1rd2TtnxsJrTvtZ6LDdjK7bmKFF8HzwYi95'); // User's treasury wallet

const PREMIUM_FEATURES = [
  {
    title: 'Custom XMR Wallet',
    desc: 'Direct payouts to your own Monero wallet.',
    icon: <Wallet className="w-5 h-5 text-yellow-400" />
  },
  {
    title: 'P2Pool & Custom Stratum',
    desc: 'Use P2Pool or point to a custom pool endpoint.',
    icon: <Zap className="w-5 h-5 text-yellow-400" />
  }
] as const;

export default function PremiumPage() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [xmrWallet, setXmrWallet] = useState('');
  const [userPremiumStatus, setUserPremiumStatus] = useState(false);

  const checkPremiumStatus = useCallback(async () => {
    const { data } = await supabase
      .from('users')
      .select('is_premium, xmr_wallet')
      .eq('solana_wallet', publicKey?.toBase58())
      .single();
    
    if (data) {
      setUserPremiumStatus(data.is_premium);
      if (data.xmr_wallet) setXmrWallet(data.xmr_wallet);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      checkPremiumStatus();
    }
  }, [connected, publicKey, checkPremiumStatus]);

  async function handlePurchase() {
    if (!publicKey || !connected) {
      setError('Please connect your wallet first');
      return;
    }

    trackMarketingEvent('premium_checkout_started');
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Check balance before transaction
      const balance = await connection.getBalance(publicKey);
      const minRequired = 0.005 * 1000000000; // 0.005 SOL for fees
      
      if (balance < minRequired) {
        throw new Error(`Insufficient SOL balance. You need at least 0.005 SOL for transaction fees. Current balance: ${(balance / 1000000000).toFixed(4)} SOL`);
      }

      // 2. Check USDC token account and balance
      const fromAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      let usdcBalance = 0;
      
      try {
        const tokenAccount = await getAccount(connection, fromAta);
        usdcBalance = Number(tokenAccount.amount) / 1000000; // USDC has 6 decimals
      } catch (e) {
        // Token account doesn't exist
        throw new Error('USDC token account not found. Please ensure you have USDC in your wallet.');
      }

      if (usdcBalance < PREMIUM_PRICE_USDC) {
        throw new Error(`Insufficient USDC balance. Required: ${PREMIUM_PRICE_USDC} USDC, Available: ${usdcBalance.toFixed(2)} USDC`);
      }

      const toAta = await getAssociatedTokenAddress(USDC_MINT, TREASURY_WALLET);

      // 3. Create transaction
      const transaction = new Transaction();

      // Check if destination ATA exists, if not add create instruction
      try {
        await getAccount(connection, toAta);
      } catch (e) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            toAta,
            TREASURY_WALLET,
            USDC_MINT
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          fromAta,
          toAta,
          publicKey,
          PREMIUM_PRICE_USDC * 1000000
        )
      );

      // 4. Send transaction with timeout and better error handling
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation with timeout
      const confirmation = await Promise.race([
        connection.confirmTransaction(signature, 'confirmed'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction confirmation timeout. Please check your wallet or Solana Explorer.')), 60000)
        )
      ]);

      // 5. Update Database
      const { error: dbError } = await supabase
        .from('users')
        .upsert({ 
          solana_wallet: publicKey.toBase58(), 
          is_premium: true
        });

      if (dbError) throw dbError;

      setSuccess(true);
      setUserPremiumStatus(true);
    } catch (err: any) {
      console.error('Purchase error:', err);
      
      // Better error messages for common errors
      let errorMessage = err.message || 'Transaction failed';
      
      if (errorMessage.includes('Blockhash not found')) {
        errorMessage = 'Network congestion. Please try again in a few seconds.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL for transaction fees.';
      } else if (errorMessage.includes('Transaction was not confirmed')) {
        errorMessage = 'Transaction pending. Check Solana Explorer: ' + (err.signature || '');
      } else if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user.';
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUpdateWallet() {
    if (!publicKey) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ xmr_wallet: xmrWallet })
        .eq('solana_wallet', publicKey.toBase58());
      
      if (error) throw error;
      alert('Monero wallet updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="board-page min-h-screen bg-black text-white flex flex-col">
      <Header />
      <main className="flex-grow pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-400">
          <Link href="/" className="hover:text-yellow-400">Home</Link><span aria-hidden="true"> / </span><span aria-current="page">Premium</span>
        </nav>
        <FadeContent as="section" className="mb-12 max-w-3xl">
          <p className="mb-4 text-sm font-medium text-yellow-400">MineBench Premium</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Your wallet. Your pool.<br /><span className="text-yellow-400">Your mining settings.</span></h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">Route mining to your own Monero wallet and choose P2Pool or a custom pool. Keep the benchmark and CPU controls you already use in the free client.</p>
          <p className="mt-5 text-xl font-medium">{PREMIUM_PRICE_USDC} USDC <span className="text-base font-normal text-zinc-400">once, plus Solana network fees</span></p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#premium-purchase" className="btn-primary">Review upgrade</a>
            <Link href="/downloads" className="btn-secondary">Try the free client</Link>
          </div>
          <p className="mt-4 text-sm text-zinc-400">No expiry and no recurring subscription. Compare the plans before connecting your wallet.</p>
        </FadeContent>

        <FadeContent as="section" id="compare-plans" aria-labelledby="compare-title" className="scroll-mt-28 mb-14">
          <h2 id="compare-title" className="mb-6 text-3xl font-semibold tracking-tight">Choose the controls you need</h2>
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">MineBench Free and Premium plan comparison</caption>
              <thead className="bg-zinc-900/70"><tr><th scope="col" className="p-4">Included</th><th scope="col" className="p-4">Free</th><th scope="col" className="p-4 text-yellow-400">Premium</th></tr></thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {[
                  ['Client download and benchmarks', 'Included', 'Included'],
                  ['Public leaderboard and dashboard', 'Included', 'Included'],
                  ['Custom XMR wallet and pool settings', 'Premium upgrade', 'Included'],
                  ['CPU priority, huge pages and RandomX modes', 'Included', 'Included'],
                  ['Price', 'Free', `${PREMIUM_PRICE_USDC} USDC once + network fees`],
                ].map(([feature, free, premium]) => (
                  <tr key={feature}><th scope="row" className="p-4 font-normal">{feature}</th><td className="p-4">{free}</td><td className="p-4">{premium}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeContent>

        <FadeContent as="section" className="mb-14 surface-panel p-3 sm:p-5">
          <h2 className="mb-2 text-xl font-semibold">See the Premium interface</h2>
          <p className="mb-5 text-sm leading-6 text-zinc-400">Custom wallet routing and pool settings in the MineBench desktop client.</p>
          <Image src="/screenshots/app-overview-screenshots/premium.png" alt="MineBench Premium desktop settings for wallet, pool and mining controls" width={1600} height={900} sizes="(max-width: 1024px) 100vw, 960px" className="h-auto w-full rounded-xl border border-zinc-800" />
        </FadeContent>

        <div className="mb-16 grid gap-8 md:grid-cols-2">
          <FadeContent as="section" className="surface-panel p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">What Premium adds</h2>
            <ul className="mt-5 divide-y divide-zinc-800">
              {PREMIUM_FEATURES.map(feature => (
                <li key={feature.title} className="flex items-start gap-3 py-4">
                  <span className="mt-1 shrink-0" aria-hidden="true">{feature.icon}</span>
                  <div><h3 className="text-sm font-semibold">{feature.title}</h3><p className="mt-1 text-sm leading-6 text-zinc-400">{feature.desc}</p></div>
                </li>
              ))}
            </ul>
          </FadeContent>
          <BorderBeam size="md" colorVariant="sunset" theme="dark" strength={0.6} className="rounded-2xl">
          <FadeContent as="section" id="premium-purchase" aria-labelledby="purchase-title" className="scroll-mt-28 surface-panel border-yellow-400/30 p-6 sm:p-8">
            <h2 id="purchase-title" className="text-2xl font-semibold">{userPremiumStatus ? 'Your Premium settings' : 'Upgrade with your Solana wallet'}</h2>
            {!userPremiumStatus && <p className="mt-4 text-sm leading-7 text-zinc-400">Pay {PREMIUM_PRICE_USDC} USDC once. Keep SOL available for transaction fees; the current checkout requires a balance of at least 0.005 SOL. That requirement is not a fixed transaction fee.</p>}
            {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 break-words">{error}</div>}
            {!connected ? (
              <div className="mt-6 space-y-5">
                <WalletMultiButton className="!bg-yellow-400 !text-black !font-semibold !rounded-xl" />
                <p className="text-sm leading-6 text-zinc-400">Connecting lets MineBench check your Premium status. Payment still requires a separate approval in your wallet.</p>
              </div>
            ) : userPremiumStatus ? (
              <div className="mt-6 space-y-5">
                <p role="status" className="flex gap-2 text-yellow-400"><Check className="h-5 w-5" />Premium active</p>
                {success && <p className="text-sm leading-6 text-zinc-400">Use this Solana wallet in the desktop client. Save your Monero settings and restart the miner to apply changes.</p>}
                <div><label htmlFor="premium-xmr-wallet" className="mb-2 block text-sm text-zinc-300">Your Monero wallet</label><input id="premium-xmr-wallet" type="text" value={xmrWallet} onChange={e => setXmrWallet(e.target.value)} placeholder="Monero wallet address" className="input-field w-full" /></div>
                <button onClick={handleUpdateWallet} disabled={isProcessing} className="btn-primary w-full">{isProcessing ? 'Saving...' : 'Save wallet settings'}</button>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <button onClick={handlePurchase} disabled={isProcessing} className="btn-primary w-full" aria-describedby="payment-details">{isProcessing ? 'Processing payment...' : `Pay ${PREMIUM_PRICE_USDC} USDC once`}<ArrowRight className="h-4 w-4 shrink-0" /></button>
                <p id="payment-details" className="text-sm leading-6 text-zinc-400">Review the amount and network fee in your wallet. If confirmation is delayed, check the transaction before retrying.</p>
              </div>
            )}
            <Link href="/downloads" className="mt-7 inline-block text-sm text-zinc-300 underline underline-offset-4 hover:text-yellow-400">Continue with the free client</Link>
          </FadeContent>
          </BorderBeam>
        </div>

        <FadeContent as="section" aria-labelledby="premium-faq" className="mb-10">
          <h2 id="premium-faq" className="mb-6 text-3xl font-semibold tracking-tight">Before you upgrade</h2>
          <div className="divide-y divide-zinc-800 border-y border-zinc-800">
            {PREMIUM_FAQS.map(faq => (
              <details key={faq.question} className="py-5"><summary className="scroll-mt-28 cursor-pointer font-medium marker:text-yellow-400">{faq.question}</summary><p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">{faq.answer}</p></details>
            ))}
          </div>
          <p className="mt-6 text-sm text-zinc-400">Need help with an upgrade? <a href="https://discord.gg/vsDyYh4rma" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">Contact the MineBench community</a>.</p>
        </FadeContent>
      </main>
      <Footer />
    </div>
  );
}
