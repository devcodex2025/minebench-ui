import { BenchmarkSummary, BenchmarkResult } from '@/types/benchmark';
import { formatHashrate, formatEfficiency } from '@/lib/utils';
import { TrendingUp, Cpu, Zap, Award, Clock, Monitor } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  summary: BenchmarkSummary;
}

export default function StatsCards({ summary }: StatsCardsProps) {
  const stats = [
    {
      title: 'Total Network Tests',
      value: summary.totalTests.toLocaleString(),
      icon: Cpu,
      color: 'from-yellow-500/20 to-yellow-600/5',
      shadow: 'shadow-yellow-500/10'
    },
    {
      title: 'Average Peak Rate',
      value: formatHashrate(summary.averageHashrate),
      icon: TrendingUp,
      color: 'from-blue-500/20 to-blue-600/5',
      shadow: 'shadow-blue-500/10'
    },
    ...(summary.averageEfficiency > 0 ? [{
      title: 'Global Efficiency',
      value: formatEfficiency(summary.averageEfficiency),
      icon: Zap,
      color: 'from-green-500/20 to-green-600/5',
      shadow: 'shadow-green-500/10'
    }] : []),
    {
      title: 'Best CPU',
      value: summary.bestPerformer.gpuModel,
      subtitle: summary.bestPerformer.algorithm,
      icon: Award,
      color: 'from-purple-500/20 to-purple-600/5',
      shadow: 'shadow-purple-500/10'
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            variants={item}
            whileHover={{ y: -5, scale: 1.02 }}
            className="glass-panel group relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/30 p-6 transition-all hover:bg-zinc-950/50 hover:border-zinc-800"
          >
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}></div>
            
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-yellow-400 shadow-xl transition-transform group-hover:scale-110 ${stat.shadow}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="h-1 w-8 rounded-full bg-zinc-900 group-hover:bg-yellow-400/20 transition-colors"></div>
              </div>
              
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-white tracking-tighter uppercase font-mono-system">{stat.value}</h4>
                </div>
                {stat.subtitle && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-yellow-400 animate-pulse"></div>
                    <p className="text-[10px] font-bold text-zinc-400 truncate uppercase tracking-widest">{stat.subtitle}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

interface RecentTestsProps {
  tests: BenchmarkResult[];
}

export function RecentTests({ tests }: RecentTestsProps) {
  const nonZeroTests = [...tests]
    .filter(t => t.avg_hashrate != null && t.avg_hashrate > 0)
    .sort((a, b) => {
      const aTime = new Date(String(a.created_at ?? a.timestamp ?? 0)).getTime();
      const bTime = new Date(String(b.created_at ?? b.timestamp ?? 0)).getTime();
      return bTime - aTime;
    });

  if (nonZeroTests.length === 0) return (
    <div className="border border-zinc-900/50 rounded-xl p-8 text-center bg-zinc-950/20 backdrop-blur-sm">
      <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest leading-relaxed">No live benchmark data detected</p>
    </div>
  );

  return (
    <div className="glass-panel rounded-xl overflow-hidden shadow-2xl relative group h-full flex flex-col">
      <div className="p-5 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic flex items-center gap-3">
          <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
          Recent Activity
        </h3>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
          <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
          <div className="w-1 h-1 rounded-full bg-zinc-600"></div>
        </div>
      </div>

      <div className="divide-y divide-zinc-900/50 bg-black/20 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {nonZeroTests.map((test, index) => {
          const isGPU = test.device_type?.toLowerCase() === 'gpu';
          const testDate = test.created_at || test.timestamp
            ? new Date(String(test.created_at ?? test.timestamp))
            : null;
          
          return (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 hover:bg-yellow-400/[0.03] transition-colors group/row"
            >
              <div className="flex items-center space-x-4 min-w-0">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1.5 group-hover/row:border-yellow-400/30 transition-colors">
                    {isGPU ? (
                      <Monitor className="w-full h-full text-zinc-500 group-hover/row:text-yellow-400 transition-colors" />
                    ) : (
                      <Cpu className="w-full h-full text-zinc-500 group-hover/row:text-yellow-400 transition-colors" />
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white uppercase break-words whitespace-normal tracking-tight leading-none mb-1">{test.device_name || 'GENERIC WORKER'}</p>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{test.algorithm || 'RANDOMX'}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-black text-yellow-400 font-mono-system tracking-tighter">
                  {test.avg_hashrate != null ? formatHashrate(test.avg_hashrate) : formatHashrate(0)}
                </p>
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">
                  {testDate
                    ? testDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'JUST NOW'}
                </p>
                {testDate && (
                  <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-tighter">
                    {testDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
