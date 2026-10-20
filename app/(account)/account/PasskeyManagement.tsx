'use client';

import { useEffect, useState } from 'react';

type Passkey = { id: string; createdAt: string; transports: string[] };

export default function PasskeyManagement({ onAccessDenied }: { onAccessDenied: () => void }) {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    fetch('/api/account/passkeys', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(10000) })
      .then(async response => {
        if (!response.ok) {
          if ([401, 403].includes(response.status)) onAccessDenied();
          throw new Error('Passkey list unavailable');
        }
        const data = await response.json();
        if (!Array.isArray(data.authenticators) || data.authenticators.length > 20) throw new Error('Invalid passkey list');
        if (active) { setPasskeys(data.authenticators); setStatus('ready'); }
      }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [onAccessDenied]);

  async function revoke(id: string) {
    if (passkeys.length < 2 || !window.confirm('Revoke this passkey and sign out all active sessions?')) return;
    setStatus('loading');
    try {
      const response = await fetch(`/api/account/passkeys/${encodeURIComponent(id)}`, {
        method: 'DELETE', credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(10000)
      });
      if ([401, 403].includes(response.status)) onAccessDenied();
      if (!response.ok || (await response.json()).revoked !== true) throw new Error('Passkey revocation unavailable');
      if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel('minebench-account'); channel.postMessage('changed'); channel.close(); }
      try { window.localStorage.setItem('minebench:account-change', String(Date.now())); } catch { /* No credentials are stored. */ }
      window.location.replace('/account/login');
    } catch { setStatus('error'); }
  }

  return <section aria-labelledby="passkeys-title" className="mt-10 border-t border-zinc-800 pt-7">
    <h2 id="passkeys-title" className="text-lg font-medium">Account passkeys</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Passkeys are account sign-in methods. Revoking one signs out all active sessions. Keep at least two passkeys enrolled so you can remove a lost device.</p>
    {status === 'loading' && <p role="status" className="mt-4 text-sm text-zinc-400">Loading passkeys…</p>}
    {status === 'error' && <p role="alert" className="mt-4 text-sm text-red-300">Passkey settings are unavailable. Refresh the page to try again.</p>}
    {status === 'ready' && passkeys.length === 0 && <p className="mt-4 text-sm text-zinc-400">No active passkeys are enrolled.</p>}
    {status === 'ready' && passkeys.length > 0 && <ul className="mt-4 divide-y divide-zinc-800">
      {passkeys.map((passkey, index) => <li key={passkey.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div><p className="text-sm">Passkey {index + 1}</p><p className="mt-1 text-xs text-zinc-500">Added {new Date(passkey.createdAt).toISOString().replace('T', ' ').replace('Z', ' UTC')}</p></div>
        <button type="button" disabled={passkeys.length < 2} onClick={() => void revoke(passkey.id)}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 disabled:cursor-not-allowed disabled:opacity-50">
          Revoke passkey
        </button>
      </li>)}
    </ul>}
    {status === 'ready' && passkeys.length === 1 && <p className="mt-3 text-xs text-zinc-500">Enroll a second passkey before revoking the last one.</p>}
  </section>;
}
