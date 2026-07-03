---
title: Delete API E2E Test
summary: This temporary note proves that the Tailnet delete API commits and pushes removals to main.
source:
  type: other
  title: "Tailnet delete API test"
  author: Hermes
  consumed_on: 2026-07-03
takeaways:
  - The delete endpoint must publish the removal to GitHub main so Vercel can redeploy without the article.
  - The delete endpoint must validate and build before it reports that deletion succeeded.
tags:
  - testing
maturity: seedling
added: 2026-07-03
updated: 2026-07-03
---

This temporary note exists only to verify the complete delete path. It should be committed to main briefly, then removed through the Tailnet-only delete API, which must validate the content graph, build the Astro site, commit the deletion, and push it to GitHub main.
