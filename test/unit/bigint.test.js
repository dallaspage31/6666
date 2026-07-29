import { test } from 'node:test';
import assert from 'node:assert';
import { BigIntDecimal, formatBigInt } from '../../js/engine/00-bigint.js';

test('bigint-decimal-basic', () => {
  const a = new BigIntDecimal(1000);
  const b = new BigIntDecimal(2000);
  assert.strictEqual(a.add(b).toString(), '3000');
  assert.strictEqual(b.sub(a).toString(), '1000');
  assert.strictEqual(a.mul(2).toString(), '2000');
  assert.strictEqual(b.div(2).toString(), '1000');
});

test('bigint-decimal-big-numbers', () => {
  const a = new BigIntDecimal('99999999999999999999');
  const b = new BigIntDecimal('1');
  assert.strictEqual(a.add(b).toString(), '100000000000000000000');
});

test('bigint-decimal-format', () => {
  assert.strictEqual(formatBigInt(500), '500');
  assert.strictEqual(formatBigInt(2000), '2K');
  assert.strictEqual(formatBigInt(3_000_000), '3M');
  assert.strictEqual(formatBigInt(5_000_000_000), '5B');
});

test('bigint-decimal-serialize', () => {
  const a = new BigIntDecimal('12345678901234567890');
  const json = JSON.stringify({ val: a });
  const parsed = JSON.parse(json);
  assert.strictEqual(parsed.val, '12345678901234567890');
});
