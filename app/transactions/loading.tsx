import TransactionsSkeleton from './TransactionsSkeleton';

export default function LoadingTransactions() {
  return <main className="mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-6 lg:px-8">
    <h1 className="mb-8 text-4xl font-semibold tracking-tight text-zinc-100">Transactions</h1>
    <TransactionsSkeleton />
  </main>;
}
