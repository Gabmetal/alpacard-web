# 📮 Postman API Testing Guide & Endpoints Reference

This guide provides an end-to-end testing handbook for the Alpacard API (`apps/api`) so you can import, configure, and execute test workflows in **Postman**.

---

## 🚀 1. Postman Setup & Environment Variables

Create a Postman Environment (e.g., `Alpacard Local`) with the following variables:

| Variable | Initial Value | Description |
| :--- | :--- | :--- |
| `baseUrl` | `http://localhost:8080` | Root URL of the Go API server |
| `ownerToken` | *(leave empty)* | Bearer JWT for business owner / merchant |
| `guestToken` | *(leave empty)* | Bearer JWT for anonymous / consumer user |
| `businessId` | *(leave empty)* | UUID of created business |
| `campaignId` | *(leave empty)* | UUID of loyalty campaign |
| `cardId` | *(leave empty)* | UUID of claimed customer card |
| `qrToken` | *(leave empty)* | Dynamic anti-replay JWT from card QR |
| `staffUserId` | *(leave empty)* | UUID of registered staff member |

> [!TIP]
> In Postman, under the **Tests** tab of auth endpoints, you can automatically capture the JWT token:
> ```javascript
> if (pm.response.code === 200 || pm.response.code === 201) {
>     const json = pm.response.json();
>     if (json.token) {
>         pm.environment.set("ownerToken", json.token);
>     }
> }
> ```

---

## 🧪 2. Recommended Test Execution Flow

Follow this sequence to test full business and customer journeys in Postman:

```
[1. Health & Metrics] ➡️ [2. Register Merchant (Owner)] ➡️ [3. Create Business]
                                                                  ⬇️
[6. Scan & Stamp/Redeem] ⬅️ [5. Claim Card & Get QR] ⬅️ [4. Create Campaign]
          ⬇️
[7. Verify Business Stats & Staff Management]
```

---

## 📡 3. Endpoints & Test Cases Specification

### 1️⃣ Health & Telemetry

#### `GET {{baseUrl}}/health` (or `{{baseUrl}}/api/health`)
* **Auth**: None (Public)
* **Description**: Kubernetes liveness and readiness probe.
* **Expected Response (`200 OK`)**:
  ```json
  {
    "status": "healthy",
    "service": "alpacard-api",
    "time": "2026-10-27T03:45:00Z"
  }
  ```
* **Postman Test Script**:
  ```javascript
  pm.test("Status code is 200", () => pm.response.to.have.status(200));
  pm.test("Service is healthy", () => pm.expect(pm.response.json().status).to.eql("healthy"));
  ```

#### `GET {{baseUrl}}/metrics`
* **Auth**: None (Public)
* **Description**: Prometheus scraper metrics format.
* **Expected Response (`200 OK`)**: Content-Type `text/plain` containing `alpacard_http_requests_total`, `alpacard_scans_total`, etc.

---

### 2️⃣ Authentication & User Management

#### `POST {{baseUrl}}/api/v1/auth/register`
* **Auth**: None
* **Headers**: `Content-Type: application/json`
* **Body (Raw JSON)**:
  ```json
  {
    "name": "Carlos Alpaca",
    "email": "carlos@alpaca.test",
    "password": "Password123!",
    "role": "OWNER"
  }
  ```
* **What to Test**:
  - `201 Created` with valid fields; returns `token` and `user` object.
  - `400 Bad Request` if password is under 6 characters or email is empty.
  - `409 Conflict` if registering with an existing email.
* **Postman Test Script**:
  ```javascript
  pm.test("Status is 201 Created", () => pm.response.to.have.status(201));
  const res = pm.response.json();
  pm.environment.set("ownerToken", res.token);
  ```

#### `POST {{baseUrl}}/api/v1/auth/login`
* **Auth**: None
* **Headers**: `Content-Type: application/json`
* **Body (Raw JSON)**:
  ```json
  {
    "email": "carlos@alpaca.test",
    "password": "Password123!"
  }
  ```
* **What to Test**:
  - `200 OK` on valid credentials.
  - `401 Unauthorized` on wrong password or nonexistent user.

#### `POST {{baseUrl}}/api/v1/auth/guest`
* **Auth**: None
* **Description**: Creates instant anonymous user profile for consumer wallets.
* **Expected Response (`201 Created`)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "c1f7a048-4395-449e-b9e3-8fe59f6be4ba",
      "email": "guest_c1f7a048@alpacard.local",
      "name": "Loyalty Customer",
      "role": "CONSUMER",
      "isAnonymous": true
    }
  }
  ```
* **Postman Test Script**:
  ```javascript
  pm.test("Guest created", () => pm.response.to.have.status(201));
  pm.environment.set("guestToken", pm.response.json().token);
  ```

#### `GET {{baseUrl}}/api/v1/auth/me`
* **Auth**: `Bearer {{ownerToken}}`
* **What to Test**:
  - `200 OK` returns user details along with preloaded `ownedBusinesses` and `staffAt`.
  - `401 Unauthorized` if no token or expired token.

#### `POST {{baseUrl}}/api/v1/auth/link-guest`
* **Auth**: `Bearer {{ownerToken}}`
* **Headers**: `Content-Type: application/json`
* **Body (Raw JSON)**:
  ```json
  {
    "guestToken": "{{guestToken}}"
  }
  ```
* **What to Test**: Migrates and merges cards collected anonymously into the authenticated account.

---

### 3️⃣ Business Management

#### `POST {{baseUrl}}/api/v1/businesses`
* **Auth**: `Bearer {{ownerToken}}`
* **Headers**: `Content-Type: application/json`
* **Body (Raw JSON)**:
  ```json
  {
    "name": "Café Alpaca Central",
    "brandColor": "#3D2B1F",
    "category": "Cafetería",
    "description": "Café de especialidad en el centro",
    "website": "https://alpacard.app",
    "instagram": "@alpacard.app",
    "menuType": "link",
    "menuUrl": "https://menu.alpacard.app"
  }
  ```
* **What to Test**:
  - `201 Created`: Returns created business with generated `slug` (e.g. `cafe-alpaca-central`).
  - Auto-promotes user role to `OWNER` if currently `CONSUMER`.
  - `400 Bad Request` if `name` is blank.
* **Postman Test Script**:
  ```javascript
  pm.test("Business created", () => pm.response.to.have.status(201));
  pm.environment.set("businessId", pm.response.json().id);
  ```

#### `GET {{baseUrl}}/api/v1/businesses/mine`
* **Auth**: `Bearer {{ownerToken}}`
* **What to Test**: Returns array of businesses owned by or staffed by caller.

#### `PUT {{baseUrl}}/api/v1/businesses/{{businessId}}`
* **Auth**: `Bearer {{ownerToken}}`
* **Body (Raw JSON)**:
  ```json
  {
    "description": "Café de especialidad y pastelería artesanal"
  }
  ```
* **What to Test**:
  - `200 OK` on successful update.
  - `403 Forbidden` if caller does not own the business.

#### `POST {{baseUrl}}/api/v1/businesses/{{businessId}}/staff`
* **Auth**: `Bearer {{ownerToken}}`
* **Body (Raw JSON)**:
  ```json
  {
    "email": "cashier@alpaca.test"
  }
  ```
* **What to Test**:
  - `201 Created` when adding an existing user as staff.
  - `404 Not Found` if user with that email does not exist.
  - `409 Conflict` if user is already staff or is the business owner.

#### `GET {{baseUrl}}/api/v1/businesses/{{businessId}}/staff`
* **Auth**: `Bearer {{ownerToken}}`
* **What to Test**: `200 OK` returns list of staff members with their email, name, and role.

#### `DELETE {{baseUrl}}/api/v1/businesses/{{businessId}}/staff/{{staffUserId}}`
* **Auth**: `Bearer {{ownerToken}}`
* **What to Test**: `200 OK` removes staff member from business.

#### `GET {{baseUrl}}/api/v1/businesses/{{businessId}}/stats`
* **Auth**: `Bearer {{ownerToken}}`
* **What to Test**:
  - `200 OK` returns `campaignsCount`, `cardsCount`, `totalStampsIssued`, `rewardsRedeemed`, `totalCustomers`, `recentTransactions`.
  - `403 Forbidden` if request is made with an unauthorized account.

---

### 4️⃣ Loyalty Campaigns

#### `POST {{baseUrl}}/api/v1/campaigns`
* **Auth**: `Bearer {{ownerToken}}`
* **Headers**: `Content-Type: application/json`
* **Body (Raw JSON)**:
  ```json
  {
    "businessId": "{{businessId}}",
    "name": "Club del Café",
    "description": "Junta 8 sellos y llévate un latte o cappuccino gratis",
    "stampsRequired": 8,
    "reward": "Café de Especialidad Gratis",
    "bgType": "preset",
    "bgValue": "espresso",
    "textColor": "#ffffff",
    "stampIcon": "coffee"
  }
  ```
* **What to Test**:
  - `201 Created`: Campaign created.
  - `400 Bad Request` if `stampsRequired <= 0` or `name` is empty.
  - `403 Forbidden` if non-owner tries to create campaign under this business.
* **Postman Test Script**:
  ```javascript
  pm.test("Campaign created", () => pm.response.to.have.status(201));
  pm.environment.set("campaignId", pm.response.json().id);
  ```

#### `GET {{baseUrl}}/api/v1/campaigns`
* **Auth**: None (Public)
* **Query Params**: `?businessId={{businessId}}` (optional)
* **What to Test**: `200 OK` returns active campaigns.

#### `GET {{baseUrl}}/api/v1/campaigns/{{campaignId}}`
* **Auth**: None (Public)
* **What to Test**: `200 OK` returns campaign detail and associated business metadata.

#### `PUT {{baseUrl}}/api/v1/campaigns/{{campaignId}}`
* **Auth**: `Bearer {{ownerToken}}`
* **Body (Raw JSON)**:
  ```json
  {
    "reward": "Café Doble + Medialuna"
  }
  ```
* **What to Test**: `200 OK` on update; `403 Forbidden` if not owner.

---

### 5️⃣ Loyalty Cards (Customer / Wallet Flow)

#### `POST {{baseUrl}}/api/v1/cards/claim`
* **Auth**: `Bearer {{guestToken}}` (or `{{ownerToken}}`)
* **Headers**: `Content-Type: application/json`
* **Body (Raw JSON)**:
  ```json
  {
    "campaignId": "{{campaignId}}"
  }
  ```
* **What to Test**:
  - `201 Created` on first claim; initializes `stamps: 0`.
  - `200 OK` if the user already holds this card (idempotent; returns existing card without duplicating).
  - `404 Not Found` if campaign is inactive or does not exist.
* **Postman Test Script**:
  ```javascript
  pm.test("Card claimed", () => [200, 201].includes(pm.response.code));
  pm.environment.set("cardId", pm.response.json().id);
  ```

#### `GET {{baseUrl}}/api/v1/cards/mine`
* **Auth**: `Bearer {{guestToken}}`
* **What to Test**: `200 OK` lists all cards belonging to the caller.

#### `GET {{baseUrl}}/api/v1/cards/{{cardId}}`
* **Auth**: `Bearer {{guestToken}}`
* **What to Test**: `200 OK` returns card status, current stamps, stamps required, and transaction history.

#### `GET {{baseUrl}}/api/v1/cards/{{cardId}}/qr`
* **Auth**: `Bearer {{guestToken}}`
* **Description**: Generates dynamic signed JWT with anti-replay `jti` nonce (valid for 30-60s).
* **Expected Response (`200 OK`)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 60
  }
  ```
* **Postman Test Script**:
  ```javascript
  pm.test("QR token received", () => pm.response.to.have.status(200));
  pm.environment.set("qrToken", pm.response.json().token);
  ```

#### `GET {{baseUrl}}/api/v1/cards/{{cardId}}/events` (SSE Stream)
* **Auth**: `Bearer {{guestToken}}`
* **Headers**: `Accept: text/event-stream`
* **Description**: Server-Sent Events stream delivering live updates when a stamp is awarded or redeemed.

---

### 6️⃣ Cashier Scanner & Anti-Fraud Verification

#### `POST {{baseUrl}}/api/v1/scan`
* **Auth**: `Bearer {{ownerToken}}` (Cashier / Merchant)
* **Headers**: `Content-Type: application/json`
* **Body (Raw JSON)**:
  ```json
  {
    "token": "{{qrToken}}"
  }
  ```
* **Test Cases**:
  1. **Success (EARN Stamp)**:
     - When card has `stamps < stampsRequired - 1` (e.g. 0 -> 1).
     - Response: `200 OK` with `"action": "EARN"`, `"newCount": 1`, `"message": "¡Sello sumado con éxito!"`.
  2. **Success (REDEEM Reward)**:
     - When card reaches `stampsRequired` (e.g. 7 -> 8).
     - Response: `200 OK` with `"action": "REDEEM"`, `"newCount": 0`, `"message": "¡Premio canjeado exitosamente!"`.
  3. **Replay Attack Protection (`409 Conflict`)**:
     - Immediately resend the exact same request with the same `{{qrToken}}`.
     - Expected: `409 Conflict` with error message `"This QR code has already been scanned and processed"`.
  4. **Unauthorized Staff (`403 Forbidden`)**:
     - Call `/api/v1/scan` using a bearer token of a user who is **not** an owner or registered staff of that business.
     - Expected: `403 Forbidden`.
  5. **Invalid / Expired Token (`400 Bad Request`)**:
     - Send an expired or malformed token string in `token`.
     - Expected: `400 Bad Request` with `"Invalid or expired QR code token"`.

---

### 7️⃣ File Uploads

#### `POST {{baseUrl}}/api/v1/upload`
* **Auth**: `Bearer {{ownerToken}}`
* **Body**: `form-data` with key `file` (File type, e.g. PNG / JPG / SVG / WebP)
* **What to Test**:
  - `200 OK` returns `{ "url": "/api/uploads/uuid.png", "filename": "uuid.png" }`.
  - File is reachable via `GET {{baseUrl}}/api/uploads/uuid.png`.
  - `400 Bad Request` if file exceeds size limit or invalid format (e.g., `.exe`).

---

## 📋 4. Ready-to-Import Postman Collection JSON

Save this JSON block to an `alpacard-postman-collection.json` file on your machine and import it into Postman (**File -> Import**):

```json
{
  "info": {
    "name": "Alpacard API Test Suite",
    "description": "Comprehensive integration test suite for Alpacard Go API backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:8080" },
    { "key": "ownerToken", "value": "" },
    { "key": "guestToken", "value": "" },
    { "key": "businessId", "value": "" },
    { "key": "campaignId", "value": "" },
    { "key": "cardId", "value": "" },
    { "key": "qrToken", "value": "" }
  ],
  "item": [
    {
      "name": "1. Health & Telemetry",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/health"
          }
        },
        {
          "name": "Prometheus Metrics",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/metrics"
          }
        }
      ]
    },
    {
      "name": "2. Auth Flow",
      "item": [
        {
          "name": "Register Owner",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    var data = pm.response.json();",
                  "    pm.collectionVariables.set('ownerToken', data.token);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Owner Tester\",\n  \"email\": \"owner@alpaca.test\",\n  \"password\": \"Secret123!\",\n  \"role\": \"OWNER\"\n}"
            },
            "url": "{{baseUrl}}/api/v1/auth/register"
          }
        },
        {
          "name": "Login Owner",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"owner@alpaca.test\",\n  \"password\": \"Secret123!\"\n}"
            },
            "url": "{{baseUrl}}/api/v1/auth/login"
          }
        },
        {
          "name": "Guest Login (Customer)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    var data = pm.response.json();",
                  "    pm.collectionVariables.set('guestToken', data.token);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/v1/auth/guest"
          }
        },
        {
          "name": "Get Profile (/me)",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{ownerToken}}" }],
            "url": "{{baseUrl}}/api/v1/auth/me"
          }
        }
      ]
    },
    {
      "name": "3. Business Management",
      "item": [
        {
          "name": "Create Business",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    var data = pm.response.json();",
                  "    pm.collectionVariables.set('businessId', data.id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{ownerToken}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Café Alpaca Postman\",\n  \"brandColor\": \"#3D2B1F\",\n  \"category\": \"Café\",\n  \"description\": \"Testing via Postman\"\n}"
            },
            "url": "{{baseUrl}}/api/v1/businesses"
          }
        },
        {
          "name": "List My Businesses",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{ownerToken}}" }],
            "url": "{{baseUrl}}/api/v1/businesses/mine"
          }
        },
        {
          "name": "Get Business Dashboard Stats",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{ownerToken}}" }],
            "url": "{{baseUrl}}/api/v1/businesses/{{businessId}}/stats"
          }
        }
      ]
    },
    {
      "name": "4. Campaigns",
      "item": [
        {
          "name": "Create Campaign",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    var data = pm.response.json();",
                  "    pm.collectionVariables.set('campaignId', data.id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{ownerToken}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"businessId\": \"{{businessId}}\",\n  \"name\": \"Tarjeta de Café 8 Sellos\",\n  \"stampsRequired\": 8,\n  \"reward\": \"Café Gratis\",\n  \"bgType\": \"preset\",\n  \"bgValue\": \"espresso\",\n  \"textColor\": \"#ffffff\",\n  \"stampIcon\": \"coffee\"\n}"
            },
            "url": "{{baseUrl}}/api/v1/campaigns"
          }
        },
        {
          "name": "List Campaigns (Public)",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/v1/campaigns?businessId={{businessId}}"
          }
        }
      ]
    },
    {
      "name": "5. Cards & QR Flow",
      "item": [
        {
          "name": "Claim Card (Customer)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200 || pm.response.code === 201) {",
                  "    var data = pm.response.json();",
                  "    pm.collectionVariables.set('cardId', data.id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{guestToken}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"campaignId\": \"{{campaignId}}\"\n}"
            },
            "url": "{{baseUrl}}/api/v1/cards/claim"
          }
        },
        {
          "name": "Get Card Details",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{guestToken}}" }],
            "url": "{{baseUrl}}/api/v1/cards/{{cardId}}"
          }
        },
        {
          "name": "Get Dynamic Card QR Token",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    var data = pm.response.json();",
                  "    pm.collectionVariables.set('qrToken', data.token);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{guestToken}}" }],
            "url": "{{baseUrl}}/api/v1/cards/{{cardId}}/qr"
          }
        }
      ]
    },
    {
      "name": "6. Cashier Scanner & Anti-Fraud",
      "item": [
        {
          "name": "Verify & Add Stamp (Scan)",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{ownerToken}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"token\": \"{{qrToken}}\"\n}"
            },
            "url": "{{baseUrl}}/api/v1/scan"
          }
        },
        {
          "name": "Replay Attack Test (Rescan Same QR)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Replay attack rejected with 409 Conflict', () => {",
                  "    pm.response.to.have.status(409);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{ownerToken}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"token\": \"{{qrToken}}\"\n}"
            },
            "url": "{{baseUrl}}/api/v1/scan"
          }
        }
      ]
    }
  ]
}
```


---

## 🤖 5. Automating in CI/CD (GitHub Actions + Newman)

To run this entire API test suite automatically on every Git commit or Pull Request without manual clicks, execute the collection using **Newman** (Postman's official CLI runner).

### Adding Newman to GitHub Actions Workflow

In your `.github/workflows/ci-integration.yml` (or `.github/workflows/ci-dev.yml`), add an automated E2E step that boots the local API and runs Newman:

```yaml
      - name: E2E API Tests via Newman (Postman)
        run: |
          # 1. Install Newman
          npm install -g newman

          # 2. Start Go API in background
          cd apps/api
          go run cmd/server/main.go &
          cd ../..

          # 3. Wait for API to be healthy
          timeout 30s bash -c 'until curl -sf http://localhost:4000/api/health; do sleep 1; done'

          # 4. Run Postman Collection
          newman run alpacard-postman-collection.json \
            --env-var "baseUrl=http://localhost:4000" \
            --reporters cli
```
