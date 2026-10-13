'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function TransactionsRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (pending) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        startTransition(() => router.refresh());
      }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [pending, router]);

  return <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
    <span>Updates every 30 seconds while this tab is visible</span>
    <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}
      className="rounded-lg border border-zinc-700 px-3 py-2 font-medium text-zinc-200 hover:border-yellow-400 hover:text-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 disabled:opacity-50">
      {pending ? 'Refreshing…' : 'Refresh payouts'}
    </button>
  </div>;
}
