# QA Master Test Plan: AlpaCard Web Platform

## 1. Project Objective

The primary objective is to guarantee functional quality, reliability, and security across the **AlpaCard** web platform ([alpacard.gabo.lat](https://alpacard.gabo.lat)). Special emphasis is placed on validating that the core loyalty lifecycle—from customer wallet acquisition and dynamic stamp issuance to reward redemption and counter reset—operates without logical flaws, race conditions, or role privilege escalation vulnerabilities.

---

## 2. Scope

### In-Scope
- **Authentication & RBAC Module:** User authentication and registration across roles (`OWNER`, `STAFF`, and anonymous `CONSUMER`). Strict role isolation to prevent privilege escalation (e.g., ensuring `CONSUMER` cannot increment stamps or execute cashier functions).
- **Core Loyalty Lifecycle:** Dynamic QR code generation, real-time cryptographic stamp issuance, progress tracking, reward unlocking at capacity limit, and atomic reset back to zero after redemption.
- **Merchant Backoffice & Campaign Setup:** Business profile onboarding, branding configuration, custom campaign rule definitions, and counter printable QR poster generation.
- **Client PWA & Offline Experience:** Zero-friction anonymous wallet creation, state persistence (`LocalStorage` / session cookies), and offline card rendering via Service Worker cache.

### Out-of-Scope
- Stress, load, and distributed server performance testing.
- Payment gateway integration testing (outside current release flow).
- Third-party social login integrations not included in the active MVP scope.

---

## 3. Test Strategy & Approach

Quality Assurance is structured across three execution layers to ensure comprehensive end-to-end coverage:

1. **Manual Functional & E2E Testing:**  
   Validation of critical user journeys with real production-like scenarios (e.g., simulating recurring café customers collecting stamps toward perks such as a free coffee, cheese scone, or scallion scone, and verifying real-time UI/SSE updates).
2. **Database Integrity & Relational Verification:**  
   Direct database state verification against **PostgreSQL 16** using database management clients (e.g., pgAdmin, DBeaver, TablePlus). Execution of relational queries and `JOIN` checks to confirm consistent transaction states, correct foreign key constraints, absence of orphan records, and strict prevention of duplicate stamps.
3. **Automated Regression Suite (Phase 2):**  
   Automated end-to-end regression scripts built with **Selenium WebDriver (Java)** configured via `ChromeOptions` to:
   - Natively emulate mobile device viewports and touch interactions.
   - Automatically bypass camera permission dialogs and mock webcam video streams using `--use-fake-ui-for-media-stream` and `--use-fake-device-for-media-stream`.
   - Validate Service Worker cache and PWA lifecycle.
   - Integrate with continuous integration workflows in GitHub Actions (`.github/workflows/ci-main.yml`).

---

## 4. Environment & Tooling

| Category | Tool / Technology | Purpose |
| :--- | :--- | :--- |
| **Test Case & Bug Management** | Jira + Xray | Test repository, execution cycles, traceability, and defect tracking. |
| **Database Verification** | PostgreSQL 16, pgAdmin / DBeaver / TablePlus | Direct persistence check, transactional consistency, and data validation. |
| **Automation Framework** | Java, IntelliJ IDEA, Selenium WebDriver | Automated regression test authoring and mobile browser emulation. |
| **API Testing** | Postman / Newman, cURL | REST API verification, replay attack validation, and status code checks. |
| **QA Copilot & Edge Case Assistance** | Cursor, Claude, Antigravity | Complex test matrix generation, boundary exploration, and automation script debugging. |
| **CI/CD Pipeline** | GitHub Actions (`ci-main.yml`) | Automated build verification and test pipeline execution. |

---

## 5. Acceptance & Suspension Criteria

### Suspension Criteria
Testing execution will be immediately suspended if a critical/blocker defect in the **Authentication & Access Control Module** or core routing prevents access to the platform or blocks fundamental campaign navigation.

### Exit / Acceptance Criteria
The test cycle is successfully signed off when:
- **100% of Critical Priority test cases** (including Authentication, QR Token Issuance, and Stamp Accumulation) are executed.
- **Zero open Blocker or Critical defects** remain unresolved.
- High-severity defects have documented workarounds approved by engineering and product leads.

---

## 6. Inventory of Functionalities

| Main Module | Sub-Module / Screen | Business Rule / Expected Result | Target Role | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Backoffice** | Create Merchant | Merchant registers business name, brand colors, and menu metadata. Isolated per tenant in DB. | `OWNER` | Medium |
| **Backoffice** | Campaign Management | Defines loyalty business logic (e.g., *"10 stamps = Free Coffee or Cheese Scone"*). Validates positive non-zero boundaries. | `OWNER` | High |
| **Backoffice / Acquisition** | Print Counter QR Poster | Generates printable counter poster pointing directly to `https://alpacard.gabo.lat/claim/[campaignId]`. | `OWNER` | High |
| **Acquisition** | Counter QR Scan | Scanning counter QR redirects to `/claim/[campaignId]` and provisions an anonymous wallet in <1s without signup forms. | `CONSUMER` | High |
| **Acquisition** | Session Persistence | Anonymous wallet persists across browser reloads (F5) or restarts via `LocalStorage` / cookies. | `CONSUMER` | High |
| **Acquisition** | PWA Offline Resilience | Installed PWA loads previous stamp state (e.g., 3 stamps) offline from Service Worker cache rather than standard browser error. | `CONSUMER` | Medium |
| **Fidelity (Core)** | Stamp QR Generation | Customer PWA generates dynamic cryptographic QR code (signed JWT) expiring strictly in 5 minutes. Exactly 1 API call per interval. | `CONSUMER` | Critical |
| **Operation** | Barista Scanner | Staff scanner decodes customer QR, plays audio chime, triggers haptic feedback (vibrate), and increments stamp by 1. | `STAFF` | Critical |
| **Operation / Fidelity** | Reward Unlock & Claim | Reaching capacity (e.g., 10/10) locks stamp button and enables "Claim Reward". Staff validates redemption; SSE resets counter to 0. | `STAFF` / `CONSUMER` | Critical |
| **Security** | Anti-Replay Protection | Scanning the same QR JWT token more than once is rejected by the backend with `409 Conflict`. | `STAFF` / API | Critical |
| **Security** | Access Control (RBAC) | Customers cannot scan cards or access cashier routes. Staff can only award stamps for campaigns belonging to their merchant. | All Roles | High |

---

## 7. Test Scenarios & Detailed Test Cases

### Scenario Overview Matrix

| Scenario ID | Title | Execution Status |
| :--- | :--- | :--- |
| **Scenario 01** | Verify QR Code Security, Expiration, and Anti-Fraud Prevention | **BLOCKED** *(Under active bug investigation)* |
| **Scenario 02** | Verify Reward Redemption Flow and Wallet Reset at Stamp Limit | **BLOCKED** *(Awaiting dependent flow fix)* |
| **Scenario 03** | Verify Anonymous Customer Wallet Creation, Access, and Persistence | **PASSED** |
| **Scenario 04** | Verify Merchant Account Onboarding and Campaign Rule Configuration | **PASSED** |

---

### Scenario 01: QR Security, Expiration & Anti-Fraud Prevention
**Status:** `BLOCKED`  
**Objective:** Verify that dynamic QR tokens cannot be reused, expire strictly within the configured window, and do not trigger infinite frontend API loops.

---

#### Test Case ID: `TC-001`
- **Module:** Fidelity / Scanner Operation (Frontend)
- **Scenario:** Validate that scanning a valid dynamic QR code increments the stamp counter on initial scan (HTTP 200).
- **Preconditions:**
  1. **Device A (Customer):** PWA active with an anonymous wallet having at least one empty stamp slot (e.g., 0/10).
  2. **Device B (Barista):** Authenticated with role `STAFF` or `OWNER` with scanner camera access enabled.
- **Execution Steps:**
  1. On Device A, generate and display a fresh dynamic QR code.
  2. On Device B, open the AlpaCard staff scanner.
  3. Point Device B camera at Device A screen to scan the QR code before the 5-minute timer expires.
  4. Observe physical and visual feedback on Device B.
  5. Check wallet interface on Device A.
- **Expected Result:**
  - Device B plays confirmation chime, vibrates, and displays a success notification indicating the stamp was added.
  - Device A updates in real-time (via SSE/WebSocket), incrementing the visual counter (e.g., from `0/10` to `1/10`).

---

#### Test Case ID: `TC-002`
- **Module:** Security / Anti-Fraud (Replay Protection)
- **Scenario:** Validate that the system returns `409 Conflict` if a duplicate or previously redeemed QR token is submitted.
- **Preconditions:**
  1. Fresh, valid customer JWT token obtained from the client QR interface.
  2. Valid Bearer authentication token for a user with `STAFF` or `OWNER` role.
- **Execution Steps:**
  1. In Postman or cURL, configure a `POST` request to `/api/v1/scan`.
  2. Include the Staff Bearer Token in authorization headers.
  3. Include customer JWT in the JSON request body.
  4. Send request and verify initial response is `200 OK`.
  5. Immediately re-send the exact same `POST` payload with the identical JWT.
- **Expected Result:**
  - The second request is strictly rejected by the backend with HTTP `409 Conflict` preventing duplicate stamp allocation.

---

#### Test Case ID: `TC-003`
- **Module:** Fidelity / Security (Token Expiration)
- **Scenario:** Validate QR token invalidation upon reaching the 5-minute lifespan limit.
- **Preconditions:**
  1. **Device A (Customer):** Active wallet displayed.
  2. **Device B (Barista):** Staff scanner open.
  3. Auto-refresh paused or screenshot taken immediately upon QR generation to freeze token image.
- **Execution Steps:**
  1. On Device A, generate a fresh QR code and note the exact timestamp.
  2. Wait 5 minutes and 1 second until the countdown reaches `0:00`.
  3. On Device B, scan the expired QR code (or the frozen screenshot).
  4. Inspect feedback on Device B and wallet state on Device A.
- **Expected Result:**
  - Device B rejects the token and displays an explicit error message (e.g., *"Expired Token"* or *"Invalid QR Code"*).
  - No chime or vibration is emitted.
  - Device A stamp count remains unchanged.

---

#### Test Case ID: `TC-004`
- **Module:** Fidelity / QR Generation Lifecycle
- **Scenario:** Verify single network call on QR generation and timer renewal behavior.
- **Preconditions:** Browser DevTools open to Network tab.
- **Execution Steps:**
  1. Navigate to customer wallet view.
  2. Monitor outgoing network traffic to `/qr`.
  3. Allow countdown to reach `0:00` (5 minutes elapsed).
- **Expected Result:**
  - Exactly 1 network request is made to `/qr` on initial load.
  - No continuous polling or request loop occurs during the 5-minute countdown.
  - Only when the timer reaches 0 is a second automated request dispatched to renew the token.

---

### Scenario 02: Reward Redemption & Card Reset
**Status:** `BLOCKED`  
**Objective:** Verify that cards reaching capacity transition correctly into reward redemption mode, prevent overflow, and reset cleanly back to zero.

---

#### Test Case ID: `TC-005`
- **Module:** Fidelity / Reward Unlocking
- **Scenario:** Validate that the interface unlocks "Reward Ready / Claim" state upon reaching campaign stamp limit.
- **Preconditions:**
  1. **Device A (Customer):** Wallet with $N-1$ stamps (e.g., 9 out of 10 stamps collected).
  2. **Device B (Barista):** Authenticated with `STAFF` role.
- **Execution Steps:**
  1. On Device A, generate stamp QR code.
  2. On Device B, scan QR to grant the final stamp.
  3. Observe UI transition on Device A.
- **Expected Result:**
  - Counter reaches full capacity (e.g., `10/10`).
  - Device A disables "Add Stamp" button and displays reward badge and "Claim Reward" dynamic voucher.

---

#### Test Case ID: `TC-006`
- **Module:** Fidelity / Reward Redemption Flow
- **Scenario:** Validate reward redemption by staff and automatic wallet reset to zero.
- **Preconditions:**
  1. **Device A (Customer):** Card in "Ready to Claim" state (`10/10`).
  2. **Device B (Barista):** Staff session open.
- **Execution Steps:**
  1. On Device A, tap "Claim Reward" and show redemption QR/code to barista.
  2. On Device B, scan and confirm redemption.
  3. Check resulting wallet state on Device A.
- **Expected Result:**
  - Device B confirms reward was successfully redeemed.
  - Device A receives real-time SSE event, triggers celebration animation, screen brightness returns to normal, and stamp counter resets to `0/10`, ready for a new cycle.

---

#### Test Case ID: `TC-007`
- **Module:** Fidelity / Boundary & Overflow Protection
- **Scenario:** Validate that system blocks adding stamps to an already completed card pending redemption.
- **Preconditions:** Device A wallet at `10/10` in reward claim state.
- **Execution Steps:**
  1. Attempt to force-request a regular stamp QR token on Device A.
  2. If presented, attempt to scan using Device B (Staff).
  3. Verify system error handling.
- **Expected Result:**
  - System blocks the action. If scanned, staff scanner throws error: *"Card already full; process reward redemption first."* Stamp count does not increment to 11/10.

---

### Scenario 03: Anonymous Customer Wallet Lifecycle & Persistence
**Status:** `PASSED`  
**Objective:** Verify seamless customer onboarding with zero friction and robust local session retention.

---

#### Test Case ID: `TC-008`
- **Module:** Acquisition / Anonymous Customer Wallet
- **Scenario:** Validate instant anonymous wallet provisioning upon visiting valid campaign URL.
- **Preconditions:**
  1. Active campaign claim link (`/claim/[campaignId]`) created by merchant `OWNER`.
  2. Incognito/private browser session without previous AlpaCard session history.
- **Execution Steps:**
  1. Navigate to `/claim/[campaignId]` (simulating counter QR scan).
  2. Measure load time.
  3. Inspect landing screen.
- **Expected Result:**
  - System prompts no registration forms, usernames, or emails.
  - Instantly redirects to the campaign loyalty card in under 1 second with `0 stamps`.

---

#### Test Case ID: `TC-009`
- **Module:** Acquisition / PWA Session Persistence
- **Scenario:** Validate that anonymous wallet session persists across page refreshes and browser restarts.
- **Preconditions:** Completed `TC-008` with active wallet displayed.
- **Execution Steps:**
  1. Refresh page (`F5`).
  2. Close tab completely, open a new tab, and navigate back to `https://alpacard.gabo.lat`.
- **Expected Result:**
  - User session is remembered via cookies/`LocalStorage`.
  - Exactly the same wallet ID and stamp balance load without duplicate wallet generation or login prompts.

---

#### Test Case ID: `TC-010`
- **Module:** Acquisition / Error Handling
- **Scenario:** Validate error handling when accessing non-existent or invalid campaign URL.
- **Preconditions:** Browser session without active claim.
- **Execution Steps:**
  1. Access invalid URL: `https://alpacard.gabo.lat/claim/12345-fake-campaign`.
  2. Inspect HTTP status and visual screen.
- **Expected Result:**
  - No anonymous wallet is provisioned.
  - Displays user-friendly error view (*"Campaign not found"* or *"Invalid QR Code"* - HTTP 404).

---

#### Test Case ID: `TC-015`
- **Module:** Acquisition / PWA Offline Connectivity
- **Scenario:** Validate card rendering from Service Worker cache while offline.
- **Preconditions:**
  1. Device A with active wallet previously loaded online with stamps (e.g., 3 stamps).
  2. Device placed in Airplane Mode (Wi-Fi and mobile data disabled).
- **Execution Steps:**
  1. Close browser/installed PWA.
  2. Reopen PWA without internet connectivity.
  3. Verify rendered UI and cached state.
- **Expected Result:**
  - Application renders from Service Worker cache showing last cached card state (3 stamps) rather than browser "No internet connection" error.
- **Current Defect Note:** *(Tracked in Jira as bug; Service Worker offline fallback requires patch).*

---

### Scenario 04: Backoffice Merchant Account & Campaign Management
**Status:** `PASSED`  
**Objective:** Verify merchant onboarding, campaign creation rules, printable posters, and input validation.

---

#### Test Case ID: `TC-011`
- **Module:** Backoffice / Merchant Configuration
- **Scenario:** Validate merchant account onboarding and store setup.
- **Preconditions:** Authenticated AlpaCard user with role `OWNER`.
- **Execution Steps:**
  1. Go to Merchant Settings section.
  2. Fill required inputs: Business Name, Brand Color Palette, and Menu Details.
  3. Save changes and refresh page.
- **Expected Result:**
  - Data saved to PostgreSQL database.
  - Dashboard updates to reflect store name and branding theme.

---

#### Test Case ID: `TC-012`
- **Module:** Backoffice / Campaign Management
- **Scenario:** Validate creation of a new loyalty campaign with valid rules.
- **Preconditions:** Merchant configured (`TC-011`); authenticated as `OWNER`.
- **Execution Steps:**
  1. Navigate to **Campaigns -> New Campaign**.
  2. Set required stamps count to `10`.
  3. Enter reward title: *"Free Cheese Scone"*.
  4. Save and activate campaign.
- **Expected Result:**
  - Campaign transitions to status `Active` with a unique `campaignId`. Appears in merchant campaign list.

---

#### Test Case ID: `TC-013`
- **Module:** Backoffice / Acquisition Poster
- **Scenario:** Validate counter printable QR poster generation.
- **Preconditions:** At least one active campaign (`TC-012`).
- **Execution Steps:**
  1. Click **"Print QR Poster"** from the active campaign card.
  2. Inspect popup/printable preview.
  3. Scan generated poster QR with an external smartphone camera.
- **Expected Result:**
  - Printable view displays brand styling and static counter QR.
  - Decoded URL points accurately to `https://alpacard.gabo.lat/claim/[campaignId]`.

---

#### Test Case ID: `TC-014`
- **Module:** Backoffice / Input Validation
- **Scenario:** Validate rejection of invalid stamp requirements in campaign form.
- **Preconditions:** `OWNER` session on New Campaign page.
- **Execution Steps:**
  1. Attempt to create campaign with `0` required stamps.
  2. Attempt with negative integers (e.g., `-5`) or text (e.g., `"ten"`).
  3. Click Save.
- **Expected Result:**
  - Form validation blocks submission on both client and API validation layers. Input highlighted in red with error: *"Stamp count must be greater than 0"*.
