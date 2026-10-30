import { Page, Locator, expect } from '@playwright/test';

export class MerchantBackofficePage {
  readonly page: Page;
  readonly businessNameInput: Locator;
  readonly saveVenueBtn: Locator;
  readonly newCampaignBtn: Locator;
  readonly campaignNameInput: Locator;
  readonly stampsRequiredInput: Locator;
  readonly rewardTitleInput: Locator;
  readonly saveCampaignBtn: Locator;
  readonly printPosterBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.businessNameInput = page.locator('input[placeholder*="Name"], input[name="name"], input[placeholder*="Nombre"], input[id="biz-name"]');
    this.saveVenueBtn = page.locator('button:has-text("Save"), button:has-text("Guardar"), button:has-text("Create"), button:has-text("Crear")');
    this.newCampaignBtn = page.locator('button:has-text("New Campaign"), button:has-text("Nueva Campaña"), button:has-text("Crear Campaña")');
    this.campaignNameInput = page.locator('input[name="title"], input[id="campaign-name"], input[placeholder*="Campaign"]');
    this.stampsRequiredInput = page.locator('input[name="totalStamps"], input[type="number"]');
    this.rewardTitleInput = page.locator('input[name="rewardDescription"], input[name="rewardTitle"], input[placeholder*="Reward"]');
    this.saveCampaignBtn = page.locator('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save"), button:has-text("Guardar")');
    this.printPosterBtn = page.locator('button:has-text("Print QR"), button:has-text("Póster"), button:has-text("Poster")');
  }

  async ensureLoggedIn() {
    // If redirected to login, perform owner login or signup
    if (this.page.url().includes('/login')) {
      const emailInput = this.page.locator('input[type="email"]');
      const passwordInput = this.page.locator('input[type="password"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill('owner@alpacard.app');
        await passwordInput.fill('password123');
        await this.page.locator('button[type="submit"]').click();
        await this.page.waitForLoadState('networkidle');
      }
    }
  }

  async gotoDashboard() {
    await this.page.goto('/dashboard');
    await this.ensureLoggedIn();
  }

  async createOrUpdateVenue(name: string) {
    await this.businessNameInput.fill(name);
    await this.saveVenueBtn.click();
  }

  async createCampaign(title: string, stamps: number, reward: string) {
    await this.newCampaignBtn.click();
    await this.campaignNameInput.fill(title);
    await this.stampsRequiredInput.fill(stamps.toString());
    await this.rewardTitleInput.fill(reward);
    await this.saveCampaignBtn.click();
  }
}
