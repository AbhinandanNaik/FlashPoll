const { test, expect } = require('@playwright/test');

test.describe('FlashPoll Enterprise Flow', () => {
  test('Homepage has branding and poll creation form', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/FlashPoll/);
    await expect(page.locator('h1').first()).toContainText('Create a FlashPoll');

    // Ensure form inputs exist
    const questionInput = page.locator('input[name="question"]');
    await expect(questionInput).toBeVisible();

    const optionInputs = page.locator('input[name="options"]');
    await expect(optionInputs).toHaveCount(2);
  });

  test('Advanced settings accordion works natively', async ({ page }) => {
    await page.goto('/');

    const advancedHeader = page.locator('h3', { hasText: 'Advanced Settings' });
    await expect(advancedHeader).toBeVisible();

    const allowMultipleCheck = page.locator('input[name="allowMultiple"]');
    await expect(allowMultipleCheck).not.toBeChecked();
    await allowMultipleCheck.check();
    await expect(allowMultipleCheck).toBeChecked();
  });
});
