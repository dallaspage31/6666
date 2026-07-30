import { test } from 'node:test';
import assert from 'node:assert';
import { Engine } from '../../js/engine/03-engine.js';

test('engine-purchase-upgrade-success', () => {
  const engine = new Engine();
  engine.state.hero.gold = 100;
  engine.state.hero.baseAttackDamage = 10;

  const result = engine.purchaseUpgrade('strength');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.newRank, 1);
  assert.strictEqual(engine.state.hero.baseAttackDamage, 12);
  assert.ok(engine.state.hero.gold < 100);
});

test('engine-purchase-upgrade-insufficient-gold', () => {
  const engine = new Engine();
  engine.state.hero.gold = 1;

  const result = engine.purchaseUpgrade('strength');
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.reason, 'INSUFFICIENT_GOLD');
});

test('engine-purchase-upgrade-max-rank', () => {
  const engine = new Engine();
  engine.state.hero.gold = 1000000;
  engine.state.hero.upgrades = { strength: 50 };

  const result = engine.purchaseUpgrade('strength');
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.reason, 'MAX_RANK');
});
