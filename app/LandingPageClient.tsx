'use client';

import Link from '@/components/refresh/WorkspaceLink';
import ShowcaseReveal from '@/components/marketing/ShowcaseReveal';
import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import { StatusDot } from '@/components/base/indicators/status-dot';
import {
    Download,
    Activity,
    Database,
    Zap,
    TrendingUp,
    Volume2,
    VolumeX,
    Shield,
    Cpu,
    ExternalLink,
    MessageSquare,
    Plus,
    Minus,
    Users,
    Maximize,
} from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import BitbucketIcon from '@/components/icons/BitbucketIcon';
import DeferredVideo from '@/components/marketing/DeferredVideo';
import type { LandingStats } from '@/lib/landingStats';


const formatCounterValue = (value: number) => {
    if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return Math.round(value).toString();
};

function Counter({ value, label }: { value: number | null; label: string }) {
    return (
        <div className="surface-panel p-6 transition-colors duration-200 hover:border-yellow-400/30">
            <div className="mb-2 text-4xl font-medium tracking-tight text-white md:text-5xl tabular-nums">
                {value === null ? <span aria-label={`${label} unavailable`}>—</span> : formatCounterValue(value)}
            </div>
            <div className="text-xs font-medium text-zinc-400">{label}</div>
        </div>
    );
}

export default function LandingPageClient({
    initialStats,
    clientVersion,
    hero,
    footer,
    gettingStarted,
    benchmarkFaq,
}: {
    initialStats: LandingStats;
    clientVersion: string;
    hero: ReactNode;
    footer: ReactNode;
    gettingStarted: ReactNode;
    benchmarkFaq: ReactNode;
}) {
    const tokenContract = '67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev';
    const stats = initialStats;
    const [discordStats, setDiscordStats] = useState({
        members: null as number | null,
        online: null as number | null,
        guildName: 'MineBench Discord',
    });
    const [discordUnavailable, setDiscordUnavailable] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(0.5);
    const videoRef = useRef<HTMLVideoElement>(null);
    const discordSectionRef = useRef<HTMLDivElement>(null);

    const handleVolumeChange = (nextVolume: number) => {
        const clampedVolume = Math.min(1, Math.max(0, nextVolume));
        setVolume(clampedVolume);
        if (videoRef.current) {
            videoRef.current.volume = clampedVolume;
            if (clampedVolume > 0 && isMuted) {
                setIsMuted(false);
            }
        }
    };

    const handleFullscreen = async () => {
        if (!videoRef.current) return;

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await videoRef.current.requestFullscreen();
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        let timeout: ReturnType<typeof setTimeout>;
        const fetchDiscordStats = async () => {
            timeout = setTimeout(() => controller.abort(), 5000);
            try {
                const response = await fetch('/api/discord', { signal: controller.signal });
                if (!response.ok) throw new Error('Community data unavailable');
                const data = await response.json();
                if (!active) return;
                setDiscordStats({
                    members: data.approximate_member_count ?? data.profile?.member_count ?? null,
                    online: data.approximate_presence_count ?? data.profile?.online_count ?? null,
                    guildName: data.guild?.name ?? data.profile?.name ?? 'MineBench Discord',
                });
                setDiscordUnavailable(false);
            } catch {
                if (active) setDiscordUnavailable(true);
            } finally {
                clearTimeout(timeout);
            }
        };
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            void fetchDiscordStats();
        }, { rootMargin: '300px' });
        if (discordSectionRef.current) observer.observe(discordSectionRef.current);
        return () => {
            active = false;
            observer.disconnect();
            clearTimeout(timeout);
            controller.abort();
        };
    }, []);

    return (
        <div className="board-page refresh-home relative flex min-h-screen flex-col overflow-hidden bg-[hsl(var(--canvas))]">

            <Header />

            <main id="refresh-content" tabIndex={-1} className="relative z-10 flex-grow">
                {hero}

                <section aria-label="MineBench community statistics" className="px-4 pb-8 sm:px-6 lg:px-8">
                        <div
                            className="mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:grid-cols-3"
                        >
                            <Counter value={stats.downloads} label="Total Downloads" />
                            <Counter value={stats.benchmarks} label="Benchmarks Completed" />
                            <Counter value={stats.miners} label="Unique Devices" />
                        </div>
                </section>

                <section className="refresh-product px-4 sm:px-6 lg:px-8">
                    <div className="refresh-product-heading">
                        <div><span className="refresh-overline">01 / YOUR MINING WORKSPACE</span><h2>All the detail.<br /><span className="text-yellow-400">A clearer picture.</span></h2></div>
                        <p>Meet your hardware in the MineBench client. Inspect every benchmark, then compare your results with the community.</p>
                    </div>
                    <div className="refresh-product-frame">
                        <div className="refresh-product-toolbar"><span>● ● ●</span><span>MineBench / Benchmarks</span><Link href="/downloads#application-overview">Explore the client ↗</Link></div>
                        <Image src="/screenshots/app-overview-screenshots/benchmarks.png" alt="MineBench client with hardware details and benchmark telemetry" width={1440} height={900} sizes="(max-width: 1280px) 100vw, 1280px"/>
                    </div>
                </section>

                <section className="relative flex items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
                    <div className="group relative aspect-video w-full max-w-6xl overflow-hidden rounded-[28px] border border-zinc-800 shadow-[0_0_60px_rgba(250,204,21,0.08)]">
                        <DeferredVideo
                            src="/video/MineBench_Promo.mp4"
                            poster="/screenshots/MineBench-Pool-stats-cards.jpg"
                            width={1920}
                            height={1080}
                            className="h-full w-full object-cover"
                            ref={videoRef}
                            muted={isMuted}
                            label="MineBench promotional video"
                        />

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

                        <div className="absolute bottom-6 right-6 z-20 flex translate-y-4 items-center gap-4 rounded-full border border-white/10 bg-black/60 p-2 opacity-100 backdrop-blur-xl transition-all duration-200 sm:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                            <div className="flex items-center gap-2 border-r border-white/10 px-4">
                                <button
                                    onClick={() => {
                                        handleVolumeChange(volume - 0.1);
                                    }}
                                    aria-label="Decrease video volume" className="text-white/60 hover:text-white"
                                >
                                    <Minus className="h-3 w-3" />
                                </button>
                                <div className="relative flex items-center">
                                    <div className="pointer-events-none absolute left-0 right-0 h-1.5 rounded-full bg-zinc-800" />
                                    <div className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-yellow-400" style={{ width: `${volume * 100}%`, right: `${100 - volume * 100}%` }} />
                                    <input
                                        aria-label="Video volume" type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                        className="relative z-10 h-5 w-24 cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        handleVolumeChange(volume + 0.1);
                                    }}
                                    aria-label="Increase video volume" className="text-white/60 hover:text-white"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setIsMuted(!isMuted);
                                    if (videoRef.current) {
                                        videoRef.current.muted = !isMuted;
                                        videoRef.current.volume = volume;
                                    }
                                }}
                                aria-label={isMuted ? 'Unmute video' : 'Mute video'} className="rounded-full bg-yellow-400 p-3 text-black shadow-lg shadow-yellow-400/20 transition-transform hover:scale-110"
                            >
                                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                            <button
                                aria-label="Toggle video fullscreen" onClick={handleFullscreen}
                                className="rounded-full bg-white/10 p-3 text-white transition-transform hover:scale-110 hover:bg-white/20"
                            >
                                <Maximize className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </section>

                {gettingStarted}

                <section className="px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">


                        <div className="mb-32 grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
                            <div className="max-w-2xl space-y-8">
                                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/12 px-3 py-1">
                                    <TrendingUp className="h-4 w-4 text-yellow-400" />
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-yellow-400">SPL Token Ecosystem</span>
                                </div>
                                <h2 className="text-5xl font-bold uppercase italic leading-none tracking-tighter text-white md:text-6xl">
                                    Follow your <span className="text-yellow-400">pool rewards</span>
                                </h2>
                                <p className="text-xl font-medium leading-relaxed text-zinc-400">
                                    MineBench pool rewards use <span className="text-white">BMT on Solana</span>.
                                    View pool activity and reward status separately from your benchmark results.
                                </p>
                                <div className="flex flex-wrap gap-6 pt-4">
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center gap-4 rounded-xl border border-yellow-400/50 bg-yellow-400 px-10 py-5 text-lg font-black uppercase tracking-widest text-black shadow-[0_0_35px_rgba(250,204,21,0.24)] transition-all hover:bg-[#ffe36d]"
                                    >
                                        <Activity className="h-6 w-6" aria-hidden="true" />
                                        View network dashboard
                                    </Link>
                                    <div className="flex flex-col justify-center rounded-xl border border-zinc-900 bg-zinc-950 p-4">
                                        <span className="mb-2 border-l-2 border-yellow-400 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            Token Contract
                                        </span>
                                        <span className="break-all rounded bg-zinc-900 px-3 py-1 font-mono text-sm text-white">{tokenContract}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="pointer-events-none absolute -inset-4 bg-yellow-400/20 blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                                <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                                    <div className="absolute left-6 top-6 z-10 flex items-center gap-4 border border-yellow-400/30 bg-black/80 p-4 backdrop-blur-xl">
                                        <StatusDot tone="warn" className="h-3 w-3" />
                                        <span className="font-mono text-xs font-black uppercase tracking-widest text-white italic">
                                            Real-Time Hashrate Tracking
                                        </span>
                                    </div>
                                    <div className="relative aspect-[4/3] opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100">
                                        <Image src="/img/live-performance-tracking.jpg" alt="Live Performance Tracking" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                                    </div>
                                </div>
                                <div className="relative z-10 mt-6 flex justify-start">
                                    <Link
                                        href="/downloads"
                                        className="inline-flex items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-yellow-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_22px_rgba(250,204,21,0.28)]"
                                    >
                                        Check Your Performance
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="mb-10 space-y-3 text-center">
                            <h2 className="text-[10px] font-black uppercase tracking-[1em] text-yellow-400">Explore MineBench</h2>
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-white italic md:text-5xl">
                                Choose Your <span className="text-yellow-400">Next Move</span>
                            </h3>
                        </div>

                        <div className="mb-32 grid grid-cols-1 gap-8 md:grid-cols-3">
                            <div
                                className="group flex flex-col items-center rounded-2xl border border-zinc-900 bg-zinc-950 p-8 text-center shadow-xl shadow-black transition-all hover:border-yellow-400"
                            >
                                <div className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Desktop Benchmark</div>
                                        <div className="mb-10 flex h-24 w-24 rotate-3 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 transition-all group-hover:rotate-0 group-hover:bg-yellow-400 group-hover:text-black">
                                    <Zap className="h-12 w-12" />
                                </div>
                                <h3 className="mb-6 text-3xl font-black uppercase italic text-white">Benchmark Rig</h3>
                                <p className="mb-10 text-sm font-medium leading-relaxed text-zinc-500">
                                    Run a CPU mining benchmark or GPU mining benchmark, validate hardware performance, and compare results against the broader network.
                                </p>
                                <Link href="/downloads" className="mt-auto inline-flex items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-yellow-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_22px_rgba(250,204,21,0.28)]">
                                    Download free client &rarr;
                                </Link>
                            </div>
                            <div
                                className="group flex flex-col items-center rounded-2xl border border-zinc-900 bg-zinc-950 p-12 text-center shadow-xl shadow-black transition-all hover:border-yellow-400"
                            >
                                <div className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-yellow-200">Token Market</div>
                                <div className="mb-10 flex h-24 w-24 -rotate-3 items-center justify-center rounded-2xl bg-yellow-400 text-black transition-transform group-hover:rotate-0">
                                    <TrendingUp className="h-12 w-12" />
                                </div>
                                <h3 className="mb-6 text-3xl font-black uppercase italic text-white">Explore BMT</h3>
                                <p className="mb-10 text-sm font-medium leading-relaxed text-zinc-400">
                                    BMT is the Solana token used for MineBench pool rewards. Review the token listing and contract details.
                                </p>
                                <Link href={`https://pump.fun/coin/${tokenContract}`} target="_blank" className="mt-auto inline-flex items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-yellow-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_22px_rgba(250,204,21,0.28)]">
                                    View On Pumpfun &rarr;
                                </Link>
                            </div>

                            <div
                                className="group flex flex-col items-center rounded-2xl border border-zinc-900 bg-zinc-950 p-8 text-center shadow-xl shadow-black transition-all hover:border-yellow-400"
                            >
                                <div className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Open Development</div>
                                        <div className="mb-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 transition-all group-hover:bg-white group-hover:text-black">
                                    <BitbucketIcon className="h-12 w-12" />
                                </div>
                                <h3 className="mb-6 text-3xl font-black uppercase italic text-white">Open Source</h3>
                                <p className="mb-10 text-sm font-medium leading-relaxed text-zinc-500">
                                    Review the code, inspect the benchmark logic, and build with us in the open around decentralized mining infrastructure.
                                </p>
                                <Link href="https://bitbucket.org/minebenchapp/minebench-client" target="_blank" className="mt-auto inline-flex items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-yellow-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_22px_rgba(250,204,21,0.28)]">
                                    Go To Bitbucket &rarr;
                                </Link>
                            </div>
                        </div>

                        <div ref={discordSectionRef} className="mb-32">
                            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                                <div className="order-2 lg:order-1">
                                    <div className="relative overflow-hidden rounded-2xl border border-[#5865F2]/30 bg-gradient-to-br from-[#171b2d] via-zinc-950 to-black p-8 shadow-[0_0_50px_rgba(88,101,242,0.15)]">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(88,101,242,0.14),transparent_40%)]" />
                                        <div className="relative space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5865F2] shadow-xl shadow-[#5865F2]/20">
                                                    <MessageSquare className="h-8 w-8 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8e98ff]">Live Community</p>
                                                    <h3 className="text-3xl font-black uppercase italic text-white">{discordStats.guildName}</h3>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Members</p>
                                                    <p className="mt-3 text-4xl font-black text-white">{discordStats.members ?? (discordUnavailable ? '—' : '...')}</p>
                                                </div>
                                                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Online Now</p>
                                                    <p className="mt-3 text-4xl font-black text-white">{discordStats.online ?? (discordUnavailable ? '—' : '...')}</p>
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-white/10 bg-black/40 p-5">
                                                <div className="flex items-center gap-3 text-zinc-300">
                                                    <Users className="h-5 w-5 text-[#5865F2]" />
                                                    <p className="text-sm leading-relaxed">
                                                        Join the MineBench Discord to get release alerts, mining setup help, benchmark feedback, and direct access to the early community around the app and token.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-1 space-y-8 lg:order-2">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5865F2] shadow-xl shadow-[#5865F2]/20">
                                        <MessageSquare className="h-8 w-8 text-white" />
                                    </div>
                                    <h2 className="text-5xl font-black uppercase tracking-tighter text-white italic">
                                        Join The <span className="text-[#5865F2]">Discord</span> Community
                                    </h2>
                                    <p className="text-xl font-medium leading-relaxed text-zinc-400">
                                        Meet miners, benchmark power users, and early token supporters in one place. Get product updates, setup help, release drops, and direct feedback loops as MineBench grows.
                                    </p>
                                    <a
                                        href="https://discord.gg/vsDyYh4rma"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group inline-flex items-center gap-4 rounded-lg bg-[#5865F2] px-10 py-5 font-black uppercase tracking-widest text-white transition-all hover:bg-[#4752c4]"
                                    >
                                        Join The MineBench Discord
                                        <ExternalLink className="h-6 w-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mx-auto mb-16 max-w-3xl">
                            <div className="group relative overflow-hidden rounded-[28px] border border-yellow-400/25 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-3 shadow-[0_0_45px_rgba(250,204,21,0.08)] transition-all duration-500 hover:border-yellow-400/55 hover:shadow-[0_0_65px_rgba(250,204,21,0.14)]">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_25%)] opacity-80" />
                                <ShowcaseReveal>
                                    <div className="relative overflow-hidden rounded-[20px] border border-zinc-800 bg-black">
                                        <Image
                                            src="/screenshots/MineBench-Pool-stats-cards.jpg"
                                            alt="MineBench pool statistics overview screenshot"
                                            width={920}
                                            height={552}
                                            className="mx-auto h-auto w-full max-w-[920px] transition-transform duration-700 group-hover:scale-[1.035]"
                                        />
                                    </div>
                                </ShowcaseReveal>
                            </div>
                            <p className="mt-4 text-center text-sm font-medium leading-relaxed text-zinc-500">
                                Live MineBench pool statistics view with miner activity, performance cards, and benchmark-focused network visibility.
                            </p>
                        </div>

                        <div className="mx-auto mb-32 max-w-4xl rounded-2xl border-l-4 border-yellow-400 bg-zinc-950 p-12 shadow-2xl">
                            <h2 className="mb-8 text-4xl font-black uppercase tracking-tighter text-white italic">What Is MineBench?</h2>
                            <div className="space-y-6 text-lg font-medium leading-relaxed text-zinc-400">
                                <p>
                                    <strong className="text-yellow-400">MineBench</strong> combines a desktop mining benchmark client,
                                    a public hardware leaderboard, and a live pool dashboard. Run a test on your own hardware
                                    or browse existing results before downloading.
                                </p>
                                <p>
                                    The leaderboard groups submitted results by device name and shows the highest positive average hashrate.
                                    Hardware settings and test conditions vary. Use the <Link href="/leaderboard" className="text-yellow-400 hover:underline">hardware results</Link> for
                                    comparison and the <Link href="/dashboard" className="text-yellow-400 hover:underline">live dashboard</Link> for current network activity.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl border-t border-zinc-900 px-4 py-32 sm:px-6 lg:px-8">
                    <div className="mb-20 space-y-4 text-center">
                        <h2 className="text-[10px] font-black uppercase tracking-[1em] text-yellow-400">Platform Advantages</h2>
                        <h3 className="text-5xl font-black uppercase tracking-tighter text-white italic md:text-6xl">
                            Why Choose <span className="text-yellow-400">MineBench?</span>
                        </h3>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2">
                        <SpotlightCard className="group flex flex-col items-start border border-zinc-900 bg-zinc-950/50 p-10 shadow-xl transition-all hover:border-yellow-400 hover:bg-zinc-950">
                            <div className="mb-8 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-900 transition-all group-hover:bg-yellow-400 group-hover:text-black">
                                <Database className="h-8 w-8" />
                            </div>
                            <h3 className="mb-6 text-3xl font-black uppercase text-yellow-400 italic">Blockchain Rewards</h3>
                            <p className="text-lg font-medium leading-relaxed text-zinc-400">
                                Follow <span className="text-white">BMT reward status</span> alongside pool activity. A submitted benchmark measures performance; it does not by itself establish a mining reward.
                            </p>
                        </SpotlightCard>
                        <SpotlightCard className="group flex flex-col items-start border border-zinc-900 bg-zinc-950/50 p-10 shadow-xl transition-all hover:border-yellow-400 hover:bg-zinc-950">
                            <div className="mb-8 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-900 transition-all group-hover:bg-yellow-400 group-hover:text-black">
                                <Activity className="h-8 w-8" />
                            </div>
                            <h3 className="mb-6 text-3xl font-black uppercase text-yellow-400 italic">Real-Time Data</h3>
                            <p className="text-lg font-medium leading-relaxed text-zinc-400">
                                Watch hashrate in real time with power consumption and temperature indicators for smarter hardware optimization, efficiency tracking, and better benchmark context.
                            </p>
                        </SpotlightCard>
                        <SpotlightCard className="group flex flex-col items-start border border-zinc-900 bg-zinc-950/50 p-10 shadow-xl transition-all hover:border-yellow-400 hover:bg-zinc-950">
                            <div className="mb-8 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-900 transition-all group-hover:bg-yellow-400 group-hover:text-black">
                                <Cpu className="h-8 w-8" />
                            </div>
                            <h3 className="mb-6 text-3xl font-black uppercase text-yellow-400 italic">Multi-Algo Support</h3>
                            <p className="text-lg font-medium leading-relaxed text-zinc-400">
                                Explore <span className="text-white">CPU and GPU benchmark results</span> and check the algorithm used in each run. Available client builds are listed by platform on the downloads page.
                            </p>
                        </SpotlightCard>
                        <SpotlightCard className="group flex flex-col items-start border border-zinc-900 bg-zinc-950/50 p-10 shadow-xl transition-all hover:border-yellow-400 hover:bg-zinc-950">
                            <div className="mb-8 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-900 transition-all group-hover:bg-yellow-400 group-hover:text-black">
                                <Shield className="h-8 w-8" />
                            </div>
                            <h3 className="mb-6 text-3xl font-black uppercase text-yellow-400 italic">Open & Transparent</h3>
                            <p className="text-lg font-medium leading-relaxed text-zinc-400">
                                Inspect the public client repository on Bitbucket and browse submitted benchmark results. Check how the software works before running it on your hardware.
                            </p>
                        </SpotlightCard>
                    </div>
                </section>

                {benchmarkFaq}

                <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                    <div className="rounded-[1.5rem] p-px">
                    <div className="group relative overflow-hidden rounded-[1.5rem] border border-yellow-400 bg-zinc-950 p-10 text-center shadow-[0_0_50px_rgba(250,204,21,0.08)] md:p-16">
                        <div className="absolute inset-0 bg-[url('/img/cta_background.webp')] bg-cover bg-center opacity-10 grayscale transition-opacity duration-700 group-hover:opacity-20" />
                        <div className="relative z-10 space-y-10">
                            <h2 className="mb-4 text-4xl font-black uppercase tracking-tighter text-white md:text-6xl">
                                Start Benchmarking And <span className="text-yellow-400">Mining Smarter</span>
                            </h2>
                            <p className="mx-auto mb-8 max-w-3xl text-lg font-medium leading-relaxed text-zinc-400 md:text-xl">
                                Download the app, validate your hardware, compare benchmark results, and move from guesswork to real mining performance data.
                            </p>
                            <div className="flex flex-col items-center justify-center gap-6 lg:flex-row">
                                <Link href="/downloads" className="btn-primary inline-flex items-center gap-4 px-12 py-6 text-xl">
                                    <Download className="h-6 w-6" />
                                            Download {clientVersion}
                                </Link>
                                <Link href="/premium" className="rounded-xl border border-yellow-400 px-10 py-6 text-xl font-black uppercase tracking-[0.2em] text-yellow-400 transition-all hover:bg-yellow-400 hover:text-black">
                                    Compare Free & Premium
                                </Link>
                            </div>
                        </div>
                    </div>
                    </div>
                </section>
            </main>

            {footer}
        </div>
    );
}
