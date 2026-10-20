'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccountRequestError, coverageMessage, formatAccountAmount, formatAccountHashrate, formatConversionStage, loadAccountStatistics,
  type AccountTab, type AccountMode, type AccountRange, type AccountStatistics } from '@/lib/accountStatistics';
import PasskeyManagement from './PasskeyManagement';
import BmtWorkerCredentialManagement from './BmtWorkerCredentialManagement';
import XmrBindingManagement from './XmrBindingManagement';

const tabs: AccountTab[] = ['overview', 'workers', 'rewards', 'payouts'];
const count = (value: number | null | undefined) => value == null ? 'Unavailable' : value.toLocaleString();
export default function AccountDashboard() {
  const [tab, setTab] = useState<AccountTab>('overview');
  const [mode, setMode] = useState<AccountMode>('bmt');
  const [range, setRange] = useState<AccountRange>('24h');
  const [cursor, setCursor] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; value: AccountStatistics } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'denied' | 'logout-error'>('loading');
  const [sessionVerified, setSessionVerified] = useState(false);
  const [retry, setRetry] = useState(0);
  const epoch = useRef(0);
  const root = useRef<HTMLElement>(null);
  const abort = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const denySession = useCallback(() => {
    locked.current = true; epoch.current++; abort.current?.abort();
    setResult(null); setSessionVerified(false); setStatus('denied');
  }, []);
  const key = `${tab}/${mode}/${range}/${cursor ?? ''}`;
  const data = result?.key === key ? result.value : null;
  const asset = mode === 'bmt' ? 'BMT' : 'XMR';

  useEffect(() => {
    let stopped = false, timer: ReturnType<typeof setTimeout> | undefined, failures = 0;
    const hide = () => { epoch.current++; abort.current?.abort(); setResult(null); setSessionVerified(false); if (root.current) root.current.hidden = true; };
    const load = async () => {
      if (stopped || locked.current || document.visibilityState === 'hidden') return;
      const current = ++epoch.current;
      abort.current?.abort(); const controller = new AbortController(); abort.current = controller;
      const deadline = setTimeout(() => controller.abort(), 12000);
      setStatus('loading'); setResult(null);
      try {
        const value = await loadAccountStatistics(tab, mode, range, cursor, controller.signal);
        if (stopped || current !== epoch.current) return;
        setResult({ key, value }); setSessionVerified(true); setStatus('ready'); failures = 0;
        if (root.current) root.current.hidden = false;
      } catch (error) {
        if (stopped || current !== epoch.current) return;
        setResult(null); setSessionVerified(false); failures++;
        const denied = error instanceof AccountRequestError && [401, 403].includes(error.status);
        setStatus(denied ? 'denied' : 'error');
        if (root.current) root.current.hidden = false;
        if (denied) return;
      } finally { clearTimeout(deadline); }
      if (!stopped) timer = setTimeout(load, Math.min(120000, 30000 * Math.pow(2, failures)) * (0.9 + Math.random() * 0.2));
    };
    const visible = () => { clearTimeout(timer); if (document.visibilityState === 'hidden') hide(); else void load(); };
    const pagehide = () => hide();
    const pageshow = (event: PageTransitionEvent) => { if (event.persisted) { hide(); window.location.replace('/account'); } };
    const changed = () => { locked.current = true; hide(); window.location.replace('/account/login'); };
    const storage = (event: StorageEvent) => { if (event.key === 'minebench:account-change') changed(); };
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('minebench-account');
    if (channel) channel.onmessage = changed;
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('pagehide', pagehide); window.addEventListener('pageshow', pageshow);
    window.addEventListener('storage', storage);
    void load();
    return () => { stopped = true; abort.current?.abort(); clearTimeout(timer); channel?.close();
      document.removeEventListener('visibilitychange', visible); window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('pageshow', pageshow); window.removeEventListener('storage', storage); };
  }, [tab, mode, range, cursor, key, retry]);

  async function logout() {
    locked.current = true;
    epoch.current++; abort.current?.abort(); setResult(null); setSessionVerified(false); setStatus('loading');
    try {
      const response = await fetch('/api/account/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok || (await response.json()).success !== true) throw new Error('Logout unavailable');
      if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel('minebench-account'); channel.postMessage('changed'); channel.close(); }
      try { window.localStorage.setItem('minebench:account-change', String(Date.now())); } catch { /* No private data is stored. */ }
      window.location.replace('/account/login');
    } catch { setStatus('logout-error'); }
  }
  const reset = () => { setResult(null); setCursor(null); };
  return <main ref={root} className="min-h-[100dvh] bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-zinc-800 pb-7">
        <div><Link href="/" className="text-sm text-zinc-400">MineBench</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Your mining account</h1>
          <p className="mt-3 text-sm text-zinc-400">Private history · Free account access</p></div>
        <button type="button" onClick={logout} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300">Sign out / switch account</button>
      </header>
      <div className="my-7 flex flex-wrap gap-5">
        <label className="grid gap-2 text-sm text-zinc-400">Mining mode<select value={mode} className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100" onChange={event => { reset(); setMode(event.target.value as AccountMode); }}>
          <option value="bmt">BMT app</option><option value="premium-xmr">Premium XMR app</option><option value="direct-xmr">Direct XMRig XMR</option></select></label>
        <label className="grid gap-2 text-sm text-zinc-400">History window<select value={range} className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100" onChange={event => { reset(); setRange(event.target.value as AccountRange); }}>
          <option value="1h">1 hour</option><option value="24h">24 hours</option><option value="7d">7 days</option><option value="30d">30 days</option></select></label>
      </div>
      <nav aria-label="Account statistics" className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        {tabs.map(item => <button type="button" key={item} aria-current={tab === item ? 'page' : undefined}
          className={`rounded-lg px-4 py-2 text-sm capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 ${tab === item ? 'bg-yellow-300 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-900'}`}
          onClick={() => { if (tab !== item) { reset(); setTab(item); } }}>{item}</button>)}
      </nav>
      <section aria-label={`${tab} statistics`} aria-busy={status === 'loading'} className="py-7">
        {status === 'loading' && <div role="status" className="min-h-32 text-zinc-400">Verifying your account and loading statistics…</div>}
        {status === 'denied' && <div role="alert"><p>Your session ended or access was denied. Private data has been cleared.</p><a href="/account/login" className="mt-4 inline-block underline underline-offset-4">Sign in again</a></div>}
        {status === 'logout-error' && <div role="alert"><p>Sign-out could not be confirmed. Your statistics are hidden.</p><button type="button" className="mt-4 underline underline-offset-4" onClick={logout}>Retry sign-out</button></div>}
        {status === 'error' && <div role="alert"><p>Statistics are unavailable. No balance or payment status is assumed.</p><button type="button" className="mt-4 underline underline-offset-4" onClick={() => { setCursor(null); setRetry(value => value + 1); }}>Try again</button></div>}
        {status === 'ready' && !data && <div role="status" className="rounded-xl border border-zinc-800 p-5 text-sm leading-6 text-zinc-300">
          <p>This view is not available for the selected mining mode yet. No balance, worker activity, reward, or payment state is assumed.</p>
        </div>}
        {status === 'ready' && data && <>
          <p className="mb-5 text-sm text-zinc-400">{data.asOf ? `Projected at ${data.asOf} · ${data.freshness.status}` : 'Data freshness is unknown'}</p>
          {data.completeness.reasons.length > 0 && <div role="status" className="mb-7 space-y-3 rounded-xl border border-zinc-700 p-5 text-sm leading-6 text-zinc-300">
            {data.completeness.reasons.map((reason, index) => <p key={`${reason}-${index}`}>{coverageMessage(reason)}</p>)}
          </div>}
          {tab === 'overview' && data.data && <>
            {data.data.balances && <dl className="grid gap-8 border-b border-zinc-800 pb-8 sm:grid-cols-2">
              <div><dt className="text-sm text-zinc-400">Available {asset} · MineBench account allocation</dt><dd className="mt-3 break-all font-mono text-3xl">{formatAccountAmount(data.data.balances.availableAtomic, data.data.balances.availableDecimal, data.data.balances.decimals)}</dd></div>
              <div><dt className="text-sm text-zinc-400">Reserved {asset} · MineBench account allocation</dt><dd className="mt-3 break-all font-mono text-3xl">{formatAccountAmount(data.data.balances.reservedAtomic, data.data.balances.reservedDecimal, data.data.balances.decimals)}</dd></div>
            </dl>}
            {!data.data.balances && data.data.financeAvailable === false && <p role="status" className="mb-7 rounded-xl border border-zinc-800 p-5 text-sm leading-6 text-zinc-300">
              Financial history is unavailable until future authenticated work has complete canonical account attribution. Work observations are shown separately when available.
            </p>}
            <section aria-labelledby="account-work-heading" className="mt-7">
              <h2 id="account-work-heading" className="text-lg font-medium">Account-bound mining work</h2>
              {!data.data.workMetrics ? <p className="mt-3 text-sm leading-6 text-zinc-400">Verified work metrics are not available in this projection yet. Missing values are not treated as zero.</p> : <>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{data.data.workMetrics.workBasis?.version === 'upstream_accepted_account_work.v2'
                  ? 'Upstream accepted submissions measure observed mining activity. Hashrate is a statistical estimate from accepted assigned difficulty over each fixed window; it is not independently verified RandomX proof. Canonical sidechain shares and reward entitlement are separate.'
                  : 'This older projection contains final canonical sidechain events. Ordinary upstream work and hashrate estimates are not available yet.'}</p>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div><dt className="text-sm text-zinc-400">Effective hashrate · 1h upstream estimate</dt><dd className="mt-2 font-mono">{formatAccountHashrate(data.data.workMetrics.effectiveHashrateHps)}</dd></div>
                  <div><dt className="text-sm text-zinc-400">Average hashrate · 24h upstream estimate</dt><dd className="mt-2 font-mono">{formatAccountHashrate(data.data.workMetrics.averageHashrateHps)}</dd></div>
                </dl>
                {data.data.workMetrics.coverageCheckpoint?.closedThroughAt && <p className="mt-3 text-xs text-zinc-400">Journal observed through {data.data.workMetrics.coverageCheckpoint.closedThroughAt}</p>}
                {data.data.workMetrics.completeness.reasons.length > 0 && <div role="status" className="mt-4 space-y-2 rounded-xl border border-zinc-800 p-4 text-sm leading-6 text-zinc-400">
                  {data.data.workMetrics.completeness.reasons.map((reason, index) => <p key={`${reason}-${index}`}>{coverageMessage(reason)}</p>)}
                </div>}
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  {([['1 hour', data.data.workMetrics.window1h], ['24 hours', data.data.workMetrics.window24h], ['7 days', data.data.workMetrics.window7d], ['30 days', data.data.workMetrics.window30d]] as const).map(([label, window]) => window && <div key={label} className="rounded-xl border border-zinc-800 p-5">
                    <dt className="mb-4 text-sm font-medium text-zinc-300">{label}</dt>
                    <dd><dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <dt className="text-zinc-400">{window.canonicalAcceptedEvents === undefined ? 'Canonical accepted events' : 'Upstream accepted submissions'}</dt><dd className="text-right font-mono">{count(window.acceptedEvents)}</dd>
                      {window.canonicalAcceptedEvents !== undefined && <><dt className="text-zinc-400">Final canonical sidechain events</dt><dd className="text-right font-mono">{count(window.canonicalAcceptedEvents)}</dd></>}
                      <dt className="text-zinc-400">Rejected events</dt><dd className="text-right font-mono">{count(window.rejectedEvents)}</dd>
                      <dt className="text-zinc-400">Stale events</dt><dd className="text-right font-mono">{count(window.staleEvents)}</dd>
                      <dt className="text-zinc-400">Invalid events</dt><dd className="text-right font-mono">{count(window.invalidEvents)}</dd>
                      <dt className="text-zinc-400">Last accepted work</dt><dd className="text-right font-mono text-xs">{window.lastAcceptedAt ?? 'Unavailable'}</dd>
                    </dl></dd>
                  </div>)}
                </dl>
                <p className="mt-4 text-sm leading-6 text-zinc-400">Low-hashrate workers can have long gaps between accepted submissions. A lack of recent accepted work does not prove disconnection. Unknown observations are not treated as zero.</p>
              </>}
              {data.data.telemetry && <p className="mt-3 text-sm text-zinc-400">Client-reported hashrate: <span className="font-mono text-zinc-200">{data.data.telemetry.reportedHashrateHps} H/s</span> at {data.data.telemetry.reportedAt}. This is telemetry, not accepted work.</p>}
            </section>
          </>}
          {tab === 'workers' && <>
            <p className="mb-4 text-sm text-zinc-400">Workers are grouped by authenticated session epoch. Connection status comes from recent proxy observations and becomes unknown when evidence expires. Accepted activity and hashrate estimates are shown separately.</p>
            {!data.data?.workers?.length ? <p className="py-6 text-zinc-400">No authenticated workers are available for this mode.</p> :
              <div role="region" aria-label="Workers table" tabIndex={0} className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300"><table className="w-full text-left text-sm"><caption className="mb-4 text-left text-zinc-400">Authenticated worker connections and accepted work</caption>
                <thead className="border-b border-zinc-700 text-zinc-400"><tr><th className="py-3 pr-5">Worker session</th><th className="py-3 pr-5">Asset</th><th className="py-3 pr-5">Proxy connection</th><th className="py-3 pr-5">Accepted events</th><th className="py-3 pr-5">Accepted difficulty</th><th className="py-3 pr-5">Effective · 1h estimate</th><th className="py-3 pr-5">Average · 24h estimate</th><th className="py-3 pr-5">Activity</th><th className="py-3">Last accepted work</th></tr></thead>
                <tbody>{data.data.workers.map(worker => <tr key={worker.workerEpochId} className="border-b border-zinc-800">
                  <td className="py-4 pr-5 font-mono text-xs">{worker.workerEpochId.slice(0, 8)}…</td><td className="py-4 pr-5">{worker.asset}</td>
                  <td className="py-4 pr-5">{worker.presence?.freshness === 'fresh' && worker.presence.state === 'connected' ? 'Observed connected'
                    : worker.presence?.freshness === 'fresh' && worker.presence.state === 'disconnected' ? 'Observed disconnected' : 'Unknown'}
                    {worker.presence?.observedAt && <span className="mt-1 block whitespace-nowrap font-mono text-xs text-zinc-400">{worker.presence.observedAt}</span>}</td>
                  <td className="py-4 pr-5 font-mono">{count(worker.acceptedEvents)}</td><td className="py-4 pr-5 font-mono">{worker.acceptedDifficulty ?? 'Unavailable'}</td>
                  <td className="py-4 pr-5 font-mono">{formatAccountHashrate(worker.effectiveHashrateHps)}</td><td className="py-4 pr-5 font-mono">{formatAccountHashrate(worker.averageHashrateHps)}</td>
                  <td className="py-4 pr-5">{worker.activity === 'recent_accepted_work' ? 'Accepted work within 1h' : worker.activity === 'no_recent_accepted_work' ? 'No accepted work within 1h' : 'Unknown'}</td>
                  <td className="whitespace-nowrap py-4 font-mono text-xs">{worker.lastAcceptedAt ?? 'Unavailable'}</td></tr>)}</tbody>
              </table></div>}
          </>}
          {(tab === 'rewards' || tab === 'payouts') && data.data?.items && <>
            {data.data.items.length === 0 ? <p className="py-6 text-zinc-400">No canonical {tab} records are available in this window. Historical coverage may be incomplete.</p> :
              <div role="region" aria-label={`${asset} ${tab} table`} tabIndex={0} className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300"><table className="w-full text-left text-sm"><caption className="mb-4 text-left text-zinc-400">{asset === 'BMT' ? 'Canonical BMT' : 'MineBench account-allocated XMR'} {tab}. {tab === 'payouts' && 'Recorded states describe MineBench payout processing; they do not prove wallet ownership or exchange receipt.'}</caption>
                <thead className="border-b border-zinc-700 text-zinc-400"><tr><th className="py-3 pr-5">Recorded at</th><th className="py-3 pr-5">{tab === 'rewards' ? 'Entry type' : 'Payment state'}</th>
                  {tab === 'payouts' && asset === 'XMR' ? <><th className="py-3 pr-5">Reserved contribution XMR</th><th className="py-3 pr-5">Settled contribution XMR</th><th className="py-3">Released XMR</th></>
                    : <><th className="py-3 pr-5">Amount {asset}</th>{tab === 'payouts' && <th className="py-3">Recorded fee BMT</th>}</>}</tr></thead>
                <tbody>{data.data.items.map(item => <tr key={item.id} className="border-b border-zinc-800"><td className="whitespace-nowrap py-4 pr-5 font-mono text-xs">{item.createdAt}</td>
                  <td className="py-4 pr-5">{(item.type || item.status || 'Unknown').replace(/_/g, ' ')}</td>
                  {tab === 'payouts' && asset === 'XMR' ? <><td className="py-4 pr-5 font-mono">{formatAccountAmount(item.reservedAtomic, null, 12)}</td>
                    <td className="py-4 pr-5 font-mono">{item.settledAtomic === null ? 'Pending' : formatAccountAmount(item.settledAtomic, null, 12)}</td>
                    <td className="py-4 font-mono">{item.releasedAtomic === null ? 'Pending' : formatAccountAmount(item.releasedAtomic, null, 12)}</td></>
                    : <><td className="py-4 pr-5 font-mono">{formatAccountAmount(item.amountAtomic, item.amountDecimal, item.decimals)}</td>
                      {tab === 'payouts' && <td className="py-4 font-mono">{formatAccountAmount(item.feeAtomic, item.feeDecimal, item.decimals)}</td>}</>}</tr>)}</tbody>
              </table></div>}
            <div className="mt-6 flex gap-5">{cursor && <button type="button" onClick={() => { setResult(null); setCursor(null); }} className="underline underline-offset-4">First page</button>}
              {data.nextCursor && <button type="button" onClick={() => { setResult(null); setCursor(data.nextCursor); }} className="underline underline-offset-4">Next page</button>}</div>
            {tab === 'rewards' && !!data.data.conversions?.length && <div role="region" aria-label="Linked conversions table" tabIndex={0} className="mt-10 overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300"><table className="w-full text-left text-sm">
              <caption className="mb-4 text-left text-zinc-400">Linked conversions · XMR input and BMT output are separate assets. Inputs are not additional rewards.</caption>
              <thead className="border-b border-zinc-700 text-zinc-400"><tr><th className="py-3 pr-5">Recorded at</th><th className="py-3 pr-5">Stage</th><th className="py-3 pr-5">XMR input</th><th className="py-3">Canonical BMT output</th></tr></thead>
              <tbody>{data.data.conversions.map(item => <tr key={item.referenceId} className="border-b border-zinc-800">
                <td className="whitespace-nowrap py-4 pr-5 font-mono text-xs">{item.createdAt}</td><td className="py-4 pr-5">{formatConversionStage(item.stage, item.status)}
                  {item.stageUpdatedAt && <span className="mt-1 block whitespace-nowrap font-mono text-xs text-zinc-400">{item.stageUpdatedAt}</span>}</td>
                <td className="py-4 pr-5 font-mono">{formatAccountAmount(item.xmrInputAtomic, null, 12)}</td><td className="py-4 font-mono">{formatAccountAmount(item.bmtOutputAtomic, item.bmtOutputDecimal, item.decimals)}</td>
              </tr>)}</tbody>
            </table></div>}
          </>}
        </>}
      </section>
      {sessionVerified && mode !== 'bmt' && <XmrBindingManagement key={mode} mode={mode} onAccessDenied={denySession} />}
      {sessionVerified && mode === 'bmt' && <BmtWorkerCredentialManagement onAccessDenied={denySession} />}
      {sessionVerified && <PasskeyManagement onAccessDenied={denySession} />}
    </div>
  </main>;
}
