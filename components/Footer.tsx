import Image from 'next/image';
import Link from 'next/link';
import { Github } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  const footerLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Downloads', href: '/downloads' },
    { name: 'Whitepaper', href: '/whitepaper' },
  ];

  return (
    <footer className="border-t border-zinc-900 mt-20 relative z-10 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col items-start">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative w-8 h-8">
                <Image src="/img/minebench-logo.png" alt="Minebench" fill className="object-contain" />
              </div>
              <span className="text-lg font-bold tracking-tighter text-white uppercase">MINEBENCH</span>
            </div>
            <p className="text-sm text-zinc-500 font-mono-system">
              The decentralized standard for hardware benchmarking on Solana.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-start md:items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Navigate</h3>
            <div className="space-y-2 mb-2">
              {footerLinks.map(link => (
                <Link key={link.href} href={link.href} className="block text-sm text-zinc-500 hover:text-yellow-400 transition-colors uppercase tracking-wide">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col items-start md:items-end">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Community</h3>
            <div className="flex gap-4">
              <a href="https://discord.gg/vsDyYh4rma" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-zinc-800 hover:border-yellow-400 flex items-center justify-center transition-all group">
                <div className="relative w-5 h-5">
                  <Image src="/img/discord-icon.svg" alt="Discord" fill className="object-contain opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
              <a href="https://x.com/MineBenchdapp" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-zinc-800 hover:border-yellow-400 flex items-center justify-center transition-all group">
                <div className="relative w-5 h-5">
                  <Image src="/img/x-icon.svg" alt="X (Twitter)" fill className="object-contain opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
              <a href="https://pump.fun/coin/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-zinc-800 hover:border-yellow-400 flex items-center justify-center transition-all group">
                <div className="relative w-5 h-5">
                  <Image src="/img/pumpfun_logo.png" alt="pump.fun" fill className="object-contain opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
              <a href="https://github.com/devcodex2025/MineBench-Client" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-zinc-800 hover:border-yellow-400 flex items-center justify-center transition-all group">
                <Github className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-zinc-900 text-center">
          <p className="text-xs text-zinc-600 font-mono-system uppercase tracking-widest">
            © {year} MINEBENCH. ALL RIGHTS RESERVED.
          </p>
          <p className="text-xs text-zinc-600 font-mono-system uppercase tracking-widest mt-2">
            Contract Address - 67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev (Solana Blockchain)
          </p>
        </div>
      </div>
    </footer>
  );
}
