# Security / reliability changes and remaining release gates

Date: 2026-10-15. Implementation follows the independent review; no PR #4 merge or production deployment was performed.

## Implemented

### Dependency tree

- Next / eslint-config-next: **16.4.1**.
- Payload packages: aligned to **3.90.2**.
- Vendure packages / CLI: aligned to **3.8.0**.
- Serwist Turbopack: **9.5.13**, production dependency because Next config / worker route need it at runtime.
- shadcn CLI moved to development dependencies. Runtime generated CSS is built before pruning.
- Scoped Payload `undici` patch override to **7.29.1**, replacing its exact vulnerable 7.29.0 pin; no broad cross-major overrides.
- Fresh peer-compatible resolution, reproducible `npm ci`, no `--force` / `--legacy-peer-deps`. Added root dev `yaml` 2.x declaration to resolve npm's hoisting/lock validation conflict while retaining nested YAML 1.x consumers.

Measured production audit: **25 findings: 0 critical, 16 high, 7 moderate, 2 low**. Baseline production audit was 57 findings including 6 critical. This is a reduction, NOT a clean audit or proof that every advisory is exploitable in the storefront.

Remaining findings include inherited GraphQL Tools, braces / chokidar / sass, CSV parser, Nodemailer, RE2 and build/admin tooling chains. Some npm suggestions downgrade the entire framework or cross major API boundaries. Those were not blindly applied. See audit evidence for the exact tree and advisories; live release still needs explicit remediation / risk acceptance.

### Docker / operational configuration

- Named `builder` stage fixes the invalid `COPY --from=builder` reference.
- Required BuildKit secrets replace `ARG` / persistent `ENV` for DB and Payload secrets. A reachable seeded catalog DB is still required for a real production build.
- Runner is Node 22 slim, non-root, production-pruned, with a health check. Upload storage must be mounted persistently; runtime credentials are injected by the deployment system.
- Exclude diagnostic artifacts, environment files and generated email files from build context.
- Not container-tested here: Docker daemon and a live seeded DB were unavailable. Source correction is not a successful container smoke test.

### Commerce integrity / schema

- Live price resolution cannot be overwritten by the editorial mock bridge. Repository-level regression tests exercise the actual mapped product, not only the helper.
- Structured-data offers exist only for `live` prices; do not infer inventory from editorial `active`, or claim every manufacturer is Alfasigma.
- Escape script-delimiter characters in PDP JSON-LD.
- Design preview mutations fail closed; no fake payment / contact / signup success.
- Checkout validates malformed input and payment / fulfillment enum values. Client passes its reviewed total; server rejects repricing before arranging payment or adding payment. A new review is required after prices/shipping change.
- Anonymous cart reads do not make a meaningless backend request; existing session outages remain a distinct unavailable state.
- Protected account reads now throw to recovery UI on backend outages instead of showing empty addresses or treating a service outage as an expired account. Public header may degrade independently.

### PWA privacy

- Documents, RSC, APIs, admin routes and every unspecified request are NetworkOnly. No default HTML runtime cache.
- Cache only hashed Next static files and explicitly allowlisted public media. Image-optimizer paths must point at those public media paths.
- Remove legacy Serwist document / RSC caches during activation and again on logout.
- Offline fallback is neutral `/offline`; no stale account, checkout or confirmation HTML. Its bilingual copy explicitly explains the privacy boundary. Precache is restricted to fallback/CSS/logo, not every product photograph/PDF/admin script. Revision changes even on uncommitted preview builds.
- Native service-worker registration is optional enhancement. Blocked storage / registration cannot crash the React tree.
- Logout does a full reload after local token removal and cache cleanup to avoid stale client-router personal state.

### Recovery / errors / abuse

- SSR skip link, localized route error boundary with Next 16 `retry`, standalone bilingual root-error fallback.
- Rejected wishlist loads are recoverable, slug requests are validated/deduplicated/bounded to 50, and cross-tab storage updates propagate.
- Address delete checks the server result; network failures no longer silently look successful.
- Add-to-cart, login, registration, profile, address, contact and checkout client actions recover from rejected transports rather than leaving pending controls stuck.
- Proxy headers are trusted only through explicit overwrite-header / trusted-hop configuration. Default is conservative shared `unknown`, not attacker-controlled leftmost XFF.
- In-memory limiter has expired-key cleanup and a 10,000-key ceiling; at capacity it rejects new keys instead of evicting active counters. **It is not a distributed limiter.**
- Payload user collection explicitly restricts management to authenticated admins and sets lockout / token / cookie policy. This is not a full role hierarchy; existing collection is the admin user store, not public customer signup.
- Storefront bearer cookie lifetime reduced to 30 days; this does not by itself invalidate server-side sessions.
- Public CSP is **report-only**, not falsely represented as enforced. Maps are allowed and Payload admin is excluded. Framing header remains enforced normally, omitted only in explicit preview to support the Arena iframe.

### Password reset / SMTP

- New localized `/forgot-password` and `/reset-password` pages, login recovery link, request / confirm server actions and privacy-preserving generic acknowledgement.
- Reset routes noindex; no-referrer / no-store policy; tokens are not retained by the language switcher. Clear the query token after successful reset.
- `PASSWORD_RESET_ENABLED=true` is an explicit storefront gate, set ONLY after deployed SMTP delivery + expiry/replay tests. Default / design preview shows an honest unavailable state with contact route.
- Vendure uses real TLS SMTP only with `VENDURE_EMAIL_ENABLED=true` plus complete credentials and HTTPS storefront URL. Invalid enabled configuration fails startup. Dev mailbox requires both dev environment and explicit `EMAIL_DEV_MAILBOX=true`; generated messages live under `.cache/vendure-emails`, not the legacy web-served static directory.
- No live messages were sent. Credentials were not requested or invented. Email verification remains disabled until a separately implemented/tested verification flow exists; SMTP support alone does not justify enabling it.

## Before customer-facing release (still open)

1. Supply isolated seeded Payload + Vendure test infrastructure. Run real catalog/pricing, anonymous/authenticated cart, stock, shipping, repricing, duplicate submission, COD/bank-transfer, confirmation ownership, account address/delete/reorder and logout acceptance tests.
2. Validate Vendure backend migrations/bootstrap, including the previously reported DB-init / placeOrder issue. A mocked action test cannot close that defect.
3. Verify actual SMTP delivery, domain authentication, generic enumeration behavior, expired/invalid/replayed tokens and session invalidation; then enable recovery. Do not point verification links at an unimplemented route.
4. Build/run the container with mounted secrets and persistent uploads; inspect image history/config and verify startup with production-only dependencies.
5. Resolve / explicitly accept the remaining dependency advisories. Enforce a tested nonce/hash CSP after report-only observation. Configure shared/edge rate limiting and the correct proxy trust boundary.
6. Approve design and clinical/legal copy; perform keyboard + real screen-reader review, mobile-device testing, privacy/consent review and real-user performance measurement.
7. Keep both preview/mock flags OFF in real production. Rebuild against real data and rerun CI; the preview is not a deployed production release.
