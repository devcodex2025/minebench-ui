const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const test = require('node:test');
const {
  BenchmarkSecurityError,
  validateBenchmarkPayload,
  verifyBenchmarkToken,
} = require('../lib/benchmarkSecurity');

const SECRET = 'test-secret-that-is-at-least-thirty-two-bytes-long';
const WALLET = '2C3LWVjZNyMp4dSsrkYPWB7HLhXbgm7CQFoA24nFTaCA';

const signToken = (payload, header = { alg: 'HS256', typ: 'JWT' }) => {
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const validPayload = () => ({
  avg_hashrate: 12_500,
  max_hashrate: 13_200,
  duration_seconds: 300,
  device_type: 'CPU',
  device_name: 'AMD Ryzen security test',
  avg_temp: 70,
  avg_power: 95,
  algorithm: 'RandomX',
  coin_name: 'XMR',
  solana_wallet_address: WALLET,
  device_uid: 'device-security-test',
  created_at: '2000-01-01T00:00:00.000Z',
});

test('accepts optional public system metadata and preserves legacy records', () => {
  const legacy = validateBenchmarkPayload(validPayload(), WALLET);
  assert.equal('os_name' in legacy, false);
  const metadata = {os_name:'linux',os_arch:'x86_64',client_version:'0.8.33',cpu_cores:16,ram_total_bytes:34359738368,xmrig_version:'6.25.0'};
  const record = validateBenchmarkPayload({...validPayload(),...metadata}, WALLET);
  for (const [key,value] of Object.entries(metadata)) assert.equal(record[key], value);
});

test('rejects unsafe metadata, invalid units, fractions and unknown properties', () => {
  for (const metadata of [{os_name:'user@hostname'}, {os_arch:'<script>'}, {client_version:'file:///secret'}, {xmrig_version:'6.25.0\n'}, {cpu_cores:1.5}, {cpu_cores:4097}, {ram_total_bytes:32}, {ram_total_bytes:Infinity}, {ram_total_bytes:34359738368.5}, {hostname:'private-machine'}]) {
    assert.throws(() => validateBenchmarkPayload({...validPayload(),...metadata}, WALLET), BenchmarkSecurityError);
  }
});

test('accepts a valid backend JWT', () => {
  const token = signToken({ sub: 'user-1', walletAddress: WALLET, exp: 2_000 });
  const payload = verifyBenchmarkToken(`Bearer ${token}`, SECRET, 1_000);
  assert.equal(payload.walletAddress, WALLET);
});

test('rejects missing, expired, tampered, and alg=none tokens', () => {
  assert.throws(() => verifyBenchmarkToken(undefined, SECRET, 1_000), BenchmarkSecurityError);
  const expired = signToken({ sub: 'user-1', walletAddress: WALLET, exp: 999 });
  assert.throws(() => verifyBenchmarkToken(`Bearer ${expired}`, SECRET, 1_000), BenchmarkSecurityError);
  const valid = signToken({ sub: 'user-1', walletAddress: WALLET, exp: 2_000 });
  assert.throws(() => verifyBenchmarkToken(`Bearer ${valid}x`, SECRET, 1_000), BenchmarkSecurityError);
  const none = signToken({ sub: 'user-1', walletAddress: WALLET, exp: 2_000 }, { alg: 'none' });
  assert.throws(() => verifyBenchmarkToken(`Bearer ${none}`, SECRET, 1_000), BenchmarkSecurityError);
});

test('binds the submitted wallet to the authenticated wallet', () => {
  assert.throws(
    () => validateBenchmarkPayload(validPayload(), '7YWHMfk9JZe0LM0g1RVhWnJuBmgZ2Q6E2M1XgRGpQHLv'),
    (error) => error instanceof BenchmarkSecurityError && error.status === 403,
  );
});

test('rejects the fake hashrate and unsupported properties', () => {
  assert.throws(
    () => validateBenchmarkPayload({ ...validPayload(), avg_hashrate: 999_999, max_hashrate: 999_999 }, WALLET),
    BenchmarkSecurityError,
  );
  assert.throws(
    () => validateBenchmarkPayload({ ...validPayload(), admin: true }, WALLET),
    BenchmarkSecurityError,
  );
});

test('normalizes a valid record and never trusts client created_at', () => {
  const record = validateBenchmarkPayload(validPayload(), WALLET);
  assert.equal(record.solana_wallet_address, WALLET);
  assert.equal(record.algorithm, 'RandomX');
  assert.equal(Object.hasOwn(record, 'created_at'), false);
});
