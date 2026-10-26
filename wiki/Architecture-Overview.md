# 🏗️ Architecture Overview

The Alpacard ecosystem is engineered as a **decoupled, event-driven microservices architecture** that balances sub-millisecond cashier scanning latency with absolute transaction integrity and fraud resilience.

---

## 🏛️ System Architecture Diagram

```mermaid
flowchart TB
    subgraph Clients ["Client Layer"]
        M_BROWSER["Merchant Device / Terminal<br/>(Chrome / Safari / Firefox)"]
        C_PHONE["Customer Smartphone<br/>(iOS Safari / Android Chrome PWA)"]
    end

    subgraph Edge ["Edge & Networking"]
        DNS["Cloudflare DNS & Edge SSL"]
        ROUTER["Zero-Trust VPN Gateway<br/>(Tailscale Subnet 192.168.0.0/24)"]
        INGRESS["Traefik Ingress Controller<br/>(HTTPS 443 / Let's Encrypt TLS)"]
    end

    subgraph K8s ["Dedicated Production Kubernetes Cluster"]
        subgraph FrontendPods ["Frontend Services"]
            SVC_WEB["alpacard-web<br/>(Nginx + React 18 SPA)"]
            SVC_WALLET["alpacard-wallet<br/>(Nginx + Customer PWA)"]
        end

        subgraph BackendPods ["Core Logic"]
            SVC_API["alpacard-api<br/>(Go 1.23 REST HTTP Server)"]
            SVC_WORKER["alpacard-worker<br/>(Go Event Queue Processor)"]
        end

        subgraph StoragePods ["Persistence & Messaging"]
            DB_POSTGRES[("PostgreSQL 16 StatefulSet<br/>Atomic Ledger & Card State")]
            MQ_RABBIT[("RabbitMQ Message Broker<br/>Stamp Event Exchanges & Queues")]
        end
    end

    M_BROWSER -->|Public Internet| DNS
    DNS --> INGRESS
    C_PHONE -->|Public Internet| DNS
    C_PHONE -.->|Internal QA VPN| ROUTER
    ROUTER -.-> INGRESS

    INGRESS -->|/| SVC_WEB
    INGRESS -->|/wallet, /claim, /card| SVC_WALLET
    INGRESS -->|/api/*| SVC_API

    SVC_API -->|Read & Write Transactions| DB_POSTGRES
    SVC_API -->|Publish Stamp Events| MQ_RABBIT
    MQ_RABBIT -->|Consume Events| SVC_WORKER
    SVC_WORKER -->|Audit Log & Analytics| DB_POSTGRES
```

---

## 📦 Service Responsibilities

### 1. `apps/api` (Go REST API Server)
* **Runtime**: Go 1.23+ compiled statically without CGO (`CGO_ENABLED=0 GOOS=linux`).
* **Router**: Standard library `net/http` router with zero external routing dependencies for maximum performance and minimum memory footprint (~18MB resident memory).
* **Core Endpoints**:
  * `GET /api/health`: Health probe and service metadata for Kubernetes liveness/readiness probes.
  * `POST /api/v1/cards/claim`: Issues a new digital card to a customer without requiring login credentials.
  * `POST /api/v1/cards/token`: Generates a dynamic, cryptographically signed, short-lived JWT/HMAC token for customer display.
  * `POST /api/v1/stamps/scan`: Validates token signatures, enforces anti-replay JTI checks, increments stamps atomically, and commits ledger transactions.
  * `GET /metrics`: Native Prometheus metrics endpoint reporting request rates, scan latency histograms, and database pool utilization.

### 2. `apps/api/cmd/worker` (Go Asynchronous Worker)
* **Message Broker**: Subscribes to RabbitMQ topic exchange `stamps.exchange`.
* **Asynchronous Jobs**:
  * Decouples heavy audit logging, analytics aggregation, and merchant notification processing from the cashier's critical latency path.
  * Employs dead-letter exchanges (`stamps.dlx`) and exponential backoff retry policies to guarantee zero lost transactions during downstream network partitions.

### 3. `apps/web` (Merchant Backoffice & Scanner)
* **Tech Stack**: React 18, Vite 6, Tailwind CSS 4, Lucide Icons.
* **Capabilities**:
  * **Interactive Demo**: Tour illustrating cashier camera scanning and customer stamp animations side by side.
  * **Camera Scanner**: Integrated hardware scanner powered by `@yudiel/react-qr-scanner` with torch flashlight control, zoom factor adjustment, and instant visual/haptic/audio confirmation.
  * **Card & Campaign Customizer**: Visual color picker, custom logo uploader, stamp icon selector, and reward milestone definition.

### 4. `apps/wallet` (Customer Offline-First PWA)
* **Tech Stack**: React 18, Vite 6, Tailwind CSS 4, Web Audio API.
* **Key Features**:
  * **Zero App-Store Friction**: Opens instantly via QR scan or URL without downloading an APK or native app.
  * **Dynamic Anti-Screenshot QR**: Re-generates single-use tokens every 30 seconds with an animated countdown dial.
  * **Cookie & LocalStorage Persistence**: Stores card session IDs in 1-year persistent cookies (`SameSite=Lax`) to prevent customer card loss on accidental tab close or page reload.
  * **Native Web Audio Synthesizer**: Generates crisp harmonic chime tones on stamp receipt and fanfare chords on reward redemption without external MP3 asset latency.

### 5. `packages/shared` (Shared TypeScript Contract)
* Monorepo workspace library consumed by `apps/web` and `apps/wallet`.
* Contains strict TypeScript interfaces for `Business`, `Card`, `StampAction`, `ScanResult`, and canonical stamp icon identifiers (`coffee`, `pizza`, `scissors`, `taco`, etc.).

---

## 🔄 Core Transaction Workflows

### Workflow 1: Customer Card Claim & Provisioning

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant W as apps/wallet (PWA)
    participant A as apps/api (Go Server)
    participant DB as PostgreSQL Database

    C->>W: Scans Merchant Promotional QR (e.g. /claim?biz=cafe-alpaca)
    W->>A: POST /api/v1/cards/claim { businessSlug: "cafe-alpaca" }
    A->>DB: Query business metadata & reward thresholds
    A->>DB: INSERT INTO cards (id, business_id, stamps, status) VALUES (uuid, ..., 0, 'active')
    DB-->>A: Record committed
    A-->>W: 201 Created { cardId, business, stamps: 0, secret }
    W->>W: Save cardId in LocalStorage & 1-Year Cookie
    W-->>C: Displays personalized loyalty punch card with dynamic QR
```

---

### Workflow 2: Merchant Cashier Scan & Stamp Issuance

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    actor M as Cashier / Merchant
    participant W as apps/wallet (Customer)
    participant S as apps/web Scanner
    participant A as apps/api (Go Server)
    participant DB as PostgreSQL Database
    participant MQ as RabbitMQ Broker

    W->>W: Generates Dynamic Token (JWT signed with secret, JTI nonce, exp: 30s)
    W-->>C: Displays animated dynamic QR code
    M->>S: Aims camera scanner at customer screen
    S->>S: Decodes QR payload
    S->>A: POST /api/v1/stamps/scan { token: "eyJhbGciOi..." }
    
    rect rgb(245, 240, 235)
        Note over A,DB: Atomic Database Ledger Transaction
        A->>DB: BEGIN TRANSACTION (ISOLATION LEVEL READ COMMITTED)
        A->>DB: SELECT * FROM cards WHERE id = $1 FOR UPDATE
        A->>DB: Check if JTI nonce has already been consumed
        A->>DB: INSERT INTO consumed_tokens (jti, card_id, consumed_at)
        A->>DB: UPDATE cards SET stamps = stamps + 1 WHERE id = $1
        A->>DB: INSERT INTO stamp_ledger (id, card_id, action, amount) VALUES (uuid, $1, 'EARN', 1)
        A->>DB: COMMIT TRANSACTION
    end

    A->>MQ: Publish event "stamp.earned" to exchange "stamps.exchange"
    A-->>S: 200 OK { success: true, action: "EARN", newCount: 8, message: "Stamp added!" }
    S->>S: Plays success beep + haptic vibration + displays celebration overlay
    W->>A: Polls / WebPush detects balance update
    W->>W: Triggers harmonic chime & stamp punch animation
```
