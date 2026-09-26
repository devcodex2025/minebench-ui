import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DePinClient from './DePinClient';
import './depin.css';

const title = 'MineBench DePIN | Hardware Intelligence & Distributed Compute';
const description = 'Explore MineBench’s working CPU benchmark and mining infrastructure, hardware validation, Solana claims, and planned distributed compute network.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/depin' },
  openGraph: { title, description, url: '/depin', type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function DePinPage() {
  return <div className="depin-page"><Header /><DePinClient /><Footer /></div>;
}
