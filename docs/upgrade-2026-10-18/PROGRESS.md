# Progress log — Vendure completion + glass redesign (2026-10-18)

Branch `claude/vendure-db-glass-redesign-2026-10-18`. Autonomous overnight run;
nobody was available to answer questions, so decisions are recorded here.

## Delivery constraint (read first)
`add_repo` was not available in this session and the GitHub token was invalid
(`push` → 403 from the git proxy). Work was done in a read-only public clone and
is delivered as a **git bundle + patch** (SendUserFile), not as a pushed branch /
PR. Apply with `git fetch <bundle> claude/vendure-db-glass-redesign-2026-10-18`.

## Part 1 — Vendure database (done)
- [x] Stack runs end to end: embedded Postgres, Payload seed, Vendure server + worker, Next. `GET /api/health` → `ok`, catalog 8 products, commerce reachable.
- [x] Audit + gap list → [03-vendure-audit.md](03-vendure-audit.md)
- [x] Seeders rewritten idempotent + complete; `npm run stack:setup` goes fresh DB → audited state in ~30 s. Documented in `docs/OPS.md` §11.
- [x] Probes: conversion flow PASS, admin settle PASS, verify-fixes baseline 39 FIXED / 6 OPEN (the 6 are redesign-era regressions, tracked below).

## Decisions
1. Two databases (`npf` Vendure, `npf_payload` Payload) as in DECISIONS.md.
2. Vendure schema was **stale vs 3.8.0** → generated `…vendure-3-8-schema-catchup` migration.
3. Channel `pricesIncludeTax=true` + 14 % VAT rate: shop terms say prices include VAT and the storefront displays `priceWithTax`, so shown = charged. Flagged for owner confirmation.
4. Unpriced products → Vendure product **disabled**, price 0 (Shop API hides them); storefront also rejects live price ≤ 0.
5. No invented stock: `trackInventory=FALSE`.
6. No invented descriptions in Vendure.

## Part 2 — UI redesign
(in progress)

## Part 3 — validation
(pending)

## Needs owner input
See `docs/OPS.md` §11.5 (prices for Proxeed Men / Women Inositol, stock counts, VAT-inclusive confirmation, MECS 2026 price PDF, SMTP/SUPERADMIN/SEED_KEY secrets).

## Part 2 checkpoint — design system + shell + home
- `src/app/glass.css` (Nile Glass tokens `--ng-*`, `.ng-*` vocabulary), new header/dock/footer, home composition, product card/grid. Home overflow at 390px fixed (html clip).
- Remaining: catalog/product, company/content, commerce/auth pages; removal of care-atlas CSS/components.
