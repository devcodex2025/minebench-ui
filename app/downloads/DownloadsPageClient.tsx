'use client';

import { useEffect, useState } from "react";
import { Monitor, Download, Cpu, Zap, AlertTriangle } from "lucide-react";
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
    const [clientRelease, setClientRelease] = useState<Release | null>(null);
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
                // Fetch from our internal API which handles the GitHub token
                const res = await fetch('/api/releases');
                
                if (!res.ok) throw new Error('Failed to fetch releases');
                
                const { cpu: cpuData, gpu: gpuData, client: clientData } = await res.json();

                const getAsset = (data: any) =>
                    data?.assets?.find((a: any) => a.name.endsWith(".zip")) ||
                    data?.assets?.find((a: any) => a.name.endsWith(".exe"));

                // Handle CPU Release
                if (cpuData) {
                    const cpuAsset = getAsset(cpuData);
                    setCpuRelease({
                        version: cpuData.tag_name,
                        url: cpuAsset ? cpuAsset.browser_download_url : null,
                        name: cpuAsset ? cpuAsset.name : null,
                    });
                } else {
                    // Fallback if CPU data is missing but we want to show something
                     setCpuRelease({
                        version: "v0.1.3",
                        url: "https://github.com/karbivskyi/MineBench-CPU-ZEPH/releases/latest",
                        name: "MineBench-CPU-ZEPH.zip"
                    });
                }

                // Handle GPU Release
                if (gpuData) {
                    const gpuAsset = getAsset(gpuData);
                    setGpuRelease({
                        version: gpuData.tag_name,
                        url: gpuAsset ? gpuAsset.browser_download_url : null,
                        name: gpuAsset ? gpuAsset.name : null,
                    });
                } else {
                    // Fallback
                     setGpuRelease({
                        version: "v0.1.3",
                        url: "https://github.com/karbivskyi/MineBench-GPU-RVN/releases/latest",
                        name: "MineBench-GPU-RVN.zip"
                    });
                }

                // Handle Client Release
                if (clientData) {
                    const clientAsset = getAsset(clientData);
                    setClientRelease({
                        version: clientData.tag_name,
                        url: clientAsset ? clientAsset.browser_download_url : null,
                        name: clientAsset ? clientAsset.name : null,
                    });
                } else {
                    // Fallback
                    setClientRelease({
                        version: "v0.1.2",
                        url: "https://github.com/devcodex2025/MineBench-Client/releases/latest",
                        name: "MineBench-Client"
                    });
                }
            } catch (err) {
                console.error(err);
                // Fallback for any error
                setCpuRelease({
                    version: "v0.1.3",
                    url: "https://github.com/karbivskyi/MineBench-CPU-ZEPH/releases/latest",
                    name: "MineBench-CPU-ZEPH.zip"
                });
                setGpuRelease({
                    version: "v0.1.3",
                    url: "https://github.com/karbivskyi/MineBench-GPU-RVN/releases/latest",
                    name: "MineBench-GPU-RVN.zip"
                });
                setClientRelease({
                    version: "v0.1.2",
                    url: "https://github.com/devcodex2025/MineBench-Client/releases/latest",
                    name: "MineBench-Client"
                });
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

                    {/* ANTIVIRUS WARNING */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="border-2 border-yellow-400 bg-yellow-400/10 p-6 mb-16 flex gap-4"
                    >
                        <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-bold text-yellow-400 mb-2 uppercase tracking-wide">
                                ⚠️ Important Notice
                            </h3>
                            <p className="text-zinc-300 leading-relaxed">
                                <strong>This software is a cryptocurrency miner</strong> and may be flagged by your antivirus or Windows Defender as a PUA (Potentially Unwanted Application) or threat. This is normal behavior for mining software. Please add the installation folder to your antivirus whitelist if you encounter any issues. The software is open-source and safe to use.
                            </p>
                        </div>
                    </motion.div>

                    {/* Download Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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

                        {/* MINEBENCH CLIENT (MAIN APP) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="border-2 border-zinc-800 hover:border-yellow-400 transition-all duration-300 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-900">
                                <div className="w-12 h-12 border border-yellow-400 flex items-center justify-center">
                                    <Monitor className="w-6 h-6 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
                                    MAIN APP
                                </h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <Image src={Windows} alt="Windows" width={24} height={24} className="opacity-70" />
                                    <span className="text-zinc-500 text-sm uppercase tracking-wide font-bold">Windows</span>
                                </div>
                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-500 text-sm uppercase tracking-wide font-bold">macOS</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-500 text-sm uppercase tracking-wide font-bold">Linux</span>
                            </div>

                            <p className="text-zinc-400 mb-3 leading-relaxed">
                                Unified desktop application for mining and benchmarking. Features real-time monitoring, 3D visualization, and automatic pool synchronization.
                            </p>

                            <div className="bg-zinc-900 p-4 rounded mb-6 text-sm text-zinc-300">
                                <p><strong>Features:</strong></p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-zinc-400">
                                    <li>Cross-platform (Windows, macOS, Linux)</li>
                                    <li>Real-time hashrate and temperature monitoring</li>
                                    <li>3D reactor visualization</li>
                                    <li>Thread control slider</li>
                                    <li>Pool integration & sync</li>
                                    <li>Rewards tracking</li>
                                </ul>
                            </div>

                            {loading ? (
                                <div className="border border-zinc-800 px-6 py-3 text-zinc-500 uppercase tracking-wide text-sm font-bold">
                                    LOADING...
                                </div>
                            ) : clientRelease && clientRelease.url ? (
                                <a
                                    href={clientRelease.url}
                                    onClick={() => handleDownloadClick('cpu')}
                                    className="inline-flex items-center gap-3 bg-yellow-400 text-black px-6 py-3 hover:bg-yellow-300 transition-all font-bold uppercase tracking-wide text-sm"
                                >
                                    <Download className="w-5 h-5" />
                                    DOWNLOAD {clientRelease.version}
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
                        className="border border-zinc-900 p-8 mb-12"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-wide border-b border-zinc-900 pb-4">
                            INSTALLATION GUIDE
                        </h3>

                        {/* Main App Instructions */}
                        <div className="mb-8">
                            <h4 className="text-lg font-bold text-yellow-400 mb-4 uppercase tracking-wide">MineBench Client (Main App)</h4>
                            <div className="space-y-3 text-zinc-400">
                                <div className="flex gap-4">
                                    <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">01.</span>
                                    <p>Download the latest MineBench Client release for your operating system.</p>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">02.</span>
                                    <p><strong>Windows:</strong> Run the installer (.exe) and follow the installation wizard. <strong>macOS/Linux:</strong> Extract and run the application.</p>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">03.</span>
                                    <p>If flagged by antivirus, add the installation folder to your whitelist.</p>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">04.</span>
                                    <p>Launch the application and configure your wallet and pool settings.</p>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">05.</span>
                                    <p>Use the thread slider to select CPU core count and start mining or benchmarking.</p>
                                </div>
                            </div>
                        </div>

                        {/* Benchmark Instructions */}
                        <div>
                            <h4 className="text-lg font-bold text-yellow-400 mb-4 uppercase tracking-wide">Benchmark Clients (CPU/GPU)</h4>
                            <div className="space-y-3 text-zinc-400">
                                <div className="flex gap-4">
                                    <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">01.</span>
                                    <p>Download the appropriate benchmark client (CPU Zephyr or GPU Ravencoin).</p>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">02.</span>
                                    <p>Extract the ZIP file to a folder of your choice.</p>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">03.</span>
                                    <p>Run the executable file as Administrator.</p>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">04.</span>
                                    <p>Follow the on-screen instructions to complete the benchmark.</p>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-yellow-400 font-bold font-mono-system flex-shrink-0">05.</span>
                                    <p>Results will be automatically uploaded to the Minebench dashboard.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Antivirus Help Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="border border-yellow-400/50 bg-yellow-400/5 p-8"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-wide border-b border-yellow-400/50 pb-4">
                            Antivirus & Firewall Settings
                        </h3>
                        <div className="space-y-6 text-zinc-400">
                            <div>
                                <h4 className="text-yellow-400 font-bold mb-2 uppercase text-sm">Windows Defender</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm ml-2">
                                    <li>Go to <strong>Virus & threat protection</strong></li>
                                    <li>Click <strong>Manage settings</strong></li>
                                    <li>Scroll to <strong>Exclusions</strong> and click <strong>Add exclusions</strong></li>
                                    <li>Select <strong>Folder</strong> and choose your MineBench installation directory</li>
                                </ol>
                            </div>
                            <div>
                                <h4 className="text-yellow-400 font-bold mb-2 uppercase text-sm">Other Antivirus</h4>
                                <p className="text-sm">Consult your antivirus documentation for whitelisting/exclusion procedures. Mining software is commonly flagged due to its resource-intensive nature.</p>
                            </div>
                            <div>
                                <h4 className="text-yellow-400 font-bold mb-2 uppercase text-sm">Firewall</h4>
                                <p className="text-sm">Ensure your firewall allows MineBench to communicate with mining pools. You may need to allow the application through Windows Firewall.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
