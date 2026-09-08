import { PREMIUM_PRICE_USDC } from '@/lib/marketing';

export function GET() {
  return new Response(`# MineBench pricing

## Free
Price: 0. No purchase required to download the client or browse public results.
Includes: client download, benchmarks, public hardware leaderboard, live dashboard, thread count, CPU priority, huge pages, and RandomX modes.
Download: https://minebench.cloud/downloads

## Premium
Price: ${PREMIUM_PRICE_USDC} USDC once, paid on Solana. No expiry and no recurring subscription.
Additional costs: SOL network fees. The current checkout requires at least 0.005 SOL available; this is not a fixed fee.
Includes Free features plus: custom Monero wallet routing and P2Pool/custom Stratum settings.
Requires: a Solana wallet with USDC and SOL. Payment requires approval in the wallet.
Payout conditions depend on the pool. No hashrate or earnings guarantee.
Plan comparison and checkout: https://minebench.cloud/premium
Support: https://discord.gg/vsDyYh4rma
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
