---
title: Access Review Patterns That Catch Drift
summary: Access reviews catch more risk when they focus on entitlement drift and business context.
source:
  type: paper
  title: "Identity governance field notes"
  author: Unknown
  consumed_on: 2026-04-03
takeaways:
  - Access reviews should compare current permissions against role intent, recent activity, and ownership changes.
  - Dormant access is a signal that the permission may be unnecessary even when it was once approved.
  - Exceptions need expiration dates so temporary access does not become permanent infrastructure.
tags:
  - identity
  - governance
maturity: budding
added: 2026-04-04
updated: 2026-04-26
related:
  - zero-trust-principles
---

Access reviews are often too shallow because they ask managers to approve a list of names and roles without enough context. The better question is whether the access still matches the work. That means showing role intent, recent use, application owner, and any exception that granted the permission.

The review should pay special attention to drift. A user who changed teams, a service account with no recent owner, or a permission that has not been used in months may be more interesting than a newly requested grant. Dormancy is not proof of risk, but it is a reason to ask why the access remains.

The strongest pattern is expiration. Temporary access should have a date when it disappears unless someone renews it with a reason.
