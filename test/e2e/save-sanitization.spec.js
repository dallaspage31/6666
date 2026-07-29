import { test, expect } from '@playwright/test';
import { SaveSystem } from '../../js/engine/14-save-system.js';

test.describe('Save Sanitization', () => {
  test('should reject malicious save strings', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const malicious = JSON.stringify({
      hero: { level: 999999, baseAttackDamage: '<script>alert(1)</script>' },
      inventory: [{ slot: 'weapon', rarity: 'rare', baseId: 'evil/../../../etc/passwd', uid: 12345, name: '<img src=x onerror=alert(2)>' }],
    });
    const safe = await page.evaluate((raw) => SaveSystem.importSave('TF_SAVE_v6_' + btoa(raw)), malicious);
    expect(safe.hero.level).toBeLessThanOrEqual(9999);
  });

  test('should sanitize frontier policy', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const raw = 'TF_SAVE_v6_' + btoa(JSON.stringify({ frontier: { policy: 'invalid', depth: 'abc' } }));
    const safe = await page.evaluate((code) => SaveSystem.importSave(code), raw);
    expect(safe.frontier.policy).toBe('push');
    expect(safe.frontier.depth).toBe(1);
  });
});
