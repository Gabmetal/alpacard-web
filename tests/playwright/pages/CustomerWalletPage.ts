import { Page, Locator, expect } from '@playwright/test';

export class CustomerWalletPage {
  readonly page: Page;
  readonly stampCounter: Locator;
  readonly qrContainer: Locator;
  readonly claimRewardBtn: Locator;
  readonly celebrationModal: Locator;
  readonly errorHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.stampCounter = page.locator('[data-testid="stamp-counter"], .stamp-count, div:has-text("stamps"), div:has-text("sellos")');
    this.qrContainer = page.locator('[data-testid="dynamic-qr"], canvas, svg');
    this.claimRewardBtn = page.locator('button:has-text("Claim Reward"), button:has-text("Canjear Premio")');
    this.celebrationModal = page.locator('[data-testid="celebration-modal"], .celebration-modal');
    this.errorHeading = page.locator('h1:has-text("Not Found"), h2:has-text("Error"), text=Campaign not found');
  }

  async claimCampaign(campaignId: string, walletUrl?: string) {
    const target = walletUrl || this.page.context().baseURL || 'https://dev.alpacard.app';
    await this.page.goto(`${target}/claim/${campaignId}`);
  }

  async getStampCountText(): Promise<string> {
    return (await this.stampCounter.textContent()) || '';
  }
}
