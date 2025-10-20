import { test, expect } from '@playwright/test';

test.describe('Whale Tracker', () => {
  test('should display whale tracker page', async ({ page }) => {
    await page.goto('/whales');

    // Check page title
    await expect(page).toHaveTitle(/ChainWhale/);

    // Check for main heading
    await expect(page.getByRole('heading', { name: /whale tracker/i })).toBeVisible();
  });

  test('should display filter options', async ({ page }) => {
    await page.goto('/whales');

    // Check for chain filters
    await expect(page.getByText('Ethereum')).toBeVisible();
    await expect(page.getByText('Base')).toBeVisible();
    await expect(page.getByText('Arbitrum')).toBeVisible();

    // Check for time range filters
    await expect(page.getByText('1h')).toBeVisible();
    await expect(page.getByText('24h')).toBeVisible();
  });

  test('should filter by chain', async ({ page }) => {
    await page.goto('/whales');

    // Wait for initial load
    await page.waitForTimeout(2000);

    // Click Ethereum filter
    await page.getByRole('button', { name: /ethereum/i }).click();

    // Wait for data to update
    await page.waitForTimeout(1000);

    // Verify Ethereum badge appears in results
    const ethereumBadges = page.locator('[data-testid="chain-badge"]', { hasText: 'Ethereum' });
    await expect(ethereumBadges.first()).toBeVisible();
  });

  test('should display transfer cards', async ({ page }) => {
    await page.goto('/whales');

    // Wait for transfers to load
    await page.waitForSelector('[data-testid="whale-transfer"]', { timeout: 10000 });

    // Check that at least one transfer is displayed
    const transfers = page.locator('[data-testid="whale-transfer"]');
    await expect(transfers.first()).toBeVisible();
  });

  test('should display stats dashboard', async ({ page }) => {
    await page.goto('/whales');

    // Wait for stats to load
    await page.waitForTimeout(2000);

    // Check for stats elements
    await expect(page.getByText(/total transfers/i)).toBeVisible();
    await expect(page.getByText(/total volume/i)).toBeVisible();
  });

  test('should change time range filter', async ({ page }) => {
    await page.goto('/whales');

    // Click 24h filter
    await page.getByRole('button', { name: '24h' }).click();

    // Wait for data to update
    await page.waitForTimeout(1000);

    // Verify page didn't crash
    await expect(page.getByRole('heading', { name: /whale tracker/i })).toBeVisible();
  });
});