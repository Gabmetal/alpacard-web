# Reddit Post Template: Beta Testers & QA Hunt

**Subreddits**:
- `r/SideProject`
- `r/AlphaAndBetaUsers`
- `r/testmyapp`

---

### Title:
> **Need help testing our open-source digital loyalty punch card across different phone cameras and browsers! (No signup needed)**

---

### Body:

Hey everyone!

We’re building **Alpacard**—a 100% open-source alternative to expensive loyalty card apps for local coffee shops, bakeries, and indie stores.

Instead of paper punch cards that get lost, customers scan a QR code with their regular phone camera, and their card immediately opens in their browser wallet.

- **Interactive Live Demo**: https://alpacard.app/demo
- **Live Wallet**: https://alpacard.app/wallet
- **GitHub**: https://github.com/alpacard/alpacard-web

### What we need help testing:

1. **Camera QR Scanning**:
   - Does your native phone camera (iOS Camera or Android Google Lens / Samsung Camera) detect and open the loyalty card QR smoothly?
2. **Replay-Attack Simulation**:
   - In the interactive demo (`/demo`), try clicking *"Simulate Replay Attack"* or scanning twice to see if the security lock triggers.
3. **PWA Installability**:
   - On iOS Safari ("Add to Home Screen") or Android Chrome ("Install App"), does the app icon and splash screen look crisp?
4. **Different Screen Sizes**:
   - Does anything look cut off on small or foldable phone screens?

Please leave a comment with your **Device model + Browser** and any issues or suggestions you encountered!

Thank you for helping us support independent local businesses!
