# Clinical Glass — design / information architecture decisions

Date: 2026-10-15. Branch: `arena/2f247beb-npf`.

## Direction

Actual implementation, not a mockup. A restrained pharmaceutical collection rather than a generic ecommerce theme: pearl background, deep green type, mint glass surfaces, oversized bilingual headings, thin separators, floating navigation and real product photography. No external image service, generated product packshots, stock claims or additional WebGL dependency.

- Light palette: pearl `#f3f5f0`, green `#153a35`, glass white / mint, secondary ink `#48615a`.
- Dark palette: navy / green surfaces, mint accent and high-contrast pale text. Theme remains optional and works with blocked browser storage.
- Reuse existing local Montserrat / Glora / Arabic font families. Remove two unused slanted font declarations; turn off eager preloading of every local font on every language route. Files remain available; no remote font dependency.
- CSS glass is decoration. Reduced transparency replaces it with opaque surfaces; reduced motion avoids animated presentation. Core content remains visible in server HTML.
- Large CTAs, visible focus, SSR skip link, active navigation, wrapped PDP controls and logical-direction RTL layouts.

## Home hierarchy

1. Floating island navigation: products, about, quality, contact. Account, cart, wishlist, locale and theme utilities; mobile sheet and bottom navigation.
2. Split hero: readable health/product-information positioning, real Proxeed Plus image, browse / trust CTAs. Not a diagnostic recommendation.
3. Dynamic collection ledger (actual product/category counts).
4. Three need-first paths: men, women, medical devices. Remove the coming-soon dental teaser from the main decision path.
5. Product spotlight with one clear current product, packaging, information and inquiry links.
6. Trust journey + actual reference / leaflet links.
7. One closing contact section. Remove repetitive home stories/testimonials/counter-marquee filler and stop promoting empty blogs in main navigation.

Existing editorial/medical content is preserved rather than rewritten into stronger efficacy promises. Some historical testimonial / blog components and hero lab routes remain in source but are not promoted by this homepage. Their retention is not new content approval.

## Catalog / PDP / contact

- One catalog toolbar combines search and sort; need/category controls retain the other active filters.
- Locale switching retains only `q`, `category`, `need`, `sort`, `product`, with bounded values. It deliberately drops passwords, reset tokens, redirects and unknown parameters.
- Product images keep their own readable stage. Product controls wrap at narrow widths; only the first gallery image is prioritized and pointer zoom now has its actual frame ref.
- Product inquiry links carry a validated slug. Contact fetches the product from the repository and pre-fills a bounded subject; it never trusts an arbitrary product name in a query string.
- Distinct `live` / `demo` / `unavailable` pricing provenance. Demo values are labeled; order controls require live prices. Missing commerce in production is not permission to publish bridge prices.

## Preview integrity

The demonstration is an explicit `NPF_PREVIEW_MODE=1` + `MOCK_CATALOG_FALLBACK=1` production build with a visible warning. It uses actual repository assets and demo product data. Order placement, product addition, contact persistence and account mutations are blocked. No payment, order, mail delivery or live inventory success is claimed from this preview.

## Validation boundary

Browser evidence and final measured outcomes are recorded in `03-validation-and-handoff.md` and `evidence/`. Automated axe checks are not a substitute for manual screen-reader review, clinical/legal content approval, or live backend acceptance.
