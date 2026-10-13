# Whitepaper revision — 7 September 2026

The website now separates implemented mining features from proposed MineBench IQ work. No external publication or deployment is part of this revision.

## Evidence used

- Client tag `v0.8.38` and recent release history: Tauri desktop client, signed updater, statistics synchronization, warm-up/safe-mode and payout progress improvements.
- `pages/api/benchmarks.ts` and `lib/leaderboard.ts`: authenticated off-chain submissions; normalized device names and best positive submitted average hashrate.
- `app/pool-rewards/PoolRewardsClient.tsx`: separate XMR payout, BMT accounting and Solana settlement states.
- `lib/marketing.ts` and the owner's explicit confirmation: Premium is 29 USDC once, without expiry or recurring subscription; network fees are additional.
- Owner discussion “Створення поста MineBench IQ” (`6a996d19-6610-83eb-b9cf-ad8b7dee4f2f`): MBIQ token launched; IQ application still planned; XMR → SOL → BMT automation is future work.
- Owner discussion “Підготуй публікацію MineBench” (`6a9c8dfa-fa6c-83eb-a07c-5f28bd49b6d1`): initial IQ service on operator GPU servers, free early access, workload evaluation, estimated 2–4 week MVP target rather than a committed marketplace launch date.
- Discussion “Безпечний AI клієнт MineBench IQ” (`6a99c705-2434-83ed-8955-adcd5697faaa`) explored privacy architecture; suggestions are not implemented capabilities or guarantees.

Direct access to the official X profile was unavailable. Chat drafts were not treated as verified published announcements. The site links to the official profile without attributing claims to unread posts.

Removed unsupported descriptions of on-chain benchmark storage, full decentralization, governance, vesting and automatic rewards for benchmark submission. Preserved the existing BMT mint and project links; no unverified MBIQ address was added.

## Preview handling

Build in a separate staging directory from the running preview. Copy standalone static assets and attach public assets before switching servers; rebuilding the active standalone directory can invalidate the running process and asset paths.
