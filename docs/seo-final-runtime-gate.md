# Final production recovery and runtime SEO gate

**Date:** 2026-09-23  
**Canonical domain:** `https://nilepharmafood.com`  
**Result:** the gate does not pass. SEO is not fixed.  
**Repository changes this pass:** none. No content, hubs, comparisons, backlinks, redirects, schema, cache, DNS, or domain changes.

The public host is still not this application. Part B cannot pass until Part A is done outside the repository.

---

## Gate result

| Layer | Classification |
| --- | --- |
| Domain still `nilepharmafood.com` | **PASS** as a constraint. It was not changed. |
| Domain serves this Next.js app | **FAIL** |
| Runtime SEO (canonical, sitemap, robots, redirects, product indexability) | **BLOCKED** — there is no application response to verify |
| Search Console / Bing | **REQUIRES SEARCH CONSOLE/BING** |
| Business / legal identity and claims | **REQUIRES BUSINESS/LEGAL** |
| Gate 2 (content, hubs, comparisons, backlinks) | Not started. Do not start it. |

---

## Part A — What must be true for this domain to serve this repo

Inspected: `Dockerfile`, `docker-compose.yml`, `package.json` scripts, `.env.example`, `README.md`, `.github/workflows/ci.yml`, `src/payload.config.ts`, `src/lib/seo/site.ts`, `src/proxy.ts`, `next.config.ts`.

No repository defect found whose fix would make `https://nilepharmafood.com` serve this app. The origin is a suspended Bluehost account. This environment has no Bluehost, registrar, DNS, or TLS credentials. That was not pretended to be solved.

### What the repository already defines

| Item | Repository fact |
| --- | --- |
| Production origin | `https://nilepharmafood.com` in `src/lib/seo/site.ts`. No `www`. No second domain. |
| Build | Node 22. `npm ci`, then `npm run build` (`next build --webpack`). |
| Start | `npm run start` (`next start`). Docker runner sets `HOSTNAME=0.0.0.0`, `PORT=3000`, `CMD ["npm", "run", "start"]`. |
| Database | Postgres. `DATABASE_URI` is required at build and at runtime. Payload creates tables on first boot. CI seeds before build because prerender reads the catalog. |
| Secret | `PAYLOAD_SECRET` is required at build and at runtime. Docker accepts it as a build `ARG` and does not bake it into the runner stage. The platform must inject it again at `next start`. |
| Commerce | `VENDURE_SHOP_API_URL` is optional for the build. Cart, checkout, and account need it at runtime. Default in code is `http://localhost:3001/shop-api`. |
| Fail-closed catalog | `MOCK_CATALOG_FALLBACK` must stay unset in production. |
| Lab routes | `ALLOW_LAB_ROUTES` unset or `false`. |
| Docker image | `Dockerfile` builds the storefront. `COPY --from=builder` matches the named `builder` stage. The image was not built here: `docker` is not installed, and there is no reachable Postgres. |
| Compose file | `docker-compose.yml` is the local Vendure database scaffold (Postgres published on host port 6543, plus MySQL, MariaDB, Redis, Typesense, Elasticsearch). It does not build or run the Next.js app. It is not a production origin. |
| CI | `.github/workflows/ci.yml` runs install, seed, typecheck, lint, build, unit tests, and Playwright against a throwaway Postgres. It does not deploy. |
| www and HTTP | Not implemented in the app. Documented as host policy. The app expects to be reached on `https://nilepharmafood.com`. `/` then redirects to `/ar` inside the app. |
| HTTPS | The app does not terminate TLS. The edge in front of it must. |

### What the public DNS is doing now

Reconfirmed this pass:

- `nilepharmafood.com` NS → `ns1.bluehost.com`, `ns2.bluehost.com`
- `nilepharmafood.com` A → `173.254.104.205`
- `www.nilepharmafood.com` A → `173.254.104.205`
- Port 443: TCP connects, then the handshake closes. No peer certificate. About 0.084 seconds. Not a valid TLS session.
- Port 80: TCP connects, then an empty reply. Zero HTTP bytes. No status, no `Location`.
- Fetch path that can open HTTPS: `https://nilepharmafood.com/`, `https://nilepharmafood.com/ar`, `https://www.nilepharmafood.com/`, `/robots.txt`, `/sitemap.xml`, and `/product/proxeed-plus` all end at `https://nilepharmafood.com/cgi-sys/suspendedpage.cgi` with the Bluehost “Account Suspended” text.

That is a hosting suspension, not a missing sitemap rule.

### Exact external actions

These require credentials this repository does not have. Do them in order. Do not point the domain at a different brand or company domain.

1. **Bluehost account owner.** Sign in to the account whose nameservers are `ns1.bluehost.com` / `ns2.bluehost.com` and whose site IP is `173.254.104.205`. Read the suspension reason in that dashboard. The repository cannot see it. Unsuspend only if that account is still the intended origin. Unsuspending a typical shared account is not, by itself, enough: this app is `next start` plus Postgres, not a `public_html` PHP site. Confirm the plan can run a long-lived Node 22 process and a reachable Postgres, or do not treat unsuspend as the finish line.

2. **Domain owner, same domain.** Keep the registrable domain `nilepharmafood.com`. Do not register a replacement primary domain. Do not add a 301 from this domain to any other domain. If the serving machine will not be the suspended Bluehost account, change the A/AAAA records for the apex and for `www` from `173.254.104.205` to the host that will run this app. Nameserver changes, if required, are also a registrar action. This repository must not be used to edit DNS.

3. **Origin operator, after a host exists.**
   - Provision Postgres. It must be reachable during `npm run build` and during `next start`.
   - Generate `PAYLOAD_SECRET` and keep it out of git.
   - Inject `DATABASE_URI` and `PAYLOAD_SECRET` for the build and again for the running process. The Docker runner stage does not contain them.
   - Inject `VENDURE_SHOP_API_URL` at runtime if cart and checkout must work. Leave `MOCK_CATALOG_FALLBACK` unset. Leave `ALLOW_LAB_ROUTES` unset.
   - On Node 22: `npm ci`, `npm run seed` on the empty database, `npm run build`, `npm run start`. Or `docker build` with those build args, then run the image with the same variables injected, publishing port 3000.
   - Install a certificate that covers `nilepharmafood.com` and `www.nilepharmafood.com`. Today no certificate is presented to a direct client.
   - At the edge, one hop only: `http://nilepharmafood.com`, `http://www.nilepharmafood.com`, and `https://www.nilepharmafood.com` go to `https://nilepharmafood.com` and keep the path. Do not send them to another domain. The app then sends `/` to `/ar`.
   - Confirm a browser receives this Next.js storefront, not `/cgi-sys/suspendedpage.cgi`.

4. **After step 3 is true,** rerun Part B below against the live origin. Then, and only then, open Search Console and Bing. Do not submit or remove URLs before the app is the document those tools fetch.

### Repository notes that do not unblock this gate

Not changed. Neither one makes Bluehost serve this app.

- `src/vendure-config.ts` still sets production `assetUrlPrefix` to `https://www.my-shop.com/assets/` when `APP_ENV` is not `dev`. That is a Vendure scaffold leftover. The real asset host is not verified, so it was not rewritten to the storefront domain. Next action, when Vendure is actually deployed: set the prefix to the host that serves `/assets`, after that host is known.
- The Vendure email plugin in the same file is still `devMode: true` with `noreply@example.com` and `localhost:8080` links. Same rule: do not invent production mail settings here.
- There is no deploy workflow, reverse-proxy config, or Bluehost document root in this repo. Adding one would invent a hosting target. That belongs to the external operator in steps 1–3.

---

## Part B — Runtime SEO

The application is not reachable. Every check below is against that fact. Numeric HTTP status was not returned by the fetch observer; the observed body is the suspension document, so a 200 of this app is not claimed and is not true.

### Availability

| URL / component | Classification | Observed | Expected | Root cause | Kind | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| `https://nilepharmafood.com/` | **FAIL** | Suspension page at `/cgi-sys/suspendedpage.cgi`. Empty title. Heading “Account Suspended!”. | 200 of this Next.js app. No suspension document. | Bluehost account suspension on `173.254.104.205`. | Infrastructure | External steps 1–3. |
| `https://nilepharmafood.com/ar` | **FAIL** | Same suspension document. | 200 Arabic storefront. | Same. | Infrastructure | External steps 1–3. |
| `https://nilepharmafood.com/en` | **FAIL** | Not re-fetched this minute. Same host and same final URL pattern as `/` and `/ar` on this pass, and the same document on the prior same-day pass. | 200 English storefront. | Same. | Infrastructure | Re-check after the app is the origin. |
| TLS | **FAIL** | Handshake EOF. No certificate. | Valid certificate for the apex. | Origin closes TLS before a certificate. Not an app TLS config. | Infrastructure | Certificate on the host that will run the app. |
| HTTP → HTTPS | **FAIL** | Direct client: empty reply, no redirect. Fetch of `http://` URLs was not repeated this minute; the prior same-day fetch ended on the HTTPS suspension URL. | One edge 301 to `https://nilepharmafood.com` plus the path. | No application is answering port 80. | Infrastructure | Edge redirect after the origin exists. |
| www | **FAIL** | `https://www.nilepharmafood.com/` ends on the apex suspension CGI. Same IP. | One hop to `https://nilepharmafood.com/`, then the app. | Suspended host, not an app www rule. | Infrastructure | Edge redirect. Do not add a second domain. |
| Deployment fallback / suspension page | **FAIL** | `/cgi-sys/suspendedpage.cgi` is the public document. | That URL must not be the site. | Host suspension document. | Infrastructure | Remove it by unsuspending or by leaving that host. |
| Redirect chain of the app | **BLOCKED** | No app response. The suspension final URL is not the app’s `/` → `/ar` hop. | No chain beyond the one edge canonical hop plus the app’s own `/` → `/ar`. | App not served. | Infrastructure | Re-measure after cutover. |

### Crawl files and pages

| URL / component | Classification | Observed | Expected | Root cause | Kind | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| `/robots.txt` | **FAIL** | Suspension document. Not this app’s robots file. | 200, disallow `/admin` and `/api`, allow the catalog, sitemap URL on this origin. | App not served. | Infrastructure | Re-fetch after cutover. |
| `/sitemap.xml` | **FAIL** | Suspension document. No XML. | This app’s sitemap, no invented `lastModified`. | App not served. | Infrastructure | Re-fetch after cutover. |
| Every sitemap URL: 200, canonical, indexable, not redirected, not noindex, on this domain | **BLOCKED** | No sitemap document exists to enumerate. | Those rules, already encoded in the repo. | App not served. | Infrastructure | Download the live sitemap only after cutover. |
| Representative PDP and catalog pages | **FAIL** | `/ar` catalog was not a catalog. Prior same-day fetches of device and supplement PDPs were the suspension document. | App HTML with title, H1, canonical, robots, hreflang, Open Graph, JSON-LD. | App not served. | Infrastructure | Re-check after cutover. |
| `X-Robots-Tag` on app pages | **BLOCKED** | No app response headers. | As encoded: noindex on ineligible products; public pages not blocked by robots.txt. | App not served. | Infrastructure | Re-check headers after cutover. |

### Redirects

No redirects were added or edited.

| URL / component | Classification | Observed | Expected | Root cause | Kind | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| `/product/proxeed-plus` | **FAIL** | Suspension CGI. Not a 301. | One 301 to `/ar/products/proxeed-plus`, then 200 of that noindex PDP. | App not served. The repo rule cannot run. | Infrastructure | Re-test after cutover. Do not add another rule. |
| Other explicit pairs in `docs/seo-url-migration-map.md` | **FAIL** | Prior same-day pass: each tested pair ended on the suspension CGI. Not re-fetched one by one this minute because the origin is unchanged. | One 301 to the mapped Arabic PDP, then 200. | App not served. | Infrastructure | Re-test the five pairs, with and without the trailing slash, after cutover. |
| `/term-paper-writer-reviews`, trash URL, unknown `/product/*`, unconfirmed thermometer slug | **FAIL** | Prior same-day pass: suspension CGI, not 404/410 and not a product redirect. | 410 for spam and trash. 404 for unknown and unconfirmed product slugs. Never a 301 to a product. | App not served. | Infrastructure | Re-test after cutover. Do not add wildcards. |
| Wildcard redirects | **PASS** as a code constraint | None were created. | None. | n/a | Code | Leave it that way. |

### Product SEO and entity

| URL / component | Classification | Observed | Expected | Root cause | Kind | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| Eligible device PDPs: title, H1, Arabic name, canonical, Product JSON-LD, omitted brand, seller, price, currency, availability, no fake rating/review/GTIN | **BLOCKED** | No PDP HTML. | Repository rules, visible on the live page. | App not served. | Infrastructure | Verify on the live HTML after cutover. |
| Blocked products noindex and absent from sitemap | **BLOCKED** | No app sitemap and no app robots meta. | Supplements and paused products noindex and absent. | App not served. | Infrastructure | Verify after cutover. Absence from a missing sitemap is not evidence. |
| Organization / Brand legal name, address, phone, social, `sameAs`, certifications | **REQUIRES BUSINESS/LEGAL** | Not on the suspension page. Not invented. | Only fields the business has confirmed. | Evidence still missing, and the app is not served. | Business | Do not fill schema from old snippets or directories. |
| Medical / supplement claims | **REQUIRES BUSINESS/LEGAL** | Not rewritten. | No new claims. | Not a hosting fix. | Business | Leave blocked until leaflet/claim clearance exists as data. |

### Performance

Measurement only. `cache: "no-store"` was not removed. Nothing was redesigned.

| Measure | Classification | Observed | Expected | Root cause | Kind | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| TTFB, HTML size, Vendure latency, blocking requests, layout time | **BLOCKED** | No application response. Direct failure time was a TLS close at about 0.084 seconds and an empty port-80 read. | Measurements of this app. | App not served. | Infrastructure | Measure after cutover. Do not change cache in that pass either unless a later gate says so. |

### Search engines

| Check | Classification | Observed | Expected | Root cause | Kind | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| Search Console and Bing: index, exclusions, sitemap, crawl errors, old WordPress URLs, spam URLs, canonical conflicts, structured data | **REQUIRES SEARCH CONSOLE/BING** | No property access. Nothing submitted or removed. | A review after this app is the document Google and Bing fetch. | No credentials, and the live document is the suspension page. | Search engine | Open the properties only after cutover. Do not submit or remove URLs blindly. |

A public index snippet is not a console export. The prior same-day check still showed older indexed text for this domain (old homepage, `/product/proxerex`, a Proxeed Women title on `/product/proxeed-plus/`, and a 2021 template URL). Those snippets are not what the fetch path receives today. Whether they remain indexed is a console question.

---

## What was not done

- No DNS, registrar, Bluehost, or certificate change.
- No domain change and no cross-domain redirect.
- No new SEO implementation, content, hub, comparison, or backlink.
- No cache change.
- No Docker image build. Docker is not available here, and Postgres is not reachable.
- No claim that the repository unit tests were re-run in this pass. Prior code tests are not production proof.

---

## Stop

This gate is complete as a failed production gate.

Do not begin keyword research, content creation, hubs, comparison pages, backlinks, or broader SEO optimization. Those are Gate 2, and Gate 2 stays closed until `https://nilepharmafood.com` serves this application and Part B is run again against that response.
