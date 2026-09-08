export type MarketingEventName = 'page_viewed' | 'download_cta_clicked' | 'download_selected' | 'premium_cta_clicked' | 'premium_checkout_started';
type EventProperties = { placement?: 'header' | 'footer' | 'hero' | 'content'; platform?: string; arch?: string };
type MarketingEvent = { event: MarketingEventName; page_path: string; placement?: string; platform?: string; arch?: string };

declare global {
  interface Window {
    minebenchEvents?: MarketingEvent[];
  }
}

const publicPaths = ['/', '/downloads', '/premium', '/dashboard', '/leaderboard', '/pool-rewards', '/whitepaper'];

export function trackMarketingEvent(event: MarketingEventName, properties: EventProperties = {}) {
  if (typeof window === 'undefined' || !publicPaths.includes(window.location.pathname)) return;
  const detail: MarketingEvent = { event, page_path: window.location.pathname };
  if (properties.placement && ['header', 'footer', 'hero', 'content'].includes(properties.placement)) detail.placement = properties.placement;
  if (properties.platform && ['windows', 'linux', 'macos'].includes(properties.platform)) detail.platform = properties.platform;
  if (properties.arch && ['x64', 'arm64', 'msi', 'universal', 'appimage', 'deb', 'rpm'].includes(properties.arch)) detail.arch = properties.arch;
  // Local, bounded diagnostics; a consent-aware destination can subscribe later.
  window.minebenchEvents = [...(window.minebenchEvents || []).slice(-49), detail];
  window.dispatchEvent(new CustomEvent('minebench:analytics', { detail }));
}
