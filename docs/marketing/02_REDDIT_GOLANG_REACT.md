# Reddit Technical Posts: r/golang & r/reactjs

---

## 1. Post for `r/golang`

**Subreddit**: `r/golang`  
**Flair**: `Project`  
**Title**:
> **Built an open-source loyalty card platform with Go 1.22: 20MB RAM, atomic anti-replay token validation, and RabbitMQ event streaming**

### Body:
Hey gophers!

I wanted to share an open-source project I’ve been working on called **Alpacard**—a self-hosted loyalty punch card platform designed as an alternative to expensive SaaS solutions for coffee shops and local businesses.

- **Repo**: https://github.com/Gabmetal/alpacard-web
- **API code**: `apps/api/` (Chi, GORM, native JWTs, RabbitMQ)
- **Live Demo**: https://alpacard.gabo.lat

### Highlights from the Go Backend:
1. **Lightweight Concurrency & Low Memory**:
   - The compiled static binary runs comfortably with **~18–25MB of RAM**, making it trivial to run on resource-constrained homelab nodes alongside other workloads.
2. **Preventing Replay Attacks**:
   - Customer punch cards generate dynamic 5-minute cryptographic tokens with a unique `jti`.
   - On the cashier scan endpoint (`/api/v1/stamps/scan`), we use atomic database transactions with row-level locks to check if the `jti` has already been recorded in a dedicated redemption ledger before incrementing stamps. A second scan attempt yields an immediate `409 Conflict`.
3. **Event-Driven Architecture**:
   - Every stamp issued or reward redeemed is published to a RabbitMQ exchange (`events_exchange`). A separate Go worker consumes these events for auditing, real-time metrics, and webhook dispatching.
4. **SQLite + PostgreSQL Dual Support**:
   - Auto-migrates with PostgreSQL for production, and automatically falls back to embedded SQLite for zero-config local development (`go run cmd/server/main.go`).

Feedback and PRs are very welcome! If anyone is interested in helping build an Apple Wallet `.pkpass` generator in Go, let me know!

---

## 2. Post for `r/reactjs` & `r/webdev`

**Subreddit**: `r/reactjs` or `r/webdev`  
**Flair**: `Showcase`  
**Title**:
> **Building an offline-first PWA punch card with camera QR scanning, zero app store friction, and a sober coffee-artisan UI (React 18 + Vite + Tailwind)**

### Body:
Hey everyone!

Most loyalty programs fail at local coffee shops because no customer wants to download a 100MB native app or fill out a 5-step registration form while holding a hot latte in line.

We built **Alpacard**, an open-source, mobile-first PWA:
- **Repo**: https://github.com/Gabmetal/alpacard-web
- **Live Wallet**: https://alpacard.gabo.lat/wallet
- **Interactive Sandbox**: https://alpacard.gabo.lat/demo

### Frontend Highlights:
- **1-Click Guest Onboarding**:
  - Scanning a tabletop QR code instantly creates an anonymous guest wallet in `localStorage`/IndexedDB. No password required at checkout.
- **Universal Camera Scanning**:
  - Uses the native HTML5 Barcode Detection API with automatic fallbacks so cashiers can scan cards right from their mobile browser without native plugins.
- **Live Background Autoupdate & Chimes**:
  - Uses Web Audio API synth chimes and Web Vibration API haptics to celebrate when a stamp is awarded or reward redeemed, with background polling that pauses when the tab is blurred.
- **Sober, Non-AI Aesthetic**:
  - Replaced the typical neon crypto gradients with warm alabaster (`#FAF8F5`), roasted espresso brown (`#3D2B1F`), and stone contrasts.

Take a look at the repo and feel free to suggest improvements or contribute!
