import { test, expect } from '@playwright/test';

test.describe('Forge Token', () => {
  test('should mint tokens and carry remainder', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const result = await page.evaluate(() => {
      GAME.engine.state.hero.gold = 25500;
      const r = GAME.forgeTokens.mint(25500);
      return r;
    });
    expect(result.tokens).toBe(2);
    expect(result.remainder).toBe(5500);
  });

  test('should carry remainder across ascension', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const result = await page.evaluate(() => {
      GAME.engine.state.forgeEconomy.mintRemainder = 1000;
      GAME.engine.state.hero.gold = 9500;
      return GAME.forgeTokens.settleAscension();
    });
    expect(result.tokens).toBe(1);
    expect(result.remainder).toBe(500);
  });
});
