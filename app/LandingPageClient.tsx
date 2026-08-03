'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useSpring, useMotionValue, useTransform } from 'framer-motion';
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
    Code2,
    ExternalLink,
    MessageSquare,
    Plus,
    Minus,
    Users,
    Maximize,
} from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { getLeaderboardDeviceCount } from '@/lib/leaderboard';
import { BenchmarkResult } from '@/types/benchmark';

const Scene3D = dynamic(() => import('@/components/Scene3D'), { ssr: false, loading: () => null });

export type LandingStats = {
    benchmarks: number;
    miners: number;
    downloads: number;
};

type TreasuryStatus = {
    bmtBalance?: number | null;
    solBalance?: number | null;
    pendingPayouts?: number | null;
    requiredBmt?: number | null;
    circuitBreakerOpen?: boolean | null;
    updatedAt?: string | null;
};

const formatCounterValue = (value: number) => {
    if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return Math.round(value).toString();
};

const formatAssetAmount = (value: number | null | undefined, suffix: string, decimals = 2) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return 'Pending';
    return `${value.toLocaleString(undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: value > 0 && value < 1 ? Math.min(decimals, 4) : 0,
    })} ${suffix}`;
};

function Counter({ value, label }: { value: number; label: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 });
    const displayValue = useTransform(springValue, formatCounterValue);
    const staticValue = formatCounterValue(value);

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);
        }
    }, [isInView, value, motionValue]);

    return (
        <div ref={ref} className="border border-zinc-800 p-6 transition-all duration-300 hover:border-yellow-400">
            <div className="mb-2 text-4xl font-bold text-yellow-400 md:text-5xl font-mono-system">
                <motion.span>{isInView ? displayValue : staticValue}</motion.span>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</div>
        </div>
    );
}

export default function LandingPageClient({
    initialStats,
    clientVersion,
}: {
    initialStats: LandingStats;
    clientVersion: string;
}) {
    const tokenContract = '67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev';
    const [stats, setStats] = useState<LandingStats>(initialStats);
    const [latestClientVersion, setLatestClientVersion] = useState(clientVersion);
    const [treasuryStatus, setTreasuryStatus] = useState<TreasuryStatus | null>(null);
    const [discordStats, setDiscordStats] = useState({
        members: null as number | null,
        online: null as number | null,
        guildName: 'MineBench Discord',
    });
    const [activeCta, setActiveCta] = useState<'benchmark' | 'token' | 'opensource' | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(0.5);
    const videoRef = useRef<HTMLVideoElement>(null);

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
        const fetchStats = async () => {
            try {
                const { data: benchmarkData, error: benchmarkError } = await supabase
                    .from('benchmarks')
                    .select('id, device_uid, device_name, device_type, avg_hashrate, created_at');

                if (benchmarkError) throw benchmarkError;

                const { data: globalStats, error: statsError } = await supabase
                    .from('global_stats')
                    .select('total_downloads')
                    .eq('id', 1)
                    .single();

                if (statsError) {
                    console.error('Error fetching global stats:', statsError);
                }

                if (benchmarkData) {
                    setStats({
                        benchmarks: benchmarkData.length,
                        miners: getLeaderboardDeviceCount(benchmarkData as BenchmarkResult[]),
                        downloads: globalStats?.total_downloads || 0,
                    });
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
            }
        };

        fetchStats();
    }, []);

    useEffect(() => {
        const fetchDiscordStats = async () => {
            try {
                const response = await fetch('/api/discord');
                if (!response.ok) {
                    throw new Error('Failed to fetch Discord stats');
                }

                const data = await response.json();
                setDiscordStats({
                    members: data.approximate_member_count ?? data.profile?.member_count ?? null,
                    online: data.approximate_presence_count ?? data.profile?.online_count ?? null,
                    guildName: data.guild?.name ?? data.profile?.name ?? 'MineBench Discord',
                });
            } catch (err) {
                console.error('Error fetching Discord stats:', err);
            }
        };

        fetchDiscordStats();
    }, []);

    useEffect(() => {
        const fetchLatestRelease = async () => {
            try {
                const response = await fetch('/api/releases', { cache: 'no-store' });
                if (!response.ok) return;

                const { client } = await response.json();
                if (client?.tag_name) {
                    setLatestClientVersion(client.tag_name);
                }
            } catch (err) {
                console.error('Error fetching client release:', err);
            }
        };

        fetchLatestRelease();
    }, []);

    useEffect(() => {
        const fetchTreasuryStatus = async () => {
            try {
                const response = await fetch('/api/treasury', { cache: 'no-store' });
                if (!response.ok) return;

                setTreasuryStatus(await response.json());
            } catch (err) {
                console.error('Error fetching treasury status:', err);
            }
        };

        fetchTreasuryStatus();
    }, []);

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
            <Scene3D />
            <Header />

            <main className="relative z-10 flex-grow pt-[88px]">
                <section className="relative flex min-h-screen items-center justify-center px-4 pb-12 pt-10 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mx-auto max-w-7xl text-center"
                    >
                        <div className="mb-8 inline-block border border-yellow-400 bg-yellow-400/5 px-4 py-2 backdrop-blur-sm">
                            <span className="font-mono-system text-sm font-bold uppercase tracking-widest text-yellow-400">
                                {latestClientVersion} Stable Release
                            </span>
                        </div>

                        <h1 className="mb-8 text-6xl font-bold uppercase leading-none tracking-tighter text-white md:text-8xl lg:text-9xl">
                            MINE<span className="text-yellow-400">BENCH</span>
                        </h1>

                        <h2 className="mb-6 flex flex-wrap items-center justify-center gap-4 text-2xl font-bold uppercase tracking-tight text-zinc-400 md:text-3xl">
                            <span className="block w-full">The Mining Benchmark Platform</span>
                            <span className="block">And</span>
                            <Image
                                src="/logos/Monero-logo.svg"
                                alt="Monero"
                                width={300}
                                height={78}
                                className="inline-block h-[1em] w-auto align-[-0.08em] transition duration-300 hover:scale-105 hover:brightness-125 hover:drop-shadow-[0_0_14px_rgba(255,102,0,0.45)]"
                            />
                            <span className="block">Mining App on</span>
                            <Image
                                src="/solanaLogo.svg"
                                alt="Solana"
                                width={160}
                                height={24}
                                className="inline-block h-[1em] w-auto align-[-0.08em] transition duration-300 hover:scale-105 hover:brightness-125 hover:drop-shadow-[0_0_14px_rgba(250,204,21,0.35)]"
                            />
                        </h2>

                        <p className="mx-auto mb-12 max-w-4xl text-lg font-medium leading-relaxed text-zinc-500 md:text-xl">
                            Benchmark GPU and CPU mining performance, compare RandomX results, and use desktop mining software with a cleaner UI.
                            MineBench helps miners validate hardware, explore the mining leaderboard, and contribute benchmark data to a shared hashrate database.
                        </p>

                        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                            <Link href="/downloads" className="btn-primary inline-flex items-center gap-3 px-10 py-5 text-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(250,204,21,0.22)]">
                                <Download className="h-6 w-6" />
                                Download {latestClientVersion}
                            </Link>
                            <Link href="/dashboard" className="btn-secondary inline-flex items-center gap-3 px-10 py-5 text-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-yellow-400 hover:text-yellow-400 hover:shadow-[0_0_30px_rgba(250,204,21,0.14)]">
                                <Activity className="h-6 w-6" />
                                Live Dashboard
                            </Link>
                        </div>
                    </motion.div>
                </section>

                <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="group relative aspect-video w-full max-w-6xl overflow-hidden rounded-[28px] border-4 border-zinc-900 shadow-[0_0_60px_rgba(250,204,21,0.08)]"
                    >
                        <video
                            ref={videoRef}
                            className="h-full w-full object-cover"
                            autoPlay
                            loop
                            muted={isMuted}
                            playsInline
                            poster="/screenshots/MineBench-Pool-stats-cards.jpg"
                        >
                            <source src="/video/MineBench_Promo.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

                        <div className="absolute bottom-6 right-6 z-20 flex translate-y-4 items-center gap-4 rounded-full border border-white/10 bg-black/60 p-2 opacity-0 backdrop-blur-xl transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                            <div className="flex items-center gap-2 border-r border-white/10 px-4">
                                <button
                                    onClick={() => {
                                        handleVolumeChange(volume - 0.1);
                                    }}
                                    className="text-white/60 hover:text-white"
                                >
                                    <Minus className="h-3 w-3" />
                                </button>
                                <div className="relative flex items-center">
                                    <div className="pointer-events-none absolute left-0 right-0 h-1.5 rounded-full bg-zinc-800" />
                                    <div className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-yellow-400" style={{ width: `${volume * 100}%`, right: `${100 - volume * 100}%` }} />
                                    <input
                                        type="range"
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
                                    className="text-white/60 hover:text-white"
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
                                className="rounded-full bg-yellow-400 p-3 text-black shadow-lg shadow-yellow-400/20 transition-transform hover:scale-110"
                            >
                                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                            <button
                                onClick={handleFullscreen}
                                className="rounded-full bg-white/10 p-3 text-white transition-transform hover:scale-110 hover:bg-white/20"
                            >
                                <Maximize className="h-5 w-5" />
                            </button>
                        </div>
                    </motion.div>
                </section>

                <section className="px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="mb-20 grid grid-cols-2 gap-4 md:grid-cols-3"
                        >
                            <Counter value={stats.downloads} label="Total Downloads" />
                            <Counter value={stats.benchmarks} label="Benchmarks Completed" />
                            <Counter value={stats.miners} label="Unique Devices" />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="mb-32 grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]"
                        >
                            <div className="max-w-2xl space-y-8">
                                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/12 px-3 py-1">
                                    <TrendingUp className="h-4 w-4 text-yellow-400" />
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-yellow-400">SPL Token Ecosystem</span>
                                </div>
                                <h2 className="text-5xl font-bold uppercase italic leading-none tracking-tighter text-white md:text-6xl">
                                    Securing The <span className="text-yellow-400">Network</span> Through Data
                                </h2>
                                <p className="text-xl font-medium leading-relaxed text-zinc-400">
                                    Our native token <span className="font-black italic text-white">$BMT</span> turns mining benchmark data into on-chain utility.
                                    Pool earnings convert XMR to BMT, so miners can measure hardware value, benchmark output, and tokenized network participation in one workflow.
                                </p>
                                <div className="flex flex-wrap gap-6 pt-4">
                                    <Link
                                        href={`https://pump.fun/coin/${tokenContract}`}
                                        target="_blank"
                                        className="flex items-center gap-4 border border-yellow-400/50 bg-yellow-400 px-10 py-5 text-lg font-black uppercase tracking-widest text-black shadow-[0_0_35px_rgba(250,204,21,0.24)] transition-all hover:bg-[#ffe36d]"
                                    >
                                        <Image src="/img/pumpfun_logo.png" alt="Pump.fun" width={24} height={24} />
                                        Trade On Pumpfun
                                    </Link>
                                    <div className="flex flex-col justify-center border border-zinc-900 bg-zinc-950 p-4">
                                        <span className="mb-2 border-l-2 border-yellow-400 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            Token Contract
                                        </span>
                                        <span className="break-all rounded bg-zinc-900 px-3 py-1 font-mono text-sm text-white">{tokenContract}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="pointer-events-none absolute -inset-4 bg-yellow-400/20 blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                                <div className="relative overflow-hidden border-4 border-zinc-900 bg-zinc-950 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                                    <div className="absolute left-6 top-6 z-10 flex items-center gap-4 border border-yellow-400/30 bg-black/80 p-4 backdrop-blur-xl">
                                        <div className="h-3 w-3 animate-pulse rounded-full bg-red-600" />
                                        <span className="font-mono text-xs font-black uppercase tracking-widest text-white italic">
                                            Real-Time Hashrate Tracking
                                        </span>
                                    </div>
                                    <div className="relative aspect-[4/3] opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100">
                                        <Image src="/img/live-performance-tracking.jpg" alt="Live Performance Tracking" fill className="object-cover" />
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
                        </motion.div>

                        <div className="mb-10 space-y-3 text-center">
                            <h2 className="text-[10px] font-black uppercase tracking-[1em] text-yellow-400">Explore MineBench</h2>
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-white italic md:text-5xl">
                                Choose Your <span className="text-yellow-400">Next Move</span>
                            </h3>
                        </div>

                        <div className="mb-32 grid grid-cols-1 gap-8 md:grid-cols-3">
                            <motion.div
                                whileHover={{ y: -10 }}
                                onClick={() => setActiveCta('benchmark')}
                                className={`group flex cursor-pointer flex-col items-center border bg-zinc-950 p-12 text-center shadow-xl shadow-black transition-all ${
                                    activeCta === 'benchmark' ? 'border-yellow-400 shadow-[0_0_35px_rgba(250,204,21,0.14)]' : 'border-zinc-900 hover:border-yellow-400'
                                }`}
                            >
                                <div className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Desktop Benchmark</div>
                                <div className="mb-10 flex h-24 w-24 rotate-3 items-center justify-center border border-zinc-800 bg-zinc-900 transition-all group-hover:rotate-0 group-hover:bg-yellow-400 group-hover:text-black">
                                    <Zap className="h-12 w-12" />
                                </div>
                                <h3 className="mb-6 text-3xl font-black uppercase italic text-white">Benchmark Rig</h3>
                                <p className="mb-10 text-sm font-medium leading-relaxed text-zinc-500">
                                    Run a CPU mining benchmark or GPU mining benchmark, validate hardware performance, and compare results against the broader network.
                                </p>
                                <Link href="/downloads" className="mt-auto inline-flex items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-yellow-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_22px_rgba(250,204,21,0.28)]">
                                    Start Validation &rarr;
                                </Link>
                            </motion.div>
                            <motion.div
                                whileHover={{ y: -10 }}
                                onClick={() => setActiveCta('token')}
                                className={`group flex cursor-pointer flex-col items-center bg-zinc-950 p-12 text-center transition-all ${
                                    activeCta === 'token'
                                        ? 'border-4 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.18)]'
                                        : 'border border-zinc-900 shadow-xl shadow-black hover:border-yellow-400'
                                }`}
                            >
                                <div className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-yellow-200">Token Market</div>
                                <div className="mb-10 flex h-24 w-24 -rotate-3 items-center justify-center bg-yellow-400 text-black transition-transform group-hover:rotate-0">
                                    <TrendingUp className="h-12 w-12" />
                                </div>
                                <h3 className="mb-6 text-3xl font-black uppercase italic text-white">Buy BMT Token</h3>
                                <p className="mb-10 text-sm font-medium leading-relaxed text-zinc-400">
                                    Back the network, follow token traction, and hold exposure to the mining benchmark ecosystem built around MineBench data.
                                </p>
                                <Link href={`https://pump.fun/coin/${tokenContract}`} target="_blank" className="mt-auto inline-flex items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-yellow-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_22px_rgba(250,204,21,0.28)]">
                                    View On Pumpfun &rarr;
                                </Link>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -10 }}
                                onClick={() => setActiveCta('opensource')}
                                className={`group flex cursor-pointer flex-col items-center border bg-zinc-950 p-12 text-center shadow-xl shadow-black transition-all ${
                                    activeCta === 'opensource' ? 'border-yellow-400 shadow-[0_0_35px_rgba(250,204,21,0.14)]' : 'border-zinc-900 hover:border-yellow-400'
                                }`}
                            >
                                <div className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Open Development</div>
                                <div className="mb-10 flex h-24 w-24 items-center justify-center border border-zinc-800 bg-zinc-900 transition-all group-hover:bg-white group-hover:text-black">
                                    <Code2 className="h-12 w-12" />
                                </div>
                                <h3 className="mb-6 text-3xl font-black uppercase italic text-white">Open Source</h3>
                                <p className="mb-10 text-sm font-medium leading-relaxed text-zinc-500">
                                    Review the code, inspect the benchmark logic, and build with us in the open around decentralized mining infrastructure.
                                </p>
                                <Link href="https://bitbucket.org/minebenchapp/minebench-client" target="_blank" className="mt-auto inline-flex items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-yellow-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_22px_rgba(250,204,21,0.28)]">
                                    Go To Bitbucket &rarr;
                                </Link>
                            </motion.div>
                        </div>

                        <div className="mb-32">
                            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                                <div className="order-2 lg:order-1">
                                    <div className="relative overflow-hidden border border-[#5865F2]/30 bg-gradient-to-br from-[#171b2d] via-zinc-950 to-black p-8 shadow-[0_0_50px_rgba(88,101,242,0.15)]">
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
                                                <div className="border border-white/10 bg-white/5 p-5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Members</p>
                                                    <p className="mt-3 text-4xl font-black text-white">{discordStats.members ?? '...'}</p>
                                                </div>
                                                <div className="border border-white/10 bg-white/5 p-5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Online Now</p>
                                                    <p className="mt-3 text-4xl font-black text-white">{discordStats.online ?? '...'}</p>
                                                </div>
                                            </div>
                                            <div className="border border-white/10 bg-black/40 p-5">
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
                                <div className="relative overflow-hidden rounded-[20px] border border-zinc-800 bg-black">
                                    <Image
                                        src="/screenshots/MineBench-Pool-stats-cards.jpg"
                                        alt="MineBench pool statistics overview screenshot"
                                        width={920}
                                        height={552}
                                        className="mx-auto h-auto w-full max-w-[920px] transition-transform duration-700 group-hover:scale-[1.035]"
                                    />
                                </div>
                            </div>
                            <p className="mt-4 text-center text-sm font-medium leading-relaxed text-zinc-500">
                                Live MineBench pool statistics view with miner activity, performance cards, and benchmark-focused network visibility.
                            </p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="mx-auto mb-32 max-w-4xl border-l-4 border-yellow-400 bg-zinc-950 p-12 shadow-2xl"
                        >
                            <h2 className="mb-8 text-4xl font-black uppercase tracking-tighter text-white italic">What Is MineBench?</h2>
                            <div className="space-y-6 text-lg font-medium leading-relaxed text-zinc-400">
                                <p>
                                    <strong className="text-yellow-400">MineBench</strong> is a hardware benchmark platform with blockchain-based rewards.
                                    It works as mining benchmark software for users who want a cleaner way to compare hardware performance, track a mining leaderboard, and publish benchmark results into a shared database.
                                </p>
                                <p>
                                    MineBench provides real-time performance metrics for mining hardware including hashrate, power consumption, and efficiency across multiple algorithms like <span className="italic text-white">RandomX</span> (Monero), <span className="italic text-white">Zephyr</span>, and <span className="italic text-white">Ravencoin</span>.
                                    Whether you&apos;re searching for a CPU mining benchmark, GPU mining benchmark, RandomX benchmark, or a Monero mining app with benchmark visibility, MineBench gives you reliable data and Solana-based rewards for contributing hardware results.
                                </p>
                            </div>
                        </motion.div>
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
                        <div className="group flex flex-col items-start border border-zinc-900 bg-zinc-950/50 p-10 shadow-xl transition-all hover:border-yellow-400 hover:bg-zinc-950">
                            <div className="mb-8 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-900 transition-all group-hover:bg-yellow-400 group-hover:text-black">
                                <Database className="h-8 w-8" />
                            </div>
                            <h3 className="mb-6 text-3xl font-black uppercase text-yellow-400 italic">Blockchain Rewards</h3>
                            <p className="text-lg font-medium leading-relaxed text-zinc-400">
                                Pool earnings convert <span className="text-white">XMR to BMT</span> at real-time rates. Earn rewards directly for your hardware contribution and withdraw instantly to your Solana address without juggling multiple wallet flows.
                            </p>
                        </div>
                        <div className="group flex flex-col items-start border border-zinc-900 bg-zinc-950/50 p-10 shadow-xl transition-all hover:border-yellow-400 hover:bg-zinc-950">
                            <div className="mb-8 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-900 transition-all group-hover:bg-yellow-400 group-hover:text-black">
                                <Activity className="h-8 w-8" />
                            </div>
                            <h3 className="mb-6 text-3xl font-black uppercase text-yellow-400 italic">Real-Time Data</h3>
                            <p className="text-lg font-medium leading-relaxed text-zinc-400">
                                Watch hashrate in real time with power consumption and temperature indicators for smarter hardware optimization, efficiency tracking, and better benchmark context.
                            </p>
                        </div>
                        <div className="group flex flex-col items-start border border-zinc-900 bg-zinc-950/50 p-10 shadow-xl transition-all hover:border-yellow-400 hover:bg-zinc-950">
                            <div className="mb-8 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-900 transition-all group-hover:bg-yellow-400 group-hover:text-black">
                                <Cpu className="h-8 w-8" />
                            </div>
                            <h3 className="mb-6 text-3xl font-black uppercase text-yellow-400 italic">Multi-Algo Support</h3>
                            <p className="text-lg font-medium leading-relaxed text-zinc-400">
                                Supports <span className="text-white">RandomX (Monero)</span> for CPU and <span className="text-white">GhostRider</span>. Built for miners who care about desktop mining software, benchmark accuracy, and native performance on Windows, Linux, and macOS.
                            </p>
                        </div>
                        <div className="group flex flex-col items-start border border-zinc-900 bg-zinc-950/50 p-10 shadow-xl transition-all hover:border-yellow-400 hover:bg-zinc-950">
                            <div className="mb-8 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-900 transition-all group-hover:bg-yellow-400 group-hover:text-black">
                                <Shield className="h-8 w-8" />
                            </div>
                            <h3 className="mb-6 text-3xl font-black uppercase text-yellow-400 italic">Open & Transparent</h3>
                            <p className="text-lg font-medium leading-relaxed text-zinc-400">
                                Repository is public on GitHub and the benchmark workflow is visible end to end. Transparency is the foundation of verified benchmark results and a public mining dataset.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
                    <div className="group relative overflow-hidden border-8 border-yellow-400 bg-zinc-950 p-10 text-center md:p-16">
                        <div className="absolute inset-0 bg-[url('/img/cta_background.png')] bg-cover bg-center opacity-10 grayscale transition-opacity duration-700 group-hover:opacity-20" />
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
                                    Get {latestClientVersion} Now
                                </Link>
                                <Link href="/premium" className="border-2 border-yellow-400 px-10 py-6 text-xl font-black uppercase tracking-[0.2em] text-yellow-400 transition-all hover:bg-yellow-400 hover:text-black">
                                    Upgrade To Premium
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
