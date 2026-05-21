'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useRef } from 'react';
import { DownloadSimple, Gauge, GithubLogo, ShieldCheck, TrendUp } from '@phosphor-icons/react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type LandingHeroProps = {
  stats: {
    benchmarks: number;
    miners: number;
    downloads: number;
  };
  statsLoading: boolean;
  discordStats: {
    members: number | null;
    online: number | null;
    guildName: string;
  };
  discordLoading: boolean;
  clientVersion?: string;
};

function formatMetric(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toLocaleString();
}

export default function LandingHero({
  stats,
  statsLoading,
  discordStats,
  discordLoading,
  clientVersion = 'Latest',
}: LandingHeroProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const proofStats = useMemo(
    () => [
      {
        label: 'Downloads',
        value: statsLoading ? 'Syncing' : formatMetric(stats.downloads),
      },
      {
        label: 'Benchmarks',
        value: statsLoading ? 'Syncing' : formatMetric(stats.benchmarks),
      },
      {
        label: 'Unique devices',
        value: statsLoading ? 'Syncing' : formatMetric(stats.miners),
      },
      {
        label: 'Discord online',
        value: discordLoading ? 'Connecting' : (discordStats.online ?? discordStats.members ?? 0).toLocaleString(),
      },
    ],
    [discordLoading, discordStats.members, discordStats.online, stats, statsLoading]
  );

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTimeline
        .from('[data-hero-kicker]', { autoAlpha: 0, y: 18, duration: 0.55 })
        .from(
          '[data-hero-heading]',
          { autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.08 },
          '-=0.18'
        )
        .from('[data-hero-copy]', { autoAlpha: 0, y: 24, duration: 0.65 }, '-=0.35')
        .from(
          '[data-hero-action]',
          { autoAlpha: 0, y: 18, duration: 0.55, stagger: 0.08 },
          '-=0.32'
        )
        .from(
          '[data-hero-chip]',
          { autoAlpha: 0, y: 12, duration: 0.45, stagger: 0.05 },
          '-=0.32'
        )
        .from(
          '[data-proof-panel]',
          { autoAlpha: 0, x: 38, duration: 0.9 },
          '-=0.58'
        );

      if (panelRef.current) {
        gsap.to(panelRef.current, {
          y: -44,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }
    },
    { scope: rootRef }
  );

  return (
    <section
      ref={rootRef}
      className="relative min-h-[100dvh] px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-20 lg:pt-32"
    >
      <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(420px,0.96fr)] lg:items-center">
        <div className="max-w-3xl">
          <div
            data-hero-kicker
            className="inline-flex items-center gap-3 rounded-full border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 px-4 py-2"
          >
            <span className="section-kicker !mb-0 text-[hsl(var(--accent))]">
              Mining benchmark software
            </span>
          </div>

          <div className="mt-8 space-y-4">
            <h1
              data-hero-heading
              className="max-w-[12ch] text-5xl font-semibold leading-[0.96] tracking-[-0.05em] text-white sm:text-6xl xl:text-7xl"
            >
              Benchmark your mining hardware with live RandomX proof.
            </h1>
            <p
              data-hero-heading
              className="max-w-[14ch] text-xl font-medium tracking-[-0.03em] text-[hsl(var(--text-soft))] sm:text-2xl"
            >
              Compare CPUs and GPUs, publish verified results, and keep miner telemetry in one clean workflow.
            </p>
          </div>

          <p
            data-hero-copy
            className="mt-8 max-w-[60ch] text-base leading-7 text-[hsl(var(--text-muted))] sm:text-lg"
          >
            MineBench is built for miners who want practical answers: which rig is faster,
            how stable the benchmark run is, how their hardware compares to the live
            dashboard, and where to download a cleaner client without digging through
            console-only tooling.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/downloads" className="btn-primary" data-hero-action>
              <DownloadSimple size={20} weight="bold" />
              Download MineBench
            </Link>
            <Link href="/dashboard" className="btn-secondary" data-hero-action>
              <TrendUp size={20} weight="bold" />
              Open Live Dashboard
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {[
              'CPU + GPU benchmark runs',
              'RandomX-first data visibility',
              'Open mining stack',
              'Windows and Linux clients',
            ].map((item) => (
              <div key={item} data-hero-chip className="utility-chip">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div ref={panelRef} data-proof-panel>
          <div className="surface-panel overflow-hidden">
            <div className="border-b border-white/8 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="section-kicker">Live product snapshot</p>
                  <h2 className="mt-2 max-w-[18ch] text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Miner-first desktop UI with benchmark telemetry and proof-ready data.
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--text-soft))]">
                  {clientVersion} stable
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-[hsl(var(--panel-strong))]">
                  <Image
                    src="/screenshots/MineBench-Pool-stats-cards.jpg"
                    alt="MineBench pool stats dashboard with live miner metrics"
                    width={920}
                    height={552}
                    className="h-full w-full object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,15,0.08),rgba(8,10,15,0.6))]" />
                  <div className="absolute left-4 top-4 rounded-full border border-[hsl(var(--signal))]/35 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--signal))] backdrop-blur-sm">
                    Live pool visibility
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                          <Gauge size={24} weight="bold" className="text-[hsl(var(--accent))]" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--text-soft))]">
                            Best benchmark
                          </p>
                          <p className="mt-1 text-lg font-semibold text-white">RandomX telemetry</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[hsl(var(--text-muted))]">
                      Hardware name, duration, power, temperatures, and recent submissions stay visible without forcing miners into a spreadsheet workflow.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/30 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--text-soft))]">
                        Open stack
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-white">
                        <GithubLogo size={22} weight="fill" />
                        <span className="text-sm font-medium">Public client repo and benchmark pipeline</span>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/8 bg-black/30 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--text-soft))]">
                        Community pulse
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                        {discordLoading ? 'Syncing' : `${(discordStats.members ?? 0).toLocaleString()} miners`}
                      </p>
                      <p className="mt-2 text-sm text-[hsl(var(--text-muted))]">
                        {discordStats.guildName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {proofStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.35rem] border border-white/8 bg-black/30 px-4 py-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--text-soft))]">
                      {item.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,214,102,0.1),rgba(71,188,140,0.06))] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <ShieldCheck size={22} weight="fill" className="text-[hsl(var(--accent))]" />
                    <span className="text-sm font-medium">
                      Product-first flow: download, benchmark, compare, then explore rewards and premium controls.
                    </span>
                  </div>
                  <Link href="/downloads" className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--accent))] transition-colors hover:text-white">
                    View supported clients
                    <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowRightIcon() {
  return (
    <span aria-hidden="true" className="inline-flex">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="translate-y-[1px]"
      >
        <path
          d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
