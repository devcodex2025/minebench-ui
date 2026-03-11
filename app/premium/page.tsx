'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  PublicKey, 
  Transaction, 
  Connection
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '../../lib/supabaseClient';
import { Check, Shield, Zap, Wallet, ArrowRight } from 'lucide-react';

const USDC_MINT = new PublicKey('EPjFW36vc7J741696u75Rqd6j5uv69eeMT1p8rkAKz2w');
const TREASURY_WALLET = new PublicKey('kUMEKAPv1rd2TtnxsJrTvtZ6LDdjK7bmKFF8HzwYi95'); // User's treasury wallet
const PREMIUM_PRICE_USDC = 29;

export default function PremiumPage() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [xmrWallet, setXmrWallet] = useState('');
  const [userPremiumStatus, setUserPremiumStatus] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      checkPremiumStatus();
    }
  }, [connected, publicKey, checkPremiumStatus]);

  async function checkPremiumStatus() {
    const { data, error } = await supabase
      .from('users')
      .select('is_premium, xmr_wallet')
      .eq('solana_wallet', publicKey?.toBase58())
      .single();
    
    if (data) {
      setUserPremiumStatus(data.is_premium);
      if (data.xmr_wallet) setXmrWallet(data.xmr_wallet);
    }
  }

  async function handlePurchase() {
    if (!publicKey || !connected) {
      setError('Please connect your wallet first');
      return;
    }


    setIsProcessing(true);
    setError(null);

    try {
      // 1. Get associated token accounts
      const fromAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      const toAta = await getAssociatedTokenAddress(USDC_MINT, TREASURY_WALLET);

      // 2. Create transaction
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
      // Note: We use 6 decimals for USDC
      transaction.add(
        createTransferInstruction(
          fromAta,
          toAta,
          publicKey,
          PREMIUM_PRICE_USDC * 1000000
        )
      );

      // 3. Send and confirm
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      // 4. Update Database
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
      setError(err.message || 'Transaction failed');
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="inline-block border border-yellow-400 px-4 py-2 mb-6">
            <span className="text-yellow-400 font-mono text-sm uppercase tracking-widest">
              Premium Feature
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 uppercase">
            Direct <span className="text-yellow-400">Mining</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Bypass the platform pool and mine Monero directly to your own wallet. 
            Keep 100% of your hashes with zero platform fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Feature Card */}
          <div className="bg-zinc-950 border border-zinc-800 p-8 space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-wide">Benefits</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <p className="font-bold">Own Wallet Support</p>
                  <p className="text-sm text-zinc-500">Specify any Monero address for payouts.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <p className="font-bold">No Platform Fees</p>
                  <p className="text-sm text-zinc-500">Mine directly to your chosen pool.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <p className="font-bold">Full Control</p>
                  <p className="text-sm text-zinc-500">Configure custom mining parameters.</p>
                </div>
              </li>
            </ul>
            
            <div className="pt-6 border-t border-zinc-900">
              <div className="flex justify-between items-end mb-2">
                <span className="text-zinc-500 uppercase text-xs font-bold tracking-widest">One-time payment</span>
                <span className="text-4xl font-bold text-white">29 <span className="text-sm text-zinc-500">USDC</span></span>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-zinc-950 border-2 border-yellow-400/20 p-8 space-y-6">
            {!connected ? (
              <div className="text-center py-10 space-y-6">
                <Wallet className="w-16 h-16 text-zinc-700 mx-auto" />
                <p className="text-zinc-400 font-mono text-sm">Connect your Solana wallet to proceed</p>
                <div className="flex justify-center">
                  <WalletMultiButton className="!bg-yellow-400 !text-black !font-bold" />
                </div>
              </div>
            ) : userPremiumStatus ? (
              <div className="space-y-6">
                <div className="bg-yellow-400/10 border border-yellow-400/20 p-4 rounded flex items-center gap-3">
                  <Check className="w-6 h-6 text-yellow-400" />
                  <span className="text-yellow-400 font-bold uppercase text-sm tracking-wider">Premium Active</span>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Your Monero Wallet</label>
                  <input 
                    type="text" 
                    value={xmrWallet}
                    onChange={(e) => setXmrWallet(e.target.value)}
                    placeholder="4..."
                    className="w-full bg-black border border-zinc-800 p-3 font-mono text-sm focus:border-yellow-400 outline-none transition-colors"
                  />
                </div>
                
                <button 
                  onClick={handleUpdateWallet}
                  disabled={isProcessing}
                  className="w-full bg-yellow-400 text-black font-bold py-4 uppercase tracking-widest hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Updating...' : 'Update Settings'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-400">
                  After purchase, open the <strong className="text-white">MineBench Desktop App</strong> → Settings to configure your Monero wallet address.
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-xs font-mono">
                    {error}
                  </div>
                )}

                <button 
                  onClick={handlePurchase}
                  disabled={isProcessing}
                  className="w-full bg-yellow-400 text-black font-bold py-4 uppercase tracking-widest hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>
                      Unlock Direct Mining
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-zinc-600 text-center font-mono uppercase">
                  Payment processed via Solana • Instant Activation
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Success Modal Overlay */}
        {success && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <div className="bg-zinc-950 border-4 border-yellow-400 p-12 max-w-lg text-center space-y-6">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-12 h-12 text-black" />
              </div>
              <h2 className="text-4xl font-bold uppercase tracking-tighter">Premium Unlocked</h2>
              <p className="text-zinc-400">
                You can now use your custom Monero wallet in the MineBench Desktop app. 
                Restart your miner to apply changes.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="btn-primary w-full"
              >
                Let&apos;s Mine
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
