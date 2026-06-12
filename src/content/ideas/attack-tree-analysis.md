---
title: Attack Trees for Structured Threat Modeling
summary: Attack trees turn vague security worries into a hierarchy of concrete, testable adversary goals.
source:
  type: book
  title: "Security Engineering (3rd ed.)"
  author: Ross Anderson
  consumed_on: 2026-05-20
takeaways:
  - An attack tree decomposes a high-level adversary goal into sub-goals that can be independently assessed.
  - Leaf nodes should map to specific controls, tests, or monitoring signals you can actually verify.
  - Quantitative risk scoring on trees only works when leaf probabilities are grounded in evidence, not gut feel.
  - Revisit trees after incidents — real breaches often reveal branches you never modeled.
tags:
  - threat-modeling
  - security-engineering
maturity: evergreen
added: 2026-05-22
updated: 2026-06-08
quotes:
  - "Security is a process, not a product — and attack trees make that process visible."
---

Attack trees are one of the most practical artifacts in threat modeling because they force you to articulate *what* an attacker wants before debating *how* they might get it. I use them whenever a stakeholder says "we need to secure the API" without defining the adversary.

## How I build one

Start with a single root node: the adversary's ultimate goal (e.g., "exfiltrate customer PII"). Branch into intermediate goals ("gain database access", "bypass authentication") and keep decomposing until every leaf is actionable. A leaf should answer: *can we detect this? can we prevent this? have we tested this?*

## Where they fail

Teams sometimes treat attack trees as one-time documentation. They rot. The best practice I've adopted is linking each leaf to a ticket, control ID, or SIEM rule. When the leaf has no owner, the tree is just wallpaper.

## Connection to weekly review

During weekly security reviews, I pick one branch per week and verify the linked control still exists and still works. This turns an abstract diagram into a living checklist.
