# 🔐 Cryptographic Security & Anti-Fraud Architecture

Physical paper punch cards suffer from rampant fraud: customers forge rubber stamps, cashiers give unauthorized free stamps to friends, and lost cards cannot be audited.

Alpacard addresses every vector of digital and physical loyalty fraud through **cryptographic token rotation, atomic ledger consistency, and strict single-use nonce validation**.

---

## 🛡️ Threat Model & Mitigations

| Threat Vector | Attack Scenario | Traditional Risk | Alpacard Mitigation |
| :--- | :--- | :--- | :--- |
| **Screenshot Sharing** | Customer takes a screenshot of their QR code and shares it with friends or posts it online. | Unlimited free stamps claimed across multiple visits. | **Rotating 30-second Token Window**: QR payload changes every 30s. Expired tokens are rejected with `HTTP 401 Unauthorized: Token Expired`. |
| **Replay Attack** | Customer prints an old QR code or records a video of their phone screen. | Token used repeatedly over time. | **JTI Nonce Invalidation**: Every token contains a cryptographically random unique nonce (`jti`). Once consumed, it is permanently logged in PostgreSQL; duplicates return `HTTP 409 Conflict: JTI Already Consumed`. |
| **Race Condition / Double-Scan** | Two cashiers scan the same customer QR code simultaneously at separate terminals. | Card receives double stamps for a single coffee purchase. | **Row-Level Transaction Locks**: PostgreSQL executes `SELECT * FROM cards WHERE id = $1 FOR UPDATE`, serializing write transactions cleanly. |
| **Token Tampering / MITM** | Attacker intercepts QR data and modifies payload to increment their own balance or change card ID. | Fraudulent reward unlocks without merchant validation. | **HMAC-SHA256 Signatures**: Tokens are signed with a server secret or shared card key. Any modified byte fails signature validation (`signature is invalid`). |
| **Cashier Collusion** | Rogue employee repeatedly stamps a card without an actual purchase. | Merchant loses inventory to fake redemptions. | **Rate-Limiting & Audit Ledger**: Append-only PostgreSQL transaction ledger records exact timestamp, cashier station ID, and rate-limits rapid successive scans. |

---

## 🧬 Dynamic Token Structure

The customer's mobile wallet generates a rotating JSON Web Token (JWT) signed with HMAC-SHA256:

### 1. Token Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### 2. Token Claims Payload
```json
{
  "card_id": "c7a8b291-3e45-4a12-87f1-09d3b24f5a6b",
  "jti": "nonce_7f8a9b2c3d4e5f6a",
  "iat": 1793056800,
  "exp": 1793056830
}
```

* `card_id`: Canonical UUID of the customer loyalty card.
* `jti`: Cryptographically random 128-bit hex string acting as an anti-replay nonce.
* `iat`: Unix timestamp when the token was rendered on the customer's phone.
* `exp`: Unix timestamp (strictly `iat + 30s`) after which the server will reject the scan.

---

## 🔒 Atomic Scan Verification Algorithm

When the cashier terminal scans a customer's dynamic QR code, the Go backend executes the following atomic database transaction:

```go
func (h *StampHandler) ScanStamp(w http.ResponseWriter, r *http.Request) {
    // 1. Parse and verify HMAC signature
    tokenString := req.Token
    token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, keyFunc)
    if err != nil || !token.Valid {
        http.Error(w, "Invalid token signature or expired", http.StatusUnauthorized)
        return
    }

    claims := token.Claims.(*CustomClaims)

    // 2. Begin atomic PostgreSQL transaction
    tx, err := h.db.Begin(r.Context())
    if err != nil {
        http.Error(w, "Transaction start failure", http.StatusInternalServerError)
        return
    }
    defer tx.Rollback(r.Context())

    // 3. Acquire exclusive row-level lock on the card
    var currentStamps int
    var maxStamps int
    err = tx.QueryRow(r.Context(),
        `SELECT stamps, max_stamps FROM cards WHERE id = $1 FOR UPDATE`,
        claims.CardID,
    ).Scan(&currentStamps, &maxStamps)
    if err != nil {
        http.Error(w, "Card not found", http.StatusNotFound)
        return
    }

    // 4. Enforce JTI single-use nonce consumption
    _, err = tx.Exec(r.Context(),
        `INSERT INTO consumed_tokens (jti, card_id, consumed_at) VALUES ($1, $2, NOW())`,
        claims.JTI, claims.CardID,
    )
    if err != nil {
        // Unique constraint violation on jti means replay attack
        http.Error(w, "HTTP 409 Conflict: JTI Already Consumed (Replay Detected)", http.StatusConflict)
        return
    }

    // 5. Update card balance & append to immutable audit ledger
    newStamps := currentStamps + 1
    action := "EARN"
    if currentStamps >= maxStamps {
        newStamps = 0
        action = "REDEEM"
    }

    _, err = tx.Exec(r.Context(),
        `UPDATE cards SET stamps = $1, updated_at = NOW() WHERE id = $2`,
        newStamps, claims.CardID,
    )
    _, err = tx.Exec(r.Context(),
        `INSERT INTO stamp_ledger (id, card_id, jti, action, balance_after, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
        claims.CardID, claims.JTI, action, newStamps,
    )

    // 6. Commit atomic transaction
    if err := tx.Commit(r.Context()); err != nil {
        http.Error(w, "Failed to commit ledger", http.StatusInternalServerError)
        return
    }

    // 7. Emit async event to RabbitMQ for analytics
    h.eventPublisher.PublishStampEvent(claims.CardID, action, newStamps)
}
```

---

## 🛡️ Client-Side Session Defense & Card Protection

To prevent accidental card loss when customers refresh their browser or switch tabs, Alpacard uses **multi-tier local storage defense**:

1. **Dual Storage (`localStorage` + `HTTP Cookies`)**:
   - The card UUID is stored in browser `localStorage`.
   - In parallel, it is written to a persistent cookie with `SameSite=Lax` and a **1-year lifespan** (`Max-Age=31536000`).
   - If a customer clears browser local cache, the cookie automatically re-hydrates their loyalty card upon their next visit.
2. **PWA Standalone Mode**:
   - When installed as a mobile PWA, card credentials reside inside the isolated sandbox of the mobile OS home-screen container, shielding them from general browser tab sweeps.
