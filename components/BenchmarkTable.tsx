import { useState, useEffect } from 'react';
import { Search, Cpu, Gpu, Microchip, Gauge, BarChart3, PlugZap, Thermometer, Binary, ArrowUpRight, ChevronUp, ChevronDown, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { BenchmarkTableProps, BenchmarkResult } from '@/types/benchmark';
import { formatHashrate } from '@/lib/utils';
import { getBenchmarkHashrate, getLeaderboardRows, normalizeDeviceName } from '@/lib/leaderboard';
import { motion, useReducedMotion } from 'framer-motion';

export default function BenchmarkTable({ results, showRank = false }: BenchmarkTableProps & { showRank?: boolean }) {
  const reducedMotion = useReducedMotion();
  const [sortField, setSortField] = useState<keyof BenchmarkResult>('avg_hashrate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSort = (field: keyof BenchmarkResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getFirstPositiveMetric = (...values: Array<number | null | undefined>) => {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
      }
    }
    return null;
  };

  const getDisplayPower = (result: BenchmarkResult) => getFirstPositiveMetric(
    result.avg_power,
    result.powerConsumption,
    result.power,
    result.watts,
    result.metrics?.power,
    result.sensors?.power
  );

  const getDisplayTemp = (result: BenchmarkResult) => getFirstPositiveMetric(
    result.avg_temp,
    result.temperature,
    result.temp,
    result.temp_c,
    result.metrics?.temperature,
    result.sensors?.temperature
  );

  const deduplicatedResults = getLeaderboardRows(results);
  const ranks = new Map(deduplicatedResults.map((result, index) => [result.id, index + 1]));

  const filteredResults = deduplicatedResults
    .filter(r => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (r.algorithm ?? '').toLowerCase().includes(term) ||
          (r.device_name ?? '').toLowerCase().includes(term) ||
          (r.device_type ?? '').toLowerCase().includes(term) ||
          (r.coin_name ?? '').toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

  const maxHashrate = filteredResults.length > 0
    ? Math.max(...filteredResults.map(r => getBenchmarkHashrate(r)), 1)
    : 1;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="benchmark-results glass-panel rounded-xl overflow-hidden"
    >
      <div className="px-6 py-4 flex items-center bg-zinc-950/50 border-b border-zinc-900">
        <h2 className="text-xl font-medium text-white flex items-center gap-3">
          <span className="benchmark-title-icon"><Microchip size={20} strokeWidth={1.6} /></span>
          Benchmark results
        </h2>
        <span className="benchmark-table-hint">Select hardware to inspect its benchmark <ArrowUpRight size={14}/></span>
      </div>

      <div className="p-6 border-b border-zinc-900 bg-zinc-950/40 grid grid-cols-1 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            aria-label="Search benchmark hardware or algorithm"
            placeholder="Search hardware or algorithm..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <table className="board-table w-full min-w-[1000px]">
          <caption className="sr-only">Mining hardware benchmark results</caption>
          <thead className="bg-zinc-950">
            <tr>
              {showRank && <th scope="col" className="px-4 py-3 text-center">Rank</th>}
              {[
                { key: 'device_name', label: 'Hardware', icon: Microchip },
                { key: 'avg_hashrate', label: 'Hashrate', icon: Gauge },
                { key: '_power_bar', label: 'Relative rate', icon: BarChart3 },
                { key: 'avg_power', label: 'Power', icon: PlugZap },
                { key: 'avg_temp', label: 'Temperature', icon: Thermometer },
                { key: 'algorithm', label: 'Algorithm', icon: Binary },
                { key: 'duration_seconds', label: 'Duration', icon: Clock3 },
              ].map(({ key, label, icon: Icon }) => (
                <th
                  key={key}
                  scope="col"
                  aria-sort={sortField === key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                  className="px-6 py-3 text-left"
                >
                  {key === '_power_bar' ? <span className="flex items-center gap-2"><Icon size={13}/>{label}</span> : <button
                    type="button"
                    onClick={() => handleSort(key as keyof BenchmarkResult)}
                    className="flex items-center gap-2 rounded-lg py-1 hover:text-yellow-400"
                  >
                    <Icon size={13} strokeWidth={1.6}/>
                    <span>{label}</span>
                    {sortField === key && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-yellow-400" /> : <ChevronDown className="w-3 h-3 text-yellow-400" />
                    )}
                  </button>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 bg-zinc-950/20">
            {filteredResults.length === 0 && (
              <tr>
                <td colSpan={showRank ? 8 : 7} className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-zinc-200">{searchTerm ? 'No matching hardware' : 'No benchmark results yet'}</p>
                  <p className="mt-2 text-xs text-zinc-500">{searchTerm ? 'Try a different hardware name or algorithm.' : 'Results will appear when benchmark data is available.'}</p>
                </td>
              </tr>
            )}
            {filteredResults.map((r, index) => {
              const deviceName = normalizeDeviceName(r);
              const rank = ranks.get(r.id)!;
              const rates = getBenchmarkHashrate(r);
              const relativePower = (rates / maxHashrate) * 100;
              const displayPower = getDisplayPower(r);
              const displayTemp = getDisplayTemp(r);
              
              return (
              <motion.tr
                key={r.id}
                initial={reducedMotion ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reducedMotion ? 0 : Math.min(index * 0.03, 0.3), duration: reducedMotion ? 0 : 0.3 }}
                className="hover:bg-yellow-400/[0.02] border-l-2 border-l-transparent hover:border-l-yellow-400 transition-all group"
              >
                {showRank && <td className="px-4 py-5 text-center">
                  <span aria-label={`Rank ${rank}`} className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-mono text-sm font-semibold tabular-nums ${rank <= 3 ? 'border border-yellow-400/30 bg-yellow-400/10 text-yellow-400' : 'text-zinc-400'}`}>
                    {rank}
                  </span>
                </td>}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="benchmark-hardware-icon" aria-hidden="true">
                      {r.device_type?.toLowerCase() === 'cpu' ? <Cpu size={21} strokeWidth={1.5}/> : <Gpu size={21} strokeWidth={1.5}/>}
                    </div>
                    <div>
                      <Link href={`/benchmark/${encodeURIComponent(String(r.id))}`} prefetch={false} className="benchmark-device-link">
                        <span>{deviceName}</span><ArrowUpRight size={15}/>
                      </Link>
                      <div className="benchmark-device-caption"><span>{r.device_type}</span><span>View benchmark #{r.id}</span></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-yellow-400 font-black text-lg font-mono tracking-tighter">{formatHashrate(getBenchmarkHashrate(r))}</span>
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Peak: {formatHashrate(r.max_hashrate || 0)}</span>
                  </div>
                </td>
                <td className="px-6 py-5 min-w-[200px]">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-zinc-500">Performance index</span>
                      <span className="text-yellow-400 font-mono italic">{relativePower.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={reducedMotion ? false : { width: 0 }}
                        animate={{ width: `${relativePower}%` }}
                        transition={{ duration: reducedMotion ? 0 : 1, delay: reducedMotion ? 0 : 0.5 }}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full shadow-[0_0_10px_rgba(250,204,21,0.3)]"
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    {displayPower ? (
                      <>
                        <span className="text-white font-black font-mono text-sm leading-none mb-1">
                          {displayPower.toFixed(0)}W
                        </span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Load</span>
                      </>
                    ) : (
                      <>
                        <span className="text-zinc-500 font-black font-mono text-sm leading-none mb-1">N/A</span>
                        <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">Sensor unavailable</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    {displayTemp ? (
                      <>
                        <span className={`font-black font-mono text-sm leading-none mb-1 ${displayTemp > 75 ? 'text-red-500' : displayTemp > 65 ? 'text-orange-500' : 'text-yellow-400'}`}>
                          {displayTemp.toFixed(1)}°C
                        </span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Thermal</span>
                      </>
                    ) : (
                      <>
                        <span className="text-zinc-500 font-black font-mono text-sm leading-none mb-1">N/A</span>
                        <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">Sensor unavailable</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg inline-block">
                     <span className="text-white text-[10px] font-black uppercase tracking-widest">{r.algorithm}</span>
                   </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Clock3 className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-zinc-400 text-xs font-bold font-mono">{(r.duration_seconds || 0).toFixed(0)}s</span>
                  </div>
                </td>
              </motion.tr>
            );})}
          </tbody>
        </table>
      </div>
      <div className="bg-zinc-950 px-6 py-3 border-t border-zinc-900 flex flex-wrap justify-between gap-2 text-xs text-zinc-500">
        <span>Showing {filteredResults.length} leaderboard devices from {results.length} submissions</span>
        <span>Last updated: {mounted ? new Date().toLocaleString() : '---'}</span>
      </div>
    </motion.div>
  );
}

