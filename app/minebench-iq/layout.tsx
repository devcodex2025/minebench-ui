import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { IQHostProvider } from '@/components/iq/SiteLinks';

export const metadata: Metadata = {
  metadataBase: new URL('https://iq.minebench.cloud'),
  applicationName: 'MineBench IQ',
  icons: { icon: '/img/minebench-iq-logo.png', apple: '/img/minebench-iq-logo.png' },
};

export default async function IQLayout({ children }: { children: React.ReactNode }) {
  const host = ((await headers()).get('host') || '').toLowerCase().split(':')[0];
  const iqHost = host === 'iq.minebench.cloud' || host === 'iq.localhost';
  return <IQHostProvider value={iqHost}>{children}</IQHostProvider>;
}
