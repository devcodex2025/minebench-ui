import { resolveAccountApiOrigin } from './accountCsp';

type WalletFetch = typeof fetch;

function apiBase() {
  return resolveAccountApiOrigin(process.env.NEXT_PUBLIC_API_URL || 'https://backend.minebench.cloud');
}

function encodeBase58(bytes: Uint8Array) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let value = BigInt(0);
  const values = Array.from(bytes);
  for (const byte of values) value = value * BigInt(256) + BigInt(byte);
  let encoded = '';
  while (value) { encoded = alphabet[Number(value % BigInt(58))] + encoded; value /= BigInt(58); }
  for (const byte of values) { if (byte !== 0) break; encoded = `1${encoded}`; }
  return encoded;
}

async function request(path: string, fetchImpl: WalletFetch, body?: unknown) {
  const response = await fetchImpl(`${apiBase()}/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: 'no-store', signal: AbortSignal.timeout(30_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'Account sign-in failed. Try again.');
  return data;
}

export async function authenticateAccountWallet(
  wallet: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  fetchImpl: WalletFetch = fetch,
  assertWallet: () => void = () => {},
) {
  assertWallet();
  const nonce = await request(`/auth/nonce?walletAddress=${encodeURIComponent(wallet)}`, fetchImpl);
  if (typeof nonce?.message !== 'string' || !nonce.message.startsWith('MineBench Wallet Authentication\n')
    || !nonce.message.includes(`\nWallet: ${wallet}\n`)) throw new Error('Invalid wallet authentication challenge');
  assertWallet();
  const signature = await signMessage(new TextEncoder().encode(nonce.message));
  assertWallet();
  if (signature.length !== 64) throw new Error('Invalid authentication signature');
  const result = await request('/auth/login', fetchImpl, {
    walletAddress: wallet, signature: encodeBase58(signature), message: nonce.message,
  });
  if (typeof result?.token !== 'string' || !result.token || result.user?.walletAddress !== wallet) {
    throw new Error('Invalid wallet session');
  }
  assertWallet();
  return result.token as string;
}
