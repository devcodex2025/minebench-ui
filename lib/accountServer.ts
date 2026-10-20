import 'server-only';
import { cookies } from 'next/headers';

export const ACCOUNT_COOKIE = '__Host-minebench-account';
export const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow', 'Vary': 'Cookie, Origin', 'Referrer-Policy': 'no-referrer' };

export class AccountError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
}

function origin(value: string | undefined): string {
  let url: URL;
  try { url = new URL(value || ''); } catch { throw new AccountError(503, 'ACCOUNT_UNAVAILABLE'); }
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
    || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new AccountError(503, 'ACCOUNT_UNAVAILABLE');
  }
  return url.origin;
}

export function accountEnabled() { return process.env.MINING_STATISTICS_ENABLED === 'true'; }
export function requireAccountFeature() { if (!accountEnabled()) throw new AccountError(404, 'NOT_FOUND'); }
export function assertAccountOrigin(request: Request) {
  const expected = origin(process.env.ACCOUNT_WEB_ORIGIN || 'https://minebench.cloud');
  const requestOrigin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  const sameOriginRead = request.method === 'GET' && requestOrigin === null && fetchSite === 'same-origin';
  if ((requestOrigin !== expected && !sameOriginRead) || fetchSite === 'cross-site') {
    throw new AccountError(403, 'ORIGIN_DENIED');
  }
}

export async function boundedAccountJson(request: Request, maxBytes = 8192): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')
    || Number(request.headers.get('content-length') ?? 0) > maxBytes || !request.body) throw new AccountError(400, 'INVALID_SESSION');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  let timedOut = false;
  const deadline = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => {}); }, 5000);
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > maxBytes) { await reader.cancel(); throw new AccountError(400, 'INVALID_SESSION'); }
      chunks.push(part.value);
    }
    if (timedOut) throw new Error('Request timed out');
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
    return body;
  } catch { throw new AccountError(400, 'INVALID_SESSION'); }
  finally { clearTimeout(deadline); reader.releaseLock(); }
}

export async function accountFetch(path: string, token: string, statistics = false, init: RequestInit = {}) {
  requireAccountFeature();
  if (!/^[A-Za-z0-9_.-]{1,4096}$/.test(token)) throw new AccountError(401, 'ACCOUNT_AUTHENTICATION_REQUIRED');
  const base = origin(statistics ? process.env.ACCOUNT_STATISTICS_ORIGIN : process.env.ACCOUNT_IAM_ORIGIN);
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${token}`);
    headers.set('origin', origin(process.env.ACCOUNT_WEB_ORIGIN || 'https://minebench.cloud'));
    response = await fetch(`${base}${path}`, { ...init, headers,
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) });
  } catch { throw new AccountError(503, 'ACCOUNT_UNAVAILABLE'); }
  if (!response.ok) throw new AccountError([401, 403, 404, 409, 429].includes(response.status) ? response.status : 503,
    response.status === 401 ? 'ACCOUNT_AUTHENTICATION_REQUIRED' : response.status === 429 ? 'RATE_LIMITED' : 'ACCOUNT_UNAVAILABLE');
  return response;
}

export async function accountPublicFetch(path: string, init: RequestInit = {}) {
  requireAccountFeature();
  const base = origin(process.env.ACCOUNT_IAM_ORIGIN);
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set('origin', origin(process.env.ACCOUNT_WEB_ORIGIN || 'https://minebench.cloud'));
    response = await fetch(`${base}${path}`, { ...init, headers, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) });
  } catch { throw new AccountError(503, 'ACCOUNT_UNAVAILABLE'); }
  if (!response.ok) throw new AccountError([400, 401, 403, 404, 409, 429].includes(response.status) ? response.status : 503,
    response.status === 429 ? 'RATE_LIMITED' : response.status === 401 ? 'ACCOUNT_AUTHENTICATION_REQUIRED' : 'ACCOUNT_UNAVAILABLE');
  return response;
}

export async function establishAccountSession(token: string) {
  const session = await verifiedAccount(token);
  const jar = await cookies();
  const previous = jar.get(ACCOUNT_COOKIE)?.value;
  if (previous && previous !== session.token) {
    try {
      const old = await verifiedAccount(previous);
      if (old.id !== session.id) {
        const loggedOut = await accountFetch('/api/auth/logout', previous, false, { method: 'POST' });
        if ((await loggedOut.json()).success !== true) throw new AccountError(503, 'LOGOUT_UNAVAILABLE');
      }
    } catch (error) { if (!(error instanceof AccountError) || error.status !== 401) throw error; }
  }
  jar.set(ACCOUNT_COOKIE, session.token, { httpOnly: true, secure: true, sameSite: 'strict', path: '/',
    maxAge: Math.min(900, Math.max(1, Math.floor((Date.parse(session.expiresAt) - Date.now()) / 1000))) });
  return session;
}

export async function verifiedAccount(token?: string) {
  requireAccountFeature();
  const value = token ?? (await cookies()).get(ACCOUNT_COOKIE)?.value;
  if (!value) throw new AccountError(401, 'ACCOUNT_AUTHENTICATION_REQUIRED');
  const response = await accountFetch('/api/auth/account-session', value);
  const data = await response.json();
  if (data.valid !== true || typeof data.user?.id !== 'string'
    || !/^[0-9a-f-]{36}$/i.test(data.user.id) || !Number.isSafeInteger(data.user.sessionVersion)
    || typeof data.expiresAt !== 'string' || !Number.isFinite(Date.parse(data.expiresAt)) || Date.parse(data.expiresAt) <= Date.now()) {
    throw new AccountError(401, 'ACCOUNT_AUTHENTICATION_REQUIRED');
  }
  return { token: value, id: data.user.id as string, sessionVersion: data.user.sessionVersion as number, expiresAt: data.expiresAt as string };
}

export function accountFailure(error: unknown): Response {
  return Response.json({ error: error instanceof AccountError ? error.code : 'ACCOUNT_UNAVAILABLE' },
    { status: error instanceof AccountError ? error.status : 503, headers: PRIVATE_HEADERS });
}
