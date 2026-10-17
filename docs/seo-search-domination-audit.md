# NILE PHARMA SEARCH DOMINATION AUDIT

**Date:** 2026-09-23  
**Scope:** repository `3boalazm/NPF` (Next.js 16 storefront) plus the live host `https://nilepharmafood.com`.  
**Instruction followed:** inspection and strategy only. **No code was modified.**  
**Companion:** `docs/competitive-search-intelligence.md`.

Labels: **FACT** (code or fetched response), **OBSERVATION** (search index or partial fetch), **INFERENCE**, **RECOMMENDATION**.  
Search volume, rankings, backlink counts, Core Web Vitals field data, and conversion rates are **Not verified** unless stated as a direct measurement. None of those were measured against a live storefront, because the storefront is not what the domain serves.

---

## 1. Executive Summary

Nile Pharma Food cannot become a strong organic result for its own name, its products, or a related health question until three separate blockers are removed. They are not theoretical.

1. **The official domain does not serve the website.** On 2026-09-23 a fetch of `https://nilepharmafood.com/` returned a Bluehost **Account Suspended** page. Wayback shows the same suspension path on **2026-08-29**, and a domain-renewal interstitial on **2025-07-14**. Search snippets still describe a June 2025 WordPress shop. Crawlers that recrawl now get a host error, not this Next.js app. **FACT / OBSERVATION.**

2. **The name “Nile Pharma / نايل فارما / شركة النيل للأدوية” already belongs, in search, to a different company** — El-Nile Co. for Pharmaceuticals and Chemical Industries, `nilepharma.com.eg`, founded 1962. This storefront’s legal Arabic name (“شركة النيل للأدوية والأغذية والمكملات الغذائية”) overlaps that entity. **OBSERVATION.**

3. **Even after a clean deploy, the new site is not yet built to win the queries that exist.** Arabic product names are stored and never rendered in titles or H1s. There are no indexable category URLs and no educational URLs. Product schema brands CA-MI devices as Alfasigma. Paused and unconfirmed products are eligible for the sitemap. Organization schema has no address, phone, or `sameAs`. Every public page waits on Vendure before HTML is sent. There is no analytics and no Search Console verification file. **FACT (code).**

The catalog itself is a real advantage the market does not have on a live URL: evidence-graded supplement copy, leaflets, bilingual pages, and a small honest range. That advantage is invisible while the host is suspended, and it is partly undone by marketing paragraphs and disease-specific claims that sit next to the careful sentences.

Do not expect this site to “dominate fertility search” by publishing a blog. The first job is to make the official URL a 200 OK storefront, redirect the URLs Google already knows, and make each active product page the best Arabic answer to “what is this, what is in it, what does it cost, who may sell it, and what must it not claim.”

---

## 2. Current SEO Health

| Layer | State | Evidence |
| --- | --- | --- |
| Production host | **Down / suspended** | Fetch 2026-09-23; Wayback 2026-08-29 |
| New storefront | **Not deployed** to that host | Live page is not this Next.js app (WordPress URLs in the index; Bluehost suspension now) |
| Indexable public routes in code | Home, about, story, products, product slugs, quality, careers, contact, shipping, privacy, terms, in `ar` and `en` | `src/app/sitemap.ts` |
| Deliberately non-indexable | blogs, cart, checkout, confirmation, login, register, wishlist, account\* | `noIndex: true` or `robots: { index: false, follow: false }` |
| Hreflang | `ar` and `en` on pages that set alternates. No `x-default` | `page-metadata.ts`, layout, sitemap |
| Schema | Organization (thin) sitewide; Product + Offer + BreadcrumbList on PDPs | `layout.tsx`, `products/[slug]/page.tsx` |
| Content depth | Strong on active supplement PDPs relative to a brochure site; no articles; careers is an empty listing | dictionaries + mock catalog |
| Measurement | No GA4, GTM, Plausible, Search Console, or Bing verification in the repo | search of source |
| Performance lab data | **Not verified** | App not running in production; host is a suspension page |

**Health score in one line:** the codebase has a serious SEO foundation (SSR, canonical helper, hreflang, sitemap, noindex on private routes, some schema). The domain that should carry it is offline, and the remaining gaps are entity, Arabic query match, indexation of unfinished SKUs, schema correctness, and the absence of any page for non-brand questions.

---

## 3. Critical P0 / P1 Findings

Full records are in §28. The ones that block visibility:

| ID | Sev | One line |
| --- | --- | --- |
| F-001 | P0 | `nilepharmafood.com` serves a host suspension page, not the storefront |
| F-002 | P0 | Historical downtime (expiry interstitial 2025-07-14; suspension 2024 and 2026) plus spam-like Wayback URLs on the suspended CGI |
| F-003 | P0 | Indexed URLs are `/product/{slug}`; the new app has no redirect from those paths |
| F-004 | P0 | Brand-name collision with El-Nile Pharmaceuticals, reinforced by Nile’s own Arabic legal name |
| F-005 | P1 | `nameArabic` never appears in title, H1, or visible product name |
| F-006 | P1 | No indexable category or topic URLs; filters are query strings canonicalized to `/products` |
| F-007 | P1 | Product schema sets `brand.name` to Alfasigma for every product, including CA-MI |
| F-008 | P1 | `launching_soon` mapped to `schema.org/PreOrder`; paused and unconfirmed SKUs are not excluded from the sitemap |
| F-009 | P1 | Organization schema omits legal name, address, phone, `sameAs`; NAP disagrees across sources |
| F-010 | P1 | YMYL: disease-specific claims and unqualified marketing paragraphs ship in the same product fields as evidence-graded notes |
| F-011 | P1 | No Search Console, Bing, or analytics implementation; SEO cannot be measured |
| F-012 | P1 | Locale layout blocks HTML on two Vendure calls (`cache: no-store`, 10s timeout) on every public URL |

---

## 4. Full Technical SEO Audit

### Stack — FACT

Next.js 16 App Router, React 19, Payload CMS, Vendure for commerce, Serwist service worker. Rendering is server components. Product routes call `generateStaticParams`. The locale layout also reads cookies/session via Vendure, which **INFERENCE** forces dynamic rendering at request time and limits static caching. Not confirmed against a production build log.

### URL architecture — FACT

Default locale `ar`. Proxy in `src/proxy.ts` redirects paths without `ar` or `en` to `/{defaultLocale}{path}`. A two-letter unsupported locale is replaced with `ar`. Matcher skips `_next`, `api`, `admin`, `offline`, and files with extensions.

Public indexable paths (each in `/ar` and `/en`):

| Path | Intent | Index intent in code |
| --- | --- | --- |
| `/` | Brand home | index |
| `/about`, `/story` | Entity / brand story | index |
| `/products` | Catalog | index |
| `/products/{slug}` | Product | index, all slugs from the repository |
| `/quality-sourcing` | Trust | index |
| `/careers` | Recruiting, currently empty | index |
| `/contact` | Local / contact | index |
| `/shipping-delivery` | Commercial support | index |
| `/privacy-policy`, `/terms` | Legal | index |
| `/blogs` | Empty | **noindex**, absent from sitemap |
| `/cart`, `/checkout`, `/checkout/confirmation` | Transaction | noindex |
| `/login`, `/register`, `/wishlist`, `/account/**` | Private | noindex |
| `/lab/*` | Design prototypes | robots disallow `/*/lab/`; 404 unless `ALLOW_LAB_ROUTES` |
| `/admin`, `/api` | Payload | not in sitemap; **not disallowed in robots.txt** |

### Titles and descriptions — FACT

- Layout template: `%s | {siteName}` where siteName is `نايل فارما فود` or `Nile Pharma Food`.
- Homepage uses the default title (site name) and a solid meta description naming Alfasigma, Egypt, supplements, devices, and NFSA.
- Product title is `product.name` only (Latin). Description is `shortDescription`, which on Proxeed Plus Arabic is a full evidence sentence — usable, but it does not include price, pack, or the Arabic name.
- About title is “من نحن” / “About Us”. Fine for navigational, weak as a brand-entity document title.
- Products listing title is “المنتجات” / “Products”. No category keyword.
- Open Graph images fall back to a product photo (`/products/proxeed-plus.jpg` on the layout). No dedicated 1200×630 brand image. Dimensions in metadata (1000×1000) were **not measured** against the file.

### Canonical and hreflang — FACT

`buildPageMetadata` sets a relative canonical `/{locale}{path}` and language alternates for `ar` and `en`. `metadataBase` is `https://nilepharmafood.com`, so Next should emit absolute URLs. **Not verified in rendered HTML** (app not served).

Gaps:

- No `x-default`. **RECOMMENDATION:** point `x-default` at `/ar` once the site is live, because Arabic is the default and the market. This is a policy choice, not a bug by itself.
- Homepage canonical is not set explicitly in `page.tsx`. Layout alternates point at `/ar` and `/en`, which is correct for the homepage only. Child pages that use `buildPageMetadata` replace `alternates` (the helper exists because Next replaces rather than deep-merges). **FACT** that the helper was written to fix that bug. Pages that hand-roll metadata (PDP, story) also set their own alternates. **INFERENCE:** coverage is consistent for routes read. A rendered-HTML test is still required (none exists in CI).
- Filtered URLs (`?category=`, `?need=`, `?q=`, `?sort=`) keep the canonical of `/products`. **FACT.** That is the right consolidation **if** those URLs should not rank. It also means category intent has no canonical URL of its own. See F-006.
- Breadcrumb JSON-LD uses `?category=` as an `item` URL. That URL is not the canonical. Mild schema/canonical tension.

### Robots — FACT

`src/app/robots.ts`: allow `/`, disallow `/*/lab/`, sitemap `https://nilepharmafood.com/sitemap.xml`.

Does not disallow `/admin`, `/api`, `/cart`, `/checkout`, `/account`, `/login`, `/wishlist`. Those private pages are noindex, so this is crawl waste and an admin discovery issue, not an indexation bug, **unless** Payload’s admin login returns indexable HTML. Admin robots meta: **Not verified** (no rendered admin response).

### Sitemap — FACT

Static routes plus every product from `productRepository.getAllProducts()`, both locales, with hreflang alternates. `lastModified` is `new Date()` on every generation, so every URL looks freshly modified on every request. That is a false freshness signal. If the database is down and mock fallback is off, sitemap generation **throws** (500). Prefer a 200 sitemap of static URLs over a 500. Mock fallback correctly refuses to advertise mock URLs unless `MOCK_CATALOG_FALLBACK` is explicitly on.

Blogs correctly excluded. Lab routes correctly excluded. Category URLs do not exist to include. PDFs are not listed (optional).

### Redirects — FACT

Only the locale proxy. No map for:

- `/product/proxeed-plus` and `/product/proxerex` (indexed WordPress forms; both slash variants observed in snippets)
- `www` vs apex (both DNS records exist; redirect is a host concern, not in `next.config.ts`)
- HTTP to HTTPS (host concern; HSTS is set in app headers, which does nothing if TLS never completes)
- trailing slash (Next default: no trailing slash; old WordPress used both)

**INFERENCE:** deploying this app onto the existing domain without redirects will 404 the only product URLs the index remembers. The proxy will turn `/product/proxeed-plus` into `/ar/product/proxeed-plus`, and the catch-all calls `notFound()`.

### Status codes and soft 404s — Not verified live

Code: unknown product slug → `notFound()`. Catch-all → `notFound()`. Locale 404 uses `x-pathname` to pick dictionary. 404 metadata: **Not verified** (no `generateMetadata` on `not-found.tsx`). A soft 404 would occur if the suspension page returns HTTP 200. Bluehost suspension pages often return **200**. **INFERENCE / known host pattern, not re-measured here** (fetch tool did not return the status code). Treat “suspension page as 200” as a hypothesis to verify with `curl -sI`.

### Headings and semantics — FACT from components

PDP has one H1 (`product.name`), then H2s for benefits, usage, composition, scientific info, downloads, FAQ, testimonials, references, related. Hierarchy is sound. Listing page has one H1. About, contact, blogs have one H1. Homepage H1 lives in `NPFHero` (not re-read line by line; hero is the first section). **RECOMMENDATION:** confirm a single H1 in rendered HTML after launch.

### Language — FACT

`<html lang={locale} dir={direction}>`. Arabic RTL, English LTR. Good. Manifest is Arabic-only (`lang: ar`, `start_url: /ar`). Acceptable for a PWA default. English users installing the PWA still start in Arabic. P3.

### Social cards — FACT

Open Graph and Twitter cards are set on layout and on pages using the helper. `og:locale` is `ar_EG` or `en_US`. `en_US` is slightly wrong for an Egypt company (`en_EG` may or may not be accepted by Facebook). P3. No `og:url` explicitly set; Next may add it from canonical. **Not verified in HTML.**

### Security headers — FACT

`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS `max-age=63072000; includeSubDomains`, Permissions-Policy camera/microphone/geolocation denied. No CSP (comment in `next.config.ts` explains why: Maps iframe and Payload admin). `poweredByHeader: false`. Good baseline. CSP remains a fast-follow, not an indexing blocker.

### JS rendering — FACT

Content is in server-rendered HTML. An inline script adds `html.js` and a theme class. Scroll-reveal CSS hides `[data-reveal]` **only after** JS arms it (`opacity: 0` until revealed). Comment in CSS says server HTML is not shipped with `opacity: 0`. **INFERENCE:** Googlebot executes JS and may snapshot below-fold blocks before intersection observers fire. Text should still be in the DOM. This is a **possible** rendering risk, not a confirmed indexing failure. No-JS users see content. Label: audit with a rendered-HTML crawl after launch, not a rewrite of the animation system on theory.

### Facets, pagination, parameters — FACT

No pagination (8 products). Filters and search are GET query params. No `rel=next/prev` (not needed). No infinite scroll. Risk is crawl of `?q=` combinations via the search form action, mitigated only by canonical. Add a robots approach only if Search Console shows parameter bloat. Do not noindex the clean `/products` URL.

---

## 5. Indexability and Crawl Audit

| Check | Result |
| --- | --- |
| Can Google discover the new IA today? | **No.** The host does not serve it. |
| robots.txt on the live host | **Not verified** (TLS failure from this environment; fetch tool landed on the suspension CGI). |
| Sitemap on the live host | **Not verified.** Code sitemap is coherent for the new IA. |
| Sitemap vs noindex conflicts | Blogs excluded from both. Private routes noindex and absent from sitemap. **Aligned.** |
| Indexable pages with no internal links | Careers, shipping, privacy, terms are footer- or policy-linked. Product pages are linked from the grid. **No orphan among public routes in the component graph**, except a product would be orphaned if removed from the grid and left in the sitemap — not the current case. |
| Pages linked but non-indexable | `/blogs` is in header and footer and is noindex. Crawl waste and a “thin site” impression for users. Not an indexation bug. |
| Canonical to non-200 | Cannot occur until deployed. After deploy, canonical host must be the host that returns 200. |
| JS-only metadata | Metadata is in `generateMetadata`, server-side. **FACT.** Good. |
| Locale duplication | hreflang pairs exist. Without `x-default` and without a live site, duplication risk is latent. |
| Old URL duplication | WordPress URLs vs new URLs will duplicate or 404. **P0 after cutover.** |
| Soft 404 | Suspension page hypothesis. Empty blogs is noindex, so it should not be a soft-404 index problem. Careers (“no open positions”) is indexable and thin. P2. |

**Crawl depth:** home → products → PDP is two clicks. Fine for eight products. The problem is not depth. It is that the tree is not online, and category/topic nodes do not exist.

---

## 6. Core Web Vitals and Performance

**Field CWV, lab Lighthouse, TTFB, LCP, INP, CLS: Not verified.** The production URL is a suspension page. `node_modules` is not installed here; a local Lighthouse run was not performed. The following are **code-identified bottlenecks**, with why they matter.

### P0 performance blockers

None inside the React app can outrank a host that does not answer. Host restoration is the performance P0 as well as the SEO P0.

### P1 performance issues

**F-012 — Layout waits on Vendure for every URL.**  
`src/app/[locale]/layout.tsx` `Promise.all`s `readActiveOrderItems()` and `getActiveCustomer()` before rendering header state. `vendureRequest` uses `cache: "no-store"` and aborts at **10 seconds**. If Vendure is down, public HTML can be delayed up to that timeout (parallel, so one window, not two). Cookie/session reads also make responses personal and hard to cache at a CDN.  
**Why it matters:** LCP and TTFB on mobile search are measured on the document. A 2–10s server wait fails Core Web Vitals regardless of image work.  
**Fix direction:** do not block public HTML on commerce session. Read cart/account in a client or a cached short-timeout path; static-shell the catalog. Verify with TTFB while Vendure is stopped.

**Dynamic catalog prices.** `getLivePrices` also calls Vendure per slug (60s in-memory TTL). A category page of 8 products can fan out 8 Shop API calls on a cold cache. Timeout is per call, and they are parallel, but a cold PDP still adds a Shop API round trip before price HTML. Schema price uses that resolved price. A slow or fallback price is both a CWV issue and a wrong-rich-result issue.

### P2 opportunities

- **Fonts.** Local, `display: swap`. Arabic IBM Plex is four woff2 files (~42–45 KB each) loaded on every page, including English. Glora (six small TTFs) and Montserrat load globally but apply only under `html[lang=en]`. KO Banzeen OTF is ~26 KB × 3. This is not a megabyte problem. It is unused-font cost. Measure before subsetting.
- **Images.** `next/image` is used on hero, cards, galleries. Source JPGs include 400–550 KB device photos and `exhibition-07.jpg` at **989 KB**. next/image should resize if the optimizer runs. Confirm `sizes` and that the optimizer is not disabled in production. Several decorative images correctly use `alt=""`.
- **PDFs.** Leaflets are 1.7–6.1 MB. They are downloads, not LCP, unless linked as preloads (they are not).
- **Framer Motion** on many sections. INP risk on low-end Android. Reduced motion is respected (`MotionConfig reducedMotion="user"`). Do not remove motion for SEO without a trace.
- **Service worker.** Serwist precaches and uses `defaultCache`, with NetworkOnly for `/api`, `/admin`, cart, and checkout. HTML navigations can still be runtime-cached. Googlebot generally does not index via a service worker. Risk is stale pages for returning users, not a classic index bug. Confirm the SW does not intercept first-hit crawler HTML. P2.
- **Third parties.** Google Maps iframe on the contact page, `loading="lazy"`. No tag manager. Good. Maps still costs the contact page.
- **Hero WebGL** is off unless `NEXT_PUBLIC_HERO_WEBGL=1`. Keep it off until measured.

### What not to “optimize” blindly

Do not add a CDN rule that caches HTML containing a session cart. Do not convert the evidence text to client-side fetch. Do not lazy-load the H1 or the composition table.

---

## 7. Product SEO

Eight products. All are generated as static params and, unless the repository filters them, all enter the sitemap. **FACT:** mock repository returns every product regardless of status. Payload repository was not fully line-audited for a status filter; seed copies the same catalog. Treat “all statuses are indexable” as true for the mock path and **likely** for Payload until a rendered sitemap proves otherwise.

| Slug | Status | Price in catalog | Index? (code) | SEO value | Main issue |
| --- | --- | --- | --- | --- | --- |
| proxeed-plus | active | 2550 EGP | yes | Highest | Arabic name unused; scientificInfo mixes trial summary with “safe and effective / patented” copy; calorie 12 vs proxeed.com’s 10; carnitine amount conflicts with other publishers |
| proxeed-women | active | 2550 EGP | yes | High | Leads with PCOS and amenorrhea outcomes. Needs label-claim and citation check before this is an SEO landing page |
| proxerex | active | 1790 EGP | yes | High | Short description is appropriately bounded; confirm scientificInfo stays bounded. Market price conflict 1790 vs 1200 (directory) |
| ca-mi-pulse-oximeter | active | 500 EGP | yes | Medium | Schema brand wrong. Specs are useful. No warranty/manual field |
| ca-mi-ir-thermometer | active | 750 EGP | yes | Medium | Same brand error. Good spec table |
| proxeed-men | launching soon | no price in the lines read | yes | Low until launch | PreOrder schema if a price appears; otherwise Product without Offer. Still indexable while unavailable |
| proxeed-women-inositol | launching soon | no price | yes | **Should not be indexed** | Catalog says Myo-Inositol amount is **not yet confirmed** and packaging is pending, while key benefits state a 2025 meta-analysis result |
| ellamuselle | paused | 1200 EGP | yes | **Should not be a landing page** | Sexual-health claims, weakest evidence, not for sale, price still in schema as OutOfStock |

### Rich-result eligibility (code review, not Google’s tester)

Active PDPs can qualify for Product snippets **if** price, currency, availability, and name match the visible page and the URL returns 200. Missing recommended fields: `seller` (should be Nile Pharma Food), `brand` (must be the real brand), image as an absolute URL (code prefixes `https://nilepharmafood.com` — good), `sku` (present). GTIN: **do not invent**. A UK listing showed Ellamuselle GTIN `8717825970136` and a Romanian listing showed Proxeed Women `0802003010070`. Those are **candidates to verify against the Egypt pack**, not schema facts.

AggregateRating and Review: **correctly absent.** Do not add them for the Nick/Stuart quotes.

`launching_soon` → `https://schema.org/PreOrder` is wrong if the button does not take a preorder. **FACT** that the mapping exists. Checkout behavior for that status: add-to-cart is expected to be disabled (`unavailable` label). PreOrder means the offer can be ordered ahead. **RECOMMENDATION:** omit `Offer` until the SKU is orderable, or use a non-offer Product. Do not use PreOrder as a synonym for “coming soon.”

### Duplicate thin descriptions

Devices are specific. Supplements are specific. No two products share a short description. The risk is not duplication. It is **claim overflow** and **Latin-only titles**.

### Internal product links

Related products are same category, max 4. Supplements cross-link to each other. Devices cross-link to each other. No supplement → device link. Good. No product → educational link, because no educational URL exists.

---

## 8. Content SEO

### Inventory of public content

| URL pattern | Type | Depth | Intent match | Keep / improve / merge / redirect / remove / create |
| --- | --- | --- | --- | --- |
| `/{locale}` | Home | Real sections: hero, proof, spotlight, needs, trust, evidence, story, testimonials, contact | Brand + light commercial | **Improve** — Arabic product names, entity sentence vs the other Nile, don’t lead with imported testimonials as proof |
| `/about` | Entity | Several sections, NFSA, founding 2019, manufacturing note | Brand | **Improve** — legal name disambiguation, sameAs, NAP consistency |
| `/story` | Brand editorial | Long | Brand | **Keep**, low SEO priority |
| `/quality-sourcing` | Trust | Short but specific (distributor not manufacturer, NFSA decision 1/2018, validity through 2030) | Trust | **Improve** — add verifiable registration IDs if they exist |
| `/products` | Listing | Grid + matrix | Commercial head | **Improve** — cannot rank for category intents while filters are non-canonical |
| `/products/{active}` | PDP | High for supplements | Product | **Improve** claims and titles; **keep** structure |
| `/products/{paused or unconfirmed}` | PDP | Misleading completeness | — | **Noindex or remove from sitemap** until saleable and fact-complete |
| `/careers` | Empty jobs | Thin | Recruiting | **Noindex** until a real posting exists, or leave indexable only if the company wants the URL. Thin. P2 |
| `/contact` | NAP + form + map | Enough for contact intent | Local | **Improve** schema |
| `/shipping-delivery` | Policy | Present | Support | **Keep** |
| `/privacy-policy`, `/terms` | Legal | Substantial, dated August 2026 | Trust | **Keep**. Privacy mentions analytics the site does not have — fix the sentence when analytics is added, or now so it is not a false disclosure |
| `/blogs` | Empty | None | — | **Keep noindexed** until real articles. Do not create filler |

### Originality

Product evidence notes look written for this catalog, not spun from a competitor template. That is a strength. The unqualified paragraphs inside Proxeed Plus `scientificInfo` read like older marketing copy pasted under a careful summary. **RECOMMENDATION:** one voice per PDP. The careful voice.

### Arabic vs English

Arabic is the default and the commercial language observed in Egypt product search. English pages are justified for clinicians and for hreflang, but English titles that only say “Proxeed Plus” will compete with `proxeed.com` and lose. English titles should include **Egypt** and **distributor** so they are a different intent. **RECOMMENDATION**, not a guarantee of ranking.

---

## 9. Health / YMYL Content Audit

This site sells health-related products. Search systems and Egyptian advertising rules both punish claims the label does not support. This audit does not re-adjudicate the science. It flags what the site asserts.

### Claims that need a label check before they are used as landing-page copy

**FACT (catalog text):**

- Proxeed Plus key benefits describe a 2024 placebo-controlled study and improvements in concentration, count, and motility over 6 months, with a better response in men ≤35 and normal BMI. References include Busetto 2018, Micic 2019, Vessey 2020, and others. The 2024 study named in the body is **not** in the `clinicalReferences` list that was read (Busetto 2018 and 2012 are). A claim and its citation should be the same paper.
- The same field then says the product is safe and effective, patented, and recommended for men with fertility problems or preparing for ART. That is a broader claim than the age/BMI finding above it.
- Proxeed Women short description and benefits assert improvements in insulin, cholesterol, and cycle regularity in women with PCOS and insulin resistance, and hormonal regulation in stress/exercise amenorrhea. The code comment in `types.ts` uses “does not extend to general PCOS” as the *intended* standard. The rendered lead does not carry that boundary in the sentences read.
- Inositol benefits cite a 2025 analysis of 11 studies on oocyte maturation in PCOS/IVF while the composition line says the inositol amount is unconfirmed.
- Proxerex short description is the model: ingredient-level, and “not a substitute for erectile-dysfunction treatment.”
- Ellamuselle FAQ admits there is no substantial product-level trial, while other sentences still say it enhances libido and blood flow.
- Halal certification is asserted in FAQs. Certificate is **not** linked. **Do not treat as verified** in this audit.
- About page states manufacturing partners include Olimp-Lab and companies approved by FDA and EMA. A code comment says the owner confirmed this verbally. There is no citation on the page. For YMYL, an uncited regulator claim is a trust liability even if internally true.

### What is missing for health trust

- No medical reviewer, no author, no editorial policy, no “last medically reviewed” date.
- No adverse-event or “talk to a doctor / pharmacist” block consistently above the fold.
- No pregnancy/breastfeeding caution observed in the excerpts (may exist in the PDF leaflets — **Not verified**; `pdftotext` was not available).
- Testimonials of conception (“we became parents”) on the homepage. If these are manufacturer marketing stories, they must be labeled as such and not as verified Egyptian customers. They must not be marked up as reviews. **RECOMMENDATION:** remove them from the homepage until provenance is written on the page. They are a trust risk, not a rich-result opportunity.

### What not to do

Do not add disease articles (PCOS, erectile dysfunction, infertility treatment) to chase informational queries. Do not copy 3arabtrend, pin-prick, or Profertil pregnancy-rate claims. Do not add FAQ schema that repeats cure language.

A responsible educational page, later, may define a nutrient’s studied role, cite the paper, state what the Egypt label is allowed to say, and link to a product only at that boundary. That is a content project with a clinician, not an SEO template.

---

## 10. Keyword and Search Intent Universe

Search volume: **Not verified.** Difficulty scores: **Not verified.** Current rank: **Not verified.** The table is an intent map from observed SERP types and the real catalog.

| Query cluster | Lang | Intent | Funnel | Target that should exist | Observed SERP type | Gap |
| --- | --- | --- | --- | --- | --- | --- |
| نايل فارما فود / Nile Pharma Food | AR/EN | Navigational | Brand | Home + about | Entity profiles + stale homepage | Site down |
| نايل فارما / Nile Pharma / شركة النيل للأدوية | AR/EN | Navigational, wrong entity | Brand | Disambiguation on about | Other company’s site | Name collision |
| بروكسيد بلس / بروكسيد بلس 30 كيس / سعر بروكسيد بلس | AR | Transactional | Bottom | `/ar/products/proxeed-plus` | Directories, pharmacies | Arabic name not in title; site down |
| Proxeed Plus Egypt | EN | Commercial | Bottom | `/en/products/proxeed-plus` | US brand site + directories | English page must say Egypt |
| بروكسيد نساء / Proxeed Women | AR/EN | Transactional | Bottom | Women’s PDP | EU/US stronger than Egypt in this pass | Same |
| بروزيركس / Proxerex | AR/EN | Transactional | Bottom | Proxerex PDP | Directories + stale official URL | Same |
| Proxeed Men / Inositol | EN/AR | Commercial | Mid | Do not target until launch | Thin | Unfinished facts |
| Ellamuselle | EN | Product | — | Noindex while paused | EU retailers | Don’t compete while paused |
| مكملات خصوبة رجال مصر | AR | Commercial investigation | Mid | Decision page + men’s PDP | Wellman, Carnivita, Profertil shops | No category URL |
| الفرق بين بروكسيد بلس وبروكس إيركس | AR | Comparison | Mid | One comparison URL | Not well served | Market gap |
| ضعف حركة الحيوانات المنوية | AR | Informational YMYL | Top | Not a target until review process | Mayo + sales articles | Do not fake |
| L-carnitine والحيوانات المنوية | AR/EN | Informational | Top | Ingredient note, cited | Mixed | Only with boundaries |
| موزع Alfasigma في مصر | AR/EN | Navigational | Brand | About / quality | Distributor table → dead URL | Restore URL |
| ميزان حرارة CA-MI / pulse oximeter CA-MI | AR/EN | Product | Bottom | Device PDPs | Thin | Schema brand bug; Arabic title |
| مكملات غذائية (generic) | AR | Category | Mid | Not a realistic head term for 6 supplements | Large retailers **UNCONFIRMED** | Don’t build a doorway |

**RECOMMENDATION:** measure these clusters in Search Console after launch. Do not buy a keyword list and generate pages from it.

---

## 11. SERP Landscape

Detail is in the competitive report. Audit conclusions only:

- **Brand short name:** other company. Nile Food will not displace `nilepharma.com.eg` with a homepage slogan. Success looks like sitelinks for the *full* name and a knowledge-panel distinction, not rank 1 for the ambiguous name. **Not a promise.**
- **Product + سعر:** directories and pharmacies. Page type rewarded in the observed set is a commercial PDP, including thin ones, because the official page is absent. After launch, the quality bar should be higher than those directories, not a copy of them.
- **English Proxeed:** manufacturer US site. Nile’s English PDPs are a localization, not the brand canonical for the world.
- **Informational fertility:** authority sites and junk commercial articles. Not Nile’s first battlefield.
- **AI answers:** **Not verified.** The suspension page is what a crawler can fetch. Any AI system using a cached 2025 page may repeat old claims (“clinically proven libido”) that the new copy has narrowed. Another reason to restore the URL and redirect old paths.

Baseline rankings: **none.** Do not invent them.

---

## 12. Brand and Entity SEO

### Can a user or a crawler tell who Nile Pharma Food is?

From the **new code**, partially:

- Site name, Alfasigma distributor role, Egypt, NFSA, 2019, Obour address, two phones, email, product ownership on PDPs.
- Logo SVG at `/npf-logo.svg`. Google’s logo guidelines prefer a raster image. **RECOMMENDATION:** also provide a PNG/JPG logo in Organization schema. P2.
- No founder/leadership names (intentionally hidden). That is acceptable. Do not invent Person schema.
- No `sameAs`. Facebook, Instagram, and LinkedIn exist as **observations** in search, and they are not connected in code.

From the **live web**, poorly: the domain is a suspension page, and the short name resolves to another firm.

### Brand SERP defense plan

1. One legal name, one trade name, used the same way on site, LinkedIn, Facebook, Google Business Profile (if any), and the Alfasigma listing.
2. Suggested public trade name already in the UI: **Nile Pharma Food / نايل فارما فود**. Use the long Arabic legal name only with the food-supplements qualifier, and add one sentence: this company is not El-Nile Co. for Pharmaceuticals and Chemical Industries (`nilepharma.com.eg`).
3. Organization schema: `legalName`, `name`, `url`, `logo` (raster), `email`, `telephone` (one verified set), `address`, `foundingDate` (2019, if confirmed), `areaServed: EG`, `sameAs` only for profiles that exist.
4. `brand` on Alfasigma products = Alfasigma. `brand` on CA-MI = CA-MI. `seller` = Nile Pharma Food.
5. Ask Alfasigma to keep the distributor URL on HTTPS and on the host that is actually live. The search-index row still uses `http://www.nilepharmafood.com`.
6. Resolve the phone conflict before publishing both numbers: site `01027639857` vs Alfasigma index `+201276655720`. The `01024442340` number agrees across old site, directory, and new site.
7. Do not create fake Wikidata or fake press. A Wikidata item is appropriate only if the company wants one and the statements are sourced. **Not recommended as a tactic.** Optional later.
8. Branded FAQ: “هل نايل فارما فود هي شركة النيل للأدوية؟” Answer: no. That single Q&A is legitimate, not FAQ spam.

Google Business Profile: **Not verified** whether one exists. pharmaceuticalbank has a pin. Search did not return a GBP knowledge panel in this pass. Investigate in the Google Business dashboard. Do not create a second listing that uses the colliding name.

---

## 13. AEO / GEO / AI Search Readiness

| Signal | State |
| --- | --- |
| Entity clarity | Weak in schema; medium in about copy; broken at the live URL |
| Factual consistency | Composition and calories conflict with other publishers; phones conflict |
| Concise answer blocks | PDPs open with a short description. Good start. Not structured as a definition + boundary + dose in the first 50 words on every SKU |
| Tables | Composition tables exist. Good. |
| FAQs | Real ones exist. Good. Some answers assert halal and calories that need a source on-page |
| Citations | Present on Proxeed Plus; not consistently tied to the sentence they support |
| Original data | Egypt price, NFSA status, distributor role — original if the site is live. Not original while only caches exist |
| Author identity | Absent |
| Citation readiness | **Low until the URL returns 200 and the facts stop contradicting the leaflet** |

**AI citation readiness:** not ready. A system that can fetch the URL today should cite nothing. A system using the June 2025 cache may cite claims the new catalog has narrowed. Restoring the site and redirecting old URLs is the AEO fix. An `llms.txt` file is **not** an evidenced ranking or citation method. Do not treat it as a deliverable.

Pages that could become source documents after claim review: active PDPs, quality/sourcing, about (entity), shipping (operational facts only).

---

## 14. Internal Linking

### Current graph — FACT

- Header: home, about, story, products, blogs (noindex), quality, careers, contact.
- Footer: about, story, quality, careers, products, `?category=supplements`, `?category=medical-devices`, blogs, contact, shipping, mailto, terms, privacy.
- Home: spotlight and need tiles into products and query filters; evidence block to leaflets; CTAs to about, quality, contact.
- PDP: breadcrumb home → products → `?category=` → self; related products; contact CTA.
- No links from scientific claims to the reference URLs except the reference list at the bottom (the list itself is linked). Good enough.
- Anchor text is mostly navigational (“المنتجات”, product Latin name). Few descriptive Arabic anchors, because Arabic names are not rendered.

### Orphans

None among sitemap URLs, assuming the header/footer render on every page. **INFERENCE** from the layout. Confirm after render.

### Recommended architecture (links, not a rewrite)

- Active PDP ↔ its hub (men’s fertility support or women’s or devices), using a **path**, with Arabic anchor text.
- Hub ↔ decision page ↔ PDP.
- About ↔ quality ↔ home. Already close.
- Do not link unfinished SKUs from hubs.
- Remove or relabel the blogs nav item until articles exist.
- Breadcrumb category `item` should be the canonical hub URL, not `?category=`.

---

## 15. Image and Video SEO

| Item | Finding |
| --- | --- |
| Product card alt | `product.name` (Latin). Should include Arabic name on `/ar` |
| Gallery main alt | Product name. Thumbnails `alt=""` (decorative duplicates). Acceptable |
| Hero and story photos | Some `alt=""` (decorative). Exhibition photos share one alt (the section title) three times. Repetitive but not empty |
| Filenames | Descriptive (`proxeed-plus-hero.webp`). Good |
| Formats | Mix of JPG and WebP. No AVIF source. next/image can emit modern formats if the optimizer runs. **Not verified** |
| Uniqueness | Product packshots look purpose-shot. Stock pregnancy photo on contact is generic. P3 |
| Image sitemap | None. Optional at this catalog size |
| Video | None in the new app. Old site had a YouTube icon. Channel **Not verified**. Do not embed a video that does not exist |
| Opportunity | Arabic alt text “بروكسيد بلس — عبوة 30 كيس” helps image search more than another blog. Secondary to getting the page indexed |

---

## 16. Local SEO

A physical address is published (El Obour, Qalyubia). This is a distributor office/warehouse, not a chain of clinics.

**FACT:** contact page shows address, phone (`tel:` on the first number only), email, and a Google Maps embed of the address string. No `LocalBusiness` or `PostalAddress` schema. No hours. No map link with a Place ID.

**Not verified:** Google Business Profile, citation consistency on Maps, whether the address is a public showroom (local-pack eligibility depends on that; a closed industrial unit may not be a local-pack business). Do not invent hours or a storefront category.

**RECOMMENDATION:** if they accept visitors or deliver from this site, add `Organization` address now; add `LocalBusiness` only if the location is a real customer-facing place. NAP must match the Alfasigma listing and any GBP. Fix the phone mismatch first.

---

## 17. Off-page / Authority

No backlink index. Qualitative only.

**Observed legitimate mentions:** Alfasigma distributor search snippet (link to the domain), LinkedIn, Facebook snippet, pharmaceuticalbank, ZoomInfo. ZoomInfo revenue and employee counts are **not facts for this audit**.

**Observed risk:** Wayback CDX shows `suspendedpage.cgi` URLs with spam software-path query strings (2024 and 2026). After the site returns, Search Console should be checked for hacked or unexpected URLs. Do not “disavow” from a hunch.

**Do not recommend:** buying links, PBNs, article syndication farms, or mass Egyptian business-directory submissions.

**Legitimate next steps, later:** ask Alfasigma to confirm the HTTPS URL; keep LinkedIn industry as distributor rather than “Pharmaceutical Manufacturing” and type as private if that is true (the listing says Public Company — likely wrong); one accurate directory correction (pharmaceuticalbank) if they control it. Digital PR is optional and not the bottleneck.

---

## 18. Analytics and Measurement

**FACT:** no analytics SDK, no `dataLayer`, no GSC meta tag, no Bing `msvalidate`, no ecommerce event helper. Privacy copy says the site may use analytics. It does not.

**Blind spots:** organic landing page, query, product view, add to cart, checkout start, purchase, contact submit, phone click, WhatsApp (no WhatsApp link was found in the footer read), locale, 404s.

**RECOMMENDATION:** before any content program, verify the domain in Google Search Console and Bing Webmaster Tools, submit the sitemap, and add a privacy-respecting analytics setup with consent if non-essential cookies are used. Egypt’s data-protection expectations are a legal question for the company; the Maps iframe already loads a third party without a consent UI. That is a compliance item, not an SEO ranking item.

Events worth defining (not implementing in this phase): `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `generate_lead` (contact), `click_phone`. SPA navigations are App Router navigations; if a tag is added later, it must fire on client navigations, not only first load.

Baseline values: **none.** Do not backfill fake baselines.

---

## 19. Accessibility

Not a full axe run (**Not verified** in a browser). Code observations that also affect SEO:

- Breadcrumb `<nav aria-label="Breadcrumb">`. Good.
- Form inputs on contact and product search: search input has no associated `<label>` (placeholder only). P2 accessibility.
- Icon buttons: wishlist and theme need an audit of accessible names. Not fully read. P2 to test.
- Focus rings exist on several controls (`focus-visible:ring`). Good sign.
- Tap targets: many links use `min-h-11` on mobile. Deliberate. Good.
- Heading order on PDP looks correct.
- Contrast of white text on the dark story band is commented as designed for 4.5:1. **Not measured.**
- Maps iframe has `title="NPF location"`. Good.
- Accordion FAQ is real HTML, not a div soup. Good for both AT and crawlers.

Accessibility failures here are not the reason the site is absent from search. They matter after launch, especially on checkout.

---

## 20. Security / SEO Attack Surface

| Item | Finding |
| --- | --- |
| HTTPS | Intended. Live TLS from this sandbox failed with `SSL_ERROR_SYSCALL`. Suspension page was still retrieved by another fetch path. Re-test. |
| Mixed content | Not observable. Old Alfasigma link uses `http://`. |
| Secrets in repo | `.env.example` has placeholders only. No live secrets read. |
| Source maps | **Not verified** in a production build. |
| Admin | `/admin` is a public route by design (Payload). Robots does not disallow it. Protect with a strong secret and hosting rules. A public admin login is normal; an indexed admin is not. |
| Spam on suspended host | Wayback query-string spam on `suspendedpage.cgi`. Check for injected pages after restoration. |
| Open redirect | Locale proxy redirects only by rewriting pathname to the default locale. It does not forward user-supplied hosts. Login `redirect` parameter was flagged in an older website audit as unconstrained. Re-read: login page itself was not fully re-audited for open redirect in this pass. **Carry as a security check, not an SEO P0.** |
| Service worker | Can cache HTML. See performance. |
| Unexpected indexed URLs | Cannot query Google. Hypothesis: old `/product/` URLs and possibly `/wp-admin` or plugin URLs from the WordPress era. GSC URL inspection after launch. |

No cloaking, no hidden keyword blocks, and no spam pages were found in this repository. The SEO risk is the **previous host’s** behavior, not malicious code in the new app.

---

## 21. Competitor Gap Analysis

Factual gaps only. No “competitor X is better” ranking.

| Intent | Who occupies it | Nile live | Nile codebase | Gap |
| --- | --- | --- | --- | --- |
| Short brand name | `nilepharma.com.eg` | Absent | About page does not disambiguate | Entity |
| Full brand name | Stale cache, LinkedIn | Suspended | Home and about exist | Availability |
| Proxeed Plus price/pack | Directories, Tay, US site | Suspended | PDP exists, Latin title, schema issues | Availability + Arabic title + schema seller |
| Women’s fertility supplement Egypt | EU/US pages, local alternatives (Wellman is men’s) | Suspended | PDP with disease claims to review | Availability + claim safety |
| Male fertility category | Pharmacy categories, shops | None | Query filter only | No URL |
| Informational sperm health | Mayo, commercial articles | None | No article (correct for now) | Not a gap to fill with claims |
| Devices | Thin global catalogs | Suspended | Specs exist, wrong brand in schema | Schema + Arabic title |
| Trust / authorization | Alfasigma row → dead URL | Dead | Quality page states the role | Live URL + sameAs |

Nile’s codebase is **more careful** than Arabic sales blogs and **less complete as an entity** than proxeed.com or the other Nile Pharma. Technical SEO in the new app is **ahead of** the old WordPress snippets (hreflang, canonical helper, noindex on carts) and **behind** on commercial title match and schema correctness.

---

## 22. Recommended Information Architecture

Derived from the real catalog, not from a generic supplement mega-menu. Do not build dental, cosmetics, or drugs hubs.

```
/ar  and  /en                         Brand home
├── /about                            Who we are / who we are not
├── /quality-sourcing                 Authorization + NFSA framing
├── /contact                          NAP
├── /shipping-delivery
├── /products                         All current products
│   ├── /men                          or /needs/mens-health     (path, not only ?need=)
│   │   ├── /products/proxeed-plus
│   │   └── /products/proxerex
│   ├── /women
│   │   └── /products/proxeed-women
│   └── /medical-devices
│       ├── /products/ca-mi-pulse-oximeter
│       └── /products/ca-mi-ir-thermometer
├── /compare/proxeed-range            Decision page, no new claims
├── /legal/privacy  /legal/terms      (or keep current paths)
└── /learn/...                        ONLY after a claim-review process
    (do not launch empty /blogs)
```

Launching-soon and paused SKUs stay out of nav and sitemap until facts and stock exist.

URL change from `?category=` to a path is a **real IA change**. It is justified because category intent currently has no canonical URL and because breadcrumb schema already pretends `?category=` is a page. It is not justified as a rewrite of the whole app. Keep `/products/{slug}` stable so the redirect map from WordPress has one target.

---

## 23. SEO Automated Test Suite

**Not implemented** (no code changes this phase). Specify it so the next phase can add it without noisy failures.

Suggested location: `e2e/seo.spec.ts` plus a small unit test for the metadata helper. Run against `next start` with a seeded database, same as existing Playwright smoke.

### Technical

- `GET /robots.txt` is 200 and contains the sitemap URL and `Disallow: /*/lab/`.
- `GET /sitemap.xml` is 200 and XML-parses.
- Sitemap includes `/ar`, `/en`, `/ar/products/proxeed-plus`, `/en/products/proxeed-plus`.
- Sitemap does **not** include `/blogs`, `/cart`, `/admin`, `/lab`, or — once policy is implemented — paused/unconfirmed slugs.
- Homepage HTML contains exactly one `<h1>`, a `<title>`, a meta description, `<link rel="canonical">`, and `hreflang` for `ar` and `en`.
- PDP canonical is `/{locale}/products/{slug}`.
- `/ar/cart` response contains `noindex`.
- `/ar/product/proxeed-plus` (old shape) returns 301 to `/ar/products/proxeed-plus` **after** that redirect is implemented. Until then, a test that documents the current 404 is the regression guard, not a fake pass.
- Product JSON-LD parses. `brand.name` is `CA-MI` for device slugs and `Alfasigma` for Proxeed. `offers.price` equals the visible price. No `aggregateRating`.
- `launching_soon` HTML does not contain `schema.org/PreOrder` unless a preorder control exists.
- No public page contains `nameArabic` missing from the Arabic `<title>` once that fix exists. Until then, the test should fail on purpose only after the requirement is accepted — do not add a failing test that blocks unrelated CI before the fix is scheduled. Prefer a dedicated job.

### Content

- Duplicate title check across the seeded catalog.
- Arabic PDP title contains the Arabic name.
- Inositol page, if present, is noindex or absent from sitemap while composition contains “غير مؤكدة”.
- Word count gate is a bad idea for device pages. Do not fail CI on word count.

### Performance

- Do not fail CI on lab LCP in GitHub-hosted runners (too noisy). Optional scheduled Lighthouse against production after launch, budget only for regressions (for example document TTFB > 2s on `/ar` with Vendure down).

### Accessibility

- PDP has one H1; search input has a label; images in the product grid have non-empty alt. Contrast: separate axe run, not a flaky unit test.

### Security

- Sitemap and robots do not list `/admin`.
- No response contains `PAYLOAD_SECRET` or `DATABASE_URI`.

### Indexability

- `robots.txt` disallow list and meta noindex do not contradict the sitemap (no URL both disallowed and listed, except a deliberate choice).

---

## 24. CI/CD SEO Regression Gates

Existing CI (`.github/workflows/ci.yml`) runs lint, typecheck, build, unit, and e2e smoke. It does **not** assert SEO output.

Add gates only where a failure is unambiguous:

- Build fails if sitemap route throws on an empty-but-up database (already a risk). After the suite exists: fail if `/ar` title is empty, if PDP canonical is missing, if Product JSON-LD is invalid, if a seeded active product is absent from the sitemap, if `/blogs` loses noindex, if `brand` for `ca-mi-pulse-oximeter` is `Alfasigma`.
- Do not fail the build for missing `x-default` until the policy is decided.
- Do not fail for Core Web Vitals numbers in CI.

Owner type: frontend. Dependency: seeded catalog in CI (already there).

---

## 25. Quick Wins

These assume the host can serve the app. None of them matter on a suspension page, except the first.

| Action | Class | Impact | Effort |
| --- | --- | --- | --- |
| Restore hosting, TLS, apex/www, and confirm HTTP 200 on `/ar` | Emergency | High | Ops, not code |
| 301 old `/product/{slug}` to `/ar/products/{slug}` (and English alternate via hreflang, not a second content URL) | Emergency | High | Small code + host rules |
| Stop indexing paused, launching, and unconfirmed SKUs | Quick win | High | Small |
| Render `nameArabic` in Arabic `<title>` and `<h1>` | Quick win | High | Small |
| Fix Product `brand` and add `seller`; remove PreOrder | Quick win | High | Small |
| Add address, phone, legalName, sameAs to Organization; raster logo | Quick win | High | Small, after NAP decision |
| Remove blogs from header until articles exist | Quick win | Low | Trivial |
| Disallow `/admin` and `/api` in robots | Quick win | Medium | Trivial |
| Verify GSC + Bing and submit sitemap | Quick win | High | Ops |
| Strip unqualified marketing paragraphs from `scientificInfo` | Foundational content | High | Editorial, not a snippet tweak |
| Do not launch a blog this month | — | Avoids harm | — |

---

## 26. 30 / 60 / 90 Day Roadmap

### Day 0–7 — Indexability emergencies

| Task | Owner | Depends on | Impact | Verify | KPI |
| --- | --- | --- | --- | --- | --- |
| Confirm live HTTP status of apex and www from a normal network | Ops | Host login | P0 | `curl -sI` is 200 or a single 301, body is not “Account Suspended” | Host up |
| Point DNS at the new app only after TLS works | Ops | App deploy | P0 | Certificate valid | — |
| Inventory indexed URLs (GSC or `site:nilepharmafood.com`) | SEO | GSC access | P0 | List of `/product/` URLs | Indexed URL list |
| 301 map | Eng | Inventory | P0 | Old URL returns 301, one hop | Redirect coverage |
| Check for hacked URLs in GSC | SEO | GSC | P0 | No spam URLs | Manual actions: none expected, **Not verified** |
| noindex unfinished SKUs before they are crawled | Eng | Deploy | P1 | Absent from sitemap | — |

### Day 8–30 — Foundation, entity, product SEO

| Task | Owner | Impact | Verify |
| --- | --- | --- | --- |
| Arabic titles/H1s, schema brand/seller, Organization NAP | Eng | High | Rich Results test + HTML diff |
| Claim review of the three active supplement PDPs against leaflets and NFSA wording | Clinical/regulatory + content | High | Checklist signed; citations match sentences |
| Resolve phone and legal name | Company owner | High | One NAP on site, LinkedIn, Alfasigma row |
| GSC, Bing, analytics with consent decision | Eng + owner | High | Sitemap submitted, first impression row (value will start at zero) |
| Unblock TTFB from Vendure | Eng | High | TTFB on `/ar` with Vendure stopped |
| Careers noindex or a real job | Content | Low | — |

### Day 31–60 — Clusters and internal links

| Task | Owner | Impact | Verify |
| --- | --- | --- | --- |
| Path hubs for men, women, devices; fix breadcrumbs | Eng | Medium/high | Hubs return 200, self-canonical, in sitemap |
| One comparison page using existing approved positioning only | Content | Medium | No new medical claims in the diff |
| Internal links with Arabic anchors | Eng | Medium | Crawl shows hubs ↔ PDPs |
| Image alts in Arabic | Eng | Low/medium | Alt audit |

### Day 61–90 — Authority and selective education

| Task | Owner | Impact | Verify |
| --- | --- | --- | --- |
| Alfasigma URL correction to HTTPS live host | Owner | Medium | Their page links to 200 |
| GBP decision | Owner | Medium if a real location | Listing matches NAP |
| First educational URL only if a reviewer and a source list exist | Content | Medium, high risk if rushed | Medical review note on the page |
| Re-measure the query clusters in GSC | SEO | — | Real impressions, not estimates |

Do not schedule “rank #1” as a task.

---

## 27. KPI Framework

No baselines. Instruments first, then numbers.

| Area | KPI | Source | Baseline |
| --- | --- | --- | --- |
| Brand | Impressions and clicks for queries containing نايل فارما فود / Nile Pharma Food | GSC | Not available |
| Brand | Indexed URL count on the domain; share that are 200 vs excluded | GSC | Not available |
| Brand collision | Impressions for نايل فارما without فود — expect the other site to keep most of these | GSC | Not available |
| Non-brand | Clicks and impressions by cluster (Proxeed Plus, Women, Proxerex, devices) | GSC | Not available |
| Product | Product-page clicks; add-to-cart; purchases | Analytics, after it exists | Not available |
| Content | Indexed educational URLs (target: 0 until a real one ships) | GSC | 0 in code |
| Technical | CWV (LCP, INP, CLS) on home and PDP, mobile | CrUX / GSC, after traffic exists | Not available |
| Technical | Sitemap status, robots, rich-result errors | GSC | Not available |
| Entity | NAP match across site, GBP, Alfasigma listing | Manual quarterly | Currently mismatched |
| AI/AEO | Not a vanity “citation count.” Proxy: pages with a definition, table, dose, boundary, and source | Content QA | Active PDPs partial |

---

## 28. Complete Findings Register

### F-001

- **ID:** F-001
- **Category:** Indexability / hosting
- **Severity:** P0
- **Affected URLs:** `https://nilepharmafood.com/`, `https://www.nilepharmafood.com/`
- **Evidence:** Page fetch on 2026-09-23 returned Bluehost “Account Suspended” (`cgi-sys/suspendedpage.cgi`). DNS apex and www → `173.254.104.205`. Sandbox TLS to that IP failed with `SSL_ERROR_SYSCALL`.
- **Why it matters:** Crawlers and users cannot see the storefront. No title, canonical, or schema on the new app is in production.
- **Search impact:** Brand and product URLs cannot rank as this website. Stale WordPress snippets may linger and then be replaced by a soft error.
- **Business impact:** Organic and direct traffic to the official domain fails.
- **Root cause:** Hosting/account state at Bluehost, outside this repository. The new app is not what that vhost serves.
- **Recommended fix:** Restore or migrate the domain. Confirm a single 200 HTML response for `/ar` and a single hop from `/` and `www`. Do not deploy SEO copy onto a suspended account.
- **Complexity:** Ops. Low code.
- **Dependencies:** DNS access, hosting billing, TLS certificate.
- **Verification:** `curl -sI https://nilepharmafood.com/ar` shows 200 (or 301 to the canonical host) and the body contains `نايل فارما فود`, not “Account Suspended.”

### F-002

- **ID:** F-002
- **Category:** Indexability / reputation
- **Severity:** P0
- **Affected URLs:** domain history
- **Evidence:** Wayback 2025-07-14: “domain is pending renewal or has expired.” Wayback 2024-06-15 and 2026-08-29: `suspendedpage.cgi`. CDX shows suspension URLs with spam software-path query strings.
- **Why it matters:** Repeated dead periods waste whatever equity the WordPress shop had and can associate the host with spam URLs.
- **Search impact:** Slower recovery after relaunch; possible unexpected indexed URLs. Manual actions: **Not verified.**
- **Business impact:** Distributors and Alfasigma’s own link point at an unreliable host.
- **Root cause:** Domain/host continuity, not the Next.js code.
- **Recommended fix:** After restore, inspect GSC for security issues and unexpected URLs. Remove spam paths at the host. Set renewal reminders.
- **Complexity:** Ops.
- **Dependencies:** GSC property.
- **Verification:** GSC security issues = none; a sample of CDX spam URLs return 404 or 301 to home, not 200 spam.

### F-003

- **ID:** F-003
- **Category:** Redirects / migration
- **Severity:** P0 (at cutover; latent until deploy)
- **Affected URLs:** `https://nilepharmafood.com/product/proxerex`, `/product/proxeed-plus/`, and any other WordPress product permalink. Targets should be `/ar/products/{slug}`.
- **Evidence:** Search snippets still cite `/product/...`. `src/proxy.ts` only prefixes a locale. `src/app/[locale]/[...catchall]/page.tsx` calls `notFound()`. No redirect table in `next.config.ts`.
- **Why it matters:** The only product URLs known to have been crawled will 404 (or locale-redirect then 404).
- **Search impact:** Loss of any remaining product-URL memory; users from old links bounce.
- **Business impact:** Bookmarks, ads, and Alfasigma-adjacent links break.
- **Root cause:** New IA without a migration map. Correct new IA; missing bridge.
- **Recommended fix:** 301 `/product/{slug}` and `/product/{slug}/` to `/ar/products/{slug}` for known slugs. One hop. Do not chain through `/ar/product/...`.
- **Complexity:** Low.
- **Dependencies:** Slug list from the old sitemap or GSC. 2022 product sitemap body was not readable in Wayback (wrapper only). Recover slugs from GSC or a backup.
- **Verification:** Each old URL returns 301, Location is the Arabic PDP, final URL is 200.

### F-004

- **ID:** F-004
- **Category:** Entity
- **Severity:** P0 for ambiguous brand queries; P1 for product queries
- **Affected URLs:** `/ar/about`, privacy intro, any page using the long Arabic legal name; competing site `https://nilepharma.com.eg/`
- **Evidence:** Search results for نايل فارما / شركة النيل للأدوية / Nile Pharma return the 1962 manufacturer. Privacy copy uses “شركة النيل للأدوية والأغذية والمكملات الغذائية.” LinkedIn industry is “Pharmaceutical Manufacturing”; type “Public Company.”
- **Why it matters:** The query the company most wants for its short name is already satisfied by a larger, older entity.
- **Search impact:** Brand SERP confusion. Product queries are less affected if the product name is unique (Proxeed).
- **Business impact:** Misdirected clinicians, patients, and partners.
- **Root cause:** Name overlap plus weak `sameAs` and a dead official site.
- **Recommended fix:** Disambiguation sentence; consistent trade name; Organization `legalName`; do not SEO-target the other company’s drug names. Correct LinkedIn if the company controls it.
- **Complexity:** Low copy, medium coordination.
- **Dependencies:** Owner confirmation of the registered legal name.
- **Verification:** About page contains both names and the distinction. Schema `name` ≠ the other company’s name.

### F-005

- **ID:** F-005
- **Category:** On-page / international
- **Severity:** P1
- **Affected URLs:** `/ar/products/*`, product cards, homepage spotlight
- **Evidence:** `nameArabic` is in the product type, mock data, Payload, and seed. `localizeProduct` does not map it onto `name`. PDP `<h1>` and `<title>` use `product.name` (Latin). Grep shows no component reads `nameArabic`.
- **Why it matters:** Egypt commercial queries are Arabic (“بروكسيد بلس”). The Arabic page’s strongest on-page element does not contain the query.
- **Search impact:** Weaker query match and weaker Arabic sitelink text.
- **Business impact:** Users scanning the SERP see a Latin title and may choose a directory that says بروكسيد بلس.
- **Root cause:** Display name and SEO name were left as the Latin brand name for both locales.
- **Recommended fix:** On `ar`, title and H1 should be `{nameArabic} ({name})` or `{nameArabic} — {pack}`. Do not stuff a paragraph into the title. English title should add “Egypt” where it differentiates from proxeed.com.
- **Complexity:** Low.
- **Dependencies:** Confirm Arabic orthography (بروكسيد بلس vs other spellings observed: بروكسيد).
- **Verification:** Rendered `/ar/products/proxeed-plus` title contains بروكسيد بلس and the site name.

### F-006

- **ID:** F-006
- **Category:** Information architecture
- **Severity:** P1
- **Affected URLs:** `/ar/products?category=supplements`, `?category=medical-devices`, `?need=mens-health`, `?need=womens-health`. Footer links the category params.
- **Evidence:** `products/page.tsx` canonical is always `/products`. No category route. Sitemap has no category URLs. Breadcrumb schema points at the query URL.
- **Why it matters:** Category and “men’s supplements” intents have no canonical document. Internal links point at URLs that ask to be consolidated away.
- **Search impact:** Cannot earn a category URL. Possible crawl of parameter variants.
- **Business impact:** Paid and organic landing for “men’s range” has nowhere stable to go except a filtered view Google is told to ignore.
- **Root cause:** Filters implemented as search params only. Reasonable for eight products, insufficient as the only IA.
- **Recommended fix:** Add a small set of path hubs. Self-canonical. In sitemap. Keep query search `?q=` canonicalized to `/products` or noindex it if it starts getting indexed as thin combinations.
- **Complexity:** Medium.
- **Dependencies:** IA sign-off. Do not create dental/cosmetics/drugs hubs.
- **Verification:** Hub URL in sitemap, self-canonical, linked from footer, returns products.

### F-007

- **ID:** F-007
- **Category:** Structured data
- **Severity:** P1
- **Affected URLs:** all PDPs, especially `/products/ca-mi-pulse-oximeter` and `ca-mi-ir-thermometer`
- **Evidence:** `products/[slug]/page.tsx` sets `brand: { "@type": "Brand", name: "Alfasigma" }` unconditionally. Device copy says CA-MI.
- **Why it matters:** Structured data must match visible content. A wrong brand is an eligibility and trust error.
- **Search impact:** Product rich results may be dropped or may show the wrong brand. Entity graph ties devices to Alfasigma.
- **Business impact:** CA-MI and Alfasigma are different principals.
- **Root cause:** Single hardcoded brand.
- **Recommended fix:** Brand from data. Seller = Nile Pharma Food on the Offer. Do not add GTIN until verified.
- **Complexity:** Low.
- **Dependencies:** None.
- **Verification:** Rich Results test; JSON-LD brand equals visible brand.

### F-008

- **ID:** F-008
- **Category:** Structured data / indexation
- **Severity:** P1
- **Affected URLs:** `proxeed-men`, `proxeed-women-inositol`, `ellamuselle`, and any future paused SKU
- **Evidence:** Availability map sends `launching_soon` to `schema.org/PreOrder`. Sitemap includes all repository products. Inositol composition value is “الكمية الدقيقة لكل كيس غير مؤكدة بعد.” Ellamuselle status is `paused` with price 1200 and sexual-health copy.
- **Why it matters:** PreOrder is a merchant claim. An unconfirmed dose must not be a landing page. A paused product with a price can be crawled as a live offer marked OutOfStock, which is less wrong than PreOrder but still a thin/YMYL URL.
- **Search impact:** Index bloat and possible rich-result mismatch. Manual action unlikely; quality demotion possible.
- **Business impact:** Orders or medical questions about a product that is not sold.
- **Root cause:** Status is a commerce badge, not an indexation switch.
- **Recommended fix:** noindex and exclude from sitemap unless `status === "active"` and required facts (composition amounts, pack) are complete. Omit Offer when not orderable.
- **Complexity:** Low.
- **Dependencies:** Agreement that launching products stay unlisted.
- **Verification:** Sitemap grep; robots meta on those URLs.

### F-009

- **ID:** F-009
- **Category:** Entity / schema
- **Severity:** P1
- **Affected URLs:** all pages (Organization JSON-LD in locale layout); `/contact`
- **Evidence:** Schema has `name`, `url`, `logo` (SVG), `email` only. Contact page has address and phones but no PostalAddress schema. Phones: site `01027639857 / 01024442340` vs Alfasigma index snippet `+201276655720` and `+201024442340`. Old homepage schema had `sameAs` Facebook and Instagram; new schema has none.
- **Why it matters:** Entity resolution uses NAP and `sameAs`. The layout schema is too thin to distinguish this company, and the phone set may be wrong.
- **Search impact:** Weaker brand panel and weaker association with the Alfasigma listing.
- **Business impact:** Calls to a wrong number if one of the sources is stale.
- **Root cause:** Schema was added with “only facts already used,” but address and phone are used on the contact page and were still omitted. `sameAs` was dropped relative to the old site.
- **Recommended fix:** After the owner picks the phone set, emit one Organization object with address, telephone, legalName, foundingDate, areaServed, sameAs, raster logo.
- **Complexity:** Low, blocked on NAP confirmation.
- **Dependencies:** Owner.
- **Verification:** Schema validator; NAP string match across contact page and schema.

### F-010

- **ID:** F-010
- **Category:** YMYL content
- **Severity:** P1
- **Affected URLs:** `/products/proxeed-plus`, `/products/proxeed-women`, `/products/proxeed-women-inositol`, `/products/ellamuselle`, homepage testimonials
- **Evidence:** See §9. Careful evidence grades and broad marketing claims coexist in `scientificInfo`. Proxeed Women leads with PCOS and amenorrhea outcomes. Inositol cites a meta-analysis while the dose is unconfirmed. Homepage treats catalog testimonials as customer stories; authors are first names (“نيك، 41 عامًا”, “ستيوارت”). 2024 study mentioned in body is not the same citation list entry as Busetto 2018.
- **Why it matters:** Health queries and ad standards both depend on claim scope. A good grading system that then says “safe and effective” trains users and answer engines on the broader sentence.
- **Search impact:** Possible quality problems; also, if an answer engine quotes the broad sentence, Nile becomes the source of a claim it may not be allowed to make.
- **Business impact:** Regulatory and reputational. Not a ranking trophy.
- **Root cause:** Old marketing copy and new evidence notes were concatenated. Testimonials were reused from a manufacturer-style Miro board (code comments) without an on-page provenance label.
- **Recommended fix:** One evidence grade per product, visible. Every outcome sentence needs the citation immediately or it comes out. Disease claims stay off the page unless regulatory review signs them. Label or remove testimonials. Do not add Review schema.
- **Complexity:** Editorial, medium. Code change is small once copy is approved.
- **Dependencies:** Leaflet, NFSA-approved Arabic label, owner/regulatory sign-off.
- **Verification:** Diff of `scientificInfo` contains no sentence that lacks either a citation or a non-outcome framing. Homepage has no unlabeled conception story.

### F-011

- **ID:** F-011
- **Category:** Measurement
- **Severity:** P1
- **Affected URLs:** sitewide
- **Evidence:** No analytics package, no GSC/Bing verification file, no event helper. Privacy policy discusses analytics hypothetically.
- **Why it matters:** The roadmap cannot be judged. “Dominating search” without GSC is a feeling.
- **Search impact:** None directly. Operational blindness.
- **Business impact:** Cannot see which products earn clicks or whether redirects worked.
- **Root cause:** Not implemented.
- **Recommended fix:** Verify GSC and Bing on the live property. Add analytics only with a consent decision. Align the privacy sentence with reality.
- **Complexity:** Low.
- **Dependencies:** Domain must resolve to the app (verification file or DNS TXT).
- **Verification:** GSC property shows the sitemap and a URL inspection of `/ar` as indexable.

### F-012

- **ID:** F-012
- **Category:** Performance
- **Severity:** P1
- **Affected URLs:** every `/{locale}/**` page
- **Evidence:** Locale layout awaits Vendure cart and customer reads. `vendureRequest` is `cache: "no-store"` with a 10s abort. Pricing path also calls Vendure per slug.
- **Why it matters:** TTFB is part of LCP. A down commerce backend must not make the catalog uncacheable and slow.
- **Search impact:** CWV and crawl resource use. Google does not need a session to index a PDP.
- **Business impact:** Mobile users abandon before the product name paints.
- **Root cause:** Personalization (header cart, login state) is in the root server layout.
- **Recommended fix:** Render public pages without waiting on Vendure. Load cart count on the client or with a short timeout that fails open in under ~300ms. Keep checkout on the live API.
- **Complexity:** Medium.
- **Dependencies:** Header UX acceptance of a late cart count.
- **Verification:** With Vendure stopped, `/ar/products/proxeed-plus` TTFB is comparable to a static page, not ~10s. Measure; do not assume.

### F-013

- **ID:** F-013
- **Category:** Structured data / freshness
- **Severity:** P2
- **Affected URLs:** `/sitemap.xml`
- **Evidence:** `lastModified: new Date()` for every URL on every request.
- **Why it matters:** Tells crawlers everything changed constantly. They may ignore the signal or recrawl wastefully.
- **Search impact:** Low on a small site. Misleading.
- **Business impact:** None direct.
- **Root cause:** No real updated-at on products.
- **Recommended fix:** Use product `updatedAt` from Payload when present; omit `lastModified` rather than lying.
- **Complexity:** Low.
- **Dependencies:** Payload timestamps.
- **Verification:** Sitemap dates stable across two requests if content did not change.

### F-014

- **ID:** F-014
- **Category:** Crawl control
- **Severity:** P2
- **Affected URLs:** `/admin`, `/api`, private routes
- **Evidence:** `robots.ts` disallows only `/*/lab/`.
- **Why it matters:** Admin and API are discoverable. noindex on account pages is the real control; robots disallow is a backstop.
- **Search impact:** Low crawl waste on a small site.
- **Business impact:** Slightly larger admin attack-surface discovery.
- **Root cause:** Robots written for lab routes only.
- **Recommended fix:** Disallow `/admin`, `/api`, and the private locale prefixes. Do not disallow CSS/JS.
- **Complexity:** Trivial.
- **Dependencies:** None. Confirm Payload does not need `/api` crawled (it does not).
- **Verification:** robots.txt contains the rules; sitemap does not list them.

### F-015

- **ID:** F-015
- **Category:** Content / thin page
- **Severity:** P2
- **Affected URLs:** `/{locale}/careers`, `/{locale}/blogs` (blogs already noindex)
- **Evidence:** Careers copy says there are no open positions. It is in the sitemap. Blogs is linked from header and footer and is noindex.
- **Why it matters:** Thin indexable URL. Blogs link wastes crawl and looks unfinished.
- **Search impact:** Low.
- **Business impact:** Minor trust.
- **Root cause:** Routes shipped before content.
- **Recommended fix:** noindex careers until a job exists. Remove blogs from nav or point “Journal” nowhere.
- **Complexity:** Trivial.
- **Dependencies:** None.
- **Verification:** Careers robots meta noindex; header has no blogs link.

### F-016

- **ID:** F-016
- **Category:** International
- **Severity:** P2
- **Affected URLs:** all alternates
- **Evidence:** hreflang `ar` and `en` only. No `x-default`. English OG locale `en_US`.
- **Why it matters:** `x-default` helps when a query has no clear language. Not a P0. `en_US` is a minor geographic miss.
- **Search impact:** Low.
- **Business impact:** None significant.
- **Root cause:** Helper never added `x-default`.
- **Recommended fix:** Add `x-default` → `/ar` if the company agrees Arabic is the fallback. Optional `en_EG`.
- **Complexity:** Low.
- **Dependencies:** Policy.
- **Verification:** View source shows `hreflang="x-default"`.

### F-017

- **ID:** F-017
- **Category:** Content consistency
- **Severity:** P1 (facts), not a code defect until the leaflet is checked
- **Affected URLs:** Proxeed Plus, Proxerex, Inositol FAQs
- **Evidence:** Catalog Proxeed Plus daily composition does not reconcile with per-sachet figures on pazarnaa and the old Nile snippet (carnitine 3,450 mg per 2 sachets vs 1 g per sachet). Calorie FAQ says 12 kcal; proxeed.com FAQ says 10 kcal per packet. Proxerex old snippet showed “2,500 g” vs new catalog “2,500 mg.”
- **Why it matters:** The page that should be the source of truth is about to publish a third number.
- **Search impact:** Answer engines will quote whichever page is live. A wrong official number is worse than a thin directory.
- **Business impact:** Label mismatch is a compliance issue.
- **Root cause:** Multiple upstream tables. PDFs exist in `public/downloads/` and were not text-extracted in this audit (`pdftotext` unavailable).
- **Recommended fix:** Extract the leaflet, lock one per-sachet and one per-day table, cite “per Egypt leaflet, dated …”. Do not copy proxeed.com’s US facts panel blindly.
- **Complexity:** Editorial.
- **Dependencies:** PDFs and regulatory owner.
- **Verification:** Visible table equals PDF. FAQ calories equal PDF.

### F-018

- **ID:** F-018
- **Category:** Trust / reviews
- **Severity:** P2
- **Affected URLs:** homepage, PDPs with testimonials
- **Evidence:** Quotes rendered with first-name authors. Code comments trace them to an old Miro board. No review platform. Schema correctly omits ratings.
- **Why it matters:** Conception anecdotes are the highest-risk social proof in this category.
- **Search impact:** Low directly. High if later marked up as reviews.
- **Business impact:** Trust and advertising standards.
- **Root cause:** Marketing stories treated as local proof.
- **Recommended fix:** Provenance label or removal. Never Review schema.
- **Complexity:** Low.
- **Dependencies:** Owner.
- **Verification:** Homepage source has no testimonial or each quote has an explicit source line.

### F-019

- **ID:** F-019
- **Category:** On-page
- **Severity:** P2
- **Affected URLs:** `/about`, `/products`, home
- **Evidence:** About title “من نحن”. Products title “المنتجات”. Home title is only the site name. Descriptions are decent on the home layout.
- **Why it matters:** Brand queries need the title to say what the company is. “من نحن | نايل فارما فود” is acceptable but weaker than a title that includes “الموزع المعتمد لـ Alfasigma في مصر.”
- **Search impact:** CTR more than rank. **Not measured.**
- **Business impact:** SERP snippet clarity.
- **Root cause:** Titles are navigation labels.
- **Recommended fix:** Rewrite about and home titles to include distributor role and Egypt, without stuffing.
- **Complexity:** Low.
- **Dependencies:** Copy approval.
- **Verification:** Title length reasonable (roughly under 60–70 characters Arabic; measure, don’t obsess).

### F-020

- **ID:** F-020
- **Category:** Media
- **Severity:** P3
- **Affected URLs:** product images, exhibition-07.jpg (989 KB source)
- **Evidence:** File sizes on disk. `next/image` used. Alt is Latin product name.
- **Why it matters:** Source weight matters if the optimizer is bypassed. Alt language misses Arabic image search.
- **Search impact:** Low until pages are indexed.
- **Business impact:** Mobile LCP if a large JPG is the hero.
- **Root cause:** Originals not resized; alt uses `name`.
- **Recommended fix:** Confirm optimizer in production. Arabic alt. Compress the 989 KB exhibition image in the source so a non-optimized fallback is still safe.
- **Complexity:** Low.
- **Dependencies:** Visual QA.
- **Verification:** Response `content-type` of the hero is webp/avif and transferred size is far below the source JPG.

### F-021

- **ID:** F-021
- **Category:** Legal disclosure
- **Severity:** P3
- **Affected URLs:** `/privacy-policy`
- **Evidence:** Privacy section says the site may use analytics. Code has none. Maps iframe is disclosed. Good that Maps is mentioned.
- **Why it matters:** False disclosure is a trust and compliance issue, not a ranking factor.
- **Search impact:** None.
- **Business impact:** Low until a regulator or a user reads it.
- **Root cause:** Policy written ahead of tooling.
- **Recommended fix:** Delete the analytics sentence or implement analytics and a consent state.
- **Complexity:** Low.
- **Dependencies:** F-011 decision.
- **Verification:** Policy matches network calls.

### F-022

- **ID:** F-022
- **Category:** Service worker
- **Severity:** P2
- **Affected URLs:** navigations after first visit
- **Evidence:** `src/app/sw.ts` uses Serwist `defaultCache` plus a document fallback to `/offline`. Transactional routes are NetworkOnly. Catalog HTML is not.
- **Why it matters:** Returning users, and any crawler that executes a SW, might see a stale catalog or the offline shell.
- **Search impact:** Usually low for Googlebot. Real for users and for some fetchers.
- **Business impact:** Stale price after a price change.
- **Root cause:** PWA offline goal vs fresh commerce content.
- **Recommended fix:** Network-first for document navigations of catalog pages, or a short max-age. Do not precache PDP HTML with prices.
- **Complexity:** Medium.
- **Dependencies:** PWA requirements from the owner.
- **Verification:** After a price change, a second visit shows the new price without waiting for a SW update cycle. Test in a browser.

### F-023

- **ID:** F-023
- **Category:** Render / motion
- **Severity:** P3
- **Affected URLs:** pages using `Reveal`
- **Evidence:** `globals.css` sets `opacity: 0` on armed, not-yet-revealed nodes under `html.js`.
- **Why it matters:** If a crawler’s render snapshot happens mid-animation, below-fold text might be invisible in the screenshot. DOM text should remain.
- **Search impact:** **UNCONFIRMED.** Do not rewrite the design system on this alone.
- **Business impact:** None if text is in the HTML.
- **Root cause:** Progressive enhancement that becomes a hide once JS runs.
- **Recommended fix:** After launch, URL Inspection rendered HTML. If text is missing, reveal content by default and animate only `transform`.
- **Complexity:** Low if needed.
- **Dependencies:** GSC render snapshot.
- **Verification:** Rendered HTML contains composition table text.

### F-024

- **ID:** F-024
- **Category:** Local
- **Severity:** P2
- **Affected URLs:** `/contact`
- **Evidence:** Address and phones published. No LocalBusiness schema. GBP **Not verified**. Phone conflict with the Alfasigma index snippet.
- **Why it matters:** Local intent and entity NAP.
- **Search impact:** Local pack **UNCONFIRMED** as a target. Wrong NAP still hurts entity clarity.
- **Business impact:** Wrong-number calls.
- **Root cause:** Schema scope was minimal; phone sources diverged.
- **Recommended fix:** Confirm NAP. Add PostalAddress to Organization. GBP only if the location is customer-facing.
- **Complexity:** Low after confirmation.
- **Dependencies:** Owner.
- **Verification:** Contact page, schema, and GBP (if any) match character for character.

### F-025

- **ID:** F-025
- **Category:** Security headers
- **Severity:** P3
- **Affected URLs:** all
- **Evidence:** CSP intentionally absent (`next.config.ts` comment). Other headers present.
- **Why it matters:** XSS would be an SEO incident if it injected links. Not an indexing bug today.
- **Search impact:** None current.
- **Business impact:** Defense in depth.
- **Root cause:** CSP deferred to avoid breaking Maps and Payload.
- **Recommended fix:** Scoped CSP later, tested on storefront and admin. Not part of the SEO war plan’s first month.
- **Complexity:** Medium.
- **Dependencies:** Admin QA.
- **Verification:** CSP report-only, then enforce.

---

## Opportunity matrix

| | Low effort | High effort |
| --- | --- | --- |
| **High impact** | Host restore; 301 map; noindex unfinished SKUs; Arabic titles; schema brand/seller; Organization NAP; GSC | Vendure-independent public HTML; claim rewrite of PDPs; path hubs |
| **Medium impact** | robots disallow admin; careers noindex; sitemap lastModified; remove blogs nav | Comparison page; image pipeline; SW cache policy |
| **Low impact** | x-default; en_EG; raster logo | Video program; large editorial calendar; calculators |

**Foundational:** host, redirects, entity name, measurement, claim boundaries.  
**Long-term authority:** manufacturer confirmation, a few reviewed explainers, consistent NAP everywhere. Not a link scheme.  
**Experiments:** Arabic title patterns (name first vs pack first). Judge in GSC after 28 days of data. One change at a time.

---

## 29. The question that matters

**If a person today searches for Nile Pharma, one of its products, a supplement category relevant to its catalog, or a legitimate health question Nile could responsibly address, what exactly prevents this website from becoming one of the strongest relevant organic results?**

### 1. The website is not on the internet at its own domain

- **Blocker:** `https://nilepharmafood.com/` returns a Bluehost account-suspension page (fetched 2026-09-23). Wayback shows suspension on 2026-08-29 and a renewal failure page on 2025-07-14.
- **Affected URLs:** the entire production host, including every URL this repository believes is canonical.
- **Technical cause:** DNS still points at `173.254.104.205`, and that vhost is not serving this Next.js app.
- **Remediation:** restore or migrate hosting, valid TLS, single canonical host, HTTP 200 on `/ar`.
- **Verification:** body contains the storefront H1, not “Account Suspended.”

### 2. The URLs search engines already learned will not resolve to the new pages

- **Blocker:** index memory uses `/product/proxerex` and `/product/proxeed-plus/`. The app will locale-prefix those to a non-existent route and 404.
- **Affected URLs:** old WordPress product permalinks.
- **Technical cause:** `src/proxy.ts` plus catch-all `notFound()`, no redirect map.
- **Remediation:** 301 to `/ar/products/{slug}`.
- **Verification:** one-hop 301, final 200, canonical self-references the new URL.

### 3. The brand query is owned by a different company, and this site’s naming helps the confusion

- **Blocker:** `nilepharma.com.eg` and Arabic explainers occupy “Nile Pharma / نايل فارما / شركة النيل للأدوية.” This site’s privacy intro uses a near-identical Arabic legal name. Organization schema has no `sameAs`, no address, no phone. LinkedIn calls Nile Pharma Food a public pharmaceutical manufacturer.
- **Affected URLs:** `/about`, privacy, layout JSON-LD; external profiles.
- **Cause:** entity overlap plus a dead official site.
- **Remediation:** trade name نايل فارما فود, explicit disambiguation, complete Organization, corrected external profiles, Alfasigma listing pointed at a live HTTPS URL.
- **Verification:** about page and schema state the distinction; GSC later shows impressions for the full name on this property. Do not set a KPI of outranking `nilepharma.com.eg` for the short name.

### 4. Product queries are Arabic and commercial, and the Arabic name never reaches the title

- **Blocker:** `nameArabic` is unused. Titles are “Proxeed Plus | نايل فارما فود.” Directories rank with “بروكسيد بلس 30 كيس” and a price, even when the price is from 2023.
- **Affected URLs:** all `/ar/products/*`.
- **Cause:** display name is Latin in both locales.
- **Remediation:** Arabic H1 and title with pack; visible dated price; Offer schema that matches, seller = Nile Pharma Food, brand = actual brand.
- **Verification:** rendered HTML and Rich Results test.

### 5. Unfinished and paused products are treated as real landing pages, and schema over-claims

- **Blocker:** Inositol dose is explicitly unconfirmed and would still be in the sitemap. Ellamuselle is paused and still a Product with a price. `launching_soon` is PreOrder. CA-MI is branded Alfasigma in JSON-LD.
- **Affected URLs:** listed in F-007 and F-008.
- **Cause:** commerce status is not an indexation control; brand is hardcoded.
- **Remediation:** active + fact-complete only; fix brand; no PreOrder.
- **Verification:** sitemap and JSON-LD assertions in the test suite.

### 6. There is no page for category intent, and there should not yet be a page for disease intent

- **Blocker:** men’s/women’s/supplement intent has only `?category=` and `?need=`, canonicalized back to `/products`. Informational queries are held by Mayo and by unsafe commercial articles. The blog route is an empty noindex state — that part is correct.
- **Affected URLs:** `/products`, `/blogs`.
- **Cause:** IA stopped at filters. Education was correctly not faked, and then nothing replaced it.
- **Remediation:** a few path hubs and one comparison page using approved positioning. Disease articles only after regulatory review. Not a 30-post calendar.
- **Verification:** hubs in the sitemap with self-canonicals. No new medical claim without a citation and a sign-off.

### 7. The facts an answer engine would quote are not locked

- **Blocker:** composition and calories disagree with proxeed.com and with Egypt commercial pages. Phones disagree with the Alfasigma distributor row. Testimonials lack provenance. PCOS claims sit in the lead paragraph.
- **Affected URLs:** active PDPs, contact, homepage.
- **Cause:** multiple source tables; marketing copy retained beside evidence notes.
- **Remediation:** leaflet is the composition source; one phone set; claims cut to what the label and the cited paper actually support.
- **Verification:** table-to-PDF check; claim checklist.

### 8. The site cannot see whether any of this worked

- **Blocker:** no GSC, no Bing, no analytics.
- **Cause:** not implemented; also impossible to verify a property that does not resolve.
- **Remediation:** verify both webmaster tools the week the host returns.
- **Verification:** sitemap status “Success”, URL inspection of `/ar` and one PDP.

Nothing in this list is “add more keywords.” The site is absent, the name collides, the Arabic query is not in the H1, the schema is wrong for half the catalog, and the health copy is not yet safe to scale.

---

# SEO WAR PLAN

Execution order. Highest impact only. No code in this phase.

1. **Restore the domain.** `nilepharmafood.com` must return the storefront over HTTPS, apex and www on one canonical host, not a suspension page. Verify with a status code and a body check. Until this is true, stop.
2. **Look for hacked or unexpected URLs** in Search Console and in the host file list before celebrating the relaunch. The suspended CGI has spam-like historical URLs.
3. **301 every old `/product/{slug}` URL** to `/ar/products/{slug}` in one hop. Recover the slug list from GSC, a backup, or the snippets already known (`proxerex`, `proxeed-plus`, and any others GSC shows).
4. **Index only saleable, fact-complete products.** Exclude Ellamuselle, Proxeed Men, and Proxeed Women Inositol from the sitemap and noindex them until the dose, pack, and stock are real. Remove PreOrder.
5. **Put the Arabic name in the Arabic title and H1.** Add pack size. Add “Egypt” on English product titles so they are not a thin copy of proxeed.com.
6. **Fix schema to match the page.** Alfasigma only on Alfasigma products. CA-MI on devices. Seller = Nile Pharma Food. Offer price = visible price. No ratings.
7. **Lock NAP and Organization schema** after the owner confirms the phone and legal name. Add a disambiguation sentence against El-Nile Pharmaceuticals. Add `sameAs` only for real profiles. Ask Alfasigma to point the distributor link at the live HTTPS URL.
8. **Cut health copy to the evidence grade.** One voice on each PDP. Citation next to any outcome sentence, or delete the sentence. Remove or label homepage conception stories. Do not open `/blogs`.
9. **Stop blocking public HTML on Vendure.** Measure TTFB with the commerce API down.
10. **Verify Google Search Console and Bing.** Submit the sitemap. This is how every later claim of progress will be judged.
11. **Add three path hubs and one comparison page** (men, women, devices, range decision) using existing approved wording. Then link them. Do not build dental, cosmetics, or drug hubs.
12. **Only then** consider a single reviewed educational page. Not a content mill. Not competitor claims. Not a promise of rank.

---

## Research limitations

- No production Lighthouse, CrUX, or server log.
- No GSC. Rankings and index coverage of the old URLs are **inferred from search snippets and Wayback**, not from Google’s index API.
- TLS fetch from this sandbox failed; the suspension page was confirmed via the page-fetch tool. Reconfirm from a normal browser in Egypt.
- Leaflet PDFs were not text-extracted.
- Competitor metrics were not used because they were not available. See the competitive report for SERP observations and their limits.
- This document is an audit. It is not approval to implement. Implementation waits for an explicit go-ahead.
