const API_FALLBACK = 'https://backend.minebench.cloud';
const TRUSTED_API_HOSTS = new Set(['backend.minebench.cloud']);

export function resolveAccountApiOrigin(apiUrl = API_FALLBACK, nodeEnv = process.env.NODE_ENV): string {
  try {
    const url = new URL(apiUrl);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const allowedPath = ['', '/', '/api'].includes(url.pathname);
    const trustedHost = TRUSTED_API_HOSTS.has(url.hostname) || (nodeEnv !== 'production' && loopback);
    if (allowedPath && !url.username && !url.password && !url.search && !url.hash
      && (nodeEnv !== 'production' || !url.port)
      && (url.protocol === 'https:' || (nodeEnv !== 'production' && loopback && url.protocol === 'http:'))
      && trustedHost) return url.origin;
  } catch { /* Invalid API configuration falls back to the canonical service. */ }
  return API_FALLBACK;
}

export function createAccountCspNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

export function buildAccountContentSecurityPolicy(
  nonce: string,
  apiUrl = API_FALLBACK,
  nodeEnv = process.env.NODE_ENV,
): string {
  if (!/^[A-Za-z0-9+/]{20,24}={0,2}$/.test(nonce)) throw new Error('Invalid CSP nonce');
  const apiOrigin = resolveAccountApiOrigin(apiUrl, nodeEnv);

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin}`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
}
