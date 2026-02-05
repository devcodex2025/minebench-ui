import type { Metadata } from 'next';

export const metadata: Metadata = {
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
