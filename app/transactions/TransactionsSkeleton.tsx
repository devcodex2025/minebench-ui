export default function TransactionsSkeleton() {
  return <div role="status" aria-live="polite" aria-busy="true" className="space-y-5">
    <p className="flex items-center gap-3 text-sm text-zinc-400">
      <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-zinc-700 border-t-yellow-400 motion-safe:animate-spin" />
      Loading transactions…
    </p>
    <div aria-hidden="true" className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 motion-safe:animate-pulse">
      <div className="h-12 border-b border-zinc-800 bg-zinc-900" />
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="flex h-16 items-center gap-6 border-b border-zinc-800 px-4 last:border-0">
        <div className="h-3 w-28 rounded bg-zinc-800" />
        <div className="h-3 w-20 rounded bg-zinc-800" />
        <div className="h-3 flex-1 rounded bg-zinc-800" />
      </div>)}
    </div>
  </div>;
}
