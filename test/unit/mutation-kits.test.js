import { test } from 'node:test';
import assert from 'node:assert';
import { VISUAL_MUTATION_KITS, getMutationKit, applyMutationTint } from '../../js/data/mutation-kits.js';

test('mutation-kits-all-defined', () => {
  const required = ['frost', 'void', 'celestial', 'poison', 'frenzied', 'treasure', 'armor', 'shield'];
  for (const id of required) {
    assert.ok(VISUAL_MUTATION_KITS[id], `Missing mutation kit: ${id}`);
    assert.ok(VISUAL_MUTATION_KITS[id].palette.primary);
    assert.ok(VISUAL_MUTATION_KITS[id].palette.secondary);
    assert.ok(VISUAL_MUTATION_KITS[id].palette.ambient);
  }
});

test('mutation-kits-get-by-id', () => {
  assert.ok(getMutationKit('frost'));
  assert.ok(!getMutationKit('nonexistent'));
});

test('mutation-kits-apply-tint', () => {
  const ctx = {
    save: () => {},
    globalCompositeOperation: '',
    fillStyle: '',
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    restore: () => {},
  };
  assert.doesNotThrow(() => applyMutationTint(ctx, VISUAL_MUTATION_KITS.frost.palette, 100, 100, 20));
});
