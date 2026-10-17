# Search domination foundation — implementation report

**Date:** 2026-09-24  
**Domain:** `https://nilepharmafood.com` (unchanged)  
**Sources used:** `docs/search-domination-master-plan.md`, `docs/first-execution-sprint-report.md`, `docs/seo-remediation-v1-report.md`, `docs/production-hosting-cutover-handoff.md`  
**This is not a new strategy, audit, or ranking claim.**

# 1. Scope

Repository-only. No production access, no legal identity, no leaflet, and no new health wording.

Done in this phase only where the current code disagreed with an already approved rule, or where an image alt could be written from a stored name or from the picture itself.

Not done: hosting, DNS, TLS, Search Console, hubs, articles, claim rewrites, brand or manufacturer fields, prices, and commerce.

# 2. Implemented this phase

| Item | What changed | Status |
| --- | --- | --- |
| PDP breadcrumb | Visible trail is Home → Products → category name as text → product name. The category crumb is no longer a link to `/products?category=`. Home and Products still link to their canonical paths. | Done |
| Catalog hero alt | `/products/proxerex-hero.webp` is the Proxerex pack. Alt is `productHeading` for that stored row and locale. If the row is missing, the fallback is the Latin name on the box, `Proxerex`. The box claim is not copied into the alt. | Done |
| Contact photo alt | `/stock/pregnancy-shoes.jpg` is a standalone photo, not a background. Alt in both dictionaries describes what is visible: a person in a white lace dress holding small orange shoes. No outcome, dosage, or product claim. | Done |
| Fixture regressions | Tests now lock the breadcrumb source, utility-page hreflang, Organization fields, catalog canonical, Proxerex hero source, and one eligibility decision across robots, sitemap, and canonical. | Done |

Catalog filter controls were left as filters. The category chip on the PDP, footer category links, shop-by-need, and the products page pills still use `?category=` or `?need=`. Those URLs are not breadcrumb items and are not canonical. `generateMetadata` on `/products` does not read `searchParams`, so the canonical stays `/products`.

Decorative images were left with an empty alt: homepage story band, story cover, dark-hero parallax, shop-by-need tiles (the heading is the accessible name), and thumbnails whose control already has an accessible name. Account order images were not touched.

# 3. Already in the repository, not rewritten

These were checked and left as they are.

- Search eligibility is derived in `src/lib/seo/indexability.ts`. Active status and a leaflet download URL do not make a supplement indexable. The same decision sets PDP `robots` and sitemap membership.
- Arabic title, H1, and Product `name` use stored `nameArabic`. English uses stored Latin `name`. Missing Arabic falls back to Latin and is not indexable. No translation was invented.
- Canonical origin remains `https://nilepharmafood.com`. No second domain. `nilepharma.com.eg` is not used.
- Sitemap lists only existing indexable URLs. `lastModified` is omitted. `/blogs` and `/careers` stay out.
- Robots disallows `/admin`, `/api`, and `/*/lab/`. It does not disallow the catalog or public assets.
- Five confirmed legacy product 301s, unknown `/product` 404s, and the owned spam/trash 410s stay in the existing table. No new redirect.
- Product schema still omits brand, manufacturer, GTIN, aggregateRating, review, and PreOrder. Offer stays off when price or availability is not a real cart state.
- Organization JSON-LD is still name, canonical URL, logo, and `info@nilepharmafood.com`. No `legalName`, address, telephone, `sameAs`, founder, or award.
- No WebSite schema. No SearchAction.
- Layout no longer publishes homepage hreflang onto every route. Open Graph `url` still matches the page canonical.
- `/blogs` stays a direct-visit empty state: noindex, unlinked from nav, absent from the sitemap. No article was published. No men’s, women’s, fertility, or sexual-health hub was created.
- `buildPageMetadata` already carries title, description, self-canonical, locale alternates, and `noIndex`. That is the content-metadata contract for a future reviewed page. No Payload collection and no migration were added.

# 4. Files changed this phase

| File | Change |
| --- | --- |
| `src/app/[locale]/products/[slug]/page.tsx` | Category breadcrumb is text, not a filter URL. |
| `src/app/[locale]/products/page.tsx` | Proxerex hero alt uses the stored heading. |
| `src/app/[locale]/contact/page.tsx` | Contact photo uses the dictionary alt. |
| `src/lib/i18n/dictionaries.ts` | `contact.photoAlt` in Arabic and English. |
| `src/lib/seo/remediation.test.ts` | Regressions listed below. |
| `docs/search-domination-foundation-implementation-report.md` | This report. |

Cart, checkout, account, authentication, payments, orders, inventory, pricing, tax, Vendure, and `cache: "no-store"` were not modified.

# 5. Tests

| Command | Result |
| --- | --- |
| `npm run lint` | **Pass.** Exit 0. |
| `npx next typegen` | **Pass.** Route types generated. `next-env.d.ts` is gitignored and was not committed. |
| `npx tsc --noEmit` | **Pass.** Exit 0. |
| `npm test` (`vitest run`) | **Pass.** 13 files, 111 tests, exit 0. |

New assertions in `src/lib/seo/remediation.test.ts`:

- The visible breadcrumb nav does not contain `?category=`.
- Cart, checkout, confirmation, account, account orders, and wishlist do not declare `languages:`.
- Organization JSON does not contain `legalName`, address, telephone, `sameAs`, founder, or award. Layout has no WebSite type and no SearchAction.
- Products `generateMetadata` sets `path: "/products"` and does not read `searchParams`. The Proxerex hero source calls `productHeading`.
- For every catalog product and both locales, `robots.index` matches `isSearchIndexEligible`, sitemap membership matches that same boolean, and the canonical path is `/{locale}/products/{slug}`. Schema `name` remains the stored heading even when the page is noindex.

`npm run build` was **not run**. `127.0.0.1:5432` refused the connection (errno 111). Postgres is not available here. The previous build in `docs/first-execution-sprint-report.md` compiled, then failed in `generateStaticParams` with `ECONNREFUSED 127.0.0.1:5432`. That is an environment block, not a pass.

Playwright was not run. There is no seeded database and no running app. The public origin was not fetched again.

# 6. Blocked

- **Production hosting.** The owner handoff is `docs/production-hosting-cutover-handoff.md`. The runtime gate in `docs/production-cutover-final-seo-gate.md` stays BLOCKED. This phase did not retry DNS, TLS, Bluehost, or a live crawl. Localhost is not production.
- **Build.** No reachable Postgres in this environment.
- **Legal identity.** No registered name, phone, street address, or social profile was added. No disambiguation sentence.
- **Product evidence.** Supplements stay noindex. A download URL is not clearance. Device brand and manufacturer stay omitted. The unconfirmed thermometer slug stays 404, not a 301.
- **Claims.** Existing PDP sentences were not rewritten. No dosage, outcome, or contraindication text was added.
- **Ellamuselle Offer.** Still the existing rule. Not changed without a business answer.
- **Search Console and Bing.** Not submitted and not removed.

# 7. Deferred

- WebSite schema, until after the app is the live origin. SearchAction stays absent. Site search is not an indexable feature.
- Indexing any supplement (B-12), only after a clearance flag exists as data.
- Men’s, women’s, fertility, sexual-health, and device hubs. Still rejected.
- Articles, comparisons, and an image sitemap.
- Quarantine of unverified catalog sentences (B-06). Needs reviewer mark-up.
- Whether `/story` and `/quality-sourcing` should leave the sitemap. Not decided here.
- Keyword alt text, invented filenames, and empty decorative alts rewritten into product claims.

# 8. Next execution phase

External. The owner completes `docs/production-hosting-cutover-handoff.md` on `https://nilepharmafood.com`. After that origin serves this app, run the existing runtime gate once and stop.

In parallel, outside this repository: the leaflet and claim pack (B-04) and one confirmed legal name and NAP (B-05). Those are evidence tasks, not new pages.

Do not publish articles, hubs, or claim rewrites before that evidence exists. Do not start another audit.
