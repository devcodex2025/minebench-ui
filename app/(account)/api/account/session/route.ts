import { cookies } from 'next/headers';
import { ACCOUNT_COOKIE, PRIVATE_HEADERS, AccountError, assertAccountOrigin, verifiedAccount, accountFailure, requireAccountFeature, boundedAccountJson, accountFetch } from '@/lib/accountServer';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    requireAccountFeature(); assertAccountOrigin(request);
    const body = await boundedAccountJson(request);
    if (!body || typeof body.token !== 'string' || Object.keys(body).some(key => key !== 'token')) throw new AccountError(400, 'INVALID_SESSION');
    const session = await verifiedAccount(body.token);
    const previous = (await cookies()).get(ACCOUNT_COOKIE)?.value;
    if (previous && previous !== session.token) {
      try {
        const old = await verifiedAccount(previous);
        if (old.id !== session.id) {
          const loggedOut = await accountFetch('/api/auth/logout', previous, false, { method: 'POST' });
          if ((await loggedOut.json()).success !== true) throw new AccountError(503, 'LOGOUT_UNAVAILABLE');
        }
      } catch (error) { if (!(error instanceof AccountError) || error.status !== 401) throw error; }
    }
    (await cookies()).set(ACCOUNT_COOKIE, session.token, { httpOnly: true, secure: true, sameSite: 'strict', path: '/',
      maxAge: Math.min(900, Math.max(1, Math.floor((Date.parse(session.expiresAt) - Date.now()) / 1000))) });
    return Response.json({ valid: true }, { headers: PRIVATE_HEADERS });
  } catch (error) { return accountFailure(error); }
}

export async function GET() {
  try {
    const session = await verifiedAccount();
    return Response.json({ valid: true, accountId: session.id, expiresAt: session.expiresAt }, { headers: PRIVATE_HEADERS });
  } catch (error) { return accountFailure(error); }
}
