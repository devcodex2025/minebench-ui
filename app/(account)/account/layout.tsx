import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Your mining account | MineBench',
  description: 'Your private MineBench mining account.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  referrer: 'no-referrer' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export default function AccountLayout({ children }: { children: ReactNode }) { return children; }
