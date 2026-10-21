# Dev.to / Hashnode Publication Article

**Title**: Building an Open-Source Digital Loyalty Card Platform: Why We Ditched SaaS for Go and React PWA  
**Cover Image**: (Use hero screenshot from `https://alpacard.gabo.lat`)  
**Tags**: `#opensource`, `#golang`, `#react`, `#webdev`  

---

## The Problem with Modern Loyalty Programs

Next time you order an espresso or pick up a croissant at your favorite indie bakery, watch the checkout interaction. 

Either the barista hands the customer a flimsy stamped paper card that will inevitably end up lost in a drawer, or there’s an awkward sign saying: *"Download our app on the App Store to earn points!"*

Nobody standing in line wants to download a 120MB app, create an account, verify their email, and configure push notifications just to get a punch card for a $4 coffee.

On the flip side, small business owners are being charged **$60 to $150 every month** by proprietary SaaS loyalty providers. For an indie coffee shop, that’s hundreds of cups of coffee just to cover the cost of digital punch cards.

We decided to build an open-source, self-hosted alternative: **[Alpacard](https://github.com/Gabmetal/alpacard-web)**.

---

## Key Architectural Goals

When designing Alpacard, we had three non-negotiable rules:

1. **Frictionless Customer Experience**: The customer must be able to scan a QR code with their default camera app and see their card in under 2 seconds—without creating an account.
2. **Mathematically Impossible Fraud**: Unlike static paper cards or screenshot-able QR codes, stamps must be tamper-proof and single-use.
3. **Ultra-Low Resource Footprint**: The entire backend should run on a cheap \$5/month VPS or a Raspberry Pi without breaking a sweat.

---

## 1. Zero-Friction Onboarding with Guest PWAs

Instead of blocking the customer with a login wall at checkout, the counter QR code points to `/claim/:campaignId`.

When a customer scans it:
- The PWA checks `localStorage` for an existing token.
- If none exists, it calls `POST /api/v1/auth/guest` which provisions an anonymous `CONSUMER` JWT tied to a cryptographically random UUID.
- The card is minted in milliseconds, and the customer sees their new punch card immediately.
- Customers can link an email and password whenever they choose to sync across devices, but it is **never** required at the register.

```typescript
// Instant anonymous guest authentication
async function getOrCreateGuestToken(): Promise<string> {
  const existing = localStorage.getItem('alpacard_wallet_token');
  if (existing) return existing;

  const res = await fetch('/api/v1/auth/guest', { method: 'POST' });
  const data = await res.json();
  localStorage.setItem('alpacard_wallet_token', data.token);
  return data.token;
}
```

---

## 2. Preventing Replay Attacks with Single-Use JTI Tokens

If a customer shows a QR code to the cashier to receive a stamp, what prevents them from screenshotting that QR code and sharing it with 10 friends?

Alpacard solves this through **ephemeral anti-replay tokens**:
1. Every punch card generates a fresh JWT valid for only 300 seconds (5 minutes).
2. The payload contains a cryptographic UUID nonce (`jti`).
3. When the merchant scans the QR code, the Go API processes the scan inside an atomic database transaction with row-level locks.

```go
// Atomic single-use validation in Go
err := env.DB.Transaction(func(tx *gorm.DB) error {
    var existing models.ScanAudit
    if err := tx.Where("jti = ?", claims.Id).First(&existing).Error; err == nil {
        return errors.New("409_CONFLICT: Token already redeemed")
    }

    // Record audit ledger entry
    audit := models.ScanAudit{
        JTI:        claims.Id,
        CardID:     card.ID,
        ScannedAt:  time.Now(),
    }
    if err := tx.Create(&audit).Error; err != nil {
        return err
    }

    // Increment stamp
    card.Stamps++
    return tx.Save(&card).Error
})
```

If the customer or someone else attempts to scan the same QR code again, the database rejects it with an immediate `409 Conflict`.

---

## 3. High Performance on Tiny Footprints (Go + RabbitMQ)

The backend is built with **Go 1.22+**, using Chi for routing and GORM for database operations. 

- The compiled Go binary runs in just **~18–25MB of RAM**.
- Stamp events are published asynchronously to **RabbitMQ**, enabling instant cashier responses while decoupled workers handle audit logging and webhook notifications.

---

## 4. Universal Camera Scanning & Menus

We integrated the native **HTML5 Barcode Detection API** with graceful polyfills so staff can scan cards using an iPad, an Android phone, or any web browser without specialized hardware.

Merchants can also upload a PDF/image of their menu or use the built-in digital menu builder, allowing customers to browse items directly from their card.

---

## Try It or Get Involved!

Alpacard is 100% open-source under the MIT license. We welcome contributions, bug reports, and feedback from developers and small business owners alike!

- **GitHub Repository**: [https://github.com/Gabmetal/alpacard-web](https://github.com/Gabmetal/alpacard-web)
- **Live Demo**: [https://alpacard.gabo.lat](https://alpacard.gabo.lat)
- **Customer Wallet**: [https://alpacard.gabo.lat/wallet](https://alpacard.gabo.lat/wallet)

Feel free to star the repo and let us know what you think in the comments!
