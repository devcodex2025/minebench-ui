import { NextRequest, NextResponse } from 'next/server';
import { buildAccountContentSecurityPolicy, createAccountCspNonce } from '@/lib/accountCsp';

export function middleware(request: NextRequest) {
  const csp = buildAccountContentSecurityPolicy(createAccountCspNonce(),
    process.env.NEXT_PUBLIC_API_URL || 'https://backend.minebench.cloud');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: ['/account', '/account/:path*'],
};
