const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const strip = fs.readFileSync(path.join(root, 'components/NetworkStrip.tsx'), 'utf8');
const footer = fs.readFileSync(path.join(root, 'components/Footer.tsx'), 'utf8');

// The proxy endpoint stays the primary/default on the network strip.
assert.match(strip, /Pool <span className="text-zinc-300">xmr\.minebench\.cloud<\/span>/);
// The BMT endpoint is shown alongside it, hidden on very small screens.
assert.match(strip, /hidden sm:flex items-center gap-2[^\n]*bmt\.minebench\.cloud/);
// Footer lists both hostnames.
assert.match(footer, /xmr\.minebench\.cloud · bmt\.minebench\.cloud/);

console.log('public endpoint tests passed');
