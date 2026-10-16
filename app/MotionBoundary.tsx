'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const MotionConfig = dynamic(() => import('framer-motion').then(module => module.MotionConfig));

export function MotionBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Static public content does not need the global animation runtime.
  if (['/', '/leaderboard', '/downloads', '/depin', '/premium', '/whitepaper', '/guides'].includes(pathname || '')
    || pathname?.startsWith('/guides/')) return children;
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
