import { AccountError, PRIVATE_HEADERS, accountFetch, accountFailure, requireAccountFeature, verifiedAccount } from '@/lib/accountServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    requireAccountFeature();
    const session = await verifiedAccount();
    const response = await accountFetch('/api/auth/xmr/binding/sources', session.token);
    const data = await response.json();
    if (!data || !Array.isArray(data.sources) || data.sources.length > 100) throw new AccountError(503, 'ACCOUNT_UNAVAILABLE');
    return Response.json(data, { headers: PRIVATE_HEADERS });
  } catch (error) { return accountFailure(error); }
}
