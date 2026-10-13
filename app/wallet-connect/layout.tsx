import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connect Your Wallet | MineBench',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function WalletConnectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
