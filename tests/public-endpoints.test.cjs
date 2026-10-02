const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const strip = fs.readFileSync(path.join(root, 'components/NetworkStrip.tsx'), 'utf8');
const footer = fs.readFileSync(path.join(root, 'components/Footer.tsx'), 'utf8');

// The proxy endpoint stays the primary/default on the network strip.
assert.match(strip, /Pool <span className="text-zinc-300">xmr\.minebench\.cloud:3333<\/span>/);
// The direct Monero-wallet endpoint is shown alongside it, hidden on very small screens.
assert.match(strip, /hidden sm:flex items-center gap-2[^\n]*direct\.minebench\.cloud:3334/);
assert.match(strip, /\(Monero wallet\)/);
// Footer lists both endpoints with the direct one labelled for Monero-wallet miners.
assert.match(footer, /xmr\.minebench\.cloud:3333 · direct\.minebench\.cloud:3334 \(Monero wallet\)/);

console.log('public endpoint tests passed');
