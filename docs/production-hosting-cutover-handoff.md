# Production hosting cutover handoff

**Date:** 2026-09-23  
**Result:** cutover not completed. `https://nilepharmafood.com` does not serve this application.  
**Domain:** unchanged. Still `https://nilepharmafood.com`. `nilepharma.com.eg` was not used.

No application code, SEO rules, product URLs, redirects, or business logic were changed.

## What was observed

| Item | Observed |
| --- | --- |
| Production origin | `173.254.104.205` for both `nilepharmafood.com` and `www.nilepharmafood.com` |
| Public homepage | Fetch of `https://nilepharmafood.com/` ended at `https://nilepharmafood.com/cgi-sys/suspendedpage.cgi` |
| Page body | Bluehost “Account Suspended” |
| www | Fetch of `https://www.nilepharmafood.com/` ended on that same suspension URL |
| TLS | Direct client: handshake closed, no certificate (`SSLZeroReturnError`, about 0.033s) |
| HTTP port 80 | Empty reply, 0 bytes |
| Node on that origin | Not running. The response is a host suspension document, not `next start` |
| PostgreSQL | Not provisioned for this origin. No `psql` and no Docker in this environment |
| Build this pass | Not run. There is no production database and no host to deploy to |
| Startup this pass | Not run. There is no production process to start |
| Secrets on a public host | Not configured. `DATABASE_URI` and `PAYLOAD_SECRET` exist only as required names in the repo |
| Bluehost suspension | Still present |

This environment has GitHub access for the repository and no Bluehost, registrar, DNS, or TLS credentials. It cannot unsuspend the account or point the domain at another machine.

## What the account owner must do

Keep the public name `nilepharmafood.com`. Do not replace it and do not redirect it to another domain.

1. Sign in to the Bluehost account that serves `173.254.104.205`. Read the suspension reason.
2. Unsuspend only if that plan can run Node.js 22, a long-lived Next.js process, and PostgreSQL. A typical shared PHP account cannot. If it cannot, leave that account and move the origin. The domain stays the same.
3. If the origin moves, change the A/AAAA records for the apex and for `www` from `173.254.104.205` to the new host. Do not change the registrable domain.
4. Provision PostgreSQL. It must be reachable from the running app. (Updated
   2026-10-17: it no longer has to be reachable during `npm run build` — a
   build compiles the app and reads no catalog, so the build works without
   secrets or a database. The *running* app still needs both.)
5. Set these for the running app. Do not commit them.
   - `DATABASE_URI`
   - `PAYLOAD_SECRET` (`openssl rand -base64 32`)
6. Set `VENDURE_SHOP_API_URL` at runtime if cart and checkout must work. Leave `MOCK_CATALOG_FALLBACK` unset. Leave `ALLOW_LAB_ROUTES` unset.
7. On Node 22: `npm ci`, `npm run seed` on the empty database, `npm run build`, `npm run start`. The Docker image, if used, must receive the same variables at run (the build no longer needs them). It listens on `0.0.0.0:3000`.
8. Install a certificate for `nilepharmafood.com` and `www.nilepharmafood.com`.
9. One hop, path preserved:
   - `http://nilepharmafood.com` → `https://nilepharmafood.com`
   - `http://www.nilepharmafood.com` → `https://nilepharmafood.com`
   - `https://www.nilepharmafood.com` → `https://nilepharmafood.com`
10. Confirm a browser receives this Next.js app, not `/cgi-sys/suspendedpage.cgi`.

## Public status to confirm after that

These are not true today.

- `https://nilepharmafood.com` returns the application.
- `https://www.nilepharmafood.com` is one redirect to the apex, then the application.
- The Bluehost suspension page is gone.
- TLS presents a certificate for this domain.

Until those are true, the next production runtime verification must not start.
