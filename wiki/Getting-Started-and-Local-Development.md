# 🛠️ Getting Started & Local Development Guide

This guide walks you through setting up a complete Alpacard development environment on Linux, macOS, or Windows (WSL2).

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your workstation:

* **[Node.js](https://nodejs.org/)**: v20+ or v22 LTS
* **[pnpm](https://pnpm.io/)**: v9.15+ (`npm install -g pnpm@9.15.4`)
* **[Go](https://go.dev/)**: v1.22+ or v1.23+
* **[Podman](https://podman.io/)** or **[Docker](https://www.docker.com/)** with Docker Compose (optional, for full-stack containerized runs)

Verify your environment:
```bash
node -v    # v22.x or v20.x
pnpm -v    # 9.15.x
go version # go1.23.x or go1.24.x
```

---

## 📥 Clone & Install Dependencies

```bash
# 1. Clone repository
git clone https://github.com/Gabmetal/alpacard-web.git
cd alpacard-web

# 2. Checkout integration branch (where feature PRs originate)
git checkout integration

# 3. Install workspace dependencies
pnpm install
```

---

## 🚀 Running the Local Stack

### Option A: Native Monorepo Development (Recommended for Fast Iteration)

Running natively provides instant Hot Module Replacement (HMR) for React and instant re-builds for Go:

1. **Start the Go REST API Server**:
   ```bash
   cd apps/api
   go run cmd/server/main.go
   ```
   *The API will start on `http://localhost:4000`. By default, it connects to PostgreSQL if available, or falls back gracefully to an in-memory SQLite store for rapid standalone UI development.*

2. **In a separate terminal, start the Frontend Apps**:
   ```bash
   # From repository root
   pnpm dev
   ```
   Turborepo will spin up both frontends concurrently:
   * **Merchant Backoffice & Scanner**: [http://localhost:5173](http://localhost:5173)
   * **Customer Wallet PWA**: [http://localhost:5174](http://localhost:5174)

---

### Option B: Containerized Full Stack (Docker Compose)

To run the complete ecosystem including PostgreSQL 16 and RabbitMQ 3.13:

```bash
docker compose -f deploy/docker-compose.yml up --build
```

#### Port Reference

| Service | Port | Description |
| :--- | :--- | :--- |
| **`apps/web`** | `5173` | Merchant Console & QR Camera Scanner |
| **`apps/wallet`** | `5174` | Customer Offline-First Mobile PWA |
| **`apps/api`** | `4000` | Core Go REST HTTP API |
| **`apps/api (worker)`** | `9090` | Background RabbitMQ consumer & telemetry |
| **PostgreSQL** | `5432` | Primary Database (`alpacard` / `alpacard_dev`) |
| **RabbitMQ** | `5672` | AMQP 0-9-1 Messaging Protocol |
| **RabbitMQ Management** | `15672` | Broker Web UI (`guest` / `guest`) |

---

## 🧪 Running Tests & Quality Checks

Always verify tests locally before opening a Pull Request:

### 1. Backend Go Tests
```bash
cd apps/api
go test -v -race ./...
```
*Runs handler tests, model validation, and race-condition detection.*

### 2. Frontend Typecheck & Production Build
```bash
# Builds shared contracts, merchant web, and customer wallet
pnpm --filter @alpacard/shared build
pnpm --filter @alpacard/web build
pnpm --filter @alpacard/wallet build
```

---

## ⚙️ Environment Variables Reference

Create a `.env` file in `apps/api/.env` if you want to customize local ports or database credentials:

```bash
# Server Port
PORT=4000

# Database Connection (PostgreSQL or SQLite)
DB_DRIVER=postgres
DATABASE_URL=postgres://alpacard:alpacard_secret@localhost:5432/alpacard?sslmode=disable

# RabbitMQ Connection
RABBITMQ_URL=amqp://guest:guest@localhost:5672/

# JWT HMAC Secret Key
JWT_SECRET=super-secret-development-key-change-in-production

# CORS Allowed Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```
