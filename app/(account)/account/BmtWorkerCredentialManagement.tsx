'use client';

import { useEffect, useState } from 'react';

type Source = { id: string; effectiveAfter: string };

async function privateJson(path: string, init: RequestInit | undefined, onAccessDenied: () => void) {
  const response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store', signal: init?.signal ?? AbortSignal.timeout(12000) });
  if ([401, 403].includes(response.status)) onAccessDenied();
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'BMT account settings are unavailable');
  return data;
}

export default function BmtWorkerCredentialManagement({ onAccessDenied }: { onAccessDenied: () => void }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [sourceRegistrationId, setSourceRegistrationId] = useState('');
  const [password, setPassword] = useState('');
  const [effectiveAfter, setEffectiveAfter] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    setPassword(''); setEffectiveAfter('');
    void privateJson('/api/account/bmt/worker-credential/sources', undefined, onAccessDenied).then(data => {
      if (cancelled) return;
      if (!Array.isArray(data.sources) || data.sources.length > 100) throw new Error('Invalid sources');
      const valid = data.sources.filter((source: any) => typeof source?.id === 'string'
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(source.id)
        && typeof source.effectiveAfter === 'string' && Number.isFinite(Date.parse(source.effectiveAfter))) as Source[];
      setSources(valid);
      setSourceRegistrationId(valid[0]?.id ?? '');
    }).catch(() => { if (!cancelled) setError('BMT account worker credentials are not available for this source yet.'); });
    return () => { cancelled = true; };
  }, [onAccessDenied]);

  async function rotate() {
    if (!sourceRegistrationId || busy) return;
    setBusy(true); setError(''); setNotice(''); setPassword(''); setEffectiveAfter('');
    try {
      const data = await privateJson('/api/account/bmt/worker-credential', { method: 'POST',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceRegistrationId }) }, onAccessDenied);
      if (data.rail !== 'bmt' || data.rotated !== true || typeof data.password !== 'string'
        || !/^[A-Za-z0-9_-]{43}$/.test(data.password) || typeof data.effectiveAfter !== 'string'
        || !Number.isFinite(Date.parse(data.effectiveAfter))) throw new Error('Invalid response');
      setPassword(data.password); setEffectiveAfter(new Date(data.effectiveAfter).toISOString());
      setNotice('The password is shown once. It is not saved in browser storage.');
    } catch { setError('Could not rotate the BMT worker password.'); }
    finally { setBusy(false); }
  }

  return <section aria-labelledby="bmt-credential-heading" className="mt-8 max-w-3xl border-t border-zinc-800 pt-7">
    <h2 id="bmt-credential-heading" className="text-lg font-medium">BMT app worker credential</h2>
    <p className="mt-2 text-sm leading-6 text-zinc-400">This account-scoped password is for future BMT worker-session attribution. Keep the Solana wallet as the miner login. It does not change reward allocation or grant history for earlier work.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-zinc-300">{notice}</p>}
    {sources.length === 0 ? <p className="mt-4 text-sm text-zinc-400">No BMT proxy source is currently registered for account-bound sessions.</p> : <div className="mt-4 grid gap-3">
      {sources.length > 1 && <label className="grid max-w-xl gap-2 text-sm text-zinc-300">BMT proxy source<select value={sourceRegistrationId}
        onChange={event => { setSourceRegistrationId(event.target.value); setPassword(''); setEffectiveAfter(''); }}
        className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100">{sources.map(source => <option key={source.id} value={source.id}>{source.id.slice(0, 8)}</option>)}</select></label>}
      <button type="button" disabled={busy || !sourceRegistrationId} onClick={() => void rotate()}
        className="w-fit rounded-lg border border-zinc-600 px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 disabled:opacity-50">
        {busy ? 'Rotating…' : 'Rotate BMT worker password'}</button>
      {password && <div className="grid gap-3">
        <p className="text-xs text-zinc-400">Effective after {effectiveAfter}</p>
        <label className="grid max-w-xl gap-2 text-xs text-zinc-400">One-time BMT stratum password<input readOnly value={password}
          className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-100" /></label>
        <button type="button" onClick={() => { void navigator.clipboard.writeText(password).then(() => setNotice('BMT worker password copied.')).catch(() => setError('Copy failed. Select and copy the password manually.')); }}
          className="w-fit rounded-lg border border-zinc-600 px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300">Copy password</button>
        <button type="button" onClick={() => { setPassword(''); setEffectiveAfter(''); }} className="w-fit text-xs text-zinc-400 underline underline-offset-4">Hide password</button>
      </div>}
    </div>}
  </section>;
}
