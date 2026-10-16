'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import React from 'react';

type WalletProviderComponent = React.ComponentType<{ children: React.ReactNode }>;
const CallbackWalletProvider = dynamic(
  () => import('./providers').then((module) => module.SolanaWalletProvider),
);
const WalletActivationContext = React.createContext({
  active: false,
  walletRequested: false,
  activate: async () => {},
  walletOpened: () => {},
});

export function useWalletActivation() {
  return React.useContext(WalletActivationContext);
}

export function WalletBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const callbackRoute = pathname === '/premium' || pathname === '/wallet-connect' || !!pathname?.startsWith('/wallet-connect/');
  const [Provider, setProvider] = React.useState<WalletProviderComponent | null>(null);
  const [walletRequested, setWalletRequested] = React.useState(false);
  const loading = React.useRef<Promise<void> | null>(null);
  const ActiveProvider = Provider || (callbackRoute ? CallbackWalletProvider : null);

  React.useEffect(() => {
    if (callbackRoute) setProvider((current: WalletProviderComponent | null) => current || CallbackWalletProvider);
  }, [callbackRoute]);

  const activate = React.useCallback(async () => {
    setWalletRequested(true);
    if (ActiveProvider) return;
    if (!loading.current) {
      loading.current = import('./providers').then(module => {
        setProvider(() => module.SolanaWalletProvider);
      }).finally(() => { loading.current = null; });
    }
    await loading.current;
  }, [ActiveProvider]);
  const walletOpened = React.useCallback(() => setWalletRequested(false), []);
  const value = React.useMemo(() => ({ active: !!ActiveProvider, walletRequested, activate, walletOpened }),
    [ActiveProvider, walletRequested, activate, walletOpened]);

  return (
    <WalletActivationContext.Provider value={value}>
      {ActiveProvider ? <ActiveProvider>{children}</ActiveProvider> : children}
    </WalletActivationContext.Provider>
  );
}
