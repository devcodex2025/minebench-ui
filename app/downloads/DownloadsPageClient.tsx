'use client';

import { useEffect, useState } from "react";
import { Monitor, Download, Cpu, HardDrive } from "lucide-react";
import Image from "next/image";
import WindowsIcon from "@/public/img/windows.svg";
import MacOSIcon from "@/public/img/macos-logo.svg";
import LinuxIcon from "@/public/img/linux-logo.svg";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Scene3D from '@/components/Scene3D';
import { motion } from 'framer-motion';

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

export default function DownloadsPageClient() {
    const [clientRelease, setClientRelease] = useState<Release | null>(null);
    const [builds, setBuilds] = useState<Record<string, BuildVariant[]>>({
        windows: [],
        macos: [],
        linux: [],
    });
    const [loading, setLoading] = useState(true);

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
                        tag_name: 'v0.1.2',
                        version: 'v0.1.2',
                        assets: []
                    };
                    setClientRelease(fallbackRelease as Release);
                    processBuildVariants(fallbackRelease);
                }
            } catch (err) {
                console.error(err);
                const fallbackRelease = {
                    tag_name: 'v0.1.2',
                    version: 'v0.1.2',
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

            // Windows builds
            if (assets.length > 0) {
                newBuilds.windows = [
                    {
                        arch: 'x64',
                        label: '64-bit Intel/AMD',
                        description: 'For standard 64-bit Windows systems',
                        url: assets.find((a: any) => a.name.includes('win') && a.name.includes('x64'))?.browser_download_url || null,
                    },
                    {
                        arch: 'arm64',
                        label: 'ARM64',
                        description: 'For Snapdragon and ARM64 Windows devices',
                        url: assets.find((a: any) => a.name.includes('win') && a.name.includes('arm64'))?.browser_download_url || null,
                    },
                ];
                newBuilds.macos = [
                    {
                        arch: 'x64',
                        label: '64-bit Intel',
                        description: 'For Intel-based Mac computers',
                        url: assets.find((a: any) => a.name.includes('mac') && a.name.includes('x64'))?.browser_download_url || null,
                    },
                    {
                        arch: 'arm64',
                        label: 'Apple Silicon',
                        description: 'For M1/M2/M3 Mac computers',
                        url: assets.find((a: any) => a.name.includes('mac') && a.name.includes('arm64'))?.browser_download_url || null,
                    },
                ];
                newBuilds.linux = [
                    {
                        arch: 'x64',
                        label: '64-bit',
                        description: 'For standard Linux x86-64 systems',
                        url: assets.find((a: any) => a.name.includes('linux') && a.name.includes('x64'))?.browser_download_url || null,
                    },
                ];
            } else {
                // Fallback URLs
                newBuilds.windows = [
                    { arch: 'x64', label: '64-bit Intel/AMD', description: 'For standard 64-bit Windows systems', url: 'https://github.com/devcodex2025/MineBench-Client/releases/latest' },
                    { arch: 'arm64', label: 'ARM64', description: 'For Snapdragon and ARM64 Windows devices', url: 'https://github.com/devcodex2025/MineBench-Client/releases/latest' },
                ];
                newBuilds.macos = [
                    { arch: 'x64', label: '64-bit Intel', description: 'For Intel-based Mac computers', url: 'https://github.com/devcodex2025/MineBench-Client/releases/latest' },
                    { arch: 'arm64', label: 'Apple Silicon', description: 'For M1/M2/M3 Mac computers', url: 'https://github.com/devcodex2025/MineBench-Client/releases/latest' },
                ];
                newBuilds.linux = [
                    { arch: 'x64', label: '64-bit', description: 'For standard Linux x86-64 systems', url: 'https://github.com/devcodex2025/MineBench-Client/releases/latest' },
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
                                {loading ? (
                                    <div className="px-3 py-2 text-zinc-500 text-xs font-bold uppercase whitespace-nowrap">
                                        LOADING
                                    </div>
                                ) : variant.url ? (
                                    <a
                                        href={variant.url}
                                        onClick={() => handleDownloadClick(platform, variant.arch)}
                                        className="flex items-center gap-2 bg-yellow-400 text-black px-3 py-2 hover:bg-yellow-300 transition-all font-bold whitespace-nowrap rounded"
                                        title="Download"
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>
                                ) : (
                                    <div className="px-3 py-2 border border-red-500 text-red-500 text-xs font-bold uppercase">
                                        —
                                    </div>
                                )}
                            </div>
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
                                <div className="flex flex-col">
                                    <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight uppercase">
                                        MineBench
                                    </h1>
                                    {clientRelease && (
                                        <p className="text-lg text-yellow-400 font-bold uppercase tracking-widest mt-1 text-right">
                                            {clientRelease.version}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-mono-system">
                            Cross-platform mining benchmark software
                        </p>
                    </motion.div>

                    {/* Platform Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <PlatformSection platform="windows" variants={builds.windows} />
                        <PlatformSection platform="macos" variants={builds.macos} />
                        <PlatformSection platform="linux" variants={builds.linux} />
                    </div>

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
                </div>
            </main>

            <Footer />
        </div>
    );
}

