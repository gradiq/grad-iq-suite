# Grad-IQ: planners for graduate students (public demo)

**Live demo:** https://saletra40-a11y.github.io/grad-iq-suite/

This repository is the **demo-only** public site for Grad-IQ by IQ Learning. There are 21 small planners for money, study time, stress and support, graduation, and the life admin around it (jobs, habits, meals, moving). Every page runs on fictional **sample data**.

- Nothing is saved. Edits last for the visit only and reset when you reload.
- Export, Import and Clear are not in the demo. Print works and adds a "DEMO · SAMPLE DATA" watermark.
- Every page has a banner that links to the full version.
- The Stress & support pages always show the 988 Suicide & Crisis Lifeline and a campus-counseling contact spot.
- There's no tracking, no analytics and no accounts.

The full versions (which save to the buyer's own browser and include Export, Import, Clear and Print) are sold separately as downloads. They are **not** in this repository.

## Configuration: `config.js`

| Setting | What it does |
|---|---|
| `PRICES` | Price per product key: the 21 tool slugs plus `bundle-budget-money`, `bundle-study-time`, `bundle-stress-support`, `bundle-graduation-regalia`, `full-suite`. The "bought separately" totals and % off are calculated from these. |
| `LAUNCH_PRICE_ACTIVE`, `LAUNCH_PRICE`, `LAUNCH_PRICE_ENDS` | Full-suite launch sale: $34.99 (regular $49.99 struck through) through `2026-10-30`, based on the visitor's local date. After that date, $49.99 shows automatically. |
| `BUY_URLS` | Checkout link per product key. An empty value shows "Coming soon" with no link. |
| `SELL_URL` | Where to offer a gown to the Grad-IQ buyback. An empty value shows "Contact Grad-IQ". |
| `USED_PRICE_LOW/HIGH`, `BUYBACK_PRICE` | Grad-IQ once-used regalia price range ($250–$300) and buyback offer ($125, subject to condition check). |

## Fonts

DM Sans and Fraunces are licensed under the SIL Open Font License 1.1 (see `assets/fonts/OFL-*.txt`).

© 2026 IQ Learning. Grad-IQ is a brand of IQ Learning. Planning tools only; not financial, tax, legal or medical advice.
