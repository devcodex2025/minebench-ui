import { AccountError, PRIVATE_HEADERS, accountFetch, accountFailure, assertAccountOrigin,
  boundedAccountJson, requireAccountFeature, verifiedAccount } from '@/lib/accountServer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireAccountFeature();
    assertAccountOrigin(request);
    const body = await boundedAccountJson(request, 1024);
    if (Object.keys(body).length !== 1 || typeof body.sourceRegistrationId !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.sourceRegistrationId)) {
      throw new AccountError(400, 'INVALID_SESSION');
    }
    const session = await verifiedAccount();
    const response = await accountFetch('/api/auth/bmt/worker-credential', session.token, false, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!data || data.rail !== 'bmt' || data.rotated !== true || typeof data.password !== 'string'
      || !/^[A-Za-z0-9_-]{43}$/.test(data.password) || typeof data.effectiveAfter !== 'string'
      || !Number.isFinite(Date.parse(data.effectiveAfter))) throw new AccountError(503, 'ACCOUNT_UNAVAILABLE');
    return Response.json(data, { headers: PRIVATE_HEADERS });
  } catch (error) { return accountFailure(error); }
}
