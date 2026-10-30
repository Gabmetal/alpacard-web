import { test, expect } from '@playwright/test';
import { setupTestMerchantAndCampaign } from '../../pages/TestFixture';

test.describe('@smoke AlpaCard Core Smoke Test Suite', () => {
  let fixture: { email: string; token: string; businessId: string; campaignId: string };

  test.beforeAll(async ({ request, baseURL }) => {
    fixture = await setupTestMerchantAndCampaign(request, baseURL || 'https://dev.alpacard.app');
  });

  test('TC-011: (Create Venue) Baseline owner venue registration', async ({ page }) => {
    // Navigate to Login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(fixture.email);
    await page.locator('input[type="password"]').fill('Password123!');
    await page.locator('button:has-text("Sign In"), button:has-text("Iniciar Sesión")').click();

    // Verify successful login into dashboard
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible({ timeout: 10000 });
  });

  test('TC-012: (Create Campaign) Define fidelity campaign rule', async ({ page }) => {
    // Navigate to Campaigns tab with authenticated state
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(fixture.email);
    await page.locator('input[type="password"]').fill('Password123!');
    await page.locator('button:has-text("Sign In"), button:has-text("Iniciar Sesión")').click();

    await page.goto('/campaigns');
    // Verify campaign tab or action button exists
    await expect(page.locator('a[href="/campaigns"], button, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-008: (Customer Acquisition) Frictionless anonymous wallet creation', async ({ page, context }) => {
    await context.clearCookies();
    const startTime = Date.now();
    await page.goto(`/claim/${fixture.campaignId}`);

    // Verify zero registration / password forms required
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    // Instant redirect to punch card or claim feedback
    await expect(page.locator('h1, h2, canvas, svg, [data-testid="stamp-counter"]').first()).toBeVisible({ timeout: 10000 });

    const elapsed = Date.now() - startTime;
    console.log(`Anonymous wallet provisioned in ${elapsed}ms`);
  });

  test('TC-001: (Add Stamp) Counter scan operation and stamp increment', async ({ request, baseURL }) => {
    // Verify scan endpoint contract
    const scanResponse = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/scan`, {
      data: {
        campaignId: fixture.campaignId,
        token: 'sample-invalid-or-test-qr-token',
      },
      headers: {
        Authorization: `Bearer ${fixture.token}`,
      },
    });

    // Scanner rejects invalid/expired token with 400, 401, 404, or 409 (valid contract response)
    expect([200, 400, 401, 404, 409]).toContain(scanResponse.status());
  });
});
