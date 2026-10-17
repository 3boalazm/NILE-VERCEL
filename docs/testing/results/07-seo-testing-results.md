# Report 07 — SEO Testing — Results & Defect Register

**Project:** NPF — Nile Pharma Food (Next.js 16.3.3 + Payload CMS 3.88 + Vendure 3.7.3)
**Source report:** `docs/testing/07-seo-testing-report.md` (105 test cases)
**Result date:** 2026-09-21
**Tested by:** QA Agent (Arena)
**Branch:** `arena/01a0c301-npf` (baseline `9025fa5`)
**Environment:** local production build (:3000). Evidence: live HTML meta-parsing (9 pages × 2 locales), `robots.txt`/`sitemap.xml` fetch, redirect/404 probes, header probes, Lighthouse SEO category (mobile emulation), plus Reports 01–05 cross-evidence (alt text, headings, CWV, RTL).

---

## Executive Summary

| Verdict | Count | Meaning |
|---|---:|---|
| ✅ Pass | 67 | Meets the expected result |
| ⚠️ Partial | 10 | Works, with documented gaps |
| ❌ Fail | 2 | Does not meet the expected result |
| 🚫 N/A | 26 | Requires external services (GSC/Bing/GMB/GA/search operators/social debuggers) or content that does not exist |
| **Total** | **105** | |

**Headline:** This site was **built SEO-first** and it shows: **Lighthouse SEO = 100**, every page has unique localized title/description/OG/Twitter, **hreflang pairs on all pages + 72 hreflang entries inside the sitemap**, per-page canonical (except home — F-45), rich JSON-LD (**Organization** sitewide, **Product + BreadcrumbList** on PDP), `robots.txt` correctly blocks the lab routes and references the sitemap, clean 307/308 redirect hygiene (2–12ms, single-hop), and deliberate `noindex` on thin content (blogs). The two ❌ are the same missing feature (LocalBusiness schema); the ⚠ cluster is metadata polish + crawl-budget + monitoring services.

**New defects:** F-45 … F-51. Continues the global register after Report 06's F-44.

---

## Methodology

1. **Meta matrix** (`scratch/seo-audit.mjs`): parsed title / description / robots / canonical / hreflang / og:* / twitter:* / lang / dir / JSON-LD `@type` / h1 / img-without-alt from live HTML for home, products, PDP, contact, about, blogs (ar+en).
2. **Crawl probes**: `robots.txt`, `sitemap.xml` (URL count + hreflang entries), 8 redirect/404 targets with status + `Location` + latency.
3. **Header probes**: gzip, cache-control, HSTS, CSP, referrer/permissions policy, x-frame/x-content-type.
4. **Lighthouse SEO category** (12 audits incl. title/description/lang/hreflang/crawlable/structured-data).
5. **Cross-report evidence**: headings (Report 05: 0 skips), alt text (0 missing), CWV (Report 06), content/voice (Report 02).

---

## Results — Technical SEO (35 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| SEO-TECH-001 | Robots.txt Configuration | ✅ | 200 in 12ms: `User-Agent: *` / `Allow: /` / **`Disallow: /*/lab/`** (protects lab flag routes) / `Sitemap:` reference with absolute URL. |
| SEO-TECH-002 | Robots Meta Tag | ✅ | Default pages: no robots meta (=index,follow) ✓. Blogs: **`noindex, nofollow`** — deliberate thin-content handling via `buildPageMetadata({noIndex})`. |
| SEO-TECH-003 | Crawl Stats (Search Console) | 🚫 | Requires live GSC property. |
| SEO-TECH-004 | Crawl Budget Optimization | ⚠️ | Sitemap + noindex + lab-disallow are right, but `robots.txt` still allows `/admin`, `/checkout`, `/account` and parameterized `?q=` search URLs (F-48). |
| SEO-TECH-005 | Index Coverage (Search Console) | 🚫 | Requires live GSC. |
| SEO-TECH-006 | Site: Search Operator | 🚫 | `site:domain` checks require Google/Bing. |
| SEO-TECH-007 | Cache Check | ✅ | Static: `max-age=31536000, immutable` + ETag (measured). HTML `no-store` (correct). |
| SEO-TECH-008 | Indexing API | 🚫 | Product does not use Google Indexing API. |
| SEO-TECH-009 | URL Structure | ✅ | `/ar|en/{section}/{kebab-slug}` — short, hierarchical, readable (proxeed-plus, quality-sourcing). |
| SEO-TECH-010 | URL Consistency | ✅ | Trailing slash **308** → canonical form; lowercase-only paths; locale prefix always present after 307 defaulting. |
| SEO-TECH-011 | Site Depth | ✅ | Home → listing → PDP = 2 clicks; all key pages ≤3 (footer + nav). |
| SEO-TECH-012 | Internal Linking | ✅ | Header 8 links, footer 3 columns, product cards, PDP related-series links, breadcrumbs, story/quality/careers cross-links (crawlable `<a href>`, no JS-only links). |
| SEO-TECH-013 | Core Web Vitals | ✅ | CLS 0 everywhere; lab LCP ≤680ms desktop (Report 06). Lighthouse SEO 100 includes the CWV-adjacent audits. |
| SEO-TECH-014 | Mobile-Friendly | ✅ | `width=device-width, initial-scale=1`, zoom not blocked, responsive matrix 320–1920 (Report 03). |
| SEO-TECH-015 | HTTPS Implementation | ⚠️ | Local run is HTTP; **HSTS preloaded config** (`max-age=63072000; includeSubDomains`) + absolute canonicals/sitemaps use `https://nilepharmafood.com` — verify on production TLS (F-44 cross-ref). |
| SEO-TECH-016 | Security Headers | ⚠️ | Present: `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, HSTS, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy` (camera/mic/geo denied). **Missing: Content-Security-Policy** (F-49). |
| SEO-TECH-017 | Schema.org Validation | ✅ | All JSON-LD blocks parse (Organization; Product; BreadcrumbList) —0 invalid-JSON across 9 pages. |
| SEO-TECH-018 | Product Schema | ✅ | PDP emits **`Product`** JSON-LD (ar+en). |
| SEO-TECH-019 | Breadcrumb Schema | ✅ | PDP emits **`BreadcrumbList`** + visible `<nav aria-label="Breadcrumb">`. |
| SEO-TECH-020 | Organization Schema | ✅ | **`Organization`** JSON-LD on every page. |
| SEO-TECH-021 | LocalBusiness Schema | ❌ | Not implemented — the company has a real address (10th of Ramadan) that qualifies (F-50). |
| SEO-TECH-022 | Review Schema | 🚫 | No reviews feature in the product (Vendure reviews disabled — Report 01). |
| SEO-TECH-023 | FAQ Schema | 🚫 | No FAQ content exists to mark up. |
| SEO-TECH-024 | Video Schema | 🚫 | No video content (Report 05). |
| SEO-TECH-025 | XML Sitemap Existence | ✅ | `/sitemap.xml` 200. |
| SEO-TECH-026 | XML Sitemap Validation | ✅ | 36 `<loc>` URLs parse cleanly. |
| SEO-TECH-027 | XML Sitemap Coverage | ✅ | 18 pages × 2 locales = 36 URLs covering home/about/story/products/quality/careers/blogs/contact + product PDPs — matches the app route table (thin blogs included with their `noindex` kept in HTML — acceptable). |
| SEO-TECH-028 | Sitemap Index | 🚫 | Single 36-URL sitemap — index file not needed at this size. |
| SEO-TECH-029 | HTML Sitemap | 🚫 | Not present; at 18 pages the nav+footer already expose every URL (WCAG-verified). |
| SEO-TECH-030 | Redirect Implementation | ✅ | `/ → 307 /ar`; locale-less paths `/about /products /checkout /account → 307 /ar/…`; `/ar/ → 308 /ar`. |
| SEO-TECH-031 | Redirect Speed | ✅ | 2–12ms measured. |
| SEO-TECH-032 | Redirect Chains | ✅ | Single-hop only (direct `Location` targets verified). |
| SEO-TECH-033 | Canonical Tags | ⚠️ | Per-page canonical + hreflang present on 8/9 pages… **homepage has no `<link rel="canonical">`** (ar+en) (F-45). |
| SEO-TECH-034 | Duplicate Content | ✅ | ar/en mirrored paths have reciprocal hreflang + per-page canonical; `?q=`/`?series=`/`?sort=` URLs carry canonical to the clean listing (measured). |
| SEO-TECH-035 | URL Parameters | ✅ | Filter/sort/search params canonicalize to `/products` — no indexable duplicates. |

## Results — On-Page SEO (29 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| SEO-ONPAGE-001 | Title Existence | ✅ | All 9 pages (both locales where mirrored). |
| SEO-ONPAGE-002 | Title Length | ✅ | 12–40 chars (AR/EN) — inside 30–60 window. |
| SEO-ONPAGE-003 | Title Keywords | ✅ | Primary terms lead: "المنتجات"، "Proxeed Plus"، "تواصل معنا"، "من نحن". |
| SEO-ONPAGE-004 | Title Branding | ✅ | Consistent `" \| نايل فارما فود"` / `" \| Nile Pharma Food"` suffix (home = brand alone — correct). |
| SEO-ONPAGE-005 | Meta Description | ✅ | Present on all pages (unique, localized). |
| SEO-ONPAGE-006 | Description Length | ✅ | 30–75 AR chars / 60–150 EN chars — within guidance. |
| SEO-ONPAGE-007 | Description Keywords | ✅ | Product/health-intent terms + "في مصر" localization. |
| SEO-ONPAGE-008 | Description CTR Appeal | ✅ | Differentiated copy (clinical-study angle on PDP; distributor authority on home) — crafted for intent. |
| SEO-ONPAGE-009 | H1 Existence | ✅ | Exactly one per page (Report 05 measured). |
| SEO-ONPAGE-010 | Heading Hierarchy | ✅ | **0 level skips** on all pages (Report 05). |
| SEO-ONPAGE-011 | Heading Keywords | ✅ | H1/H2s carry category + product terms ("منتجات صحية…"، "الأمان"، "الجدول"). |
| SEO-ONPAGE-012 | Heading Length | ✅ | H1 ≤60 chars display lines; H2/H3 short section labels. |
| SEO-ONPAGE-013 | Content Uniqueness | ✅ | Distinct AR/EN authored copy (not machine mirrors) — checked across story/quality/PDP texts. |
| SEO-ONPAGE-014 | Content Length | ✅ | Home/story/quality/PDP long-form; thin surfaces (blogs) are `noindex` — nothing thin is indexable. |
| SEO-ONPAGE-015 | Content Quality | ✅ | Medical-claims discipline (claims cite the 2024 study), expert tone (Report 02 voice audit). |
| SEO-ONPAGE-016 | Keyword Density | ✅ | Natural usage, no stuffing (sampled PDP + home term frequency). |
| SEO-ONPAGE-017 | Keyword Placement | ✅ | Keywords in titles, H1, first paragraphs, alt text. |
| SEO-ONPAGE-018 | Content Readability | ✅ | Short sentences, bullets, sectioned scientific copy (Report 02). |
| SEO-ONPAGE-019 | Content Freshness | ⚠️ | Static seed catalog; blogs section is "قريبًا" placeholder — no dated-article freshness signals yet. |
| SEO-ONPAGE-020 | Internal Link Quantity | ✅ | Rich link graph from every page (nav/footer/cards/related). |
| SEO-ONPAGE-021 | Internal Anchor Text | ✅ | Descriptive Arabic anchors ("عرض التفاصيل"، "تصفح المنتجات") — no "click here". |
| SEO-ONPAGE-022 | Internal Link Context | ✅ | Links sit inside relevant sections (series chips under "أو تصفح بالسلاسل"). |
| SEO-ONPAGE-023 | Image Alt Text | ✅ | **0 missing alt** (Report 05 census). |
| SEO-ONPAGE-024 | Image File Names | ✅ | `/products/proxeed-plus.jpg`-style descriptive public assets. |
| SEO-ONPAGE-025 | Image Compression | ✅ | `/_next/image` optimizer live (200) — 15–100KB/page image payload (Report 06). |
| SEO-ONPAGE-026 | Image Lazy Loading | ✅ | Below-fold `loading="lazy"` measured (Report 03). |
| SEO-ONPAGE-027 | Image Sitemap | 🚫 | Not generated — optional at current image scale. |
| SEO-ONPAGE-028 | URL Descriptiveness | ✅ | Human-readable slugs (products/proxeed-plus, quality-sourcing). |
| SEO-ONPAGE-029 | URL Length | ✅ | ≤40 chars path segments. |

## Results — International SEO (8 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| SEO-INTER-001 | hreflang Implementation | ✅ | Reciprocal `ar`/`en` alternate links on every page (measured pairs on 9/9). |
| SEO-INTER-002 | hreflang Validation | ✅ | Valid ISO codes, absolute URLs, self-referencing + return links correct (sitemap mirror agrees). Note: no `x-default` (optional). |
| SEO-INTER-003 | hreflang in Sitemap | ✅ | **72 `xhtml:link` hreflang entries** inside `/sitemap.xml` (ar,en × 36). |
| SEO-INTER-004 | Language-Specific Content | ✅ | Full AR + EN authored pages (not `?lang=` toggles). |
| SEO-INTER-005 | Language-Specific URLs | ✅ | `/ar/*` vs `/en/*` path prefixes. |
| SEO-INTER-006 | Language-Specific Meta Tags | ✅ | Titles/descriptions/OG translated; `og:locale` `ar_EG` / `en_US` (measured). |
| SEO-INTER-007 | Language Detection & Redirection | ⚠️ | `/` always 307s to `/ar` regardless of `Accept-Language` (F-51) — EN-first visitors land on Arabic. |
| SEO-INTER-008 | hreflang in Search Console | 🚫 | Requires live GSC. |

## Results — Local SEO (6 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| SEO-LOCAL-001 | Local Keywords | ✅ | "في مصر"، "الهيئة القومية لسلامة الغذاء"، governorate names in checkout zones, Arabic-first copy. |
| SEO-LOCAL-002 | Local Business Information | ✅ | Address (مبنى 1، قطعة 20، بولكر،10th of Ramadan), 2 phones, email on contact + footer (NAP consistency). |
| SEO-LOCAL-003 | LocalBusiness Schema | ❌ | Same as TECH-021 — missing (F-50). |
| SEO-LOCAL-004 | Google My Business | 🚫 | External property — not testable. |
| SEO-LOCAL-005 | Local Citations | 🚫 | External directories — not testable. |
| SEO-LOCAL-006 | Local Reviews | 🚫 | No reviews feature/platform attached. |

## Results — E-commerce SEO (16 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| SEO-ECOMM-001 | Product Page Titles | ✅ | `Proxeed Plus \| نايل فارما فود` pattern — product-first + brand (measured ar+en). |
| SEO-ECOMM-002 | Product Meta Descriptions | ✅ | Unique per product ("مكمل غذائي لدعم خصوبة الرجال، مدعوم بدراسة سريرية…"). |
| SEO-ECOMM-003 | Product Page Content | ✅ | Facts table, dosage, scientific description, claims with source, PDF reference (Report 02). |
| SEO-ECOMM-004 | Product Page Images | ✅ | Named alts (`alt={product.name}`) + optimized delivery. |
| SEO-ECOMM-005 | Product Schema | ✅ | `Product` JSON-LD on PDP (as TECH-018). |
| SEO-ECOMM-006 | Review Schema | 🚫 | No reviews feature. |
| SEO-ECOMM-007 | Breadcrumb Schema | ✅ | `BreadcrumbList` + visible nav. |
| SEO-ECOMM-008 | Category Page Titles | ✅ | `المنتجات \| نايل فارما فود` + category routes carry their own `buildPageMetadata`. |
| SEO-ECOMM-009 | Category Page Content | ✅ | Intro copy + series chips + ShopByNeed sections (browse-by-need content above grid). |
| SEO-ECOMM-010 | Category Internal Linking | ✅ | Series chips + cross-category header links + product cards interlink. |
| SEO-ECOMM-011 | Faceted Navigation SEO | ⚠️ | Facets (`?series=`) exist as parameters only and canonicalize to `/products` — safe for duplicates, but no dedicated indexable series landing pages (missed ranking surface). |
| SEO-ECOMM-012 | Filter & Sort SEO | ⚠️ | Same controlled-parameter approach (canonical clean URL) — by design, no crawlable filtered pages. |
| SEO-ECOMM-013 | Pagination SEO | 🚫 | The catalog has **no pagination** (grid lists full catalog — Report 01 F-13). |
| SEO-ECOMM-014 | Pagination Schema | 🚫 | No pagination exists to mark up. |
| SEO-ECOMM-015 | Search Page SEO | ✅ | `?q=` results canonicalize to `/products`; zero-result states don't index thin content. |
| SEO-ECOMM-016 | Search Suggestions | 🚫 | No autocomplete/suggestions feature in the product. |

## Results — Social (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| SEO-SOCIAL-001 | Open Graph Tags | ⚠️ | `og:title` + `og:description` + `og:locale` on all pages ✓ but **`og:url` empty everywhere** and `og:site_name` absent (F-46). |
| SEO-SOCIAL-002 | Open Graph Image | ⚠️ | `og:image` only on homepage (`/products/proxeed-plus.jpg`); inner pages/PDP have none (F-47). |
| SEO-SOCIAL-003 | Open Graph Testing | 🚫 | Facebook Sharing Debugger is an external service. |
| SEO-SOCIAL-004 | Twitter Card Tags | ✅ | `twitter:card=summary_large_image` + `twitter:title` + description mirror (all pages). |
| SEO-SOCIAL-005 | Twitter Card Testing | 🚫 | X/Twitter validator is an external service. |

## Results — Monitoring (6 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| SEO-MON-001 | Google Search Console Setup | 🚫 | No GSC verification token found in metadata; property is external. |
| SEO-MON-002 | Bing Webmaster Tools Setup | 🚫 | Same — external. |
| SEO-MON-003 | Google Analytics Setup | 🚫 | No GA/gtag ID in the app (grep of layout/scripts) — analytics is its own report (#20). |
| SEO-MON-004 | Ranking Tracking | 🚫 | Requires live rank tracker. |
| SEO-MON-005 | Traffic Analysis | 🚫 | Requires analytics data. |
| SEO-MON-006 | Performance Monitoring | 🚫 | No scheduled external monitoring (see Report 06 PERF-MON). |

---

## Defect Register (new — continues F-44)

| ID | Sev | Finding | Cases | Recommendation |
|---|---|---|---|---|
| **F-45** | Medium | **Homepage lacks `<link rel="canonical">`** (ar + en) while all inner pages emit one via `buildPageMetadata`. | SEO-TECH-033 | Add canonical to the home `generateMetadata` (`/ar`, `/en`). |
| **F-46** | Low | **`og:url` empty on every page** (+ no `og:site_name`) — social scrapers fall back to the shared URL. | SEO-SOCIAL-001 | Populate `openGraph.url` (+ `siteName`) in `buildPageMetadata`. |
| **F-47** | Low | **`og:image` only on homepage** — inner pages/PDPs share links without a card image. | SEO-SOCIAL-002 | Default `og:image` to a branded card in layout metadata; per-product override from the product image. |
| **F-48** | Low | `robots.txt` does not disallow **`/admin`, `/account`, `/checkout`** or search `?q=` URLs — wasted crawl budget on non-indexable surfaces. | SEO-TECH-004 | Add `Disallow: /admin` + `Disallow: /account` + `Disallow: /checkout` + `Disallow: /*?q=`. |
| **F-49** | Low | **No Content-Security-Policy header** (other security headers are all present). | SEO-TECH-016 | Ship a report-only CSP then enforce (start with `default-src 'self'` + known image/font sources). |
| **F-50** | Low | **LocalBusiness JSON-LD missing** — real address/NAP data exists in the UI (Report 05-verified contact data). | SEO-TECH-021, SEO-LOCAL-003 (❌×2) | Add `LocalBusiness` (or `Organization`+`address` extension) block to contact/home. |
| **F-51** | Info | `/` → `/ar` unconditionally; `Accept-Language` not sniffed. | SEO-INTER-007 | Optional middleware language detection (keep hreflang as the primary signal). |

## Spec Corrections (Report 07)

1. **26 🚫 cases** belong to external platforms (Search Console ×3, Bing, GMB, GA, citations/reviews, rank/traffic monitoring, `site:` operator, social debuggers ×2) or nonexistent content (FAQ/video/review/pagination/image-sitemap/suggestions/HTML-sitemap/Indexing-API). Each row states which.
2. **SEO-TECH-006 "Site: Search Operator"** is a search-engine query — cannot run offline.
3. Faceted/sort cases (ECOMM-011/012) are intentionally parameter-canonicalized rather than indexable — evaluated against that design.

---

## Final Tally

| Group | Total | ✅ | ⚠️ | ❌ | 🚫 |
|---|---:|---:|---:|---:|---:|
| SEO-TECH | 35 | 21 | 4 | 1 | 9 |
| SEO-ONPAGE | 29 | 27 | 1 | 0 | 1 |
| SEO-INTER | 8 | 6 | 1 | 0 | 1 |
| SEO-LOCAL | 6 | 2 | 0 | 1 | 3 |
| SEO-ECOMM | 16 | 10 | 2 | 0 | 4 |
| SEO-SOCIAL | 5 | 1 | 2 | 0 | 2 |
| SEO-MON | 6 | 0 | 0 | 0 | 6 |
| **TOTAL** | **105** | **67** | **10** | **2** | **26** |

## Reproduction Appendix

```bash
export LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp
node /home/user/scratch/seo-audit.mjs            # meta matrix + robots + sitemap + redirects + headers
curl -sI http://localhost:3000/ar                # header set
CHROME_PATH=/tmp/chromium LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp \
  npx lighthouse http://localhost:3000/ar --only-categories=seo \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu" --output=json
```

**Sign-off:** Report 07 executed in full (105/105 classified with live evidence). **67 ✅ / 10 ⚠️ / 2 ❌ / 26 🚫.** Lighthouse SEO 100; schema/international/sitemap work is production-grade. Fix order: F-45 (home canonical) → F-50 (LocalBusiness) → F-46/47 (OG polish) → F-48/49 (crawl + CSP). Ready for Report 08.
