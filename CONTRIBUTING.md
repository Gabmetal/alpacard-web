# Contributing to Alpacard 🦙

Thank you for your interest in contributing to **Alpacard**! We are an open-source, community-driven digital loyalty punch card platform designed for local businesses, coffee shops, bakeries, and indie retailers.

Whether you are fixing a typo, submitting a bug report, creating a new stamp icon, or adding a major feature, we welcome and appreciate your contribution!

---

## 🗺️ What We're Working On (Roadmap & Good First Issues)

Check our [GitHub Issues](https://github.com/alpacard/alpacard-web/issues) for issues labeled `good first issue` or `help wanted`. Some high-priority areas include:

1. **Apple Wallet & Google Wallet Pass Integration**:
   - Generating `.pkpass` files and Google Wallet passes so customers can add cards directly to native phone wallets.
2. **Additional Stamp Icons & Themes**:
   - Adding more icons (`taco`, `scissors`, `book`, `gym`, `ice-cream`) to `@alpacard/shared`.
3. **Internationalization (i18n)**:
   - Adding Portuguese, French, or German translations to `apps/web` and `apps/wallet`.
4. **Push Notifications**:
   - Web Push API notification when a customer receives a stamp or unlocks a reward.
5. **Offline Queue Sync**:
   - Enhanced ServiceWorker background sync for offline cashier scanning.

---

## 🛠️ Local Development Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ and [pnpm](https://pnpm.io/) v9+
- [Go](https://go.dev/) 1.22+ (if developing on the backend)
- [Docker](https://www.docker.com/) & Docker Compose (optional, for full-stack containerized dev)

---

### Option A: Standard Full Stack (Docker Compose)

Run the entire ecosystem (Postgres, RabbitMQ, Go API, Worker, Merchant Web, and Customer Wallet) with one command:

```bash
docker compose -f deploy/docker-compose.yml up --build
```

- **Merchant Portal**: [http://localhost:5173](http://localhost:5173)
- **Customer Wallet**: [http://localhost:5174](http://localhost:5174)
- **Go REST API**: [http://localhost:4000](http://localhost:4000)
- **RabbitMQ Dashboard**: [http://localhost:15672](http://localhost:15672) (`guest` / `guest`)

---

### Option B: Native Monorepo Development (Fastest)

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start the Go API**:
   ```bash
   cd apps/api
   go run cmd/server/main.go
   ```
   *(Defaults to SQLite automatically if PostgreSQL is not running).*

3. **Start the Frontends**:
   ```bash
   pnpm dev
   ```

---

## 📁 Repository Structure

```
alpacard/
├── apps/
│   ├── api/             # Go 1.26 REST API & RabbitMQ consumer
│   │   ├── cmd/server/  # HTTP server entrypoint
│   │   └── internal/    # Handlers, DB models, Auth, Events
│   ├── web/             # Merchant Backoffice & QR Camera Scanner (React + Vite)
│   └── wallet/          # Customer Mobile PWA (Offline-first, dynamic QR)
├── packages/
│   └── shared/          # Shared TypeScript models, themes, icons
├── deploy/
│   ├── docker-compose.yml
│   └── helm/alpacard/   # Production Helm chart for Kubernetes & Cloud Native
└── docs/
    └── marketing/       # Community guides, pitch decks, and launch toolkits
```

---

## 🤝 How to Submit a Pull Request

We follow a structured branching strategy where `integration` runs all test suites, `dev` is the active staging QA environment, and `main` is production:

1. **Fork the repository** on GitHub (or clone with developer access).
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/alpacard-web.git
   cd alpacard-web
   ```
3. **Branch from `integration`** for new features, fixes, or improvements:
   ```bash
   git checkout integration
   git pull origin integration
   git checkout -b feat/my-new-feature
   ```
   *(For critical production bugs, branch from `main` as `hotfix/my-hotfix`)*.
4. **Make your changes** and verify the build and tests pass locally:
   ```bash
   pnpm build
   cd apps/api && go test -v -race ./...
   ```
5. **Commit with conventional commit messages**:
   ```bash
   git commit -m "feat(wallet): add vibration haptic on stamp collection"
   ```
6. **Push and create a Pull Request targeting `integration`**:
   - Automated CI runs Go backend tests, binary compilation, and Vite/Tailwind frontend bundle verification.
7. **Promotion Flow**:
   - Once merged into `integration`, create a Pull Request from `integration` into `dev`.
   - Merges into `dev` automatically deploy to `https://dev.alpacard.app` via Kubernetes continuous deployment.
   - Stable releases are promoted via Pull Request from `dev` into `main`, which automatically deploys to live production at `https://alpacard.app`.

---

## 🧪 Testing & QA

- **Backend tests**:
  ```bash
  cd apps/api
  go test ./...
  ```
- **Frontend linting & build**:
  ```bash
  pnpm build
  ```

---

## 💬 Community & Questions

- Open a [GitHub Discussion](https://github.com/alpacard/alpacard-web/discussions) or create an issue.
- Connect with maintainers directly through pull requests or issues.

Thank you for helping local coffee shops and independent retailers thrive with free, open software! 🦙
