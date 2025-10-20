import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to whale tracker', async ({ page }) => {
    await page.goto('/');

    // Click whale tracker link
    await page.getByRole('link', { name: /whale.*tracker/i }).click();

    // Verify navigation
    await expect(page).toHaveURL(/\/whales/);
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');

    // Click dashboard link
    await page.getByRole('link', { name: /dashboard/i }).click();

    // Verify navigation
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display header on all pages', async ({ page }) => {
    const pages = ['/', '/dashboard', '/whales'];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Check for header/logo
      await expect(page.getByRole('banner')).toBeVisible();
    }
  });
});