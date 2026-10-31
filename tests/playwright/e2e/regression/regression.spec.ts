import { test, expect } from '@playwright/test';
import { setupCompleteTestEnvironment, TestFixtureData } from '../../pages/TestFixture';
import { MerchantBackofficePage } from '../../pages/MerchantBackofficePage';
import { CustomerWalletPage } from '../../pages/CustomerWalletPage';

test.describe('@regression AlpaCard Extended Regression Suite', () => {
  let fixture: TestFixtureData;

  test.beforeAll(async ({ request, baseURL }) => {
    fixture = await setupCompleteTestEnvironment(request, baseURL || 'https://dev.alpacard.app');
  });

  test('TC-011: (Create Venue) Complete owner merchant setup in Backoffice', async ({ page }) => {
    const backoffice = new MerchantBackofficePage(page);
    await backoffice.login(fixture.ownerEmail, fixture.ownerPassword);
    const venueName = `Reg Venue ${Date.now()}`;
    await backoffice.createVenueUI(venueName);
  });

  test('TC-012: (Create Campaign) Valid campaign configuration with active status', async ({ page }) => {
    const backoffice = new MerchantBackofficePage(page);
    await backoffice.login(fixture.ownerEmail, fixture.ownerPassword);
    const campaignTitle = `Reg Campaign ${Date.now()}`;
    await backoffice.createCampaignUI(campaignTitle, 10, 'Free Croissant');
  });

  test('TC-008: (Customer Acquisition) Direct anonymous wallet initialization', async ({ page, context }) => {
    await context.clearCookies();
    const wallet = new CustomerWalletPage(page);
    await wallet.openClaimUrl(fixture.campaignId);
    await wallet.verifyOnboardingSuccess();
  });

  test('TC-001: (Add Stamp) Dynamic QR scan validation and stamp increment', async ({ request, baseURL }) => {
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
  });

  test('TC-014: (Input Validations) Reject invalid, zero, and negative stamp inputs in backoffice', async ({ request, baseURL }) => {
    // Zero stamps rejected strictly with HTTP 400
    const invalidZeroRes = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/campaigns`, {
      data: {
        businessId: fixture.businessId,
        name: 'Invalid Campaign Zero',
        stampsRequired: 0,
        reward: 'Invalid Reward',
      },
      headers: { Authorization: `Bearer ${fixture.ownerToken}` },
    });
    expect(invalidZeroRes.status()).toBe(400);

    // Negative stamps rejected strictly with HTTP 400
    const invalidNegativeRes = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/campaigns`, {
      data: {
        businessId: fixture.businessId,
        name: 'Invalid Campaign Negative',
        stampsRequired: -5,
        reward: 'Invalid Reward',
      },
      headers: { Authorization: `Bearer ${fixture.ownerToken}` },
    });
    expect(invalidNegativeRes.status()).toBe(400);
  });

  test('TC-005 & TC-006: (Reward Redemption & Counter Reset) State transition at capacity and automatic reset', async ({ request, baseURL }) => {
    // 1. Create a quick 1-stamp campaign to test reaching capacity immediately
    const shortCampaignRes = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/campaigns`, {
      data: {
        businessId: fixture.businessId,
        name: `Redemption Quick Campaign ${Date.now()}`,
        description: '1 stamp reward test',
        stampsRequired: 1,
        reward: 'Free Cookie',
      },
      headers: { Authorization: `Bearer ${fixture.ownerToken}` },
    });
    expect(shortCampaignRes.status()).toBe(201);
    const shortCampaign = await shortCampaignRes.json();

    // 2. Claim card for customer
    const claimRes = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/cards/claim`, {
      data: { campaignId: shortCampaign.id },
      headers: { Authorization: `Bearer ${fixture.customerToken}` },
    });
    expect(claimRes.status()).toBe(201);
    const shortCard = await claimRes.json();

    // 3. Generate QR token and scan to reach capacity (1/1)
    const qr1Res = await request.get(`${baseURL || 'https://dev.alpacard.app'}/api/v1/cards/${shortCard.id}/qr`, {
      headers: { Authorization: `Bearer ${fixture.customerToken}` },
    });
    expect(qr1Res.status()).toBe(200);
    const qr1 = await qr1Res.json();

    const scan1Res = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/scan`, {
      data: { token: qr1.token },
      headers: { Authorization: `Bearer ${fixture.ownerToken}` },
    });
    expect(scan1Res.status()).toBe(200);
    const scan1Body = await scan1Res.json();
    expect(scan1Body.action).toBe('EARN');
    expect(scan1Body.newCount).toBe(1); // Capacity reached (1/1)

    // 4. Generate new QR token and scan to REDEEM
    const qr2Res = await request.get(`${baseURL || 'https://dev.alpacard.app'}/api/v1/cards/${shortCard.id}/qr`, {
      headers: { Authorization: `Bearer ${fixture.customerToken}` },
    });
    expect(qr2Res.status()).toBe(200);
    const qr2 = await qr2Res.json();

    const redeemRes = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/scan`, {
      data: { token: qr2.token },
      headers: { Authorization: `Bearer ${fixture.ownerToken}` },
    });
    expect(redeemRes.status()).toBe(200);
    const redeemBody = await redeemRes.json();
    expect(redeemBody.action).toBe('REDEEM');
    expect(redeemBody.newCount).toBe(0); // Counter reset automatically to 0
  });

  test('TC-007: (Operational Limits) Block unauthorized customer from performing scans', async ({ request, baseURL }) => {
    // Verify RBAC: CONSUMER role is strictly forbidden from scanning cards
    const rbacResponse = await request.post(`${baseURL || 'https://dev.alpacard.app'}/api/v1/scan`, {
      data: {
        token: fixture.validQRToken,
      },
      headers: {
        Authorization: `Bearer ${fixture.customerToken}`, // Consumer JWT
      },
    });
    expect(rbacResponse.status()).toBe(403);
    const body = await rbacResponse.json();
    expect(body.error).toContain('Only business owners or registered staff can scan customer cards');
  });

  test('TC-010: (Error Handling) Friendly error screen on invalid or inactive campaign URL', async ({ page, context }) => {
    await context.clearCookies();
    const wallet = new CustomerWalletPage(page);
    await wallet.openClaimUrl('fake-invalid-uuid-99999');
    await wallet.verifyInvalidCampaignError();
  });

  test('TC-013: (QR Poster Generation) Correct modal rendering of static counter poster in Backoffice', async ({ page }) => {
    const backoffice = new MerchantBackofficePage(page);
    await backoffice.login(fixture.ownerEmail, fixture.ownerPassword);
    await backoffice.openPosterModal();
  });
});
