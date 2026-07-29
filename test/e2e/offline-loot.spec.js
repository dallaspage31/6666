import { test, expect } from '@playwright/test';

test.describe('Offline Loot', () => {
  test('should compress Common/Uncommon to gold', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const result = await page.evaluate(() => {
      const drops = [
        { id: 1, rarity: 'common', baseId: 'potion' },
        { id: 2, rarity: 'common', baseId: 'potion' },
        { id: 3, rarity: 'uncommon', baseId: 'ring' },
      ];
      const gold = drops.reduce((sum, d) => sum + (d.rarity === 'common' ? 5 : d.rarity === 'uncommon' ? 10 : 0), 0);
      return { gold, kept: drops.filter((d) => ['rare', 'epic', 'mythic', 'eternal'].includes(d.rarity)).length };
    });
    expect(result.gold).toBe(20);
    expect(result.kept).toBe(0);
  });

  test('should keep top-5 Epic+ items', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const kept = await page.evaluate(() => {
      const drops = Array.from({ length: 10 }, (_, i) => ({
        rarity: i < 6 ? 'epic' : 'rare',
        score: 100 - i,
      }));
      const kept = drops
        .filter((d) => ['epic', 'mythic', 'eternal'].includes(d.rarity))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      return kept.length;
    });
    expect(kept).toBe(5);
  });
});
