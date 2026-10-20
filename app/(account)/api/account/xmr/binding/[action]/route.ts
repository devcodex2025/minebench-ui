import { AccountError, PRIVATE_HEADERS, accountFetch, accountFailure, assertAccountOrigin,
  boundedAccountJson, requireAccountFeature, verifiedAccount } from '@/lib/accountServer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  try {
    requireAccountFeature();
    assertAccountOrigin(request);
    const { action } = await context.params;
    if (action !== 'challenge' && action !== 'verify') throw new AccountError(404, 'NOT_FOUND');
    const body = await boundedAccountJson(request, action === 'challenge' ? 2048 : 4096);
    const keys = action === 'challenge' ? ['sourceRegistrationId', 'address'] : ['challengeId', 'message', 'signature'];
    if (Object.keys(body).length !== keys.length || Object.keys(body).some(key => !keys.includes(key))) {
      throw new AccountError(400, 'INVALID_SESSION');
    }
    if (action === 'challenge' && (typeof body.sourceRegistrationId !== 'string' || typeof body.address !== 'string')) {
      throw new AccountError(400, 'INVALID_SESSION');
    }
    if (action === 'verify' && (typeof body.challengeId !== 'string' || typeof body.message !== 'string'
      || typeof body.signature !== 'string' || Buffer.byteLength(body.message, 'utf8') > 2048
      || Buffer.byteLength(body.signature, 'utf8') > 512)) throw new AccountError(400, 'INVALID_SESSION');
    const session = await verifiedAccount();
    const response = await accountFetch(`/api/auth/xmr/binding/${action}`, session.token, false, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    });
    return Response.json(await response.json(), { headers: PRIVATE_HEADERS });
  } catch (error) { return accountFailure(error); }
}
