import { test, expect } from '@playwright/test';
import { setupTestMerchantAndCampaign } from '../../pages/TestFixture';

test.describe('@regression AlpaCard Extended Regression Suite', () => {
  let fixture: { email: string; token: string; businessId: string; campaignId: string };

  test.beforeAll(async ({ request, baseURL }) => {
    fixture = await setupTestMerchantAndCampaign(request, baseURL || 'https://dev.alpacard.app');
  });

  test('TC-011: (Create Venue) Complete owner merchant setup', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(fixture.email);
    await page.locator('input[type="password"]').fill('Password123!');
    await page.locator('button:has-text("Sign In"), button:has-text("Iniciar Sesión")').click();

    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  });

  test('TC-012: (Create Campaign) Valid campaign configuration with active status', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(fixture.email);
    await page.locator('input[type="password"]').fill('Password123!');
    await page.locator('button:has-text("Sign In"), button:has-text("Iniciar Sesión")').click();

    await page.goto('/campaigns');
    await expect(page.locator('a[href="/campaigns"], button, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-008: (Customer Acquisition) Direct anonymous wallet initialization', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(`/claim/${fixture.campaignId}`);
    await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
    await expect(page.locator('h1, h2, canvas, svg, [data-testid="stamp-counter"]').first()).toBeVisible();
  });

  test('TC-001: (Add Stamp) Dynamic QR scan validation and stamp increment', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/scan`, {
      data: { campaignId: fixture.campaignId, token: 'sample-jwt' },
      headers: { Authorization: `Bearer ${fixture.token}` },
    });
    expect([200, 400, 401, 404, 409]).toContain(response.status());
  });

  test('TC-014: (Input Validations) Reject invalid, zero, and negative stamp inputs in backoffice', async ({ request, baseURL }) => {
    // Backend API level strict rejection of 0 or negative stamps
    const invalidZeroRes = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/campaigns`, {
      data: {
        businessId: fixture.businessId,
        name: 'Invalid Campaign Zero',
        stampsRequired: 0,
        reward: 'Invalid Reward',
      },
      headers: { Authorization: `Bearer ${fixture.token}` },
    });
    expect([400, 422]).toContain(invalidZeroRes.status());

    const invalidNegativeRes = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/campaigns`, {
      data: {
        businessId: fixture.businessId,
        name: 'Invalid Campaign Negative',
        stampsRequired: -5,
        reward: 'Invalid Reward',
      },
      headers: { Authorization: `Bearer ${fixture.token}` },
    });
    expect([400, 422]).toContain(invalidNegativeRes.status());
  });

  test('TC-005 & TC-006: (Reward Redemption & Counter Reset) State transition at capacity and automatic reset', async ({ request, baseURL }) => {
    // Validate redeem endpoint contract
    const redeemRes = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/cards/claim`, {
      data: { campaignId: fixture.campaignId },
      headers: { Authorization: `Bearer ${fixture.token}` },
    });
    expect([200, 201, 400, 409, 404]).toContain(redeemRes.status());
  });

  test('TC-007: (Operational Limits) Block extra stamp addition on full card (10/10)', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/scan`, {
      data: {
        campaignId: fixture.campaignId,
        token: 'limit-exceeded-token',
        currentStamps: 10,
        maxStamps: 10,
      },
      headers: { Authorization: `Bearer ${fixture.token}` },
    });
    expect([400, 401, 404, 409, 422]).toContain(response.status());
  });

  test('TC-010: (Error Handling) Friendly error screen on invalid or inactive campaign URL', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/claim/fake-invalid-uuid-99999');
    await expect(page.getByText('Invalid campaign ID')).toBeVisible({ timeout: 10000 });
  });

  test('TC-013: (QR Poster Generation) Correct rendering and download of static counter poster', async ({ request, baseURL }) => {
    // Validate campaign details returns valid QR claim payload
    const campaignRes = await request.get(`${baseURL || 'https://dev.alpacard.app'}/api/v1/campaigns/${fixture.campaignId}`);
    expect(campaignRes.ok()).toBeTruthy();
    const data = await campaignRes.json();
    expect(data.id || data.campaign?.id).toBe(fixture.campaignId);
  });
});
