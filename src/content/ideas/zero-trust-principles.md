---
title: Zero Trust as Verify-Everywhere, Not VPN Replacement
summary: Zero trust means every request is authenticated and authorized regardless of network location.
source:
  type: article
  title: "NIST SP 800-207 Zero Trust Architecture"
  author: NIST
  url: https://csrc.nist.gov/publications/detail/sp/800-207/final
  consumed_on: 2026-06-01
takeaways:
  - Identity is the new perimeter — network segmentation alone does not constitute zero trust.
  - Policy decisions should be made per-request with continuous validation of device and user posture.
  - Micro-segmentation limits blast radius but only works when paired with strong identity governance.
  - Logging and telemetry from policy enforcement points are mandatory for incident reconstruction.
tags:
  - zero-trust
  - identity
maturity: budding
added: 2026-06-03
updated: 2026-06-10
related:
  - attack-tree-analysis
quotes:
  - "Zero trust assumes there is no implicit trust granted to assets or user accounts based solely on their physical or network location."
---

Zero trust gets marketed as "replace your VPN" but the NIST model is broader: it's an architecture where trust is never implicit. Every access decision should be explicit, logged, and revocable.

## What changed my thinking

I used to treat the corporate network as a safe zone. Zero trust reframes every service as internet-facing from a policy perspective. That shift makes attack trees more useful — you model paths assuming the attacker is already inside.

## Practical rollout

Start with a high-value application and enforce device posture checks at the policy enforcement point. Don't boil the ocean. Measure policy decision latency before expanding scope — users will reject zero trust if every click adds two seconds.

## Open questions

I'm still working through how zero trust applies to legacy OT environments where continuous posture assessment isn't feasible. That's why this entry is budding, not evergreen.
