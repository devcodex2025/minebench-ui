export const GA_MEASUREMENT_ID = 'G-VN2T49YVLX';
export const CONSENT_CHANGED_EVENT = 'minebench:consent-changed';
export const CONSENT_STORAGE_KEY = 'minebench:analytics-consent';

export type ConsentValue = 'granted' | 'denied';

// Routes that must never be sent to analytics (sensitive wallet callback flows).
const EXCLUDED_ANALYTICS_PATHS = ['/wallet-connect', '/account', '/api/account'];

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem' | 'removeItem'>;
type LocationLike = Pick<Location, 'origin' | 'pathname'>;

export function readStoredConsent(storage: ReadableStorage): ConsentValue | 'unknown' {
  try {
    const stored = storage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') return stored;
  } catch {
    // Storage can be blocked (private mode); treat as undecided.
  }
  return 'unknown';
}

export function writeConsent(storage: WritableStorage, value: ConsentValue | null): void {
  try {
    if (value === null) storage.removeItem(CONSENT_STORAGE_KEY);
    else storage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Ignore storage failures; consent still applies for the session.
  }
}

// GA4 defaults to the full URL (including query string) as page_location.
// Only origin + pathname are forwarded so query params never reach Google.
export function sanitizedPageLocation(location: LocationLike): string {
  return `${location.origin}${location.pathname}`;
}

export function isTrackablePath(pathname: string): boolean {
  return !EXCLUDED_ANALYTICS_PATHS.some(
    (excluded) => pathname === excluded || pathname.startsWith(`${excluded}/`),
  );
}

export function isProductionAnalyticsHost(hostname: string): boolean {
  return hostname === 'minebench.cloud';
}

export function sanitizedReferrer(referrer: string): string {
  try {
    const url = new URL(referrer);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : '';
  } catch {
    return '';
  }
}
