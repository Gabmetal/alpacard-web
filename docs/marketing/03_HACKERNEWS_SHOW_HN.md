# Hacker News Post: Show HN

**Site**: https://news.ycombinator.com/submit  
**Title**:
> **Show HN: Alpacard – Open-source digital loyalty punch cards for local shops**

**URL**: `https://alpacard.gabo.lat`  
*(Or submit as text post if providing full context)*

---

### Text Body (if submitted as text or top comment):

Hi HN! I’m Gabo, and I built **Alpacard**: an open-source, self-hosted digital loyalty punch card platform.

- **Demo**: https://alpacard.gabo.lat
- **Wallet PWA**: https://alpacard.gabo.lat/wallet
- **Code**: https://github.com/Gabmetal/alpacard-web

### Why build this?
Independent coffee shops, bakeries, and food trucks have two bad options for loyalty programs:
1. Paper punch cards: Cheap, but 80% are lost, forgotten at home, or run through the wash.
2. Proprietary SaaS platforms: They charge \$60–\$150/month to small merchants, track invasive consumer data, and demand that customers install a 100MB native app before ordering.

Alpacard is built on three simple principles:
1. **Zero Customer Friction**: Customers scan a counter QR with their regular phone camera. An anonymous PWA wallet is generated instantly in local storage. No email or password needed in line.
2. **Anti-Replay Fraud Protection**: Dynamic rotating QR codes with 5-minute cryptographic tokens. Atomic database transactions ensure a single-use JTI cannot be redeemed twice or screenshot-shared.
3. **Low-Resource Self-Hosting**: Built with Go 1.22 (Chi, GORM, native JWTs) and React 18 / Tailwind. The static Go binary runs in ~20MB of RAM on any homelab, VPS, or Raspberry Pi.

I’d love to hear your thoughts on the architecture, UX, and how small merchants in your neighborhood handle loyalty. The project is 100% open-source under GNU AGPLv3.
