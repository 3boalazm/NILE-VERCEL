# SEO remediation baseline

**Verified:** 2026-09-23, after the competitive report and the search audit.  
**Rule for this file:** every claim was re-checked against the current repository and, where possible, the live domain. The earlier reports were not treated as sufficient.  
**Code changes in this pass:** none.

Status values: **CONFIRMED**, **PARTIALLY CONFIRMED**, **NOT CONFIRMED**.

Rendered storefront HTML was **not** produced. The public host does not serve this app, and this pass did not boot Next.js (no local Postgres, and Phase 0 forbids using a mock production as if it were the live site). Metadata and schema findings below are **source-confirmed**, not browser-confirmed.

---

## Production probe (2026-09-23)

| Check | Result |
| --- | --- |
| DNS `nilepharmafood.com` | `173.254.104.205` |
| DNS `www.nilepharmafood.com` | same IP. No CNAME observed via `getaddrinfo` |
| Reverse DNS | `box2287.bluehost.com` |
| TCP 80, 443, 8443, 2083, 2087 | open |
| HTTPS | TCP connects, then TLS closes (`SSL_ERROR_SYSCALL` / `SSLZeroReturnError`). No certificate, no HTTP status |
| HTTP port 80 | TCP connects, then empty reply. No status line |
| `https://nilepharmafood.com/` via page fetch | Final URL `https://nilepharmafood.com/cgi-sys/suspendedpage.cgi`. Body: Bluehost “Account Suspended!” |
| `robots.txt` / `sitemap.xml` via curl | No HTTP response (TLS failure) |
| This repository’s deploy target | No Vercel/Netlify/Fly config. GitHub homepage field is null. Deployments API not accessible. `Dockerfile` is not what Bluehost is serving |
| Application origin | **Not this Next.js app.** Index memory is a WordPress/WooCommerce shop (Astra, Brizy, WooCommerce asset paths in Wayback CDX) |

The suspension page and the TLS failure are both true. One fetch path receives Bluehost’s suspended-account HTML. Direct OpenSSL from this environment does not complete a handshake. Do not treat either observation as “the site is fine in Egypt.” Re-check from a normal browser before any registrar action.

---

## Findings

### F-001 — Public domain does not serve the storefront

| Field | Value |
| --- | --- |
| ID | F-001 |
| CLAIM | `https://nilepharmafood.com/` serves a host suspension page, not this application |
| CURRENT STATUS | **CONFIRMED** |
| EVIDENCE | Page fetch 2026-09-23 landed on `/cgi-sys/suspendedpage.cgi` with Bluehost “Account Suspended!”. PTR is `box2287.bluehost.com`. Repository has no hosting credentials, no DNS config, and no deployment workflow that targets this vhost |
| DEPENDENCIES | Bluehost account owner (billing, suspension reason, file manager or a new host). Registrar only if nameservers must move |
| SAFE TO FIX NOW? | **NO.** Not a repository change. Requires explicit approval and access outside this repo |

### F-002 — Repeated downtime and spam-like historical URLs

| Field | Value |
| --- | --- |
| ID | F-002 |
| CLAIM | The domain has been expired or suspended before, and the suspended CGI has been captured with spam query strings |
| CURRENT STATUS | **CONFIRMED** as historical evidence. Current Google index of those spam URLs is **NOT CONFIRMED** |
| EVIDENCE | Wayback 2025-07-14: domain pending renewal or expired (prior research, not re-fetched this pass). Wayback/CDX 2024-06-15 and 2026-08-29: `suspendedpage.cgi`. CDX includes `suspendedpage.cgi?p=...` values that embed cracked-software URLs. 2022 post sitemap contains `https://nilepharmafood.com/term-paper-writer-reviews` |
| DEPENDENCIES | Search Console after the host returns. Do not “disavow” from Wayback alone |
| SAFE TO FIX NOW? | **NO** for the host. A later 410 for known spam paths is repository-safe only after the app is the thing answering those URLs |

### F-003 — Old product URLs have no redirect

| Field | Value |
| --- | --- |
| ID | F-003 |
| CLAIM | Indexed `/product/{slug}` URLs will not resolve to `/ar/products/{slug}` |
| CURRENT STATUS | **CONFIRMED** in source. Live redirect behavior **NOT CONFIRMED** (host does not complete TLS from curl) |
| EVIDENCE | `next.config.ts` has no `redirects()`. `src/proxy.ts` only adds or replaces a locale prefix. `src/app/[locale]/[...catchall]/page.tsx` calls `notFound()`. No `middleware.ts`. Search index still cites `https://nilepharmafood.com/product/proxerex` and `https://nilepharmafood.com/product/proxeed-plus/` (page ages June 2025). 2022 product sitemap lists six product paths (see migration map) |
| DEPENDENCIES | Slug equivalence decisions in `docs/seo-url-migration-map.md`. Deploy of this app onto the domain. Must not ship redirects that point at unfinished products without an indexation decision |
| SAFE TO FIX NOW? | **YES, in repository only**, after the migration map is accepted. A redirect in code does nothing until this app is the origin. Do not redirect spam or trashed URLs |

### F-004 — Entity collision with El-Nile Pharmaceuticals

| Field | Value |
| --- | --- |
| ID | F-004 |
| CLAIM | Short-name queries resolve to a different company, and this site’s Arabic legal wording overlaps that name |
| CURRENT STATUS | **PARTIALLY CONFIRMED** |
| EVIDENCE | Re-check of prior search results still stands: `nilepharma.com.eg`, pharmacia1, and pharmatop1 occupy “Nile Pharma / شركة النيل للأدوية”. This pass did not re-run a full SERP scrape. In-repo privacy copy (dictionaries, Arabic intro) names “شركة النيل للأدوية والأغذية والمكملات الغذائية”, trading as Nile Pharma Food. English terms say “Nile for Pharmaceuticals, Food, and Food Supplements Co.” Alfasigma’s distributor row (“The Nile For Pharma, Food & Food Supplements Company”) was **not** re-fetched live (distributors page returned Cloudflare 522 on the previous pass). LinkedIn “Public Company / Pharmaceutical Manufacturing” was not re-opened this pass |
| DEPENDENCIES | Owner must confirm the registered legal name before any disambiguation sentence is published. Do not invent a registry number |
| SAFE TO FIX NOW? | **NO** for the public disambiguation sentence. **NO** for changing legal copy. Schema `sameAs` may be added only for profiles already cited (Facebook `NPFEG`, Instagram `npf.eg`) after someone confirms they are official |

### F-005 — Arabic product names are stored and not rendered

| Field | Value |
| --- | --- |
| ID | F-005 |
| CLAIM | `nameArabic` never reaches title, H1, or visible product name |
| CURRENT STATUS | **CONFIRMED** in source. Rendered HTML **NOT CONFIRMED** |
| EVIDENCE | `nameArabic` exists on all eight products in `mock-repository.ts`, the Payload collection, and `scripts/seed.ts`. `localizeProduct` does not read it. `products/[slug]/page.tsx` sets `title: product.name` and `<h1>{product.name}</h1>`. Grep shows no component reads `nameArabic` |
| DEPENDENCIES | Approved Arabic orthography (catalog spelling vs other public spellings). Pack-size string already exists as `availableForm` |
| SAFE TO FIX NOW? | **YES**, as a display/metadata change using existing fields. Do not invent new Arabic names. Do not keyword-stuff |

### F-006 — No indexable category URLs

| Field | Value |
| --- | --- |
| ID | F-006 |
| CLAIM | Category and need filters are query strings canonicalized to `/products` |
| CURRENT STATUS | **CONFIRMED** in source |
| EVIDENCE | `products/page.tsx` `buildPageMetadata` path is always `/products`. Footer links `?category=supplements` and `?category=medical-devices`. Breadcrumb JSON-LD uses `?category=`. Sitemap has no category URLs. No `src/app/[locale]/products/` category route besides `[slug]` |
| DEPENDENCIES | Hub validation (Phase 11). Do not create dental, cosmetics, or drugs hubs (`coming_soon`, zero products) |
| SAFE TO FIX NOW? | **NO** as new landing pages. Creating hubs without intent validation repeats the plan this pass is not supposed to execute blindly. Query canonicalization itself is acceptable and should stay until hubs exist |

### F-007 — Product schema brand is hardcoded to Alfasigma

| Field | Value |
| --- | --- |
| ID | F-007 |
| CLAIM | Every PDP emits `brand.name = "Alfasigma"`, including CA-MI devices |
| CURRENT STATUS | **CONFIRMED** in source |
| EVIDENCE | `products/[slug]/page.tsx` sets `brand: { "@type": "Brand", name: "Alfasigma" }` with no branch. Device copy says CA-MI (Italy), models O2-Easy and T-One |
| DEPENDENCIES | A brand field does not exist on `Product`. Adding one is a data-model change, not a guess. Visible copy is enough to set CA-MI vs Alfasigma for the eight known slugs without inventing a manufacturer address |
| SAFE TO FIX NOW? | **YES** for the eight known slugs, mapping from slug/category already in the catalog. Do not invent GTINs. Seller name should be the trade name already used in the UI (“Nile Pharma Food” / “نايل فارما فود”), not a new legal string |

### F-008 — Non-saleable products are indexable; PreOrder is misused

| Field | Value |
| --- | --- |
| ID | F-008 |
| CLAIM | Sitemap includes every repository product. `launching_soon` maps to `schema.org/PreOrder`. Inositol dose is explicitly unconfirmed. Ellamuselle is paused but priced |
| CURRENT STATUS | **CONFIRMED** in source and catalog data |
| EVIDENCE | `sitemap.ts` maps `getAllProducts()` with no status filter. Payload `getAllProducts` does not filter on status (status is mapped through, not used as a gate). Availability map: `launching_soon` → `https://schema.org/PreOrder`. Catalog: `proxeed-women-inositol` composition value “الكمية الدقيقة لكل كيس غير مؤكدة بعد”, status `launching_soon`. `ellamuselle` status `paused`, price 1200. `proxeed-men` status `launching_soon`. `generateStaticParams` emits every product |
| DEPENDENCIES | Eligibility model below. Do not delete Payload/mock records |
| SAFE TO FIX NOW? | **YES** to exclude non-eligible slugs from the sitemap and set `noindex` on those routes. **NO** to delete products. **NO** to publish Inositol as PreOrder |

### F-009 — Organization schema and NAP are incomplete and inconsistent

| Field | Value |
| --- | --- |
| ID | F-009 |
| CLAIM | Organization JSON-LD has name, URL, SVG logo, and email only. Phones disagree across sources |
| CURRENT STATUS | **CONFIRMED** for the schema gap. Phone conflict **PARTIALLY CONFIRMED** (sources not all re-fetched live) |
| EVIDENCE | `layout.tsx` JSON-LD fields: `name`, `url`, `logo` (`/npf-logo.svg`), `email`. No `address`, `telephone`, `legalName`, `sameAs`. Contact dictionary: `01027639857 / 01024442340`, address in El Obour. Prior search snippet of the old homepage and pharmaceuticalbank use `+20 102 444 2340` (matches the second number). Alfasigma index snippet used `+201276655720` and `+201024442340`. The `01027639857` vs `+201276655720` conflict was not re-proven against a live Alfasigma page this pass |
| DEPENDENCIES | Owner confirms one telephone set and whether the published address is a public business location. Legal name confirmation before `legalName` |
| SAFE TO FIX NOW? | **PARTIAL.** Email and trade name are safe. Address and the agreeing mobile (`01024442340` / `+20 102 444 2340`) appear on the contact page already, so copying them into schema matches visible content. The second phone must not be added until the owner picks one. `sameAs` only after profile ownership is confirmed |

### F-010 — Health copy mixes evidence grades with broad claims

| Field | Value |
| --- | --- |
| ID | F-010 |
| CLAIM | Active PDPs contain disease-outcome language and unqualified “safe and effective” lines beside more careful notes |
| CURRENT STATUS | **CONFIRMED** in catalog source. Medical accuracy **NOT CONFIRMED**. Leaflet PDF text **NOT CONFIRMED** (`pdftotext` unavailable) |
| EVIDENCE | Proxeed Plus `scientificInfo` includes both a named-study summary and lines equivalent to safe/effective/patented. Proxeed Women lead describes PCOS-with-insulin-resistance and stress/exercise amenorrhea outcomes. Inositol benefits cite a 2025 analysis while the dose line says the amount is unconfirmed. Proxerex short description says it is not a substitute for erectile-dysfunction treatment; other sentences are broader. Ellamuselle FAQ denies a product-level trial. Homepage uses testimonial quotes attributed to first names. 2024 study named in Proxeed Plus body is not the same list entry as Busetto 2018 |
| DEPENDENCIES | Leaflet in `public/downloads/`, NFSA-approved Arabic label, owner/regulatory sign-off. Do not invent citations |
| SAFE TO FIX NOW? | **NO** as a rewrite of medical claims. Removing or noindexing the unfinished Inositol page is safe. Deleting testimonials is a product decision, not an emergency code fix |

### F-011 — No search or analytics measurement

| Field | Value |
| --- | --- |
| ID | F-011 |
| CLAIM | No GA4, GTM, Search Console, or Bing verification in the repo |
| CURRENT STATUS | **CONFIRMED** |
| EVIDENCE | Repo search found no `gtag`, `googletagmanager`, `google-site-verification`, or `msvalidate`. No verification HTML in `public/`. Privacy copy still says analytics may be used |
| DEPENDENCIES | DNS or HTML verification requires the host to serve this app. Property access is an external Google/Bing account |
| SAFE TO FIX NOW? | **NO.** A verification file with an invented token would be fraud. Privacy-sentence cleanup is safe but low value |

### F-012 — Public HTML waits on Vendure

| Field | Value |
| --- | --- |
| ID | F-012 |
| CLAIM | Every locale page awaits two Shop API reads with `cache: "no-store"` and a 10s abort |
| CURRENT STATUS | **CONFIRMED** in source. Timing **NOT CONFIRMED** (not measured) |
| EVIDENCE | `layout.tsx` `Promise.all([readActiveOrderItems(), getActiveCustomer()])`. `vendureRequest` sets `cache: "no-store"` and `VENDURE_REQUEST_TIMEOUT_MS = 10_000`. Comments say the reads are render-safe and must not write cookies. `getLivePrices` also calls Vendure per slug. `cache: "no-store"` exists so a catalog price is not a cached lie relative to checkout, and so session reads are not stored as shared HTML |
| DEPENDENCIES | A rendering design that keeps checkout prices live without blocking the document. Measurement with Vendure stopped |
| SAFE TO FIX NOW? | **NO.** Removing `cache: "no-store"` without a substitute would be the blind change this phase forbids |

---

## Additional re-checks (not in the original P0/P1 list, still true)

| ID | Claim | Status | Safe now? |
| --- | --- | --- | --- |
| F-013 | Sitemap `lastModified` is `new Date()` on every request | **CONFIRMED** (`sitemap.ts`) | Yes, omit or use a real timestamp. Low urgency |
| F-014 | `robots.ts` disallows only `/*/lab/` | **CONFIRMED** | Yes, add `/admin` and `/api`. Do not disallow assets |
| F-015 | `/careers` is indexable and says there are no jobs. `/blogs` is noindex but linked in header and footer | **CONFIRMED** | Careers noindex: yes. Removing the blogs nav link: yes. Do not add articles |
| F-016 | hreflang is `ar` + `en`, no `x-default` | **CONFIRMED** | Only after a policy choice. Recommend `x-default` → `/ar`, do not implement as if it were a defect |
| F-017 | Composition/calorie figures conflict with other publishers | **PARTIALLY CONFIRMED**. Catalog vs proxeed.com FAQ (12 vs 10 kcal) and vs old indexed per-sachet table. PDFs not extracted | **NO** until leaflet extraction |
| F-018 | Testimonials rendered without Review schema | **CONFIRMED** (schema has no `aggregateRating`; quotes are rendered) | Do not add ratings. Removal needs owner |
| F-019 | Dockerfile runner copies `--from=builder`, but the first stage is unnamed | **CONFIRMED**. `Dockerfile` line 6 `FROM node:22` has no `AS builder`; line 37 `COPY --from=builder`. Image build would fail | Yes as a deploy-readiness fix. It does **not** restore Bluehost. Do not treat it as the production outage cause |
| F-020 | `docker-compose.yml` is local databases, not the public site | **CONFIRMED** | Do not point production DNS at this compose file |

---

## Product index eligibility (current data)

A row may exist in Payload and still be ineligible for the sitemap. Nothing below says to delete a record.

| Slug | In database | Public route exists | Fact-complete | Safe copy | For sale | Index-eligible now |
| --- | --- | --- | --- | --- | --- | --- |
| proxeed-plus | Yes | Yes | Composition and price present. Calorie/dose conflict with external pages unresolved | **No** until claim review | `active` | **No.** Hold until leaflet check and claim trim |
| proxeed-women | Yes | Yes | Composition and price present | **No.** PCOS/amenorrhea outcomes in the lead | `active` | **No.** Same hold |
| proxerex | Yes | Yes | Composition and price present. Old index showed “2,500 g”; catalog says 2,500 mg | Short description is bounded. Full `scientificInfo` still needs a pass | `active` | **Conditional.** Closest candidate after a copy pass, not before |
| ca-mi-pulse-oximeter | Yes | Yes | Specs and price present. No clinical claims | Yes, as a device | `active` | **Yes**, after brand schema is CA-MI |
| ca-mi-ir-thermometer | Yes | Yes | Specs and price present | Yes, as a device | `active` | **Yes**, after brand schema is CA-MI |
| proxeed-men | Yes | Yes | Pack described. Not launched | Not reviewed for launch | `launching_soon` | **No** |
| proxeed-women-inositol | Yes | Yes | Dose line says amount unconfirmed | Claims cite a meta-analysis anyway | `launching_soon` | **No** |
| ellamuselle | Yes | Yes | Composition present. Not for sale | Weak evidence, sexual-health claims | `paused` | **No** |

Coming-soon categories `dental`, `cosmetics`, `drugs` have no products. They are not index targets.

---

## What this baseline does not prove

- Google’s current index coverage, manual actions, or rankings.
- That a browser in Egypt sees the same suspension page (likely, not proven).
- The registered legal name, the correct second phone, NFSA certificate numbers, or halal certificates.
- Core Web Vitals.
- That `nameArabic` spellings match the printed box.
- Contents of the four leaflet PDFs.

Those gaps are blockers for copy and entity work, not for the hosting handoff.
