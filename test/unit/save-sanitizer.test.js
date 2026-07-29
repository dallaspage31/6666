import { test } from 'node:test';
import assert from 'node:assert';

import { SaveSanitizer } from '../../js/engine/06-save-sanitizer.js';

test('save-sanitizer-bounds', () => {
  const raw = JSON.stringify({
    hero: { level: 999999, hp: 5e18, maxHp: -1, baseAttackDamage: 'NaN' },
    inventory: [{ slot: 'weapon', rarity: 'rare', baseId: 'ok', uid: 'bad<script>', name: '<img onerror=x>', affixes: ['slash', 'poison', '<bad>'] }],
  });
  const { data, dirty } = SaveSanitizer.sanitize(raw);
  assert.ok(dirty, 'Expected dirty save');
  assert.strictEqual(data.hero.level, 9999);
  assert.strictEqual(data.hero.maxHp, 1);
  assert.strictEqual(data.inventory[0].uid, 'sanitized_0');
  assert.strictEqual(data.inventory[0].affixes.length, 2);
  assert.ok(data.inventory[0].name.includes('Sanitized'));
});

test('save-sanitizer-frontier', () => {
  const raw = JSON.stringify({ frontier: { policy: 'invalid', depth: 'abc' } });
  const { data } = SaveSanitizer.sanitize(raw);
  assert.strictEqual(data.frontier.policy, 'push');
  assert.strictEqual(data.frontier.depth, 1);
});
