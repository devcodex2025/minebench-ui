import type { Metadata } from 'next';
import './globals.css';
import { SolanaWalletProvider } from './providers';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://minebench.cloud'),
  title: 'MineBench | Mining Benchmark Software And Live Hardware Results',
  description: 'MineBench is mining benchmark software for CPU and GPU miners. Compare hardware results, track RandomX benchmark performance, and download a cleaner mining client with a live results dashboard.',
  keywords: [
    'MineBench',
    'mining benchmark software',
    'cpu mining benchmark',
    'gpu mining benchmark',
    'randomx benchmark',
    'live hardware results',
    'monero mining software',
    'live hashrate dashboard',
    'CPU mining',
    'GPU mining',
    'Monero mining',
    'hashrate',
    'mining hardware',
    'miner software',
    'mining results dashboard'
  ].join(', '),
  authors: [{ name: 'Minebench Team' }],
  openGraph: {
    title: 'MineBench | Mining Benchmark Software And Live Hardware Results',
    description: 'Compare CPU and GPU mining performance, inspect RandomX benchmark data, and download the MineBench client.',
    url: 'https://minebench.cloud',
    siteName: 'Minebench',
    images: [
      {
        url: 'https://minebench.cloud/og-home.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MineBench | Mining Benchmark Software And Live Hardware Results',
    description: 'Track benchmark results, compare hardware, and download a cleaner mining client.',
    images: ['https://minebench.cloud/og-home.png'],
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
    operatingSystem: 'Windows, Linux, macOS',
    description: 'Mining benchmark software for CPU and GPU miners with a live results dashboard, RandomX benchmark visibility, download builds, and miner-focused telemetry.',
    url: 'https://minebench.cloud',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'CPU and GPU mining benchmark runs',
      'RandomX benchmark visibility',
      'Live hardware results dashboard',
      'Hashrate, duration, and telemetry tracking',
      'Windows, Linux, and macOS client downloads',
      'Open mining stack and benchmark workflow',
      'Pool statistics and recent test visibility'
    ],
    screenshot: 'https://minebench.cloud/og-home.png',
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
