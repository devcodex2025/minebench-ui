export interface Test {
  id: number;                // або string, якщо Supabase генерує uuid
  algorithm: string;
  device_name: string;
  device_type: string;
  avg_hashrate: number;      // в H/s
  avg_temp: number | null;   // °C
  created_at: string;       // дата у ISO форматі
}
export interface StatsCardsProps {
  tests: BenchmarkResult[];
}
export interface BenchmarkTableProps {
  results: BenchmarkResult[];
  onRefresh?: () => void;
}

export interface BenchmarkResult {
  id: number | string;                // Supabase може генерувати uuid
  timestamp?: string;                 // дата у ISO форматі
  algorithm?: string;
  hashrate?: number;                  // в H/s
  powerConsumption?: number;          // в W
  efficiency?: number;                // H/W
  temperature?: number;               // °C
  gpuModel?: string;
  driverVersion?: string;
  os?: string;
  miner?: string;
  pool?: string;
  difficulty?: number;
  shares?: {
    accepted?: number;
    rejected?: number;
    stale?: number;
  };
  uptime?: number;                    // в секундах
  profitability?: number;
  device_name?: string;
  device_type?: string;
  coin_name?: string;
  created_at?: string;
  avg_temp?: number;
  avg_power?: number;
  avg_hashrate?: number;
  max_hashrate?: number;
  duration_seconds?: number;
  device_uid?: string;
  [key: string]: any;                 // для будь-яких додаткових полів, що можуть з’явитися
}


export interface BenchmarkSummary {
  totalTests: number;
  averageHashrate: number;
  averageEfficiency: number;
  bestPerformer: {
    algorithm: string;
    hashrate: number;
    gpuModel: string;
  };
  recentTests: BenchmarkResult[];
}

export interface FilterOptions {
  algorithm?: string;
  gpuModel?: string;
  miner?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
