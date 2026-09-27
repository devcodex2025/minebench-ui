'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/base/buttons/button';
import {
  GA_MEASUREMENT_ID,
  isTrackablePath,
  readStoredConsent,
  sanitizedPageLocation,
  writeConsent,
  type ConsentValue,
} from './consent';

type ConsentState = ConsentValue | 'unknown' | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalyticsConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState>(null);
  const [gaReady, setGaReady] = useState(false);

  useEffect(() => {
    setConsent(readStoredConsent(window.localStorage));
  }, []);

  // Manual, query-param-safe pageviews. GA4's automatic "Page changes based on
  // browser history events" must be disabled in the property to avoid double counting.
  useEffect(() => {
    if (consent !== 'granted' || !gaReady) return;
    if (!pathname || !isTrackablePath(pathname)) return;
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: sanitizedPageLocation(window.location),
    });
  }, [consent, gaReady, pathname]);

  const decide = (value: ConsentValue) => {
    writeConsent(window.localStorage, value);
    setConsent(value);
  };

  return (
    <>
      {consent === 'granted' && (
        <>
          <Script
            id="google-analytics-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            onReady={() => setGaReady(true)}
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'granted'
              });
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}

      {consent === 'unknown' && (
        <div
          role="region"
          aria-label="Analytics consent"
          aria-live="polite"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-sm text-[hsl(var(--foreground))] shadow-2xl sm:inset-x-6 sm:bottom-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[hsl(var(--muted-foreground))]">
              We use analytics cookies to understand how MineBench is used. You can accept or
              decline.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="small" onClick={() => decide('denied')}>
                Decline
              </Button>
              <Button variant="primary" size="small" onClick={() => decide('granted')}>
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
