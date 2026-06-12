---
title: Secure Defaults Reduce Review Load
summary: Strong defaults make weekly review easier by shrinking the number of exceptional decisions.
source:
  type: book
  title: "Secure by Design"
  author: Dan Bergh Johnsson, Daniel Deogun, and Daniel Sawano
  consumed_on: 2026-02-18
takeaways:
  - Defaults should make the common safe path easier than the risky path.
  - Review meetings should focus on exceptions because defaults have already handled routine cases.
  - When the same exception appears repeatedly, the default probably needs to change.
tags:
  - secure-by-design
  - governance
maturity: evergreen
added: 2026-02-19
updated: 2026-03-05
related:
  - security-review-cadence
---

Secure defaults are one of the best ways to reduce the amount of security work that depends on memory. If the default project template already includes logging, least-privilege service accounts, dependency scanning, and protected branches, then the weekly review can spend less time rediscovering the same missing basics.

The useful signal in review is the exception. Why did this team need a broader permission? Why was this service deployed without the normal control? Was the exception legitimate, or did the default make the safe path too hard?

Repeated exceptions are design feedback. If people keep bypassing a control, the review should not only ask who approved it. It should ask whether the default needs to become easier, clearer, or more flexible.
