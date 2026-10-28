/* Grad-IQ public demo site configuration. Edit prices and links here, in one place.
   PRICES: regular price per product key (USD). Bundle and full-suite "bought separately" totals and % off are
     calculated from the single-tool prices automatically.
   LAUNCH_PRICE_ACTIVE / LAUNCH_PRICE / LAUNCH_PRICE_ENDS: full-suite launch sale. The sale price shows (with the
     regular price struck through) while ACTIVE is true and the visitor's local date is on or before ENDS (inclusive).
     After that date the hub goes back to the regular price automatically.
   BUY_URLS: checkout link per product key. Empty = show "Coming soon" (no link).
   SELL_URL: where students can offer their gown back to Grad-IQ. Empty = plain "Contact Grad-IQ" text. */
window.GRADIQ_CONFIG = {
  SELL_URL: "",
  SELL_CONTACT_TEXT: "Contact Grad-IQ",
  USED_PRICE_LOW: 250,
  USED_PRICE_HIGH: 300,
  BUYBACK_PRICE: 125,
  LAUNCH_PRICE_ACTIVE: true,
  LAUNCH_PRICE: 34.99,
  LAUNCH_PRICE_ENDS: "2026-10-30",
  PRICES: {
    "stipend-budget": 9,
    "stipend-tax": 9,
    "loan-gap": 9,
    "loan-repayment": 7,
    "emergency-fund": 5,
    "basic-needs": 5,
    "spaced-practice": 7,
    "deep-work": 7,
    "defense-countdown": 5,
    "admissions-tracker": 7,
    "stress-checkin": 5,
    "advisor-log": 5,
    "regalia-calculator": 9,
    "milestones": 7,
    "job-search": 7,
    "paycheck": 7,
    "reset-30": 7,
    "meal-plan": 7,
    "brain-dump": 7,
    "debt-countdown": 9,
    "move-planner": 7,
    "bundle-budget-money": 24,
    "bundle-study-time": 19,
    "bundle-stress-support": 8,
    "bundle-graduation-regalia": 15,
    "full-suite": 49.99
  },
  BUY_URLS: {
    "stipend-budget": "",
    "stipend-tax": "",
    "loan-gap": "",
    "loan-repayment": "",
    "emergency-fund": "",
    "basic-needs": "",
    "spaced-practice": "",
    "deep-work": "",
    "defense-countdown": "",
    "admissions-tracker": "",
    "stress-checkin": "",
    "advisor-log": "",
    "regalia-calculator": "",
    "milestones": "",
    "job-search": "",
    "paycheck": "",
    "reset-30": "",
    "meal-plan": "",
    "brain-dump": "",
    "debt-countdown": "",
    "move-planner": "",
    "bundle-budget-money": "",
    "bundle-study-time": "",
    "bundle-stress-support": "",
    "bundle-graduation-regalia": "",
    "full-suite": ""
  }
};
