import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  title: 'Phantom Wallet Authentication - MineBench',
  description: 'Connect your Phantom wallet to MineBench mining application',
};

export default function WalletConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
