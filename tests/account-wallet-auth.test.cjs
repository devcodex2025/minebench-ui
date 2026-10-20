const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function loadAuth(apiUrl = process.env.NEXT_PUBLIC_API_URL) {
  const module = { exports: {} };
  const processEnv = { ...process, env: { ...process.env, NODE_ENV: 'production', NEXT_PUBLIC_API_URL: apiUrl } };
  const cspModule = { exports: {} };
  const cspSource = fs.readFileSync(path.resolve(__dirname, '../lib/accountCsp.ts'), 'utf8');
  const cspCode = ts.transpileModule(cspSource, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  } }).outputText;
  vm.runInNewContext(cspCode, { module: cspModule, exports: cspModule.exports, process: processEnv, URL });
  const source = fs.readFileSync(path.resolve(__dirname, '../lib/accountWalletAuth.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, process: processEnv, fetch, TextEncoder, AbortSignal, BigInt,
    require: name => name === './accountCsp' ? cspModule.exports : require(name) });
  return module.exports;
}

const wallet = '11111111111111111111111111111111';
const message = `MineBench Wallet Authentication\nWallet: ${wallet}\nNonce: unique\n`;

test('wallet authentication signs the bound challenge and validates the returned account', async () => {
  const { authenticateAccountWallet } = loadAuth();
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push([url, init]);
    return calls.length === 1
      ? Response.json({ message })
      : Response.json({ token: 'session-token', user: { walletAddress: wallet } });
  };
  const token = await authenticateAccountWallet(wallet, async bytes => {
    assert.equal(new TextDecoder().decode(bytes), message);
    return new Uint8Array(64).fill(1);
  }, fetchImpl, () => {});
  assert.equal(token, 'session-token');
  assert.match(calls[0][0], /\/api\/auth\/nonce\?walletAddress=/);
  assert.equal(calls[1][1].method, 'POST');
  assert.equal(JSON.parse(calls[1][1].body).walletAddress, wallet);
  assert.match(JSON.parse(calls[1][1].body).signature, /^[1-9A-HJ-NP-Za-km-z]+$/);
  assert.equal(calls[0][1].cache, 'no-store');
});

test('wallet authentication ignores an untrusted production API URL', async () => {
  const { authenticateAccountWallet } = loadAuth('https://attacker.example');
  const urls = [];
  const fetchImpl = async url => {
    urls.push(url);
    return urls.length === 1
      ? Response.json({ message })
      : Response.json({ token: 'session-token', user: { walletAddress: wallet } });
  };
  await authenticateAccountWallet(wallet, async () => new Uint8Array(64).fill(1), fetchImpl);
  assert.ok(urls.every(url => url.startsWith('https://backend.minebench.cloud/api/')));
});

test('wallet authentication rejects a challenge for another wallet before signing', async () => {
  const { authenticateAccountWallet } = loadAuth();
  let signed = false;
  await assert.rejects(() => authenticateAccountWallet(wallet, async () => {
    signed = true;
    return new Uint8Array(64).fill(1);
  }, async () => Response.json({ message: 'MineBench Wallet Authentication\nWallet: another-wallet\n' })));
  assert.equal(signed, false);
});

test('wallet authentication stops if the connected wallet changes during signing', async () => {
  const { authenticateAccountWallet } = loadAuth();
  let calls = 0;
  await assert.rejects(() => authenticateAccountWallet(wallet, async () => new Uint8Array(64).fill(1), async () => {
    calls += 1;
    return Response.json({ message });
  }, () => { if (calls > 0) throw new Error('Wallet changed. Sign in again.'); }), /Wallet changed/);
  assert.equal(calls, 1);
});
