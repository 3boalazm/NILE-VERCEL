# 01 — UI audit (before the Nile Glass redesign)

Evidence: `docs/upgrade-2026-10-18/evidence/before/` — every key route × `/ar` and `/en` × 390 / 768 / 1280 / 1536 px
(full-page PNGs + `report.json` with HTTP status, horizontal overflow and console errors per shot; produced by
`scripts/capture-screens.mjs`). Captured against a production-like local stack (Postgres + Vendure + worker, full catalog).

## What the audit found

| # | Finding | Where | Severity |
|---|---------|-------|----------|
| 1 | **Four unrelated visual languages on one site.** Home used the dark "Care Atlas" editorial look (navy `#0b1620`, electric-blue `#1e3cff` band, lime tab), while catalog / cart / account still used the pale shadcn look and the contact page a third one. No shared tokens for radius, shadow or blur. | whole site | High |
| 2 | **Five ~4.9k-line care-atlas CSS files** (`care-atlas*.css`) with page-scoped `ca-*` classes — nothing reusable, every page re-solving spacing and type. | CSS | High |
| 3 | **Home is a long scroll of full-bleed colour blocks** (photo hero → cream → navy → saturated blue → cream → navy footer). The product explorer is a dense table-like list; on mobile the catalogue is hidden behind tabs. | `/`, `/products` | High |
| 4 | **Arabic typography treated as an afterthought:** display copy set in a Latin-first mono/grotesk pairing, 10–11px mono eyebrows and index numbers (`01 / PERSPECTIVE`) that are unreadable in RTL and fail contrast on dark. Western digits mixed with Arabic prose. | all /ar | High |
| 5 | **Not "glass".** Only the pill nav and one note card used blur; surfaces were flat or fully opaque. Glass that exists sits over a busy photo with weak text contrast. | home hero | Medium |
| 6 | **Cookie banner covers the hero** on first load (desktop and mobile), hiding the primary CTA — the first impression of every new visitor. | all | Medium |
| 7 | **Reveal-on-scroll leaves holes** in full-page captures (large empty bands: contact section) — content only appears after IntersectionObserver fires. | home | Medium |
| 8 | **Product page:** gallery, price, add-to-cart and the leaflet buried under a left-hand chapter rail; unpriced products read as broken rather than "price on request". | `/products/[slug]` | Medium |
| 9 | **Header differs between pages / no clear mobile pattern** (hamburger only, no bottom dock for the four highest-frequency destinations). | shell | Medium |
| 10 | Touch targets < 44px in footer links and carousel dots; no `--header-height` contract so sticky offsets were guessed. | shell | Low |
| 11 | Wordmark baked into the brand image used as the header mark (violates the repo's "original symbol only" rule once the logo is small). | header | Low |

Technical health at the time (from `report.json`): all routes 200 (the 404 shots are the intentional not-found page), **0 px horizontal
overflow** at every width — the problems were visual, not structural.

## Design direction taken

"Nile Glass": light aurora ground sampled from the pack photography (peach / aqua / rose / mint), frosted-glass cards used sparingly
(one glass layer per region, never stacked), a single navy brand accent, large Noto Kufi Arabic display type with Manrope / Bricolage
for Latin, real Arabic-Indic numerals in `/ar`, logical CSS properties throughout, one token set (`--ng-*`) for colour, type, space,
radius, blur, shadow and motion. Details and decisions: `02-redesign-handoff.md`.
