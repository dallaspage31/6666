import { test } from 'node:test';
import assert from 'node:assert';
import { DamageSystem } from '../../js/engine/12-damage.js';
import { ProgressionSystem } from '../../js/engine/13-progression.js';

test('damage-system-mitigation', () => {
  const attacker = { baseAttackDamage: 20, critChance: 0, critDamage: 1.5, lifeSteal: 0 };
  const defender = { hp: 100, maxHp: 100, armor: 5 };
  const result = DamageSystem.apply(attacker, defender);
  assert.strictEqual(result.damage, 15);
  assert.strictEqual(defender.hp, 85);
  assert.strictEqual(result.isCrit, false);
});

test('damage-system-crit', () => {
  const attacker = { baseAttackDamage: 10, critChance: 1, critDamage: 2, lifeSteal: 0 };
  const defender = { hp: 100, maxHp: 100, armor: 0 };
  const result = DamageSystem.apply(attacker, defender);
  assert.strictEqual(result.damage, 20);
  assert.strictEqual(result.isCrit, true);
  assert.strictEqual(defender.hp, 80);
});

test('damage-system-life-steal', () => {
  const attacker = { baseAttackDamage: 10, critChance: 0, critDamage: 1.5, lifeSteal: 0.2, hp: 50, maxHp: 100 };
  const defender = { hp: 100, maxHp: 100, armor: 0 };
  const result = DamageSystem.apply(attacker, defender);
  assert.strictEqual(attacker.hp, 52);
});

test('progression-system-level-up', () => {
  const state = { hero: { level: 1, xp: 0, hp: 100, maxHp: 100, baseAttackDamage: 10, baseArmor: 0 } };
  ProgressionSystem.awardXP(state, 100);
  assert.strictEqual(state.hero.level, 2);
  assert.strictEqual(state.hero.maxHp, 110);
  assert.strictEqual(state.hero.baseAttackDamage, 12);
  assert.strictEqual(state.hero.xp, 0);
});

test('progression-system-ascension-reset', () => {
  const state = {
    hero: { level: 10, xp: 500, hp: 200, maxHp: 200, baseAttackDamage: 50, baseArmor: 20, gold: 1000 },
    progression: { currentStageNumber: 50, currentWaveNumber: 3, highestUnlockedStage: 50 },
    inventory: [{ id: 1 }],
    equipment: { weapon: 'sword' },
  };
  ProgressionSystem.ascensionReset(state);
  assert.strictEqual(state.hero.level, 1);
  assert.strictEqual(state.hero.gold, 100);
  assert.strictEqual(state.progression.currentStageNumber, 1);
  assert.strictEqual(state.inventory.length, 0);
  assert.strictEqual(state.equipment.weapon, null);
});
