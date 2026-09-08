# MineBench website marketing update

Updated: 2026-09-07. Scope: existing website, React 19 / Tailwind 4 / Board UI styling. No external publication or paid-service setup.

## Applied skills

| Skill | Concrete application |
| --- | --- |
| product-marketing | `.agents/product-marketing.md`: evidence, audience hypotheses, voice and owner-confirmed offer. |
| copywriting | Mining-specific hero, free-download CTA, first benchmark steps and Premium positioning. |
| copy-editing | Removed keyword-stuffed paragraphs, internal sales language, unsupported instant-payout and maximum-hashrate claims. |
| cro | One primary download path, public comparison as secondary action, setup steps and objection FAQs. |
| site-architecture | Prioritized results in navigation; footer links to all public sections; linked overview anchor, comparison and download paths; Premium breadcrumb. Existing URLs retained. |
| seo-audit | Shorter page metadata, removed inaccurate macOS download promises, noindex for wallet callback, removed fabricated sitemap modification dates. |
| schema | Server-rendered Premium SoftwareApplication/Offer, matching FAQs and breadcrumb; homepage FAQ shares the same source as visible answers. |
| ai-seo | Plain-language definitions and comparison methodology, readable pricing, `llms.txt` and `/pricing.txt`. |
| analytics | Bounded local events, explicit privacy filtering, download selection and checkout-start instrumentation. |
| pricing | 29 USDC once, no expiry, fees extra; Free/Premium comparison reflects actual desktop feature gates. |
| paywalls | Price and requirements before wallet connection, separate payment approval, continued free access, help path and inline activation state. |

## Product evidence and copy decisions

- Owner confirmed 29 USDC once with no expiry on 2026-09-07. Corrected the contradictory `$29/year` label in the desktop Settings page only; no desktop payment logic changed.
- Client `src/pages/Settings.tsx` gates custom wallet/pool settings behind Premium. `src/pages/Mining.tsx` exposes CPU priority, threads, huge pages and RandomX modes without that gate. These belong to Free in the comparison.
- UI `lib/leaderboard.ts` chooses the best positive submitted average hashrate per normalized device name. Results are not independent lab measurements and do not prove earnings.
- Live download counters count requests/clicks, not confirmed installations. Existing count API retained.
- Alternative hero hypotheses for later testing: “Compare your mining hardware” and “Run a mining benchmark. See where you stand.” Selected direct product/category language without inventing conversion uplift.
- Seven copy-editing sweeps applied: clarity, voice, benefit, proof, specificity, relevance, and friction. Editorial review considered the novice miner, experienced operator, skeptical buyer and search-reader perspectives; no simulated review is represented as customer evidence.

## Page and intent map

```text
/                 Product overview → free client download / compare hardware
├── /downloads    Release files → first benchmark
├── /leaderboard  Submitted hardware comparison → download
├── /dashboard    Live network activity
├── /pool-rewards Pool activity and reward status
├── /premium      Free/Premium comparison → review upgrade / continue free
└── /whitepaper   Project background
```

`/wallet-connect` remains a functional callback, is excluded from the sitemap and marketing events, and uses noindex. The main sitemap contains only public page URLs. `llms.txt` links to the plain-text pricing route; the offer is generated from the same price constant used by checkout.

## Tracking plan

No external analytics destination was supplied. Events are available in `window.minebenchEvents` (last 50 only, cleared on page unload) and the `minebench:analytics` CustomEvent. No cookies, persistence, external pixels or analytics network calls are introduced. Existing operational APIs are unchanged.

| Event | Trigger | Properties | Decision |
| --- | --- | --- | --- |
| page_viewed | Public route entered | page_path | Which pages receive visits? |
| download_cta_clicked | Internal link to downloads | page_path, placement | Which placement sends people to downloads? |
| download_selected | Click on an available release file | page_path, platform, arch | Which builds are selected? |
| premium_cta_clicked | Internal link to Premium | page_path, placement | Which pages drive consideration? |
| premium_checkout_started | Connected visitor starts checkout | page_path | Does consideration reach checkout? |

No wallet addresses, signatures, balances, full URLs, query strings, referrers or typed searches are collected. `arch` preserves the existing release variant keys (including installer formats). A click is not a completed download; checkout start is not payment success. A future confirmed-purchase event needs server-side payment verification, not the client success flag.

To add GA4/PostHog later, supply the property/project ID and wire a consent-aware adapter to `minebench:analytics`; do not retroactively send the diagnostic buffer. The current local instrumentation cannot produce historical conversion reports. Before interpreting growth, record a real baseline and compare download selections/visits and checkout starts/Premium visits over the same traffic sources. Do not claim causal uplift without an experiment.

## SEO validation and boundaries

Existing Organization/WebSite identity is retained. Schema uses real visible content and no fabricated reviews. Schema.org supports a cryptocurrency ticker such as USDC for [priceCurrency](https://schema.org/priceCurrency). Valid Schema.org data is not a promise of Google rich-result eligibility: [Google's software-app guide](https://developers.google.com/search/docs/appearance/structured-data/software-app) requires genuine review/rating data, which is not supplied here. No reviews were invented to satisfy this requirement.

FAQ content serves readers and is also serialized for machines; no FAQ rich-result promise is made. `llms.txt` is an optional discovery aid, not a proven ranking improvement. [Google's guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content) prioritizes accurate, useful visible content and metadata.

Search Console performance, live indexing, Core Web Vitals field data and cross-engine citation rates remain unmeasured because those accounts/data were not provided. Public deployment and search-engine submission are outside this local update.

## Verification

- Production build/type and lint checks.
- Focused marketing event privacy tests; existing benchmark security tests.
- Browser verification: primary navigation, mobile layout, FAQ expansion, Premium comparison and free escape path, download section, local event delivery.
- Rendered metadata/JSON-LD, public route status codes, sitemap, robots, and pricing text.

See the task completion message for actual executed results and any unavailable checks.
