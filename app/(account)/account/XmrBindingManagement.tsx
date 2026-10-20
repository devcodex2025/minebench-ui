'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { AccountMode } from '@/lib/accountStatistics';

type Rail = 'premium-xmr' | 'direct-xmr';
type Source = { id: string; rail: Rail };
type Binding = { bindingSourceId: string; rail: Rail; addressSuffix: string; verifiedAt: string; effectiveAfter: string };
type Challenge = { challengeId: string; rail: Rail; message: string; expiresAt: string; effectiveAfter: string };

async function fetchPrivateJson(path: string, init: RequestInit | undefined, onAccessDenied: () => void) {
  const response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store', signal: init?.signal ?? AbortSignal.timeout(12000) });
  if ([401, 403].includes(response.status)) onAccessDenied();
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'XMR account settings are unavailable');
  return data;
}

export default function XmrBindingManagement({ mode, onAccessDenied }: { mode: AccountMode; onAccessDenied: () => void }) {
  const privateJson = useCallback((path: string, init?: RequestInit) => fetchPrivateJson(path, init, onAccessDenied), [onAccessDenied]);
  const [sources, setSources] = useState<Source[]>([]);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [registrationId, setRegistrationId] = useState('');
  const [address, setAddress] = useState('');
  const [signature, setSignature] = useState('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [workerPassword, setWorkerPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const rail = mode as Rail;
  const eligibleSources = useMemo(() => sources.filter(source => source.rail === rail), [sources, rail]);
  const activeBindings = bindings.filter(binding => binding.rail === rail);

  async function reload() {
    const [sourceData, bindingData] = await Promise.all([
      privateJson('/api/account/xmr/binding/sources'), privateJson('/api/account/xmr/bindings')
    ]);
    if (!Array.isArray(sourceData.sources) || !Array.isArray(bindingData.bindings)) throw new Error('XMR account settings are unavailable');
    setSources(sourceData.sources);
    setBindings(bindingData.bindings);
    setRegistrationId(current => sourceData.sources.some((source: Source) => source.id === current && source.rail === rail)
      ? current : (sourceData.sources.find((source: Source) => source.rail === rail)?.id ?? ''));
  }

  useEffect(() => {
    let cancelled = false;
    setWorkerPassword('');
    void Promise.all([
      privateJson('/api/account/xmr/binding/sources'), privateJson('/api/account/xmr/bindings')
    ]).then(([sourceData, bindingData]) => {
      if (cancelled) return;
      if (!Array.isArray(sourceData.sources) || !Array.isArray(bindingData.bindings)) throw new Error('XMR account settings are unavailable');
      setSources(sourceData.sources);
      setBindings(bindingData.bindings);
      setRegistrationId(sourceData.sources.find((source: Source) => source.rail === rail)?.id ?? '');
    }).catch(() => { if (!cancelled) setError('XMR account settings are unavailable.'); });
    return () => { cancelled = true; };
  }, [rail, privateJson]);

  async function createChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice(''); setChallenge(null); setSignature('');
    try {
      const value = await privateJson('/api/account/xmr/binding/challenge', { method: 'POST',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceRegistrationId: registrationId, address }) });
      if (typeof value.challengeId !== 'string' || typeof value.message !== 'string' || value.rail !== rail
        || typeof value.expiresAt !== 'string' || typeof value.effectiveAfter !== 'string') throw new Error('Invalid challenge');
      setChallenge(value);
    } catch { setError('Could not create a binding challenge. Check the address and try again.'); }
    finally { setBusy(false); }
  }

  async function verifyChallenge() {
    if (!challenge || signature.length === 0 || signature.length > 512) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const value = await privateJson('/api/account/xmr/binding/verify', { method: 'POST',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify({ challengeId: challenge.challengeId,
          message: challenge.message, signature }) });
      if (value.bound !== true || value.rail !== rail || typeof value.effectiveAfter !== 'string') throw new Error('Invalid response');
      setChallenge(null); setSignature(''); setAddress('');
      setNotice(`Ownership verified. New ${rail === 'premium-xmr' ? 'Premium XMR' : 'Direct XMR'} work can be attributed from ${value.effectiveAfter}.`);
      try { await reload(); } catch { setError('The binding was created, but its status could not be reloaded. Refresh the page to confirm it.'); }
    } catch { setError('Ownership proof was not accepted. The challenge may have expired or the address may already be bound.'); }
    finally { setBusy(false); }
  }

  async function generateWorkerPassword(binding?: Binding) {
    if (!binding && !registrationId) return;
    setBusy(true); setError(''); setNotice(''); setWorkerPassword('');
    try {
      const value = await privateJson('/api/account/xmr/worker-credential', { method: 'POST',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify(binding
          ? { bindingSourceId: binding.bindingSourceId } : { sourceRegistrationId: registrationId }) });
      if (value.rail !== rail || value.rotated !== true || typeof value.password !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value.password)
        || (binding && value.ownershipMethod !== 'monero_spend')
        || typeof value.effectiveAfter !== 'string' || !Number.isFinite(Date.parse(value.effectiveAfter))) throw new Error('Invalid response');
      setWorkerPassword(value.password);
      setNotice(`The previous password is revoked for new work. Use this replacement from ${value.effectiveAfter}; it is shown only once.`);
    } catch { setError('Could not create an account worker password. Check your account and source access.'); }
    finally { setBusy(false); }
  }

  return <section aria-labelledby="xmr-binding-title" className="mt-10 rounded-2xl border border-zinc-800 p-5 sm:p-7">
    <h2 id="xmr-binding-title" className="text-lg font-semibold">Verified XMR mining identity</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
      Prove control of a Monero address with a spend-key message signature. No seed, private key, view key, or payment is requested.
      This enables attribution of future work only; it does not unlock address-wide history or change your payout destination.
    </p>
    {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
    {notice && <p role="status" className="mt-4 text-sm text-emerald-300">{notice}</p>}
    {activeBindings.length > 0 && <ul aria-label="Verified XMR bindings" className="mt-5 space-y-2 text-sm text-zinc-300">
      {activeBindings.map(binding => <li key={binding.bindingSourceId} className="grid gap-2">
        <span>Verified address ending in <span className="font-mono">{binding.addressSuffix}</span> · effective {binding.effectiveAfter}</span>
        <button type="button" disabled={busy} onClick={() => void generateWorkerPassword(binding)}
          className="w-fit rounded-lg border border-zinc-600 px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 disabled:opacity-50">
          Rotate verified-address worker password
        </button>
      </li>)}
    </ul>}
    {workerPassword && <div className="mt-4 grid gap-3">
      <label className="grid gap-2 text-xs text-zinc-400">One-time stratum password<input readOnly value={workerPassword}
        className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-100" /></label>
      <button type="button" onClick={() => { void navigator.clipboard.writeText(workerPassword).then(() => setNotice('Worker password copied. Store it in your miner configuration now.')).catch(() => setError('Copy failed. Select and copy the password manually.')); }}
        className="w-fit rounded-lg border border-zinc-600 px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300">Copy password</button>
      <button type="button" onClick={() => setWorkerPassword('')} className="w-fit text-xs text-zinc-400 underline underline-offset-4">Hide password</button>
    </div>}
    {eligibleSources.length === 0 ? <p className="mt-5 text-sm text-zinc-400">No active {rail === 'premium-xmr' ? 'Premium XMR' : 'Direct XMR'} source is configured for account attribution yet.</p> : !challenge ?
      <form onSubmit={createChallenge} className="mt-6 grid max-w-2xl gap-4">
        <label className="grid gap-2 text-sm text-zinc-300">Mining source<select value={registrationId} required
          onChange={event => { setRegistrationId(event.target.value); setWorkerPassword(''); setNotice(''); }} className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300">
          {eligibleSources.map(source => <option key={source.id} value={source.id}>{rail === 'premium-xmr' ? 'Premium XMR' : 'Direct XMRig'} source</option>)}
        </select></label>
        <div className="rounded-xl border border-zinc-800 p-4 text-sm leading-6 text-zinc-300">
          <h3 className="font-medium">Custodial or exchange mining</h3>
          <p className="mt-2 text-zinc-400">Generate an account worker password to attribute future work and its canonical reward and payout portions. It does not grant address-wide history or prove that an exchange credited a deposit.</p>
          <button type="button" disabled={busy || !registrationId} onClick={() => void generateWorkerPassword()}
            className="mt-4 rounded-lg border border-zinc-600 px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 disabled:opacity-50">
            {busy ? 'Rotating…' : 'Rotate account worker password'}
          </button>
        </div>
        <label className="grid gap-2 text-sm text-zinc-300">Monero mainnet address<input required autoComplete="off" spellCheck={false}
          value={address} onChange={event => setAddress(event.target.value)} maxLength={100} className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300" /></label>
        <button disabled={busy || !registrationId} className="w-fit rounded-lg bg-yellow-300 px-4 py-2 font-medium text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 disabled:opacity-50">
          {busy ? 'Creating challenge…' : 'Create spend-key challenge'}
        </button>
      </form> : <div className="mt-6 grid max-w-3xl gap-4">
        <p className="text-sm text-zinc-300">In your Monero wallet, sign this exact message using the <strong>spend key</strong>. Paste only the resulting signature below. Never paste a seed or key.</p>
        <label className="grid gap-2 text-sm text-zinc-300">Exact message<textarea readOnly value={challenge.message} rows={12}
          className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-xs leading-5 text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300" /></label>
        <p className="text-xs text-zinc-400">Challenge expires {challenge.expiresAt}. The binding takes effect after {challenge.effectiveAfter}.</p>
        <label className="grid gap-2 text-sm text-zinc-300">Spend-key signature<input autoComplete="off" spellCheck={false} maxLength={512}
          value={signature} onChange={event => setSignature(event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300" /></label>
        <div className="flex flex-wrap gap-3"><button type="button" disabled={busy || !signature}
          onClick={() => void verifyChallenge()} className="rounded-lg bg-yellow-300 px-4 py-2 font-medium text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 disabled:opacity-50">
          {busy ? 'Verifying…' : 'Verify and bind address'}
        </button><button type="button" disabled={busy} onClick={() => { setChallenge(null); setSignature(''); setError(''); }}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 disabled:opacity-50">Cancel</button></div>
      </div>}
  </section>;
}
