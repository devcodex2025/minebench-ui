import { useState, useEffect } from 'react';
import { Search, Zap, Cpu, Monitor, ChevronUp, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { BenchmarkTableProps, BenchmarkResult } from '@/types/benchmark';
import { formatHashrate } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FilterOptions {
  algorithm?: string;
  device_name?: string;
  device_type?: string;
}

export default function BenchmarkTable({ results }: BenchmarkTableProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
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

  const getUniqueValues = (field: keyof BenchmarkResult) => {
    return Array.from(new Set(results.map(r => r[field] as string))).sort();
  };

  const hashrateList = results.map(r => r.avg_hashrate || 0);
  const maxHashrate = hashrateList.length > 0 ? Math.max(...hashrateList) : 1;

  const getVendorIcon = (deviceName: string) => {
    const name = deviceName?.toLowerCase() || '';
    if (name.includes('nvidia') || name.includes('geforce') || name.includes('rtx') || name.includes('gtx')) {
      return { icon: '/img/nvidia-icon.svg', color: 'text-green-500' };
    }
    if (name.includes('amd') || name.includes('radeon') || name.includes('rx ')) {
      return { icon: '/img/radeon-icon.svg', color: 'text-red-500' };
    }
    if (name.includes('intel') || name.includes('arc') || name.includes('core')) {
      return { icon: '/img/cpu-icon.svg', color: 'text-blue-500' };
    }
    return null;
  };

  const deduplicatedResults = Object.values(
    results.reduce((acc, current) => {
      const key = `${current.device_name?.toLowerCase()}-${current.algorithm}`;
      if (!acc[key] || (current.avg_hashrate || 0) > (acc[key].avg_hashrate || 0)) {
        acc[key] = current;
      }
      return acc;
    }, {} as Record<string, BenchmarkResult>)
  );

  const filteredResults = deduplicatedResults
    .filter(r => {
      const avgRate = r.avg_hashrate || 0;
      if (avgRate <= 0) return false;
      
      if (filters.algorithm && r.algorithm !== filters.algorithm) return false;
      if (filters.device_name && r.device_name !== filters.device_name) return false;
      if (filters.device_type && r.device_type !== filters.device_type) return false;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl overflow-hidden"
    >
      <div className="px-6 py-4 flex items-center bg-zinc-950/50 border-b border-zinc-900">
        <h2 className="text-xl font-bold text-white uppercase tracking-[0.1em] flex items-center gap-3 italic">
          <Zap className="w-5 h-5 text-yellow-400" />
          Benchmark Results
        </h2>
      </div>

      <div className="p-6 border-b border-zinc-900 bg-zinc-950/40 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <select
          value={filters.algorithm || ''}
          onChange={e => setFilters({ ...filters, algorithm: e.target.value || undefined })}
          className="bg-zinc-950 border border-zinc-800 text-white px-4 py-2 focus:outline-none focus:border-yellow-400 hover:border-yellow-400 transition-all uppercase tracking-wide text-sm"
        >
          <option value="">All Algorithms</option>
          {getUniqueValues('algorithm').map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          value={filters.device_name || ''}
          onChange={e => setFilters({ ...filters, device_name: e.target.value || undefined })}
          className="bg-zinc-950 border border-zinc-800 text-white px-4 py-2 focus:outline-none focus:border-yellow-400 hover:border-yellow-400 transition-all uppercase tracking-wide text-sm"
        >
          <option value="">All Devices</option>
          {getUniqueValues('device_name').map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={filters.device_type || ''}
          onChange={e => setFilters({ ...filters, device_type: e.target.value || undefined })}
          className="bg-zinc-950 border border-zinc-800 text-white px-4 py-2 focus:outline-none focus:border-yellow-400 hover:border-yellow-400 transition-all uppercase tracking-wide text-sm"
        >
          <option value="">All Types</option>
          {getUniqueValues('device_type').map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-zinc-950">
            <tr>
              {[
                { key: 'device_name', label: 'Hardware/Vendor' },
                { key: 'avg_hashrate', label: 'Average Rate' },
                { key: '_power_bar', label: 'Performance Index' },
                { key: 'avg_power', label: 'Consumption' },
                { key: 'avg_temp', label: 'Thermal' },
                { key: 'algorithm', label: 'Algo' },
                { key: 'duration_seconds', label: 'Stability' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-6 py-5 text-left text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] cursor-pointer hover:text-yellow-400 transition-colors bg-black/40 backdrop-blur-sm"
                  onClick={() => key !== '_power_bar' && handleSort(key as keyof BenchmarkResult)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{label}</span>
                    {sortField === key && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-yellow-400" /> : <ChevronDown className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 bg-zinc-950/20">
            {filteredResults.map((r, index) => {
              const vendor = getVendorIcon(r.device_name || '');
              const rates = r.avg_hashrate || 0;
              const relativePower = (rates / maxHashrate) * 100;
              
              return (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-yellow-400/[0.02] border-l-2 border-l-transparent hover:border-l-yellow-400 transition-all group"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-yellow-400/50 transition-colors p-2 text-zinc-500">
                      {vendor ? (
                        <div className="relative w-full h-full">
                          <Image src={vendor.icon} alt="Vendor" fill className="object-contain filter grayscale brightness-200" />
                        </div>
                      ) : (
                        r.device_type?.toLowerCase() === 'cpu' ? <Cpu className="w-5 h-5" /> : <Monitor className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-black text-sm text-white uppercase tracking-tight leading-none mb-1">{r.device_name}</div>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{r.device_type} / {r.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-yellow-400 font-black text-lg font-mono tracking-tighter">{formatHashrate(r.avg_hashrate || 0)}</span>
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
                        initial={{ width: 0 }}
                        animate={{ width: `${relativePower}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full shadow-[0_0_10px_rgba(250,204,21,0.3)]"
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    {r.avg_power && r.avg_power > 0 ? (
                      <>
                        <span className="text-white font-black font-mono text-sm leading-none mb-1">
                          {r.avg_power.toFixed(0)}W
                        </span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Load</span>
                      </>
                    ) : (
                      <span className="text-zinc-600 font-black font-mono text-sm leading-none mb-1">&nbsp;</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    {r.avg_temp && r.avg_temp > 0 ? (
                      <>
                        <span className={`font-black font-mono text-sm leading-none mb-1 ${r.avg_temp > 75 ? 'text-red-500' : r.avg_temp > 65 ? 'text-orange-500' : 'text-yellow-400'}`}>
                          {r.avg_temp.toFixed(1)}°C
                        </span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Thermal</span>
                      </>
                    ) : (
                      <span className="text-zinc-600 font-black font-mono text-sm leading-none mb-1">&nbsp;</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded inline-block">
                     <span className="text-white text-[10px] font-black uppercase tracking-widest">{r.algorithm}</span>
                   </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-zinc-400 text-xs font-bold font-mono uppercase">{(r.duration_seconds || 0).toFixed(0)}s ACTIVE</span>
                  </div>
                </td>
              </motion.tr>
            );})}
          </tbody>
        </table>
      </div>
      <div className="bg-zinc-950 px-6 py-3 border-t border-zinc-900 flex justify-between text-xs text-zinc-500 uppercase tracking-wide">
        <span>Showing {filteredResults.length} of {deduplicatedResults.length} unique nodes</span>
        <span>Last updated: {mounted ? new Date().toLocaleString() : '---'}</span>
      </div>
    </motion.div>
  );
}
