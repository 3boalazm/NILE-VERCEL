# SEO URL migration map

**Verified:** 2026-09-23.  
**Purpose:** inventory historically discoverable URLs before any redirect is written.  
**Implementation status (repository, 2026-09-23):** the explicit pairs below are in `src/lib/seo/legacy-redirects.ts` and `src/proxy.ts`, except the thermometer slug, which is still unconfirmed and returns 404. Spam and trash paths return 410. This is not verified on `https://nilepharmafood.com`, which still does not serve this app.

Rules used:

- Redirect only when the destination is the same product or the same job (home, contact, catalog).
- One hop, 301, to the Arabic URL. English is an hreflang alternate, not a second redirect target.
- Trailing-slash variants of a confirmed product URL get the same target. `skipTrailingSlashRedirect` is on so the proxy, not Next's built-in slash redirect, owns that hop. A confirmed slashed legacy path is a 301 to the Arabic PDP. Other slashed paths 308 to the slashless path and keep their query. This is encoded, not proven on a running Next server.
- Do not redirect WordPress system paths, spam, or trashed URLs to a commercial page.
- A legitimate product that is **not index-eligible** may still be the redirect target so old bookmarks do not 404, but that target must be `noindex` until it qualifies. Redirecting a paused product to a different product would be a false equivalence. Those rows say so.
- `www` and `http` are host policy, not in this path map.

New canonical pattern: `https://nilepharmafood.com/ar/products/{slug}`  
The proxy now resolves `/product/` before the locale hop. A confirmed pair 301s to the Arabic PDP. An unknown `/product/*` is 404, not `/ar/product/*`.

---

## Confirmed old product URLs

Source: Wayback raw product sitemap, capture 2022-10-06 (`product-sitemap.xml`). Search-index confirmation where noted.

| OLD URL | NEW URL | STATUS | REDIRECT TYPE | TARGET | ONE-HOP? | CONTENT EQUIVALENCE | RISK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `https://nilepharmafood.com/product/proxeed-plus` | `https://nilepharmafood.com/ar/products/proxeed-plus` | Discovered in 2022 sitemap. Also in June 2025 search index as `/product/proxeed-plus/` | 301 in repository. Not live on the public host | Arabic PDP, noindex | Encoded as one hop. Not measured on a running server | Same product. Old page was a sales PDP (2,550 EGP in the snippet, per-sachet ingredient list). New page is the same SKU with a stricter evidence draft. Not a different product | Old snippet mixed a Proxeed Women sentence into this URL. Redirect is still correct. Do not redirect this URL to the women’s PDP |
| `https://nilepharmafood.com/product/proxeed-plus/` | same | Trailing slash seen in search index | 301 in repository, same rule | same | Encoded as the same 301. Not measured on a running server | Same | A separate slash 308 would be two hops. The proxy is written to avoid that |
| `https://nilepharmafood.com/product/proxerex` | `https://nilepharmafood.com/ar/products/proxerex` | 2022 sitemap and June 2025 search index | 301 in repository. Not live | Arabic PDP, noindex | Encoded as one hop | Same product. Old indexed copy is more aggressive (“clinically proven” erectile function; ingredient line “L-Arginine 2,500 g”). New catalog says 2,500 mg and is more bounded. Equivalence is the SKU, not the claims | Do not preserve the old claims in the redirect target. Search title for this URL sometimes reads “Proxeed Women”; that is index contamination, not a second URL |
| `https://nilepharmafood.com/product/proxerex/` | same | Not separately proven. Included as a variant of the same rule | 301 in repository | same | Encoded as one hop | Same | Low |
| `https://nilepharmafood.com/product/proxeed-women` | `https://nilepharmafood.com/ar/products/proxeed-women` | 2022 sitemap only. Not in the search-result set rechecked this pass | 301 in repository. Not live | Arabic PDP, noindex | Encoded as one hop | Same product name. New page leads with disease-specific outcomes that still need review | Redirect is legitimate. Indexing the destination is a separate, currently negative, decision |
| `https://nilepharmafood.com/product/ellamuselle` | `https://nilepharmafood.com/ar/products/ellamuselle` | 2022 sitemap only | 301 in repository to the paused noindex PDP. Not live | Paused PDP, **noindex** | Encoded as one hop | Same SKU. Not on sale. Not equivalent to Proxeed Women | **Do not** redirect Ellamuselle to Proxeed Women. That would be a different product |
| `https://nilepharmafood.com/product/pulse-oximeter-ca-mi-o2-easy` | `https://nilepharmafood.com/ar/products/ca-mi-pulse-oximeter` | 2022 sitemap. Slug renamed | 301 in repository. Not live | Device PDP | Encoded as one hop | Same device (O2-Easy). New slug is `ca-mi-pulse-oximeter` | Only this slug. Do not wildcard `/product/pulse*` |
| `https://nilepharmafood.com/product/t-onedigital-ir-thermometer` | `https://nilepharmafood.com/ar/products/ca-mi-ir-thermometer` | 2022 sitemap. The archived XML concatenated the slug as `t-onedigital-ir-thermometer` (hyphenation of “t-one” vs “t-onedigital” is slightly ambiguous in the stripped XML) | **Not shipped.** Unknown `/product/*` is 404 | none | n/a | Same device family if the slug is later proven. New slug `ca-mi-ir-thermometer` | Confirm the exact old slug before shipping the rule. A wrong slug rule is worse than a 404 |

Also register these **unconfirmed hyphen variants** only if GSC or a backup shows them. Do not add them speculatively:

- `/product/t-one-digital-ir-thermometer`
- `/product/t-one`

---

## Confirmed non-product URLs

| OLD URL | NEW URL | STATUS | REDIRECT TYPE | TARGET | ONE-HOP? | CONTENT EQUIVALENCE | RISK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `https://nilepharmafood.com/` | `https://nilepharmafood.com/ar` | Current host is the suspension page, not this app. New app’s proxy already redirects `/` to `/ar` | 301 or 308 via existing proxy, once this app is the origin | Arabic home | Proxy is one hop | Home to home | Host must not answer with the Bluehost CGI |
| `https://www.nilepharmafood.com/` | `https://nilepharmafood.com/ar` | Same IP today. No app-level www rule | Host 301, then locale. Two hops unless the host redirects straight to `https://nilepharmafood.com/ar` | Arabic home | Prefer one hop at the host | Same site | Infrastructure, not a Next redirect table |
| `http://nilepharmafood.com/` | `https://nilepharmafood.com/ar` | Port 80 connects and returns an empty reply today | Host 301 | HTTPS Arabic home | One hop at the edge | Same | Cannot be fixed in app code while TLS does not complete |
| `http://www.nilepharmafood.com` | same | Alfasigma’s indexed distributor link used `http://www.nilepharmafood.com` | Host 301 | HTTPS Arabic home | One hop | Same | External listing will keep the old scheme until Alfasigma edits it |

---

## URLs that must not be redirected to a product or the home money page

| OLD URL | NEW URL | STATUS | REDIRECT TYPE | TARGET | ONE-HOP? | CONTENT EQUIVALENCE | RISK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `https://nilepharmafood.com/term-paper-writer-reviews` | none | 2022 post sitemap. Unrelated spam title | **410 in repository.** Never 301 | Not a product | n/a | None | Redirecting spam into `/ar` or a PDP can associate the new site with the hack |
| `https://nilepharmafood.com/home__trashed/store__trashed` | none | 2022 product sitemap, explicitly trashed | **410 in repository** | none | n/a | None | A trash URL is not the shop |
| `https://nilepharmafood.com/cgi-sys/suspendedpage.cgi` | none | What the host serves now. Not an application route | 410 in repository for `/cgi-sys`. Host must stop serving the suspension document | none | n/a | None | Query-string variants in Wayback contain off-site spam paths. Those must not 200 |
| `/wp-admin/*`, `/wp-content/*`, `/wp-includes/*`, `/feed/` | none | WordPress era, proven by Wayback CDX | 410 in repository. Do not redirect `/wp-content` to `/products` | none | n/a | None | Plugin paths are not content. Old sitemap XML files are not special-cased; they 404 with the rest of the app |
| `/product/*` unknown slugs | none | Not in the confirmed pair list | 404 in repository, including the unconfirmed thermometer slugs | none | n/a | None | A wildcard `/product/:slug` → `/ar/products/:slug` is **unsafe**. Old and new slugs differ for both devices |

---

## Mentioned but not confirmed — do not redirect yet

| OLD URL | Why it is listed | Decision |
| --- | --- | --- |
| `/shop`, `/shop/` | June 2025 homepage snippet lists a “Shop” shortcut. The href was not in the snippet | **Unconfirmed.** If GSC shows it as the catalog, target `/ar/products`. Until then, no rule |
| `/contact`, `/about`, `/cart`, `/my-account` | Typical WooCommerce paths. Not in the archives retrieved this pass | **Unconfirmed.** Do not guess. `/my-account` must not 301 to `/ar/account` (different auth system, possible account-enumeration noise). 404 is safer |
| `/product/proxeed-men`, `/product/proxeed-women-inositol` | Not in the 2022 sitemap. Products did not exist on the old shop as far as evidence shows | No redirect needed. New URLs should stay noindex |
| English old URLs (`/en/product/...`) | Not observed. Old site snippet `inLanguage` was `en-US` on a non-localized WordPress URL | Do not invent `/en/product/` rules |
| `nilepharma.com.eg` paths | Different company | **Never** redirect or canonical those URLs |

---

## Internal links in the new app that are not migrations

These are new URLs, not old ones. They are listed so they are not mistaken for redirect sources.

| URL | Index? | Note |
| --- | --- | --- |
| `/ar/products?category=supplements` | Canonical is `/ar/products` | Not an old URL. Do not add it to the sitemap |
| `/ar/products?need=mens-health` | Same | Not a migration target |
| `/ar/blogs` | noindex | Not a replacement for `term-paper-writer-reviews` |
| `/ar/lab/*` | robots disallow | Not public content |

---

## Redirects that are safe to implement

The pairs below, except the thermometer, are explicit rules in the repository. They are not live, and the one-hop response has not been measured on a running Next server. Only these, and only as explicit pairs:

1. `/product/proxeed-plus` and trailing slash → `/ar/products/proxeed-plus`
2. `/product/proxerex` and trailing slash → `/ar/products/proxerex`
3. `/product/proxeed-women` and trailing slash → `/ar/products/proxeed-women`
4. `/product/pulse-oximeter-ca-mi-o2-easy` → `/ar/products/ca-mi-pulse-oximeter`
5. `/product/ellamuselle` → `/ar/products/ellamuselle` **only if** that route stays up and is noindex
6. `/product/t-onedigital-ir-thermometer` → `/ar/products/ca-mi-ir-thermometer` **after** the exact 2022 slug is confirmed from the XML or GSC

Plus a test that `/product/term-paper-writer-reviews` and `/term-paper-writer-reviews` do **not** 301 to a product.

Host-level, not in this table’s code column: HTTP→HTTPS, www→apex, and removal of the Bluehost suspension document.

---

## How to extend this map without guessing

When Search Console or a hosting backup is available, add a row only if the URL was requested or linked. Columns stay the same. A URL with no content equivalence gets 404/410, not a home redirect.
