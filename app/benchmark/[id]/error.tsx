'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
export default function BenchmarkError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  return <div className="board-page refresh-benchmark min-h-screen"><Header/><main id="refresh-content" tabIndex={-1} className="benchmark-empty"><RefreshCw size={34}/><h1>Unable to load this benchmark.</h1><p>The data service is temporarily unavailable. Please try again.</p><button className="refresh-button" onClick={() => { router.refresh(); reset(); }}>Try again</button><Link href="/leaderboard" className="refresh-link">Back to leaderboard</Link></main><Footer/></div>;
}
