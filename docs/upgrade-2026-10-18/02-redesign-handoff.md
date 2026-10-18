# 02 — Redesign handoff ("Nile Glass", 2026-10-18)

Branch: `claude/vendure-db-glass-redesign-2026-10-18` (base `9df98f7`). Audit of the old UI: `01-ui-audit.md`.
Vendure/DB work: `03-vendure-audit.md`. Running log: `PROGRESS.md`. Before/after screenshots: `evidence/` (WebP).

## 1. Design system

* **Tokens** — `src/app/glass.css` (`--ng-*`): colour (ink, brand navy `#00426e`, aqua / peach / rose / mint pastels sampled from the pack
  photography), type scale `--ng-t-*`, spacing, radius `--ng-r-*`, glass fills / hairlines / blur, shadows, motion (`--ng-dur-*`, `--ng-ease*`),
  `--ng-header-h` (76px = 12px inset + 64px floating bar; every sticky offset derives from it). `globals.css` maps the shadcn tokens onto them,
  so `components/ui/*` follow the system automatically.
* **Vocabulary** — `.ng-wrap/.ng-section/.ng-bento`, `.ng-glass`, `.ng-card`, `.ng-btn(-primary|-ghost|-lg)`, `.ng-eyebrow`, `.ng-display/.ng-h1/.ng-h2/.ng-lead/.ng-body`,
  `.ng-chip`, `.ng-acc`, `.ng-dock`, … Page-group CSS lives in `glass-catalog.css`, `glass-content.css`, `glass-commerce.css`.
* **Typography** — Noto Kufi Arabic (600/700, display) + Manrope (text) + Bricolage Grotesque (Latin display), self-hosted OFL via
  `next/font/local` (`src/app/fonts`, `preload:false` except what the first paint needs). Prices use Western digits with grouping in both locales (identical to cart, checkout and the shipping table); dates stay in Arabic-Indic in `/ar`. Removed the
  unused Glora / Ko Banzeen / Montserrat from the pipeline (see `LICENSES.md` / `DECISIONS.md` for the font-licence rule that was kept).
* **Glass, restrained** — one glass layer per region; backdrop-filter only on header bar, dock, hero chips and a few hero panels. Fallbacks:
  `@supports not (backdrop-filter)` and `prefers-reduced-transparency` swap to opaque surfaces; `prefers-reduced-motion` removes entrances,
  stage rotation, orb float and hover movement.
* **RTL-first** — logical properties only; the one directional asset (arrows) flips by locale.
* **No-JS** — category filter on home/catalog is radio + `:has()`; product links are plain anchors; `html.js` gates the reveal animation, so the
  server HTML is never hidden.

## 2. What changed

Shell (floating glass header, mobile bottom dock, footer), home (hero + product stage, trust strip, filterable catalogue, perspective,
reading band, contact band), catalogue + product dossier, about / story / quality / contact / careers / blogs / legal / 404 / error / `/offline`,
cart / checkout / confirmation / account / auth / wishlist. All `ca-*` classes, `care-atlas*.css` (≈4.9k lines) and `components/care-atlas/*`
are gone. Brand mark in the header/footer is now the symbol only (`public/npf-mark.svg`, white on dark via CSS filter).

Unchanged by design: Server-Actions-only Vendure access, cart / checkout / manual-transfer flow, wishlist, PDFs, inquiries, `/offline` fallback,
fee/discount logic (`src/plugins/npf-shipping.ts`), ar/en dictionary parity, all product data (prices, SKUs, availability).

## 3. Verification (all on a production build, local stack)

| Check | Result |
|-------|--------|
| `tsc --noEmit` | 0 errors |
| `eslint src` | clean |
| `vitest run` | all pass |
| `npm run build` with **no `.env` and an empty environment** (`env -i`) | exit 0 |
| Playwright e2e (97) incl. offline-fallback, commerce, narrow 320px | 95 pass, 2 skipped (pre-existing DB-gated) |
| axe (WCAG 2.0/2.1 A+AA) — 18 routes × ar/en × light/dark × 390/1280 (`e2e/a11y.spec.ts`) | 0 violations |
| `scripts/crawl-audit.sh` | 80 / 80 |
| `scripts/verify-fixes.mjs` | see PROGRESS.md for the final tally |
| Horizontal overflow, 22 routes × ar/en × 390/768/1280/1536 (`evidence/after/report.json`) | 0 px everywhere |
| Perf, mobile profile (`scripts/measure-perf.mjs`) | first-load JS 285–295 KB transferred, largest chunk 67 KB, LCP 0.2–1.7 s (cold), CLS 0.000 |
| Vendure audit (`scripts/vendure-audit.mjs`) | 24 / 24 |

Not verified: a real device / Safari rendering of `backdrop-filter`; Lighthouse on Vercel's edge; GA4 DebugView (needs the live property);
a hosted Postgres with SSL (PR #4 path) — the local stack uses plain embedded Postgres.

## 4. Known limits / follow-ups

* The dev-only Next overlay "1 Issue" is React's dev warning about the inline theme `<script>` in the layout (pre-existing, silent in production).
* On a local stack (http Vendure assets) cart/checkout thumbnails fall back to the neutral placeholder because the CSP `img-src` allows `https:` only; production assets are https, so thumbnails render there.
* Listing order is a fixed merchandising list in `src/lib/products/presentation.ts` (`sortForListing`: supplements in family order, then devices); new products appear after the known ones.
* The NFSA / FDA registration chips in the dictionary (`heroTrustChips`) are **not** shown on the new home — they were already unused before
  the redesign and no registration document is in the evidence set (see list below).

## 5. Needs owner input

| Product / area | Field | Document needed |
|----------------|-------|-----------------|
| Proxeed Men (`PXD-MEN-001`) | approved retail price (stays unpublished / "price on request") | signed price list |
| Proxeed Women Inositol (`PXD-WIN-001`) | approved retail price (same) | signed price list |
| Ellamuselle (`ELM-001`) | status currently *paused* in the catalogue file — confirm orderable or not | owner decision |
| All products | real stock quantities (variants are untracked/orderable on purpose, nothing invented) | stock sheet |
| All products | Vendure product descriptions (copy lives in Payload; Vendure descriptions intentionally empty) | approved copy |
| Prices (all) | confirm 14 % Egypt VAT and that listed prices already **include** it | accountant confirmation |
| Home / trust copy | NFSA & FDA registration claim, "European manufacturing certified" | registration certificates per SKU |
| Alfasigma logo on the hero chip / trust strip | permission to display | distributor agreement clause |
| Devices CA-MI | price source documents (500 / 750 EGP come from the repo catalogue file) | supplier invoice / price list |
| Shipping | Middle East Courier tariff beyond the zone table in `npf-shipping.ts` | courier contract |

## 6. Rebuild / run

```bash
npm ci
bash scripts/setup-local-stack.sh          # Postgres + Payload seed + Vendure server/worker + provisioning + audit
set -a; . ./.env; set +a
npm run dev                                # or: npm run build && npm run start
node scripts/capture-screens.mjs docs/upgrade-2026-10-18/evidence/after   # needs PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
```
