# BoardUI and React 19 migration

The UI uses Next.js 15.5, React 19.2, Tailwind CSS 4.3 and React Three Fiber 9 / Drei 10. Node.js 22 matches the Docker build.

## Design system

- `styles/theme.css` and `styles/typography.css` contain the official BoardUI foundations installed with BoardUI CLI 0.5.3.
- `styles/globals.css` applies MineBench's yellow accent and shared page styles. The root layout enables dark mode and loads Inter locally through Fontsource.
- `components/base/buttons/button.tsx` and `components/base/badges/badge.tsx` are source-owned BoardUI components. The primary button uses dark text for contrast on yellow.
- `app/globals.css` retains existing MineBench component classes. Tailwind 4 loads the existing project palette through `@config`; PostCSS uses `@tailwindcss/postcss`.

References: [BoardUI installation](https://www.boardui.com/installation), [Tailwind 4 migration](https://tailwindcss.com/docs/upgrade-guide), [Next.js 15 migration](https://nextjs.org/docs/app/guides/upgrading/version-15).

## Development (WSL)

```bash
cd /mnt/d/Projects/MineBench_dApp/MineBench-UI
npm ci
npm run dev
```

Run `npm run build` and `npm run test:security` before release. Docker now installs the lockfile with `npm ci`.

Phantom and Solflare use their individual adapter packages. Public Supabase environment variables use static `process.env.NEXT_PUBLIC_*` references so Next.js can include them in the browser build; service-role fallback remains server-only.

This migration changes source and local previews. It does not publish a release or deployment.
