# MineBench UI

MineBench UI is the public-facing web application for the MineBench ecosystem.
It contains the landing pages, dashboard views, downloads pages, leaderboard,
and supporting API routes used by the web experience.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create local config:

```bash
cp .env.local.example .env.local
```

3. Fill in your own values and start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Configuration

Use placeholders and browser-safe values only for `NEXT_PUBLIC_*` variables.
Do not expose service-role keys or personal access tokens in client-side code.

## Build

```bash
npm run build
npm start
```

## Deployment

This repository includes Docker and Akash-related files. Any tracked deployment
examples should contain placeholders only.

## Security

- Never commit `.env.local`
- Never commit GitHub tokens or Supabase service-role keys
- Keep public and server-only variables clearly separated

See `SECURITY.md` for the reporting process.

## License

MIT
