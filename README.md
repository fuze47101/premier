# Premier Utah Real Estate

> From first lease to legacy. Tooele County's only vertically integrated real estate platform.

This is the Next.js 15 source for **homesintooele.com** — the rebuild of Premier Utah Real Estate's web presence. Built around the **Lifecycle Account** wedge: one company, one team, every stage of homeownership (rent → buy → build → invest → manage).

---

## Quick start

```bash
# Install dependencies
npm install

# Local dev server
npm run dev
# → http://localhost:3000

# Production build (also what Railway runs)
npm run build
npm run start
```

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components default, ISR for content, RSC streaming for above-the-fold |
| Language | TypeScript | Strict mode |
| Hosting | Railway | `railway.toml` configures Nixpacks build + start |
| Database | Postgres (Railway plugin) | Lifecycle Account, collections, saved searches |
| Auth | Clerk (planned) | SSO + email for Lifecycle Account |
| MLS / IDX | Wasatch Front Regional MLS via RESO Web API | Replaces the current `forsale.homesintooele.com` subdomain |
| Search | Algolia or Typesense (planned) | Listing search with lifestyle filters |
| Maps | Mapbox | Neighborhood pages and map search |
| Media | Cloudinary | Image + video CDN with on-the-fly transforms |
| CRM | Follow Up Boss | Webhooked into every site form |
| Analytics | GA4 + Plausible + PostHog | Compliance + product analytics |
| Marketing | Klaviyo + Resend | Lifecycle email + transactional |

## Project structure

```
Premier/
├── app/
│   ├── layout.tsx       # Root layout, fonts, metadata
│   ├── page.tsx         # Homepage (current prototype)
│   └── globals.css      # Design system tokens + section styles
├── public/
│   ├── premier-logo.png         # Primary mark (dark)
│   └── premier-logo-white.png   # Inverted mark (planned, dark backgrounds)
├── docs/
│   ├── PUR_Brand_Positioning_v1.docx   # Strategic foundation document
│   ├── PUR_IA_Sitemap_v1.docx          # Information architecture + sitemap
│   └── PUR_24_Month_Marketing_Calendar.xlsx
├── next.config.mjs
├── railway.toml         # Railway deployment config
├── tsconfig.json
└── .env.example
```

## Deployment to Railway

1. Push this repo to GitHub.
2. In Railway, **New Project → Deploy from GitHub repo** and pick this repo.
3. Add the **Postgres** plugin (Railway auto-injects `DATABASE_URL`).
4. Add the env vars from `.env.example` in the Railway dashboard.
5. Add a custom domain pointing at `homesintooele.com` in Railway → Settings → Networking.
6. First deploy runs `npm ci && npm run build` (per `railway.toml`).

## Roadmap (sequenced per the 24-Month Marketing Plan)

- **Month 1–2** — Homepage + listing detail page + design system (current).
- **Month 3** — Neighborhood pages, agent bios, market reports template, CMS integration.
- **Month 4** — Lifecycle Account (auth, dashboard, collections, saved searches), conversational search, instant valuation.
- **Month 5** — UpDwell new construction hub, property management owner flow, commercial, rentals.
- **Month 6** — Soft launch → full launch (Q1 2027).

Full plan in `docs/PUR_24_Month_Marketing_Calendar.xlsx`.

## Brand foundation

See `docs/PUR_Brand_Positioning_v1.docx` for the strategic foundation document — positioning, voice, audiences, visual direction. Every decision in the codebase should ladder back to it.

## Logo

Place the source logo files in `public/`:
- `premier-logo.png` — dark wordmark on transparent background (primary)
- `premier-logo-white.png` — generate this from the source `.ai` file in Adobe Illustrator for use on dark sections (hero, footer)

## License

Proprietary. © 2026 Premier Utah Real Estate. All rights reserved.
