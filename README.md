# NPF Storefront — Nile Pharma Food

Bilingual (Arabic RTL / English LTR) e-commerce storefront for Nile Pharma
Food, the authorized distributor of Alfasigma (Italy) products in Egypt.

## Current design work — Care Atlas integrated (2026-10-15)

**Clinical Glass and Prismatic Care were both rejected visually.** After the
owner asked to continue the independent Care Atlas direction, it was integrated
into the **actual Next application**, not an iframe or redirect to the study.
This is an implementation for review, **not final visual acceptance or a live
commerce release**.

- [**Latest (2026-10-18): Nile Glass redesign handoff**](docs/upgrade-2026-10-18/02-redesign-handoff.md) · [UI audit](docs/upgrade-2026-10-18/01-ui-audit.md) · [Vendure audit](docs/upgrade-2026-10-18/03-vendure-audit.md) · [progress log](docs/upgrade-2026-10-18/PROGRESS.md)
- [Latest discovery / reading polish and final validation](docs/upgrade-2026-10-15/13-discovery-and-reading-polish.md)
- [Editorial images and mark-only header](docs/upgrade-2026-10-15/12-editorial-imagery-and-mark.md)
- [Motion/glass refinement and its validation](docs/upgrade-2026-10-15/11-motion-glass-refinement.md)
- [Integrated handoff, evidence and release limits](docs/upgrade-2026-10-15/09-care-atlas-integrated-handoff.md)
- [Integration plan](docs/upgrade-2026-10-15/08-care-atlas-integration-plan.md)
- Actual app: normal Next routes `/ar` and `/en`; homepage, shell, catalog,
  product dossiers, company/contact and access pages rebuilt; shared design
  tokens applied to account/cart/checkout/legal pages without rewriting commerce.
- Product atlas reads `productRepository` server data. Actual GET discovery,
  verified product inquiries, real PDFs, wishlist and no-JS product links remain.
- Fresh integrated validation: build/types/lint pass, **139 unit tests**, **61
  browser tests**, **168 responsive visits**, **60 axe audits with 0 detected
  violations**. Authenticated accounts/live orders/SMTP were not exercised.
- [Security / live-release gates](docs/upgrade-2026-10-15/02-security-and-release-gates.md)
  remain open. Production dependency audit still has 25 findings (16 high).
- [Historical reset analysis](docs/upgrade-2026-10-15/06-zero-base-reset.md) and
  [standalone direction study](docs/upgrade-2026-10-15/07-care-atlas-direction-review.md).
  `public/concepts/care-atlas/` is retained as the earlier study, **not the app**.

Use `NPF_PREVIEW_MODE=1 MOCK_CATALOG_FALLBACK=1` only for explicit demo review;
keep both off for production. No commit/push/deploy or owner sign-off is implied.

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + Tailwind v4 |
| CMS / content | Payload CMS 3 + Postgres (products, categories, media, contact inquiries) |
| Commerce | Vendure Shop API via server-only transport + Server Actions (cart, checkout, accounts, live pricing) |
| PWA | Serwist (service worker, offline fallback at `/offline`) |

Key architecture notes:

- The browser **never talks to Vendure directly** — only through Server
  Actions in `src/lib/cart`, `src/lib/auth`, `src/lib/wishlist`.
- Catalog content comes from Payload; `sku`/`price` resolve live from
  Vendure per slug. Missing commerce means no published live price; demo
  bridge prices require explicit `MOCK_CATALOG_FALLBACK` and are labeled.
  `NPF_PREVIEW_MODE=1` + the mock flag use a direct demo repository, show a
  visible notice and block transactions. Keep both flags off in production.
- Contact-form submissions are stored in the `inquiries` Payload
  collection for triage in the admin panel.

## Prerequisites

- Node.js 22+
- Postgres (local or hosted) — needed to *run* the app (and to seed it),
  **not** to build it
- Vendure backend running (for cart/checkout/account at runtime;
  **not** required for `npm run build`)

## Setup

```bash
npm ci
cp .env.example .env   # then fill in real values
npm run dev
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `PAYLOAD_SECRET` | Yes | Signs Payload JWTs / encrypts fields (`openssl rand -base64 32`) |
| `DATABASE_URI` | Yes | Postgres connection string. Tables are auto-created on first boot |
| `VENDURE_SHOP_API_URL` | Runtime | Shop API endpoint (default: `http://localhost:3001/shop-api`) |
| `ALLOW_LAB_ROUTES` | No | Set `true` to enable `/[locale]/lab/*` design prototypes (404 otherwise) |

Open `http://localhost:3000/ar` (or `/en`). Payload admin lives at
`/admin` — create the first admin user there on first boot.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build (no secrets, no database needed; Vendure optional)
npm run start   # serve the production build (needs DATABASE_URI + PAYLOAD_SECRET)
npm run lint    # eslint
npm run test    # vitest unit suites (no infrastructure needed)
npm run test:e2e  # playwright suite (needs Postgres; Vendure optional, see below)
npm run seed    # seed Payload catalog from the mock data (needs DATABASE_URI + PAYLOAD_SECRET)
                # existing slugs are skipped; append `-- --update` to overwrite them
                # with the mock data after content updates
```

## Testing

**Unit** (`npm run test`) — pure logic, runs anywhere: Vendure
order-mapping math, the rate limiter, localization merging, and ar/en
dictionary key parity (fails the build on a missing translation).

**E2E** (`npm run test:e2e`) — Playwright + Chromium, boots the app
itself. Main suites:

| Suite | Needs | Runs in CI |
| --- | --- | --- |
| `e2e/smoke.spec.ts` | Postgres + `npm run seed` | Yes (fresh DB service per run) |
| `e2e/visibility.spec.ts` | Seeded catalog or explicit preview; JS-off / layout contracts | Yes |
| `e2e/discovery-recovery.spec.ts` | Catalog; preview/production worker for gated checks | Yes, preview-only assertions gated |
| `e2e/commerce.spec.ts` | + running Vendure (NPF catalog, `manual-settlement`, npf-shipping) | No — skips itself without Vendure |

Local full run:

```bash
# 1. Postgres up + env exported, then:
npm run seed          # one-time per database (existing slugs skipped;
                      # `-- --update` overwrites them with the mock data)
npm run test:e2e      # boots `next dev` automatically; or set
                      # PLAYWRIGHT_BASE_URL=http://localhost:3000 to reuse yours
```

The contact-form test submits a real inquiry row on every run — point
E2E at a throwaway database, never production.

## Notes for deploys

**The build and the running app need different things.** A build compiles the
app; it does not serve a request, so it does not need production secrets and
it does not need a reachable database. `npm run build` therefore works on a
machine with no `.env` at all — it substitutes clearly-marked build-only
placeholders for `PAYLOAD_SECRET` / `DATABASE_URI` and says so in the build
log. The **running** app is strict: when its CMS routes load, they validate
the real runtime environment (not the build placeholders) and refuse to
serve (500, with the variable names in the log) if `PAYLOAD_SECRET` or
`DATABASE_URI` is missing.

That split is what makes a Vercel deploy possible without a build-time
database: the catalog is read at request time, and the routes that depend on
it (`/products`, product pages, `/sitemap.xml`) are rendered on demand.

- **Deploying to Vercel** — required environment variables, the database, the
  seed step and the verification checklist: [docs/OPS.md § 10](docs/OPS.md).
- The catalog routes are server-rendered on demand (the root layout reads the
  cart/customer session cookie), so the build produces no product HTML — the
  pages are generated per request from Payload.
- `/sitemap.xml` is generated per request for the same reason: a sitemap
  built from a catalog the build machine could not read would ship without
  the product URLs, which is the part crawlers need.
- Live catalog pricing degrades gracefully: if Vendure is down, pages
  render with fallback prices and checkout surfaces the error instead of
  charging a wrong amount.
- `/blogs` is currently an empty state: noindexed and excluded from the
  sitemap until real articles ship. Design-lab routes 404 in production
  unless `ALLOW_LAB_ROUTES=true`.
"# NILE-VERCEL" 
