import { test } from 'node:test';
import assert from 'node:assert';
import { FrontierDirector } from '../../js/engine/16-frontier-director.js';
import { DeterministicRNG } from '../../js/engine/01-rng.js';

test('frontier-director-deterministic-materialization', () => {
  const rng = new DeterministicRNG(12345);
  const state = {
    frontier: { seed: 12345, depth: 37, active: true, policy: 'push', committed: false },
    hero: { classId: 'guardian' },
  };
  const director = new FrontierDirector(state, rng);
  const stage = director.materializeStage(37);
  assert.ok(stage);
  assert.ok(['vanguard_clash','swarm_rush','shield_wall','ranged_nest','elite_escort','healer_core','twin_threat','attrition_field','checkpoint_guardian'].includes(stage.template));
  assert.ok(['fury','fortress','legion','void','fortune'].includes(stage.bossAspect));
  assert.strictEqual(stage.depth, 37);
  assert.ok(Array.isArray(stage.waves));
  assert.ok(stage.waves.length >= 3);
});

test('frontier-director-same-seed-same-result', () => {
  const rng1 = new DeterministicRNG(999);
  const state1 = { frontier: { seed: 999, depth: 10, active: true, policy: 'push', committed: false }, hero: {} };
  const d1 = new FrontierDirector(state1, rng1);
  const s1 = d1.materializeStage(10);

  const rng2 = new DeterministicRNG(999);
  const state2 = { frontier: { seed: 999, depth: 10, active: true, policy: 'push', committed: false }, hero: {} };
  const d2 = new FrontierDirector(state2, rng2);
  const s2 = d2.materializeStage(10);

  assert.strictEqual(s1.template, s2.template);
  assert.strictEqual(s1.modifier, s2.modifier);
  assert.strictEqual(s1.bossAspect, s2.bossAspect);
  assert.strictEqual(s1.biome, s2.biome);
});

test('frontier-director-push-farm-safePush-greedy', () => {
  const base = { seed: 1, depth: 1, checkpointDepth: 1, active: true, policy: 'push', heat: 0, committed: false };
  const makeState = (policy) => ({ frontier: { ...base, policy }, hero: {} });

  const pushState = makeState('push');
  new FrontierDirector(pushState, new DeterministicRNG(1)).completeWave();
  assert.strictEqual(pushState.frontier.depth, 2);

  const farmState = makeState('farm');
  new FrontierDirector(farmState, new DeterministicRNG(1)).completeWave();
  assert.strictEqual(farmState.frontier.depth, 1);
  assert.strictEqual(farmState.frontier.farmDepth, 1);

  const safePushState = makeState('safePush');
  new FrontierDirector(safePushState, new DeterministicRNG(1)).completeWave();
  assert.strictEqual(safePushState.frontier.depth, 2);

  const greedyState = makeState('greedy');
  new FrontierDirector(greedyState, new DeterministicRNG(1)).completeWave();
  assert.strictEqual(greedyState.frontier.depth, 2);
  assert.strictEqual(greedyState.frontier.heat, 1);
});

test('frontier-director-failure-retreats-to-checkpoint', () => {
  const state = {
    frontier: { seed: 1, depth: 37, checkpointDepth: 30, active: true, policy: 'push', heat: 5, committed: false },
    hero: {},
  };
  const director = new FrontierDirector(state, new DeterministicRNG(1));
  director.writeFrontierResult(false, 37);
  assert.strictEqual(state.frontier.depth, 30);
  assert.strictEqual(state.frontier.heat, 0);
});
