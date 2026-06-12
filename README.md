# Field Notes — Personal Knowledge Wiki

A static Astro wiki for ideas distilled from books, papers, conversations, and courses. Content is written by an AI agent on a weekly schedule; **the schema is a compile-time contract** — broken entries fail the build.

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
npm run validate   # enforce content guardrails
npm run build      # validate → static build → Pagefind index
npm run preview    # serve dist/ (search works here)
```

## Add an entry

1. Copy `src/content/ideas/_template.md` to `src/content/ideas/<slug>.md`
2. Fill frontmatter per [AGENTS.md](./AGENTS.md) (the AI writer spec)
3. Write ≥200 characters in the body
4. `npm run validate` then `npm run build`

## Deploy

Static `dist/` output — deploy to Netlify, Vercel, or Cloudflare Pages with defaults:

| Platform | Build command | Output |
|----------|---------------|--------|
| Netlify | `npm run build` | `dist` |
| Vercel | `npm run build` | `dist` |
| Cloudflare Pages | `npm run build` | `dist` |

Update `site` in `astro.config.mjs` and `src/site.config.ts` with your production URL (needed for RSS).

## Features

- **This Week** digest on home (added/updated in last 7 days)
- **Ideas** list with sort/filter (date, maturity, tag)
- **Idea pages** with takeaways, body, quotes, tags, related, backlinks
- **Tags** index and per-tag pages
- **Search** via Pagefind (`/` to focus) — available after `npm run build`
- **RSS** at `/rss.xml`

## Project structure

```
src/content/ideas/     # one .md per idea (Zod-validated)
src/content/config.ts  # strict schema
scripts/validate-content.mjs  # extra guardrails
AGENTS.md              # content contract for AI writers
```

## Search in development

Pagefind indexes at build time. In `npm run dev`, search UI may be absent. Run `npm run build && npm run preview` to test search locally.
