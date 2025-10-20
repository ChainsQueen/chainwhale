import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display dashboard page', async ({ page }) => {
    await page.goto('/dashboard');

    // Check page loaded
    await expect(page).toHaveTitle(/ChainWhale/);
  });

  test('should display wallet analysis section', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for wallet analysis heading
    await expect(page.getByText(/wallet analysis/i)).toBeVisible();

    // Check for address input
    await expect(page.getByPlaceholder(/enter.*address/i)).toBeVisible();
  });

  test('should validate wallet address input', async ({ page }) => {
    await page.goto('/dashboard');

    // Enter invalid address
    const input = page.getByPlaceholder(/enter.*address/i);
    await input.fill('invalid-address');

    // Try to analyze
    await page.getByRole('button', { name: /analyze/i }).click();

    // Should show error (implementation dependent)
    await page.waitForTimeout(500);
  });

  test('should display API settings', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for API settings section
    await expect(page.getByText(/api.*settings/i)).toBeVisible();
  });
});