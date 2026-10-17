# Nile Pharma Food — production SEO handoff

Date: 2026-09-24.

This is the external hosting handoff. It does not re-probe DNS, TLS, or Bluehost. It uses the closed observation in `docs/production-cutover-final-seo-gate.md` and `docs/production-hosting-cutover-handoff.md` (2026-09-23). This repository cannot unsuspend the account or change DNS.

## Current hosting state

BLOCKED.

| Item | Last recorded observation |
| --- | --- |
| Canonical domain | `https://nilepharmafood.com`. Not changed. |
| Apex and www | Both resolved to `173.254.104.205`. |
| What HTTPS returned | `https://nilepharmafood.com/cgi-sys/suspendedpage.cgi`, Bluehost “Account Suspended”. |
| www | Ended on that same suspension URL. Not one hop to this app. |
| TLS | Direct handshake closed. No certificate presented. |
| Port 80 | Empty reply. |
| This Next.js app on that origin | No. |

`nilepharma.com.eg` is a different company. It is not an NPF URL and must not become the canonical domain.

## Canonical domain

Keep `https://nilepharmafood.com`.

Do not add a second primary domain. Do not 301 this domain to another domain. The app already refuses absolute SEO URLs on another origin (`src/lib/seo/site.ts`).

www and HTTP are host policy. The app does not terminate TLS and does not implement the www hop. After the edge is correct, the app sends `/` to `/ar`.

## Required deployment

The owner must make this repository the document at the canonical origin.

1. Decide whether the suspended Bluehost account can run a long-lived Node.js 22 process and PostgreSQL. A typical shared PHP account cannot. If it cannot, move the origin and keep the domain.
2. If the origin moves, change the apex and www A/AAAA records away from `173.254.104.205`. Do not change the registrable domain.
3. Install a certificate for `nilepharmafood.com` and `www.nilepharmafood.com`.
4. One hop, path preserved:
   - `http://nilepharmafood.com` → `https://nilepharmafood.com`
   - `http://www.nilepharmafood.com` → `https://nilepharmafood.com`
   - `https://www.nilepharmafood.com` → `https://nilepharmafood.com`
5. Confirm a browser receives this Next.js app, not `/cgi-sys/suspendedpage.cgi`.

## TLS

BLOCKED on the current origin. No certificate was presented to a direct client on 2026-09-23.

The app does not terminate TLS. The edge in front of Node must.

## Node 22

The Docker image is `node:22`. CI is documented to use Node 22. Build with `npm ci`, then `npm run build` (`next build --webpack`). Start with `npm run start`. The image listens on `0.0.0.0:3000` when `HOSTNAME` and `PORT` are set as in the Dockerfile.

## PostgreSQL

Required at build and at runtime. `DATABASE_URI` has no silent fallback in `src/payload.config.ts`.

Local check in this environment: `127.0.0.1:5432` refuses the connection. That blocks `next build` here. It is not the production database, and it was not changed to force a build.

`docker-compose.yml` is a local commerce scaffold. It is not the production origin.

## Secrets

Set these on the host for build and again for start. Do not commit them.

| Name | Required |
| --- | --- |
| `DATABASE_URI` | Yes. Build and start. |
| `PAYLOAD_SECRET` | Yes. Build and start. Generate with `openssl rand -base64 32`. |
| `VENDURE_SHOP_API_URL` | At runtime if cart, checkout, and account must work. |
| `MOCK_CATALOG_FALLBACK` | Leave unset in production. |
| `ALLOW_LAB_ROUTES` | Leave unset in production. |

## Apex and www

Last observation: both names hit the same suspended host. www did not redirect to an application response.

Required after cutover: www and HTTP land on `https://nilepharmafood.com` in one hop, then the app may send `/` to `/ar`.

## Runtime verification after deployment

Do not start this until the canonical URL returns this app.

Use the checklist already written in `docs/seo-final-runtime-gate.md`. Minimum confirmation:

- `https://nilepharmafood.com` is this storefront.
- www is one redirect to the apex, then the app.
- TLS presents a certificate for this domain.
- `/robots.txt` and `/sitemap.xml` are this app’s files.
- `/ar` and `/en` render.
- Product pages that are ineligible are reachable and `noindex`.
- The two device URLs are the only product sitemap candidates.
- No supplement URL was added.
- Search Console and Bing are opened only after those fetches succeed.

Nothing in that list was verified on the public host. Do not treat a local test as that verification.
