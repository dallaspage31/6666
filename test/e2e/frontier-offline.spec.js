import { test, expect } from '@playwright/test';
import { FrontierDirector } from '../../js/engine/16-frontier-director.js';
import { DeterministicRNG } from '../../js/engine/01-rng.js';

test.describe('Frontier Offline', () => {
  test('should deterministically materialize stages', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const stage = await page.evaluate(() => {
      const rng = new DeterministicRNG(12345);
      const state = GAME.engine.state;
      state.frontier = { seed: 12345, depth: 37, active: true, policy: 'push', committed: false };
      GAME.frontierDirector = new FrontierDirector(state, rng);
      return GAME.frontierDirector.materializeStage(37);
    });
    expect(stage.template).toBe('vanguard_clash');
    expect(stage.bossAspect).toBe('fury');
  });

  test('should retreat on failure and preserve checkpoint', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const result = await page.evaluate(() => {
      const rng = new DeterministicRNG(12345);
      const state = GAME.engine.state;
      state.frontier = { seed: 12345, depth: 37, checkpointDepth: 30, active: true, policy: 'push', committed: false };
      GAME.frontierDirector = new FrontierDirector(state, rng);
      GAME.frontierDirector.writeFrontierResult(false, 37);
      return { depth: state.frontier.depth, heat: state.frontier.heat };
    });
    expect(result.depth).toBe(30);
    expect(result.heat).toBe(0);
  });
});
