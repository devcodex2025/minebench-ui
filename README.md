# MineBench UI

MineBench UI is the public web surface of the MineBench ecosystem. It is the
repository responsible for first impression, product narrative, downloads,
dashboard access, leaderboard exposure, and the web-facing onboarding path into
the MineBench stack.

In architectural terms, this module is the presentation boundary. It should be
rich in product context and light on privileged logic.

## What this module owns

- landing and marketing surfaces
- public dashboard and statistics views
- download and release discovery flows
- whitepaper and ecosystem navigation
- browser-facing wallet and account entry points
- server-side API routes that aggregate non-public provider calls for the web app

## Design intent

This repository should explain the product clearly while keeping secrets,
operator credentials, and backend-only logic out of the browser surface.

That means:

- all `NEXT_PUBLIC_*` values must be safe for client exposure
- server-side tokens must remain in server-only environment variables
- release and provider integrations must run behind API routes or backend services

## Technology stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase

## Local development

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.local.example .env.local
```

Start the development server:

```bash
npm run dev
```

The app is served on `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## Configuration model

Use browser-safe values only for `NEXT_PUBLIC_*` variables.

Server-side secrets, including any GitHub release token used by API routes,
must remain server-only and must never be exposed through client-rendered code.

## Documentation

All repository documentation lives under [`docs/`](docs/README.md).

Key entry points:

- [`docs/README.md`](docs/README.md)
- [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md)
- [`docs/STATS_SETUP.md`](docs/STATS_SETUP.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)

## Security posture

- never commit `.env.local`
- never expose service-role keys in client bundles
- never hardcode GitHub personal access tokens in tracked source
- keep server-only secrets limited to API routes or deployment-time injection

## License

MIT
