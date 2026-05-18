import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onRefresh?: () => void;
  loading?: boolean;
}

export default function Header({ onRefresh, loading }: HeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Downloads', href: '/downloads' },
    { name: 'Premium', href: '/premium' },
    { name: 'Whitepaper', href: '/whitepaper' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-8 h-8">
              <Image src="/img/minebench-logo.png" alt="Minebench" fill className="object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white group-hover:text-yellow-400 transition-colors uppercase">
              MINEBENCH
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-bold uppercase tracking-wide ${isActive ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  {link.name}
                </Link>
              );
            })}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="ml-4 p-2 border border-zinc-800 hover:border-yellow-400 text-yellow-400 hover:bg-zinc-900 transition-all"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-yellow-400 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-zinc-900 bg-black"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-sm font-bold uppercase tracking-wide ${isActive ? 'text-yellow-400 border-l-2 border-yellow-400 bg-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
