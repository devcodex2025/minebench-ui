import { AccountError, PRIVATE_HEADERS, verifiedAccount, accountFailure, accountFetch, requireAccountFeature } from '@/lib/accountServer';

export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ view: string }> }) {
  try {
    requireAccountFeature();
    const { view } = await context.params;
    if (!['overview', 'workers', 'rewards', 'payouts'].includes(view)) throw new AccountError(404, 'NOT_FOUND');
    const query = new URL(request.url).searchParams;
    for (const key of Array.from(query.keys())) {
      if (!['mode', 'range', 'limit', 'cursor'].includes(key) || query.getAll(key).length !== 1) throw new AccountError(400, 'INVALID_QUERY');
    }
    if (query.toString().length > 1400) throw new AccountError(400, 'INVALID_QUERY');
    const session = await verifiedAccount();
    const response = await accountFetch(`/api/stats/me/${view}?${query}`, session.token, true);
    return Response.json({ ...(await response.json()), accountId: session.id }, { headers: PRIVATE_HEADERS });
  } catch (error) { return accountFailure(error); }
}
