'use client';

import React from 'react';
import { MotionConfig } from 'framer-motion';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import './wallet-adapter.css';

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = React.useMemo(() => {
    // Використовуємо RPC URL змінної середовища, якщо вона є, інакше fallback на публічний
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    return rpcUrl || clusterApiUrl(network);
  }, [network]);

  // Wallet Standard wallets (Phantom, Solflare, Backpack, Glow, Magic Eden, ...)
  // are discovered automatically by @solana/wallet-adapter-react. The `wallets`
  // list is only for legacy adapters, so no per-wallet dependency is required.
  const wallets = React.useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

