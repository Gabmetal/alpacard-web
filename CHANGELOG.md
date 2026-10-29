# 📋 Alpacard Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v2.2.0] - 2026-10-29

### 🚀 Highlights & Architectural Upgrades
- **Pure Subdomain Routing & Slash-Free URLs**: Decoupled the monorepo into dedicated subdomains across environments:
  - **Production**: `alpacard.app` (Landing & Docs), `wallet.alpacard.app` (Consumer Loyalty PWA), `merchant.alpacard.app` (Merchant Portal & Backoffice), `demo.alpacard.app` (Interactive Playground).
  - **Development**: `dev.alpacard.app`, `dev-wallet.alpacard.app`, `dev-merchant.alpacard.app`, `dev-demo.alpacard.app`.
  - Removed deprecated path-based routing (`/wallet`, `/demo`, etc.) from apps, reverse proxies, ingress, documentation, and automated tests.
- **Interactive 3D Alpaca Barista & Card Experience**: Built a custom Three.js 3D diorama on the landing page featuring a specialty coffee shop with a barista alpaca in a green apron, interactive 3D loyalty card, pastry case, coffee sacks, chalkboard menu, lighting, and performance-optimized lifecycle pause.
- **PWA Deep-Linking & In-Wallet Campaign QR Scanner**:
  - Upgraded PWA manifest with link capture directives (`handle_links: preferred`, `launch_handler`) so scanning store posters directly opens the installed wallet app without falling back to mobile browsers.
  - Added an in-app QR camera scanner to the consumer wallet to scan and claim loyalty campaigns in 1 tap directly from the app.

---

### ✨ Features
- **3D Interactive Diorama**:
  - Fully modeled Three.js scene on `apps/web` landing page with an alpaca barista, espresso machine, steam effects, pastry counter, chalkboard menu, and neon signage.
  - Interactive 3D punch card with real-time mouse/touch parallax, specular highlights, and physics tilt.
- **Customer Password Recovery Flow**:
  - Implemented bilingual forgot and reset password flow in `apps/wallet` (`/reset-password`).
  - Added secure email dispatch via Resend API with 1-hour expiration tokens.
  - Added confirmation password validation to prevent lost credentials.
- **In-Wallet Store Campaign Scanner**:
  - Added camera-based QR scanner modal in `apps/wallet` to scan counter posters and immediately claim cards without leaving the PWA.
- **Account Management & Autonomous Deletion**:
  - Added `ProfileModal` in both `apps/web` and `apps/wallet` for personal detail editing and account deletion (`DELETE /api/v1/auth/account`).
- **Resend Email Service & Verification Reminders**:
  - Direct integration with Resend REST API for reliable verification and password recovery emails.
  - Added home screen reminder banner for unverified consumer accounts with 1-tap resend.
- **Postman CI/CD Automated Test Suite**:
  - Added complete Postman Collection E2E testing suite running against ephemeral SQLite/PostgreSQL in GitHub Actions.

---

### 🐛 Bug Fixes & Refinements
- **Account Re-Registration After Deletion**:
  - Soft-deleted user emails are now automatically anonymized (`deleted_<uuid>_<email>`), liberating the unique email constraint so users can re-register anytime.
- **Campaign QR Poster URLs**:
  - Fixed QR code generation in `CampaignsPage.tsx` so counter posters output direct wallet claim URLs (`wallet.alpacard.app/claim/:id` / `dev-wallet.alpacard.app/claim/:id`) instead of merchant URLs.
  - Added automatic fallback redirects in `apps/web` for any previously scanned URLs.
- **Top Navigation Responsive Layout & Overflow**:
  - Refactored `Layout.tsx` header to fluid width with multi-tier breakpoints (`2xl:` desktop bar, `<2xl` secondary sub-bar).
  - Prevented horizontal scrollbar activation in Spanish (`overflow-x: hidden`).
  - Added pointer cursor styling across all interactive buttons, mode toggles, and language selectors.
- **Campaigns & Staff Empty States**:
  - Resolved infinite loading spinner when a business has 0 campaigns or staff members. Displayed clean empty states with quick-action creation buttons.
- **Merchant Subdomain Routing**:
  - Enforced strict routing from root/marketing domains directly to `merchant.alpacard.app` upon merchant login.

---

### 📦 Infrastructure & DevOps
- **Kubernetes Ingress & Helm Alignment**:
  - Synced production ingress rules in `alpacard` and `alpacard-dev` namespaces to route subdomains cleanly with TLS certificates.
  - Configured CORS headers across all valid production and development subdomains.
- **Container Deployments**:
  - Automated deployment script `scripts/deploy-env.sh` updated to patch ConfigMaps, secrets, and ingress manifests on release rollout.

---

## [v2.1.0] - 2026-10-28

### ✨ Features
- **Role Isolation**: Strict separation between `CONSUMER` (Wallet) and `OWNER`/`STAFF` (Merchant Backoffice).
- **Toast Notifications**: Unified visual toast feedback with flash persistence across redirects and page loads.
- **Initial Verification Service**: Verification token dispatch upon registration with `?verified=true` celebration toasts.

---

## [v2.0.1] - 2026-10-27

### 🐛 Bug Fixes
- **Mobile Navigation Header**: Streamlined top bar layout for compact screens (iPhone 16 Pro Max / Android).
- **Dark Mode Surface & Typography Mapping**: Eliminated low-contrast elements across all UI views.
- **Documentation & QA Release Governance**: Formalized master test plan and wiki specifications.
