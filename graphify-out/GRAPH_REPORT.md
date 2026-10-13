# Graph Report - MineBench-UI  (2026-09-08)

## Corpus Check
- 87 files · ~1,165,528 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 518 nodes · 637 edges · 44 communities (32 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `86a0d5c6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `formatHashrate()` - 16 edges
3. `getLatestClientRelease()` - 11 edges
4. `MineBench UI` - 11 edges
5. `Product marketing context` - 11 edges
6. `🎯 Minebench UI - Complete Deployment Guide` - 11 edges
7. `BenchmarkResult` - 9 edges
8. `🚀 Akash Deployment Guide for Minebench UI` - 9 edges
9. `getLeaderboardRows()` - 8 edges
10. `validateBenchmarkPayload()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `LandingPageClient()` --calls--> `formatHashrate()`  [EXTRACTED]
  app/LandingPageClient.tsx → lib/utils.ts
- `LandingPage()` --calls--> `getLatestClientRelease()`  [EXTRACTED]
  app/page.tsx → lib/clientRelease.ts
- `DashboardClient()` --calls--> `getLeaderboardRows()`  [EXTRACTED]
  app/dashboard/DashboardClient.tsx → lib/leaderboard.ts
- `generateMetadata()` --calls--> `getLatestClientRelease()`  [EXTRACTED]
  app/downloads/page.tsx → lib/clientRelease.ts
- `DownloadsPage()` --calls--> `getLatestClientRelease()`  [EXTRACTED]
  app/downloads/page.tsx → lib/clientRelease.ts

## Communities (44 total, 12 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (30): LandingPageClient(), LiveMiner, LiveMinerLeaderboard(), Props, NetworkStrip(), PAD, Point, PoolBlock (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (14): HeaderProps, points, TokenAllocation, TokenomicsChartProps, LandingHeroProps, metadata, PAYOUT_STATUS, PoolBlock (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (41): dependencies, autoprefixer, border-beam, clsx, dotenv, embla-carousel-autoplay, embla-carousel-react, @fontsource-variable/inter (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (29): 1. Create Deployment, 1. Install Akash CLI, 1. Update deploy.yml, 2. Create Akash Account, 2. Find Providers, 2. Make Image Public, 3. Create Lease, 3. GitHub Container Registry Setup (+21 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (23): 1. Push to GitHub, 2. Make Package Public, 3. Deploy to Akash, 🛠️ Available Scripts, Common Issues:, 🔧 Configuration Files, 💰 Cost Breakdown, Dashboard Features: (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (20): 1. 📁 Prepare Your Repository, 2. 🐳 GitHub Container Registry Setup, 3. 🔓 Make Package Public, 4. 🌐 Akash Network Setup, 5. 🚀 Deploy to Akash, 6. 📊 Monitor Your Deployment, 📚 Additional Resources, Automated Deployment (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (12): handler(), DownloadsPage(), generateMetadata(), BitbucketDownload, BitbucketDownloadsResponse, ClientRelease, createFallbackClientRelease(), getClientReleaseFallback() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (27): Counter(), formatCounterValue(), LandingStats, PoolStatus, Scene3D, TreasuryStatus, getLandingStats(), getPoolStats() (+19 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (14): description, devDependencies, eslint, eslint-config-next, pino-pretty, name, private, scripts (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (11): Build, Configuration model, Design intent, Documentation, License, Local development, MineBench UI, Security posture (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (11): Audience and jobs, Changelog, Customer language and voice, Goals and measurement, Objections and switching dynamics, Positioning and differentiation, Pricing and upgrade, Problems and alternatives (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): Крок 1: Створіть таблицю в Supabase, Крок 2: Перевірте створення таблиці, Крок 3: Тестування, Структура таблиці, Інструкція з налаштування таблиці global_stats

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (4): { createClient }, fs, path, supabase

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (16): handler(), PUBLIC_FIELDS, supabase, toFiniteNumber(), toStringOrNull(), ALGORITHM_RULES, ALLOWED_FIELDS, BenchmarkSecurityError (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.40
Nodes (4): Governance, Historical notes, MineBench UI Docs, Start here

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (28): Badge(), BadgeColor, BadgeProps, styles, Button(), ButtonLink(), ButtonLinkProps, ButtonProps (+20 more)

### Community 19 - "Community 19"
Cohesion: 0.25
Nodes (7): Applied skills, MineBench website marketing update, Page and intent map, Product evidence and copy decisions, SEO validation and boundaries, Tracking plan, Verification

### Community 36 - "Community 36"
Cohesion: 0.06
Nodes (23): metadata, viewport, SolanaWalletProvider(), RewardsData, TokenBalance, PREMIUM_FAQS, EventProperties, MarketingEvent (+15 more)

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (3): ALLOWED_RANGES, PAYOUT_STATUSES, PoolReward

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (4): ALLOWED_RANGES, BMT_STATUSES, MONERO_STATUSES, PoolBlock

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (3): BoardUI and React 19 migration, Design system, Development (WSL)

### Community 41 - "Community 41"
Cohesion: 0.50
Nodes (3): Evidence used, Preview handling, Whitepaper revision — 7 September 2026

## Knowledge Gaps
- **265 isolated node(s):** `extends`, `{ createClient }`, `fs`, `path`, `supabase` (+260 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 2` to `Community 9`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `formatHashrate()` connect `Community 0` to `Community 8`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `trackMarketingEvent()` connect `Community 36` to `Community 16`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `extends`, `{ createClient }`, `fs` to the rest of the system?**
  _265 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06753006475485661 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04756871035940803 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._