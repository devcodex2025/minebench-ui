import type { Metadata } from 'next';
import WhitepaperClient from './WhitepaperClient';

export const metadata: Metadata = {
    alternates: { canonical: 'https://minebench.cloud/whitepaper' },
    title: 'MineBench Whitepaper | Mining, BMT Rewards & AI Compute Roadmap',
    description: 'MineBench architecture, off-chain benchmarks, P2Pool reward stages, lifetime Premium and the planned MineBench IQ AI compute marketplace. Updated September 2026.',
    openGraph: {
        title: 'MineBench Whitepaper | Product, Rewards & Roadmap',
        description: 'What MineBench delivers today, how BMT rewards work, and what is planned for MineBench IQ.',
        url: 'https://minebench.cloud/whitepaper',
        siteName: 'MineBench',
        images: [
            {
                url: 'https://minebench.cloud/og-whitepaper.png',
                width: 1200,
                height: 630,
                alt: 'MineBench Whitepaper',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MineBench Whitepaper | Product, Rewards & Roadmap',
        description: 'Mining architecture, BMT settlement and the planned MineBench IQ AI compute direction.',
        images: ['https://minebench.cloud/og-whitepaper.png'],
        creator: '@MineBenchdapp',
    },
};

export default function Whitepaper() {
    return <WhitepaperClient />;
}
