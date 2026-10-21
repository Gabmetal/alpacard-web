# Reddit Post Template: r/selfhosted

**Subreddit**: `r/selfhosted`  
**Flair**: `Self-Promotion` or `Open Source`  
**Best Time**: Tuesday – Thursday at 08:30 – 10:30 AM EST  

---

### Title:
> **I built Alpacard: An open-source, self-hosted digital loyalty punch card & menu platform for local coffee shops and businesses (Go + React PWA)**

---

### Body:

Hey r/selfhosted!

Like many of you, I have friends and family who run small independent businesses—bakeries, coffee shops, food trucks, and barbershops. Almost all of them either:
1. Use flimsy paper punch cards that customers constantly lose or forget at home.
2. Or get charged **$60 – $150/month** by predatory loyalty SaaS platforms that force customers to download heavy 100MB apps just to get a 10th coffee free.

I decided to build an open-source, self-hosted alternative: **Alpacard**.

- **GitHub**: https://github.com/Gabmetal/alpacard-web
- **Live Demo (Merchant Backoffice)**: https://alpacard.gabo.lat
- **Live Demo (Customer Wallet PWA)**: https://alpacard.gabo.lat/wallet
- **Interactive Sandbox**: https://alpacard.gabo.lat/demo

---

### 💡 Key Design Decisions & Features:

1. **Zero App Store Download for Customers**:
   - Customers scan a counter QR code directly with their standard phone camera (iOS or Android).
   - An instant, anonymous PWA wallet is generated in `localStorage`/IndexedDB via guest JWTs. No filling out forms while in line!
   - Customers can optionally register anytime to sync their stamps across multiple devices.

2. **Tamper-Proof Single-Use Anti-Replay Tokens**:
   - The customer's loyalty card displays a dynamic rotating QR code with a 5-minute cryptographic token containing a unique JTI nonce.
   - An atomic PostgreSQL transaction validates and burns the token on scan. Screenshots or duplicated tokens are rejected with a 409 Conflict.

3. **Universal Camera Scanner**:
   - Cashiers and staff scan customer cards directly from their phone camera or tablet browser without needing proprietary barcode hardware.

4. **Integrated Business Menus**:
   - Supports external menu links (Drive, website), 10MB PDF/image upload with an in-wallet viewer, or a built-in digital item builder. Customers can tap `[ View Menu ]` right on the punch card.

5. **Ultra-Low Memory Footprint**:
   - Backend is written in **Go 1.22+** (Chi router + GORM + standard library JWTs). The static binary consumes only **~20MB of RAM**, making it extremely lightweight to run on homelab Raspberry Pis, k3s clusters, or small VPS instances.
   - Frontend is built with React 18, Vite, and Tailwind with a refined, sober artisan aesthetic (alabaster, roasted espresso brown, warm stone).

---

### 🐳 Quickstart (Docker Compose):

```bash
git clone https://github.com/Gabmetal/alpacard-web.git
cd alpacard-web
docker compose -f deploy/docker-compose.yml up -d
```
That’s it! It spins up PostgreSQL, RabbitMQ, the Go REST API, and both frontends. We also include pre-configured **Kubernetes / Helm / k3s** manifests in `deploy/`.

---

### 🤝 Looking for Contributors & Beta Testers!

The project is 100% open-source under the **MIT License**. I would love for the community to try it out, self-host it for local shops, and help test edge cases!

Some things on our immediate roadmap:
- Apple Wallet `.pkpass` and Google Wallet pass generator.
- Web Push notifications when a stamp is awarded or reward unlocked.
- Additional language translations.

I'd love to hear your feedback, thoughts on the architecture, and feature ideas!
