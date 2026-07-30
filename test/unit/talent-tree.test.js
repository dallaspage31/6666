import { test } from 'node:test';
import assert from 'node:assert';
import { TalentTree } from '../../js/engine/07-talent-tree.js';

test('talent-tree-define-and-activate', () => {
  const tree = new TalentTree();
  tree.define('fire', { name: 'Fire', cost: 1, effect: { baseAttackDamage: 5 } });
  tree.spend(1);
  assert.ok(tree.canActivate('fire'));
  assert.ok(tree.activate('fire'));
  assert.strictEqual(tree.nodes.get('fire').activated, true);
});

test('talent-tree-prerequisites', () => {
  const tree = new TalentTree();
  tree.define('a', { name: 'A', cost: 1, effect: { baseAttackDamage: 1 } });
  tree.define('b', { name: 'B', cost: 1, requires: ['a'], effect: { baseArmor: 2 } });
  tree.spend(2);
  assert.ok(tree.activate('a'));
  assert.ok(tree.canActivate('b'));
  assert.ok(tree.activate('b'));
});

test('talent-tree-apply-effects', () => {
  const tree = new TalentTree();
  tree.define('str', { name: 'Str', cost: 1, effect: { baseAttackDamage: 3 } });
  tree.spend(1);
  tree.activate('str');
  const state = { hero: { baseAttackDamage: 10 } };
  tree.applyEffects(state);
  assert.strictEqual(state.hero.baseAttackDamage, 13);
});
