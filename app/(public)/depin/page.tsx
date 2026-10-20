import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DePinClient from './DePinClient';
import './depin.css';

const title = 'MineBench DePIN on Solana | Hardware & Compute Roadmap';
const description = 'Explore MineBench DePIN on Solana: physical hardware, CPU benchmarking and eligible mining contribution today, with a decentralized compute network planned.';
const url = 'https://minebench.cloud/depin';
const image = 'https://minebench.cloud/img/depin/depin-hardware-network.webp';
const imageAlt = 'Illustration of distributed CPU hardware connected across a network';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: 'website', images: [{ url: image, width: 1280, height: 720, alt: imageAlt }] },
  twitter: { card: 'summary_large_image', title, description, images: [{ url: image, alt: imageAlt }] },
};

export default function DePinPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': url + '#webpage',
    url,
    name: title,
    description,
    inLanguage: 'en',
    primaryImageOfPage: { '@type': 'ImageObject', url: image, width: 1280, height: 720, caption: imageAlt },
  };

  return <div className="depin-page"><Header liveMetrics={false} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} /><DePinClient /><Footer /></div>;
}
