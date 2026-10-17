# First execution sprint

**Date:** 2026-09-23  
**Domain:** `https://nilepharmafood.com` (unchanged)  
**Source of truth used:** `docs/search-domination-master-plan.md`, `docs/seo-final-runtime-gate.md`, `docs/seo-remediation-v1-report.md`, and the current repository. No new strategy was written.

# 1. Executive status

- **Production: BLOCKED**
- **SEO implementation: PARTIAL**

The public domain still serves the Bluehost suspension page. The repository is deployment-ready for a Node 22 host with Postgres. It is not live, and localhost was not treated as production.

The approved technical SEO rules from remediation v1 were already in the repository. This sprint fixed one confirmed metadata leak and aligned Open Graph URLs with canonicals. Every item that needs hosting, legal sign-off, a leaflet, or a business decision was left blocked.

# 2. Production recovery

## Current observation, this pass

| Check | Result |
| --- | --- |
| `https://nilepharmafood.com/` | Fetch ended at `https://nilepharmafood.com/cgi-sys/suspendedpage.cgi`. Body is the Bluehost “Account Suspended” page. |
| Apex and www A records | Both `173.254.104.205` |
| TLS | Direct client: handshake closed, no certificate. About 0.115 seconds. |
| HTTP port 80 | Empty reply. Zero bytes. About 0.002 seconds. |
| Application reachable | No |

Nameservers were `ns1.bluehost.com` and `ns2.bluehost.com` on the same-day gate. A fresh NS lookup from this environment failed TLS and was not repeated as a new investigation.

The blocker is external. Repository code cannot unsuspend Bluehost, change DNS, or install a certificate on that host. No production verification was faked.

## Is the repository deployment-ready?

Yes, for a host that can run this stack. Inspected and not redesigned:

| Piece | What it already is |
| --- | --- |
| Node | 22. Dockerfile `FROM node:22`. This environment is Node v22.22.3. |
| Build | `npm run build` → `next build --webpack` |
| Start | `npm run start` → `next start`. Docker runner: `HOSTNAME=0.0.0.0`, `PORT=3000`, `CMD ["npm", "run", "start"]` |
| Database | Postgres. `DATABASE_URI` required at build and at runtime (`src/payload.config.ts`). |
| Secret | `PAYLOAD_SECRET` required at build and at runtime. Docker accepts both as build args and does not bake them into the runner image. |
| Commerce | `VENDURE_SHOP_API_URL` optional for build, required at runtime for cart and checkout. |
| Compose | `docker-compose.yml` starts local databases only. It does not run the storefront. |
| CI | `.github/workflows/ci.yml` builds and tests. It does not deploy. |
| Ignore | `.dockerignore` excludes `node_modules`, `.next`, and `.env`. |

No repository defect was found that would make the suspended Bluehost account serve this app. None was invented.

## Can the current Bluehost account run this stack?

**Not confirmed from the repository.** The live document is a shared-host suspension CGI, not a Node process. A typical Bluehost shared account serves PHP from `public_html`. It does not run `next start`, Node 22, or Postgres.

The account owner must read the plan in the Bluehost dashboard. If it cannot run a long-lived Node process and a reachable Postgres, unsuspending it is not enough. Move the **origin** to a Node/Postgres host. Keep the domain `nilepharmafood.com`. Do not create a new primary domain. Do not redirect `nilepharma.com.eg` here.

# 3. Repository changes

This sprint only:

| File | Why |
| --- | --- |
| `src/app/[locale]/layout.tsx` | Removed the layout-level homepage hreflang. Next does not replace `alternates` unless a page sets it, so cart, checkout, account, and other noindex routes were inheriting homepage language alternates. Indexable pages already set their own. |
| `src/lib/seo/page-metadata.ts` | Open Graph `url` now matches the page canonical. |
| `src/app/[locale]/story/page.tsx` | Same Open Graph URL fix. Story does not use the shared helper. |
| `src/lib/seo/remediation.test.ts` | Regression test for the layout leak and the Open Graph URL. |
| `docs/first-execution-sprint-report.md` | This report. |

Cart, checkout, account, pricing, Vendure, and `cache: "no-store"` were not modified.

Remediation v1 files (sitemap, robots, proxy redirects, product schema, eligibility, Dockerfile stage name) were already present. They were not rewritten.

# 4. SEO items implemented

| Requirement | Implementation | Files | Verification | Status |
| --- | --- | --- | --- | --- |
| Indexable vs noindex products | Already encoded. Supplements stay ineligible. Devices pass only the code gates. | `src/lib/seo/indexability.ts`, `product-metadata.ts`, `sitemap-entries.ts` | Existing unit tests, still passing | Already done. Not loosened. |
| Arabic / English names | Stored `nameArabic` on Arabic title and H1. Latin `name` on English. | `product-identity.ts`, PDP, cards | Existing unit tests | Already done. |
| Canonical on `https://nilepharmafood.com` | `CANONICAL_ORIGIN` and relative canonicals via `metadataBase` | `src/lib/seo/site.ts`, layout, pages | Unit origin test | Already done. |
| Hreflang does not point utility pages at the homepage | Layout no longer sets a default language map | `src/app/[locale]/layout.tsx` | New unit assertion | **Done this sprint** |
| Open Graph URL equals canonical | Set on the shared metadata helper and the story page. PDP already set it. | `page-metadata.ts`, `story/page.tsx` | New unit assertion | **Done this sprint** |
| Sitemap only indexable URLs, no fake `lastModified` | Already encoded | `sitemap-entries.ts` | Existing tests | Already done. |
| Robots blocks admin, API, and lab, not the catalog | Already encoded | `robots-policy.ts` | Existing tests | Already done. |
| Approved 301s, 404s, and 410s | Already encoded. No new redirects. | `legacy-redirects.ts`, `proxy.ts` | Existing tests | Already done. |
| Product / Offer schema without fake brand, rating, review, or GTIN | Already encoded | `product-schema.ts` | Existing tests | Already done. |
| No new hubs | None created | — | Nav still has no `/blogs` hub and no men’s/women’s/fertility hubs | Held |

# 5. Blocked items

## Infrastructure

- Serving `https://nilepharmafood.com` from this app.
- TLS certificate, HTTP→HTTPS, and www→apex. These are edge settings. The app never receives the request today, so they were not faked in Next.
- `npm run build` page-data collection. No Postgres in this environment.
- Playwright against the public domain.
- `docker build`. Docker is not installed here.
- Search Console and Bing (master plan B-02, B-10).

## Legal

- Registered name versus the El-Nile collision. No disambiguation sentence (B-05, B-11).
- Whether FDA, EMA, Olimp-Lab, and “NFSA until 2030” lines in existing copy may stay. Not edited.

## Product evidence

- Leaflet and claim clearance before any supplement is indexed (B-04, B-12).
- Proxeed Women Inositol dose and pack. Still unconfirmed in the catalog. Left noindex.
- Device brand and manufacturer field (B-08). Still omitted. Not guessed.
- Thermometer old slug (B-09). Still 404, not a 301.

## Medical / claims evidence

- Quarantine of “clinically proven” and conception/sexual-outcome sentences (B-06). Needs a reviewer mark-up. Not rewritten by this sprint.
- Fertility, sexual-health, men’s, and women’s hubs. The master plan rejects them until evidence exists. Not created.
- Any comparison with Carnivita or other sachets.

## External credentials

- Bluehost, registrar, DNS, TLS, Search Console, Bing, manufacturer distributor-page confirmation (B-14).

## Business decision

- Whether paused Ellamuselle should emit an OutOfStock Offer (B-07). Left as the existing rule: Offer only when price is finite and status is active or paused. Not changed without an answer.
- Whether `/story` and `/quality-sourcing` should leave the sitemap while certification sentences are unverified. Left as they are. Removing them would be an indexation decision, not a confirmed technical defect.
- Google Business Profile and one NAP (B-05, B-18). Phones in the app and in older directory snippets are not identical. Not merged.

# 6. Tests

| Command | Result |
| --- | --- |
| `npm run lint` | **Pass.** Exit 0. |
| `npx next typegen` then `npx tsc --noEmit` | **Pass.** Exit 0. Dummy `DATABASE_URI` and `PAYLOAD_SECRET` only. No database was created. |
| `npx vitest run` | **Pass.** 13 files, 106 tests, exit 0. Includes the new hreflang/Open Graph assertion. |
| `npm run build` | **Fail.** Next.js 16.3.3 compiled (warning text was not printed). TypeScript finished in 13.7s. Page-data collection then failed: `connect ECONNREFUSED 127.0.0.1:5432` in `generateStaticParams` for `/[locale]/products/[slug]`. Payload failed closed because `MOCK_CATALOG_FALLBACK` is unset. Exit 1. This is not a successful build. |
| Production HTTP checks | **Not a pass.** Suspension page on `/`. TLS and port 80 failed as above. `/ar`, `/en`, robots, sitemap, product, legacy, and unknown URLs were not re-walked as an app crawl. The origin is not the app, so those checks cannot pass. |

No integration suite exists beyond Playwright, which was not run. No analytics vendor was added.

# 7. Remaining approved work

From the master plan backlog only. Not a new list.

| ID | Why it is still waiting |
| --- | --- |
| B-01 | External host cutover |
| B-02 | Runtime gate after B-01 |
| B-03 | Already implemented. Do not loosen it. |
| B-04 | Leaflet pack from the business |
| B-05 | Legal name and one NAP |
| B-06 | Reviewer mark-up before copy edits |
| B-07 | Business answer on Ellamuselle’s Offer |
| B-08 | Real brand field, or keep brand omitted |
| B-09 | Exact thermometer slug from Search Console or a backup |
| B-10 | Search Console / Bing access |
| B-11 | Legal text for one disambiguation sentence |
| B-12 | Index one supplement only after B-04 |
| B-13 | Device listing URL only after B-08 |
| B-14 | Manufacturer confirms the distributor row |
| B-15–B-18 | Articles, comparisons, photos, GBP. All still gated. |

# 8. Production handoff

The account owner, not this repository, has to do the following. The domain stays `nilepharmafood.com`.

1. Sign in to the Bluehost account for `173.254.104.205`. Read the suspension reason. Unsuspend only if that plan can run Node 22 and Postgres. If it is shared PHP hosting, do not treat unsuspend as the finish line.
2. If a different machine will run the app, change the A/AAAA records for the apex and for `www` from `173.254.104.205` to that machine. Do not point the domain at another brand. Do not touch `nilepharma.com.eg`.
3. Provision Postgres. It must be reachable during build and during `next start`.
4. Generate `PAYLOAD_SECRET` (`openssl rand -base64 32`). Do not commit it.
5. Inject at **build** and again at **runtime**:
   - `DATABASE_URI`
   - `PAYLOAD_SECRET`
6. Inject at runtime if cart and checkout must work: `VENDURE_SHOP_API_URL`. Leave `MOCK_CATALOG_FALLBACK` unset. Leave `ALLOW_LAB_ROUTES` unset.
7. On Node 22: `npm ci`, `npm run seed` on the empty database, `npm run build`, `npm run start`. Or `docker build` with those build args, then run the image with the same variables injected. Publish port 3000.
8. Install a certificate for `nilepharmafood.com` and `www.nilepharmafood.com`.
9. At the edge, one hop, path preserved: `http://nilepharmafood.com`, `http://www.nilepharmafood.com`, and `https://www.nilepharmafood.com` go to `https://nilepharmafood.com`. The app then sends `/` to `/ar`. Do not add a second domain.
10. Confirm a browser receives this Next.js storefront, not `/cgi-sys/suspendedpage.cgi`.

Then run, against the public origin, not localhost:

```bash
curl -sI https://nilepharmafood.com/
curl -sI https://www.nilepharmafood.com/
curl -sI https://nilepharmafood.com/ar
curl -sI https://nilepharmafood.com/en
curl -sI https://nilepharmafood.com/robots.txt
curl -sI https://nilepharmafood.com/sitemap.xml
curl -sI https://nilepharmafood.com/ar/products/ca-mi-pulse-oximeter
curl -sI -o /dev/null -w '%{http_code} %{redirect_url}\n' https://nilepharmafood.com/product/does-not-exist
curl -sI -o /dev/null -w '%{http_code} %{redirect_url}\n' https://nilepharmafood.com/product/proxeed-plus
curl -sI -o /dev/null -w '%{http_code} %{redirect_url}\n' https://nilepharmafood.com/term-paper-writer-reviews
```

Expected after cutover, and **not observed today**:

- Homepage and locales: 200 of this app, or one app redirect from `/` to `/ar`, then 200. No suspension text.
- www and HTTP: one hop to `https://nilepharmafood.com`, then the app.
- `robots.txt` and `sitemap.xml`: 200 of this app’s files.
- Unknown `/product/*`: 404, no `Location`.
- Confirmed legacy product URL: one 301 to the mapped `/ar/products/{slug}`, then 200 of that page.
- `/term-paper-writer-reviews`: 410, no `Location`.

## What could not be verified

HTTPS validity, homepage status of this app, locale routes, canonical tags, robots, sitemap membership, legacy redirects, 404s, 410s, and redirect-chain length. All of those require the app to be the origin.

---

## Close

1. **Implemented this sprint:** stopped homepage hreflang from leaking onto noindex routes; set Open Graph URL to the page canonical on the shared metadata helper and the story page.
2. **Already implemented, left in place:** eligibility gate, Arabic names, sitemap, robots, five 301s, 404/410 table, schema without fake brand or ratings.
3. **Blocked:** production hosting, legal identity, leaflet/claim review, device brand, thermometer slug, Ellamuselle Offer decision, Search Console.
4. **Production blocker:** Bluehost account suspension at `173.254.104.205`. TLS presents no certificate to a direct client. The site is not live.
5. **Tests:** lint pass, typecheck pass, 106 unit tests pass, build failed on missing Postgres after TypeScript succeeded. Public runtime checks failed at the host.
6. **Next step:** external. The owner must complete the handoff above. Implementation of B-06 and later backlog items cannot proceed until the matching evidence exists. Do not start another audit.
