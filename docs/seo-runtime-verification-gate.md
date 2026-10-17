# Production SEO runtime verification gate

**Date:** 2026-09-23  
**Host under test:** `https://nilepharmafood.com`  
**Result:** the gate does not pass. SEO is not fixed. No new SEO work was started.

This pass did not change DNS, hosting, redirects, schema, content, or cache. It only observed the public host.

Two observers disagreed on the transport, and both failed to serve this Next.js app:

- A normal TLS and HTTP client in this environment connected to `173.254.104.205` and received no certificate and no HTTP response.
- A fetch path that can complete HTTPS received the Bluehost account-suspension document, with final URL `https://nilepharmafood.com/cgi-sys/suspendedpage.cgi`, for every application, legacy, spam, and utility URL tested.

Neither observer returned this storefront.

---

## Final conclusion

| Layer | Result |
| --- | --- |
| A. Application correctness | **PARTIALLY VERIFIED.** Prior repository tests passed. This gate did not re-run them and did not see the app on the public host. Code correctness is not production correctness. |
| B. Production availability | **FAIL.** The canonical domain does not serve the application. |
| C. Search-engine discoverability | **FAIL** for a crawl of the live host. The live document is a suspension page. Older index entries still describe a different site. |
| D. Search Console / Bing | **REQUIRES SEARCH CONSOLE/BING.** No property access in this pass. Nothing was submitted or removed. |
| E. Business / legal evidence | **REQUIRES BUSINESS/LEGAL VERIFICATION.** Unchanged, and not inspectable on the live host. |
| F. Future SEO opportunities | **REQUIRES FUTURE IMPLEMENTATION**, and only after this gate passes. Not started. |

---

## Phase 1 — Production availability

DNS, observed 2026-09-23:

- `nilepharmafood.com` A → `173.254.104.205`
- `www.nilepharmafood.com` A → `173.254.104.205` (no CNAME in the answer that succeeded)
- NS → `ns1.bluehost.com`, `ns2.bluehost.com`

Direct client from this environment:

- Port 443 accepts a TCP connection, then closes the handshake. OpenSSL read 0 bytes, wrote 222 bytes, and reported no peer certificate. TLS 1.2 and the default client both failed. Elapsed time about 0.03–0.12 seconds. This is a failed handshake, not an application TTFB.
- Port 80 accepts a TCP connection and returns an empty reply. `http://nilepharmafood.com/` closed in about 0.002 seconds. No status line, no `Location`, no body.

Fetch observer, same calendar day, final URL for every request below was `https://nilepharmafood.com/cgi-sys/suspendedpage.cgi`. Visible text was the Bluehost “Account Suspended” notice and a Bluehost CDN image. Title was empty. No storefront H1, no locale chrome, no product data.

| Check | Classification | What was observed |
| --- | --- | --- |
| TLS valid | **FAIL** | No certificate was presented to the direct client. No outside lab result was retrieved. A fetch path did receive HTTPS HTML, so some network path can open the host, but this environment cannot validate a certificate. |
| HTTP → HTTPS | **PARTIALLY VERIFIED** | `http://nilepharmafood.com/` and `http://www.nilepharmafood.com/` ended, in the fetch observer, on the HTTPS suspension URL. The direct client saw an empty reply, not a 301. Status and hop count were not returned. |
| www → apex | **PARTIALLY VERIFIED** | `https://www.nilepharmafood.com/` ended on `https://nilepharmafood.com/cgi-sys/suspendedpage.cgi`. Same IP. Not a measured single 301 to `/ar` or `/`. |
| Homepage 200 and application served | **FAIL** | Not a 200 of this app. Suspension document. Numeric status was not in the observer output, so a 200-of-the-wrong-page is not claimed either. |
| `/ar` and `/en` 200 | **FAIL** | Same suspension document. No locale page. |
| No Bluehost suspension page | **FAIL** | That page is what the fetch observer received. |
| No deployment fallback | **FAIL** | The response is a host suspension document, not this Next.js deployment. |
| No unexpected redirect chain | **FAIL** | Requested paths did not stay on themselves and did not end on this app. They ended on `/cgi-sys/suspendedpage.cgi`. Hop count was not measured, so “exactly one hop” is not claimed. |

Wayback, requested as a 2026 capture, resolved to the 2025-07-14 capture of `http://nilepharmafood.com/`. That archived page said the domain was pending renewal or expired. That is a historical document, not today’s live body. Today’s fetch body is the Bluehost suspension page. DNS still resolves. Registration status was not re-checked at the registrar. No 2026 app capture was returned.

---

## Phase 2 — Crawlability

`/robots.txt` and `/sitemap.xml` were requested on the production origin. The fetch observer returned the same suspension document, not a robots file and not an XML sitemap. Status, canonical, robots meta, `X-Robots-Tag`, title, H1, hreflang, Open Graph, and JSON-LD of this application were not present to inspect.

Representative catalog and PDP URLs did the same. See the URL table. There is no production canonical, no production H1, and no production Product JSON-LD to compare with the repository.

| Check | Classification |
| --- | --- |
| Production robots.txt is this app’s file | **FAIL** |
| Production sitemap.xml is this app’s sitemap | **FAIL** |
| PDP canonical, robots, title, H1, hreflang, Open Graph, JSON-LD | **BLOCKED** — the app response does not exist on this host |

---

## Phase 3 — Sitemap

There is no production sitemap to download. The URL `https://nilepharmafood.com/sitemap.xml` returned the suspension document in the fetch observer.

Every sitemap URL therefore fails the required checks as a set: not a 200 of an indexable canonical page, not proven non-redirected, not proven indexable, and not this application. No per-URL contradiction inside an XML sitemap can be listed because no XML was returned.

| Check | Classification |
| --- | --- |
| Download production sitemap and verify every URL | **FAIL** |

---

## Phase 4 — Redirects

No new redirects were created.

Every explicit legacy URL tested, plus the spam, trash, and unknown-product controls, ended on the suspension CGI in the fetch observer. None returned one 301 to an `https://nilepharmafood.com/ar/products/...` URL followed by a 200 of that PDP. Trailing-slash variants did not either. Redirect-chain length was not measured. The direct client never received a `Location` header.

| Requested URL | Expected if this app were the origin | Observed final URL | Classification |
| --- | --- | --- | --- |
| `/product/proxeed-plus` | one 301 to `/ar/products/proxeed-plus`, then 200, noindex | suspension CGI | **FAIL** |
| `/product/proxeed-plus/` | same single 301 | suspension CGI | **FAIL** |
| `/product/proxerex` | one 301 to `/ar/products/proxerex` | suspension CGI | **FAIL** |
| `/product/proxerex/` | same | suspension CGI | **FAIL** |
| `/product/proxeed-women` | one 301 to `/ar/products/proxeed-women` | suspension CGI | **FAIL** |
| `/product/ellamuselle` | one 301 to the noindex PDP | suspension CGI | **FAIL** |
| `/product/pulse-oximeter-ca-mi-o2-easy/` | one 301 to `/ar/products/ca-mi-pulse-oximeter` | suspension CGI | **FAIL** |
| `/product/t-onedigital-ir-thermometer` | 404, no 301 | suspension CGI | **FAIL** |
| `/product/does-not-exist` | 404, not a catalog redirect | suspension CGI | **FAIL** |
| `/term-paper-writer-reviews` | 410, never a product | suspension CGI | **FAIL** |
| `/home__trashed/store__trashed` | 410 | suspension CGI | **FAIL** |
| `/wp-admin` | 410, not a product | suspension CGI | **FAIL** |
| `/feed` | 410, not a product | suspension CGI | **FAIL** |
| `/cgi-sys/suspendedpage.cgi` | must not be the public document | that document | **FAIL** |

`/product/proxeed-women` without a trailing slash was tested. Its slash variant was not separately fetched. Given every other slash and non-slash pair collapsed to the same CGI, a different app-level 301 on that one slash variant is not a reasonable inference, and it was not measured. Classification for that unfetched slash variant: **BLOCKED** as an unmeasured twin of a failed pair, not a pass.

---

## Phase 5 — Product SEO

No SEO-eligible product response exists on the host, so title, H1, Arabic name, canonical, Product JSON-LD, brand omission, seller, price, currency, availability, and the absence of fake ratings, reviews, and GTINs were not visible in production.

Fetched as the pages that would have to prove this, all suspension CGI:

- `/ar/products/ca-mi-pulse-oximeter`
- `/en/products/ca-mi-ir-thermometer`
- `/ar/products`
- `/ar/products/proxeed-plus`
- `/ar/products/ellamuselle`
- `/en/products/proxeed-men`

| Check | Classification |
| --- | --- |
| Eligible products match the repository SEO rules on the live host | **BLOCKED** |
| Blocked products are noindex and absent from the production sitemap | **BLOCKED** — there is no app sitemap and no app PDP. Absence from a missing sitemap is not evidence the noindex rule is live. |

---

## Phase 6 — Entity / Organization

No production Organization or Brand JSON-LD from this app was returned. The suspension document does not contain a legal name, address, phone, social profile, `sameAs`, or certification, and none was added.

Missing authoritative fields, still not invented:

- legal name
- address
- phone
- social profiles and `sameAs`
- certifications
- device brand and manufacturer
- supplement claim / leaflet clearance

| Check | Classification |
| --- | --- |
| Inspect live Organization/Brand data | **BLOCKED** |
| Authoritative identity fields | **REQUIRES BUSINESS/LEGAL VERIFICATION** |

A June 2025 search snippet of the old site is not a current NAP. It was not copied into schema.

---

## Phase 7 — Performance

Measurement only. Cache was not changed. Vendure was not called. No Core Web Vitals number is claimed.

| Measure | Result | Classification |
| --- | --- | --- |
| TTFB of the app | Not measured. Direct client never received a status line. | **BLOCKED** |
| Server response time | Handshake or empty-close in 0.002–0.12 seconds. That is connection failure time, not render time. | **FAIL** as an availability measurement, not a speed score |
| HTML response size of the app | Not measured. | **BLOCKED** |
| Blocking requests, layout, Vendure latency, PDP time | App not served. | **BLOCKED** |

The fetch observer’s suspension body is a short notice plus one off-site image. That is not a storefront payload size.

---

## Phase 8 — Search engine discovery

No Search Console access. No Bing Webmaster access. No URL was submitted or removed.

Public web index, not a live 200 and not a console export:

- [Home - Nile Pharma Food](https://nilepharmafood.com/) still appears with a 2025-06-10 page age: old supplement marketing, a “Nile Pahrma Food” logo line, and `{"name":"Nile Pharma Food"}`. That is not this Next.js homepage, and it is not what the fetch observer receives today. [1](https://nilepharmafood.com/)
- [Proxerex](https://nilepharmafood.com/product/proxerex) still appears with a 2025-06-02 page age, including a Proxeed Women sentence on that URL. [2](https://nilepharmafood.com/product/proxerex)
- A result titled Proxeed Women points at `https://nilepharmafood.com/product/proxeed-plus/`, page age 2025-06-02. That is index contamination, not a second live URL confirmed today. [3](https://nilepharmafood.com/product/proxeed-plus/)
- [Dental Supplies - Premium Elementor Template Kit](https://nilepharmafood.com/dental-supplies) still appears with a 2021-07-12 page age and the text “Just another Premium Elementor Kit Templates site”. [4](https://nilepharmafood.com/dental-supplies)

Those indexed documents disagree with the live suspension page. Which of them Google or Bing still treats as canonical, excluded, or crawled cannot be known from snippets.

| Check | Classification |
| --- | --- |
| Indexed URLs, exclusions, sitemap processing, crawl errors, mobile issues, structured-data issues | **REQUIRES SEARCH CONSOLE/BING** |
| Old WordPress and template URLs still described by the public index | **PARTIALLY VERIFIED** as index text only |
| Live host currently serving those old pages | **FAIL** — the fetch observer got the suspension page instead |

`nilepharma.com.eg` appeared in an unrelated suspension snippet. It is a different site and was not treated as an NPF URL.

---

## Phase 9 — Real crawl

A crawl of the live host does not walk this application. Every sampled URL resolved to one document: the Bluehost suspension page. That page has no storefront navigation, so internal-link, orphan, duplicate-title, and duplicate-H1 checks of the Next.js site cannot be performed.

What the live host does show:

- One repeated document for home, locales, catalog, PDPs, robots, sitemap, legacy products, spam, trash, and `/wp-admin`.
- An empty title in the fetch conversion.
- A visible H1-level heading “Account Suspended!” that is not a product or brand H1.
- No canonical tag, hreflang, Open Graph, or JSON-LD was exposed by the observer.
- The suspension URL itself is an accidental public document. It is not an indexable storefront URL.

| Check | Classification |
| --- | --- |
| Broken internal links, orphans, duplicate titles, duplicate H1s, missing metadata inside this app | **BLOCKED** |
| Live host serves one non-app document for unrelated paths | **FAIL** |
| Accidental indexable utility page: `/cgi-sys/suspendedpage.cgi` is the public response | **FAIL** |
| Pagination, filters, accidental noindex of app pages | **BLOCKED** |

---

## What was not done

- No articles, hubs, comparison pages, backlinks, or keyword pages.
- No new schema types, redirects, or product claims.
- No cache change.
- No DNS, registrar, or Bluehost change.
- No Search Console or Bing submission or removal.
- No claim that repository unit tests were re-executed in this pass.

---

## Next gate

Do not start keyword expansion, content strategy, topical authority, hubs, comparison pages, a blog, or a backlink strategy.

The runtime gate passes only when `https://nilepharmafood.com` itself returns this application:

1. A normal client completes TLS and can name the certificate.
2. `/`, `/ar`, and `/en` are 200s of this app, with no suspension document and no multi-hop surprise.
3. HTTP and www each end on the canonical origin in one host hop.
4. `/robots.txt` and `/sitemap.xml` are this app’s files, and every sitemap URL is re-checked.
5. The migration-map pairs are one 301 to the mapped URL, then 200. Spam and trash are 410. Unknown and unconfirmed product URLs are 404.
6. Eligible and blocked products are then checked on the live HTML.
7. Search Console and Bing are inspected after that, not before.

Until then, production SEO remains blocked by hosting, not by a missing content phase.
