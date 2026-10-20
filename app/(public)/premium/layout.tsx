import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MineBench Premium | Monero Mining Software With Full UI Control',
  description: 'Upgrade to MineBench Premium and control Monero mining through a powerful UI instead of console-only miners. Direct wallet mining, P2Pool, RandomX tuning, huge pages, and Windows, macOS, Linux support.',
  alternates: {
    canonical: 'https://minebench.cloud/premium',
  },
  keywords: [
    'Monero mining software',
    'Monero premium mining',
    'mine Monero to own wallet',
    'P2Pool mining software',
    'P2Pool GUI',
    'RandomX tuning',
    'RandomX huge pages',
    'CPU mining optimization',
    'custom stratum mining',
    'Monero direct payouts',
    'Monero wallet mining app',
    'mining software with gui',
    'monero mining gui',
    'monero miner gui',
    'xmrig gui alternative',
    'cross platform mining software',
    'monero mining app for windows mac linux',
    'windows macos linux mining app',
    'monero miner with user interface',
    'console alternative to xmrig',
  ],
  openGraph: {
    title: 'MineBench Premium | Full UI Control For Monero Mining',
    description: 'A Monero mining app with direct wallet mining, P2Pool, RandomX tuning, and full UI/UX controls across Windows, macOS, and Linux.',
    url: 'https://minebench.cloud/premium',
    siteName: 'Minebench',
    images: [{ url: 'https://minebench.cloud/og-downloads.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MineBench Premium | Monero Mining With Full UI Control',
    description: 'Mine Monero with direct wallet payouts, P2Pool, RandomX tuning, and a clean UI instead of console-only workflows.',
    images: ['https://minebench.cloud/og-downloads.png'],
  },
};

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
