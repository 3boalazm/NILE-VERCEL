# Operations runbook

> What a person on call actually needs: how configuration is validated, how to
> back up and restore the database, how the security headers roll out, and
> where errors go. Written alongside the wave-2 fixes (F-11, F-53, F-56, F-65,
> F-71) — every claim below is backed by a script or a test, not by intent.

Related: [`docs/GRAPHQL.md`](./GRAPHQL.md) (API explorers), [`.env.example`](../.env.example)
(the authoritative variable list), [`DECISIONS.md`](../DECISIONS.md) (why things
are the way they are).

---

## 1. Environment configuration

**Nothing reads `process.env` ad hoc any more.** Two layers, deliberately:

| Layer | File | Job |
|---|---|---|
| Values | `src/lib/env.ts` | zod schemas, parsed at boot. Missing/invalid → **every** problem printed at once, pointing at `.env.example`. |
| Documentation | `scripts/check-env.mjs` | CI guard: every variable read in `src/` (plus `next.config.ts`) must appear in `.env.example`, and everything documented must still be consumed. |

```bash
npm run check:env        # exits 1 on drift, no dependencies, no database
```

Why both: the drift guard exists because `.env.example` documented
`SUPERADMIN_USER`/`SUPERADMIN_PASS` while the code read
`SUPERADMIN_USERNAME`/`SUPERADMIN_PASSWORD`. Copying the documented file
produced a super-admin nobody could log in as, and *nothing failed*. Value
validation cannot catch that (both names are simply absent); only comparing
code against documentation can.

`src/environment.d.ts` derives the `process.env` types from those same schemas,
so there is one declaration per variable. The Vendure scaffold's hand-written
version typed `DB_PORT` as `number` — a lie, since every environment variable
is a string at runtime, and the reason `+process.env.DB_PORT` could hand the pg
driver `NaN` while looking type-safe.

**Required** (boot fails without them): `PAYLOAD_SECRET`, `DATABASE_URI`,
`DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `COOKIE_SECRET`,
`SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD`.

`SUPERADMIN_*` are required rather than warned about on purpose: Vendure's
`superadminCredentials` is optional in its type but **defaults to
`superadmin`/`superadmin` at runtime**, so "unset" does not mean "no
super-admin" — it means a published credential pair on the admin panel.

**Warned, not fatal** (offline/mock development is a supported mode):
`SMTP_HOST` (mail degrades to dev mode), `STOREFRONT_URL` (email links fall back
to a default origin).

---

## 2. Process topology: the Vendure worker is not optional

`npm run start:server` (`src/index.ts`) boots **only the API**. Job-queue
consumption lives in a separate process: `npm run start:worker`
(`src/index-worker.ts` → `bootstrapWorker` + `startJobQueue`). The queues are
`update-search-index`, `send-email`, and `clean-sessions`; they are persisted
in Postgres, so an unconsumed queue does not crash anything — **that silence is
the danger**. Proven live (2026-09-23 audit): with the server alone, admin
search returned `totalItems: 0`, `reindex` mutations sat `PENDING`, and order
emails were never sent. Starting the worker drained the backlog and search
recovered immediately.

Production must run **both** processes against the same database:

```bash
npm run build:all        # compiles dist/index.js + dist/index-worker.js
npm run start:server &   # shop-api / admin-api / Payload-facing HTTP
npm run start:worker     # job queues (search index, email, session cleanup)
# or a single supervised process: npm run start:vendure  (vendure start all)
```

Sizing note: the worker is a second DB client — it counts toward the
`DATABASE_POOL_MAX` budget in §3 below.

### Manual transfer verification (no automation, by client decision)

InstaPay / Vodafone Cash orders authorize at checkout (`PaymentAuthorized`)
and stay there until a human confirms the money actually arrived:

1. `npm run payments:pending` — read-only list of every order awaiting
   verification: code, total, chosen rail, the customer-typed transfer
   reference (`payment.metadata.public.transferRef`), and the direct
   `/admin` deep action. Mutates nothing.
2. Check the receipt (WhatsApp thread / banking app), then open
   `/admin` → Orders → the order → **Settle payment**. Rejected receipt →
   **Cancel** the order from the same screen. Both are native Vendure
   admin actions — deliberately not re-implemented here.
3. Never settle on the strength of the WhatsApp message alone; the
   reference is a reconciliation aid, not proof of payment.

---

## 3. Database pool sizing (F-71)

`DATABASE_POOL_MAX` — pg's own default is `max: 10` **per process**. With a Next
server and a Vendure worker on one host that is quietly 20+, against Postgres'
default `max_connections: 100`. The same validated value now feeds both
Payload's adapter (`db.pool.max`) and Vendure's TypeORM (`extra.max`), so the
two sides of one physical database cannot disagree. Bounded 1..200 at parse
time, so a typo cannot exhaust the server.

Rule of thumb: `sum(all processes' DATABASE_POOL_MAX) < max_connections - 10`
(leave headroom for migrations, `psql`, and the backup job).

---

## 4. Session lifetime (F-56)

`NPF_SESSION_MAX_AGE_DAYS`, **clamped to 30 in code** (`src/lib/vendure/session.ts`)
— a larger value cannot silently reinstate the previous one-year session.
Active users are unaffected: the cookie is rewritten on every authenticated
call, so only genuinely idle sessions expire.

The other half of F-56 (password *policy* strength) lives in Vendure, not here —
see the register; it is still open.

---

## 5. Backups & restore (F-53)

```bash
npm run db:backup                          # timestamped archive(s) into .backups/
bash scripts/backup-db.sh verify           # prove the newest archive is readable
bash scripts/backup-db.sh list
bash scripts/backup-db.sh restore <file> --yes
```

- Payload (CMS) and Vendure (commerce) share **one** Postgres instance, so one
  dump covers both. If a deployment splits them, the script detects distinct
  `host:port/database` identities and dumps each — identity is compared on
  host/port/database, *not* on the connection string, because
  `DATABASE_URI` and Vendure's assembled URI spell the same database
  differently.
- Archives are `pg_dump --format=custom --compress=9 --no-owner --no-privileges`,
  each with a `.sha256` sidecar. `verify` reads the archive's table of contents
  and checks the checksum **without connecting to any database**, so it is safe
  to run against production archives and in CI.
- Retention prune (`BACKUP_RETENTION_DAYS`, default 14) runs inside `backup`,
  per label — a cron job therefore cannot silently fill the disk, and keeping 14
  days of two databases cannot evict one of them early.
- `restore` is destructive (`--clean --if-exists`) and refuses to run without
  `--yes` on a non-interactive shell. It verifies the archive first.

```cron
30 3 * * * cd /srv/npf && BACKUP_RETENTION_DAYS=14 scripts/backup-db.sh backup >> /var/log/npf-backup.log 2>&1
```

**A backup on the database's own host does not survive losing the host.**
Offsite replication is *not* automated here — copy `.backups/` elsewhere
(rclone/restic/S3) as a second step, and rehearse `restore` into a scratch
database before you need it for real. The script prints this reminder after
every run rather than letting it be forgotten.

Cron: `pg_dump`/`pg_restore` must be on PATH (Debian/Ubuntu:
`postgresql-client`); the script fails with that instruction if they are not.

---

## 6. Security headers & CSP (F-11)

Set in `next.config.ts`, **scoped per surface** because Next applies every
matching rule cumulatively and a browser enforces the *intersection* of
multiple CSP headers:

| Surface | Routes | Notes |
|---|---|---|
| storefront | everything except `/admin`, `/api` | `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'self'`, `frame-src` limited to Google Maps (the contact page embed) |
| admin | `/admin/*`, `/api/*` | additionally `blob:` in `script-src`/`worker-src`, and `'unsafe-eval'` in non-production only |

Also on every route: `X-Content-Type-Options: nosniff`,
`X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Strict-Transport-Security`, `Permissions-Policy`, and
`poweredByHeader: false` (no `X-Powered-By`). `upgrade-insecure-requests` is
added in production builds only.

**Known limitation, stated plainly:** `script-src` still carries
`'unsafe-inline'`. Next.js emits per-page inline flight-payload scripts and
`src/app/[locale]/layout.tsx` has a static pre-paint theme bootstrap, so
removing it needs per-request **nonces** — which `headers()` in `next.config`
cannot produce (it is not per-request). That means middleware plus a nonce-aware
audit of Serwist's registration and Payload admin's inline bootstrap. Tracked as
the F-11 follow-up in `DECISIONS.md`; **do not read "CSP shipped" as "XSS
closed"**.

Rollout switches:

```bash
NPF_CSP_MODE=enforce        # default — sends Content-Security-Policy
NPF_CSP_MODE=report-only    # sends Content-Security-Policy-Report-Only
NPF_CSP_MODE=off            # no CSP header
NPF_CSP_REPORT_URI=…        # optional violation collector (report-uri)
```

**How to verify a policy change before shipping it** (this is the step the
previous "CSP deferred" comment was really asking for):

```bash
npm run build && npm start            # or: npx next start -H 0.0.0.0 -p 3000
npm run probe:manual http://localhost:3000
```

The probe loads 8 routes in a real Chromium and fails on **any**
`securitypolicyviolation` (directive + blocked URI are printed), asserts both
surfaces got a policy, and asserts they differ exactly where intended. It uses
the `@sparticuz/chromium` binary already vendored in `node_modules`, so it needs
no `playwright install` and no network. CI runs it in the `e2e` job.

---

## 7. Error reporting (F-65)

`src/lib/telemetry/report-error.ts` is the single reporting path. Transport is
chosen by environment:

| Set | Behaviour |
|---|---|
| `SENTRY_DSN` (server) / `NEXT_PUBLIC_SENTRY_DSN` (browser) | Posts a Sentry **envelope** directly to Sentry's ingest API. No SDK dependency — an envelope is three JSON lines. |
| `NPF_ERROR_ENDPOINT` / `NEXT_PUBLIC_ERROR_ENDPOINT` | Posts the same normalized JSON record to any collector. |
| neither | Structured JSON record (server log) / console (browser). |

Wired at three levels: both error boundaries (`error.tsx`, `global-error.tsx`),
`logError()` in `src/lib/observability/log.ts` — which every server action
already funnels through, so one call site covers all of them — and the client
`catch` blocks of every submitting surface (F-64's wrappers).

Guarantees, each with a test in `report-error.test.ts`: it never throws (even
when the transport itself fails), it is rate-limited to 20 events/minute per
process so a render loop cannot flood the collector or the bill, and it carries
no personal data unless the caller puts it in `extra`.

`NEXT_PUBLIC_*` values are inlined **at build time** — changing them requires a
rebuild, and the browser-side DSN must be a *public* key, never a secret one.

---

## 8. Account erasure SOP (F-58)

The storefront's "delete account" flow (profile page → danger zone) records a
**request**, it does not erase: Vendure's shop API intentionally exposes no
customer-delete mutation, so erasure is an admin operation. Requests land in
the Payload `erasure-requests` collection (admin panel → Erasure Requests),
one document per request with the Vendure `customerId`, email, locale and a
`status` workflow field. GDPR Art. 12(3) gives one month; treat that as the
SLA, not the target.

Per request with `status: new`:

1. Verify the requester: the email on the request must match the Vendure
   customer, and the request could only be created from an authenticated
   storefront session (the action re-checks the session server-side), so no
   extra identity proof is normally needed. If anything looks off (sudden
   burst of requests, mismatched email), set `rejected` and note why.
2. In **Vendure admin**: open the customer, anonymize or delete the customer
   record and their addresses; cancel nothing — keep order history that tax
   law requires, but strip personal identifiers where the admin allows it.
3. In **Payload admin**: delete or anonymize anything keyed to the customer
   (inquiries that reference the email, media uploaded by the account if any).
4. **Backups**: note that nightly `pg_dump` archives (see §5) retain the data
   until their retention window expires; erasure is complete when the last
   backup containing the row rotates out. Record the date in `notes`.
5. Set `status: completed`, add `notes` with what was erased where and when.
6. Confirm to the customer by email (SUPPORT_EMAIL) that erasure is complete.

The storefront UI states this timeline honestly ("recorded and reviewed,
erased within 30 days at most") — never claim instant deletion.

---

## 9. Known operational risks (open, not hidden)

- **F-72** — when Postgres is unreachable, Payload's init emits
  `⨯ unhandledRejection: undefined` on both storefront and admin routes. Next
  contains it (logs, does not crash) but Node's default is to terminate on
  unhandled rejections, so this is a latent process-kill risk. Source is inside
  `@payloadcms/next` (app code awaits `getPayload()` in a `try/catch`); the
  decision between failing fast at boot and adding a structured handler is
  recorded in the register and belongs with the F-65/F-72 follow-up.
- **F-69** — CI is complete (`.github/workflows/ci.yml`: build + typecheck +
  lint + env drift + unit + e2e + browser probe). **CD is not**: there is no
  automated deploy, staging promotion, rollback, or alerting. Deploys are
  manual today.
- **F-44** — production TLS/HTTPS URLs are a deploy-time responsibility; nothing
  in the repo asserts them. `upgrade-insecure-requests` assumes the edge
  terminates TLS.
