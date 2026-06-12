# Content Contract for AI Writing Agents

This wiki is built at compile time. **A malformed entry must fail `npm run build`**, never ship as a page. Follow this contract exactly.

## File location

One markdown file per idea:

```
src/content/ideas/<slug>.md
```

- `<slug>` = filename without `.md` (lowercase, hyphens, no spaces).
- Files prefixed with `_` (e.g. `_template.md`) are **ignored** by Astro — use them only as copy templates.

## Frontmatter schema (all required unless marked optional)

Use YAML. **No extra keys** — the Zod schema uses `.strict()` and rejects unknown fields.

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | 3–120 characters |
| `summary` | string | 10–200 chars, **one sentence**, the gist for lists/cards. Must **not** merely repeat `title` |
| `source` | object | See below |
| `takeaways` | string[] | 2–7 items, each a **complete standalone sentence**, ≥15 chars, no duplicates |
| `tags` | string[] | 1–6 items, **lowercase kebab-case** only: `^[a-z0-9-]+$` |
| `maturity` | enum | `seedling` \| `budding` \| `evergreen` |
| `added` | date | `YYYY-MM-DD` — first publication date |
| `updated` | date | `YYYY-MM-DD` — must be ≥ `added`, must not be in the future |
| `related` | string[]? | Optional slugs of other entries (powers backlinks) |
| `quotes` | string[]? | Optional verbatim notable quotes |

### `source` object (required, strict — no extra keys)

| Field | Type | Rules |
|-------|------|-------|
| `type` | enum | `book` \| `article` \| `paper` \| `youtube` \| `podcast` \| `conversation` \| `course` \| `other` |
| `title` | string | Title of the source material |
| `author` | string | Use `Unknown` if none |
| `url` | string? | Valid URL if present |
| `consumed_on` | date | `YYYY-MM-DD` — when the material was read/watched |

## Markdown body

- Free-form synthesis and longer notes.
- **Minimum 200 characters** (after trimming). No empty stubs.
- Not validated for structure beyond length — write clearly for humans.

## Maturity ladder (digital garden)

| Level | Emoji | Meaning |
|-------|-------|---------|
| `seedling` | 🌱 | Early note, barely formed, may change significantly |
| `budding` | 🌿 | Developing, partially validated, still gaps |
| `evergreen` | 🌳 | Stable, confident, repeatedly useful |

Promote maturity only when the content has survived real use.

## Tag rules

- Lowercase only.
- Kebab-case: words separated by single hyphens.
- Examples: `threat-modeling`, `zero-trust`, `devsecops`
- Invalid: `ThreatModeling`, `zero_trust`, `tag with spaces`

## Related links & backlinks

- Put slugs in `related` to link forward.
- **Every slug must exist** — dangling links fail validation.
- Do not link to yourself.
- Backlinks are computed automatically: if entry A lists B in `related`, B's page shows A under "Backlinks". You only link one direction.

## Validation

Run before committing:

```bash
npm run validate
```

This runs Zod-equivalent checks plus:

- `updated >= added`, both ≤ today
- All `related` slugs resolve
- Body ≥ 200 characters
- No duplicate or short takeaways
- Summary ≠ title (normalized)

`npm run build` runs `prebuild` → validate automatically.

## Entry template

Copy `src/content/ideas/_template.md` or use this worked example:

```markdown
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
tags:
  - threat-modeling
  - security-engineering
maturity: evergreen
added: 2026-05-22
updated: 2026-06-08
---

Attack trees are one of the most practical artifacts in threat modeling because they force you to articulate what an attacker wants before debating how they might get it. I use them whenever a stakeholder says "we need to secure the API" without defining the adversary.

Start with a single root node and branch until every leaf is actionable. Link each leaf to a ticket, control ID, or SIEM rule so the tree stays alive during weekly reviews.
```

## Weekly writing workflow

1. Read/consume source material.
2. Create `src/content/ideas/<slug>.md` following this contract.
3. Run `npm run validate` — fix every error (line-referenced).
4. Run `npm run build` to confirm Astro + Pagefind succeed.
5. Commit only when both pass.

## Failure mode (by design)

If you invent a field, skip a required field, use `Bad_Tag`, write a 50-character body, or link a nonexistent slug, **the build fails loudly**. That is the whole point.
