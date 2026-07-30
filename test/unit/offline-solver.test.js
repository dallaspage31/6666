import { test } from 'node:test';
import assert from 'node:assert';
import { OfflineSolver } from '../../js/engine/07-offline-solver.js';
import { GameState } from '../../js/engine/02-state.js';
import { getCampaignStage } from '../../js/data/campaign.js';
import { FrontierDirector } from '../../js/engine/16-frontier-director.js';

test('offline-solver-basic', () => {
  const state = new GameState();
  state.hero.baseAttackDamage = 20;
  state.hero.critChance = 0.1;
  state.hero.critDamage = 2;
  state.progression.currentStageNumber = 10;
  state.getStageData = () => getCampaignStage(10);

  const solver = new OfflineSolver(state);
  const result = solver.solve(3600);
  assert.ok(result);
  assert.ok(result.depthAdvanced >= 0);
  assert.ok(result.totalGold >= 0);
  assert.ok(result.itemsFound >= 0);
});

test('offline-solver-capped-at-8-hours', () => {
  const state = new GameState();
  state.hero.baseAttackDamage = 10;
  state.getStageData = () => getCampaignStage(1);

  const solver = new OfflineSolver(state);
  const result = solver.solve(24 * 3600);
  assert.strictEqual(result.offlineSeconds, 8 * 3600);
});

test('offline-solver-returns-null-for-zero', () => {
  const state = new GameState();
  const solver = new OfflineSolver(state);
  assert.strictEqual(solver.solve(0), null);
  assert.strictEqual(solver.solve(-10), null);
});
