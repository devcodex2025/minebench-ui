const { createHmac, timingSafeEqual } = require('node:crypto');

const ALLOWED_FIELDS = new Set([
  'avg_hashrate',
  'max_hashrate',
  'duration_seconds',
  'device_type',
  'device_name',
  'avg_temp',
  'avg_power',
  'algorithm',
  'coin_name',
  'solana_wallet_address',
  'device_uid',
  'created_at',
]);

const ALGORITHM_RULES = {
  RandomX: { coin: 'XMR', deviceType: 'CPU', maxHashrate: 500_000 },
  KawPow: { coin: 'RVN', deviceType: 'GPU', maxHashrate: 1_000_000_000 },
};

class BenchmarkSecurityError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'BenchmarkSecurityError';
    this.status = status;
  }
}

const fail = (status, message) => {
  throw new BenchmarkSecurityError(status, message);
};

const readString = (value, field, minLength, maxLength) => {
  if (typeof value !== 'string') fail(400, `${field} must be a string`);
  const next = value.trim();
  if (next.length < minLength || next.length > maxLength || /[\u0000-\u001f\u007f]/.test(next)) {
    fail(400, `${field} is invalid`);
  }
  return next;
};

const readNumber = (value, field, min, max, integer = false) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    fail(400, `${field} is outside the allowed range`);
  }
  if (integer && !Number.isInteger(value)) fail(400, `${field} must be an integer`);
  return value;
};

const readOptionalNumber = (value, field, min, max) => {
  if (value === null || value === undefined) return null;
  return readNumber(value, field, min, max);
};

const decodeJson = (segment) => {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    fail(401, 'Invalid or expired token');
  }
};

function verifyBenchmarkToken(authorization, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) {
    fail(500, 'Benchmark authentication is not configured');
  }
  if (typeof authorization !== 'string' || authorization.length > 4096) {
    fail(401, 'Authentication required');
  }

  const bearer = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!bearer) fail(401, 'Authentication required');

  const parts = bearer[1].split('.');
  if (parts.length !== 3) fail(401, 'Invalid or expired token');

  const header = decodeJson(parts[0]);
  const payload = decodeJson(parts[1]);
  if (header.alg !== 'HS256' || (header.typ && header.typ !== 'JWT')) {
    fail(401, 'Invalid or expired token');
  }

  let actualSignature;
  try {
    actualSignature = Buffer.from(parts[2], 'base64url');
  } catch {
    fail(401, 'Invalid or expired token');
  }
  const expectedSignature = createHmac('sha256', secret)
    .update(`${parts[0]}.${parts[1]}`)
    .digest();
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    fail(401, 'Invalid or expired token');
  }

  if (
    !payload ||
    typeof payload.sub !== 'string' ||
    typeof payload.exp !== 'number' ||
    payload.exp <= nowSeconds ||
    (typeof payload.nbf === 'number' && payload.nbf > nowSeconds) ||
    typeof payload.walletAddress !== 'string' ||
    !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(payload.walletAddress)
  ) {
    fail(401, 'Invalid or expired token');
  }

  return payload;
}

function validateBenchmarkPayload(body, authenticatedWallet) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail(400, 'Request body must be a JSON object');
  }
  const keys = Object.keys(body);
  if (keys.length > ALLOWED_FIELDS.size || keys.some((key) => !ALLOWED_FIELDS.has(key))) {
    fail(400, 'Request contains unsupported fields');
  }

  const wallet = readString(body.solana_wallet_address, 'solana_wallet_address', 32, 44);
  if (wallet !== authenticatedWallet) fail(403, 'Wallet does not match authenticated user');

  const deviceType = readString(body.device_type, 'device_type', 3, 3).toUpperCase();
  const algorithmInput = readString(body.algorithm, 'algorithm', 4, 32).toLowerCase();
  const algorithm = algorithmInput === 'randomx' ? 'RandomX' : algorithmInput === 'kawpow' ? 'KawPow' : null;
  if (!algorithm) fail(400, 'Unsupported benchmark algorithm');

  const rule = ALGORITHM_RULES[algorithm];
  const coinName = readString(body.coin_name, 'coin_name', 2, 12).toUpperCase();
  if (deviceType !== rule.deviceType || coinName !== rule.coin) {
    fail(400, 'Algorithm, coin, and device type do not match');
  }

  const avgHashrate = readNumber(body.avg_hashrate, 'avg_hashrate', 0.01, rule.maxHashrate);
  const maxHashrate = readNumber(body.max_hashrate, 'max_hashrate', avgHashrate, rule.maxHashrate);

  return {
    avg_hashrate: avgHashrate,
    max_hashrate: maxHashrate,
    duration_seconds: readNumber(body.duration_seconds, 'duration_seconds', 10, 86_400, true),
    device_type: deviceType,
    device_name: readString(body.device_name, 'device_name', 2, 160),
    avg_temp: readOptionalNumber(body.avg_temp, 'avg_temp', 0, 130),
    avg_power: readOptionalNumber(body.avg_power, 'avg_power', 0, 10_000),
    algorithm,
    coin_name: coinName,
    solana_wallet_address: authenticatedWallet,
    device_uid: readString(body.device_uid, 'device_uid', 8, 256),
  };
}

module.exports = {
  BenchmarkSecurityError,
  validateBenchmarkPayload,
  verifyBenchmarkToken,
};
