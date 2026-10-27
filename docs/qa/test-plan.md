# QA Master Test Plan: AlpaCard Web Platform

## 1. Project Objective

The primary objective is to guarantee functional quality, reliability, and security across the **AlpaCard** web platform ([alpacard.gabo.lat](https://alpacard.gabo.lat)). The main goal is to ensure that the core customer loyalty lifecycle—stamp accumulation, reward redemption, and counter reset—operates without logical errors or role-based security vulnerabilities.

---

## 2. Scope

### In-Scope
- **Authentication & User Management:** User login and registration across roles (`OWNER` / Merchant, `STAFF` / Barista, and `CONSUMER` / Client).
- **Loyalty Lifecycle (Core):** Logic for incrementing stamps on virtual cards, progress visualization, unlocking reward redemption upon reaching the campaign threshold, and resetting the counter back to zero after consumption.
- **Roles & Permissions (RBAC):** Validating strict role enforcement, specifically ensuring that a user with the `CONSUMER` role cannot alter or forge their own stamp balance, and ensuring `STAFF` can only operate campaigns belonging to their merchant.

### Out-of-Scope
- Server stress and high-volume performance testing.
- Payment gateway integration testing (excluded from current release flows).

---

## 3. Test Strategy & Approach

The project testing approach is organized across three complementary execution layers to ensure comprehensive test coverage:

1. **Manual Functional Testing:**  
   Validation of critical end-to-end business flows using production-like scenarios. This includes simulating recurring customers accumulating stamps to redeem for venue rewards (such as a coffee, cheese scone, or scallion scone) until completing the card, verifying that the user interface updates and reflects state transitions in real time.
2. **Database Integrity Verification:**  
   Direct relational data verification against **PostgreSQL 16** using database management clients (such as pgAdmin, DBeaver, or TablePlus). Relational integrity checks and `JOIN` queries will verify that transaction records, stamp increments, and entity relationships persist accurately without duplicates or inconsistent states.
3. **Automated Regression Suite (Phase 2):**  
   Development of automated regression scripts utilizing **Selenium WebDriver with Java**. Test setup will implement custom `ChromeOptions` to:
   - Emulate mobile viewports and touch devices natively.
   - Mock camera permissions and web media streams (`--use-fake-ui-for-media-stream`).
   - Validate Service Worker caching mechanisms and offline PWA behavior.
   - Integrate automated test execution directly into GitHub Actions continuous integration pipelines (`ci-main.yml` / `ci-integration.yml`).

---

## 4. Environment & Tooling

| Category | Tool / Technology | Purpose |
| :--- | :--- | :--- |
| **Test Case & Bug Management** | Jira integrated with Xray | Test repository management, traceability, execution recording, and defect tracking. |
| **Database Management & Verification** | pgAdmin / DBeaver / TablePlus (PostgreSQL 16) | Direct relational integrity validation, query debugging, and data state verification. |
| **Development & Test Automation** | IntelliJ IDEA, Java, Selenium WebDriver | Automated regression script development and native mobile browser emulation. |
| **Edge Case Generation & QA Assistance** | Cursor, Claude, Antigravity | Rapid authoring of complex test matrices, edge-case analysis, and automation debugging. |
| **Continuous Integration** | GitHub Actions (`ci-main.yml` / `ci-integration.yml`) | Automated build validation and regression test pipeline execution. |

---

## 5. Acceptance & Suspension Criteria

### Suspension Criteria
Testing execution will be suspended if a blocker defect in the **Authentication Module** or core routing prevents general access to the platform or halts navigation into primary loyalty workflows.

### Acceptance Criteria (Exit Criteria)
The test cycle is considered complete when:
- **100% of critical test cases** (including Authentication and Stamp Issuance/Redemption flows) have been fully executed.
- **Zero open defects** of High or Critical severity remain unresolved.

---

## 6. Inventory of Functionalities

The following functional inventory details the modules, business expectations, target roles, and priority levels across the platform:

| Main Module | Sub-Module / Screen | Business Rule (Expected Result) | Role | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Backoffice** | Create Merchant | The owner registers their venue, brand colors, and menu. All data is isolated within their database tenant. | `OWNER` | Medium |
| **Backoffice** | Campaign Management | Defines the rules of the campaign (e.g., *"10 stamps = Free Cheese Scone or Coffee"*). Validates input limits. | `OWNER` | High |
| **Backoffice / Acquisition** | Print Counter QR Poster | Generates a printable counter poster pointing directly to `https://alpacard.gabo.lat/claim/[campaignId]`. | `OWNER` | High |
| **Acquisition** | Counter QR Scan | Scanning the printed poster redirects to `/claim/[campaignId]` and provisions an anonymous wallet in under 1 second without signup forms. | `CONSUMER` | High |
| **Acquisition** | Session Persistence | Remembers the user session via cookies or LocalStorage. Reloading (F5) or reopening the browser preserves the wallet and progress. | `CONSUMER` | High |
| **Acquisition** | PWA Offline Resilience | Installed PWA loads previous card state offline from Service Worker cache rather than a generic network error screen. | `CONSUMER` | Medium |
| **Fidelity (Core)** | Stamp QR Generation | The customer's PWA generates a dynamic cryptographic QR code (signed JWT) that expires strictly in 5 minutes. | `CONSUMER` | Critical |
| **Operation** | Barista Scanner | Reads the customer's QR code. If valid, emits an audible chime, triggers vibration, and increments one stamp. | `STAFF` | Critical |
| **Operation / Fidelity** | Reward Unlock & Claim | Reaching the campaign stamp limit disables "Add Stamp", enables "Claim Reward", and resets the counter to 0 upon staff validation. | `STAFF` / `CONSUMER` | Critical |
| **Security** | Anti-Replay Protection | If staff or a malicious actor attempts to scan the same QR code twice, the API rejects it with an HTTP `409 Conflict` error. | `STAFF` / API | Critical |
| **Security** | Access Control (RBAC) | A `CONSUMER` cannot scan cards. `STAFF` can only operate campaigns belonging to their own venue. | All Roles | High |
