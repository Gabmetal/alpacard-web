# AlpaCard Automated E2E Test Suite (Playwright)

Automated test suites for AlpaCard validating critical loyalty lifecycles, anti-fraud rules, and merchant workflows against staging (`https://dev.alpacard.app`) and local environments.

## Architecture & Layout

```
tests/playwright/
├── e2e/
│   ├── smoke/
│   │   └── smoke.spec.ts         # @smoke: TC-011, TC-012, TC-008, TC-001
│   └── regression/
│       └── regression.spec.ts    # @regression: All 10 cases including edge cases
├── pages/
│   ├── MerchantBackofficePage.ts # Page Object Model for Backoffice
│   ├── CustomerWalletPage.ts     # Page Object Model for Customer PWA
│   └── TestFixture.ts            # Dynamic account/venue/card provisioning
├── package.json
└── playwright.config.ts          # Desktop & Mobile Chrome configurations
```

## Setup & Execution

### 1. Install Dependencies
Inside the test directory:
```bash
cd tests/playwright
npm install
npx playwright install chromium
```

### 2. Configure Target Environment
Default target is `https://dev.alpacard.app`. You can override with environment variables:
```bash
# Windows PowerShell
$env:BASE_URL="https://dev.alpacard.app"

# Linux / Mac / CI
export BASE_URL="https://dev.alpacard.app"
```

### 3. Run Test Suites

- **Run Smoke Suite (`@smoke`)**:
  ```bash
  npm run test:smoke
  ```

- **Run Regression Suite (`@regression`)**:
  ```bash
  npm run test:regression
  ```

- **View Test Execution Report**:
  ```bash
  npx playwright show-report
  ```
