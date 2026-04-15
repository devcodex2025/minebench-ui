import type { Metadata } from 'next';
import WhitepaperClient from './WhitepaperClient';

export const metadata: Metadata = {
    title: 'Whitepaper - Minebench | BMT Tokenomics & Mining Architecture',
    description: 'Explore the Minebench whitepaper. Decentralized hardware benchmarking on Solana, BenchMark Token (BMT) tokenomics, and the Colosseum Hackathon journey.',
    openGraph: {
        title: 'Whitepaper - Minebench | BMT Tokenomics',
        description: 'Decentralized hardware benchmarking on Solana. Learn about architecture and tokenomics.',
        url: 'https://minebench.cloud/whitepaper',
        siteName: 'Minebench',
        images: [
            {
                url: 'https://minebench.cloud/og-whitepaper.png',
                width: 1200,
                height: 630,
                alt: 'Minebench Whitepaper - Decentralized Benchmarking',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Whitepaper - Minebench | BMT Tokenomics',
        description: 'Decentralized mining architecture on Solana.',
        images: ['https://minebench.cloud/og-whitepaper.png'],
        creator: '@MineBenchdapp',
    },
};

export default function Whitepaper() {
    return <WhitepaperClient />;
}
