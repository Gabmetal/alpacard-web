import { Page, Locator, expect } from '@playwright/test';

export class MerchantBackofficePage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInBtn: Locator;
  readonly dashboardHeading: Locator;
  readonly businessesNav: Locator;
  readonly campaignsNav: Locator;
  readonly newBusinessBtn: Locator;
  readonly businessNameInput: Locator;
  readonly submitBusinessBtn: Locator;
  readonly newCampaignBtn: Locator;
  readonly campaignNameInput: Locator;
  readonly stampsRequiredInput: Locator;
  readonly rewardTitleInput: Locator;
  readonly saveCampaignBtn: Locator;
  readonly printPosterBtn: Locator;
  readonly qrPosterModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Iniciar Sesión")');
    this.dashboardHeading = page.locator('h2:has-text("Merchant Control Center"), h2:has-text("Dashboard"), h2:has-text("Panel")');
    this.businessesNav = page.locator('a[href="/businesses"]').first();
    this.campaignsNav = page.locator('a[href="/campaigns"]').first();
    this.newBusinessBtn = page.locator('button:has-text("Add New Business"), button:has-text("New Business"), button:has-text("Nuevo Negocio")');
    this.businessNameInput = page.locator('input[placeholder*="Carpinchill"], input[placeholder*="Name"], input[name="name"], input[placeholder*="Nombre"]');
    this.submitBusinessBtn = page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Guardar"), button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Crear")');
    this.newCampaignBtn = page.locator('button:has-text("New Campaign"), button:has-text("Nueva Campaña")');
    this.campaignNameInput = page.locator('input[placeholder*="Specialty Coffee Club"], input[placeholder*="Campaign Name"], input[name="name"], input[placeholder*="Nombre de la campaña"]');
    this.stampsRequiredInput = page.locator('input[type="number"]');
    this.rewardTitleInput = page.locator('input[placeholder*="Free Artisan Beverage"], input[placeholder*="Free Specialty Coffee"], input[placeholder*="Reward"], input[name="reward"], input[placeholder*="Premio"]');
    this.saveCampaignBtn = page.locator('button[type="submit"]:has-text("Save Campaign"), button[type="submit"]:has-text("Guardar Campaña")');
    this.printPosterBtn = page.locator('button:has-text("Print QR"), button:has-text("Póster")');
    this.qrPosterModal = page.locator('button:has-text("Print Counter Poster"), button:has-text("Imprimir Póster"), svg, canvas');
  }

  async login(email: string, pass: string = 'Password123!') {
    await this.page.goto('/login');
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.signInBtn.click();
    await expect(this.page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
  }

  async createVenueUI(venueName: string) {
    await this.page.goto('/businesses');
    const addBtn = this.page.locator('button:has-text("Add New Business"), button:has-text("New Business"), button:has-text("Nuevo Negocio")').first();
    await addBtn.click();
    await this.businessNameInput.first().fill(venueName);
    await this.submitBusinessBtn.first().click();
    await expect(this.page.locator(`text=${venueName}`).first()).toBeVisible({ timeout: 10000 });
  }

  async createCampaignUI(campaignTitle: string, stamps: number, reward: string) {
    await this.page.goto('/campaigns');
    await this.newCampaignBtn.first().click();
    await this.campaignNameInput.fill(campaignTitle);
    await this.stampsRequiredInput.fill(stamps.toString());
    await this.rewardTitleInput.fill(reward);
    await this.saveCampaignBtn.click();
    await expect(this.page.locator(`text=${campaignTitle}`).first()).toBeVisible({ timeout: 10000 });
  }

  async openPosterModal() {
    await this.page.goto('/campaigns');
    await this.printPosterBtn.first().click();
    await expect(this.qrPosterModal.first()).toBeVisible({ timeout: 10000 });
  }
}
