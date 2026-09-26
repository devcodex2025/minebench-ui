'use client';
import { createContext, useContext } from 'react';

const IQHost = createContext(false);
export function IQHostProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <IQHost.Provider value={value}>{children}</IQHost.Provider>;
}
export const useIQHost = () => useContext(IQHost);
export function siteHref(href: string, iqHost: boolean) {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const iqPath = /^\/minebench-iq(?=\/|\?|#|$)/;
  if (iqPath.test(href)) {
    const path = href.replace(iqPath, '') || '/';
    const rooted = path.startsWith('/') ? path : `/${path}`;
    return iqHost ? rooted : process.env.NODE_ENV === 'production' ? `https://iq.minebench.cloud${rooted}` : href;
  }
  return iqHost ? `https://minebench.cloud${href}` : href;
}
