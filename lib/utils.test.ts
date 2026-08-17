import assert from 'node:assert/strict';
import { test } from 'node:test';
// @ts-ignore Node's native TypeScript loader requires the explicit extension.
import { formatHashCount, formatHashrate } from './utils.ts';

test('formatHashrate formats canonical H/s values', () => {
  assert.equal(formatHashrate(0), '0.00 H/s');
  assert.equal(formatHashrate(1.58), '1.58 H/s');
  assert.equal(formatHashrate(999), '999.00 H/s');
  assert.equal(formatHashrate(1000), '1.00 kH/s');
  assert.equal(formatHashrate(1_000_000), '1.00 MH/s');
  assert.equal(formatHashrate(1_000_000_000), '1.00 GH/s');
});

test('formatHashCount does not label cumulative hashes as a rate', () => {
  assert.equal(formatHashCount(0), '0.00 H');
  assert.equal(formatHashCount(23_452_020), '23.45 MH');
  assert.equal(formatHashCount(1_000_000_000), '1.00 GH');
});
