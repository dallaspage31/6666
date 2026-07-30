import { test } from 'node:test';
import assert from 'node:assert';
import { UPGRADE_TREE, getUpgradeCost, applyUpgradeEffect } from '../../js/data/upgrade-tree.js';

test('upgrade-tree-all-defined', () => {
  const required = ['strength', 'armor', 'vitality', 'precision', 'critical', 'attack_speed', 'gold_find', 'xp_boost', 'life_steal'];
  for (const id of required) {
    assert.ok(UPGRADE_TREE[id], `Missing upgrade: ${id}`);
    assert.ok(UPGRADE_TREE[id].maxRank > 0);
    assert.ok(UPGRADE_TREE[id].costBase > 0);
  }
});

test('upgrade-cost-scaling', () => {
  const cost0 = getUpgradeCost('strength', 0);
  const cost1 = getUpgradeCost('strength', 1);
  assert.ok(cost1 > cost0);
  assert.strictEqual(getUpgradeCost('strength', 50), Infinity);
});

test('upgrade-apply-damage', () => {
  const state = { hero: { baseAttackDamage: 10, baseArmor: 0, maxHp: 100, hp: 100, critChance: 0.05, critDamage: 1.5, baseAttackInterval: 1000, goldFind: 0, xpBonus: 0, lifeSteal: 0 } };
  applyUpgradeEffect(state, 'strength', 1);
  assert.strictEqual(state.hero.baseAttackDamage, 12);
});

test('upgrade-apply-vitality', () => {
  const state = { hero: { baseAttackDamage: 10, baseArmor: 0, maxHp: 100, hp: 50, critChance: 0.05, critDamage: 1.5, baseAttackInterval: 1000, goldFind: 0, xpBonus: 0, lifeSteal: 0 } };
  applyUpgradeEffect(state, 'vitality', 1);
  assert.strictEqual(state.hero.maxHp, 110);
  assert.strictEqual(state.hero.hp, 60);
});

test('upgrade-apply-precision', () => {
  const state = { hero: { baseAttackDamage: 10, baseArmor: 0, maxHp: 100, hp: 100, critChance: 0.05, critDamage: 1.5, baseAttackInterval: 1000, goldFind: 0, xpBonus: 0, lifeSteal: 0 } };
  applyUpgradeEffect(state, 'precision', 1);
  assert.strictEqual(state.hero.critChance, 0.07);
});

test('upgrade-apply-attack-speed', () => {
  const state = { hero: { baseAttackDamage: 10, baseArmor: 0, maxHp: 100, hp: 100, critChance: 0.05, critDamage: 1.5, baseAttackInterval: 1000, goldFind: 0, xpBonus: 0, lifeSteal: 0 } };
  applyUpgradeEffect(state, 'attack_speed', 1);
  assert.strictEqual(state.hero.baseAttackInterval, 950);
});
