import FadeContent from '@/components/reactbits/FadeContent';
import Image from 'next/image';
import Link from 'next/link';
import { Activity, ArrowUpRight, ArrowRight, Cpu, Download, Gauge, Layers } from 'lucide-react';
import { ButtonLink } from '@/components/base/buttons/button';
import { Badge } from '@/components/base/badges/badge';

export default function BenchmarkHero({ clientVersion }: { clientVersion: string }) {
  return (
    <FadeContent as="section" blur className="benchmark-hero px-4 pb-10 pt-36 sm:px-6 lg:px-8 lg:pb-12 lg:pt-40">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        <div className="min-w-0">
          <Link href="/downloads" className="utility-chip group mb-7">
            <Badge>{clientVersion}</Badge>
            Latest client release
            <ArrowRight className="h-3.5 w-3.5 text-zinc-500 transition-transform group-hover:translate-x-1" />
          </Link>
          <h1 className="text-[clamp(3.5rem,6.5vw,6rem)] leading-none text-white">
            Mine<span className="text-yellow-400">Bench</span>
          </h1>
          <p className="mt-5 text-2xl font-medium leading-tight tracking-tight text-zinc-100 sm:text-3xl">
            Know your hardware.<br />Mine with confidence.
          </p>
          <p className="mt-5 max-w-[43ch] text-base leading-7 text-zinc-400">
            Run a CPU or GPU mining benchmark, inspect your hashrate, and compare
            your hardware with public results from other MineBench clients.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/downloads" leadingIcon={Download} className="h-11 px-4">Download free client</ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary" leadingIcon={Activity} className="h-11 px-4">Live dashboard</ButtonLink>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-yellow-400" />Windows & Linux</span>
            <span>Open source</span>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-white/10 pt-5 text-xs text-zinc-400">
            <span>Monero mining</span>
            <Image src="/logos/Monero-logo.svg" alt="Monero" width={300} height={78} className="h-5 w-auto" />
            <span>Rewards on</span>
            <Image src="/solanaLogo.svg" alt="Solana" width={160} height={24} className="h-4 w-auto" />
          </div>
        </div>

        <div className="surface-panel min-w-0 overflow-hidden p-2 shadow-[0_16px_64px_-24px_rgb(0_0_0/0.7)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><Gauge className="h-4 w-4 text-yellow-400" />Your mining workspace</div>
            <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-zinc-400">App preview</span>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
            <Image
              src="/screenshots/app-overview-screenshots/benchmarks.png"
              alt="MineBench benchmark screen with hardware details, test duration and hashrate chart"
              width={1200}
              height={800}
              priority
              className="h-auto w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link href="/leaderboard" className="group rounded-xl bg-white/[0.025] p-4 transition-colors hover:bg-white/5">
              <div className="mb-3 flex items-center justify-between"><Cpu className="h-5 w-5 text-yellow-400" /><ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-white" /></div>
              <p className="text-sm font-medium text-zinc-200">Compare your rig</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">CPU & GPU benchmark results</p>
            </Link>
            <Link href="/pool-rewards" className="group rounded-xl bg-white/[0.025] p-4 transition-colors hover:bg-white/5">
              <div className="mb-3 flex items-center justify-between"><Layers className="h-5 w-5 text-yellow-400" /><ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-white" /></div>
              <p className="text-sm font-medium text-zinc-200">Follow your rewards</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">Pool activity & BMT payouts</p>
            </Link>
          </div>
        </div>
      </div>
    </FadeContent>
  );
}
