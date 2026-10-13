const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dashboard = fs.readFileSync(path.join(root, 'app/dashboard/DashboardClient.tsx'), 'utf8');
const strip = fs.readFileSync(path.join(root, 'components/NetworkStrip.tsx'), 'utf8');
const normalizer = fs.readFileSync(path.join(root, 'lib/pool-stats.ts'), 'utf8');

assert.match(dashboard, /normalizePoolStats\(poolStatsPayload\)/);
assert.match(strip, /normalizePoolStats\(poolData\)/);
assert.match(normalizer, /id: 'default'/);
assert.match(normalizer, /payload\.pools/);
assert.match(normalizer, /payload\.poolHashrate/);

console.log('dashboard pool stats normalization tests passed');
