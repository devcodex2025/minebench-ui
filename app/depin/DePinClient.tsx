import 'server-only';
import Link from '@/components/refresh/WorkspaceLink';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import { ArrowRight, ArrowUpRight, Cpu, Fingerprint, Layers, Network, ShieldCheck, Terminal, Wallet } from 'lucide-react';
import NetworkMetrics from './NetworkMetrics';
import DePinVideo from './DePinVideo';

type Status = 'Available' | 'Planned';
function Badge({ status = 'Planned' }: { status?: Status }) {
  return <span className={`depin-badge ${status === 'Available' ? 'depin-available' : ''}`}>{status}</span>;
}
function Heading({ number, label, title, children }: { number: string; label: string; title: string; children?: React.ReactNode }) {
  return <div className="depin-heading"><p className="depin-eyebrow">{number} / {label}</p><h2>{title}</h2>{children && <p>{children}</p>}</div>;
}
function Flow({ steps }: { steps: readonly string[] }) {
  return <ol className="depin-flow">{steps.map((step, index) => <li key={step}><span>{step}</span>{index < steps.length - 1 && <ArrowRight size={15} aria-hidden="true" />}</li>)}</ol>;
}

const layers = [
  { icon: Cpu, title: 'Hardware', status: 'Available', copy: 'Desktop hardware detection. CPU benchmarking is the current foundation; GPU compute expansion is planned.', steps: 'Hardware provider → MineBench client → Hardware detection', detail: 'CPU · GPU inventory · RAM · Storage · Network context' },
  { icon: Layers, title: 'Benchmark', status: 'Available', copy: 'Run a real mining workload, measure hashrate, and compare published benchmark results.', steps: 'Detected hardware → Benchmark → Performance measurements', detail: 'CPU performance · Run history · Hardware comparison' },
  { icon: ShieldCheck, title: 'Verification', status: 'Available', copy: 'Submission authentication and result validation provide a starting point. A broader verified performance profile is planned.', steps: 'Benchmark → Result checks → Performance profile (planned)', detail: 'Current: submission checks / Planned: consistency and reliability signals' },
  { icon: Network, title: 'Compute', status: 'Available', copy: 'Mining and stress workloads run today. General job scheduling and AI workload execution are planned.', steps: 'Scheduler (planned) → Mining / AI task (planned) → Contribution measurement', detail: 'Current: mining / Planned: AI and general compute' },
  { icon: Wallet, title: 'Settlement', status: 'Available', copy: 'Eligible mining contribution feeds reward accounting and Solana claims. Marketplace settlement is planned.', steps: 'Eligible contribution → Reward accounting → Solana claim', detail: 'Wallet identity · Reward distribution · Claim transactions' },
] as const;
const capabilities: { name: string; status: Status; detail: string }[] = [
  { name: 'Hardware discovery', status: 'Available', detail: 'Desktop hardware detection' },
  { name: 'CPU benchmarking', status: 'Available', detail: 'Mining performance and result comparison' },
  { name: 'GPU benchmarking', status: 'Planned', detail: 'IQ scope; development has not started' },
  { name: 'Performance verification', status: 'Available', detail: 'Submission checks; broader profiles planned' },
  { name: 'Workload execution', status: 'Available', detail: 'Mining and stress tests' },
  { name: 'Mining workloads', status: 'Available', detail: 'Monero pool infrastructure' },
  { name: 'AI workloads', status: 'Planned', detail: 'No current AI execution service' },
  { name: 'Solana rewards', status: 'Available', detail: 'Eligible mining rewards and claims' },
  { name: 'Provider reputation', status: 'Planned', detail: 'Future reliability and history signals' },
  { name: 'Agent API / scheduler', status: 'Planned', detail: 'Proposed programmatic job lifecycle' },
  { name: 'Compute marketplace', status: 'Planned', detail: 'Future provider discovery and settlement' },
];

export default function DePinClient() {
  return <main id="refresh-content" className="depin-main" tabIndex={-1}>
    <section className="depin-hero" aria-labelledby="depin-title">
      <div><p className="depin-eyebrow">01 / MineBench DePIN · Built on Solana</p><h1 id="depin-title">Real hardware.<br /><span>Measured potential.</span></h1><p className="depin-lead">MineBench is building a hardware intelligence and distributed compute network on Solana.</p><p className="depin-hero-copy">CPU benchmarks and mining are the foundation today. Verified performance profiles, routed compute workloads, and a broader contributor economy are the next ambition.</p><div className="depin-actions"><Link href="/downloads" className="depin-button depin-primary">Run Benchmark <ArrowUpRight size={17} aria-hidden="true" /></Link><a href="#architecture" className="depin-button">Explore Architecture <ArrowRight size={17} aria-hidden="true" /></a></div></div>
      <div className="depin-hero-diagram"><div className="depin-diagram-top"><Cpu size={26} aria-hidden="true" /><span>THE NETWORK DIRECTION</span><Badge /></div><Flow steps={['Hardware', 'Benchmark', 'Verified compute', 'Workload', 'Solana', 'Rewards']} /><p>Vision flow. General compute verification and routing are planned; current rewards depend on eligible mining contribution.</p><div className="depin-diagram-base"><span>PHYSICAL INFRASTRUCTURE</span><span>MEASURABLE OUTPUT</span></div></div>
    </section>

    <section className="depin-section" aria-labelledby="depin-overview">
      <Heading number="02" label="The network" title="Hardware meets useful work." />
      <p id="depin-overview" className="depin-section-intro">DePIN connects physical resources with a shared network. MineBench starts with hardware owners running measured mining workloads, and is working toward a wider compute network.</p>
      <div className="depin-two"><SpotlightCard className="depin-card"><Cpu aria-hidden="true" /><h3>The supply side</h3><p>CPU owners and miners can start with the desktop client. GPU owners and compute providers are part of the planned expansion.</p><div className="depin-tags"><span>CPU owners</span><span>Miners</span><span>Future GPU providers</span></div></SpotlightCard><SpotlightCard className="depin-card"><Network aria-hidden="true" /><h3>The workload side</h3><p>Benchmarks, stress tests, and mining workloads today. AI inference and future compute jobs are planned.</p><div className="depin-tags"><span>Benchmark</span><span>Stress test</span><span>Mining</span></div></SpotlightCard></div>
      <DePinVideo />
    </section>

    <section id="architecture" className="depin-section" aria-label="Architecture">
      <Heading number="03" label="Architecture" title="Five layers. One contribution path.">From the hardware on your desk to an eligible reward claim. Each layer has a distinct role.</Heading>
      <div className="depin-layers">{layers.map(({ icon: Icon, title, status, copy, steps, detail }, index) => <article key={title} className="depin-layer"><div className="depin-layer-name"><span className="depin-layer-index">0{index + 1}</span><Icon size={22} aria-hidden="true" /><h3>{title} layer</h3><Badge status={status} /></div><div><p>{copy}</p><p className="depin-layer-path">{steps}</p><small>{detail}</small></div></article>)}</div>
    </section>

    <section id="hardware-verification" className="depin-section depin-verification" aria-label="Hardware verification">
      <div><Heading number="04" label="Hardware verification" title="A model name is not a performance guarantee.">A useful compute network needs to understand how a machine actually performs under load.</Heading><p>MineBench already measures CPU mining performance and validates benchmark submissions. The next step is a richer hardware profile that brings performance, consistency, and workload outcomes together.</p><p>That profile could help MineBench and external compute platforms make better provider decisions.</p><Link href="/leaderboard" className="depin-text-link">Explore current benchmark results <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <SpotlightCard className="depin-profile"><div className="depin-profile-head"><Fingerprint size={30} aria-hidden="true" /><Badge /></div><h3>Hardware performance profile</h3><p>Concept schematic · Proposed fields, not a measured device.</p><dl>{[['Benchmark score & history', 'Measured performance over time'], ['Stability', 'Consistency under sustained load'], ['Workload success rate', 'Completed and validated task outcomes'], ['Compute class', 'Suitability for a workload'], ['Efficiency', 'Output relative to resource use'], ['Provider reputation', 'Long-term contribution history']].map(([label, detail]) => <div key={label}><dt>{label}</dt><dd>{detail}</dd></div>)}</dl><p className="depin-profile-note">Broader verification and reputation are planned. Current submission checks do not establish fraud-proof hardware attestation.</p></SpotlightCard>
    </section>

    <section className="depin-section" aria-label="Proof of contribution"><Heading number="05" label="Proof of contribution" title="Measure the work. Account for the contribution." /><div className="depin-inline-label"><Badge /><span>General compute lifecycle</span></div><Flow steps={['Task assigned', 'Task executed', 'Result validated', 'Contribution recorded', 'Reward calculated']} /><div className="depin-two depin-prose"><div><h3>Today: mining contribution</h3><p>Reward accounting uses eligible mining contribution and accepted shares. Submitting a benchmark alone does not guarantee a payment or reward.</p></div><div><h3>Planned: useful compute contribution</h3><p>The intended model measures useful contribution through validated workload execution. This describes application-level accounting, not a new blockchain consensus mechanism.</p></div></div></section>

    <section className="depin-section" aria-label="Why Solana"><Heading number="06" label="Why Solana" title="The settlement and economic layer.">Solana supports wallet identity and reward claims, while compute happens on contributor hardware and contribution accounting happens in the application backend.</Heading><div className="depin-two"><div className="depin-card"><Wallet aria-hidden="true" /><h3>Current foundation <Badge status="Available" /></h3><p>Wallet identity, eligible reward distribution, BMT token transfers, and Solana claim transactions connect mining contribution to settlement.</p><p>Benchmark records and contribution accounting are maintained off-chain.</p></div><div className="depin-card"><Layers aria-hidden="true" /><h3>Future economic layer <Badge /></h3><p>Provider reputation and compute marketplace transactions could extend this foundation as the distributed compute product develops.</p></div></div></section>

    <section className="depin-section" aria-label="Existing network"><Heading number="07" label="Existing network" title="A working foundation. A clear next step." /><div className="depin-two"><div className="depin-list-panel"><Badge status="Available" /><h3>Explore the current product</h3><ul><li>Desktop client and CPU benchmarking</li><li>Stress testing and mining workloads</li><li>Monero pool infrastructure</li><li>Eligible mining reward distribution</li><li>Solana-based claims</li><li>Public hardware leaderboard</li></ul><Link href="/downloads" className="depin-text-link">Get the client <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="depin-list-panel"><Badge /><h3>Where the network can grow</h3><ul><li>GPU benchmarks through MineBench IQ</li><li>AI workload execution</li><li>Provider reputation</li><li>Distributed compute marketplace</li><li>Agent API access and workload scheduling</li></ul><p>IQ development has not started. These capabilities are planned.</p></div></div></section>

    <section className="depin-section" aria-label="MineBench and MineBench IQ"><Heading number="08" label="One shared foundation" title="CPU today. GPU and AI on the roadmap.">Measure hardware, verify useful compute, and reward contribution: the principle connecting MineBench and the planned MineBench IQ.</Heading><div className="depin-two"><div className="depin-card"><p className="depin-eyebrow">CPU infrastructure</p><h3>MineBench <Badge status="Available" /></h3><p>CPU-oriented benchmarking, mining, and stress workloads, with rewards tied to eligible mining contribution.</p><Flow steps={['CPU', 'Benchmark', 'Mining / stress', 'Eligible contribution', 'Reward']} /></div><div className="depin-card"><p className="depin-eyebrow">GPU & AI direction</p><h3>MineBench IQ <Badge /></h3><p>GPU and AI-oriented compute infrastructure. Development has not started.</p><Flow steps={['GPU', 'Benchmark', 'AI workload', 'Validation', 'Marketplace', 'Reward']} /></div></div></section>

    <section className="depin-section depin-two depin-agents" aria-label="Humans and agents"><div><Heading number="09" label="Humans & agents" title="Compute that software could discover." /><Badge /><p>Future agents could compare providers using measured benchmark performance alongside hardware specifications, then request and monitor compute jobs.</p><p>Agent access, provider selection, and the workload scheduler are planned.</p></div><div className="depin-code"><div><Terminal size={18} aria-hidden="true" /><span>PROPOSED OPERATIONS · NOT A LIVE API</span></div><pre aria-label="Illustrative agent operations"><code>{'discover_compute()\ncompare_providers()\nestimate_cost()\ncreate_job()\nmonitor_job()\nget_result()'}</code></pre></div></section>

    <section className="depin-section" aria-label="Interoperability"><Heading number="10" label="Interoperability" title="A potential verification layer for other networks.">MineBench does not have to replace compute networks. It could help verify how their hardware performs.</Heading><div className="depin-inline-label"><Badge /><span>Possible integration categories · No current partnerships implied</span></div><div className="depin-integration-grid">{['Decentralized AI marketplaces', 'GPU networks', 'Mining networks', 'Rendering networks', 'Cloud compute providers', 'Agent marketplaces'].map(name => <div key={name}><Network size={18} aria-hidden="true" /><span>{name}</span></div>)}</div><p>Benchmark evidence and future hardware profiles could support provider comparison across these platforms. Integration design remains exploratory.</p></section>

    <section className="depin-section" aria-label="Network metrics"><Heading number="11" label="Network metrics" title="A view into the mining pool.">Current measurements from the existing public pool endpoint. Unavailable measurements are omitted.</Heading><NetworkMetrics /><Link href="/dashboard" className="depin-text-link">Open the network dashboard <ArrowUpRight size={16} aria-hidden="true" /></Link></section>

    <section className="depin-section" aria-label="Capability matrix"><Heading number="12" label="Capability matrix" title="What you can use. What comes next.">Available identifies the current implementation, not a guarantee of service uptime. Planned capabilities are not available to use.</Heading><div className="depin-table-wrap"><table className="depin-table"><caption className="depin-sr-only">MineBench technology and capability status</caption><thead><tr><th scope="col">Capability</th><th scope="col">Status</th><th scope="col">Scope</th></tr></thead><tbody>{capabilities.map(item => <tr key={item.name}><th scope="row">{item.name}</th><td><Badge status={item.status} /></td><td>{item.detail}</td></tr>)}</tbody></table></div></section>

    <section className="depin-section depin-final" aria-label="Developer integration"><Heading number="13" label="Build with MineBench" title="Building a decentralized compute network?">MineBench is exploring integrations where benchmark scores, hardware profiles, and future compute verification could support external compute platforms.</Heading><div className="depin-actions"><a href="https://discord.gg/vsDyYh4rma" target="_blank" rel="noopener noreferrer" className="depin-button depin-primary">Contact MineBench <ArrowUpRight size={17} aria-hidden="true" /></a><Link href="/whitepaper" className="depin-button">Read the whitepaper <ArrowRight size={17} aria-hidden="true" /></Link></div></section>
  </main>;
}
