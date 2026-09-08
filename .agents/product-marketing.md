# Product marketing context

**Document version:** v2
**Last updated:** 2026-09-07
**Status:** Code-derived working draft. Audience and motivation are hypotheses, not customer research.

## Product overview
MineBench is a desktop mining benchmark client with a public hardware leaderboard and live pool dashboard. Visitors can compare submitted CPU/GPU results, download the client, and inspect pool rewards. Current release availability is determined by the linked Bitbucket assets; do not promise a macOS build when one is absent.

## Audience and jobs
Primary audience hypothesis: individual miners and hardware enthusiasts comparing a current rig or tuning a desktop miner. They want to measure hashrate, compare submitted results, and inspect pool activity. Premium serves users who need custom Monero wallet/pool routing. B2B buying committees are not established.

## Problems and alternatives
Hardware specifications alone do not describe a submitted mining benchmark. The alternatives are manually comparing results, using a miner directly, and reading pool dashboards separately. No researched competitor superiority or customer switching evidence is available.

## Positioning and differentiation
Lead with measurement and comparison. Show actual client screenshots, public benchmark data, and links to the source repository. Explain benchmark results and pool rewards separately; a benchmark submission is not proof of a reward or future earnings.

## Pricing and upgrade
Free client download and public results. Existing Premium price: 29 USDC once, paid on Solana, with SOL network fees in addition. Owner confirmed on 2026-09-07: no expiry. Premium gates custom XMR wallet routing and P2Pool/custom Stratum settings. The client Mining page exposes threads, CPU priority, huge pages and RandomX modes without a Premium gate; include these in Free. Do not invent subscriptions, discounts, guarantees, activation SLAs, or earnings claims. Keep the free path available beside upgrade prompts.

## Objections and switching dynamics
- Compatibility: use release assets and the download page as the source of truth.
- Setup: explain download, benchmark, and comparison in three steps.
- Cost: show currency, one-time billing, wallet requirement, and additional fees before checkout.
- Trust: link to public results and Bitbucket; no fabricated reviews or security badges.
- Push/pull hypothesis: less manual comparison and a visual miner interface. Habit/anxiety hypotheses: established miner configuration and reluctance to change wallet routing.

## Customer language and voice
No customer quotes supplied. Use plain English: mining benchmark, hashrate, CPU, GPU, public results, pool, wallet, Premium. Explain specialized terms in context. Avoid keyword lists in body copy, guaranteed returns, maximum hashrate claims, and internal phrases such as “features that sell the upgrade.” Voice: practical, specific, calm, technically accurate.

## Proof
Live database counts are activity counts, not testimonials or conversion rates. Leaderboard logic selects the highest positive average hashrate per normalized device name; this is not a controlled lab ranking. Release assets and screenshots demonstrate the interface. No customer logos, independent reviews, or conversion baselines supplied.

## Goals and measurement
Primary: download selection. Secondary: public benchmark comparison, then informed Premium consideration. Track route views, download intent/selection, and checkout starts locally until an analytics destination is selected. A download click is not an installation; a checkout start is not a confirmed sale. No wallet addresses, signatures, balances, query strings, or search text in marketing events.

## Changelog
- v2 (2026-09-07) — Owner confirmed 29 USDC once with no expiry; corrected Free/Premium feature split after checking desktop Mining and Settings gates.
- v1 (2026-09-07) — Initial code-derived positioning, claim boundaries, pricing, and conversion goals for the website update.
