import type { Metadata } from 'next';
import PoolRewardsClient from './PoolRewardsClient';

export const metadata: Metadata = {
  title: 'MineBench Pool Reward History | Monero Blocks And XMR Rewards',
  description: 'Review MineBench pool block discoveries, confirmed XMR rewards, reward timestamps, Monero block heights, and BMT distribution totals.',
  alternates: {
    canonical: 'https://minebench.cloud/pool-rewards',
  },
  openGraph: {
    title: 'MineBench Pool Reward History',
    description: 'Live history of Monero blocks and XMR rewards received by the MineBench pool.',
    url: 'https://minebench.cloud/pool-rewards',
    type: 'website',
  },
};

export default function PoolRewardsPage() {
  return <PoolRewardsClient />;
}
