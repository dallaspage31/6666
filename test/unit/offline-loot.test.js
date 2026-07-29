import { test } from 'node:test';
import assert from 'node:assert';
import { Engine } from '../../js/engine/03-engine.js';

test('offline-loot-compression', () => {
  const engine = new Engine();
  const drops = [
    { id: 1, rarity: 'common', score: 0 },
    { id: 2, rarity: 'common', score: 0 },
    { id: 3, rarity: 'uncommon', score: 0 },
    { id: 4, rarity: 'rare', score: 50 },
    { id: 5, rarity: 'rare', score: 40 },
    { id: 6, rarity: 'epic', score: 100 },
    { id: 7, rarity: 'epic', score: 90 },
    { id: 8, rarity: 'mythic', score: 200 },
  ];

  const summary = engine.compressOfflineLoot(drops, { rareKeep: 'SALVAGE' });
  assert.strictEqual(summary.total, 8);
  assert.strictEqual(summary.kept.length, 3);
  assert.strictEqual(summary.gold, 40);
  assert.strictEqual(summary.salvaged, 5);
});

test('offline-loot-keep-rare', () => {
  const engine = new Engine();
  const drops = [
    { id: 1, rarity: 'rare', score: 50 },
    { id: 2, rarity: 'rare', score: 40 },
  ];
  const summary = engine.compressOfflineLoot(drops, { rareKeep: 'KEEP' });
  assert.strictEqual(summary.kept.length, 2);
  assert.strictEqual(summary.gold, 0);
});
