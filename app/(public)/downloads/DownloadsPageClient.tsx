import 'server-only';

import SpotlightCard from '@/components/reactbits/SpotlightCard';
import DeferredScreenshotGallery from '@/components/downloads/DeferredScreenshotGallery';

import Link from "next/link";
import { Cpu, HardDrive, TrendingUp, Zap } from "lucide-react";
import Image from "next/image";
import WindowsIcon from "@/public/img/windows.svg";
import MacOSIcon from "@/public/img/macos-logo.svg";
import LinuxIcon from "@/public/img/linux-logo.svg";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ChooseDownloadButton, DownloadBuildLink, DownloadReleaseNotesLink, DownloadReleaseProvider } from './DownloadActions';
import { Badge } from '@/components/base/badges/badge';
import type { ShaderSlide } from '@/components/downloads/ShaderScreenshotSlider';
import DeferredVideo from '@/components/marketing/DeferredVideo';

type Release = {
    version?: string;
    tag_name?: string;
    url?: string | null;
    html_url?: string | null;
    name: string | null;
    assets?: Array<{ name: string; browser_download_url: string; platform?: string; architecture?: string; package?: string; size?: number; sha256?: string }>;
    metadataStatus?: 'live' | 'fallback';
    provider?: 'github' | 'bitbucket';
    sourceSha?: string;
    releaseId?: number;
    catalogDigest?: string;
};

type BuildVariant = {
    arch: string;
    label: string;
    description: string;
    url: string | null;
    size?: number;
    sha256?: string;
};

const availableOnly = (variants: BuildVariant[]) => variants.filter((variant) => Boolean(variant.url));


export const createBuildVariants = (release: Release | null): Record<string, BuildVariant[]> => {
    const assets = release?.assets || [];
    const findAssetUrl = (predicate: (asset: NonNullable<Release['assets']>[number]) => boolean) => {
        const item = assets.find((a) => typeof a?.name === 'string' && predicate(a));
        return item?.browser_download_url || null;
    };

    const variants = {
        windows: availableOnly([
            {
                arch: 'x64',
                label: '64-bit Intel/AMD',
                description: 'For standard 64-bit Windows systems',
                url: findAssetUrl((a) => a.platform ? a.platform === 'windows' && a.architecture === 'x86_64' && a.package === 'nsis' : a.name.endsWith('.exe') && (a.name.includes('x64-') || a.name.includes('x64.'))),
            },
            {
                arch: 'msi',
                label: 'MSI Installer',
                description: 'For managed Windows installs and enterprise deployment',
                url: findAssetUrl((a) => a.platform ? a.platform === 'windows' && a.architecture === 'x86_64' && a.package === 'msi' : a.name.endsWith('.msi')),
            },
        ]),
        macos: availableOnly([
            {
                arch: 'x86_64',
                label: 'Intel',
                description: 'For Intel Mac computers',
                url: findAssetUrl((a) => a.platform ? a.platform === 'macos' && a.architecture === 'x86_64' && a.package === 'dmg' : a.name.endsWith('.dmg') && (a.name.toLowerCase().includes('x86_64') || a.name.toLowerCase().includes('intel'))),
            },
            {
                arch: 'aarch64',
                label: 'Apple Silicon',
                description: 'For Apple Silicon Mac computers',
                url: findAssetUrl((a) => a.platform ? a.platform === 'macos' && a.architecture === 'aarch64' && a.package === 'dmg' : a.name.endsWith('.dmg') && (a.name.toLowerCase().includes('aarch64') || a.name.toLowerCase().includes('arm64'))),
            },
        ]),
        linux: availableOnly([
            {
                arch: 'appimage',
                label: 'AppImage',
                description: 'Portable Linux package for x86-64 systems',
                url: findAssetUrl((a) => a.platform ? a.platform === 'linux' && a.architecture === 'x86_64' && a.package === 'appimage' : a.name.endsWith('.AppImage')),
            },
            {
                arch: 'deb',
                label: 'Debian/Ubuntu',
                description: 'DEB package for Debian-based distributions',
                url: findAssetUrl((a) => a.platform ? a.platform === 'linux' && a.architecture === 'x86_64' && a.package === 'deb' : a.name.endsWith('.deb')),
            },
            {
                arch: 'rpm',
                label: 'Fedora/RHEL',
                description: 'RPM package for Fedora, RHEL, and compatible distributions',
                url: findAssetUrl((a) => a.platform ? a.platform === 'linux' && a.architecture === 'x86_64' && a.package === 'rpm' : a.name.endsWith('.rpm')),
            },
        ]),
    };
    return Object.fromEntries(Object.entries(variants).map(([platform, entries]) => [platform, entries.map(variant => {
        const asset = assets.find(a => a.browser_download_url === variant.url);
        return { ...variant, size: asset?.size, sha256: asset?.sha256 };
    })]));
};

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

export default function DownloadsPageClient({ initialClientRelease }: { initialClientRelease: Release | null }) {
    const clientRelease = initialClientRelease;
    const builds = createBuildVariants(initialClientRelease);
    const loading = false;
    const isFallbackRelease = initialClientRelease?.metadataStatus === 'fallback';

    const platformInfo = {
        windows: {
            name: 'Windows',
            icon: WindowsIcon,
            description: 'Windows x64 build',
            cpu: '64-bit Intel/AMD processors',
            gpu: 'GPU mining is not available in this client',
        },
        macos: {
            name: 'macOS',
            icon: MacOSIcon,
            description: 'macOS build when listed below',
            cpu: 'Supported architecture depends on the listed release asset',
            gpu: 'GPU mining is not available in this client',
        },
        linux: {
            name: 'Linux',
            icon: LinuxIcon,
            description: 'Ubuntu/Debian/Fedora (x64)',
            cpu: '64-bit x86-64 Intel/AMD processors',
            gpu: 'GPU mining is not available in this client',
        },
    };

    const renderPlatformSection = ({ platform, variants }: { platform: 'windows' | 'macos' | 'linux'; variants: BuildVariant[] }) => {
        const info = platformInfo[platform];
        
        return (
            <div key={platform}
                className="surface-panel p-6 sm:p-8 transition-colors hover:border-yellow-400/30"
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
                    {variants.map((variant) => variant.url && (
                        <div
                            key={variant.arch}
                            className="rounded-xl border border-zinc-700 hover:border-yellow-400/50 p-3 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium text-white text-sm">{variant.label}</p>
                                    <p className="text-xs text-zinc-400 mt-1">{variant.description}</p>
                                </div>
                                <Badge>{isFallbackRelease ? 'Verified cached release' : 'Release'}</Badge>
                            </div>
                            {variant.size && <p className="mt-2 text-xs text-zinc-400">{(variant.size / 1024 / 1024).toFixed(1)} MiB</p>}
                            {variant.sha256 && <p className="mt-2 break-all text-xs text-zinc-400">SHA-256: <code>{variant.sha256}</code></p>}
                            <DownloadBuildLink href={variant.url} platform={platform} arch={variant.arch} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="board-page refresh-downloads min-h-screen relative overflow-hidden bg-black flex flex-col">
            <Header />

            <main id="refresh-content" tabIndex={-1} className="flex-grow pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div
                        className="refresh-download-cover text-center mb-16 border-b border-zinc-900 pb-12"
                    >
                        <div className="flex flex-col items-center mb-8">
                            <div className="flex items-start gap-6 mb-8">
                                <Image 
                                    src="/img/minebench-logo-yellow-256.webp" unoptimized
                                    alt="MineBench" 
                                    width={100} 
                                    height={100}
                                    className="w-20 h-20 flex-shrink-0"
                                    priority
                                />
                                <div className="flex flex-col text-left">
                                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter uppercase leading-none">
                                        Download MineBench
                                    </h1>
                                    {clientRelease && (
                                        <p className="text-sm text-yellow-400 font-medium mt-3">
                                            {clientRelease.version || clientRelease.tag_name}{isFallbackRelease && ' · Verified cached release'}
                                        </p>
                                    )}
                                    {isFallbackRelease && (
                                        <p className="mt-3 max-w-xl text-left text-xs leading-5 text-amber-200">
                                            Live release verification is temporarily unavailable. These files come from a previously verified catalog within its allowed cache window.
                                        </p>
                                    )}
                                    {loading && (
                                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                                            Refreshing release files...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Media Showcase */}
                        <div className="surface-panel max-w-4xl mx-auto mb-8 p-2">
                            <div className="aspect-video relative overflow-hidden rounded-xl group">
                                <DeferredVideo
                                    priority
                                    src="/video/MineBench-0.6.1.-showcase.mp4"
                                    poster="/screenshots/MineBench-Pool-stats-cards.jpg"
                                    width={1920}
                                    height={1080}
                                    className="h-full w-full object-contain opacity-80 transition-opacity group-hover:opacity-100"
                                    label="MineBench client showcase video"
                                />
                                <div className="absolute left-0 right-0 top-0 z-10 h-1 bg-black/40">
                                    <div
                                        className="h-full bg-yellow-400 transition-[width] duration-150"
                                        style={{ width: '0%' }}
                                    />
                                </div>
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                    <div className="text-left">
                                        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-[0.3em] border border-yellow-400/30 px-2 py-1 mb-2 inline-block">SHOWCASE</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Large Download CTA */}
                        <div className="flex justify-center mb-20">
                            <ChooseDownloadButton />
                        </div>

                    {/* Application Overview Section */}
                        <div id="application-overview" className="mb-24 scroll-mt-28">
                        <div className="flex items-center gap-4 mb-10 border-b border-zinc-900 pb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Application Overview</h2>
                                <p className="text-xs text-zinc-500 font-mono uppercase mt-1">Desktop mining infrastructure</p>
                            </div>
                        </div>

                        <DeferredScreenshotGallery slides={APP_SCREENSHOTS} />
                    </div>

                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto text-center font-sans font-semibold tracking-wide uppercase">
                        OPTIMIZED CPU MINING BENCHMARK
                    </p>
                </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {[
                            { title: "Benchmarks", desc: "Run a test and inspect the reported hashrate for your hardware." },
                            { title: "Hardware comparison", desc: "Compare your device with public CPU and GPU benchmark submissions." },
                            { title: "Pool statistics", desc: "View workers, accepted shares, and pool activity in the client." },
                            { title: "Optional Premium", desc: "Add custom wallet and pool settings when you need more control." }
                        ].map((f, i) => (
                            <SpotlightCard key={i} className="surface-panel p-6">
                                <h3 className="text-yellow-400 font-semibold text-sm mb-2">{f.title}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                            </SpotlightCard>
                        ))}
                    </div>

                    <div className="mb-20 grid gap-5 md:grid-cols-3" aria-label="Mining benchmark setup guides">
                        {[
                            ['Run a RandomX CPU benchmark', '/guides/randomx-benchmarking'],
                            ['Measure hashrate per watt', '/guides/measure-hashrate-per-watt'],
                            ['Verify your MineBench download', '/guides/verify-minebench-download'],
                        ].map(([label, href]) => (
                            <Link key={href} href={href} className="surface-panel p-5 text-sm font-semibold text-yellow-300 transition-colors hover:text-white">
                                {label} <span aria-hidden="true">→</span>
                            </Link>
                        ))}
                    </div>

                    {/* Platform Sections */}
                    <DownloadReleaseProvider initialClientRelease={initialClientRelease}>
                    <div
                        id="download-section"
                        className="scroll-mt-28 grid grid-cols-1 gap-8 mb-16 md:grid-cols-2 xl:grid-cols-3"
                    >
                        {([
                            ['windows', builds.windows],
                            ['macos', builds.macos],
                            ['linux', builds.linux],
                        ] as const)
                            .filter(([, variants]) => variants.length > 0)
                            .map(([platform, variants]) => (
                                renderPlatformSection({ platform, variants })
                            ))}
                        {!loading && ![builds.windows, builds.macos, builds.linux].some((variants) => variants.length > 0) && (
                            <div className="col-span-full rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center">
                                <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">No builds available</p>
                                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                                    Downloads are temporarily unavailable. Refresh this page later, or join our Discord for release updates.
                                </p>
                            </div>
                        )}
                    </div>


                    {/* Reward System Section */}
                    <div className="rounded-2xl border border-emerald-400/50 bg-emerald-400/10 p-8 mb-12 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap className="w-32 h-32 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-emerald-400 mb-4 uppercase tracking-tighter flex items-center justify-center gap-3">
                            <TrendingUp className="w-6 h-6" />
                            REWARD SYSTEM: LIVE
                        </h3>
                        <div className="max-w-3xl mx-auto space-y-4 text-zinc-300 text-sm leading-relaxed">
                            <p>
                                MineBench rewards are active. Connect your Solana wallet in the desktop app and mine through the MineBench pool. Authenticated mining sessions contribute accepted shares to the current reward window.
                            </p>
                            <p>
                                When P2Pool confirms earned XMR, MineBench divides the reward proportionally to each miner&apos;s accepted shares, converts the XMR value to <strong className="text-white">BMT at the current XMR/BMT rate</strong>, and credits the confirmed BMT balance in the app.
                            </p>
                            <p>
                                The client shows your current reward-window share, confirmed balance, and reward history. Use <strong className="text-white">Claim</strong> to review the estimated Solana payout cost and request a BMT transfer to your connected wallet; the payout cost is deducted from the claimed amount.
                            </p>
                            <p>
                                <strong className="text-white">MineBench Premium</strong> is an optional upgrade for direct XMR wallet routing, P2Pool and custom pool support, RandomX tuning, huge pages, and advanced mining controls.
                            </p>
                            <p>
                                <strong className="text-white">Benchmark rewards</strong> depend on how many accepted shares your miner finds while the benchmark is running. Only shares linked to your authenticated Solana wallet and accepted by the server count toward the reward calculation; more accepted shares mean a larger benchmark reward.
                            </p>
                            <p>
                                <strong className="text-white">Stress tests</strong> run a sustained RandomX CPU load while tracking hashrate, temperature, and power in real time. Connect your Solana wallet before starting: pool-verified shares found during the test count toward your BMT reward, while unverified client-reported shares are ignored. The test stops automatically if temperature or power telemetry becomes unavailable.
                            </p>
                            <p>
                                Join our Discord for reward updates and support:{' '}
                                <a
                                    href="https://discord.gg/vsDyYh4rma"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-emerald-300 underline decoration-emerald-400/50 underline-offset-4 transition-colors hover:text-white"
                                >
                                    Join MineBench Discord
                                </a>
                            </p>
                        </div>
                    </div>

                    <div
                        className="rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-8 mb-12 text-center"
                    >
                        <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide">
                            Want to choose your own wallet and pool?
                        </h3>
                        <p className="text-zinc-300 text-sm max-w-3xl mx-auto leading-relaxed mb-6">
                            Premium adds custom Monero wallet routing and P2Pool or custom pool settings.
                            CPU tuning and benchmarks remain available in the free client. Compare the plans before upgrading.
                        </p>
                        <Link
                            href="/premium"
                            className="inline-flex items-center justify-center rounded-full border border-yellow-400/50 bg-yellow-400 px-6 py-3 text-sm font-black uppercase tracking-[0.24em] text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_0_24px_rgba(250,204,21,0.24)]"
                        >
                            Explore Premium Features
                        </Link>
                    </div>

                    {clientRelease?.provider === 'github' && <p className="mb-8 text-sm text-zinc-300">
                        After installation, MineBench offers a separate verified CPU component setup with its source, publisher, size, and license. Internet access and your consent are required. You can skip setup; mining and benchmarks remain unavailable until setup is complete. Installation never starts mining. Optional sensors may be unavailable.
                        {' '}{clientRelease.html_url && <DownloadReleaseNotesLink href={clientRelease.html_url} />}
                    </p>}
                    {clientRelease?.provider === 'github' && <p className="mb-8 text-sm text-zinc-300">
                        Release metadata and updater packages require cryptographic signatures. These are separate from operating-system publisher signing and macOS notarization. Paid OS signing is deferred for engineering candidates; those candidates do not qualify as stable downloads. Keep operating-system protections enabled.
                    </p>}
                    </DownloadReleaseProvider>
                    {/* Security Notice */}
                    <div
                        className="rounded-2xl border border-yellow-500/60 bg-yellow-500/5 p-6 mb-12"
                    >
                        <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                            Security / Antivirus Notice
                        </h3>
                        <p className="text-zinc-300 mb-4 text-sm">
                            Security software may flag mining components. Verify the publisher and checksum, keep your protections enabled, and request a review from the security vendor if a component is quarantined.
                        </p>
                        <div className="space-y-3 text-zinc-200 text-sm">
                            <div className="flex gap-3">
                                <span className="text-yellow-400 font-bold font-mono-system">1.</span>
                                <p>Use the verified download links on this page. Follow the release notes to verify the package checksum and applicable signatures before installing.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-yellow-400 font-bold font-mono-system">2.</span>
                                <p>If a download is blocked or quarantined, stop setup and review the detection in your security software.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-yellow-400 font-bold font-mono-system">3.</span>
                                <p>Report a suspected false positive to the security vendor with the component version and checksum.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-yellow-400 font-bold font-mono-system">4.</span>
                                <p>Keep antivirus, SmartScreen, and Gatekeeper enabled. Do not add blanket folder exclusions.</p>
                            </div>
                        </div>
                    </div>

                    {/* Installation Guide */}
                    <div
                        className="rounded-2xl border border-zinc-900 p-8 mb-12"
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
                                <p><strong>Windows:</strong> Run the installer and follow the wizard. <strong>macOS:</strong> Open the DMG and copy MineBench to Applications. <strong>Linux:</strong> Install the DEB or RPM with your distribution&apos;s package manager, or make the AppImage executable and run it.</p>
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
                    </div>

                    {/* System Requirements */}
                    <div
                        className="rounded-2xl border border-yellow-400/50 bg-yellow-400/5 p-8"
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
                                    <li>Gigabit intenet</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 mt-12"
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
                                You can study the MineBench application source code on Bitbucket here:{' '}
                                <a
                                    href="https://bitbucket.org/minebenchapp/minebench-client"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-yellow-400 underline decoration-yellow-400/40 underline-offset-4 transition-colors hover:text-white"
                                >
                                    MineBench Client Bitbucket Repository
                                </a>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

        </div>
    );
}
