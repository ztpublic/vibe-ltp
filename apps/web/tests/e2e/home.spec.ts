import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page.locator('h1')).toContainText('Vibe LTP');
    
    // Check navigation buttons
    await expect(page.locator('text=Browse Puzzles')).toBeVisible();
    await expect(page.locator('text=Join Room')).toBeVisible();
  });

  test('should navigate to puzzles page', async ({ page }) => {
    await page.goto('/');
    
    // Click Browse Puzzles
    await page.click('text=Browse Puzzles');
    
    // Should navigate to /puzzles
    await expect(page).toHaveURL('/puzzles');
    await expect(page.locator('h1')).toContainText('Browse Puzzles');
  });
});
