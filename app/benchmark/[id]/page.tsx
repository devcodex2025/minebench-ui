import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Cpu, Gpu, Gauge, PlugZap, Thermometer, Clock3, Binary, CalendarDays, Info, Microchip, Monitor, MemoryStick, Package } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { formatHashrate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Benchmark details | MineBench', robots: { index: false, follow: false } };

// The same public measurement fields exposed by GET /api/benchmarks.
const PUBLIC_FIELDS = 'id,device_type,device_name,avg_temp,avg_hashrate,max_hashrate,avg_power,duration_seconds,algorithm,coin_name,created_at';
const ENVIRONMENT_FIELDS = 'os_name,os_arch,client_version,cpu_cores,ram_total_bytes,xmrig_version';
type BenchmarkDetails = {
  id: string | number; device_type: string; device_name: string; algorithm: string; coin_name: string; created_at: string | null;
  avg_hashrate: number | null; max_hashrate: number | null; avg_power: number | null; avg_temp: number | null; duration_seconds: number | null;
  os_name?: string | null; os_arch?: string | null; client_version?: string | null; xmrig_version?: string | null;
  cpu_cores?: number | null; ram_total_bytes?: number | null;
};
const ID_PATTERN = /^(?:[1-9]\d{0,18}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
function metric(value: unknown, allowZero = false): number | null {
  return typeof value === 'number' && Number.isFinite(value) && (allowZero ? value >= 0 : value > 0) ? value : null;
}

export default async function BenchmarkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_PATTERN.test(id)) notFound();
  if (/^\d+$/.test(id) && id.length === 19 && id > '9223372036854775807') notFound();
  const fields: string = process.env.BENCHMARK_METADATA_ENABLED === 'true' ? `${PUBLIC_FIELDS},${ENVIRONMENT_FIELDS}` : PUBLIC_FIELDS;
  const readBenchmark = (selection: string) => supabase.from('benchmarks').select(selection).eq('id', id).returns<BenchmarkDetails[]>().abortSignal(AbortSignal.timeout(10000)).maybeSingle();
  let { data: benchmark, error } = await readBenchmark(fields);
  if (fields !== PUBLIC_FIELDS && error && ['42703', 'PGRST204'].includes(error.code)) {
    ({ data: benchmark, error } = await readBenchmark(PUBLIC_FIELDS));
  }
  if (error && ['22P02', '22003'].includes(error.code)) notFound();
  if (error) throw new Error('Benchmark data is temporarily unavailable.');
  if (!benchmark) notFound();

  const average = metric(benchmark.avg_hashrate, true);
  const peak = metric(benchmark.max_hashrate);
  const power = metric(benchmark.avg_power);
  const temperature = metric(benchmark.avg_temp);
  const duration = metric(benchmark.duration_seconds);
  const date = benchmark.created_at ? new Date(benchmark.created_at) : null;
  const dateText = date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-GB', {dateStyle:'long', timeStyle:'short',timeZone:'UTC'}).format(date) + ' UTC' : 'Not reported';
  const DeviceIcon = benchmark.device_type?.toLowerCase() === 'gpu' ? Gpu : Cpu;
  const missing = 'Not reported';

  return <div className="board-page refresh-benchmark min-h-screen">
    <Header/>
    <main id="refresh-content" tabIndex={-1} className="mx-auto max-w-7xl px-6 pb-20">
      <Link href="/leaderboard" className="benchmark-back"><ArrowLeft size={15}/> Hardware leaderboard</Link>
      <section className="benchmark-detail-heading">
        <div className="benchmark-record-label"><span><Microchip size={14}/> INDIVIDUAL BENCHMARK</span><span>RECORD #{benchmark.id}</span></div>
        <div className="benchmark-detail-title"><span className="benchmark-detail-device"><DeviceIcon size={32} strokeWidth={1.4}/></span><div><p>{benchmark.device_type || 'Hardware'} / {benchmark.algorithm || 'Algorithm not reported'}</p><h1>{benchmark.device_name || 'Unnamed device'}</h1></div></div>
        <p className="benchmark-detail-intro">A closer look at this submitted run. All measurements below belong to benchmark #{benchmark.id}.</p>
      </section>
      <div className="benchmark-detail-grid">
        <section className="benchmark-hashrate-card" aria-labelledby="hashrate-heading">
          <div className="benchmark-card-heading"><span className="benchmark-title-icon"><Gauge size={21}/></span><h2 id="hashrate-heading">Hashrate</h2><span>MEASURED PERFORMANCE</span></div>
          <p className="benchmark-metric-label">Average hashrate</p>
          <p className="benchmark-primary-value">{average === null ? missing : formatHashrate(average)}</p>
          <div className="benchmark-secondary-values"><div><span>Peak hashrate</span><strong>{peak === null ? missing : formatHashrate(peak)}</strong></div><div><span>Algorithm</span><strong>{benchmark.algorithm || missing}</strong></div></div>
          <p className="benchmark-card-note"><Info size={14}/> Summary measurements from the submitted run; no per-second samples are available.</p>
        </section>
        <section className="benchmark-run-card" aria-labelledby="run-heading"><div className="benchmark-card-heading"><span className="benchmark-title-icon"><Binary size={20}/></span><h2 id="run-heading">Run details</h2></div><dl>
          <div><dt><Microchip size={15}/> Benchmark ID</dt><dd className="benchmark-record-id">{benchmark.id}</dd></div>
          <div><dt><DeviceIcon size={15}/> Device type</dt><dd>{benchmark.device_type || missing}</dd></div>
          <div><dt><Binary size={15}/> Coin</dt><dd>{benchmark.coin_name || missing}</dd></div>
          <div><dt><Clock3 size={15}/> Duration</dt><dd>{duration === null ? missing : `${duration.toLocaleString('en-US', {maximumFractionDigits: 1})} s`}</dd></div>
          <div><dt><CalendarDays size={15}/> Submitted</dt><dd>{dateText}</dd></div>
        </dl></section>
      </div>
      <section className="benchmark-sensor-grid" aria-label="Hardware telemetry">
        {[
          {label:'Average power',icon:PlugZap,value:power === null ? missing : `${power.toLocaleString('en-US', {maximumFractionDigits:1})} W`,note:'Power reported by the client'},
          {label:'Average temperature',icon:Thermometer,value:temperature === null ? missing : `${temperature.toLocaleString('en-US', {maximumFractionDigits:1})} °C`,note:'Temperature reported by the client'},
          {label:'Hashrate per watt',icon:Gauge,value:average === null || power === null ? missing : `${(average / power).toLocaleString('en-US',{maximumFractionDigits:2})} H/s/W`,note:'Calculated from average hashrate ÷ average power'},
        ].map(({label,icon:Icon,value,note})=><div className="benchmark-sensor" key={label}><div><span>{label}</span><Icon size={20} strokeWidth={1.5}/></div><strong>{value}</strong><p>{note}</p></div>)}
      </section>
      <aside className="benchmark-context"><Info size={20}/><div><h2>Read the result in context</h2><p>Community submissions come from different systems and settings. Compare the same algorithm and consider power, temperature and duration. Missing measurements are not zero. A benchmark is not an earnings forecast.</p></div><Link href="/leaderboard">Compare hardware <ArrowUpRight size={16}/></Link></aside>
      <section className="benchmark-environment" aria-labelledby="environment-heading">
        <div className="benchmark-card-heading"><span className="benchmark-title-icon"><Monitor size={20}/></span><h2 id="environment-heading">System & environment</h2><span>CLIENT REPORTED</span></div>
        <dl>{[
          { label: 'Operating system', icon: Monitor, value: ({windows:'Windows',linux:'Linux',macos:'macOS',other:'Other'} as Record<string,string>)[String(benchmark.os_name)] },
          { label: 'Architecture', icon: Microchip, value: benchmark.os_arch },
          { label: 'Installed RAM', icon: MemoryStick, value: metric(benchmark.ram_total_bytes) ? `${(Number(benchmark.ram_total_bytes) / 1073741824).toLocaleString('en-US',{maximumFractionDigits:1})} GiB` : null },
          { label: 'Logical CPU threads', icon: Cpu, value: metric(benchmark.cpu_cores) },
          { label: 'MineBench Client', icon: Package, value: benchmark.client_version },
          { label: 'XMRig version', icon: Binary, value: benchmark.xmrig_version },
        ].map(({label,icon:Icon,value}) => <div key={label}><dt><Icon size={17}/>{label}</dt><dd className={value ? '' : 'is-missing'}>{value || missing}</dd></div>)}</dl>
        <p className="benchmark-card-note"><Info size={14}/> Older clients did not include system details. Unreported values cannot be recovered from a device name.</p>
      </section>
    </main>
    <Footer/>
  </div>;
}
