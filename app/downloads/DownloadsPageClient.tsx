'use client';

import { useEffect, useState } from "react";
import { Monitor, Download, Cpu, Zap } from "lucide-react";
import Image from "next/image";
import Windows from "@/public/img/windows.svg";
import NvidiaIcon from "@/public/img/nvidia-icon.svg";
import RadeonIcon from "@/public/img/radeon-icon.svg";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Scene3D from '@/components/Scene3D';
import { motion } from 'framer-motion';

type Release = {
    version: string;
    url: string | null;
    name: string | null;
};

export default function DownloadsPageClient() {
    const [cpuRelease, setCpuRelease] = useState<Release | null>(null);
    const [gpuRelease, setGpuRelease] = useState<Release | null>(null);
    const [loading, setLoading] = useState(true);

    const handleDownloadClick = async (type: 'cpu' | 'gpu') => {
        try {
            await fetch('/api/increment-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });
        } catch (error) {
            console.error('Error tracking download:', error);
        }
    };

    useEffect(() => {
        const fetchReleases = async () => {
            setLoading(true);
            try {
                const [cpuRes, gpuRes] = await Promise.all([
                    fetch('https://api.github.com/repos/karbivskyi/MineBench-CPU-ZEPH/releases/latest', {
                        headers: { "Accept": "application/vnd.github+json" }
                    }),
                    fetch('https://api.github.com/repos/karbivskyi/MineBench-GPU-RVN/releases/latest', {
                        headers: { "Accept": "application/vnd.github+json" }
                    })
                ]);

                if (!cpuRes.ok) throw new Error('Failed to fetch CPU release');
                if (!gpuRes.ok) throw new Error('Failed to fetch GPU release');

                const cpuData = await cpuRes.json();
                const gpuData = await gpuRes.json();

                const getAsset = (data: any) =>
                    data.assets.find((a: any) => a.name.endsWith(".zip")) ||
                    data.assets.find((a: any) => a.name.endsWith(".exe"));

                const cpuAsset = getAsset(cpuData);
                const gpuAsset = getAsset(gpuData);

                setCpuRelease({
                    version: cpuData.tag_name,
                    url: cpuAsset ? cpuAsset.browser_download_url : null,
                    name: cpuAsset ? cpuAsset.name : null,
                });

                setGpuRelease({
                    version: gpuData.tag_name,
                    url: gpuAsset ? gpuAsset.browser_download_url : null,
                    name: gpuAsset ? gpuAsset.name : null,
                });
            } catch (err) {
                console.error(err);
                setCpuRelease(null);
                setGpuRelease(null);
            } finally {
                setLoading(false);
            }
        };

        fetchReleases();
    }, []);

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
                        <div className="inline-block border border-yellow-400 p-4 mb-8">
                            <Download className="w-12 h-12 text-yellow-400" />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight uppercase">
                            DOWN
                            <span className="text-yellow-400">LOADS</span>
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-mono-system">
                            Get the latest MineBench clients for CPU and GPU benchmarking.
                        </p>
                    </motion.div>

                    {/* Download Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        {/* CPU CLIENT */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="border-2 border-zinc-800 hover:border-yellow-400 transition-all duration-300 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-900">
                                <div className="w-12 h-12 border border-yellow-400 flex items-center justify-center">
                                    <Cpu className="w-6 h-6 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
                                    CPU CLIENT
                                </h2>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <Image src={Windows} alt="Windows" width={24} height={24} className="opacity-70" />
                                <span className="text-zinc-500 text-sm uppercase tracking-wide font-bold">Windows</span>
                            </div>

                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                Benchmark your CPU performance using the Zephyr algorithm. Optimized for multi-core processors.
                            </p>

                            {loading ? (
                                <div className="border border-zinc-800 px-6 py-3 text-zinc-500 uppercase tracking-wide text-sm font-bold">
                                    LOADING...
                                </div>
                            ) : cpuRelease && cpuRelease.url ? (
                                <a
                                    href={cpuRelease.url}
                                    onClick={() => handleDownloadClick('cpu')}
                                    className="inline-flex items-center gap-3 bg-white text-black px-6 py-3 hover:bg-yellow-400 transition-all font-bold uppercase tracking-wide text-sm"
                                >
                                    <Download className="w-5 h-5" />
                                    DOWNLOAD {cpuRelease.version}
                                </a>
                            ) : (
                                <div className="border border-red-500 px-6 py-3 text-red-500 uppercase tracking-wide text-sm font-bold">
                                    UNAVAILABLE
                                </div>
                            )}
                        </motion.div>

                        {/* GPU CLIENT */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="border-2 border-zinc-800 hover:border-yellow-400 transition-all duration-300 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-900">
                                <div className="w-12 h-12 border border-yellow-400 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
                                    GPU CLIENT
                                </h2>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <Image src={Windows} alt="Windows" width={24} height={24} className="opacity-70" />
                                <span className="text-zinc-500 text-sm uppercase tracking-wide font-bold">Windows</span>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <Image src={NvidiaIcon} alt="Nvidia" width={40} height={40} />
                                <Image src={RadeonIcon} alt="AMD" width={40} height={40} className="filter grayscale opacity-40" />
                            </div>

                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                GPU benchmark using the Ravencoin algorithm. Currently optimized for NVIDIA cards.
                            </p>

                            {loading ? (
                                <div className="border border-zinc-800 px-6 py-3 text-zinc-500 uppercase tracking-wide text-sm font-bold">
                                    LOADING...
                                </div>
                            ) : gpuRelease && gpuRelease.url ? (
                                <a
                                    onClick={() => handleDownloadClick('gpu')}
                                    href={gpuRelease.url}
                                    className="inline-flex items-center gap-3 bg-white text-black px-6 py-3 hover:bg-yellow-400 transition-all font-bold uppercase tracking-wide text-sm"
                                >
                                    <Download className="w-5 h-5" />
                                    DOWNLOAD {gpuRelease.version}
                                </a>
                            ) : (
                                <div className="border border-red-500 px-6 py-3 text-red-500 uppercase tracking-wide text-sm font-bold">
                                    UNAVAILABLE
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Installation Guide */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="border border-zinc-900 p-8"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-wide border-b border-zinc-900 pb-4">
                            INSTALLATION GUIDE
                        </h3>
                        <div className="space-y-4 text-zinc-400">
                            <div className="flex gap-4">
                                <span className="text-yellow-400 font-bold font-mono-system">01.</span>
                                <p>Download the appropriate client for your hardware (CPU or GPU).</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-yellow-400 font-bold font-mono-system">02.</span>
                                <p>Extract the ZIP file to a folder of your choice.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-yellow-400 font-bold font-mono-system">03.</span>
                                <p>Run the executable file as Administrator.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-yellow-400 font-bold font-mono-system">04.</span>
                                <p>Follow the on-screen instructions to complete the benchmark.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-yellow-400 font-bold font-mono-system">05.</span>
                                <p>Results will be automatically uploaded to the Minebench dashboard.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
