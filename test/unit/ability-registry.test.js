import { test } from 'node:test';
import assert from 'node:assert';
import { AbilityRegistry, defaultRegistry } from '../../js/engine/10-ability-registry.js';
import { EffectConsumers } from '../../js/engine/11-ability-effects.js';

test('ability-registry-runtime-apply', () => {
  const registry = new AbilityRegistry();
  registry.registerEffect('damage', EffectConsumers.damage);
  registry.registerAbility('slash', {
    id: 'slash',
    name: 'Slash',
    effects: [{ type: 'damage', amount: 10 }],
  });
  registry.registerRuntimeHandler('damage', EffectConsumers.damage);

  const target = { id: 'enemy_1', hp: 50, maxHp: 50, armor: 0 };
  const results = registry.apply('slash', {}, [target], {});
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].targetId, 'enemy_1');
  assert.strictEqual(target.hp, 40);
});

test('ability-registry-upgrade-compute', () => {
  const registry = new AbilityRegistry();
  registry.registerUpgrade('damage_pct', { field: 'baseAttackDamage' });
  const result = registry.computeUpgrade('damage_pct', 50, 100);
  assert.strictEqual(result, 150);
});

test('default-registry-valid', () => {
  assert.ok(defaultRegistry instanceof AbilityRegistry);
  assert.ok(defaultRegistry.abilities.size >= 0);
  assert.ok(defaultRegistry.effects.size >= 0);
});
