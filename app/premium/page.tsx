'use client';

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
import { supabase } from '../../lib/supabaseClient';
import { Check, Shield, Zap, Wallet, ArrowRight, Flame, Cpu, Settings } from 'lucide-react';

const USDC_MINT = new PublicKey('EPjFW36vc7J741696u75Rqd6j5uv69eeMT1p8rkAKz2w');
const TREASURY_WALLET = new PublicKey('kUMEKAPv1rd2TtnxsJrTvtZ6LDdjK7bmKFF8HzwYi95'); // User's treasury wallet
const PREMIUM_PRICE_USDC = 29;

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
  },
  {
    title: 'CPU Priority Controls',
    desc: 'Tune CPU priority from the app UI instead of console flags.',
    icon: <Flame className="w-5 h-5 text-yellow-400" />
  },
  {
    title: 'Huge Pages Optimization',
    desc: 'Enable huge pages for better RandomX performance.',
    icon: <Cpu className="w-5 h-5 text-yellow-400" />
  },
  {
    title: 'RandomX Modes',
    desc: 'Switch between auto, fast, and light memory modes.',
    icon: <Shield className="w-5 h-5 text-yellow-400" />
  },
  {
    title: 'Threads & Workers',
    desc: 'Control threads and worker setup through clean UI/UX.',
    icon: <Settings className="w-5 h-5 text-yellow-400" />
  }
] as const;

const SEARCH_INTENTS = [
  'Monero mining software',
  'mine Monero to own wallet',
  'P2Pool mining',
  'P2Pool GUI',
  'RandomX huge pages',
  'CPU mining optimization',
  'custom stratum pool',
  'Monero wallet mining app',
  'RandomX tuning',
  'mining software with gui',
  'monero mining gui',
  'monero miner gui',
  'xmrig gui alternative',
  'monero mining app for windows mac linux',
  'monero miner with user interface',
  'console alternative to xmrig',
];

const PREMIUM_USE_CASES = [
  {
    title: 'Mine Monero To Your Own Wallet',
    desc: 'For users searching how to mine Monero directly to a personal wallet without depending on default pool routing.'
  },
  {
    title: 'Optimize CPU Mining For RandomX',
    desc: 'For miners comparing thread count, CPU priority, RandomX mode, and huge pages to improve hashrate and stability.'
  },
  {
    title: 'Use P2Pool Or A Custom Pool',
    desc: 'For miners searching for a P2Pool GUI or a cleaner way to manage custom stratum endpoints without relying on terminal-only setup.'
  },
  {
    title: 'Run A Better Monero Mining Workflow',
    desc: 'For operators who want one desktop client for mining, tuning, benchmarking, payout routing, and worker management.'
  },
  {
    title: 'Control Mining Through UI Instead Of Console',
    desc: 'For regular users looking for a Monero miner GUI or an XMRig GUI alternative with full mining control through UI/UX instead of CLI flags.'
  }
] as const;

const PREMIUM_FAQS = [
  {
    question: 'How do I mine Monero directly to my own wallet?',
    answer: 'MineBench Premium unlocks a custom XMR wallet flow so you can point mining payouts to your own Monero address inside the desktop app instead of relying on the default platform payout path.'
  },
  {
    question: 'Can I use P2Pool or a custom stratum pool with MineBench Premium?',
    answer: 'Yes. The Premium workflow is designed for miners who want P2Pool mining, a preferred pool, or a custom stratum endpoint instead of a one-size-fits-all default setup.'
  },
  {
    question: 'What makes MineBench Premium useful for RandomX CPU mining?',
    answer: 'Premium focuses on the controls CPU miners actually search for: thread tuning, CPU priority, huge pages, and RandomX mode selection for fast, light, or automatic memory behavior.'
  },
  {
    question: 'Why use MineBench Premium instead of a console-only miner?',
    answer: 'Most mining apps expose advanced controls through terminal flags and config files. MineBench Premium works as a Monero miner GUI and an XMRig GUI alternative, so regular users can manage wallet routing, pool selection, threads, RandomX mode, and tuning without living in the console.'
  },
  {
    question: 'Does MineBench Premium support advanced Monero mining setup?',
    answer: 'Yes. MineBench Premium brings wallet control, RandomX optimization, huge pages, P2Pool support, and CPU tuning into a clean UI, making advanced mining easier without relying on console commands.'
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="inline-block border border-yellow-400 px-4 py-2 mb-6">
            <span className="text-yellow-400 font-mono text-sm uppercase tracking-widest">
              Premium Upgrade
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 uppercase">
            Unlock <span className="text-yellow-400">Pro-Level Mining Control</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Turn MineBench into a premium Monero mining software experience with direct wallet mining,
            P2Pool and custom pool support, RandomX tuning, and full mining control through UI/UX across Windows, macOS, and Linux.
          </p>
          <p className="text-sm text-zinc-500 max-w-3xl mx-auto mt-6 leading-relaxed">
            Built for people searching for Monero mining software, direct Monero payouts, P2Pool mining,
            RandomX huge pages, advanced CPU mining controls, a Monero miner GUI, and an XMRig GUI alternative that replaces console-only workflows.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => document.getElementById('premium-screenshot')?.scrollIntoView({ behavior: 'smooth' })}
                className="border border-zinc-700 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:border-yellow-400 hover:text-yellow-400"
              >
                See Premium UI
              </button>
              <button
                onClick={() => document.getElementById('premium-purchase')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white"
              >
                Unlock Premium Now
              </button>
            </div>
            <div className="flex items-center justify-center">
              <Link
                href="/downloads"
                className="border border-zinc-700 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:border-yellow-400 hover:text-yellow-400"
              >
                Try Free Version Of The App
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {SEARCH_INTENTS.map((intent) => (
              <span
                key={intent}
                className="border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400"
              >
                {intent}
              </span>
            ))}
          </div>
        </div>

        <section id="premium-screenshot" className="mb-16">
          <div className="group border border-zinc-800 bg-zinc-950 p-3 shadow-2xl transition-all duration-500 hover:border-yellow-400/60 hover:shadow-[0_0_45px_rgba(250,204,21,0.12)]">
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-wide text-white">See The Premium Mining Interface In Action</h2>
                <p className="text-sm text-zinc-500">
                  A real screenshot of the premium UI for wallet routing, mining controls, RandomX tuning, and everyday miner-friendly workflow management.
                </p>
              </div>
              <span className="border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400">
                Premium UI
              </span>
            </div>
            <div className="overflow-hidden border border-zinc-900 bg-black">
              <Image
                src="/screenshots/app-overview-screenshots/premium.png"
                alt="MineBench Premium screenshot showing premium mining controls and interface"
                width={1600}
                height={900}
                className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                priority
              />
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8 items-start mb-20">
          {/* Feature Card */}
          <div className="bg-zinc-950 border border-zinc-800 p-8 space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-wide">Premium Features That Sell The Upgrade</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Everything here is designed to help regular users control the mining process through a visual interface,
              not through terminal commands, config files, and console-only miner workflows.
            </p>
            <ul className="space-y-2 border-t border-zinc-900 pt-2">
              {PREMIUM_FEATURES.map((feature, i) => (
                <li
                  key={i}
                  className="group flex items-start gap-3 border-b border-zinc-900/80 py-3 last:border-b-0"
                >
                  <div className="mt-0.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold uppercase text-sm tracking-wide leading-snug text-white">
                      {feature.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      {feature.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="pt-6 border-t border-zinc-900">
              <div className="flex justify-between items-end gap-4 mb-2">
                <span className="text-zinc-500 uppercase text-xs font-bold tracking-widest">One-time payment</span>
                <span className="flex items-center gap-3 text-4xl font-bold text-white">
                  <Image
                    src="/img/Circle_USDC_Logo.svg"
                    alt="USDC"
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                  <span>29 <span className="text-sm text-zinc-500">USDC</span></span>
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                One upgrade. Instant activation. Full premium mining controls.
              </p>
            </div>
          </div>

          {/* Action Card */}
          <div id="premium-purchase" className="bg-zinc-950 border-2 border-yellow-400/20 p-8 space-y-6">
            {!connected ? (
              <div className="text-center py-10 space-y-6">
                <Wallet className="w-16 h-16 text-zinc-700 mx-auto" />
                <p className="text-zinc-400 font-mono text-sm">Connect your Solana wallet to unlock premium mining controls</p>
                <div className="flex justify-center">
                  <WalletMultiButton className="!bg-yellow-400 !text-black !font-bold" />
                </div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                  Start your premium upgrade
                </p>
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
                  {isProcessing ? 'Updating...' : 'Save Premium Wallet Settings'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-400">
                  Upgrade now to unlock a premium Monero mining app for Windows, macOS, and Linux with direct wallet routing, RandomX tuning, custom pool control, and full UI-based miner management.
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-xs font-mono max-w-full overflow-hidden">
                    <p className="break-words leading-relaxed">{error}</p>
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
                      Buy Premium And Start Mining Smarter
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-zinc-600 text-center font-mono uppercase leading-relaxed">
                  Payment processed via Solana | Instant activation | Full UI mining control without console-only setup
                </p>
              </div>
            )}
          </div>
        </div>

        <section className="mb-20 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold uppercase tracking-tighter">
              Why Smart Miners Choose <span className="text-yellow-400">Premium Control</span>
            </h2>
            <p className="text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              Most miners are not just looking for a benchmark app. They are looking for a Monero mining app
              that can route payouts to a personal wallet, support P2Pool or a custom pool, and expose the
              CPU mining controls that matter for RandomX performance through a clean UI instead of console-only commands.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {PREMIUM_USE_CASES.map((item) => (
              <div key={item.title} className="border border-zinc-800 bg-zinc-950 p-6">
                <h3 className="text-xl font-bold uppercase tracking-wide text-white mb-3">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20 border border-zinc-800 bg-zinc-950 p-8 md:p-10">
          <div className="max-w-3xl space-y-5">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter">
              A Better Alternative To <span className="text-yellow-400">Console-Only Miners</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              MineBench Premium is designed for miners who want more than a basic start/stop experience.
              If you are comparing Monero mining software, a Monero mining GUI, an XMRig GUI alternative, tuning RandomX for CPU mining, testing huge pages,
              or trying to mine Monero to your own wallet, this page speaks directly to those needs.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Instead of hiding the important controls behind terminal flags, config files, and console-only miners,
              MineBench Premium gives regular users full mining process control through UI/UX: wallet ownership,
              pool flexibility, thread tuning, CPU priority, RandomX mode selection, and workflow visibility in one place.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              It also gives you one cross-platform mining workflow across Windows, macOS, and Linux, which makes
              it relevant for solo miners, home lab operators, mining enthusiasts, and anyone searching for a Monero mining app for Windows, macOS, and Linux.
            </p>
            <div className="pt-4">
              <button
                onClick={() => document.getElementById('premium-purchase')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white"
              >
                Upgrade To Premium
              </button>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="mb-8">
            <h2 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              Questions Buyers Ask Before <span className="text-yellow-400">Upgrading</span>
            </h2>
            <p className="text-zinc-400 max-w-3xl leading-relaxed">
              These are the practical questions miners usually ask before buying a premium mining tool.
            </p>
          </div>
          <div className="space-y-4">
            {PREMIUM_FAQS.map((faq) => (
              <div key={faq.question} className="border border-zinc-800 bg-zinc-950 p-6">
                <h3 className="text-lg font-bold text-white mb-3">{faq.question}</h3>
                <p className="text-zinc-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

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
