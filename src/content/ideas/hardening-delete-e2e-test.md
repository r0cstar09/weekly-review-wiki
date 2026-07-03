---
title: Hardening Delete E2E Test
summary: This temporary note verifies the hardened Tailnet delete API after the second issue pass.
source:
  type: other
  title: "Tailnet delete API hardening test"
  author: Hermes
  consumed_on: 2026-07-03
takeaways:
  - The hardened delete API should reject bad browser origins and only reveal controls through the fixed Tailnet endpoint.
  - The delete API should still validate, build, commit, and push removals to main after the hardening pass.
tags:
  - testing
maturity: seedling
added: 2026-07-03
updated: 2026-07-03
---

This temporary note verifies that the second hardening pass did not break the actual delete flow. It should be committed briefly and then removed through the live Tailnet API, producing a new pushed commit and a Vercel redeploy where the route disappears.
