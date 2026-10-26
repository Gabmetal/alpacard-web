# 💼 Merchant & Cashier Operational Guide

This guide covers the merchant backoffice setup, loyalty campaign customization, and daily cashier point-of-sale scanning procedures.

---

## ☕ 1. Setting Up Your Loyalty Program

Merchants configure their branded digital loyalty experience via the **Merchant Portal** at [https://alpacard.app](https://alpacard.app) (or [https://dev.alpacard.app](https://dev.alpacard.app) in QA).

### Program Parameters
* **Business Name & Slug**: Unique URL path for customer card issuance (e.g., `alpacard.app/claim?biz=cafe-alpaca`).
* **Stamp Threshold**: Number of stamps required to unlock a free reward (typically 6, 8, or 10 stamps).
* **Reward Title**: The reward earned by loyal customers (e.g., *"Free Specialty Coffee or Pastry"*).
* **Theme Color**: Primary brand hex code that skins the customer's digital card (e.g., `#3D2B1F` for artisan roast, `#10B981` for matcha bar).
* **Stamp Icon**: Canonical brand icon displayed inside each punch hole:
  * ☕ `coffee` (Cafés & Espresso bars)
  * 🍕 `pizza` (Pizzerias & Trattorias)
  * ✂️ `scissors` (Barbershops & Hair salons)
  * 🌮 `taco` (Taquerias & Mexican food)
  * 🥐 `bakery` (Artisan bakeries & Pastry shops)
  * 📚 `book` (Independent bookstores)
  * 🍦 `ice-cream` (Gelaterias)

---

## 📷 2. Cashier Scanner Interface (`/scanner`)

The Cashier Scanner is an ultra-fast, responsive web camera interface designed for tablet counters, POS hardware, or staff smartphones.

```
+-------------------------------------------------------+
|  Escáner de Fidelidad                     [ En línea ]|
|  Apunta la cámara al QR dinámico del cliente          |
|                                                       |
|  +-------------------------------------------------+  |
|  |  [⚡ Auto]                           [1.0x]     |  |
|  |                                                 |  |
|  |             +---------------------+             |  |
|  |             |  ┌               ┐  |             |  |
|  |             |      [ SCAN ]       |             |  |
|  |             |  └               ┘  |             |  |
|  |             +---------------------+             |  |
|  |                                                 |  |
|  +-------------------------------------------------+  |
|                                                       |
|  🔊 Sonido y vibración háptica activados              |
+-------------------------------------------------------+
```

### Hardware Controls & Ergonomics
1. **Torch / Linterna (`⚡ Auto`)**: Activates device LED flash on mobile phones to scan in dim lighting.
2. **Zoom Toggle (`1.0x / 2.0x`)**: Enables digital zoom on counter tablets when the customer holds their phone slightly away.
3. **Instant Audio & Haptic Feedback**:
   * **Success Chime (880 Hz harmonic beep + double vibration `[100ms, 50ms, 100ms]`):** Card credited or reward unlocked.
   * **Rejection Tone (220 Hz low buzz + continuous vibration `[300ms]`):** Token expired or duplicate replay detected.

---

## 🔄 3. Daily Cashier Workflows

### Scenario A: Awarding a Standard Stamp (+1)
1. Customer presents their smartphone showing their dynamic Alpacard punch card.
2. Cashier holds the scanner over the customer's QR code.
3. Within 150 milliseconds:
   * Screen flashes dark roast brown (`#2C221E`).
   * Displays checkmark and updated balance: **`Nuevo Balance: X Sellos`**.
   * Success chime sounds and device vibrates.
4. Cashier hands the order to the customer.

---

### Scenario B: Redeeming a Free Reward (Milestone Hit)
1. When a customer reaches their target (e.g., 10 stamps), the card displays an animated golden glow.
2. Cashier scans the customer's QR code.
3. The scanner displays an emerald green celebration screen (`bg-emerald-900`) with bouncing sparkles:
   * **`¡Premio Canjeado con Éxito!`**
   * **`Café de Especialidad Gratis`**
   * **`Nuevo Balance: 0 Sellos`**
4. The customer's balance is reset to 0 in PostgreSQL, and the cashier provides the free promotional item.

---

### Scenario C: Troubleshooting Scan Errors
* **`HTTP 401: Token Expired`**: The customer has had their QR code open for longer than 30 seconds without refreshing. Ask the customer to tap the screen or wait 2 seconds for the automated rotating countdown timer to generate a fresh token.
* **`HTTP 409: JTI Already Consumed (Replay Detected)`**: The customer tried to scan a screenshot or printed copy that has already been credited. Ask the customer to open the live Alpacard web page.
