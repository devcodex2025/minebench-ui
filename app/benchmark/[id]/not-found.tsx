import Link from 'next/link';
import { SearchX, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
export default function BenchmarkNotFound() {
  return <div className="board-page refresh-benchmark min-h-screen"><Header/><main id="refresh-content" tabIndex={-1} className="benchmark-empty"><SearchX size={38}/><span className="refresh-overline">BENCHMARK NOT FOUND</span><h1>This result is unavailable.</h1><p>The link may be incorrect, or the benchmark may no longer exist.</p><Link href="/leaderboard" className="refresh-button"><ArrowLeft size={16}/> Back to leaderboard</Link></main><Footer/></div>;
}
