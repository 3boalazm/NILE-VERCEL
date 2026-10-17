# NPF Testing — Unified Defect Register (F-01 … F-71)

**Project:** NPF — Nile Pharma Food. **Register date:** 2026-09-21. **Branch:** `arena/01a0c301-npf`.
**Scope:** all defects filed across the 23 signed results files (`docs/testing/results/01..23-*.md`) — **71 findings**, plus **F-72** filed during wave-1 verification (2026-09-22) = **72 total**.
**Severity guide:** High = user-visible break of core flows/trust · Medium = quality/compliance gap affecting UX, SEO, or operations · Low = polish · Info = advisory.

| ID | Severity | Area | Summary | Evidence | Fix sketch | Result |
|---|---|---|---|---|---|---|
| **F-01** | **High** | Catalog | Products render with `sku:null`/`#P091`-style placeholders on listing | Report 01 FT-PL-001 | Map real SKU from Vendure; hide empty | 01 |
| **F-02** | **High** | Error handling | No `error.tsx`/`global-error.tsx` anywhere — render errors = browser dead-end | `find src/app -name "error.tsx"` → empty | Add App Router error + global-error + 500 page | 01 |
| **F-03** | **High** | Payments/Copy | Gateway buttons "الدفع بالبطاقة/فودافون كاش" exist while backend is `manual-settlement`; trust copy "بوابة الدفع آمنة" is misleading | `cart/actions.ts:32`; PDP button names ≠ section names | Rename to bank transfer/manual, or integrate gateway; fix copy | 01 |
| **F-04** | **High** | Auth | No password-reset / forgot-password flow at all | 404 on reset routes; no mailer (F-52) | Add reset token flow + mailer | 01 |
| **F-05** | **High** | Content | 5/8 content pages render EMPTY shells (`/contact`, `/careers`, `/shipping-delivery`, `/quality-sourcing`, `/story`) | Report 01 empty-page matrix (twice) | Populate CMS content/blocks | 01 |
| F-06 | Medium | UX consistency | Button-name inconsistencies across surfaces (same action, different names) | Report 01 (note) | Unify labels via dictionary | 01 |
| F-07 | Medium | Auth | Login `?redirect=` parameter dropped → always `/ar/account` | Report 01/04 | Honor redirect param | 01 |
| F-08 | Medium | Docs/Nav | `DECISIONS.md`/`TODO.md` absent (spec claims them); hash → `/` double-redirect | Repo root check | Create docs; fix redirect rule | 01 |
| F-09 | Medium | DX | `graphql-playground` 404 in prod | Report 01 | Enable in dev docs or vendor GraphiQL | 01 |
| F-10 | Medium | Forms | Form fields clear on failed submit (contact/login/register/checkout/addr) | Report 01 (note) | Preserve values on error | 01 |
| F-11 | Medium | Build/DX | Build succeeds only with workarounds: no `npm audit` non-zero policy, `gitleaks` false-positives, **no env-var validation**, `NODE_ENV` quirk, **security headers/CSP incomplete** | Reports 03/08/10 | Env validation (zod), headers in next.config/middleware, CSP | 01 |
| F-12 | Medium | Hydration | Pre-hydration clicks (<2s) lost on Home CTAs | Report 01 FT-GEN | Faster hydration or native links-first | 01 |
| F-13 | Low | Content | Article page TOC ("المحتويات") renders empty | Report 01 FT-BLOG-002 | Generate TOC from headings | 01 |
| F-14 | Medium | PWA | Offline document fallback lands at `/ar` home (not `/offline`); cold offline = `chrome-error://` | offline-probe.txt | Serwist fallbacks config fix | 01 |
| F-15 | Info | Security | Rate limits (5 reg/hr, 10 login/10min) effective but undocumented + UX-unhelpful | Report 01 (note) | Document + friendly throttle copy | 01 |
| F-16 | Low | Landing | Landing hero/guarantees placeholder content (`01`-style numbers) | Report 02 | Real content/CMS fields | 02 |
| F-17 | Medium | Checkout | 5 sub-defects: terms/submit gate UX, governorate TEXT input, sparse summary, copy inconsistencies, error surfacing | Report 02 | See report for the 5 fixes | 02 |
| F-18 | Medium | Compliance | Cookie-consent banner missing (privacy policy exists but no consent gate) | Report 02/04/09/13 | Add consent + wire analytics gate (F-70) | 02 |
| F-19 | Medium | Auth | Register lacks confirm-password + password-strength meter | Report 02 | Add both | 02 |
| F-20 | Low | Wishlist | Wishlist local-only (localStorage), not account-backed | Report 02 | Sync to Vendure customer | 02 |
| F-21 | Low | Code hygiene | `/lab/hero-abstract` WebGL + polyfills orphaned (unused in prod) | Report 03/04 | Remove or productize | 03 |
| F-22 | Low | Code hygiene | `skeleton.tsx` defined but unused (no loading states use it) | Report 04 | Wire into Suspense/loaders | 03 |
| F-23 | Low | Trust | No social media links/icons despite social copy | Report 04 | Add or remove copy | 03 |
| F-24 | Medium | Catalog | No category filtering/sort on listing (facets API-ready) | Report 04 | Build filter UI | 03 |
| F-25 | Low | Content | Article sort options hardcoded (non-functional) | Report 04 | Wire to API or remove | 03 |
| F-26 | Medium | Content | Article images generic/placeholder | Report 04 | Real imagery | 03 |
| F-27 | Medium | Responsive | Home hero overflow at 1280–1439px | nav-probes (retested 3×) | Fluid type/width | 04 |
| F-28 | Low | A11y | Carousel nav buttons lack distinct names | Report 05 | `aria-label` prev/next | 04 |
| F-29 | Medium | Responsive | EN two-column overflow (`hero-abstract`) | Report 05 | Grid fix | 04 |
| F-30 | Medium | A11y/Mobile | Touch targets < 44px (20px text links etc.) | Report 05/11 | Hit-area fix | 04 |
| F-31 | Low | RTL/UX | Wishlist heart icon hardcoded dark → poor contrast on dark hero | Report 05 | Theme-aware icon | 04 |
| F-32 | Medium | Responsive | Modal/dialog overflow at 320–360px | Report 05 | Max-width + scroll | 04 |
| F-33 | Low | PWA | Manifest icons lack `purpose: maskable` | assets-pwa.txt | Add maskable icon | 04 |
| **F-34** | **High** | A11y | No skip link ("تجاوز إلى المحتوى") | Report 05 | Add skip-to-content | 04 |
| F-35 | Medium | A11y | Tab/step semantics non-conformant | Report 05 | Correct roles | 04 |
| F-36 | Medium | A11y | `ink-500` text + primary buttons fail 4.5:1 contrast | Report 05/06 | Darken tokens | 04 |
| F-37 | Medium | A11y | Icon-button accessible names missing (5 nav items) | nav-probes.txt | `aria-label` | 04 |
| F-38 | Medium | A11y | Landmark/heading order issues (h1→h3 jumps) | Report 05 | Restructure headings | 04 |
| F-39 | Low | A11y | No `fieldset`/`legend` around radio groups (shipping/payment) | Report 05 | Add fieldsets | 04 |
| F-40 | Medium | Performance | Mobile LCP 6.7s (CLS .216 on home) vs desktop 1.1s | lh-home.json | Critical CSS/hero image | 05 |
| F-41 | Medium | Performance | TTFB 220–270ms + render-blocking chains | Report 06 | Cache/ISR + defer | 05 |
| F-42 | Medium | Performance | 737KB single chunk + 2.5MB total JS on first load | Report 06 | Code-split vendor | 05 |
| F-43 | Low | Performance | `static-cache`/`stale-while-revalidate` header advisories | Report 06 | Tune cache headers | 05 |
| F-44 | Low | Deploy | SSL env reported "none" in local env | Report 06/08 | Wire real TLS envs | 05 |
| F-45 | Medium | SEO/Social | Home canonical missing + `og:url`/`og:image` missing (share previews bare) | seo-audit.mjs | Complete OG+canonical | 05 |
| F-46 | Medium | SEO | `robots` meta inconsistency + `not-found.xml` missing | seo-audit.mjs | Fix meta + add file | 05 |
| F-47 | Low | SEO | Duplicate content paths (trailing-slash/locale variants) | seo-audit.mjs | Canonicalize | 05 |
| F-48 | Low | SEO | `admin/[[...segments]]` has thin robots handling | seo-audit.mjs | noindex admin | 05 |
| F-49 | Medium | Trust | Legacy social links in content → 404 | Report 07 | Fix/remove | 06 |
| F-50 | Low | A11y | Empty `alt` + iframe without `title` | Report 07 | Fill attributes | 06 |
| F-51 | Low | A11y | 2× inline SVG strokes < 3:1 contrast | Report 07 | Darken strokes | 06 |
| F-52 | Medium | Auth/Comms | No email verification, reset mails, or message system | Report 08 | Mailer integration | 07 |
| F-53 | Medium | Data/Ops | No CSV export / account data export / **DB backup tooling** | Report 08/09 | `pg_dump` cron + exports | 07 |
| F-54 | Medium | API errors | Malformed GraphQL/DB id → 500 (should be 400/404) | api-probes.txt | Guard IDs | 07 |
| F-55 | Low | Security test | IDOR probes mis-mapped (404s) — fix probe expectations | api-probes.txt | Correct probe map | 07 |
| F-56 | Medium | Auth | 1-year sessions + weak password policy | Report 08 | Shorten + enforce policy | 07 |
| F-57 | Medium | Security | Vendure admin: `X-Powered-By` disclosure + weak passwords + debug headers | Report 08 | Harden config | 07 |
| F-58 | Low | Privacy | No account deletion (GDPR erasure) | Report 08 | Add delete flow | 07 |
| F-59 | Medium | Forms | Hard-coded maxLengths (120/254/40/160/200/2000) with random generator + no "show password" | forms-probes.txt | Centralize + consistent UI | 08 |
| F-60 | Medium | UX | POST-redirect-GET missing (duplicate-submit risk) | Report 10 | PRG pattern | 08 |
| F-61 | Medium | A11y/Forms | `aria-invalid`/`aria-describedby`/error `id` missing on fields | forms-probes.txt | Wire ARIA | 08 |
| F-62 | Low | A11y | No `aria-current` on active nav | Report 11 | Add | 09 |
| F-63 | Medium | Account | No change-password UI/API anywhere in `src` | grep ground truth | Add profile section | 09 |
| F-64 | Medium | Reliability | Silent failure on network-drop submit (no message, no retry state) | offline-probe.txt | Catch + surface (F-02 family) | 09 |
| F-65 | Low | Observability | No client error pipeline (Sentry etc.) — console only | Report 13 | Add Sentry/OTEL | 10 |
| F-66 | Medium | Performance | Font delivery: 36 requests / 803KB raw OTF+TTF + no preload | Report 14 | `next/font` self-host subset + preload | 11 |
| F-67 | Low | Media | No `onError` fallbacks + AVIF not enabled + title attrs + blur placeholder | Report 14 | next/image config + handlers | 11 |
| F-68 | Low | PWA/Meta | No `theme-color`/`apple-mobile-web-app` meta; `start_url` hardcoded `/ar` | Report 15 | Add metas; locale-aware start_url | 12 |
| F-69 | Medium | **Delivery/DevOps** | **Delivery pipeline partial (corrected 2026-09-21):** CI (build+unit+e2e) + production Dockerfile EXIST in baseline (PR #3, `arena/01a0c0e1-npf`) — gap is the CD half: no deploy job/target, no staging/prod envs, no rollback tooling, no IaC, no monitoring/alerting | Report 16 + CORRECTION | CD job (registry+deploy+health check), staging env, alerting | 13 |
| F-70 | Medium | **Analytics** | **No analytics layer at all** — no GA4/GTM/dataLayer; 0 e-commerce events, no UTM/conversions | grep = 0 hits (Report 20) | GA4 + dataLayer + consent-gated | 14 |
| F-71 | Low | Load/Ops | DB pool & server connection limits left at defaults; no load telemetry | Report 22 | Size pools + metrics | 15 |
| **F-72** | Medium | Reliability | **NEW (2026-09-22, wave-1 verification):** an unreachable Postgres makes Payload's init emit `⨯ unhandledRejection: undefined` — including on storefront routes that otherwise degrade cleanly | Server log, `GET /ar` **and** `GET /admin` with Postgres down: two `⨯ unhandledRejection: undefined` events (reason is literally `undefined`). `/ar` still answers **200** via `MOCK_CATALOG_FALLBACK`; `/admin` answers **500** and renders the global-error boundary (F-02b PASS) | Not our code: `payload-repository.ts` awaits `getPayload({ config })` inside `try/catch`, so the floating promise originates inside Payload's init. Mitigations: fail fast at boot rather than per-request, or a structured `process.on('unhandledRejection')` in `instrumentation.ts` — the latter risks masking genuine bugs, so it needs a deliberate decision (adjacent to F-65) | this file |

## Corrections Log

- **2026-09-22 (wave 1)** — **F-72 filed (new defect, not in any of the 23 reports).** Found while gathering F-02b evidence: an unreachable Postgres produces `⨯ unhandledRejection: undefined` in the server log on *both* `/ar` and `/admin`. The 23-report suite never captured it (grep for `unhandledRejection` across `docs/testing/` = 0 hits before this entry), because the storefront still returns 200 and the admin failure was only inspected via HTTP status, not via the server log.
- **2026-09-22 (wave 1)** — **F-01, F-03 and F-05 were already FIXED before any wave-1 code was written.** A baseline `verify-fixes.mjs` run against `master` (`9025fa5`) + the testing bundle returned `F-01 FIXED / F-03 FIXED / F-05 FIXED` (13 FIXED / 30 OPEN overall). Ground truth confirms it: no `#P0xx` generator exists in `src/` and the PDP already guards with `{product.sku && …}` (F-01); the strings «الدفع بالبطاقة»/«فودافون»/«بوابة الدفع آمنة» return **zero** grep hits in `src/` and the real methods are `cod` + `bank_transfer` (F-03); all five content pages render real dictionary content, matching this register's own source — `results/01` FT-STATIC-001..007 was signed ✅ "200 with localized content" (F-05). The register rows were carried over from a pre-PR#3 state. **Retained as documentation of what was checked; do not re-fix.**
- **2026-09-22 (wave 1)** — **F-34's automated check was mis-calibrated (harness bug, not a product bug).** The v2 check scanned a fixed 3000-character prefix of the document, but this app's `<head>` alone is ~5.1KB (two nine-width hero-image preload hints + full OG/Twitter metadata), so `<body>` begins at ~5.1k and a correctly-placed skip link could never fall inside the window — the check would report OPEN forever. Recalibrated to **v3**: anchored at `<body>`, and now *stricter* than v2 (it additionally verifies the target `id` exists and that the link precedes `header`/`nav`/`main`, which v2 never checked). Independently confirmed from rendered HTML: the first focusable element in `<body>` is `<a href="#main-content" class="sr-only …">تجاوز إلى المحتوى</a>`.
- **2026-09-21** — `scripts/verify-fixes.mjs` calibration caught a false audit in Report 16: `.github/workflows/ci.yml`, `Dockerfile`, 5 vitest suites and 3 e2e specs exist in baseline `9025fa5`. Report 16 revised (54/22/0/33), Report 21 REG-AUTO revised (✅/✅), **F-69 rewritten** (Medium retained — CD/monitoring/rollback/IaC/staging still missing).

## Severity Roll-Up

| Severity | Count | IDs |
|---|---:|---|
| **High** | 5 | F-01, F-02, F-03, F-04, F-05, F-34 → **6** |
| **Medium** | 42 | F-06..F-12, F-14, F-17..F-19, F-24, F-26..F-27, F-29..F-30, F-32, F-35..F-38, F-40..F-42, F-45..F-46, F-49, F-52..F-54, F-56..F-57, F-59..F-61, F-63..F-64, F-66, F-69..F-70, **F-72** |
| **Low** | 21 | F-13, F-16, F-20..F-23, F-25, F-28, F-31, F-33, F-39, F-43..F-44, F-47..F-48, F-50..F-51, F-55, F-58, F-62, F-65, F-67..F-68, F-71 |
| **Info** | 1 | F-15 |

*(High row lists 6 IDs — F-34 is High per Report 05 sign-off.)*

## Launch-Blocking Shortlist (fix first)

| # | Defect | Status 2026-09-22 |
|---|---|---|
| 1 | **F-05** — 5 empty content pages | ✅ **already fixed** in baseline (see Corrections Log) |
| 2 | **F-03** — misleading payment copy vs `manual-settlement` | ✅ **already fixed** in baseline (see Corrections Log) |
| 3 | **F-01** — SKU placeholders in catalog | ✅ **already fixed** in baseline (see Corrections Log) |
| 4 | **F-02 + F-64** — `error.tsx`/`global-error.tsx` + network-error surfacing | ✅ **fixed + browser-verified this wave** — script F-02 FIXED; F-02b and F-64 PASS in real Chromium (see probe below) |
| 5 | **F-04 + F-52** — password reset + mailer | ✅ **fixed this wave** — script F-04 FIXED, F-52 FIXED (`nodemailer` dep + 11 flow markers) |
| 6 | **F-34** — skip link | ✅ **fixed this wave** — script F-34 FIXED + first-focusable confirmed from rendered HTML |
| 7 | **F-69 + F-53** — pipeline + backups before any real deploy | ✅ wave 2: F-53 backup tooling shipped (`scripts/backup-db.sh` + OPS runbook); F-69 CI half FIXED, **CD half still open** (see §8 risks) |
| 8 | **F-45 + F-70 + F-18** — share previews, analytics, consent | ✅ wave 2: canonical+og:url+og:image shipped; real consent banner + consent-gated GA4 with e-commerce events; **F-18's earlier "FIXED" was a false positive, now genuinely fixed** |

**Wave 1 harness result: 18 FIXED / 25 OPEN / 2 MANUAL** (was 13 / 30 / 2). Incidental closure: **F-61** (aria-invalid/aria-describedby) came along with the new forms' ARIA wiring — it is a wave-2 item, now FIXED.

**Wave 1 browser verification — CLOSED (`scripts/probe-manual-checks.mjs`, 5/5 PASS, Chromium 153; wave-1 work = PR #4, commits `6bdb837` + `37de816`):**

| Probe | Result | Evidence |
|---|---|---|
| F-34 focus order | ✅ PASS | first `Tab` → `<A href="#main-content"> "تجاوز إلى المحتوى"`; `Enter` → `document.activeElement.id === "main-content"` |
| F-02b render error | ✅ PASS | `/admin` throws for real (Payload cannot reach Postgres) → HTTP 500 renders the styled boundary with a recovery control; no dead-end, no `chrome-error://` |
| F-64 login | ✅ PASS | offline submit → message shown, `role="alert"` present, submit button re-enabled |
| F-64 forgot-password | ✅ PASS | same three assertions |
| F-64 contact | ✅ PASS | same three assertions |

Environment note: `npx playwright install` cannot reach `storage.googleapis.com`, but `@sparticuz/chromium`'s bytes are vendored locally — the probe extracts the NSS/NSPR libraries from `bin/al2023.tar.br` to `/tmp/al2023` itself and passes them via `LD_LIBRARY_PATH`.

**Still genuinely unverified:** F-64 on checkout `placeOrder` needs a cart with items, which needs a running Vendure. The catch path is code-reviewed and type-checked, and the cart is deliberately not cleared on failure, but the offline probe should be re-run against a full stack before sign-off.

---

## Wave 2 verification — CLOSED (2026-09-22, branch `arena/01a0c5d4-npf`)

**Harness: 43 FIXED / 0 OPEN / 2 MANUAL** (F-54, F-57 need a live Vendure; both
are Vendure-hardening checks, not storefront code). **Browser probe: 15/15
PASS** (`scripts/probe-manual-checks.mjs`, now 15 probes). **Unit: 143/143.
e2e: 21 passed / 1 env-skipped** (contact persistence needs Postgres; the test
now skips itself with a reason on DB-less machines, same pattern as
commerce.spec's Vendure gate).

Wave-2 items closed this wave: F-11, F-45, F-46, F-53, F-56, F-65, F-69-CI-half,
F-70, F-71 (batch A) · F-33, F-45, F-46, F-66, F-67, F-68, F-73-root-cause
(batch B) · F-13, F-17, F-18, F-19, F-21, F-22, F-23, F-25, F-39, F-58, F-59,
F-62, F-63 (batch C). Notes that matter for future readers:

- **F-18 was a FALSE POSITIVE before this wave.** The harness matched the word
  "موافقة" inside privacy-policy *copy*, not a consent gate — no banner existed.
  A real consent banner now ships (`cookie-consent-banner.tsx`, equal-weight
  accept/reject, `npf-consent` cookie) and gates F-70's analytics. The probe
  asserts: banner pre-consent, zero third-party scripts pre-consent, cookie +
  bootstrap + queued `view_item` post-consent.
- **F-46's harness check was recalibrated** (like F-09/F-71 before it): it
  demanded `GET /not-found.xml` → **200**, i.e. a soft 404 — the exact SEO
  defect report 07 warns about. It now demands a real **404** + the site's own
  branded error document, which is the register's actual intent ("a custom 404
  exists"). Comment in `verify-fixes.mjs` records why.
- **F-73 (new, filed this wave):** with the root layout nested under
  `[locale]`, `notFound()` thrown **from the root layout** (invalid locale
  param, e.g. `/whatever.jpg` where `[locale]="whatever.jpg"`) has no layout
  above it to render into → Next served the empty `__next_error__` shell: a
  blank page with a 404 status for every JS-free client. Fixed twice over:
  (1) the layout no longer throws — every page validates its own locale and
  throws at page level, rendering the branded `[locale]/not-found.tsx` inside
  the layout; (2) `app/global-not-found.tsx` + `experimental.globalNotFound`
  covers whatever still falls outside all segments. Probe asserts 404 + branded
  copy with JavaScript disabled.
- **F-66 fonts:** 9 raw TTF/OTF (143 KB) converted to WOFF2 (80 KB, −44%) with
  fontTools, originals preserved in `assets/fonts-source/`. **Licensing finding
  filed:** KO Banzeen embeds "free typeface — don't redistribute or re-sell
  (© 2024 Protype Foundry)" and Glora embeds **no** licence at all; both were
  missing from `LICENSES.md`. Conversion changes nothing legally (same files,
  smaller); the redistribution question (public repo vs "don't redistribute")
  is a business decision, documented in `src/app/fonts/LICENSES.md` and here so
  it cannot be lost.
- **F-23 social links use the company's own published profiles** (live-site
  `sameAs`: facebook.com/NPFEG, instagram.com/npf.eg; LinkedIn company page
  verified live). Report 20's older handles came from the legacy WordPress
  install — do not "restore" them.
- **F-25:** the register row ("article sort hard-coded") is stale — the blogs
  page was rebuilt as an empty state with no sort control. The harness checks
  the *products* listing, which had server-side sorting but no UI; a real
  GET-form sort control now ships (works without JS; probe proves re-ordering).
- **F-13:** article template + **generated** TOC shipped; content source is a
  seam (`src/lib/blog/articles.ts`) returning `[]` in production per the
  verified-only-content rule ("no fake blog"). `MOCK_BLOG_FALLBACK=1` serves a
  watermarked, noindexed SAMPLE article so the template/TOC are verifiable in
  dev/CI — same pattern as `MOCK_CATALOG_FALLBACK`.
- **F-58:** Vendure's shop API exposes no customer-delete mutation, so the
  storefront ships an honest GDPR **intake**: authenticated, rate-limited
  request recorded in the Payload `erasure-requests` collection, ops SOP in
  `docs/OPS.md` §7 (≤30 days). The UI says exactly that — no fake "deleted".
- **F-59:** all length limits centralized in `src/lib/forms/field-limits.ts`
  (client maxLength and server validation read the same map); shared
  show/hide password component across login/register/reset/change-password.
- **F-17:** governorate is now a 27-option select (closed list = no typo
  addresses); the other four sub-fixes shipped too (submit-gate explanation,
  enriched summary with unit prices + fulfillment line, copy unification —
  one term for الاستلام/Delivery method everywhere, error surfacing as
  `role="alert"` boxes).

## Wave 3 verification — CLOSED (2026-09-22, branch `arena/01a0c5d4-npf`)

**Battery:** verify-fixes `43 FIXED / 0 OPEN / 2 deferred-to-MANUAL` (unchanged rows F-54/F-57 stay MANUAL only because the harness wants a live Vendure) · probes **20/20 PASS** (`scripts/probe-manual-checks.mjs`, +5 new probe blocks) · unit **154/154** (17 files, +11: F-72 ×3, F-57 ×1, F-54 ×2 suites) · e2e **37 passed / 3 env-skipped** (narrow +8, offline +1, smoke contact +reload check) · check-env zero drift.

### Decisions
- **F-72 — RESOLVED (Option B, documented):** `src/instrumentation.ts` registers a process-level `unhandledRejection` handler. Fail-fast rejected with rationale: Postgres-down degrades cleanly today (`/ar` serves via MOCK_CATALOG_FALLBACK); killing the process turns graceful degradation into a full outage. Masking risk countered: every event flows through the F-65 structured log/report pipeline with the rejection's identity (`reasonType`/message/stack); the Payload-init `undefined` quirk is named explicitly. 3 unit tests (never-throws incl. `undefined`, structured log, identity preserved).
- **Valid-shape-but-missing PDP slug = soft-404, accepted & documented:** because `products/` ships a loading skeleton, Next streams the shell (HTTP 200) before any page-level `notFound()` can set the status — the user still gets the branded `[locale]/not-found.tsx` inline, and crawlers get `noindex` metadata. The **malformed**-slug class (the actual F-54 security defect) gets a REAL 404 from the proxy layer, below.

### Fixes
- **F-54 (3 layers):** `src/lib/validation/identifiers.ts` (`isValidSlug`/`isValidOrderCode`, linear-time bounded regexes) → guards in `payload-repository.getProductBySlug` (null, never a DB round-trip) and `vendure.readOrderByCode` (null → empty state; the account page's auth redirect already fronts it); `products/[slug]` `generateMetadata` throws `notFound()` for missing products; `src/proxy.ts` returns a real 404 with a branded, self-contained HTML document (same wording as global-not-found) for any slug failing the shape check — quotes, SQL fragments, traversal, braces. Probe: all 4 hostile shapes → 404; valid slug → 200.
- **F-57:** zod `superRefine` on `vendureEnvSchema` — outside `APP_ENV=dev` the super-admin password must be 12+ chars with all four character classes (the 8-char floor alone would still allow borderline prod secrets); Vendure `middleware` strips `X-Powered-By` on both APIs. Harness row stays MANUAL until Vendure boots (needs live server), code-level tests pass.
- **F-14 (root cause fixed):** Serwist `fallbacks` only fire when a ROUTE throws — there was no documents route, so the offline fallback was dead code and the /offline page's promise ("pages you visited stay available") was false advertising. Added a same-origin `request.mode === "navigate"` NetworkFirst route (3s network timeout, 200-only caching) ahead of `defaultCache`; the NetworkOnly rule still carves out cart/checkout/admin/API first. Proven by a real e2e: SW active → `setOffline(true)` → navigate to a never-visited page → branded /offline renders.
- **F-32/F-27 (new `e2e/narrow.spec.ts`):** 320×640 — no horizontal overflow on 7 no-Vendure pages, the header menu sheet stays inside the viewport and doesn't widen the document (found + handled: two triggers share the label at 320px — header + bottom tab bar; also the consent banner is a second `role="dialog"`, so locators are name-scoped); plus F-27's 1280px/1439px band on /ar+/en home+products (8 checks, all clean).
- **F-35/36/38 (new axe probe block, `axe-core` devDependency):** 0 violations across /ar, /ar/products, PDP, /ar/register, /ar/contact for color-contrast, heading-order, tab aria structure (aria-required-children/parent) and landmark-unique — **after three real fixes the probe caught**: brand-marquee text 3.12:1 (`/70` opacity → full tone ≈5.8:1); the marquee's overlay edge-fades caused nondeterministic contrast failures → replaced with a `mask-image` on the track (identical visual, no overlay to slip under); product-card availableForm at 12px was 4.03:1 (`/80` → full ≈6.3:1); every `<nav>` now has a distinct accessible name (footer columns = their titles, legal links, both drawers).
- **F-40/41/42 (measured, not assumed):** `priority` on the first product-grid card and first shop-by-need tile (the mobile LCP candidates) + `optimizePackageImports: ["lucide-react"]`; probe measures real mobile LCP/CLS (288–332ms / 0.000); TTFB on /ar ≈ 45ms (< 200ms); largest first-load chunk 236KB (< 300KB), worst page total 606KB (< 1MB) — Next 16 no longer prints the size table, so the probe/measurement scripts are the source of truth.
- **F-12 (probe):** home hero CTA is a native `<a href>` in the SSR HTML, no `role="link"` divs — works pre-hydration and without JS.
- **F-60:** structurally satisfied — the contact form posts through a fetch-based server action (no document POST to replay) with an in-flight/done guard; smoke e2e now also reloads after success and asserts a fresh, empty form (runs in CI with Postgres; skips with a reason here).
- **F-29:** stale/n-a — `hero-abstract` was deleted outright in Wave 2; the 1280–1439 checks now guard the real hero.
- **F-24:** already FIXED by the harness (filter UI present); no work this wave.

### Honest residuals
- Lighthouse a11y *score* (F-36's literal gate) is not runnable in this sandbox (no chrome-launcher/Lighthouse); axe's color-contrast + structure rules on 5 pages pass with 0 violations, which is the substance of the check. CI (full Chrome) can add a Lighthouse job if wanted.
- F-50b remains n-a-until-CMS: there are no CMS-rendered content-block iframes yet.
- Probe robustness note: the F-19 meter probe waits for hydration before filling (controlled input — a pre-hydration fill is reverted on hydration and would false-fail on cold servers).

## Wave 4 verification — CLOSED (2026-09-22, branch `arena/01a0c5d4-npf`)

**Battery:** verify-fixes `43 FIXED / 0 OPEN / 2 deferred-to-MANUAL` · probes **25/25 PASS** (+5 HTTP probe blocks for the wave-4 findings) · unit **169/169** (20 files, +15: F-06 ×6, F-20 ×9) · e2e **38 passed / 3 env-skipped** · check-env zero drift · lint clean.

### Fixes / closures
- **F-20 (the one real feature of the wave) — wishlist is now account-backed:** browser-local list stays the UI source of truth; a new Payload `Wishlists` collection (one doc per Vendure customer, server-action-only writes after session verification, slugs re-validated with the F-54 guard and capped at 200) mirrors it. Reconciliation = pull → merge (union, local first) → push, at login/registration and on wishlist-page mounts; edits made on the wishlist page push immediately when signed in so removals propagate. Anonymous visitors: everything no-ops (probe-grade gating covered by unit tests: anonymous push/pull never touch Payload; sanitization drops tampered slugs; Payload outage degrades to local-only with a warning, never throws). Accepted trade-off documented (DECISIONS.md + collection docs): sync points are login/wishlist-visit, not every heart-click — a device that toggles without visiting the wishlist can shadow another device's change.
- **F-06:** label-drift contract pinned by unit tests (both locales): cart vs order-confirmation "continue shopping", cart CTA names the checkout noun, shipping vs confirmation "contact us".
- **F-08 remainder (hash → double-redirect):** verified fixed live — `/#/products` performs exactly ONE 307 hop to `/ar` (the old double-hop was the scaffold's middleware chain; the single proxy replaced it). Probe `F-08 hash hop` pins it.
- **F-43:** public static assets (svg/jpg/webp/avif/ico/woff2/mp4) now serve `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`; `/serwist/sw.js` keeps strict no-cache (probe asserts both).
- **F-44:** deploy guard added — `vendureEnvWarnings` warns loudly when `STOREFRONT_URL` is not https:// outside `APP_ENV=dev` (email links would carry reset tokens in cleartext). TLS termination itself stays a deploy concern by design.
- **F-47:** duplicate-content paths verified collapsed: `/ar/products/` → 308 → clean, `/products` → 307 → localized, canonical declared per page (probe `F-47 canonical`), sort stays a query param. Decision row added to DECISIONS.md.
- **F-48:** admin de-indexed twice — `Disallow: /admin` (+ `/api`) in robots.txt AND `X-Robots-Tag: noindex, nofollow` header on `/admin/:path*` (robots.txt alone cannot de-index; the header is present even while Payload answers 500 — probe asserts both).
- **F-49:** verified closed-by-F-23 — no legacy/social URLs remain in source except the live verified profiles (NPFEG / npf.eg / LinkedIn).
- **F-50:** verified closed — the only iframe (contact map) carries a `title`; decorative empty alts are intentional. F-50b (CMS content-block iframes) stays n-a until real CMS content exists.
- **F-51:** verified closed-by-wave-1 — both inline SVGs (`hero-decoration`, `social-icons`) use `currentColor`/theme-aware strokes; nothing hardcoded.
- **F-16:** verified real content — hero/guarantees carry the documented claims; probe `F-16 hero copy` asserts the SSR HTML contains them and no `>01<`-style placeholder marker.
- **F-26:** folded into the F-13 seam — there are no article images in production because there are no articles in production (honest-empty policy); the sample fixture is deliberately watermarked. Real imagery arrives with real content.
- **F-28:** verified closed-by-wave-1 — carousel prev/next have distinct aria-labels, dots are "Go to story N".
- **F-31:** verified closed-by-wave-1 — wishlist heart is fully theme-aware (white-on-overlay on imagery, muted inline, destructive when active; `fill-current`).
- **F-55:** superseded — the mis-mapped scratch api-probes artifact is gone; the corrected expectations live as the F-54 probe (malformed slugs → 404, never 500) plus the session-gated account surface (307 → login). Decision row added to DECISIONS.md.
- **Font licensing (business decision):** filed in DECISIONS.md — KO Banzeen ("don't redistribute" embedded) + Glora (no licence record) may stay in the public repo ONLY temporarily; hard plan: confirm web-use with Protype Foundry / prove client ownership before launch, else move to a private asset store or swap to OFL faces. Full evidence in `src/app/fonts/LICENSES.md`.

### Incident notes (honesty log)
- The e2e battery mid-wave caught three failures that were **environmental, not code**: the long-lived `next start` process was serving a `.next` directory that had been swapped by later builds (image-optimizer requests for two webp sources hung server-side; a fresh server converts the same URLs in 0.3s). Lesson (matches the known "stale next start shadows rebuilds" entry): always restart `next start` after `npm run build` before judging browser tests.
- The axe `landmark-unique` fix (Wave 3) gave footer navs accessible names, which made the pre-existing tap-target audit (`nav[aria-label] a`) finally SEE footer links: 13 of them were 16–20px targets. Fixed properly in this wave (44px min-height on touch, compact desktop rows) rather than by scoping the test around them.
- Probe robustness: the F-59 toggle probe now waits for hydration before clicking (same controlled-input race as F-19) — a pre-hydration click is silently swallowed by React and would false-fail on cold servers.
