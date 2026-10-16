'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeMarketingAnalytics } from '@/lib/marketingAnalytics';
import { Button } from '@/components/base/buttons/button';
import {
  GA_MEASUREMENT_ID,
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  isProductionAnalyticsHost,
  sanitizedReferrer,
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
  const [productionHost, setProductionHost] = useState(false);
  const consentRef = useRef<ConsentState>(null);
  const lastPage = useRef<string | null>(null);
  const referrer = useRef('');

  const applyConsent = useCallback((value: ConsentState) => {
    consentRef.current = value;
    const allowed = value === 'granted' && isProductionAnalyticsHost(window.location.hostname) && isTrackablePath(window.location.pathname);
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = !allowed;
    window.gtag?.('consent', 'update', { analytics_storage: allowed ? 'granted' : 'denied' });
    if (!allowed) lastPage.current = null;
    setConsent(value);
  }, []);

  useEffect(() => {
    setProductionHost(isProductionAnalyticsHost(window.location.hostname));
    referrer.current = sanitizedReferrer(document.referrer);
    const syncConsent = () => applyConsent(readStoredConsent(window.localStorage));
    const onStorage = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY || event.key === null) syncConsent();
    };
    syncConsent();
    window.addEventListener(CONSENT_CHANGED_EVENT, syncConsent);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, syncConsent);
      window.removeEventListener('storage', onStorage);
    };
  }, [applyConsent]);

  useEffect(() => {
    applyConsent(consentRef.current);
  }, [applyConsent, pathname]);

  useEffect(() => subscribeMarketingAnalytics(window, () =>
    productionHost && consentRef.current === 'granted' && gaReady,
  ), [productionHost, gaReady]);

  // Manual, query-param-safe pageviews. GA4's automatic "Page changes based on
  // browser history events" must be disabled in the property to avoid double counting.
  useEffect(() => {
    if (!productionHost || consent !== 'granted' || !gaReady) return;
    if (!pathname || !isTrackablePath(pathname)) {
      lastPage.current = null;
      return;
    }
    if (typeof window.gtag !== 'function') return;
    const location = sanitizedPageLocation(window.location);
    if (lastPage.current === location) return;
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      page_location: location,
      page_referrer: referrer.current,
    });
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: sanitizedPageLocation(window.location),
      page_referrer: referrer.current,
    });
    lastPage.current = location;
    referrer.current = location;
  }, [consent, gaReady, pathname, productionHost]);

  const decide = (value: ConsentValue) => {
    writeConsent(window.localStorage, value);
    applyConsent(value);
  };

  return (
    <>
      {productionHost && consent === 'granted' && pathname && isTrackablePath(pathname) && (
        <>
          <Script
            id="google-analytics-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            onReady={() => {
              applyConsent(consentRef.current);
              setGaReady(true);
            }}
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied'
              });
              gtag('consent', 'update', {
                analytics_storage: window['ga-disable-${GA_MEASUREMENT_ID}'] ? 'denied' : 'granted'
              });
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: false,
                page_location: window.location.origin + window.location.pathname,
                page_referrer: ${JSON.stringify(sanitizedReferrer(typeof document === 'undefined' ? '' : document.referrer))}
              });
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
