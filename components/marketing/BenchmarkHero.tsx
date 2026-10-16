import Image from 'next/image';
import Link from '@/components/refresh/WorkspaceLink';
import { ArrowUpRight, ArrowRight, Cpu, Activity, Download, Check, Layers } from 'lucide-react';
import HeroAtmosphere from '@/components/refresh/HeroAtmosphere';
import './BenchmarkHero.css';

export default function BenchmarkHero({ clientVersion }: { clientVersion: string }) {
  return <section className="benchmark-hero refresh-hero mb-hero" aria-labelledby="hero-title">
    <HeroAtmosphere />
    <div className="mb-hero-inner">
      <div className="mb-hero-eyebrow"><span><i aria-hidden="true"/> MINING PERFORMANCE, MADE CLEAR</span><Link href="/downloads">{clientVersion} <ArrowUpRight size={13} aria-hidden="true"/></Link></div>
      <div className="mb-hero-layout">
        <div className="mb-hero-copy">
          <p className="mb-hero-category">THE MINING BENCHMARK WORKSPACE</p>
          <h1 id="hero-title">Know your<br/>hardware.<span>Mine with confidence.</span></h1>
          <p className="mb-hero-description">Measure your CPU and GPU. Compare real hardware results. See what your rig can do — all in one workspace.</p>
          <div className="mb-hero-actions"><Link href="/downloads" className="refresh-button"><Download size={17} aria-hidden="true"/> Get MineBench free <ArrowUpRight size={18} aria-hidden="true"/></Link><Link href="/dashboard" className="refresh-link">Explore dashboard <ArrowRight size={17} aria-hidden="true"/></Link></div>
          <div className="mb-hero-notes"><span><Check size={13} aria-hidden="true"/> Windows & Linux</span><span><Check size={13} aria-hidden="true"/> Open source</span></div>
        </div>
        <div className="mb-hardware" role="img" aria-label="MineBench logo on a processor, representing CPU and GPU benchmarking">
          <div className="mb-hardware-caption" aria-hidden="true"><span>HARDWARE. MEASURED.</span><span>CPU / GPU</span></div>
          <div className="mb-chip-scene" aria-hidden="true">
            <div className="mb-chip-ground"/>
            <div className="mb-chip-stack">
              <div className="mb-chip-base"/>
              <div className="mb-chip-pins mb-chip-pins-x"/><div className="mb-chip-pins mb-chip-pins-y"/>
              <div className="mb-chip-face"><div className="mb-chip-inset"><Image src="/img/minebench-logo.png" alt="" width={240} height={240} sizes="(max-width: 768px) 140px, 240px"/><span>MINEBENCH</span></div><i className="mb-chip-corner"/></div>
            </div>
          </div>
          <div className="mb-hardware-label mb-hardware-cpu" aria-hidden="true"><Cpu size={17}/><span>CPU + GPU<small>Your hardware, in focus.</small></span></div>
          <div className="mb-hardware-label mb-hardware-proof" aria-hidden="true"><Activity size={17}/><span>Real benchmarks<small>Measured. Compared. Understood.</small></span></div>
          <div className="mb-hardware-foot" aria-hidden="true"><span>BUILT FOR THE WAY YOU MINE</span><span>↗</span></div>
        </div>
      </div>
      <nav className="mb-hero-path" aria-label="Explore MineBench">
        <Link href="/downloads"><span className="mb-path-number">01</span><span><strong>Benchmark your rig</strong><small>Start with the free desktop client</small></span><Download size={19} aria-hidden="true"/></Link>
        <Link href="/leaderboard"><span className="mb-path-number">02</span><span><strong>Find your comparison</strong><small>Explore public hardware results</small></span><Cpu size={19} aria-hidden="true"/></Link>
        <Link href="/pool-rewards"><span className="mb-path-number">03</span><span><strong>Follow pool rewards</strong><small>Track XMR activity and BMT payouts</small></span><Layers size={19} aria-hidden="true"/></Link>
      </nav>
    </div>
  </section>;
}
