const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const strip = fs.readFileSync(path.join(root, 'components/NetworkStrip.tsx'), 'utf8');
const footer = fs.readFileSync(path.join(root, 'components/Footer.tsx'), 'utf8');

// Only the XMR pool endpoint (with its port) is shown on the network strip.
assert.match(strip, /Pool <span className="text-zinc-300">xmr\.minebench\.cloud:3333<\/span>/);
// The BMT endpoint must no longer be present in these components.
assert.doesNotMatch(strip, /bmt\.minebench\.cloud/);
// Footer lists only the XMR pool hostname with its port.
assert.match(footer, /xmr\.minebench\.cloud:3333/);
assert.doesNotMatch(footer, /bmt\.minebench\.cloud/);

console.log('public endpoint tests passed');
