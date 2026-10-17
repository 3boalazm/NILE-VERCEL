# Search foundation v2 — implementation report

**Date:** 2026-09-24  
**Domain:** `https://nilepharmafood.com` (unchanged)  
**Sources used:** `docs/search-domination-master-plan.md`, `docs/first-execution-sprint-report.md`, `docs/search-domination-foundation-implementation-report.md`, `docs/production-hosting-cutover-handoff.md`

# Executive Status

Production: **BLOCKED — external hosting**

Search Foundation V2: **PARTIAL**

The repository now has a reusable SEO and content contract for the next growth phase. It does not publish new pages, claims, hubs, or articles. Production was not touched. This is not a ranking, indexing, traffic, or production-readiness result.

# Implemented

- WebSite JSON-LD on every locale layout: trade name, canonical origin, and a publisher link to Organization. No description was copied from the existing Alfasigma/NFSA sentence, because that sentence is not a verified schema field.
- Organization JSON-LD moved into a builder. Default output is still the stored trade name, `https://nilepharmafood.com`, `/npf-logo.svg`, and `info@nilepharmafood.com`. Optional `legalName`, telephone, postal address, and `sameAs` are emitted only when a caller passes a complete value. Partial address is dropped. `nilepharma.com.eg` is refused as `sameAs`. There is no founder, award, rating, or review field.
- Product, Offer, and BreadcrumbList builders stay. Breadcrumb items now go through one list builder that drops any query-string URL.
- FAQ JSON-LD builder exists and returns null unless an item is public, published, and, for a medical claim, marked evidence-approved. No FAQ schema is rendered on the site.
- SearchAction is implemented as an opt-in function and is not emitted. The catalog `?q=` form is a real product filter, not a canonical site-search page. Passing `/products` or a query string does not produce SearchAction. A future dedicated page can opt in only with `pageExists: true`.
- SEO page contract: title, description, canonical, robots, locale alternate, Open Graph, page type, primary entity, image reference, sitemap eligibility, and schema type list. `buildPageMetadata` and product metadata both use it. A path with `?` or `#` is rejected. Utility pages can omit hreflang. Indexable pages now set explicit `index,follow` instead of omitting robots. That is the same crawl instruction, not a new indexation decision.
- Content contract for product, category, educational article, FAQ, comparison, guide, and entity page. Layers are factual product data, editorial, and medical claim. Review states are draft → internal review → evidence review → approved → published. A draft cannot be treated as published. A medical claim cannot be indexable without an approved evidence reference. A comparison cannot be indexable unless `comparisonCleared` is set. Category records cannot become canonical filter URLs. Product indexability stays on the existing catalog gate, so a content row cannot bypass it. The public registry is empty.
- Hub registry reserves nutrition, men’s health, women’s health, fertility, sexual health, and educational resources. Only `/products` is publishable. No hub route, nav item, or sitemap URL was added.
- Internal links: PDP related products now use a stored rule — active, same category, and the same stored audience cell when the catalog has one. Paused and launching products are not offered as substitutes. Keyword overlap is not used. Future content links require an explicit id or slug and a published, eligible target. If nothing qualifies, the list is empty.
- Evidence reference shape: title, optional URL, source type, optional date, review status. No sources were populated.
- Answer-block shape: concise answer, explanation, facts, definitions, product relevance, sources, FAQ, optional reviewed date. It is exposed only when the parent record is itself indexable. Nothing public calls it.
- Image metadata type and a local image-sitemap generator. Empty alt, query URLs, and pages outside an explicit indexable set are dropped. The generator is not mounted and is not listed in robots.
- Sitemap accepts future content rows through the same eligibility function. The live call passes the empty published registry, so the public sitemap membership is unchanged. Content hreflang is added only when both locales of the same group are eligible. Reserved static and product paths cannot be duplicated.

# Architecture Added

## SEO data layer

`src/lib/seo/page-contract.ts` is the single metadata decision. Pages do not each invent canonical or robots rules. Schema is still rendered only where a page or the layout asks for it, so a page type does not silently inject Article or FAQ markup.

## Schema layer

`src/lib/seo/entity-schema.ts`, `src/lib/seo/faq-schema.ts`, and the existing product schema. Verified legal values have a slot. They are not filled.

## Content model

`src/lib/content/types.ts` plus `gates.ts`. This is the smallest model that can represent the future types without a database migration. A Payload collection was not added: there is no approved body to store, Postgres is not available here, and an empty collection would not make a page safer. A future collection must satisfy this type and must not insert drafts into `PUBLISHED_CONTENT`.

## Workflow

The state order is encoded. Only `published` can be indexable, and medical claims have a second gate. Role-based admin workflow, notifications, and a CMS UI are remaining work, documented below. There is no save path that publishes a draft.

## Internal linking

`src/lib/content/links.ts`. Live use is the PDP related-product list. Homepage → products and catalog → PDP links were already canonical and were not rewritten.

## FAQ / AEO readiness

Types and builders only. No public FAQ or answer page.

## Evidence references

Stored as data on a content record. Not scraped. Not invented.

## Hub readiness

`src/lib/content/registry.ts`. Unpublished hubs are names, not routes.

## Image SEO

`src/lib/seo/image-metadata.ts`. Alt, optional width and height, page path, and product slug. No live image sitemap.

## Indexability contract

Catalog products still use `productIndexDecision`. Future content uses `contentIndexDecision`. Both must pass `canEnterSitemap` before a URL is listed. Existence in a list is not eligibility.

# Tests

| Command | Result |
| --- | --- |
| `npm run lint` | **Pass.** Exit 0. |
| `npx tsc --noEmit` | **Pass.** Exit 0. |
| `npm test` | **Pass.** 15 files, 127 tests, exit 0. |
| `npm run build` | **Not run.** `127.0.0.1:5432` refused the connection (errno 111). This is an environment block, not a pass. |

New coverage includes Organization field omission and later insertion, WebSite without SearchAction, refusal of catalog-filter SearchAction, canonical rejection of query paths, noindex sitemap exclusion, utility pages without hreflang, product contract matching the catalog gate, FAQ refusal of unpublished and unevidenced medical items, image-sitemap exclusions, draft exclusion, medical-claim and comparison gates, hreflang only for a real locale pair, hub routes absent, and related links that stay on canonical paths.

# Deferred

## 1. Hosting-dependent

- Serving this app on `https://nilepharmafood.com`.
- Runtime checks of schema, robots, sitemap, and redirects.
- Mounting an image sitemap after the assets are confirmed final and the origin is this app.

## 2. Legal-dependent

- `legalName`, street address, telephone, and `sameAs`. The builder can accept them. They were not guessed.
- Disambiguation sentence on About.

## 3. Product-evidence-dependent

- Supplement indexation.
- Device brand and manufacturer.
- Thermometer legacy slug.
- Ellamuselle Offer decision.
- Nutrition hub.

## 4. Medical-review-dependent

- Men’s health, women’s health, fertility, and sexual-health hubs.
- Any medical FAQ, guide, comparison, or answer page.
- Quarantine of existing unverified catalog sentences. Not rewritten here.

## 5. Content-production-dependent

- Payload collection, admin UI, and role checks for the review states.
- Any guide, FAQ page, comparison, or educational article.
- Populated evidence records.

## 6. Future growth work

- SearchAction, after a real canonical search page exists. The catalog `?q=` filter is not that page.
- Image sitemap route.
- Category URLs that are not `?category=` filters.
- Search Console and Bing.

# Files Changed

New:

- `src/lib/seo/entity-schema.ts`
- `src/lib/seo/page-contract.ts`
- `src/lib/seo/faq-schema.ts`
- `src/lib/seo/image-metadata.ts`
- `src/lib/seo/foundation-v2.test.ts`
- `src/lib/content/types.ts`
- `src/lib/content/gates.ts`
- `src/lib/content/links.ts`
- `src/lib/content/registry.ts`
- `src/lib/content/foundation.test.ts`
- `docs/search-foundation-v2-implementation-report.md`

Edited:

- `src/app/[locale]/layout.tsx`
- `src/app/sitemap.ts`
- `src/app/[locale]/products/[slug]/page.tsx`
- `src/lib/seo/page-metadata.ts`
- `src/lib/seo/product-metadata.ts`
- `src/lib/seo/product-schema.ts`
- `src/lib/seo/sitemap-entries.ts`
- `src/lib/seo/remediation.test.ts`

Cart, checkout, account, authentication, payments, orders, inventory, pricing, tax, Vendure, and `cache: "no-store"` were not modified. No new public route was added.

# Intentionally not published

- Fertility, sexual-health, disease, dosage, treatment, or outcome articles.
- Medical guides and comparison pages.
- Men’s, women’s, fertility, sexual-health, nutrition, and educational hubs.
- Placeholder or AI-generated copy.
- FAQ schema for the existing catalog questions.
- SearchAction.
- An image sitemap.
- Sample fixtures. They exist only inside unit tests.

# Next Phase

Content and search growth, only after all of these exist:

- this app is the live origin at `https://nilepharmafood.com`
- legal identity is verified
- product leaflets and claim clearance exist as data
- an approved content inventory exists

Until then, do not publish hubs or articles, and do not start another audit. The contracts above are the insertion point. They do not need to be redesigned to accept a verified legal field, an approved evidence reference, or a published guide.
