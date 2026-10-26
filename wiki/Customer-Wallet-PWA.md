# 💳 Customer Wallet PWA

The **Alpacard Customer Wallet** (`apps/wallet`) is an offline-first Progressive Web App designed to eliminate all friction between customers and local loyalty rewards.

---

## 🚀 Why Web PWA Beats Native Mobile Apps

Traditional loyalty programs fail because they demand too much customer effort:
1. Downloading a 120MB app from the Apple App Store or Google Play.
2. Creating an account, verifying email, and picking a password while waiting in line at the counter.
3. Granting push notification and location tracking permissions.

**The Alpacard Solution:**
* **Instant Onboarding**: The customer scans the counter QR code and their branded loyalty card appears on screen in under 2 seconds.
* **No Account Required**: Cards are provisioned instantly using anonymous UUIDs and cryptographically stored on the phone.
* **Storage Footprint**: Less than 300KB of cached static assets.

---

## 📱 Mobile Installation Experience

Alpacard includes tailored PWA install experiences for both major mobile platforms:

### 🤖 Android (Native Web App Prompt)
* Captures the browser's `beforeinstallprompt` event.
* Displays a branded banner: **`📲 Instalar Tarjeta en la Pantalla de Inicio`**.
* Clicking the button invokes the native operating system prompt, creating a standalone fullscreen app icon with no browser URL bar.

### 🍏 iOS Safari (Interactive Share-Sheet Visual Guide)
* iOS Safari does not support automated install prompt events.
* Alpacard detects iOS Safari and provides an interactive modal guide:
  1. *"Toca el botón Compartir (ícono de caja con flecha arriba en la barra de Safari)"*
  2. *"Desplázate hacia abajo y selecciona 'Agregar al inicio' (Add to Home Screen)"*
  3. *"Listo: tendrás tu tarjeta siempre accesible como una aplicación nativa."*

---

## 🔄 Dynamic Rotating Anti-Screenshot QR

To prevent customers from sharing screenshots of their loyalty cards, the wallet continuously rotates its QR token:

```
+------------------------------------+
|                                    |
|   +----------------------------+   |
|   |                            |   |
|   |         [ QR CODE ]        |   |
|   |                            |   |
|   +----------------------------+   |
|                                    |
|   🔄 Token dinámico de un solo uso |
|      Expira en: 00:24 seg          |
|                                    |
+------------------------------------+
```

* Every **30 seconds**, the wallet's internal timer invokes `generateDynamicToken()`.
* A new cryptographically random nonce (`jti`) is generated.
* The QR code updates smoothly with a subtle pulse animation.
* If a customer takes a screenshot, that screenshot will become invalid and rejected within 30 seconds.

---

## 🎶 Web Audio Harmonic Synthesizer

Rather than loading bulky `.mp3` or `.wav` sound files that can fail to buffer on cellular connections or stutter during background audio playback, Alpacard synthesizes tones in real time using the browser's native **Web Audio API**:

```typescript
// apps/web/src/utils/audio.ts & apps/wallet
export function playStampCelebrationSound(isEarn: boolean) {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const now = ctx.currentTime;

  if (isEarn) {
    // 3-tone ascending harmonic chime (E5 -> G#5 -> B5)
    [659.25, 830.61, 987.77].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  } else {
    // 4-chord triumphant fanfare on reward redemption
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.15, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.65);
    });
  }
}
```

* **Latency**: Instant (~2ms execution).
* **Asset Weight**: 0 bytes external network transfer.
* **Fidelity**: Crisp, harmonic chime identical across all operating systems.
