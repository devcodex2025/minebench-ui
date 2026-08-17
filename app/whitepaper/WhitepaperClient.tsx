'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Scene3D from '@/components/Scene3D';
import { FileText, Cpu, Coins, Globe, ExternalLink, Award, Zap, ShieldCheck, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function WhitepaperClient() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-black flex flex-col">
            <Scene3D />
            <Header />

            <main className="flex-grow pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-20 border-b border-zinc-900 pb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-block border border-yellow-400 p-4 mb-8">
                                <FileText className="w-12 h-12 text-yellow-400" />
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight uppercase">
                                WHITE
                                <span className="text-yellow-400">PAPER</span>
                            </h1>
                            <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-mono-system">
                                The decentralized standard for hardware benchmarking on Solana.
                            </p>
                        </motion.div>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-16">
                        {/* Introduction */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="border border-zinc-900 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-900">
                                <div className="w-10 h-10 border border-yellow-400 flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Introduction</h2>
                            </div>
                            <div className="space-y-4 text-zinc-400 leading-relaxed">
                                <p>
                                    Minebench is a revolutionary web-based benchmarking platform designed to seamlessly evaluate and rank <strong className="text-white">CPU and GPU hardware performance</strong>. Our core value is providing a completely transparent, verifiable, and open-source standard for the global crypto-mining and rendering industry.
                                </p>
                                <p>
                        As opposed to generic synthetic benchmarks, Minebench focuses strictly on real-world capabilities. By utilizing our proprietary benchmarking tools, users help establish a trusted hardware results record accessible to the entire community.
                                </p>
                            </div>
                        </motion.section>

                        {/* Hackathon & Recognition */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="border-4 border-yellow-400 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-900">
                                <div className="w-10 h-10 border border-yellow-400 flex items-center justify-center">
                                    <Award className="w-5 h-5 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Colosseum Hackathon</h2>
                            </div>
                            <div className="text-zinc-400 leading-relaxed space-y-4">
                                <p>
                                    Minebench is proud to be a participant in the prestigious <strong className="text-white">Colosseum Hackathon</strong>, a global competition for building the next generation of Solana projects. Our participation underscores our commitment to innovation and technical excellence within the Solana ecosystem.
                                </p>
                                <Link
                                    href="https://arena.colosseum.org/projects/explore/minebench-mining-benchmark"
                                    target="_blank"
                                    className="inline-flex items-center gap-2 text-yellow-400 hover:text-white font-bold transition-colors group border border-yellow-400 hover:border-white px-4 py-2 uppercase text-sm"
                                >
                                    View Project on Colosseum
                                    <ExternalLink className="w-4 h-4" />
                                </Link>
                            </div>
                        </motion.section>

                        {/* Business Model */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="border border-zinc-900 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-900">
                                <div className="w-10 h-10 border border-yellow-400 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Business Model</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide">Monetization</h3>
                                    <ul className="space-y-3 text-zinc-400 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="w-1 h-1 bg-yellow-400 mt-2" />
                                            <span><strong className="text-white">Mining & Compute:</strong> Users contribute hardware power, earning rewards while validating benchmarks.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1 h-1 bg-yellow-400 mt-2" />
                                            <span><strong className="text-white">Hardware Advertising:</strong> Partnerships with manufacturers for verified performance listings.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1 h-1 bg-yellow-400 mt-2" />
                                            <span><strong className="text-white">Premium Analytics:</strong> Advanced data insights for large-scale operations.</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="border border-zinc-900 p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide">Value</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        We create a symbiotic ecosystem where miners get accurate data and rewards, while hardware manufacturers get a verified platform to showcase efficiency.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Tokenomics */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="border border-zinc-900 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-900">
                                <div className="w-10 h-10 border border-yellow-400 flex items-center justify-center">
                                    <Coins className="w-5 h-5 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Tokenomics (BMT)</h2>
                            </div>
                            <div className="text-zinc-400 leading-relaxed space-y-6">
                                <p>
                                    The <strong className="text-white">BenchMark Token (BMT)</strong> is the native utility token of the Minebench ecosystem. It is designed to incentivize participation, ensure accurate data reporting, and govern the platform.
                                </p>
                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div className="border border-zinc-900 p-6 hover:border-yellow-400 transition-all">
                                        <div className="text-yellow-400 font-bold text-lg mb-2 uppercase tracking-wide">Validate</div>
                                        <div className="text-sm text-zinc-500">Run detailed real-time benchmarks on GPUs and CPUs</div>
                                    </div>
                                    <div className="border border-zinc-900 p-6 hover:border-yellow-400 transition-all">
                                        <div className="text-yellow-400 font-bold text-lg mb-2 uppercase tracking-wide">Contribute</div>
                                        <div className="text-sm text-zinc-500">Support open-source development and hardware metrics collection</div>
                                    </div>
                                    <div className="border border-zinc-900 p-6 hover:border-yellow-400 transition-all">
                                        <div className="text-yellow-400 font-bold text-lg mb-2 uppercase tracking-wide">Earn</div>
                                        <div className="text-sm text-zinc-500">Participate in network testing and gain token rewards automatically</div>
                                    </div>
                                </div>

                                <div className="border-l-4 border-yellow-400 bg-zinc-900/30 p-4 text-sm">
                                    <strong className="text-white">Note:</strong> Detailed token distribution schedules and vesting periods are outlined in our full technical documentation.
                                </div>
                            </div>
                        </motion.section>

                        {/* Market & Trading */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-yellow-400 p-8 text-black"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-black/20">
                                <TrendingUp className="w-6 h-6" />
                                <h2 className="text-2xl font-bold uppercase tracking-tight text-black">Market & Trading</h2>
                            </div>
                            <div className="space-y-6">
                                <p className="font-bold text-lg leading-snug">
                                    $BMT is actively traded on the Solana network. The token serves as the primary settlement asset for hardware benchmarks and ecosystem rewards.
                                </p>
                                <div className="space-y-6">
                                    <Link 
                                        href="https://pump.fun/coin/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev" 
                                        target="_blank"
                                        className="bg-black text-white p-8 flex flex-col md:flex-row gap-8 hover:bg-zinc-900 transition-all group border-none items-center"
                                    >
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold uppercase tracking-widest text-xs opacity-60">Primary Liquidity Pair</span>
                                                <ExternalLink className="w-4 h-4 text-yellow-400" />
                                            </div>
                                            <img src="/img/pumpfun_logo.png" alt="PumpFun" className="h-10 w-auto mb-4" />
                                            <h3 className="text-3xl font-black italic">LAUNCHED ON PUMP.FUN</h3>
                                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider leading-relaxed">
                                                The $BMT token launch was successfully executed on Pump.fun, ensuring fair distribution and immediate liquidity for all hardware contributors.
                                            </p>
                                            <span className="inline-block mt-4 text-[10px] uppercase font-bold text-yellow-400 border border-yellow-400/30 px-3 py-1 group-hover:bg-yellow-400 group-hover:text-black transition-all">Trade on Pump.fun &rarr;</span>
                                        </div>
                                        <div className="flex-1 w-full max-w-sm border border-zinc-800 p-2 bg-zinc-950 shadow-2xl group-hover:border-yellow-400/30 transition-all">
                                            <img 
                                                src="/screenshots/benchmark-token-pumpfun-screenshot.png" 
                                                alt="PumpFun Exchange" 
                                                className="w-full h-auto opacity-70 group-hover:opacity-100 transition-opacity" 
                                            />
                                        </div>
                                    </Link>
                                </div>
                                <div className="pt-4 border-t border-black/10">
                                    <p className="text-[10px] font-mono uppercase font-black tracking-[0.2em]">
                                        Contract: 67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Technical Architecture */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="border border-zinc-900 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-900">
                                <div className="w-10 h-10 border border-yellow-400 flex items-center justify-center">
                                    <Cpu className="w-5 h-5 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Technical Architecture</h2>
                            </div>
                            <div className="space-y-6 text-zinc-400 leading-relaxed">
                                <div>
                                    <h3 className="text-white font-bold mb-3 uppercase tracking-wide">Blockchain Layer</h3>
                                    <p className="text-sm">
                                        Minebench leverages Solana&apos;s high-throughput blockchain to record benchmark results with cryptographic signatures. Each benchmark submission includes:
                                    </p>
                                    <ul className="mt-3 space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="w-1 h-1 bg-yellow-400 mt-2" />
                                            <span><strong className="text-white">Device Fingerprint:</strong> Unique hardware identifier</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1 h-1 bg-yellow-400 mt-2" />
                                            <span><strong className="text-white">Performance Metrics:</strong> Hashrate, power consumption, temperature</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1 h-1 bg-yellow-400 mt-2" />
                                            <span><strong className="text-white">Timestamp:</strong> Exact time of benchmark execution</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1 h-1 bg-yellow-400 mt-2" />
                                            <span><strong className="text-white">Cryptographic Proof:</strong> Signature to prevent tampering</span>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-white font-bold mb-3 uppercase tracking-wide">Client Architecture</h3>
                                    <p className="text-sm">
                                        The Minebench client is designed for minimal overhead and maximum accuracy. It supports both CPU and GPU benchmarking with algorithm-specific optimizations.
                                    </p>
                                </div>

                                <div className="border-l-4 border-yellow-400 bg-zinc-900/30 p-4 text-sm">
                                    <strong className="text-white">Security:</strong> All client-server communications are encrypted, and benchmark results are validated through multiple verification layers.
                                </div>
                            </div>
                        </motion.section>

                        {/* Roadmap */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="border border-zinc-900 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-900">
                                <div className="w-10 h-10 border border-yellow-400 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Roadmap</h2>
                            </div>
                            <div className="space-y-6">
                                <div className="border border-zinc-900 p-6 hover:border-yellow-400 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-yellow-400 font-bold font-mono-system">Q4 2025</span>
                                        <span className="text-xs text-zinc-600 uppercase tracking-widest font-bold">COMPLETED</span>
                                    </div>
                                    <ul className="space-y-2 text-zinc-400 text-sm">
                                        <li>✓ Launch CPU and GPU benchmark clients</li>
                                        <li>✓ Participation in <Link href="https://arena.colosseum.org/projects/explore/minebench-mining-benchmark" target="_blank" className="text-yellow-400 underline">Colosseum hackathon</Link></li>
                                    </ul>
                                </div>

                                <div className="border border-zinc-900 p-6 hover:border-yellow-400 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-yellow-400 font-bold font-mono-system">Q1 2026</span>
                                        <span className="text-xs text-yellow-400 uppercase tracking-widest font-bold">IN PROGRESS</span>
                                    </div>
                                    <ul className="space-y-2 text-zinc-400 text-sm">
                                        <li>→ TGE on <Link href="https://pump.fun/coin/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev" target="_blank" className="text-yellow-400 underline">pump.fun</Link></li>
                                        <li>→ Switch from 2miners pool to our own mining pool</li>
                                        <li>→ Creation of the new version of the application</li>
                                        <li>→ Adding statistic cards (pool hashrate, online miners, shares, etc)</li>
                                    </ul>
                                </div>

                                <div className="border border-zinc-900 p-6 hover:border-yellow-400 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-yellow-400 font-bold font-mono-system">Q2 2026</span>
                                        <span className="text-xs text-zinc-600 uppercase tracking-widest font-bold">PLANNED</span>
                                    </div>
                                    <ul className="space-y-2 text-zinc-400 text-sm">
                                        <li>→ Release of new application version on minebench.cloud</li>
                                        <li>→ Engagement of first official testers</li>
                                        <li>→ Return to the opensource model</li>
                                        <li>→ Source codes published at: <Link href="https://bitbucket.org/minebenchapp/minebench-client" target="_blank" className="text-yellow-400 underline break-all">bitbucket.org/minebenchapp/minebench-client</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
