'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Zap, TrendingUp, Cpu, ChevronDown, ChevronUp, RefreshCw, Medal, Award, Star, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TokenBalanceCard from '@/components/TokenBalance';
import { formatHashrate, formatEfficiency } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  device_name: string;
  device_type: 'GPU' | 'CPU';
  gpu_model?: string;
  algorithm: string;
  avg_hashrate: number;
  efficiency: number;
  avg_power?: number;
  rank: number;
  total_tests: number;
  wallet_address?: string;
}

type SortField = 'avg_hashrate' | 'efficiency' | 'total_tests' | 'device_name';
type FilterType = 'all' | 'GPU' | 'CPU';

export default function LeaderboardClient() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('avg_hashrate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('all');
  const [algorithms, setAlgorithms] = useState<string[]>([]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: algoData } = await supabase
        .from('benchmarks')
        .select('algorithm')
        .order('algorithm');
      
      if (algoData) {
        const uniqueAlgos = Array.from(new Set(algoData.map((a: any) => a.algorithm)));
        setAlgorithms(uniqueAlgos);
      }

      let query = supabase
        .from('benchmarks')
        .select('*')
        .order('avg_hashrate', { ascending: false });

      if (selectedAlgorithm !== 'all') {
        query = query.eq('algorithm', selectedAlgorithm);
      }

      const { data, error } = await query;

      if (error) throw error;

      const deviceMap = new Map<string, LeaderboardEntry>();
      
      data.forEach((item: any) => {
        const key = item.device_uid || item.device_name;
        
        if (!deviceMap.has(key)) {
          deviceMap.set(key, {
            id: item.id,
            device_name: item.device_name,
            device_type: item.device_type as 'GPU' | 'CPU',
            gpu_model: item.gpu_model,
            algorithm: item.algorithm,
            avg_hashrate: Number(item.avg_hashrate),
            efficiency: Number(item.efficiency),
            avg_power: item.avg_power ? Number(item.avg_power) : undefined,
            rank: 0,
            total_tests: 1,
            wallet_address: item.wallet_address,
          });
        } else {
          const existing = deviceMap.get(key)!;
          if (Number(item.avg_hashrate) > existing.avg_hashrate) {
            existing.avg_hashrate = Number(item.avg_hashrate);
            existing.efficiency = Number(item.efficiency);
            existing.avg_power = item.avg_power ? Number(item.avg_power) : existing.avg_power;
          }
          existing.total_tests++;
        }
      });

      let leaderboardEntries = Array.from(deviceMap.values());

      if (filterType !== 'all') {
        leaderboardEntries = leaderboardEntries.filter(e => e.device_type === filterType);
      }

      leaderboardEntries = leaderboardEntries.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return bVal.localeCompare(aVal);
        }
        return (bVal as number) - (aVal as number);
      });
      leaderboardEntries = leaderboardEntries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setEntries(leaderboardEntries);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [sortField, sortDirection, filterType, selectedAlgorithm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-zinc-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-zinc-500 font-bold">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400/20 to-transparent border-yellow-400/50';
      case 2:
        return 'bg-gradient-to-r from-zinc-300/20 to-transparent border-zinc-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-transparent border-amber-600/50';
      default:
        return 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-400">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-tight mb-4">
              Mining Leaderboard
            </h1>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              Compare top-performing mining hardware across GPUs and CPUs. 
              Rankings are based on hashrate, efficiency, and total test submissions.
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-all ${
                  filterType === 'all'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('GPU')}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-all flex items-center space-x-2 ${
                  filterType === 'GPU'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>GPU</span>
              </button>
              <button
                onClick={() => setFilterType('CPU')}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-all flex items-center space-x-2 ${
                  filterType === 'CPU'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>CPU</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-zinc-500 font-mono uppercase">Algorithm:</span>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-white px-3 py-2 text-sm font-mono focus:border-yellow-400 focus:outline-none"
              >
                <option value="all">All</option>
                {algorithms.map((algo) => (
                  <option key={algo} value={algo}>{algo}</option>
                ))}
              </select>
            </div>

            <button
              onClick={loadLeaderboard}
              disabled={loading}
              className="p-2 border border-zinc-800 hover:border-yellow-400 text-zinc-500 hover:text-yellow-400 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* Table */}
        <div className="border border-zinc-800 bg-zinc-950">
          <div className="grid grid-cols-12 gap-4 p-4 text-xs font-mono uppercase text-zinc-500 border-b border-zinc-800">
            <div className="col-span-1 flex items-center justify-center">#</div>
            <div
              className="col-span-4 cursor-pointer hover:text-white transition-colors flex items-center"
              onClick={() => handleSort('device_name')}
            >
              Device
              {sortField === 'device_name' && (
                sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </div>
            <div className="col-span-2">Type</div>
            <div
              className="col-span-2 cursor-pointer hover:text-yellow-400 transition-colors flex items-center"
              onClick={() => handleSort('avg_hashrate')}
            >
              <Zap className="w-4 h-4 mr-2" />
              Hashrate
              {sortField === 'avg_hashrate' && (
                sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </div>
            <div
              className="col-span-2 cursor-pointer hover:text-yellow-400 transition-colors flex items-center"
              onClick={() => handleSort('efficiency')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Efficiency
              {sortField === 'efficiency' && (
                sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </div>
            <div className="col-span-1 text-center">Tests</div>
          </div>

          {/* Entries */}
          <AnimatePresence mode="popLayout">
            {loading && entries.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-yellow-400 mx-auto" />
                <p className="mt-4 text-zinc-500 font-mono">Loading leaderboard...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center">
                <Star className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="mt-4 text-zinc-500 font-mono">No entries found</p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className={`grid grid-cols-12 gap-4 p-4 border-b border-zinc-800/50 items-center transition-all ${getRankStyle(entry.rank)}`}
                >
                  <div className="col-span-1 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="col-span-4 flex items-center space-x-3">
                    <div className="relative w-8 h-8 flex-shrink-0 bg-zinc-900 rounded flex items-center justify-center p-1 border border-zinc-800">
                      {entry.device_name.toLowerCase().includes('nvidia') ? (
                        <Image src="/img/nvidia-icon.svg" alt="NVIDIA" width={20} height={20} className="object-contain" />
                      ) : entry.device_name.toLowerCase().includes('amd') || entry.device_name.toLowerCase().includes('radeon') ? (
                        <Image src="/img/radeon-icon.svg" alt="AMD" width={20} height={20} className="object-contain" />
                      ) : entry.device_type === 'CPU' ? (
                        <Cpu className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Zap className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm truncate max-w-[150px]">{entry.device_name}</p>
                      {entry.gpu_model && entry.gpu_model !== entry.device_name && (
                        <p className="text-[10px] text-zinc-500 uppercase font-mono">{entry.gpu_model.split(' ').slice(-1)}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mb-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (entry.avg_hashrate / (entries[0]?.avg_hashrate || 1)) * 100)}%` }}
                        className={`h-full ${entry.device_type === 'GPU' ? 'bg-yellow-400' : 'bg-blue-400'} shadow-[0_0_8px_rgba(250,204,21,0.3)]`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {Math.round((entry.avg_hashrate / (entries[0]?.avg_hashrate || 1)) * 100)}% POWER
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-white font-mono font-bold text-sm">{formatHashrate(entry.avg_hashrate)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-yellow-400 font-mono">{formatEfficiency(entry.efficiency)}</p>
                  </div>
                  <div className="col-span-1 text-center text-zinc-500 font-mono">
                    {entry.total_tests}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Top Stats */}
        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/30 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400 font-bold uppercase tracking-wide">Top Hashrate</span>
              </div>
              <p className="text-2xl font-bold text-white">{entries[0]?.device_name}</p>
              <p className="text-yellow-400 font-mono mt-1">{formatHashrate(entries[0]?.avg_hashrate || 0)}</p>
            </div>

            <div className="bg-gradient-to-br from-zinc-700/20 to-transparent border border-zinc-600/30 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-zinc-300" />
                <span className="text-zinc-400 font-bold uppercase tracking-wide">Best Efficiency</span>
              </div>
              {entries.sort((a, b) => b.efficiency - a.efficiency).slice(0, 1).map((best) => (
                <div key={best.id}>
                  <p className="text-2xl font-bold text-white">{best.device_name}</p>
                  <p className="text-zinc-400 font-mono mt-1">{formatEfficiency(best.efficiency)}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-600/30 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Award className="w-6 h-6 text-amber-600" />
                <span className="text-amber-600 font-bold uppercase tracking-wide">Most Active</span>
              </div>
              {entries.sort((a, b) => b.total_tests - a.total_tests).slice(0, 1).map((most) => (
                <div key={most.id}>
                  <p className="text-2xl font-bold text-white">{most.device_name}</p>
                  <p className="text-amber-600 font-mono mt-1">{most.total_tests} submissions</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}