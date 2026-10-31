import { test, expect } from '@playwright/test';
import { setupCompleteTestEnvironment, TestFixtureData } from '../../pages/TestFixture';
import { MerchantBackofficePage } from '../../pages/MerchantBackofficePage';
import { CustomerWalletPage } from '../../pages/CustomerWalletPage';

test.describe('@smoke AlpaCard Core Smoke Test Suite', () => {
  let fixture: TestFixtureData;

  test.beforeAll(async ({ request, baseURL }) => {
    fixture = await setupCompleteTestEnvironment(request, baseURL || 'https://dev.alpacard.app');
  });

  test('TC-011: (Create Venue) Baseline owner venue registration in Backoffice', async ({ page }) => {
    const backoffice = new MerchantBackofficePage(page);
    await backoffice.login(fixture.ownerEmail, fixture.ownerPassword);

    const newVenueName = `Smoke New Cafe ${Date.now()}`;
    await backoffice.createVenueUI(newVenueName);
  });

  test('TC-012: (Create Campaign) Define fidelity campaign rule in Backoffice', async ({ page }) => {
    const backoffice = new MerchantBackofficePage(page);
    await backoffice.login(fixture.ownerEmail, fixture.ownerPassword);

    const newCampaignTitle = `Smoke Latte Promo ${Date.now()}`;
    await backoffice.createCampaignUI(newCampaignTitle, 10, 'Free Morning Latte');
  });

  test('TC-008: (Customer Acquisition) Frictionless anonymous wallet creation', async ({ page, context }) => {
    await context.clearCookies();
    const wallet = new CustomerWalletPage(page);
    const startTime = Date.now();

    await wallet.openClaimUrl(fixture.campaignId);
    await wallet.verifyOnboardingSuccess();

    const elapsed = Date.now() - startTime;
    console.log(`Anonymous wallet provisioned in ${elapsed}ms`);
  });

  test('TC-001: (Add Stamp) Dynamic QR scan validation and stamp increment', async ({ request, baseURL }) => {
    // Perform real cashier scan with valid signed JWT from customer card
    const scanResponse = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/scan`, {
      data: {
        token: fixture.validQRToken,
      },
      headers: {
        Authorization: `Bearer ${fixture.ownerToken}`,
      },
    });

    expect(scanResponse.status()).toBe(200);
    const body = await scanResponse.json();
    expect(body.success).toBe(true);
    expect(body.action).toBe('EARN');
    expect(body.newCount).toBe(1);

    // Verify Anti-Replay: scanning the same token a second time strictly returns 409 Conflict
    const replayResponse = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/scan`, {
      data: {
        token: fixture.validQRToken,
      },
      headers: {
        Authorization: `Bearer ${fixture.ownerToken}`,
      },
    });
    expect(replayResponse.status()).toBe(409);
  });
});
