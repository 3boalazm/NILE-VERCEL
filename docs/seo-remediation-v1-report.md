# Controlled SEO remediation v1 — completion report

**Date:** 2026-09-23  
**Scope:** repository-only. Stop here.  
**SEO is not fixed.** `https://nilepharmafood.com` still does not serve this Next.js app. Code in this repository is not a live ranking, indexing, or redirect fix.

Permanent public origin remains `https://nilepharmafood.com`. Nothing in this pass changes, replaces, or adds a second primary domain. `nilepharma.com.eg` is not an NPF URL and is not a redirect source or destination.

---

## Status split

### CODE FIXED

Encoded in the repository and covered by unit tests. Not proven on the public host, and not proven by a running Next server except where a command below says so.

- Search-index eligibility is derived. It is not `status === "active"` and not “the row exists”.
- Arabic PDP title, H1, and Product schema `name` use stored `nameArabic`. English uses the stored Latin `name`. Missing Arabic falls back to Latin and is not indexable. No translation was invented.
- Hardcoded `brand: "Alfasigma"` is removed. `brand` and `manufacturer` are omitted. There is no catalog field to copy.
- `robots.txt` disallows `/admin` and `/api`, and still disallows `/*/lab/`. It does not disallow `/`, locale roots, `/products`, public PDPs, or `/_next`.
- Sitemap lists only the static public pages that exist and are not noindex, plus products that pass the eligibility gate. URLs use `https://nilepharmafood.com`. `lastModified` is omitted.
- Five explicit legacy product 301s are in the proxy, before the locale hop. Query strings on those hops are dropped. Unknown `/product` and `/product/*` are 404. Spam and trash paths owned by the table are 410.
- Homepage sitemap URL now has a self-canonical. The locale layout still owns the title.
- Dockerfile builder stage is named `builder`, matching `COPY --from=builder`.
- `docs/vendure-rendering-performance-baseline.md` records the current request path. `cache: "no-store"` was not changed.

### PRODUCTION BLOCKED

- The public host still serves the Bluehost suspension document, not this app. That was observed earlier on 2026-09-23. It was not re-fetched in the final verification pass.
- No reachable Postgres in this environment. `psql` is absent. `docker` is absent. `npm run build` compiled, then failed while collecting page data: `connect ECONNREFUSED 127.0.0.1:5432`.
- Playwright (`e2e/seo.spec.ts`) was not executed. There is no seeded database and no running `next start`.
- `docker build` was not run.
- TLS, www/non-www, and HTTP→HTTPS cannot be verified while the host is not this app. Those are host policy, not rows in the path map.

### REQUIRES BUSINESS/LEGAL VERIFICATION

- Every supplement stays noindex, including active rows and rows that already have a download URL. There is no stored leaflet or claim-clearance flag. A download URL is not clearance. Do not index Proxeed Plus, Proxeed Women, Proxerex, Proxeed Men, or Proxeed Women Inositol until that evidence exists as data.
- Ellamuselle stays in the database, stays routable, stays noindex, and is excluded from the sitemap. It is not deleted and not redirected to another product.
- Device brand and manufacturer are unknown. They were not set to CA-MI, Alfasigma, or the seller name. Indexing the two device PDPs does not assert a brand.
- Organization schema still has only the pre-existing trade name, canonical URL, logo path, and `info@nilepharmafood.com`. No phone, street address, `sameAs`, or legal-name sentence was added. Old index snippets and directory listings are not a verified NAP.
- Thermometer old slug is not confirmed (`t-onedigital` vs `t-one-digital`). No 301 was shipped. Those paths 404.
- Medical and supplement claims, composition, and dosage were not rewritten.

### REQUIRES SEARCH CONSOLE / BING VERIFICATION

After this app is actually served at `https://nilepharmafood.com`, and only then:

- `/`, `/ar`, `/en`
- canonicals, hreflang, sitemap, robots
- Product and Organization structured data
- the five 301s, including trailing-slash variants, as one hop
- unknown `/product/*` as 404, spam/trash as 410, thermometer as 404
- TLS, HTTP→HTTPS, and www→apex
- that the suspension CGI is gone

None of that can be done in this pass.

---

## Changed files

### Application

- `src/lib/seo/site.ts` — canonical origin constant
- `src/lib/seo/indexability.ts` — eligibility gate
- `src/lib/seo/product-identity.ts` — stored heading / alternate name
- `src/lib/seo/product-metadata.ts` — PDP title, canonical, noindex
- `src/lib/seo/product-schema.ts` — Product and breadcrumb JSON-LD
- `src/lib/seo/sitemap-entries.ts` — sitemap membership
- `src/lib/seo/robots-policy.ts` — robots rules
- `src/lib/seo/legacy-redirects.ts` — explicit 301 / 404 / 410 table
- `src/lib/seo/page-metadata.ts` — optional `follow` with `noIndex`
- `src/lib/products/types.ts` — documents that status is not index eligibility, and that there is no brand field
- `src/lib/products/localize.ts` — does not overwrite `name` / `nameArabic`
- `src/proxy.ts` — legacy decision before locale hop; owns trailing-slash 308; matcher includes WordPress and `/cgi-sys` paths that have extensions
- `next.config.ts` — `skipTrailingSlashRedirect: true`
- `src/app/robots.ts`, `src/app/sitemap.ts`
- `src/app/[locale]/layout.tsx` — `metadataBase` and Organization `url` / `logo` use the origin constant
- `src/app/[locale]/page.tsx` — homepage self-canonical only
- `src/app/[locale]/products/[slug]/page.tsx` — heading, metadata, schema
- `src/app/[locale]/products/page.tsx` — Arabic name included in the existing search filter
- `src/app/[locale]/careers/page.tsx` — noindex, follow
- `src/app/[locale]/blogs/page.tsx` — comment only; route was already noindex
- `src/components/npf/header.tsx`, `footer.tsx`, `bottom-nav.tsx` — empty `/blogs` link removed
- `src/components/npf/product-card.tsx`, `product-spotlight.tsx`, `featured-showcase.tsx`, `evidence-block.tsx`, `positioning-matrix.tsx` — visible name uses `productHeading`
- `Dockerfile` — `FROM node:22 AS builder`

### Tests and docs

- `src/lib/seo/remediation.test.ts`
- `e2e/seo.spec.ts` — written, not run
- `docs/vendure-rendering-performance-baseline.md`
- `docs/seo-url-migration-map.md` — repository status aligned with the code
- `docs/seo-remediation-plan.md` — locked-domain wording from the earlier pass
- this file

`docs/competitive-search-intelligence.md` and `docs/seo-search-domination-audit.md` were not regenerated.

---

## Each fix

### 1. Indexability is not database existence

- **Finding:** an active row, including every supplement, could be treated as indexable. Paused products had to stay in the catalog.
- **Change:** `productIndexDecision` requires active status, slug, Latin name, stored Arabic name, a cleared category, and no stored “not yet confirmed” fact markers. Supplements always get `supplement_claim_clearance_absent`. Devices also need specs. Paused, launching, and unconfirmed products stay ineligible and are not deleted.
- **File:** `src/lib/seo/indexability.ts`, `src/lib/products/types.ts`, PDP metadata, sitemap.
- **Risk:** the two device PDPs become eligible in code. Brand is still omitted. Supplements will not enter the sitemap until a real clearance field exists. That field was not invented.
- **Test:** unit cases for devices, active supplements with a download URL, paused Ellamuselle, launching products, missing Arabic, missing specs, and unconfirmed fact text.

### 2. Arabic and English identity

- **Finding:** Arabic PDP title and H1 used the Latin `name`.
- **Change:** Arabic heading is stored `nameArabic`. English heading is stored Latin `name`. Schema `name` matches the heading. The other stored name is `alternateName` only when it differs. Arabic PDP shows the Latin name as a secondary line, not as the H1. Cards and spotlights use the same helper. Listing search also matches `nameArabic`.
- **File:** `src/lib/seo/product-identity.ts`, PDP, product components, `localize.ts`.
- **Risk:** a wrong stored Arabic string would now be the public Arabic name. No new Arabic strings were written.
- **Test:** unit assertions for the eight stored Arabic names, including `بروكسيد بلس` and `جهاز قياس تشبع الأكسجين CA-MI`. Missing Arabic falls back and is not eligible.

### 3. Hardcoded brand removed

- **Finding:** device JSON-LD set `brand` to Alfasigma. That is not a catalog field. `launching_soon` used a preorder availability URL.
- **Change:** `brand` and `manufacturer` omitted. Seller, only inside an Offer, is `dictionary.siteName`. Offer only when price is finite and availability is InStock or OutOfStock. `launching_soon` has no Offer. Breadcrumb category crumb has no `?category=` URL. No rating, review count, GTIN, or currency without a price.
- **File:** `src/lib/seo/product-schema.ts`, PDP.
- **Risk:** rich-result brand will be absent until a real field exists. That is intentional.
- **Test:** schema object has no `brand`, `manufacturer`, rating, review, or GTIN keys. Device JSON does not contain the removed brand literal. Source comments must not reintroduce that literal or a preorder availability URL.

### 4. robots.txt

- **Finding:** `/admin` and `/api` were not disallowed. robots is not authentication.
- **Change:** disallow `/*/lab/`, `/admin`, `/api`. Allow `/`. Sitemap URL is the canonical origin.
- **File:** `src/lib/seo/robots-policy.ts`, `src/app/robots.ts`.
- **Risk:** a cooperating crawler may skip `/admin` and `/api`. That does not lock them. Public routes are not matched by the policy helper.
- **Test:** unit policy helper. Playwright robots check was not run.

### 5. Sitemap

- **Finding:** sitemap included every product and `/careers`, and stamped `lastModified` with `new Date()`.
- **Change:** static paths are the existing indexable pages only. Products pass the same eligibility gate as metadata. No `lastModified`. No legacy URLs, admin, API, lab, cart, checkout, blogs, careers, or filtered query URLs.
- **File:** `src/lib/seo/sitemap-entries.ts`, `src/app/sitemap.ts`.
- **Risk:** careers and blogs remain reachable. They are noindex and absent from the sitemap. `/blogs` is also unlinked from header, footer, and bottom nav.
- **Test:** unit sitemap membership, canonical host, and absence of `lastModified`.

### 6. Redirects

- **Finding:** old WooCommerce `/product/{slug}` URLs would be locale-prefixed and then 404. A wildcard or a dump-to-`/products` rule would be unsafe.
- **Change:** five exact 301s to `/ar/products/{slug}`, including Ellamuselle’s noindex PDP. Trailing slash is normalized inside the same decision. Unknown `/product` and `/product/*` are 404, including both unconfirmed thermometer slugs. `/term-paper-writer-reviews` and `/home__trashed/store__trashed` are 410. `/wp-admin`, `/wp-content`, `/wp-includes`, `/feed`, and `/cgi-sys` are 410. No `nilepharma.com.eg` rule.
- **File:** `src/lib/seo/legacy-redirects.ts`, `src/proxy.ts`, `next.config.ts`.
- **Risk:** one-hop, including the trailing-slash case, is encoded (`skipTrailingSlashRedirect` plus proxy-owned 308 for non-legacy slashes) and is **not** proven on a running Next server. Query strings on legacy 301s are stripped. Other slash 308s keep the query. Extension paths under the WordPress and `/cgi-sys` prefixes are now in the proxy matcher so the 410 can run; other static files still skip the proxy. This matcher change was not exercised by Playwright.
- **Test:** unit table, including slash variants and “no destination on another domain”. Playwright file exists and was not run.

### 7. Canonical contradiction

- **Finding:** `/` and `/{locale}` were indexable sitemap URLs without a page-level self-canonical.
- **Change:** homepage `generateMetadata` sets `canonical: /{locale}` and hreflang. It does not set a title, so the layout template does not double the site name. Layout `metadataBase` is the canonical origin constant.
- **File:** `src/app/[locale]/page.tsx`, `src/app/[locale]/layout.tsx`, `src/lib/seo/site.ts`.
- **Risk:** none in code. Live canonical tags cannot be checked while the host serves the suspension page.
- **Test:** source assertion that the homepage metadata function exists and the origin constant is the only public host. Not a rendered HTML check.

### 8. Dockerfile stage name

- **Finding:** `COPY --from=builder` had no named builder stage.
- **Change:** `FROM node:22 AS builder`. No other deploy change.
- **File:** `Dockerfile`.
- **Risk:** the image was not built. The name match is source-level only.
- **Test:** unit source assertion. `docker` binary absent, so `docker build` was not run.

### 9. Rendering baseline only

- **Finding:** layout `activeOrder` / `activeCustomer`, catalog price lookup, and cart mutations use `cache: "no-store"`.
- **Change:** documented in `docs/vendure-rendering-performance-baseline.md`. No cache or freshness change.
- **Risk:** none. No Core Web Vitals number was measured. The 10-second abort is code, not a measured TTFB.

---

## Commands and results

All commands were run in `/home/user/NPF` on 2026-09-23.

| Command | Result |
| --- | --- |
| `npx vitest run` | **Pass.** 13 files, 105 tests, exit 0. About 2.3s. Re-run after the proxy matcher correction: 105 tests, exit 0, 2.16s. |
| `npm run lint` | **Pass.** `eslint`, exit 0, no findings printed. |
| `npx eslint src/proxy.ts src/lib/seo/remediation.test.ts` after the matcher correction | **Pass.** Exit 0. |
| `DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:5432/npf_build PAYLOAD_SECRET=ci-only-throwaway-secret-not-a-real-credential npx next typegen` | **Pass.** “Types generated successfully”. Dummy env only. No database was created. |
| `npx tsc --noEmit` before typegen | **Fail.** `PageProps` / `LayoutProps` missing. Expected without generated route types. |
| `npx tsc --noEmit` after typegen | **Pass.** Exit 0. |
| `npm run build` with the same dummy `DATABASE_URI` and `PAYLOAD_SECRET` | **Fail.** Next.js 16.3.3 (webpack). Config loaded. “Compiled with warnings in 49s” — the log did not include the warning text. TypeScript finished in 12.4s. Page-data collection then failed: `connect ECONNREFUSED 127.0.0.1:5432` inside `generateStaticParams` for `/[locale]/products/[slug]`. Payload failed closed because `MOCK_CATALOG_FALLBACK` is not set. Exit 1. |
| `npm run test:e2e` / Playwright | **Not run.** No Postgres, no production build, no server. |
| `docker build` | **Not run.** `docker` is not installed. `psql` is not installed. |
| Production fetch of `https://nilepharmafood.com/` | **Not re-run in this final pass.** Earlier observation the same day: Bluehost suspension page. Treat as still blocked. |

There is no separate integration-test script. CI’s integration-shaped job is Playwright plus Postgres, which could not run here.

---

## Pass / fail

| Check | Code | Live host |
| --- | --- | --- |
| Metadata | Pass in unit tests and `tsc`. Homepage canonical is in source. Rendered tags not checked. | Fail / blocked. Host is not this app. |
| Canonical | Pass as source and unit rules. Absolute URLs that are not `https://nilepharmafood.com` are rejected by `absoluteUrl`. | Not verified. |
| Robots | Pass in unit policy tests. | Not verified. Public `robots.txt` is not this file. |
| Sitemap | Pass in unit tests. No `lastModified`. Ineligible products excluded. | Not verified. |
| Schema | Pass in unit tests. No fake rating, review count, GTIN, brand, or preorder URL. | Not verified. |
| Indexability | Pass in unit tests. | Not verified. No crawl. |
| Redirects | Pass in the resolver and proxy source. One-hop trailing slash is encoded, not measured. | Not verified. |
| Docker | Stage name matches `COPY --from=builder` in source. | Image not built. Fail to verify the image. |

---

## Remaining blockers

1. Hosting: `https://nilepharmafood.com` must serve this app. DNS, registrar, and Bluehost were not touched.
2. A reachable Postgres is required before `npm run seed`, `npm run build`, and Playwright can pass. This environment does not have one. Do not point the build at invented data.
3. Supplement claim and leaflet clearance does not exist as a catalog field.
4. Device brand and manufacturer do not exist as catalog fields.
5. Legal identity is not verified, so no disambiguation sentence and no richer Organization schema.
6. Thermometer old slug is not confirmed.
7. Search Console and Bing cannot validate anything until item 1 is true.
8. Trailing-slash one-hop is not proven until Playwright or an equivalent server check runs.

---

## Explicitly not changed

- DNS, registrar, Bluehost, and production infrastructure
- The public domain
- `cache: "no-store"` and cart, checkout, confirmation, and account freshness
- Legal name, phone, address, social profiles
- Medical or supplement claims, leaflet text, composition, dosage
- Product rows (none deleted)
- GTINs, ratings, reviews, AggregateRating
- Wildcard redirects
- Redirects of spam, trash, unknown URLs, or `nilepharma.com.eg` to `/products` or another product
- Thermometer 301
- Blog articles, comparison pages, SEO hubs, backlinks, keyword stuffing
- noindex on cart, checkout, confirmation, account, login, register, or wishlist
- `docs/competitive-search-intelligence.md` and `docs/seo-search-domination-audit.md` (not regenerated)

---

## Self-audit

The diff was reviewed after the tests. Changes map to the accepted baseline. One gap found in that audit was fixed before this report: the proxy matcher skipped any path with a file extension, so `/wp-admin/plugins.php` and `/cgi-sys/suspendedpage.cgi` would never reach the 410 table. Those prefixes are now extra matchers. `/admin` stays excluded. The SEO unit file was re-run after that change.

Nothing else was reverted. No content, hub, comparison, or backlink work was started.

---

## Next gate

Do not start another SEO content phase.

1. Restore this same domain so it serves this app. That is hosting and deployment, not a new domain.
2. With a real Postgres, run seed, `npm run build`, `npm run test:e2e`, and `docker build` if Docker exists. Inspect the output.
3. Only after the app is the origin: verify `/`, `/ar`, `/en`, canonicals, sitemap, robots, structured data, the five 301s, 404s, 410s, TLS, and www/non-www in a browser and in Search Console / Bing.
4. Business evidence still required before any supplement is indexed, before brand or manufacturer schema is added, and before the thermometer redirect is added.
