---
title: Software Supply Chain as an Adversary Playbook
summary: Modern breaches increasingly enter through dependencies and build pipelines rather than production apps.
source:
  type: paper
  title: "SLSA Framework v1.0"
  author: OpenSSF
  url: https://slsa.dev/spec/v1.0/
  consumed_on: 2026-06-08
takeaways:
  - Unsigned artifacts in CI/CD are equivalent to unauthenticated API endpoints on your network.
  - Dependency confusion attacks exploit package naming gaps faster than most teams patch.
  - Provenance metadata lets you answer which commit produced the binary running in production.
tags:
  - supply-chain
  - devsecops
maturity: seedling
added: 2026-06-09
updated: 2026-06-11
related:
  - zero-trust-principles
---

Supply chain security stopped being a niche concern when SolarWinds made it front-page news. SLSA gives a maturity ladder for build integrity that I find more actionable than vague "scan your dependencies" advice.

## Early observations

Most teams I audit have SCA tools running but no signed provenance on release artifacts. They can tell you a vulnerable library exists but not whether the deployed container actually contains it.

## Next steps for me

I want to map our release pipeline to SLSA Level 2 requirements and identify the cheapest gap to close first — likely signed builds in CI. This entry is a seedling because I haven't validated our current state yet.

## Link to zero trust

If identity is the perimeter for runtime access, provenance is the perimeter for *what* gets deployed. Both assume nothing is trustworthy by default.
