const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dashboard = fs.readFileSync(path.join(root, 'app/dashboard/DashboardClient.tsx'), 'utf8');
const panel = fs.readFileSync(path.join(root, 'components/DynamicManagedFeePanel.tsx'), 'utf8');

assert.match(dashboard, /dynamicFee/);
assert.match(dashboard, /<DynamicManagedFeePanel policy=\{dynamicFee\} \/>/);
assert.match(panel, /Current fee/);
assert.match(panel, /trailing seven-day eligible hashrate/i);
assert.match(panel, /Native direct P2Pool payouts remain 0%/);
assert.match(panel, /!policy \|\| policy\.unavailable/);
assert.match(panel, /belowCurrentMinimumSince/);
assert.match(panel, /Published fee schedule/);

console.log('dynamic managed fee dashboard tests passed');
