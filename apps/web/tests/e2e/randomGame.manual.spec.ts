import { expect, test } from '@playwright/test';
import seaTurtleSoups from './sea_turtle_soups.json';

type SeaTurtleSoup = {
  soupSurface: string;
  soupBottom: string;
};

const soups = seaTurtleSoups as SeaTurtleSoup[];

const getRandomSoup = (): SeaTurtleSoup => {
  if (!soups.length) {
    throw new Error('sea_turtle_soups.json has no entries');
  }

  return soups[Math.floor(Math.random() * soups.length)]!;
};

test.describe('Random sea turtle soup (manual)', () => {
  const runManual = process.env.RUN_RANDOM_E2E === '1';

  test.skip(!runManual, 'Manual-only scenario. Run via pnpm e2e:random when you want it.');

  test('starts a random game and holds the session open', async ({ page }) => {
    test.setTimeout(0);

    const soup = getRandomSoup();
    test.info().annotations.push({ type: 'soupSurface', description: soup.soupSurface });

    await page.goto('/');

    const startButton = page.getByRole('button', { name: '开始新汤' });
    await expect(startButton).toBeEnabled({ timeout: 10000 });
    await startButton.click();

    await expect(page.getByRole('heading', { name: '输入谜题内容' })).toBeVisible();

    await page.getByPlaceholder('输入谜题的表面描述...').fill(soup.soupSurface);
    await page.getByPlaceholder('输入谜题的真相答案...').fill(soup.soupBottom);

    const confirmButton = page.getByRole('button', { name: '确定' });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    await expect(page.getByText(soup.soupSurface)).toBeVisible();
    await expect(startButton).toBeDisabled();

    // Keep the Playwright page alive until the user stops the run.
    await page.waitForTimeout(24 * 60 * 60 * 1000);
  });
});
