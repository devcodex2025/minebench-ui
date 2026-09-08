'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Coins, Wallet, TrendingUp, Gift, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  logoURI?: string;
}

interface RewardsData {
  totalEarned: number;
  pendingRewards: number;
  lastClaim: string | null;
  rank: number;
}

export default function TokenBalanceCard() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [rewards, setRewards] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalances();
      fetchRewards();
    }
  }, [connected, publicKey]);

  const fetchBalances = async () => {
    if (!publicKey) return;
    setLoading(true);
    
    try {
      // Fetch SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Fetch token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      const tokenBalances: TokenBalance[] = tokenAccounts.value
        .map((account) => {
          const parsed = account.account.data.parsed;
          return {
            mint: parsed.info.mint,
            symbol: 'TOKEN',
            name: 'Unknown Token',
            balance: parsed.info.tokenAmount.uiAmount || 0,
            decimals: parsed.info.tokenAmount.decimals,
          };
        })
        .filter((token) => token.balance > 0);

      setTokens(tokenBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    if (!publicKey) return;
    
    try {
      // Fetch user rewards from Supabase
      const { data, error } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching rewards:', error);
        return;
      }

      if (data) {
        setRewards({
          totalEarned: data.total_earned || 0,
          pendingRewards: data.pending_rewards || 0,
          lastClaim: data.last_claim,
          rank: data.rank || 0,
        });
      } else {
        setRewards({
          totalEarned: 0,
          pendingRewards: 0,
          lastClaim: null,
          rank: 0,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleClaim = async () => {
    if (!publicKey || !rewards || rewards.pendingRewards <= 0) return;
    
    setClaiming(true);
    try {
      // Simulate claim transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update rewards in database
      await supabase
        .from('user_rewards')
        .upsert({
          wallet_address: publicKey.toBase58(),
          total_earned: rewards.totalEarned + rewards.pendingRewards,
          pending_rewards: 0,
          last_claim: new Date().toISOString(),
        });

      await fetchRewards();
    } catch (error) {
      console.error('Claim error:', error);
    } finally {
      setClaiming(false);
    }
  };

  if (!connected) {
    return (
      <div className="surface-panel p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Wallet className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500 font-mono text-sm">
              Connect wallet to view rewards
            </p>
            <Link
              href="/wallet-connect"
              className="inline-block mt-4 rounded-lg px-4 py-2 bg-yellow-400 text-black font-bold uppercase text-xs tracking-wide hover:bg-yellow-500 transition-colors"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg p-2 bg-yellow-400/20 border border-yellow-400">
            <Coins className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">Wallet</h3>
            <p className="text-xs text-zinc-500 font-mono">
              {publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}
            </p>
          </div>
        </div>
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="rounded-lg p-2 border border-zinc-800 hover:border-yellow-400 text-zinc-500 hover:text-yellow-400 transition-all disabled:opacity-50"
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* SOL Balance */}
      <div className="mb-6 rounded-xl p-4 bg-zinc-900 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
              ◎
            </div>
            <div>
              <p className="text-sm text-zinc-500">SOL Balance</p>
              <p className="text-xl font-bold text-white">{solBalance.toFixed(4)} SOL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Section */}
      <AnimatePresence mode="wait">
        {rewards && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 rounded-xl p-4 bg-gradient-to-r from-yellow-400/10 to-transparent border border-yellow-400/30"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Gift className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold uppercase text-sm tracking-wide">
                Mining Rewards
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-sm">Pending Rewards</span>
                <span className="text-xl font-bold text-yellow-400">
                  {rewards.pendingRewards.toFixed(2)} MB
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-sm">Total Earned</span>
                <span className="text-white font-medium">
                  {rewards.totalEarned.toFixed(2)} MB
                </span>
              </div>

              {rewards.rank > 0 && (
                <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm">Network Rank</span>
                  <span className="text-white font-medium flex items-center">
                    <TrendingUp className="w-4 h-4 text-yellow-400 mr-1" />
                    #{rewards.rank}
                  </span>
                </div>
              )}

              {rewards.lastClaim && (
                <p className="text-xs text-zinc-600 font-mono">
                  Last claim: {new Date(rewards.lastClaim).toLocaleDateString()}
                </p>
              )}
            </div>

            {rewards.pendingRewards > 0 && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full mt-4 rounded-xl py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-700 text-black font-bold uppercase text-sm tracking-wide transition-all flex items-center justify-center space-x-2"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Claiming...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>Claim {rewards.pendingRewards.toFixed(2)} MB</span>
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token List */}
      {tokens.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">
            Token Balances
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tokens.map((token) => (
              <div
                key={token.mint}
                className="flex items-center justify-between rounded-lg p-3 bg-zinc-900 border border-zinc-800"
              >
                <div className="flex items-center space-x-2">
                  {token.logoURI ? (
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 text-xs font-bold">
                      {token.symbol[0]}
                    </div>
                  )}
                  <span className="text-sm text-white font-medium">{token.symbol}</span>
                </div>
                <span className="text-sm text-zinc-400">
                  {token.balance.toFixed(token.decimals > 4 ? 4 : token.decimals)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
