'use client';

import TokenomicsChart from '@/components/TokenomicsChart';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FileText, Cpu, Coins, Globe, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import Link from '@/components/refresh/WorkspaceLink';
import { PREMIUM_PRICE_USDC } from '@/lib/marketing';

const bmtDistribution = [
    { label: 'Free circulating', percent: 89.9, amount: '899,000,000', color: '#facc15' },
    { label: 'Frozen / locked', percent: 8, amount: '80,000,000', color: '#71717a' },
    { label: 'Airdrop', percent: 1, amount: '10,000,000', color: '#34d399' },
    { label: 'Treasury reserve', percent: 1, amount: '10,000,000', color: '#38bdf8' },
    { label: 'Treasury', percent: 0.1, amount: '1,000,000', color: '#fafafa' },
];

const roadmap = [
    {
        title: 'Mining and benchmark foundation',
        status: 'Implemented',
        description: 'The desktop client, public hardware results, MineBench pool integration and reward views form the working product.',
        items: [
            'Windows and Linux client distribution, with signed in-app updates and a Bitbucket download fallback.',
            'CPU mining controls, benchmark warm-up and safe-mode improvements, plus clearer payout progress.',
            'Public hashrate, miner and block views; separate XMR payout and BMT settlement statuses.',
        ],
    },
    {
        title: 'Reliability and settlement automation',
        status: 'Ongoing / planned',
        description: 'Continue improving the existing MineBench application while reducing manual infrastructure work.',
        items: [
            'Fix bugs, improve mining stability and make reward data easier to reconcile across the client and website.',
            'Extend infrastructure automation and operational monitoring.',
            'Build out the planned XMR → SOL → BMT conversion pipeline for reward funding. End-to-end automatic conversion is a roadmap item.',
        ],
    },
    {
        title: 'MineBench IQ early MVP',
        status: 'Planned',
        description: 'A separate application for users who need AI computation and providers who want to supply compute.',
        items: [
            'Start with a partially centralized service and MineBench-operated GPU servers to provide capacity while community participation is small.',
            'Offer free early access and use feedback to choose the first AI workloads and open-source models.',
            'Evaluate text/code, image and video workloads before committing to a model catalogue. The early MVP is a smaller milestone than the full marketplace.',
        ],
    },
    {
        title: 'Community AI compute network',
        status: 'Longer-term direction',
        description: 'Expand IQ beyond the initial service once the execution, accounting and safety model has been validated.',
        items: [
            'Let users opt in to provide compatible hardware for paid AI workloads.',
            'Define workload verification, provider rewards and the MBIQ economy before broad paid access.',
            'Evaluate privacy boundaries and confidential-compute options. Provider-blind processing of private data is not a current product guarantee.',
        ],
    },
];

const rewardStages = [
    ['Pool activity', 'Local miner submissions and native P2Pool shares are different signals. A share counter is not a payout balance.'],
    ['Block and XMR payout', 'The system tracks discovered blocks and whether an associated Monero wallet payout is pending, received or absent.'],
    ['BMT accounting', 'Reward allocations can be processing or credited. A credited balance is an accounting entry, not yet a confirmed wallet transfer.'],
    ['Solana settlement', 'The reward history distinguishes partial payments from completed BMT payments on Solana.'],
];

export default function WhitepaperClient() {
    return (
        <div className="board-page refresh-whitepaper min-h-screen relative overflow-hidden bg-black flex flex-col">
            <Header />
            <main id="refresh-content" tabIndex={-1} className="flex-grow pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
                <article className="max-w-4xl mx-auto">
                    <div className="text-center mb-12 border-b border-zinc-900 pb-12">
                        <div className="inline-block rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 mb-6">
                            <FileText className="w-10 h-10 text-yellow-400" aria-hidden="true" />
                        </div>
                        <p className="mb-4 text-sm text-zinc-400">Updated <time dateTime="2026-09-08">8 September 2026</time></p>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                            White<span className="text-yellow-400">paper</span>
                        </h1>
                        <p className="text-lg leading-7 text-zinc-400 max-w-2xl mx-auto">
                            Mining, hardware benchmarks and the next step toward AI compute.
                            What MineBench does today, how rewards work, and what comes next.
                        </p>
                    </div>

                    <nav aria-label="Whitepaper sections" className="mb-12 flex flex-wrap gap-2">
                        {[
                            ['overview', 'Overview'], ['architecture', 'Architecture'], ['rewards', 'Rewards'],
                            ['tokens', 'BMT & MBIQ'], ['tokenomics', 'Tokenomics'], ['premium', 'Free & Premium'], ['roadmap', 'Roadmap'], ['references', 'References'],
                        ].map(([id, label]) => (
                            <Link key={id} href={`#${id}`} className="rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-yellow-400/50 hover:text-yellow-400">
                                {label}
                            </Link>
                        ))}
                    </nav>

                    <div className="space-y-8">
                        <section id="overview" className="surface-panel scroll-mt-24 p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Globe className="h-6 w-6 shrink-0 text-yellow-400" aria-hidden="true" />
                                <h2 className="text-2xl font-bold text-white">01. Product overview</h2>
                            </div>
                            <div className="space-y-4 leading-relaxed text-zinc-400">
                                <p>MineBench combines a desktop mining and benchmarking client with a public hardware leaderboard and live pool dashboard. Benchmarks run on the user’s hardware; the website makes submitted results and network activity accessible.</p>
                                <p>The current ecosystem covers CPU and GPU benchmark results, Monero/RandomX mining workflows, local miner controls and BMT reward views. Windows and Linux builds are available through the <Link href="/downloads" className="text-yellow-400 hover:underline">downloads page</Link>; available algorithms and features depend on the client and hardware.</p>
                                <p>Recent client releases include signed Tauri updates from Bitbucket, consolidated statistics refreshes, benchmark warm-up improvements and payout progress. The website has been updated to React 19 and Tailwind 4, with a consistent dark interface, rounded controls and clearer Free/Premium information.</p>
                                <div className="rounded-xl border border-zinc-800 bg-black/30 p-5 text-sm">
                                    <h3 className="mb-2 font-semibold text-white">How to read the leaderboard</h3>
                                    <p>Results are grouped by normalized device name and ranked by the highest positive submitted average hashrate. Settings, cooling, power limits and test conditions vary. These are community measurements, not independent lab certifications or earnings estimates.</p>
                                </div>
                            </div>
                        </section>

                        <section id="architecture" className="surface-panel scroll-mt-24 p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Cpu className="h-6 w-6 shrink-0 text-yellow-400" aria-hidden="true" />
                                <h2 className="text-2xl font-bold text-white">02. Architecture and trust</h2>
                            </div>
                            <dl className="space-y-5 text-zinc-400 leading-relaxed">
                                <div><dt className="mb-1 font-semibold text-white">Desktop execution</dt><dd>The current client uses Tauri, Rust and a React interface for hardware detection, miner process control, settings and telemetry. Mining and benchmark execution happen locally.</dd></div>
                                <div><dt className="mb-1 font-semibold text-white">Website and benchmark data</dt><dd>The Next.js website exposes downloads, the leaderboard, pool statistics and reward history. Benchmark records are stored off-chain through the API and database. Submission authentication and payload checks do not constitute cryptographic proof of hardware performance.</dd></div>
                                <div><dt className="mb-1 font-semibold text-white">Pool and reward coordination</dt><dd>The pool infrastructure supplies mining telemetry and P2Pool events. Backend services handle reward accounting, payout progress and settlement coordination. These services remain an operational trust dependency.</dd></div>
                                <div><dt className="mb-1 font-semibold text-white">Solana</dt><dd>Solana provides the BMT token transfer layer and the USDC payment path for Premium. The current system does not write every benchmark result to Solana.</dd></div>
                            </dl>
                            <p className="mt-6 rounded-xl border-l-4 border-yellow-400 bg-zinc-900/30 p-4 text-sm leading-relaxed text-zinc-400">
                                The public client can be inspected on Bitbucket. Backend accounting and operator systems are maintained separately.
                                MineBench combines local execution, managed services and blockchain settlement; it is not a fully decentralized benchmark-verification network.
                            </p>
                        </section>

                        <section id="rewards" className="surface-panel scroll-mt-24 p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldCheck className="h-6 w-6 shrink-0 text-yellow-400" aria-hidden="true" />
                                <h2 className="text-2xl font-bold text-white">03. Mining and reward lifecycle</h2>
                            </div>
                            <p className="mb-6 text-zinc-400 leading-relaxed">Mining work, Monero payouts, BMT allocations and completed transfers are separate events. The client and website expose these stages so users can follow progress without treating every share or block as an immediate reward.</p>
                            <ol className="grid gap-4 sm:grid-cols-2">
                                {rewardStages.map(([title, description], index) => (
                                    <li key={title} className="rounded-xl border border-zinc-800 p-5">
                                        <span className="text-sm font-mono text-yellow-400">0{index + 1}</span>
                                        <h3 className="my-2 font-semibold text-white">{title}</h3>
                                        <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
                                    </li>
                                ))}
                            </ol>
                            <p className="mt-6 text-sm leading-relaxed text-zinc-400">Submitting a benchmark alone does not establish a payable mining reward. Payout eligibility, timing, fees and available settlement funds depend on the applicable workflow. Use the client’s payout details and <Link href="/pool-rewards" className="text-yellow-400 hover:underline">pool reward history</Link> to inspect current status.</p>
                        </section>

                        <section id="tokens" className="surface-panel scroll-mt-24 p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Coins className="h-6 w-6 shrink-0 text-yellow-400" aria-hidden="true" />
                                <h2 className="text-2xl font-bold text-white">04. Two product directions</h2>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="rounded-xl border border-yellow-400/25 bg-yellow-400/5 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Current mining ecosystem</p>
                                    <h3 className="my-3 text-xl font-semibold text-white">MineBench / BMT</h3>
                                    <p className="text-sm leading-relaxed text-zinc-400">BMT is the BenchMark Token on Solana, used in MineBench’s mining reward accounting and payout flows. It is separate from the benchmark data itself.</p>
                                </div>
                                <div className="rounded-xl border border-zinc-800 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Planned AI application</p>
                                    <h3 className="my-3 text-xl font-semibold text-white"><Link href="/minebench-iq" className="hover:text-yellow-400">MineBench IQ / MBIQ ↗</Link></h3>
                                    <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/5 px-3 py-1 text-xs text-yellow-400">Coming soon</span>
                                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">Development has not started yet. The application is planned; the token has launched.</p>
                                    <a href="https://solscan.io/token/EQ9mKupWSS4AHUSRVvKPghezPGKhgDTj2VF5hXdhPray" target="_blank" rel="noopener noreferrer" className="mt-4 block rounded-lg border border-zinc-700 p-3 text-yellow-400 hover:border-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400">
                                        <span className="text-sm">View MBIQ token ↗</span>
                                        <span className="mt-2 block text-xs text-zinc-400">CA · Solana</span>
                                        <code className="mt-1 block break-all text-xs">EQ9mKupWSS4AHUSRVvKPghezPGKhgDTj2VF5hXdhPray</code>
                                    </a>
                                    <p className="text-sm leading-relaxed text-zinc-400">MBIQ has been launched for the planned IQ direction. The proposed product connects AI users with compute providers. A token launch does not mean the AI marketplace or its provider rewards are already live.</p>
                                </div>
                            </div>
                            <div className="mt-5 rounded-xl border border-zinc-800 p-5">
                                <p className="mb-2 text-sm font-semibold text-white">BMT mint address</p>
                                <code className="block break-all text-sm text-zinc-400">67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev</code>
                                <Link href="https://pump.fun/coin/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-yellow-400 hover:underline">
                                    BMT on Pump.fun <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            </div>
                            <p className="mt-5 text-sm leading-relaxed text-zinc-400">This revision does not specify a governance mechanism, vesting schedule or fixed token return. IQ workload pricing and provider reward rules remain part of the planned product design.</p>
                        </section>

                        <section id="tokenomics" className="surface-panel scroll-mt-28 overflow-hidden p-6 sm:p-8">
                            <div className="mb-6 flex items-center gap-3">
                                <Coins className="h-6 w-6 shrink-0 text-yellow-400" aria-hidden="true" />
                                <h2 className="text-2xl font-bold text-white">05. Tokenomics</h2>
                            </div>
                            <p className="mb-8 leading-relaxed text-zinc-400">The published BMT distribution totals <strong className="font-semibold text-white">1,000,000,000 tokens</strong>. Most of the allocation is designated as free circulating, with separate locked, airdrop and treasury allocations.</p>
                            <TokenomicsChart allocations={bmtDistribution} />
                            <Link href="https://x.com/MineBenchdapp/status/2093678531523776823" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm text-yellow-400 hover:underline">Official distribution · 29 Aug 2026 <ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
                            <p className="mt-3 text-xs leading-5 text-zinc-400">Published allocation, not a live supply or wallet-balance feed. The announcement does not specify an unlock or vesting schedule for the locked allocation.</p>
                            <h3 className="mb-4 mt-8 font-semibold text-white">How BMT rewards reach your wallet</h3>
                            <ol className="grid gap-3 sm:grid-cols-3">
                                {[
                                    ['01', 'Contribute compute', 'Submit valid mining work through the supported client or pool workflow.'],
                                    ['02', 'Allocate rewards', 'Eligible work is accounted for and payouts enter the payment queue.'],
                                    ['03', 'Settle on Solana', 'Track the BMT transfer separately from the credited reward balance.'],
                                ].map(([step, title, description]) => (
                                    <li key={step} className="rounded-xl border border-zinc-800 p-4">
                                        <span className="font-mono text-xs text-yellow-400">{step}</span>
                                        <p className="mt-3 text-sm font-medium text-white">{title}</p>
                                        <p className="mt-2 text-xs leading-5 text-zinc-400">{description}</p>
                                    </li>
                                ))}
                            </ol>
                            <p className="mt-6 text-sm leading-6 text-zinc-400">The XMR → SOL → BMT conversion pipeline is a planned funding mechanism. Reward payouts depend on eligible work and settlement conditions; the distribution above is not a fixed mining return. MBIQ belongs to the separate, planned IQ economy.</p>
                        </section>

                        <section id="premium" className="surface-panel scroll-mt-24 p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Zap className="h-6 w-6 shrink-0 text-yellow-400" aria-hidden="true" />
                                <h2 className="text-2xl font-bold text-white">06. Free access and Premium</h2>
                            </div>
                            <div className="space-y-4 text-zinc-400 leading-relaxed">
                                <p>The free client provides benchmarks and mining controls, including CPU thread count, priority, huge pages and RandomX memory modes. The public website, leaderboard and dashboard are free to browse.</p>
                                <p><strong className="text-white">Premium costs {PREMIUM_PRICE_USDC} USDC once, with no expiry or recurring subscription.</strong> Solana network fees are additional. Premium adds custom Monero wallet routing and P2Pool or custom Stratum pool settings in the desktop client.</p>
                                <p>Use the same Solana wallet for the upgrade and in the client. Payout conditions for a custom pool are determined by that pool. Premium does not guarantee a higher hashrate or mining income.</p>
                                <Link href="/premium" className="btn-secondary inline-flex">Compare Free and Premium</Link>
                            </div>
                        </section>

                        <section id="roadmap" className="surface-panel scroll-mt-24 p-6 sm:p-8">
                            <h2 className="mb-4 text-2xl font-bold text-white">07. Delivery status and roadmap</h2>
                            <p className="mb-6 text-zinc-400 leading-relaxed">MineBench development continues alongside the planned IQ application. The milestones below distinguish existing capabilities from proposed work as of September 2026.</p>
                            <div className="space-y-5">
                                {roadmap.map((phase) => (
                                    <div key={phase.title} className="rounded-xl border border-zinc-800 p-5 sm:p-6">
                                        <span className="inline-block rounded-full border border-yellow-400/25 bg-yellow-400/5 px-3 py-1 text-xs font-medium text-yellow-400">{phase.status}</span>
                                        <h3 className="mt-3 mb-2 text-xl font-semibold text-white">{phase.title}</h3>
                                        <p className="mb-4 text-sm leading-relaxed text-zinc-400">{phase.description}</p>
                                        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-400 marker:text-yellow-400">
                                            {phase.items.map(item => <li key={item}>{item}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-6 text-sm leading-relaxed text-zinc-400">The early IQ MVP planning target discussed in September was 2–4 weeks. This is an estimate for an initial testable service, not a confirmed launch date for the full marketplace. Scope, hardware capacity and validation will determine delivery; release availability will be announced separately.</p>
                        </section>

                        <section id="references" className="surface-panel scroll-mt-24 p-6 sm:p-8">
                            <h2 className="mb-4 text-2xl font-bold text-white">08. Project history and references</h2>
                            <p className="mb-6 text-zinc-400 leading-relaxed">MineBench’s earlier roadmap included its Colosseum project entry, desktop releases, pool integration and public statistics. This revision replaces the old Q1–Q2 2026 plan with the current product scope and the next development directions.</p>
                            <div className="flex flex-wrap gap-3">
                                <Link href="https://bitbucket.org/minebenchapp/minebench-client" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">Client source <ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
                                <Link href="/downloads" className="btn-secondary inline-flex">Available releases</Link>
                                <Link href="https://x.com/MineBenchdapp" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">Official updates on X <ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
                                <Link href="https://arena.colosseum.org/projects/explore/minebench-mining-benchmark" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">Colosseum project <ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
                            </div>
                        </section>
                    </div>
                </article>
            </main>
            <Footer />
        </div>
    );
}
