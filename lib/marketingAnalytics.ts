export type MarketingEventName = 'page_viewed' | 'download_cta_clicked' | 'download_selected' | 'premium_cta_clicked' | 'premium_checkout_started';
type EventProperties = { placement?: 'header' | 'footer' | 'hero' | 'content'; platform?: string; arch?: string };
type MarketingEvent = { event: MarketingEventName; page_path: string; placement?: string; platform?: string; arch?: string };

declare global {
  interface Window {
    minebenchEvents?: MarketingEvent[];
  }
}

const publicPaths = ['/', '/downloads', '/premium', '/dashboard', '/leaderboard', '/pool-rewards', '/whitepaper', '/guides', '/depin'];
const guidePaths = ['/guides/randomx-benchmarking', '/guides/measure-hashrate-per-watt', '/guides/mining-profitability-calculator', '/guides/verify-minebench-download'];
const eventNames = ['page_viewed', 'download_cta_clicked', 'download_selected', 'premium_cta_clicked', 'premium_checkout_started'];

export function isMarketingPath(pathname: string): boolean {
  return publicPaths.includes(pathname) || guidePaths.includes(pathname);
}

export function trackMarketingEvent(event: MarketingEventName, properties: EventProperties = {}) {
  if (typeof window === 'undefined' || !isMarketingPath(window.location.pathname) || !eventNames.includes(event)) return;
  const detail: MarketingEvent = { event, page_path: window.location.pathname };
  if (properties.placement && ['header', 'footer', 'hero', 'content'].includes(properties.placement)) detail.placement = properties.placement;
  if (properties.platform && ['windows', 'linux', 'macos'].includes(properties.platform)) detail.platform = properties.platform;
  if (properties.arch && ['x64', 'arm64', 'msi', 'universal', 'appimage', 'deb', 'rpm'].includes(properties.arch)) detail.arch = properties.arch;
  // Local, bounded diagnostics; never replay this history to analytics.
  window.minebenchEvents = [...(window.minebenchEvents || []).slice(-49), detail];
  window.dispatchEvent(new CustomEvent('minebench:analytics', { detail }));
}

// Only live events are forwarded. The local diagnostic buffer is never read.
export function subscribeMarketingAnalytics(target: Window, canSend: () => boolean): () => void {
  const onEvent = (event: Event) => {
    if (!canSend() || typeof target.gtag !== 'function') return;
    const detail = (event as CustomEvent<MarketingEvent>).detail;
    if (!detail || !eventNames.includes(detail.event) || detail.event === 'page_viewed') return;
    if (detail.page_path !== target.location.pathname || !isMarketingPath(detail.page_path)) return;
    const properties: Record<string, string> = {
      page_path: detail.page_path,
      page_location: `${target.location.origin}${detail.page_path}`,
    };
    if (['header', 'footer', 'hero', 'content'].includes(detail.placement || '')) properties.placement = detail.placement!;
    if (['windows', 'linux', 'macos'].includes(detail.platform || '')) properties.platform = detail.platform!;
    if (['x64', 'arm64', 'msi', 'universal', 'appimage', 'deb', 'rpm'].includes(detail.arch || '')) properties.arch = detail.arch!;
    target.gtag('event', detail.event, properties);
  };
  target.addEventListener('minebench:analytics', onEvent);
  return () => target.removeEventListener('minebench:analytics', onEvent);
}
