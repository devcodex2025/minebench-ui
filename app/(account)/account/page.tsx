import { notFound, redirect } from 'next/navigation';
import { accountEnabled, verifiedAccount, AccountError } from '@/lib/accountServer';
import AccountDashboard from './AccountDashboard';

export default async function AccountPage() {
  if (!accountEnabled()) notFound();
  try { await verifiedAccount(); }
  catch (error) {
    if (error instanceof AccountError && error.status === 401) redirect('/account/login');
    return <main className="min-h-[100dvh] bg-zinc-950 px-4 py-16 text-zinc-100"><div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold">Account verification is unavailable</h1>
      <p role="alert" className="mt-4 text-zinc-400">Your private statistics are hidden. Try loading this page again.</p>
      <a href="/account" className="btn-primary mt-6 inline-block">Try again</a>
    </div></main>;
  }
  // Private values are fetched after a fresh client request. They are never
  // embedded in HTML/RSC payloads that a browser navigation could restore.
  return <AccountDashboard />;
}
