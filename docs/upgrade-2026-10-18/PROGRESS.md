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

## Part 2 — UI redesign — done
- [x] Before screenshots (176, ar/en × 4 widths) → `evidence/before`; audit → [01-ui-audit.md](01-ui-audit.md)
- [x] Nile Glass design system (`glass.css`), shell, home, catalogue + dossier, content/legal/error/offline, cart/checkout/account/auth/wishlist
- [x] care-atlas CSS/components removed; proprietary fonts (Glora, Ko Banzeen) + Montserrat removed, OFL-only
- [x] After screenshots → `evidence/after` (0 px overflow on all 176)
- [x] Decisions: header mark = symbol only; prices in Western digits (consistent with cart/checkout); listing order fixed (`sortForListing`); home og:image = real Proxeed Plus pack photo; footer/dock touch targets ≥ 44px

## Part 3 — validation — done (see 02-redesign-handoff.md §3 for the table)
tsc 0 · eslint clean · vitest 413/413 · hermetic `env -i` build exit 0 · Playwright e2e on prod build · axe 0 violations (ar/en × light/dark × 390/1280) · crawl 80/80 · verify-fixes (F-45, F-59 fixed) · perf JS ≈ 290 KB, CLS 0.
Stale-before-redesign checks fixed: crawl-audit article slugs / WhatsApp-on-article / NFSA badge (none existed on the pre-redesign home either).

## Needs owner input
Full table in [02-redesign-handoff.md](02-redesign-handoff.md) §5; also `docs/OPS.md` §11.5 (prices for Proxeed Men / Women Inositol, stock counts, VAT-inclusive confirmation, MECS 2026 price PDF, SMTP/SUPERADMIN/SEED_KEY secrets).
