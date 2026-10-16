'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackMarketingEvent } from '@/lib/marketingAnalytics';

export default function MarketingAnalytics() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      trackMarketingEvent('page_viewed');
      previousPath.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest('a');
      if (!link || event.defaultPrevented) return;
      const url = new URL(link.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      const placement = link.closest('header') ? 'header' : link.closest('footer') ? 'footer' : link.closest('.benchmark-hero') ? 'hero' : 'content';
      if (url.pathname === '/downloads') trackMarketingEvent('download_cta_clicked', { placement });
      if (url.pathname === '/premium') trackMarketingEvent('premium_cta_clicked', { placement });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
