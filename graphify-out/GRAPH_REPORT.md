# Graph Report - MineBench-UI  (2026-06-11)

## Corpus Check
- 59 files · ~427,930 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 347 nodes · 404 edges · 36 communities (25 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9148fdc3`
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

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `getLatestClientRelease()` - 11 edges
3. `MineBench UI` - 11 edges
4. `🎯 Minebench UI - Complete Deployment Guide` - 11 edges
5. `formatHashrate()` - 10 edges
6. `BenchmarkResult` - 9 edges
7. `🚀 Akash Deployment Guide for Minebench UI` - 9 edges
8. `getLeaderboardRows()` - 8 edges
9. `Step-by-Step Guide to Deploy Minebench UI on Akash` - 7 edges
10. `🌐 Deploy to Akash` - 6 edges

## Surprising Connections (you probably didn't know these)
- `LandingPageClient()` --calls--> `formatHashrate()`  [EXTRACTED]
  app/LandingPageClient.tsx → lib/utils.ts
- `LandingPage()` --calls--> `getLatestClientRelease()`  [EXTRACTED]
  app/page.tsx → lib/clientRelease.ts
- `generateMetadata()` --calls--> `getLatestClientRelease()`  [EXTRACTED]
  app/downloads/page.tsx → lib/clientRelease.ts
- `DownloadsPage()` --calls--> `getLatestClientRelease()`  [EXTRACTED]
  app/downloads/page.tsx → lib/clientRelease.ts
- `LeaderboardClient()` --calls--> `getLeaderboardRows()`  [EXTRACTED]
  app/leaderboard/LeaderboardClient.tsx → lib/leaderboard.ts

## Communities (36 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (29): LandingPageClient(), BenchmarkTable(), NetworkStrip(), RecentTests(), RecentTestsProps, StatsCards(), StatsCardsProps, DashboardClient() (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (16): HeaderProps, APP_SCREENSHOTS, BuildVariant, Release, Scene3D, DRAG_SPRING, ShaderScreenshotSliderProps, ShaderSlide (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (31): dependencies, autoprefixer, clsx, dotenv, embla-carousel-autoplay, embla-carousel-react, framer-motion, gsap (+23 more)

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
Cohesion: 0.28
Nodes (9): handler(), DownloadsPage(), generateMetadata(), createFallbackClientRelease(), getClientReleaseFallback(), getLatestClientRelease(), githubHeaders(), GithubRelease (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (14): Counter(), formatCounterValue(), LandingStats, PoolStatus, Scene3D, TreasuryStatus, getLandingStats(), getPoolStats() (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (13): description, devDependencies, eslint, eslint-config-next, pino-pretty, name, private, scripts (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (11): Build, Configuration model, Design intent, Documentation, License, Local development, MineBench UI, Security posture (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (3): metadata, viewport, SolanaWalletProvider()

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): Крок 1: Створіть таблицю в Supabase, Крок 2: Перевірте створення таблиці, Крок 3: Тестування, Структура таблиці, Інструкція з налаштування таблиці global_stats

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (4): { createClient }, fs, path, supabase

### Community 14 - "Community 14"
Cohesion: 0.60
Nodes (4): handler(), supabase, toFiniteNumber(), toStringOrNull()

### Community 15 - "Community 15"
Cohesion: 0.40
Nodes (4): Governance, Historical notes, MineBench UI Docs, Start here

## Knowledge Gaps
- **178 isolated node(s):** `extends`, `{ createClient }`, `fs`, `path`, `supabase` (+173 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 2` to `Community 9`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `getLatestClientRelease()` connect `Community 7` to `Community 8`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `extends`, `{ createClient }`, `fs` to the rest of the system?**
  _178 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07624113475177305 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.058029689608636977 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._