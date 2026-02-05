import type { Metadata } from 'next';
import './globals.css';
import { SolanaWalletProvider } from './providers';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Minebench - Decentralized Mining Benchmark Platform on Solana',
  description: 'Minebench is a revolutionary blockchain-based benchmarking platform for cryptocurrency mining hardware. Compare GPU, CPU, and ASIC performance with transparent, verifiable results on Solana. Track hashrate, power efficiency, and mining profitability across multiple algorithms including Zephyr and Ravencoin.',
  keywords: [
    'mining benchmark',
    'cryptocurrency mining',
    'GPU benchmark',
    'CPU benchmark',
    'ASIC mining',
    'hashrate calculator',
    'mining efficiency',
    'Solana blockchain',
    'decentralized benchmark',
    'hardware performance',
    'mining profitability',
    'Zephyr algorithm',
    'Ravencoin mining',
    'NVIDIA mining',
    'AMD mining',
    'mining hardware comparison',
    'crypto mining analytics',
    'blockchain benchmark',
    'mining dashboard',
    'hardware verification',
    'transparent benchmarking'
  ].join(', '),
  authors: [{ name: 'Minebench Team' }],
  openGraph: {
    title: 'Minebench - Decentralized Mining Benchmark',
    description: 'The decentralized standard for hardware benchmarking and mining efficiency on the Solana blockchain.',
    url: 'https://minebench.cloud',
    siteName: 'Minebench',
    images: [
      {
        url: 'https://minebench.cloud/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minebench - Decentralized Mining Benchmark',
    description: 'The decentralized standard for hardware benchmarking and mining efficiency on the Solana blockchain.',
    images: ['https://minebench.cloud/og-image.png'],
    creator: '@MineBenchdapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://minebench.cloud',
  },
  applicationName: 'Minebench',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Minebench',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Windows, Linux',
    description: 'Decentralized blockchain-based benchmarking platform for cryptocurrency mining hardware. Provides transparent, verifiable performance metrics for GPU, CPU, and ASIC mining equipment on the Solana blockchain.',
    url: 'https://minebench.cloud',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Real-time mining hardware benchmarking',
      'GPU and CPU performance comparison',
      'Blockchain-verified results on Solana',
      'Hashrate and efficiency tracking',
      'Multiple algorithm support (Zephyr, Ravencoin)',
      'Power consumption analytics',
      'Hardware performance leaderboards',
      'Transparent and immutable benchmark data'
    ],
    screenshot: 'https://minebench.cloud/og-image.png',
    author: {
      '@type': 'Organization',
      name: 'Minebench Team',
    },
  };

  return (
    <html lang="en">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
