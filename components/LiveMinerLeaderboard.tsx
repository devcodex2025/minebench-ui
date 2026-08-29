import { Radio, ShieldCheck, Users } from 'lucide-react';
import { formatHashrate } from '@/lib/utils';

export type LiveMiner = {
  id: string;
  hashrate: number;
  connections: number;
  poolIds: string[];
  regions: string[];
  lastShareAt?: string;
};

type Props = {
  miners: LiveMiner[];
  onlineConnections: number;
};

export default function LiveMinerLeaderboard({ miners, onlineConnections }: Props) {
  const visibleMiners = miners.filter((miner) => miner.hashrate > 0).slice(0, 8);
  const maxHashrate = Math.max(...visibleMiners.map((miner) => miner.hashrate), 1);
  const trackedHashrate = miners.reduce((sum, miner) => sum + Math.max(0, miner.hashrate), 0);

  return (
    <div className="h-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70">
      <div className="border-b border-zinc-900 bg-zinc-950/60 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Live Miner Rank</h2>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">Current worker hashrate</p>
          </div>
          <div className="text-right">
            <div className="font-mono-system text-2xl font-black text-yellow-400">{miners.length}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">miners</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="border border-zinc-800 bg-black px-3 py-2">
            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Tracked</div>
            <div className="mt-1 font-mono text-sm font-black text-white">{formatHashrate(trackedHashrate)}</div>
          </div>
          <div className="border border-zinc-800 bg-black px-3 py-2">
            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Connections</div>
            <div className="mt-1 font-mono text-sm font-black text-white">{onlineConnections.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="min-h-[300px] px-5 py-3">
        {visibleMiners.length === 0 ? (
          <div className="flex min-h-[274px] flex-col items-center justify-center gap-3 text-center">
            <Users className="h-7 w-7 text-zinc-700" />
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Waiting for worker telemetry</div>
          </div>
        ) : (
          <ol className="divide-y divide-zinc-900">
            {visibleMiners.map((miner, index) => (
              <li key={miner.id} className="grid grid-cols-[30px_1fr_auto] items-center gap-2 py-2.5">
                <span className={`font-mono text-xs font-black ${index < 3 ? 'text-yellow-400' : 'text-zinc-600'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-[11px] font-bold text-white">{miner.id}</span>
                    <span className="truncate text-[8px] font-black uppercase tracking-widest text-zinc-600">
                      {miner.regions.join(' / ') || 'Pool'}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden bg-zinc-900">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300"
                      style={{ width: `${Math.max(3, (miner.hashrate / maxHashrate) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[11px] font-black text-yellow-400">{formatHashrate(miner.hashrate)}</div>
                  <div className="text-[8px] uppercase tracking-widest text-zinc-600">{miner.connections} conn.</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-zinc-900 px-5 py-3 text-[8px] font-bold uppercase tracking-[0.16em] text-zinc-600">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Miner identities are anonymized
      </div>
    </div>
  );
}
