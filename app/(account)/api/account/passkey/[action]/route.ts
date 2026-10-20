import {
  AccountError,
  PRIVATE_HEADERS,
  accountFetch,
  accountPublicFetch,
  accountFailure,
  assertAccountOrigin,
  boundedAccountJson,
  establishAccountSession,
  requireAccountFeature,
  verifiedAccount
} from '@/lib/accountServer';

export const dynamic = 'force-dynamic';

const actions = {
  'login-options': { path: '/api/auth/passkey/login/options', auth: false, body: false },
  'login-verify': { path: '/api/auth/passkey/login/verify', auth: false, body: true },
  'register-options': { path: '/api/auth/passkey/register/options', auth: false, body: false },
  'register-verify': { path: '/api/auth/passkey/register/verify', auth: false, body: true },
  'enroll-options': { path: '/api/auth/passkey/enroll/options', auth: true, body: false },
  'enroll-verify': { path: '/api/auth/passkey/enroll/verify', auth: true, body: true }
} as const;

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  try {
    requireAccountFeature();
    assertAccountOrigin(request);
    const { action } = await context.params;
    if (!Object.prototype.hasOwnProperty.call(actions, action)) throw new AccountError(404, 'NOT_FOUND');
    const selected = actions[action as keyof typeof actions];
    const body = selected.body ? await boundedAccountJson(request, 40 * 1024) : undefined;
    if (body && (Object.keys(body).length !== 2 || typeof body.challengeId !== 'string' || !('credential' in body))) {
      throw new AccountError(400, 'INVALID_SESSION');
    }
    const init: RequestInit = { method: 'POST', headers: { 'content-type': 'application/json' } };
    if (body) init.body = JSON.stringify(body);
    const upstream = selected.auth
      ? await accountFetch(selected.path, (await verifiedAccount()).token, false, init)
      : await accountPublicFetch(selected.path, init);
    const result = await upstream.json();
    if (action === 'login-verify' || action === 'register-verify') {
      if (!result || typeof result.token !== 'string') throw new AccountError(503, 'ACCOUNT_UNAVAILABLE');
      await establishAccountSession(result.token);
      return Response.json({ valid: true }, { headers: PRIVATE_HEADERS });
    }
    return Response.json(result, { headers: PRIVATE_HEADERS });
  } catch (error) { return accountFailure(error); }
}
