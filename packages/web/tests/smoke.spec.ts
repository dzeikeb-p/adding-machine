import { expect, test } from '@playwright/test';

test.describe('Machine smoke test', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API so the test runs without a live Worker
    await page.route('**/v1/cutup', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'aaaabbbb-cccc-dddd-eeee-ffff00001111',
          text: 'fox the quick over lazy brown jumps dog the',
          method: 'shuffle',
          seed: 'deadbeef01234567',
          inputHash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          stats: { inputChars: 43, outputChars: 43, units: 9, durationMs: 2 },
        }),
      });
    });
  });

  test('loads the machine page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Gysin/);
    await expect(page.getByTestId('input')).toBeVisible();
    await expect(page.getByTestId('cut-button')).toBeVisible();
  });

  test('run a shuffle and assert output is non-empty', async ({ page }) => {
    await page.goto('/');

    // Select shuffle method (it's the default, but click to be explicit)
    await page.getByTestId('method-shuffle').click();

    // Type input
    await page.getByTestId('input').fill('the quick brown fox jumps over the lazy dog');

    // Click the lever
    await page.getByTestId('cut-button').click();

    // Output should appear and be non-empty
    const output = page.getByTestId('output');
    await expect(output).toBeVisible();
    await expect(output).not.toBeEmpty();
    await expect(output).toContainText('fox');
  });

  test('keyboard shortcut Ctrl+Enter runs the machine', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input').fill('cut up these words right now');
    await page.keyboard.press('Control+Enter');
    await expect(page.getByTestId('output')).toBeVisible();
  });

  test('navigates to About page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
    await expect(page).toHaveURL(/\/about/);
  });
});
