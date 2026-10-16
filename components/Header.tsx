'use client';
import Link from '@/components/refresh/WorkspaceLink';
import { useIQHost } from '@/components/iq/SiteLinks';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, RefreshCw, ArrowUpRight, Activity, Trophy, Layers, ArrowLeftRight, Download, Gem, BookOpen, Home, CircleHelp, ArrowRight, Network, Cpu } from 'lucide-react';
import NetworkStrip from '@/components/NetworkStrip';
import BrandBackground from '@/components/refresh/BrandBackground';
import { WorkspaceSoundButton } from '@/components/refresh/WorkspaceLink';

interface HeaderProps { onRefresh?: () => void; loading?: boolean }
const links = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: Activity },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Downloads', href: '/downloads', icon: Download },
  { name: 'Premium', href: '/premium', icon: Gem },
  { name: 'Whitepaper', href: '/whitepaper', icon: BookOpen },
  { name: 'DePIN', href: '/depin', icon: Network },
];
export default function Header({ onRefresh, loading }: HeaderProps = {}) {
  const iqHost = useIQHost();
  const currentPath = usePathname() ?? '/';
  const pathname = iqHost ? '/minebench-iq' : currentPath;
  const benchmarkDetail = pathname.startsWith('/benchmark/');
  const activePath = benchmarkDetail ? '/leaderboard' : pathname;
  const workspace = benchmarkDetail || pathname === '/leaderboard';
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  const brand = <Link href="/" className="refresh-brand"><Image src="/img/minebench-logo-yellow-128.webp" unoptimized alt="" width={42} height={42}/><span>Mine<span>Bench</span><small>HARDWARE. MEASURED.</small></span></Link>;
  return <>
    {!workspace && pathname !== '/' && <div className="refresh-page-atmosphere"><BrandBackground/></div>}
    <a href="#refresh-content" className="refresh-skip">Skip to content</a>
    <header className="refresh-header" data-workspace={workspace}>
      <div className="refresh-header-row">
        {workspace ? <nav aria-label="Breadcrumb" className="refresh-breadcrumb"><Link href="/" className="workspace-home" aria-label="Return to main site" title="Return to main site"><Home size={17}/><span>Main site</span></Link><span>/</span><span>Workspace</span><span>/</span><strong>{benchmarkDetail ? 'Benchmark details' : links.find(link => link.href === pathname)?.name}</strong></nav> : brand}
        <nav className="refresh-top-nav" aria-label="Main navigation">{links.filter(link => ['/', '/dashboard', '/leaderboard', '/pool-rewards', '/premium', '/whitepaper', '/depin', '/minebench-iq'].includes(link.href)).map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{link.name}</Link>)}</nav>
        <div className="refresh-header-actions">
          <WorkspaceSoundButton/>
          {onRefresh && <button className="refresh-icon-button" onClick={onRefresh} disabled={loading} aria-label="Refresh live data"><RefreshCw size={17} className={loading ? 'animate-spin' : ''}/></button>}
          <Link href="/downloads" className="refresh-download">Download client <ArrowUpRight size={16}/></Link>
          <button className="refresh-menu" aria-expanded={open} aria-controls="refresh-mobile-nav" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
        </div>
      </div>
      <NetworkStrip/>
      {open && <nav id="refresh-mobile-nav" className="refresh-mobile-nav" aria-label="Mobile navigation">{links.map(({name,href,icon:Icon}) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={activePath === href ? (benchmarkDetail ? 'location' : 'page') : undefined}><Icon size={17}/>{name}<ArrowUpRight size={14}/></Link>)}</nav>}
    </header>
    {workspace && <aside className="refresh-sidebar">
      {brand}<Link href="/" className="workspace-exit"><Home size={17}/> Back to main site</Link><span className="refresh-nav-label">EXPLORE THE NETWORK</span>
      <nav aria-label="Workspace navigation">{links.filter(link => ['/dashboard', '/leaderboard'].includes(link.href)).map(({name,href,icon:Icon}) => <Link key={href} href={href} aria-current={activePath === href ? (benchmarkDetail ? 'location' : 'page') : undefined}><Icon size={18}/>{name}{activePath === href && <span className="refresh-active-dot"/>}</Link>)}</nav>
      <span className="refresh-nav-label">MINEBENCH</span>
      <nav aria-label="Resources">{links.filter(link => !['/', '/dashboard', '/leaderboard'].includes(link.href)).map(({name,href,icon:Icon}) => <Link key={href} href={href}><Icon size={18}/>{name}</Link>)}</nav>
      <div className="refresh-sidebar-bottom"><CircleHelp size={22}/><strong>A little help?<br/>A whole community.</strong><a href="https://discord.gg/vsDyYh4rma" target="_blank" rel="noopener noreferrer">Join our Discord <ArrowRight size={15}/></a></div><span className="refresh-sidebar-caption">KNOW YOUR HARDWARE.</span>
    </aside>}
  </>;
}
