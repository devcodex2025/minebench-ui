'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Download, Cpu, HardDrive, TrendingUp, Zap } from "lucide-react";
import Image from "next/image";
import WindowsIcon from "@/public/img/windows.svg";
import MacOSIcon from "@/public/img/macos-logo.svg";
import LinuxIcon from "@/public/img/linux-logo.svg";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Scene3D from '@/components/Scene3D';
import { motion } from 'framer-motion';
import ShaderScreenshotSlider, {
    ShaderSlide,
} from '@/components/downloads/ShaderScreenshotSlider';

type Release = {
    version?: string;
    tag_name?: string;
    url: string | null;
    name: string | null;
    assets?: any[];
};

type BuildVariant = {
    arch: string;
    label: string;
    description: string;
    url: string | null;
};

const DIRECT_DOWNLOAD_FALLBACKS = {
    windows: {
        x64: 'https://github.com/devcodex2025/minebench-mining-benchmark-client/releases/download/v0.8.9/MineBench.Client_0.8.9_x64-setup.exe',
        msi: 'https://github.com/devcodex2025/minebench-mining-benchmark-client/releases/download/v0.8.9/MineBench.Client_0.8.9_x64_en-US.msi',
    },
    macos: {
        universal: 'https://github.com/devcodex2025/minebench-mining-benchmark-client/releases/download/v0.8.9/MineBench.Client_0.8.9_universal.dmg',
    },
    linux: {
        appimage: 'https://github.com/devcodex2025/minebench-mining-benchmark-client/releases/download/v0.8.9/MineBench.Client_0.8.9_amd64.AppImage',
        deb: 'https://github.com/devcodex2025/minebench-mining-benchmark-client/releases/download/v0.8.9/MineBench.Client_0.8.9_amd64.deb',
        rpm: 'https://github.com/devcodex2025/minebench-mining-benchmark-client/releases/download/v0.8.9/MineBench.Client-0.8.9-1.x86_64.rpm',
    },
} as const;

const APP_SCREENSHOTS: ShaderSlide[] = [
    {
        src: "/screenshots/app-overview-screenshots/dashboard.png",
        title: "Global Dashboard",
        eyebrow: "Dashboard",
        description: "See balances, rates, and mining health in a single command-center view built for fast scanning.",
    },
    {
        src: "/screenshots/app-overview-screenshots/mining.png",
        title: "Mining Engine",
        eyebrow: "Mining mode",
        description: "Start, pause, and inspect the miner without leaving the desktop workflow or dropping into the terminal.",
    },
    {
        src: "/screenshots/app-overview-screenshots/benchmarks.png",
        title: "Verification Lab",
        eyebrow: "Benchmarks",
        description: "Run hashrate checks with duration, telemetry, and a cleaner result surface for hardware comparison.",
    },
    {
        src: "/screenshots/app-overview-screenshots/statistics.png",
        title: "Pool Analytics",
        eyebrow: "Statistics",
        description: "Review workers, accepted shares, and rolling performance data beside the rest of the client flow.",
    },
    {
        src: "/screenshots/app-overview-screenshots/settings.png",
        title: "Advanced Tuning",
        eyebrow: "Settings",
        description: "Adjust miner behavior and system-level options through a tighter control panel instead of scattered dialogs.",
    },
    {
        src: "/screenshots/app-overview-screenshots/premium.png",
        title: "Premium Console",
        eyebrow: "Premium",
        description: "Expose deeper mining controls and routing without breaking the visual language of the core client.",
    },
    {
        src: "/screenshots/app-overview-screenshots/system-logs.png",
        title: "System Diagnostics",
        eyebrow: "Logs",
        description: "Inspect logs and runtime signals while keeping the rest of the application context close at hand.",
    },
];

export default function DownloadsPageClient() {
    const [clientRelease, setClientRelease] = useState<Release | null>(null);
    const [builds, setBuilds] = useState<Record<string, BuildVariant[]>>({
        windows: [],
        macos: [],
        linux: [],
    });
    const [loading, setLoading] = useState(true);
    const [showcaseProgress, setShowcaseProgress] = useState(0);
    const showcaseVideoRef = useRef<HTMLVideoElement>(null);

    const platformInfo = {
        windows: {
            name: 'Windows',
            icon: WindowsIcon,
            description: 'Windows 10/11 (x64, ARM64)',
            cpu: 'Intel/AMD processors, Snapdragon 7c+',
            gpu: 'NVIDIA, AMD Radeon',
        },
        macos: {
            name: 'macOS',
            icon: MacOSIcon,
            description: 'macOS 11+ (Intel & Apple Silicon)',
            cpu: 'Intel Core, Apple M-series',
            gpu: 'AMD Radeon, Intel Iris, Apple GPU',
        },
        linux: {
            name: 'Linux',
            icon: LinuxIcon,
            description: 'Ubuntu/Debian/Fedora (x64)',
            cpu: 'Any Linux-compatible processor',
            gpu: 'NVIDIA, AMD Radeon',
        },
    };

    const handleDownloadClick = async (platform: string, arch: string) => {
        try {
            await fetch('/api/increment-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'client', platform, arch }),
            });
        } catch (error) {
            console.error('Error tracking download:', error);
        }
    };

    useEffect(() => {
        const fetchReleases = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/releases');
                
                if (!res.ok) throw new Error('Failed to fetch releases');
                
                const { client: clientData } = await res.json();

                if (clientData) {
                    setClientRelease({
                        ...clientData,
                        version: clientData.tag_name,
                    });
                    processBuildVariants(clientData);
                } else {
                    // Fallback
                    const fallbackRelease = {
                        url: '',
                        name: 'v0.8.9',
                        tag_name: 'v0.8.9',
                        version: 'v0.8.9',
                        assets: []
                    };
                    setClientRelease(fallbackRelease as Release);
                    processBuildVariants(fallbackRelease);
                }
            } catch (err) {
                console.error(err);
                const fallbackRelease = {
                    url: '',
                    name: 'v0.8.9',
                    tag_name: 'v0.8.9',
                    version: 'v0.8.9',
                    assets: []
                };
                setClientRelease(fallbackRelease as Release);
                processBuildVariants(fallbackRelease);
            } finally {
                setLoading(false);
            }
        };

        const processBuildVariants = (release: any) => {
            const newBuilds: Record<string, BuildVariant[]> = {
                windows: [],
                macos: [],
                linux: [],
            };

            const assets = release.assets || [];
            
            if (assets.length > 0) {
                const findAssetUrl = (predicate: (name: string) => boolean) => {
                    const item = assets.find((a: any) => typeof a?.name === 'string' && predicate(a.name));
                    return item?.browser_download_url || null;
                };

                // Match Windows installers (.exe) by arch markers in name
                newBuilds.windows = [
                    {
                        arch: 'x64',
                        label: '64-bit Intel/AMD',
                        description: 'For standard 64-bit Windows systems',
                        url: findAssetUrl((n) => n.endsWith('.exe') && (n.includes('x64-') || n.includes('x64.'))),
                    },
                    {
                        arch: 'msi',
                        label: 'MSI Installer',
                        description: 'For managed Windows installs and enterprise deployment',
                        url: findAssetUrl((n) => n.endsWith('.msi')),
                    },
                ];

                // Match macOS universal DMG first, then arch-specific names.
                const universalMacDmg = findAssetUrl((n) => n.endsWith('.dmg') && n.includes('universal'));
                newBuilds.macos = [
                    {
                        arch: 'universal',
                        label: 'Universal',
                        description: 'For Intel and Apple Silicon Mac computers',
                        url: universalMacDmg || findAssetUrl((n) => n.endsWith('.dmg')),
                    },
                ];

                // Match Linux packages.
                newBuilds.linux = [
                    {
                        arch: 'appimage',
                        label: 'AppImage',
                        description: 'Portable Linux package for x86-64 systems',
                        url: findAssetUrl((n) => n.endsWith('.AppImage')),
                    },
                    {
                        arch: 'deb',
                        label: 'Debian/Ubuntu',
                        description: 'DEB package for Debian-based distributions',
                        url: findAssetUrl((n) => n.endsWith('.deb')),
                    },
                    {
                        arch: 'rpm',
                        label: 'Fedora/RHEL',
                        description: 'RPM package for Fedora, RHEL, and compatible distributions',
                        url: findAssetUrl((n) => n.endsWith('.rpm')),
                    },
                ];
            } else {
                // Direct-download fallback URLs when GitHub API assets are unavailable.
                newBuilds.windows = [
                    { arch: 'x64', label: '64-bit Intel/AMD', description: 'For standard 64-bit Windows systems', url: DIRECT_DOWNLOAD_FALLBACKS.windows.x64 },
                    { arch: 'msi', label: 'MSI Installer', description: 'For managed Windows installs and enterprise deployment', url: DIRECT_DOWNLOAD_FALLBACKS.windows.msi },
                ];
                newBuilds.macos = [
                    { arch: 'universal', label: 'Universal', description: 'For Intel and Apple Silicon Mac computers', url: DIRECT_DOWNLOAD_FALLBACKS.macos.universal },
                ];
                newBuilds.linux = [
                    { arch: 'appimage', label: 'AppImage', description: 'Portable Linux package for x86-64 systems', url: DIRECT_DOWNLOAD_FALLBACKS.linux.appimage },
                    { arch: 'deb', label: 'Debian/Ubuntu', description: 'DEB package for Debian-based distributions', url: DIRECT_DOWNLOAD_FALLBACKS.linux.deb },
                    { arch: 'rpm', label: 'Fedora/RHEL', description: 'RPM package for Fedora, RHEL, and compatible distributions', url: DIRECT_DOWNLOAD_FALLBACKS.linux.rpm },
                ];
            }

            setBuilds(newBuilds);
        };

        fetchReleases();
    }, []);

    const PlatformSection = ({ platform, variants }: { platform: 'windows' | 'macos' | 'linux'; variants: BuildVariant[] }) => {
        const info = platformInfo[platform];
        
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: platform === 'windows' ? 0.1 : platform === 'macos' ? 0.2 : 0.3 }}
                className="border-2 border-zinc-800 hover:border-yellow-400 transition-all duration-300 p-8"
            >
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-900">
                    <Image 
                        src={info.icon} 
                        alt={info.name}
                        width={48}
                        height={48}
                        className="w-12 h-12"
                    />
                    <div>
                        <h3 className="text-2xl font-bold text-white uppercase tracking-wide">{info.name}</h3>
                        <p className="text-xs text-zinc-400 mt-1">{info.description}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                        <Cpu className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-zinc-300 uppercase tracking-wide">CPU Support</p>
                            <p className="text-sm text-zinc-400">{info.cpu}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <HardDrive className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-zinc-300 uppercase tracking-wide">GPU Support</p>
                            <p className="text-sm text-zinc-400">{info.gpu}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    {variants.map((variant) => (
                        <div
                            key={variant.arch}
                            className="border border-zinc-700 hover:border-yellow-400/50 p-3 transition-all"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-bold text-white text-sm uppercase tracking-wide">{variant.label}</p>
                                    <p className="text-xs text-zinc-400 mt-1">{variant.description}</p>
                                </div>
                                <div className="px-3 py-2 border border-yellow-500/50 text-yellow-500 text-[10px] font-bold uppercase whitespace-nowrap">
                                    STABLE RELEASE
                                </div>
                            </div>
                            {variant.url ? (
                                <a
                                    href={variant.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleDownloadClick(platform, variant.arch)}
                                    className="mt-4 inline-flex items-center gap-2 bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-white"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </a>
                            ) : (
                                <div className="mt-4 inline-flex items-center gap-2 border border-zinc-700 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                                    <Download className="w-4 h-4" />
                                    Coming Soon
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-black flex flex-col">
            <Scene3D />
            <Header />

            <main className="flex-grow pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16 border-b border-zinc-900 pb-12"
                    >
                        <div className="flex flex-col items-center mb-8">
                            <div className="flex items-start gap-6 mb-8">
                                <Image 
                                    src="/img/minebench-logo-yellow.png" 
                                    alt="MineBench" 
                                    width={100} 
                                    height={100}
                                    className="w-20 h-20 flex-shrink-0"
                                    priority
                                />
                                <div className="flex flex-col text-left">
                                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter uppercase leading-none">
                                        MineBench
                                    </h1>
                                    {clientRelease && (
                                        <p className="text-xl text-yellow-400 font-bold uppercase tracking-[0.3em] mt-2">
                                            {clientRelease.version}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Media Showcase */}
                        <div className="max-w-4xl mx-auto mb-12 border border-zinc-800 p-2 bg-zinc-950">
                            <div className="aspect-video relative overflow-hidden group">
                                <video 
                                    ref={showcaseVideoRef}
                                    className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                    onTimeUpdate={(e) => {
                                        const video = e.currentTarget;
                                        const progress = video.duration ? (video.currentTime / video.duration) * 100 : 0;
                                        setShowcaseProgress(progress);
                                    }}
                                >
                                    <source src="/video/MineBench-0.6.1.-showcase.mp4" type="video/mp4" />
                                </video>
                                <div className="absolute left-0 right-0 top-0 z-10 h-1 bg-black/40">
                                    <div
                                        className="h-full bg-yellow-400 transition-[width] duration-150"
                                        style={{ width: `${showcaseProgress}%` }}
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                    <div className="text-left">
                                        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-[0.3em] border border-yellow-400/30 px-2 py-1 mb-2 inline-block">SHOWCASE</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Large Download CTA */}
                        <div className="flex justify-center mb-20">
                            <motion.button
                                onClick={() => {
                                    const el = document.getElementById('download-section');
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative bg-yellow-400 text-black px-12 py-5 font-black uppercase tracking-tighter text-2xl flex items-center gap-4 hover:bg-white transition-colors overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                                <Download className="w-8 h-8 group-hover:bounce" />
                                DOWNLOAD MINEBENCH
                            </motion.button>
                        </div>

                    {/* Application Overview Section */}
                    <div className="mb-24">
                        <div className="flex items-center gap-4 mb-10 border-b border-zinc-900 pb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Application Overview</h2>
                                <p className="text-xs text-zinc-500 font-mono uppercase mt-1">Desktop mining infrastructure</p>
                            </div>
                        </div>

                        <ShaderScreenshotSlider slides={APP_SCREENSHOTS} />
                    </div>

                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto text-center font-sans font-semibold tracking-wide uppercase">
                        OPTIMIZED CPU MINING BENCHMARK
                    </p>
                </motion.div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {[
                            { title: "HYBRID CORE", desc: "Simultaneous CPU & GPU optimization for maximum hashrate." },
                            { title: "AUTO-NODE", desc: "Automatically switches to the lowest latency mining node." },
                            { title: "SILENT MODE", desc: "Runs in background with minimal system impact and noise." },
                            { title: "REAL-TIME", desc: "Instant sync with the live dashboard and network stats." }
                        ].map((f, i) => (
                            <div key={i} className="p-6 border border-zinc-900 bg-zinc-950">
                                <h4 className="text-yellow-400 font-bold uppercase text-xs tracking-widest mb-2">{f.title}</h4>
                                <p className="text-zinc-500 text-[10px] uppercase leading-relaxed font-mono">{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Platform Sections */}
                    <div
                        id="download-section"
                        className={`grid gap-8 mb-16 ${
                            builds.macos.some((variant) => Boolean(variant.url))
                                ? 'grid-cols-1 md:grid-cols-3'
                                : 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
                        }`}
                    >
                        <PlatformSection platform="windows" variants={builds.windows} />
                        {builds.macos.some((variant) => Boolean(variant.url)) && (
                            <PlatformSection platform="macos" variants={builds.macos} />
                        )}
                        <PlatformSection platform="linux" variants={builds.linux} />
                    </div>

                    {/* Important Notice Section */}
                    <div className="border border-orange-500/60 bg-orange-500/10 p-8 mb-12 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap className="w-32 h-32 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-orange-500 mb-4 uppercase tracking-tighter flex items-center justify-center gap-3">
                            <TrendingUp className="w-6 h-6" />
                            REWARD SYSTEM STATUS: TESTING
                        </h3>
                        <div className="max-w-3xl mx-auto space-y-4 text-zinc-300 text-sm leading-relaxed">
                            <p>
                                The automated reward system is currently in <strong className="text-white">Beta Testing</strong>.
                                Benchmark submissions still appear on the live dashboard, but <span className="text-orange-400 font-bold">direct rewards are temporarily disabled</span> while the payout flow is being verified.
                            </p>
                            <p>
                                Reward eligibility for the public launch is planned around valid benchmark submissions, stable miner participation, a configured wallet, and compliance with the anti-spam / anti-duplicate device rules that will be announced before payouts go live.
                            </p>
                            <p>
                                Join our Discord for testing updates, reward rules, and launch announcements:{' '}
                                <a
                                    href="https://discord.gg/vsDyYh4rma"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-orange-300 underline decoration-orange-400/50 underline-offset-4 transition-colors hover:text-white"
                                >
                                    Join MineBench Discord
                                </a>
                            </p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="border border-yellow-400/40 bg-yellow-400/5 p-8 mb-12 text-center"
                    >
                        <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide">
                            Want More Mining Control?
                        </h3>
                        <p className="text-zinc-300 text-sm max-w-3xl mx-auto leading-relaxed mb-6">
                            If you want more features than the free app includes, upgrade to MineBench Premium for direct wallet routing, P2Pool and custom pool support, RandomX tuning, huge pages, and full mining control through a cleaner UI.
                        </p>
                        <Link
                            href="/premium"
                            className="inline-flex items-center justify-center rounded-full border border-yellow-400/50 bg-yellow-400 px-6 py-3 text-sm font-black uppercase tracking-[0.24em] text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_0_24px_rgba(250,204,21,0.24)]"
                        >
                            Explore Premium Features
                        </Link>
                    </motion.div>

                    {/* Security Notice */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="border border-yellow-500/60 bg-yellow-500/5 p-6 mb-12"
                    >
                        <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                            Security / Antivirus Notice
                        </h3>
                        <p className="text-zinc-300 mb-4 text-sm">
                            Mining software can be flagged as a false-positive by antivirus. If you trust the download, add the app to exclusions to prevent deletion during install or first launch.
                        </p>
                        <div className="space-y-3 text-zinc-200 text-sm">
                            <div className="flex gap-3">
                                <span className="text-yellow-400 font-bold font-mono-system">1.</span>
                                <p>Verify you downloaded from the official GitHub release on this page.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-yellow-400 font-bold font-mono-system">2.</span>
                                <p>Windows Defender: Settings → Privacy & security → Windows Security → Virus & threat protection → Manage settings → Exclusions → Add or remove exclusions → Add folder (point to the installed MineBench directory).</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-yellow-400 font-bold font-mono-system">3.</span>
                                <p>Other AV: add the installation folder or executable to the allowlist/exclusions list before first launch.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-yellow-400 font-bold font-mono-system">4.</span>
                                <p>Keep antivirus enabled; only exclude the miner folder to avoid accidental removal.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Installation Guide */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="border border-zinc-900 p-8 mb-12"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-wide border-b border-zinc-900 pb-4">
                            INSTALLATION GUIDE
                        </h3>

                        <div className="space-y-3 text-zinc-400">
                            <div className="flex gap-4">
                                <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">01.</span>
                                <p>Download the appropriate version for your operating system and architecture above.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">02.</span>
                                <p><strong>Windows:</strong> Run the installer and follow the wizard. <strong>macOS/Linux:</strong> Extract and run the application.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">03.</span>
                                <p>Configure your wallet address and pool settings in the application.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">04.</span>
                                <p>Use the thread slider to select how many CPU cores to use for mining.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">05.</span>
                                <p>Start mining and monitor your hashrate, temperature, and rewards in real-time.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* System Requirements */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="border border-yellow-400/50 bg-yellow-400/5 p-8"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-wide border-b border-yellow-400/50 pb-4">
                            System Requirements
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-zinc-400">
                            <div>
                                <h4 className="text-yellow-400 font-bold mb-3 uppercase text-sm">Minimum</h4>
                                <ul className="list-disc list-inside space-y-2 text-sm ml-2">
                                    <li>4 GB RAM</li>
                                    <li>2 GB free disk space</li>
                                    <li>Quad-core processor</li>
                                    <li>Internet connection</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-yellow-400 font-bold mb-3 uppercase text-sm">Recommended</h4>
                                <ul className="list-disc list-inside space-y-2 text-sm ml-2">
                                    <li>8+ GB RAM</li>
                                    <li>4 GB free disk space</li>
                                    <li>8+ core processor</li>
                                    <li>Gigabit internet</li>
                                    <li>Dedicated GPU (NVIDIA/AMD)</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="border border-zinc-800 bg-zinc-950 p-8 mt-12"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-wide border-b border-zinc-900 pb-4">
                            Open Mining Stack
                        </h3>
                        <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
                            <p>
                                MineBench uses the official <span className="font-bold text-white">XMRig miner</span> as the mining engine foundation. If you want to review the upstream mining software, you can check the official project and binaries here:{' '}
                                <a
                                    href="https://xmrig.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-yellow-400 underline decoration-yellow-400/40 underline-offset-4 transition-colors hover:text-white"
                                >
                                    xmrig.com
                                </a>
                                .
                            </p>
                            <p>
                                MineBench adds its own desktop UI, benchmark workflow, dashboard integration, telemetry views, and release packaging on top of that mining stack.
                            </p>
                            <p>
                                You can study the MineBench application source code on GitHub here:{' '}
                                <a
                                    href="https://github.com/devcodex2025/minebench-mining-benchmark-client"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-yellow-400 underline decoration-yellow-400/40 underline-offset-4 transition-colors hover:text-white"
                                >
                                    MineBench Client GitHub Repository
                                </a>
                                .
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />

        </div>
    );
}

