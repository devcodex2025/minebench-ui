import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DePinClient from './DePinClient';
import './depin.css';

const title = 'DePIN Compute Network & Hardware Benchmarking | MineBench';
const description = 'Explore MineBench DePIN: current CPU benchmarking and mining infrastructure, hardware validation, Solana claims, and the planned distributed compute network.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://minebench.cloud/depin' },
  openGraph: { title, description, url: 'https://minebench.cloud/depin', type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function DePinPage() {
  return <div className="depin-page"><Header /><DePinClient /><Footer /></div>;
}
