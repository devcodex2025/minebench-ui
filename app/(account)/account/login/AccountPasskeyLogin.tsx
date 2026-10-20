'use client';
import { useState } from 'react';

type Action = 'login' | 'register';

async function post(action: string, body: Record<string, unknown> = {}) {
  const response = await fetch(`/api/account/passkey/${action}`, {
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000)
  });
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Passkey sign-in is unavailable. Try again or use your connected wallet.');
  return value;
}

export default function AccountPasskeyLogin() {
  const [working, setWorking] = useState<Action | null>(null);
  const [error, setError] = useState('');

  async function authenticate(action: Action) {
    if (working) return;
    setWorking(action); setError('');
    try {
      const optionsAction = action === 'login' ? 'login-options' : 'register-options';
      const verifyAction = action === 'login' ? 'login-verify' : 'register-verify';
      const challenge = await post(optionsAction);
      if (typeof challenge.challengeId !== 'string' || !challenge.options) throw new Error('Invalid passkey challenge');
      const webauthn = await import('@simplewebauthn/browser');
      const credential = action === 'login'
        ? await webauthn.startAuthentication({ optionsJSON: challenge.options })
        : await webauthn.startRegistration({ optionsJSON: challenge.options });
      const completed = await post(verifyAction, { challengeId: challenge.challengeId, credential });
      if (completed.valid !== true) throw new Error('Passkey verification failed');
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('minebench-account'); channel.postMessage('changed'); channel.close();
      }
      try { window.localStorage.setItem('minebench:account-change', String(Date.now())); } catch { /* No credentials are stored. */ }
      window.location.replace('/account');
    } catch (failure) {
      setError(failure instanceof Error && failure.name === 'NotAllowedError'
        ? 'Passkey request was cancelled or timed out.'
        : 'Passkey sign-in is unavailable. Try again or use your connected wallet.');
      setWorking(null);
    }
  }

  return <section aria-labelledby="passkey-title" className="space-y-4 rounded-xl border border-zinc-800 p-6">
    <div>
      <h2 id="passkey-title" className="text-lg font-medium">Sign in with a passkey</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">Use a passkey stored on this device or in your password manager. Your private key stays with your authenticator.</p>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" className="btn-primary" disabled={working !== null}
        onClick={() => void authenticate('login')}>
        {working === 'login' ? 'Verifying passkey…' : 'Sign in with passkey'}
      </button>
      <button type="button" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 disabled:opacity-60"
        disabled={working !== null} onClick={() => void authenticate('register')}>
        {working === 'register' ? 'Creating account…' : 'Create account with passkey'}
      </button>
    </div>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </section>;
}
