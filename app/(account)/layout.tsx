import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../shared.css';
import { SolanaWalletProvider } from '../providers';

const manrope = localFont({
  src: '../../public/fonts/Manrope.woff2',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  preload: true,
  variable: '--font-manrope',
  adjustFontFallback: 'Arial',
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  title: 'MineBench account',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  referrer: 'no-referrer',
};

export default function AccountRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${manrope.variable} antialiased refresh-ui`}>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
