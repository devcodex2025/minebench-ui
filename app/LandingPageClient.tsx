'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Download, Activity, Database, Zap, TrendingUp } from 'lucide-react';
import Scene3D from '@/components/Scene3D';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';

function Counter({ value, label }: { value: number, label: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 });
    const displayValue = useTransform(springValue, (latest) => {
        if (latest >= 1000) {
            return (latest / 1000).toFixed(1) + 'K';
        }
        return Math.round(latest).toString();
    });

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);
        }
    }, [isInView, value, motionValue]);

    return (
        <div ref={ref} className="border border-zinc-800 p-6 hover:border-yellow-400 transition-all duration-300">
            <div className="text-4xl md:text-5xl font-bold font-mono-system text-yellow-400 mb-2">
                <motion.span>{displayValue}</motion.span>
            </div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{label}</div>
        </div>
    );
}

export default function LandingPageClient() {
    const [stats, setStats] = useState({
        benchmarks: 0,
        miners: 0,
        downloads: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Отримуємо статистику з бенчмарків
                const { data: benchmarkData, error: benchmarkError } = await supabase
                    .from('benchmarks')
                    .select('id, device_uid');

                if (benchmarkError) throw benchmarkError;

                // Отримуємо статистику завантажень
                const { data: globalStats, error: statsError } = await supabase
                    .from('global_stats')
                    .select('total_downloads')
                    .eq('id', 1)
                    .single();

                if (statsError) {
                    console.error('Error fetching global stats:', statsError);
                }

                if (benchmarkData) {
                    const uniqueMiners = new Set(benchmarkData.map(item => item.device_uid).filter(Boolean));
                    setStats({
                        benchmarks: benchmarkData.length,
                        miners: uniqueMiners.size,
                        downloads: globalStats?.total_downloads || 0,
                    });
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden bg-black flex flex-col">
            <Scene3D />
            <Header />

            <main className="flex-grow relative z-10">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-block border border-yellow-400 px-4 py-2 mb-8">
                            <span className="text-yellow-400 font-mono-system text-sm uppercase tracking-widest">
                                v0.1.3
                            </span>
                        </div>

                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white mb-8 leading-none">
                            Mine<span className="text-gradient">Bench</span>
                        </h1>

                        <h2 className="text-2xl md:text-3xl font-bold text-zinc-400 mb-6 uppercase tracking-wide">
                            Hardware Benchmarking Platform with Blockchain<br/> Rewards
                        </h2>

                        <p className="text-lg md:text-xl text-zinc-500 max-w-3xl mx-auto mb-12 leading-relaxed">
                            Comprehensive benchmarking platform for cryptocurrency mining hardware.
                            Compare GPU and CPU performance with transparent results and earn blockchain-based rewards on Solana.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link href="/downloads" className="btn-primary inline-flex items-center gap-3">
                                <Download className="w-5 h-5" />
                                DOWNLOAD NOW
                            </Link>
                            <Link href="/dashboard" className="btn-secondary inline-flex items-center gap-3">
                                <Activity className="w-5 h-5" />
                                VIEW DASHBOARD
                            </Link>
                        </div>
                    </motion.div>

                    {/* Live Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-20"
                    >
                        <Counter value={stats.downloads} label="Total Downloads" />
                        <Counter value={stats.benchmarks} label="Benchmarks completed" />
                        <Counter value={stats.miners} label="Unique Devices" />
                    </motion.div>

                    {/* What is Minebench Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="max-w-4xl mx-auto mb-20 border border-zinc-900 p-8"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 uppercase tracking-wide text-center">
                            What is Minebench?
                        </h2>
                        <div className="space-y-4 text-zinc-400 leading-relaxed">
                            <p>
                                <strong className="text-yellow-400">Minebench</strong> is a comprehensive platform for hardware benchmarking
                                with blockchain-based rewards. All benchmark results are stored in a secure database, and users can earn
                                cryptocurrency rewards on Solana for contributing their hardware performance data to the platform.
                            </p>
                            <p>
                                Minebench provides real-time performance metrics for mining hardware including hashrate,
                                power consumption, and efficiency across multiple algorithms like Zephyr and Ravencoin.
                                Whether you&apos;re a cryptocurrency miner looking to optimize your hardware, a hardware manufacturer wanting to showcase
                                performance, or a researcher analyzing mining efficiency trends, Minebench provides reliable and comprehensive
                                benchmarking data with fair compensation for contributors.
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* Benefits Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-900">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 uppercase tracking-wide text-center">
                        Why Choose Minebench?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8 mb-20">
                        <div className="border border-zinc-900 p-8 hover:border-yellow-400 transition-all">
                            <h3 className="text-2xl font-bold text-yellow-400 mb-4 uppercase tracking-wide">Blockchain Rewards</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Earn cryptocurrency rewards on Solana blockchain for contributing benchmark data. The platform uses blockchain
                                technology to distribute fair compensation to users who help build the most comprehensive hardware performance database.
                            </p>
                        </div>
                        <div className="border border-zinc-900 p-8 hover:border-yellow-400 transition-all">
                            <h3 className="text-2xl font-bold text-yellow-400 mb-4 uppercase tracking-wide">Real-Time Data</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Access up-to-date performance metrics from thousands of mining devices worldwide. Compare hashrates, power consumption,
                                and efficiency across different hardware configurations and mining algorithms.
                            </p>
                        </div>
                        <div className="border border-zinc-900 p-8 hover:border-yellow-400 transition-all">
                            <h3 className="text-2xl font-bold text-yellow-400 mb-4 uppercase tracking-wide">Multi-Algorithm Support</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Benchmark your hardware across multiple cryptocurrency mining algorithms including Zephyr, Ravencoin, and more.
                                Find the most profitable algorithm for your specific hardware configuration.
                            </p>
                        </div>
                        <div className="border border-zinc-900 p-8 hover:border-yellow-400 transition-all">
                            <h3 className="text-2xl font-bold text-yellow-400 mb-4 uppercase tracking-wide">Open & Transparent</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Built with open-source clients and blockchain-based reward system on Solana. Access comprehensive hardware
                                performance data and earn rewards for your contributions to the platform.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-900">
                    <div className="grid md:grid-cols-3 gap-px bg-zinc-900">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="bg-black p-8 border border-zinc-900 hover:border-yellow-400 transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 border border-zinc-800 group-hover:border-yellow-400 flex items-center justify-center mb-6 transition-all">
                                <Database className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">VERIFIED RESULTS</h3>
                            <p className="text-zinc-500 leading-relaxed">
                                All benchmarks are stored in a secure database with comprehensive performance metrics and validation.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-black p-8 border border-zinc-900 hover:border-yellow-400 transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 border border-zinc-800 group-hover:border-yellow-400 flex items-center justify-center mb-6 transition-all">
                                <Zap className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">REAL-TIME ANALYTICS</h3>
                            <p className="text-zinc-500 leading-relaxed">
                                Monitor hashrate, power consumption, and efficiency metrics in real-time with precision data.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-black p-8 border border-zinc-900 hover:border-yellow-400 transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 border border-zinc-800 group-hover:border-yellow-400 flex items-center justify-center mb-6 transition-all">
                                <TrendingUp className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">EARN BMT TOKENS</h3>
                            <p className="text-zinc-500 leading-relaxed">
                                Contribute your hardware power to the network and earn BenchMark Tokens for validated results.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-zinc-900">
                    <div className="border-4 border-white p-12 md:p-20 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 uppercase tracking-tight">
                                READY TO OPTIMIZE?
                            </h2>
                            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                                Join thousands of miners who trust Minebench for performance testing.
                            </p>
                            <Link href="/downloads" className="btn-primary inline-flex items-center gap-3 text-lg">
                                <Download className="w-6 h-6" />
                                DOWNLOAD FOR WINDOWS
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
