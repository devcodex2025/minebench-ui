import { cookies } from 'next/headers';
import { AccountError, ACCOUNT_COOKIE, PRIVATE_HEADERS, accountFetch, accountFailure, assertAccountOrigin,
  requireAccountFeature, verifiedAccount } from '@/lib/accountServer';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, context: { params: Promise<{ authenticatorId: string }> }) {
  try {
    requireAccountFeature(); assertAccountOrigin(request);
    const { authenticatorId } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(authenticatorId)) {
      throw new AccountError(400, 'INVALID_AUTHENTICATOR');
    }
    const session = await verifiedAccount();
    const response = await accountFetch(`/api/auth/passkeys/${authenticatorId}`, session.token, false, { method: 'DELETE' });
    if ((await response.json()).revoked !== true) throw new AccountError(503, 'ACCOUNT_UNAVAILABLE');
    (await cookies()).delete(ACCOUNT_COOKIE);
    return Response.json({ revoked: true }, { headers: PRIVATE_HEADERS });
  } catch (error) { return accountFailure(error); }
}
