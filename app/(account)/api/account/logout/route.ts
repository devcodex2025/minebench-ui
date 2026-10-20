import { cookies } from 'next/headers';
import { ACCOUNT_COOKIE, PRIVATE_HEADERS, AccountError, assertAccountOrigin, verifiedAccount, accountFailure, accountFetch, requireAccountFeature } from '@/lib/accountServer';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    requireAccountFeature(); assertAccountOrigin(request);
    try {
      const session = await verifiedAccount();
      const response = await accountFetch('/api/auth/logout', session.token, false, { method: 'POST' });
      if ((await response.json()).success !== true) throw new AccountError(503, 'LOGOUT_UNAVAILABLE');
    } catch (error) {
      if (!(error instanceof AccountError) || error.status !== 401) throw error;
    }
    (await cookies()).set(ACCOUNT_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
    return Response.json({ success: true }, { headers: { ...PRIVATE_HEADERS, 'Clear-Site-Data': '"cache"' } });
  } catch (error) { return accountFailure(error); }
}
