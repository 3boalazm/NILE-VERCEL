# SEO remediation plan

**Date:** 2026-09-23  
**Inputs:** `docs/seo-remediation-baseline.md`, `docs/seo-url-migration-map.md`.  
**Ranking promise:** none. Restoring a 200 response does not create rankings. Fixing titles does not guarantee position. No “#1” outcome is claimed.

## Locked domain

The public origin is permanently `https://nilepharmafood.com`. It is not a candidate for replacement, a second primary domain, or a domain-level redirect to another host. `nilepharma.com.eg` is a different company and is not an NPF historical URL.

“Moving the host” means pointing this same domain at a new origin that serves this Next.js app. It does not mean choosing a new domain. `www` and HTTP, if they redirect, must land on this same host. That host policy is not a domain migration.

Controlled remediation v1 was written into the repository after this plan was accepted. Production is still the Bluehost suspension. Code in git is not a live SEO fix.

Dependency rule: do not start a phase whose blocker is still open.

```
Phase 1 host ──► Phase 2 redirects on the live origin ──► measurement (GSC)
        │
        └──► repo-safe metadata/schema/index gates can be written earlier
             but cannot be verified in production until Phase 1 is done

Claim review and legal name ──► entity sentence, English/Arabic commercial copy
                              ──► hubs and any comparison
                              ──► one educational page

Do not start the educational page, hubs, or comparison while Phase 1 is open
or while active supplement copy fails the claim check.
```

---

## Phase 1 — Production availability (blocker)

### Current state

`nilepharmafood.com` and `www` resolve to `173.254.104.205`, reverse DNS `box2287.bluehost.com`. Ports 80 and 443 accept TCP. TLS from this environment is closed by the server before a certificate is presented (`SSLZeroReturnError` / `SSL_ERROR_SYSCALL`). Port 80 returns an empty reply. A separate fetch receives Bluehost HTML at `/cgi-sys/suspendedpage.cgi` (“Account Suspended!”).

This Next.js repository is not the vhost. Evidence: WordPress plugin paths in Wayback, WooCommerce product URLs in the 2025 search index, no deploy workflow in the repo that targets Bluehost, GitHub homepage unset.

### Probable root cause

The Bluehost account that owns this shared-host IP is suspended (billing, policy, or malware lockdown — the CGI page does not say which). DNS is still pointed at that suspended account. A second, older failure mode (domain pending renewal, 14 July 2025 Wayback) may or may not still apply; the current page is an account suspension, not a registrar parking page.

The broken `Dockerfile` (`COPY --from=builder` while the first stage is unnamed) would stop a container deploy of **this** app. It is not why Bluehost shows a suspension page. Fixing the Dockerfile does not restore the domain.

### What must be changed, and where

This cannot be fixed from the repository. Do not change DNS, registrar, or hosting from here.

| Change | Where | Who |
| --- | --- | --- |
| Identify why the account is suspended (invoice, abuse ticket, malware) | Bluehost client area for the account on `box2287.bluehost.com` | Domain/hosting owner |
| Reinstate the account **or** export DNS to a new host | Bluehost, or the registrar’s nameserver panel | Owner, after approval |
| If the suspended account cannot be reinstated: point the **same** names (`nilepharmafood.com` and `www`) at a new origin. Do not register or canonicalize a replacement domain | DNS host and the new platform | Owner |
| One canonical host. Recommend `https://nilepharmafood.com` with a single 301 from `www` and from HTTP | Edge/host, not only Next | Owner + implementer |
| Stop serving `/cgi-sys/suspendedpage.cgi` as the site | Bluehost vhost | Owner |
| Only then point the vhost at this app (Node `next start`, or a platform that runs it) | New or restored host | Owner |
| Pass `DATABASE_URI` and `PAYLOAD_SECRET` at **build** time as well as runtime | Deploy secrets. See Dockerfile comments | Owner. Do not commit them |
| Set `VENDURE_SHOP_API_URL` only if checkout must work. Catalog pages must not require it to return HTML (Phase 9) | Runtime env | Owner |

There is no approved tooling in this workspace to change Bluehost, the registrar, or DNS. **Phase 1 is blocked.**

### Verification procedure (after the owner acts)

1. `curl -sI https://nilepharmafood.com/ar` returns `200` or a single `301`/`308` to the canonical URL. Body is not “Account Suspended”.
2. `curl -sI http://nilepharmafood.com/` is one redirect to HTTPS.
3. `curl -sI https://www.nilepharmafood.com/` is one redirect to the apex canonical, or the apex redirects once to www — not a loop.
4. Certificate subject matches the host that answered.
5. `/ar` HTML contains the storefront title, not a WordPress theme credit and not the Bluehost CGI.
6. `/robots.txt` and `/sitemap.xml` return 200 from that same host.
7. A sample of Wayback spam URLs (`/term-paper-writer-reviews`, `suspendedpage.cgi?p=`) do not return 200 with third-party spam.

Until step 1 passes, production SEO is **BLOCKED BY INFRASTRUCTURE**.

---

## Phase 2 — Redirects (after Phase 1, using the migration map only)

Implement the explicit pairs in `docs/seo-url-migration-map.md`. No wildcard.

Order inside the app:

1. Match `/product/...` before the locale proxy rewrites it to `/ar/product/...`.
2. 301 to `/ar/products/{new-slug}`.
3. Test one hop with `curl -sI`. A 301 to `/ar/product/...` that then 404s is a failed migration.
4. Unknown `/product/` slugs stay 404.
5. Spam and trashed URLs stay 404 or 410.

**Do not implement** until the map’s thermometer slug is confirmed, and until Ellamuselle’s noindex behavior exists if that redirect is included.

Status if done only in git: **PARTIALLY FIXED** until the live host serves the rule.

---

## Phase 3 — Index eligibility (repository-safe, after this baseline)

Separate existence from index eligibility. Do not delete products.

**Eligible for sitemap and index** only when all of these are true:

- `status === "active"`
- route returns 200
- identity fields present: slug, Latin name, Arabic name, category
- composition or device specs present, with no “unconfirmed” amount
- if a price is shown, currency is EGP and schema price equals visible price
- availability schema matches the button (in stock only if add-to-cart works)
- brand in schema matches visible brand
- copy has passed the claim check for supplements
- page is linked from `/products` or a hub
- not `noindex`

**Today, under that contract:** only the two CA-MI devices are eligible, and only after the brand fix. The three active supplements stay out of the sitemap until the claim/leaflet check passes. That is stricter than “active = index” and it is intentional. Indexing Proxeed Plus with unresolved PCOS-style or “safe and effective” lines, or with a composition table that disagrees with the leaflet, would publish a citeable error.

Implementation shape (later, not now):

- `isIndexEligible(product)` next to the product repository, used by `sitemap.ts`, `generateMetadata`, and `generateStaticParams` is optional (pages may still render for direct visits).
- Ineligible public URLs: `robots: { index: false, follow: true }` so a bookmark still passes equity if a 301 points there, without asking Google to keep the URL.
- Do not 404 ineligible products. The record stays.

---

## Phase 4 — One product SEO contract

Do not add a second hardcoded SEO file that drifts from the catalog.

Extend the existing `Product` type (Payload + mock + seed together) with only fields that are not already there:

| Need | Already stored? | Action |
| --- | --- | --- |
| id, slug, names, category, status, composition, price, sku, short description, FAQ, references, leaflet URL | Yes | Read them. Do not copy into a new JSON file |
| Arabic name | `nameArabic` | Render it. Do not duplicate |
| Brand | **No** | Add `brand: "Alfasigma" \| "CA-MI"` with values taken from current copy, not from memory |
| Seller | **No** | Constant trade name already in `siteName`. Not a per-product invention |
| Pack | `availableForm` | Use in title when it is a real pack string. Inositol’s “pending approval” string must not go in a title |
| Evidence grade | Buried in prose | Add an enum only after regulatory review defines the allowed grades. Do not invent grades in code first |
| Index flag | Derivable | Prefer `isIndexEligible()` over a hand-maintained boolean that will rot |

SEO title and H1 are **derived** from name, Arabic name, pack, and locale. They are not a second editorial store unless the derived title is wrong for a specific SKU.

---

## Phase 5 — Arabic and English intent (repository-safe, narrow)

Arabic pages:

- `<title>` and `<h1>` include `nameArabic` and the official Latin name.
- Visible identity near the H1 shows both, so the Latin trademark is not lost.
- Do not transliterate creatively. Use the stored strings: بروكسيد بلس, بروكسيد نساء, بروكس إيركس, إلاميوسيل, بروكسيد رجال, بروكسيد نساء إينوزيتول, and the two CA-MI Arabic names already in data.
- Pack in the title only when `availableForm` is a finished pack (for example “30 كيس”), not a pending sentence.

English pages:

- Keep the official Latin product name.
- Adding “Egypt” to the **title** of commercial English PDPs is a disambiguation hypothesis against `proxeed.com` (US-only). It is reasonable and not stuffing if the pattern is `{Product} in Egypt | Nile Pharma Food`.
- Do not add “Egypt” to every heading, breadcrumb, and image alt. One title and the meta description are enough to test.
- Do not translate Alfasigma, Proxeed, Proxerex, Ellamuselle, or CA-MI into new English coinages.

This phase does not require Phase 1 to be **written**. It requires Phase 1 to be **verified**.

---

## Phase 6 — Entity (blocked on legal confirmation)

Do not publish: “Nile Pharma Food is not El-Nile Co. for Pharmaceuticals” until the owner confirms that sentence is accurate and supplies the name they want on the page.

Facts already on the site that can stay:

- Trade name نايل فارما فود / Nile Pharma Food
- Role: distributor, not manufacturer (quality page)
- Email `info@nilepharmafood.com`
- Obour address as already printed on the contact page
- Alfasigma relationship as already printed, without new regulator claims

Do not:

- Target queries that belong to `nilepharma.com.eg`
- Add drug names from that company
- Set `legalName` to a string that disagrees with the commercial register
- Mark LinkedIn “Public Company” as truth inside schema
- Add `sameAs` for profiles nobody has confirmed

When the owner confirms, Organization schema should match the contact page exactly: one telephone set, `PostalAddress`, raster logo in addition to SVG, `areaServed: EG`. `sameAs` only for confirmed Facebook, Instagram, LinkedIn.

---

## Phase 7 — Structured data (repository-safe after brand field)

Rules, unchanged from the audit, now gated:

- `Product.brand` from the product’s brand field
- `Offer.seller` = trade name
- `Offer.price` and `priceCurrency: EGP` equal the visible price
- `availability` = InStock only for `active` and orderable. OutOfStock for paused if the page remains visible. **No PreOrder** unless a preorder control takes payment or a real reservation. It does not today
- No `aggregateRating`, no `review`, no GTIN
- Breadcrumb `item` URLs must be canonical URLs. Remove `?category=` from breadcrumb schema until a real hub exists
- Validate with a unit test that parses the JSON the page function would emit, plus the Rich Results test after deploy

---

## Phase 8 — Sitemap, robots, canonical agreement

| URL class | Sitemap | robots meta | Canonical |
| --- | --- | --- | --- |
| `/ar`, `/en`, about, story, quality, contact, shipping, privacy, terms | Yes | index | self |
| Active **and** claim-cleared product PDPs | Yes | index | `/{locale}/products/{slug}` |
| Devices after brand fix | Yes | index | self |
| launching / paused / unconfirmed products | No | noindex, follow | self (so a 301 target is stable) |
| `/blogs`, cart, checkout, account, login, wishlist | No | noindex | n/a or self, already noindex |
| `/admin`, `/api` | No | disallow in robots.txt | n/a |
| `?category=`, `?need=`, `?q=` | No | keep canonical on `/products` until hubs exist | `/products` |
| `/lab` | No | disallow already | n/a |
| Redirects and 404s | No | n/a | n/a |

`lastModified`: omit, or use Payload `updatedAt`. Do not emit `new Date()` per request.

`x-default`: decide with the owner. Recommendation remains `/ar`. Not a blocker.

---

## Phase 9 — Vendure and rendering (design before code)

Why `cache: "no-store"` is there:

- Shop API calls carry a session token. Caching the HTTP response in Next’s data cache could show one user’s cart context, or a stale token, on another request.
- Live price is supposed to match what checkout charges. A long-lived cache can display a price the order will not honor.

What actually blocks HTML:

- The locale layout awaits cart and customer on **every** URL, including About and product pages, before sending the document. Timeout is 10 seconds. The calls are parallel, so the wait is one timeout, not two. That is still enough to fail mobile LCP if Vendure is down.
- Price lookup is a separate per-slug call on catalog routes.

What must stay fresh:

- Checkout, cart mutations, account, and the price the user is about to pay.

What can be revalidated:

- Marketing copy, composition, images, Arabic names. Those live in Payload and do not change per visitor.
- A displayed list price can be revalidated every few minutes **if** checkout re-reads Vendure and refuses to charge a mismatched amount (the code comments say checkout already uses the live order). That invariant has to be re-read before anyone caches PDP price HTML.

Target split:

| Data | Strategy |
| --- | --- |
| Product copy, images, composition | Static or ISR from Payload. Must render if Vendure is down |
| List price | Short revalidate, or client-filled after first paint. Never a 10s block |
| Cart count, login state | Client request after paint, or a ≤300ms timeout that fails open |
| Checkout | Dynamic, network-only, no shared cache |

Measure before and after with Vendure stopped: TTFB of `/ar/products/ca-mi-pulse-oximeter`. No lab number exists today. Do not delete `cache: "no-store"` as the first edit.

---

## Phase 10 — Content strategy gate

Do not open the blog. `/blogs` stays noindex. Header link to it should be removed when someone is allowed to edit navigation, so crawlers are not invited into an empty state.

Order of content work:

1. Host returns 200.
2. Redirects and index gates exist.
3. Device PDPs are fact-clean (they already mostly are).
4. Supplement PDPs pass leaflet + claim review.
5. Entity sentence is legally approved.
6. Only then hubs, comparison, or an article.

No article factory. No medical claims written to match a competitor title.

---

## Phase 11 — Hubs: not approved yet

| Proposed hub | Product coverage now | Search intent | Decision |
| --- | --- | --- | --- |
| Men | Proxeed Plus (fertility) and Proxerex (sexual-health support) are different jobs. Proxeed Men is not launched | Arabic commercial results mix “خصوبة” and performance. One hub would blur the distinction the catalog is trying to keep | **Do not create** a single men’s hub yet. If built later, two intents or a decision page, not one blended sales URL |
| Women | One active product (Proxeed Women). Inositol unconfirmed. Ellamuselle paused | Women’s product SERP in the earlier research was thinner and occupied by US/EU brand pages | **Do not create** a one-product hub until Proxeed Women copy is claim-safe. A hub that only repeats the PDP is not useful |
| Devices | Two active, spec-complete products | Egypt consumer SERP was thin. Intent is specs and how to measure, not fertility | **Conditionally valid** as a useful catalog landing page after device schema is fixed. Not a growth project. Not before Phase 1 |

None of these are implemented.

---

## Phase 12 — Comparison page: not approved

Proxeed Plus vs Proxerex fails the “genuinely comparable” test. One supports sperm parameters; the other is positioned as sexual-health support and explicitly not an ED treatment. A “which is better” page would invent a contest.

Proxeed Plus vs Proxeed Men would be comparable and is blocked because Men is not launched and its evidence note says it is not the same clinical package.

A factual “which sachet is for which job” guide is the only comparison shape that fits the catalog. It still waits on claim review, because it would quote the same PDP sentences. **Do not create it now.**

---

## Phase 13 — One educational page: not started

Blocked by Phase 1, claim review, and the absence of a named reviewer. No topic is approved in this plan. When those gates open, the first candidate should be a non-disease question the catalog can answer without new claims (for example how the three **launched** products differ, or how to read a sachet label). A PCOS or erectile-dysfunction article is out of scope until a clinician and the NFSA label are in the room.

---

## Phase 14 — Tests (after the code they protect exists)

Do not add tests that fail the build for work that has not been scheduled. When a fix lands, add the assertion in the same change:

- `/ar` and `/en` return 200 in Playwright (already partly covered by smoke)
- eligible PDP returns 200, one H1, title contains `nameArabic` on `/ar`
- ineligible PDP is noindex and absent from sitemap XML
- `/product/proxeed-plus` is a single 301 to `/ar/products/proxeed-plus`
- `/product/does-not-exist` is not a 301
- `/term-paper-writer-reviews` is not a 301 to a product
- JSON-LD brand for `ca-mi-pulse-oximeter` is not Alfasigma
- no `aggregateRating`, no `PreOrder`
- sitemap URLs are a subset of the eligible set
- robots.txt disallows `/admin` and does not disallow `/ar`

Performance numbers stay out of CI.

---

## Phase 15 — Verification labels (current)

| Check | Status |
| --- | --- |
| A. HTTP on production | **NOT FIXED.** Suspension page / TLS failure. **BLOCKED BY INFRASTRUCTURE** |
| B. Rendered HTML of this app | **NOT CONFIRMED.** App not booted against the public host |
| C. Metadata in source | **PARTIALLY FIXED** already (canonical helper, hreflang, descriptions exist). Arabic names **NOT FIXED** |
| D. Canonical in source | **PARTIALLY FIXED.** Query URLs collapse to `/products`. No category canonical |
| E. Robots in source | **PARTIALLY FIXED.** Lab disallowed. Admin not disallowed |
| F. Sitemap in source | **NOT FIXED** relative to eligibility. It lists every product and stamps a fake `lastModified` |
| G. JSON-LD in source | **NOT FIXED.** Wrong brand, PreOrder, thin Organization, breadcrumb query URL |
| H. Internal links | **PARTIALLY FIXED.** Products are linked. Blogs empty state is linked. Arabic anchors missing because names are not rendered |
| I. Redirects | **NOT FIXED** |
| J. Performance | **NOT CONFIRMED.** Blocking Vendure reads **CONFIRMED** in source |
| K. Mobile | **NOT CONFIRMED** on production |
| L. Accessibility | **NOT CONFIRMED** in a browser |
| M. Search discoverability | **NOT FIXED.** Host is not the app. **REQUIRES EXTERNAL VERIFICATION** (GSC) after Phase 1 |

---

## Safest execution order

1. Owner restores or moves the host. Verify the seven production checks. No repo SEO theater before that is scheduled.
2. In parallel, in the repo, only the fixes marked safe in the baseline: eligibility noindex + sitemap filter, CA-MI brand, Arabic names in title/H1, robots disallow for `/admin` and `/api`, sitemap `lastModified`, blogs link removal, careers noindex. Explicit redirects from the migration map, not a wildcard.
3. Do not rewrite supplement claims, legal name, or Organization `legalName` until the owner signs the facts.
4. Extract leaflet text and reconcile composition and calories before those three supplement PDPs return to the sitemap.
5. Deploy the repo to the restored host. Re-test redirects on the public URL, one hop.
6. Verify Search Console and Bing. Submit the sitemap. Inspect `/ar`, one device PDP, and one old `/product/` URL.
7. Measure TTFB with Vendure down, then change the layout wait. Do not start with deleting `cache: "no-store"`.
8. Re-validate hubs. Devices hub is the only one that might be worth a page. Men’s and women’s hubs are not approved.
9. Comparison page and the first article stay closed.

## What must not be changed

- DNS, registrar, Bluehost, or any production secret, without the owner.
- Product records (no deletes).
- Legal name strings and the disambiguation sentence, until verified.
- Medical claims, halal assertions, NFSA certificate numbers, FDA/EMA sentences — do not add, and do not “improve” them into stronger claims.
- GTINs, ratings, reviews, PreOrder.
- Wildcard redirects.
- Redirects from spam, trash, or `nilepharma.com.eg`.
- A blog, a men’s hub, a women’s hub, or an X-vs-Y page in this wave.
- `cache: "no-store"` as a drive-by deletion.
- Any outreach or backlink work.

## External access still required

| Need | Why |
| --- | --- |
| Bluehost or the new host | Phase 1 |
| Registrar, only if nameservers move | Phase 1 |
| Owner confirmation of legal name and phone | Phase 6 |
| Leaflet / NFSA label | Phase 3 supplement eligibility |
| Google Search Console and Bing Webmaster | Proof of indexation, old URL list, hacked-URL check. Not available in this repo |
| Alfasigma, later | Update the distributor link from `http://www` to the live HTTPS host. Not required to ship the site |
