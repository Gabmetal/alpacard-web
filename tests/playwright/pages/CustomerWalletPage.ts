import { Page, Locator, expect } from '@playwright/test';

export class CustomerWalletPage {
  readonly page: Page;
  readonly stampCounter: Locator;
  readonly qrContainer: Locator;
  readonly claimRewardBtn: Locator;
  readonly celebrationModal: Locator;
  readonly invalidErrorText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.stampCounter = page.locator('[data-testid="stamp-counter"], .stamp-count, text=stamps, text=sellos');
    this.qrContainer = page.locator('[data-testid="dynamic-qr"], svg, canvas');
    this.claimRewardBtn = page.locator('button:has-text("Claim Reward"), button:has-text("Canjear Premio")');
    this.celebrationModal = page.locator('[data-testid="celebration-modal"], .celebration-modal');
    this.invalidErrorText = page.getByText('Invalid campaign ID');
  }

  async openClaimUrl(campaignId: string) {
    await this.page.goto(`/claim/${campaignId}`);
  }

  async verifyOnboardingSuccess() {
    await expect(this.page.locator('input[type="password"]')).toHaveCount(0);
    await expect(this.qrContainer.first()).toBeVisible({ timeout: 15000 });
  }

  async verifyInvalidCampaignError() {
    await expect(this.invalidErrorText.first()).toBeVisible({ timeout: 10000 });
  }
}
