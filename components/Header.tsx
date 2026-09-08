'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, RefreshCw, ArrowUpRight } from 'lucide-react';
import NetworkStrip from '@/components/NetworkStrip';
import InteractiveBackdrop from '@/components/InteractiveBackdrop';

interface HeaderProps {
  onRefresh?: () => void;
  loading?: boolean;
}

export default function Header({ onRefresh, loading }: HeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Pool rewards', href: '/pool-rewards' },
    { name: 'Downloads', href: '/downloads' },
    { name: 'Premium', href: '/premium' },
    { name: 'Whitepaper', href: '/whitepaper' },
  ];

  return (
    <>
    <InteractiveBackdrop />
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[hsl(var(--canvas)/0.95)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-8 h-8">
              <Image src="/img/minebench-logo.png" alt="Minebench" fill className="object-contain" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white group-hover:text-yellow-400 transition-colors">
              MineBench<span className="ml-1 text-yellow-400">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${isActive ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  {link.name}
                </Link>
              );
            })}
            {onRefresh && (
              <button
                onClick={onRefresh}
                aria-label="Refresh live data"
                className="ml-2 rounded-lg p-2 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </nav>

          <Link href="/downloads" className="btn-primary hidden sm:inline-flex !px-3 !py-2 !text-xs">
            Download free <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="xl:hidden rounded-lg p-2 text-white hover:bg-white/5 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <NetworkStrip />

      {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="xl:hidden border-t border-white/10 bg-[#171717]"
          >
            <nav aria-label="Mobile navigation" className="px-4 py-4 space-y-1">
              {navLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block rounded-lg px-4 py-3 text-sm font-medium ${isActive ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
    </header>
    </>
  );
}
