# Vendure database audit (2026-10-18)

Method: brought up a **fresh** Postgres (embedded), seeded Payload, booted the
Vendure server + worker from the repo, then queried the Admin API for everything
the storefront reads or writes. `node scripts/vendure-audit.mjs` now automates
the checks (24 PASS after the fixes below).

## Gaps found on a fresh database → fix

| # | Gap | Fix (in repo) |
|---|---|---|
| 1 | TypeORM migrations were behind Vendure 3.8.0 (missing `seller_translation`, `asset.usage`, `order.pricingUpdatedAt`, unique translation constraints, …); server logged "schema does not match" | new migration `src/migrations/1792282971211-vendure-3-8-schema-catchup.ts` (generated with `generateMigration`, de-duplicates translations first) |
| 2 | `vendure dev` cannot load the repo (ESM, extension-less imports); no way to run `dist/index.js` | `scripts/build-vendure.mjs` → `dist/index.js`, `dist/index-worker.js`, `dist/migrations/*` |
| 3 | No Egypt zone / EG country; channel had no default tax or shipping zone | `seed-vendure-catalog.mjs` creates both and wires the channel (zone id no longer hard-coded as `1`) |
| 4 | Channel currency USD, languages `en` only | EGP only, `ar`+`en`, global available languages |
| 5 | No tax category / rate; prices-exclude-tax would have charged more than the number shown | `Standard` category, `Egypt VAT 14%`, `pricesIncludeTax=true` (shop terms say prices include VAT) |
| 6 | Unpriced products were created **enabled at price 0** → live price 0 would read as "0 EGP" | created **disabled**; Shop API hides them; `resolveCatalogPrice` now rejects price ≤ 0 (+ test) |
| 7 | Seeder set an invented stock of 100 and wrote "demo catalog" descriptions | `trackInventory=FALSE`, empty descriptions |
| 8 | Arabic product names were copies of the English name | `nameArabic` from the catalog |
| 9 | No product images in Vendure (cart lines render `featuredAsset.preview`) | repo images uploaded as assets and set as featured |
| 10 | No `manual-settlement` payment method, no shipping methods | created idempotently; names use the Middle East Courier wording; branch drop-off now uses its own calculator |
| 11 | No operator role | `order-operations` (orders/customers read+update; no catalog/settings/admin) — no account created |
| 12 | Catalog JSON was written to `/tmp/catalog.json` | committed `scripts/data/vendure-catalog.json` + drift test |
| 13 | Search index empty until the worker ran | seeder awaits the reindex job and warns if the worker is down; audit checks 6/6 |
| 14 | Payload seed failed on a fresh DB when `./media` held orphan files from an earlier DB | `scripts/seed.ts` clears the orphan before upload |
| 15 | `rebuild-stack.sh` (single DB, manual SQL inserts of channel/seller) was stale | replaced by `setup-local-stack.sh`; old name is a thin wrapper |

Not applicable / deliberately not created: collections and facets (the storefront
reads neither; Payload owns categories), card-gateway payment methods (scaffolding
only), stock counts, admin user accounts.

## Observations left for the owner (not changed)
* Vendure 3.8 logs two security warnings on boot: CORS reflects any `Origin` with
  credentials, and `csrfPrevention` is off while sessions use cookies. The browser
  never talks to Vendure (Server Actions only), so tightening `apiOptions.cors`
  to the storefront origin is low-risk but needs a production URL decision.
* `.env.example` documents `APP_ENV=production`; local work needs exactly `dev`.

## Evidence
* `probe-conversion-flow.cjs` → PASS (`PaymentAuthorized`), `probe-admin-settle.cjs` → PASS (`PaymentSettled`).
* `verify-fixes.mjs` baseline 39 FIXED / 6 OPEN — the 6 (F-13 TOC, F-23 social links, F-24 filter UI, F-43 cache header, F-45 og:image, F-59 maxLength) are regressions of the 2026-10-15 Care Atlas build and are addressed in the redesign.
