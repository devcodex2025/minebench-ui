import { PRIVATE_HEADERS, accountFetch, accountFailure, assertAccountOrigin,
  requireAccountFeature, verifiedAccount } from '@/lib/accountServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    requireAccountFeature(); assertAccountOrigin(request);
    const session = await verifiedAccount();
    const response = await accountFetch('/api/auth/passkeys', session.token);
    return Response.json(await response.json(), { headers: PRIVATE_HEADERS });
  } catch (error) { return accountFailure(error); }
}
