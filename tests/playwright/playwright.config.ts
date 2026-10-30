import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for AlpaCard E2E Test Suites.
 * Configured for Staging/Live target (dev.alpacard.app / alpacard.gabo.lat)
 * or local dev environment via BASE_URL / WALLET_URL env variables.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://dev.alpacard.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Camera mocking for QR Scanner tests
    permissions: ['camera'],
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    },
  },
  projects: [
    {
      name: 'Desktop Chrome (Backoffice)',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*(merchant|campaign|poster).spec.ts/,
    },
    {
      name: 'Mobile Chrome (Customer Wallet & Scanner)',
      use: {
        ...devices['Pixel 7'],
        permissions: ['camera'],
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
          ],
        },
      },
    },
  ],
});
