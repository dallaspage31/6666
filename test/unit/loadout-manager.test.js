import { test } from 'node:test';
import assert from 'node:assert';
import { LoadoutManager } from '../../js/engine/09-loadout.js';

test('loadout-save-and-apply', () => {
  const mgr = new LoadoutManager();
  const state = { equipment: { weapon: 'w1', armor: null }, inventory: [] };
  mgr.save('p1', state.equipment);
  state.equipment.weapon = null;
  mgr.apply('p1', state);
  assert.strictEqual(state.equipment.weapon, 'w1');
});

test('loadout-equip-and-unequip', () => {
  const mgr = new LoadoutManager();
  const state = { equipment: { weapon: null }, inventory: [{ uid: 'u1', slot: 'weapon', name: 'Sword' }] };
  assert.strictEqual(mgr.equip('weapon', 'u1', state).success, true);
  assert.strictEqual(state.equipment.weapon.uid, 'u1');
  assert.strictEqual(mgr.unequip('weapon', state).success, true);
  assert.strictEqual(state.inventory.length, 2);
  assert.strictEqual(state.equipment.weapon, null);
});
