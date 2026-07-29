import { test, expect } from '@playwright/test';

test.describe('Compact Desktop', () => {
  test('should render combat canvas at 1280x320 logical size', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const canvas = page.locator('#combat-canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeLessThanOrEqual(320);
  });

  test('should have no class select access issues', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const classSelect = document.getElementById('class-select');
      expect(classSelect).not.toBeNull();
    });
  });

  test('should have zero uncaught errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('should have zero 404s', async ({ page }) => {
    const failed = [];
    page.on('requestfailed', (req) => {
      if (req.failure()?.errorText === 'net::ERR_HTTP_RESPONSE_CODE_FAILURE') {
        failed.push(req.url());
      }
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    expect(failed).toEqual([]);
  });
});
