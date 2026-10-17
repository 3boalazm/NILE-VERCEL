# NPF Website — Full Production Audit

**Audit date:** 2026-09-17 (UTC)  
**Scope:** Website/storefront only. Payload admin, Vendure/ERP internals, worker, dashboard, and database behavior were not audited as products. They are mentioned only where their integration is a direct dependency of the website.  
**Repository:** `/home/user/NPF`, branch `arena/01a0ae76-npf`  
**Audit mode:** Audit only. No source code, configuration, database, production data, deployment setting, dependency declaration, route, or UI was changed. `node_modules` was installed with `npm ci --legacy-peer-deps` only to execute checks; tracked files remained unchanged.

## Evidence boundary

The implementation was inspected statically and the available automated checks were executed. The working environment did not contain the required Postgres/Vendure infrastructure, and the production build could not complete. Therefore browser-level claims that require a running application are explicitly marked **UNVERIFIED**. No destructive or out-of-scope security testing was performed.

Executed checks:

- `npm ci` — **failed** with an ERESOLVE peer-dependency conflict.
- `npm ci --ignore-scripts --legacy-peer-deps` — installed for audit execution; npm reported **35 vulnerabilities** in the installed tree (the later `npm audit --omit=dev` result reported 44 total, including 2 critical and 15 high advisories across the resolved tree).
- `npm test -- --run` — **passed: 8 files, 59 tests**.
- `npm run lint` — **failed: 5 errors**, all explicit `any` errors in generated GraphQL/migration files.
- `npx tsc --noEmit --pretty false` — **failed: 5 errors**, including the website Serwist integration and Vendure configuration type errors.
- `npm run build` — **failed** while fetching `IBM Plex Mono`, `IBM Plex Sans Arabic`, and `Montserrat` from `fonts.googleapis.com`; the independent TypeScript errors were confirmed separately.
- Playwright/E2E — **not run** because the production build and required Postgres/Vendure runtime were unavailable. Existing E2E coverage was inspected; it is Chromium-only and commerce tests skip when Vendure is unreachable.

---

# 1. Executive Summary

## Overall technical condition

The website has a coherent Next.js App Router structure, bilingual Arabic/English routing, server-side commerce transport, a sensible component vocabulary, branded responsive layouts, and several good security fundamentals: server-only Vendure transport, HttpOnly session cookies, server-side account guards, order ownership checks, server-side contact validation, coarse error codes, rate limiting, and baseline security headers.

It is **not production-ready at this revision**. The release path is blocked by dependency installation and type/build failures, and the primary checkout flow contains correctness risks that can cause the displayed checkout state to diverge from the order placed. The public website also makes every locale page depend on a no-timeout Vendure request, while upstream failure is rendered as an empty cart. That is an availability and trust risk for an e-commerce site.

## Major risks

1. **Release cannot reliably install or build.** Plain `npm ci` fails; TypeScript fails; the production build requires live Google Fonts network access.
2. **Checkout can silently change the requested fulfillment method.** The server falls back to another shipping method instead of rejecting a stale or invalid selection.
3. **Checkout collects company and notes fields but does not persist or transmit them.** This loses information users are explicitly told they can provide.
4. **The entire website waits on Vendure on every locale-layout render with no timeout.** A hung commerce service can hang public pages.
5. **A Vendure read failure is converted to an empty cart.** A real cart can disappear from the UI during an upstream incident.
6. **The cart client state is not reconciled when the server-provided initial cart changes.** Login/logout/session changes and concurrent add operations can leave the UI showing a different cart from the server.
7. **The login `redirect` query value is passed directly to `router.push`.** It is not restricted to a same-origin local path.
8. **The Dockerfile builds an image but defines no website start command.** The resulting image is not a complete production web container.

## Strong areas

- Route localization and RTL/LTR direction are centralized and consistently applied.
- Server actions are the only commerce/auth transport from the browser; the browser does not call Vendure directly.
- Order detail access checks the authenticated customer's order list before fetching by code.
- Confirmation access uses either a same-browser proof cookie or the authenticated customer's order list.
- Contact inquiry validation is duplicated on the server and is bounded by lengths/rate limiting.
- Product content is separated from live commerce pricing through a repository seam.
- Most interactive controls have visible loading/disabled states and accessible names.
- Base UI primitives are used for sheets/accordion/dialog foundations rather than hand-rolled focus logic.
- Unit tests cover important mapper, pricing, action, localization, contact, and rate-limit logic.

## Unknowns that must be closed before a production gate

- Runtime behavior of every route at all requested widths, because Playwright could not run.
- Real Payload schema/data, live Vendure responses, shipping eligibility, payment metadata exposure, and image URL shapes.
- Whether the legal copy, health/regulatory claims, shipping prices, analytics requirements, and product claims have been formally approved.
- Actual production headers, CDN behavior, origin allowlists, cookie policy, CSP deployment, and observability backend.
- Browser compatibility in Firefox, Safari, iOS Safari, Edge, and Android Chrome.

## Production gate

**FAIL.** The exact release blockers are BLD-001, BLD-002, BLD-003, DEP-001, SEC-001, REL-001, CHK-001, and CHK-002. The gate must remain closed until installation/build are reproducible, checkout integrity is corrected, upstream failure behavior is safe, the container starts the website, and the open-redirect path is constrained.

---

# 2. Website Inventory

## Repository/application map

| Area | Implementation |
|---|---|
| Framework | Next.js 16.3.3 App Router, React 19, Tailwind CSS v4 |
| Public website | `src/app/[locale]` with `ar` and `en` locales |
| Locale routing | `src/proxy.ts`; unsupported two-letter locale attempts redirect to `ar` |
| Shared locale layout | `src/app/[locale]/layout.tsx` |
| CMS/content | Payload repository in `src/lib/products/payload-repository.ts`; public products/categories/media reads |
| Commerce | Server actions in `src/lib/cart/actions.ts`, server-only Vendure client in `src/lib/vendure/client.ts` |
| Auth/account | `src/lib/auth/actions.ts`, `active-customer.ts`, account layouts/pages |
| Cart state | `src/lib/cart/provider.tsx`; server-backed, client display state |
| Wishlist | `src/lib/wishlist/store.ts` using browser `localStorage`; products resolved through a server action |
| UI system | `src/components/ui/*`, Base UI primitives, CVA variants, Tailwind tokens |
| Website components | `src/components/npf/*` |
| Offline/PWA | Serwist provider, `src/app/sw.ts`, `/serwist/[path]`, `/offline` |
| SEO | per-page `generateMetadata`, `src/app/robots.ts`, `sitemap.ts`, product JSON-LD |
| Analytics | No analytics/tracking SDK, initialization, event calls, or consent implementation found |
| Tests | 8 Vitest files; 2 Playwright files, one Chromium project |
| Deployment | `Dockerfile`, `.github/workflows/ci.yml`; no website start command in Dockerfile |

## Route inventory

The following is the complete website route map found in `src/app`. `/:locale` means `ar` or `en`.

| Route | Page/layout and dependencies | Auth | UI, forms, windows, states | SEO/analytics | Risks/notes |
|---|---|---|---|---|---|
| `/` | `src/proxy.ts` redirect to `/ar` | No | Redirect only | No page metadata | Redirect behavior covered by smoke test; runtime redirect status not independently verified |
| `/:locale` | Home page + locale layout; Payload categories/products and live/fallback prices | No | Search form, hero CTAs, category cards, featured cards, theme, cart/wishlist/header sheets | Locale metadata; Organization JSON-LD in layout; no analytics | Every render also reads Vendure cart/customer through layout |
| `/:locale/about` | Static marketing page + shared layout | No | Links/images; no form/window | Per-locale metadata/canonical/hreflang | Content claims require owner/legal verification |
| `/:locale/story` | Static editorial page | No | Alternating image chapters and CTAs | Custom metadata/canonical/hreflang | Large `vw` heading and reveal animation need visual/runtime verification |
| `/:locale/products` | Payload categories/products; live prices with mock fallback | No | Search query `q`, category query, sort query, positioning matrix, product cards, add-to-cart/wishlist | Metadata; not query-specific; included in sitemap | One Vendure price lookup per product; invalid category silently yields zero results |
| `/:locale/products/:slug` | Payload product, category/related queries, live/fallback price | No | Gallery, add-to-cart quantity stepper, wishlist, FAQ accordion, downloads, references | Product metadata, Product/Breadcrumb JSON-LD | Dynamic image URL compatibility and price fallback need runtime verification |
| `/:locale/blogs` | Static empty state | No | Empty CTA | Explicit noindex; excluded from sitemap | Intentional thin/coming-soon page, not reported as a defect |
| `/:locale/careers` | Static page/images | No | Mailto CTA | Per-locale metadata | Mailto behavior browser-dependent but normal |
| `/:locale/contact` | Static contact page; server action persists Payload inquiry | No | Contact form, success/error status, phone/mail links, Google Maps iframe | Per-locale metadata | Form action is covered by unit/E2E smoke only for happy path |
| `/:locale/quality-sourcing` | Static content/images | No | CTA links | Per-locale metadata | Health/regulatory claims unverified in this audit |
| `/:locale/shipping-delivery` | Static shipping matrix | No | Responsive table-like content, CTA | Per-locale metadata; sitemap included | Page itself says rates/timelines need reconfirmation; checkout uses separate Vendure rules |
| `/:locale/privacy-policy` | Static legal content | No | Long-form sections | Per-locale metadata; indexable | Copy explicitly says it needs legal approval |
| `/:locale/terms` | Static legal content | No | Long-form sections | Per-locale metadata; indexable | Copy explicitly says it needs legal approval |
| `/:locale/cart` | Client `NPFCartView`, root `CartProvider` | Guest/auth | Quantity controls, remove buttons, empty state, summary, checkout CTA | noindex | Error from update/remove is not surfaced to user |
| `/:locale/checkout` | Client `NPFCheckoutForm`, root `CartProvider` | Guest/auth | Contact/shipping/payment forms, shipping methods, terms checkbox, loading/error/empty | noindex | Critical checkout findings CHK-001–CHK-005 |
| `/:locale/checkout/confirmation?order=` | Server access gate + Vendure order lookup | Guest proof cookie or signed-in owner | Success/no-order states, order summary | noindex | Query code is gated; upstream failure becomes no-order state |
| `/:locale/login?redirect=` | Server signed-in redirect + client login action | Guest only | Login form, invalid/rate-limited/generic error | noindex | `redirect` is not constrained; SEC-001 |
| `/:locale/register` | Server signed-in redirect + client register action | Guest only | Registration form and error | noindex | Server action validation is largely delegated to Vendure |
| `/:locale/wishlist` | Client localStorage slugs + server action resolves products | No | Loading/empty/partial list, product cards | noindex | Fetch failure can leave indefinite spinner; no cross-tab storage sync |
| `/:locale/account` | Protected account layout/page; active customer | Required | Dashboard cards, account nav, logout | noindex | Account customer request occurs in root/layout/page but React request cache may dedupe within request |
| `/:locale/account/orders` | Active customer order list | Required | Empty/list/detail links | noindex | Query has no explicit pagination/take; older orders may be absent |
| `/:locale/account/orders/:code` | Ownership check then `orderByCode` | Required + owner | Detail, status, reorder | noindex | Depends on order list containing code; reorder failure path weak |
| `/:locale/account/addresses` | Customer + address query | Required | Add-address form, delete actions, empty state | noindex | Delete failures are silently ignored |
| `/:locale/account/profile` | Customer query | Required | View/edit profile form | noindex | Generic failure only; no unsaved-change concern because form is short |
| `/:locale/lab/hero-abstract` | Env-gated prototype; product repository when enabled | No | Prototype CTA | Not in sitemap; robots disallow | Intentional route gate; runtime flag behavior unverified |
| `/:locale/*` | Catch-all calls `notFound()` | No | Localized 404 via `x-pathname` header | 404 page metadata not separately defined | Locale recovery depends on proxy/header path |
| `/offline` | Standalone offline page | No | Arabic retry link | Arabic title only | English users receive Arabic fallback; PWA build is currently broken |
| `/serwist/sw.js` | Generated service-worker route | No | No UI | No | Route generation has a TypeScript API mismatch |
| `/api/*`, `/admin/*` | Payload routes/admin | Out of website UI scope | CMS/API | Out of public website page scope | Mentioned only where public website/deployment behavior is affected |

---

# 3. Critical Findings — P0/P1 only

No P0 was confirmed. The following P1 findings block production or can materially break a critical journey.

## BLD-001 — Plain production install fails on a declared peer dependency conflict

- **Category:** Build/deployment
- **Severity:** P1
- **Confidence:** Confirmed
- **Location:** `package.json:58-69`, `package-lock.json`; CI/Docker `npm ci`
- **Evidence:** Running `npm ci --ignore-scripts` produced `ERESOLVE`: `vitest@5.0.1` requires optional `@types/node` `^22.0.0 || >=24.0.0`, while the lock resolved `@types/node@20.19.43` from the declared `^20`. Both `Dockerfile:5-6` and `.github/workflows/ci.yml:40-41,60-61,93-94` run plain `npm ci`.
- **Why it matters:** A clean CI, Docker build, or production install cannot reproduce the dependency tree without bypassing peer resolution.
- **Impact:** Release pipeline stops before lint/build/tests. The audit only progressed by using the non-production workaround `--legacy-peer-deps`.
- **Reproduction:** From a clean checkout, run `npm ci`.
- **Root cause:** Incompatible Node type and Vitest peer ranges are committed together; CI does not pin/use a compatible resolution strategy.
- **Recommended remediation:** Align `@types/node` with the supported Node/Vitest range or choose a compatible Vitest release; regenerate and verify the lockfile; never make `--legacy-peer-deps` the silent production fix.
- **Dependencies:** Package policy, Node runtime target, Vitest/Next compatibility.
- **Regression risk:** Upgrading Node types can expose additional TypeScript errors; run lint, tsc, build, unit, and E2E checks after lockfile regeneration.

## BLD-002 — Website Serwist integration does not type-check and the wrapper drops the required service-worker URL

- **Category:** Build/PWA
- **Severity:** P1
- **Confidence:** Confirmed
- **Location:** `src/components/providers/serwist-provider.tsx:3-7`, `src/app/[locale]/layout.tsx:185`, `src/app/serwist/[path]/route.ts:11-15`
- **Evidence:** `npx tsc --noEmit --pretty false` reported:
  - layout passes `swUrl`, but the wrapper type accepts only `children`;
  - the wrapper renders `<Provider>{children}</Provider>` without the required `swUrl` prop;
  - `createSerwistRoute` requires `nextConfig`, which is not supplied.
- **Why it matters:** The website cannot pass its service-worker configuration through the wrapper, and the route-generation API does not match the installed Serwist version.
- **Impact:** Production type-check/build failure and, if type checks were bypassed, likely missing service-worker registration or route generation failure. Offline/PWA behavior is not reliable.
- **Reproduction:** Run `npx tsc --noEmit --pretty false`.
- **Root cause:** The local provider abstraction and route call were not updated to the installed `@serwist/turbopack` API.
- **Recommended remediation:** Align the wrapper prop contract and forward all required provider props; update `createSerwistRoute` to the installed API; add a build and browser registration assertion.
- **Dependencies:** Serwist version/API, Next build mode, service-worker deployment path.
- **Regression risk:** PWA cache behavior can change across deploys; test update, activation, offline fallback, and cache invalidation on iOS/Android/desktop.

## BLD-003 — Production build is not hermetic: `next/font/google` requires build-time external network access

- **Category:** Build/deployment/performance
- **Severity:** P1
- **Confidence:** Confirmed
- **Location:** `src/app/[locale]/layout.tsx:2,8-105`
- **Evidence:** `npm run build` failed in this audit with three `next/font` errors after repeated `ECONNRESET` from `fonts.googleapis.com` for IBM Plex Mono, IBM Plex Sans Arabic, and Montserrat.
- **Why it matters:** A deployment can fail even with a valid source tree and reachable database when Google Fonts is unavailable or blocked by a CI/network policy.
- **Impact:** No production artifact was produced in this environment; deploy reliability depends on a third-party build-time service.
- **Reproduction:** Run `npm run build` in an environment where `fonts.googleapis.com:443` is unavailable.
- **Root cause:** Google font fetching is performed by Next during build rather than using checked-in/self-hosted assets or a separately cached build input.
- **Recommended remediation:** Self-host the exact required font files or make font acquisition a controlled, cached build step; test a network-restricted build.
- **Dependencies:** Licensing/approval for font files, bundle size, visual regression.
- **Regression risk:** Font metric changes can cause CLS and wrapping differences; compare Arabic/English headings at all breakpoints.

## SEC-001 — Login redirect is an open/untrusted client navigation target

- **Category:** Security/authentication
- **Severity:** P1
- **Confidence:** Confirmed
- **Location:** `src/components/npf/login-form.tsx:23-25,44`
- **Evidence:** `const redirectTo = searchParams.get("redirect") || ...` is passed directly to `router.push(redirectTo)` after login. There is no origin, scheme, path, or locale validation.
- **Why it matters:** An attacker can send a login link containing an external or unsafe redirect value. Depending on the Next/router/browser handling of the supplied scheme, this can enable open redirects or client-side navigation injection/phishing.
- **Impact:** Users can be redirected away from the trusted domain immediately after entering credentials; an unsafe scheme would elevate the impact to script/navigation injection.
- **Reproduction:** Open `/ar/login?redirect=https%3A%2F%2Fexample.invalid` and complete a successful login in a test environment; test `javascript:` and protocol-relative values defensively without executing destructive payloads.
- **Root cause:** The redirect value is treated as trusted state from the query string.
- **Recommended remediation:** Accept only same-origin absolute paths beginning with `/`, reject `//`, backslash/encoded bypasses, schemes, and cross-origin URLs; default to the locale account route. Add unit and E2E tests for malicious values.
- **Dependencies:** Login UX and any future protected-flow redirects.
- **Regression risk:** Valid deep-link flows can be lost if validation is too strict; test encoded local paths and locale preservation.

## REL-001 — No upstream timeout; every locale page awaits Vendure through the root layout

- **Category:** Reliability/performance/API
- **Severity:** P1
- **Confidence:** Confirmed for code path; runtime duration under a hung upstream is unverified
- **Location:** `src/lib/vendure/client.ts:31-36`, `src/app/[locale]/layout.tsx:145-150`
- **Evidence:** `fetch(SHOP_API_URL, { ... cache: "no-store" })` has no `AbortSignal`/timeout. The locale layout awaits `Promise.all([readActiveOrderItems(), getActiveCustomer()])` on every locale page. `readActiveOrderItems` catches rejection but cannot bound a hanging request.
- **Why it matters:** A slow/hung commerce service becomes a page-render dependency for marketing pages that do not need commerce data.
- **Impact:** Elevated TTFB, request exhaustion, CDN miss amplification, and possible public-site hangs during a Vendure incident.
- **Reproduction:** Point `VENDURE_SHOP_API_URL` at an address that accepts connections but never responds, then request `/ar/about`.
- **Root cause:** Shared layout performs session/cart reads synchronously without a bounded transport or a decoupled header strategy.
- **Recommended remediation:** Add a bounded timeout and explicit degraded response; isolate cart/customer reads from public content or use a safe cached shell; add circuit-breaker/upstream health telemetry.
- **Dependencies:** Header signed-in/cart indicators, PWA behavior, SSR/cache strategy.
- **Regression risk:** Too-short timeouts may hide valid slow responses; measure p95/p99 upstream latency and test degraded UI.

## CART-001 — Vendure cart read failure is rendered as an empty cart

- **Category:** Commerce/reliability/data state
- **Severity:** P1
- **Confidence:** Confirmed
- **Location:** `src/lib/vendure/active-order.ts:24-46`, `src/app/[locale]/layout.tsx:150`, `src/lib/cart/provider.tsx:32-34`
- **Evidence:** `readActiveOrderItems()` catches all failures and returns `[]`; `CartProvider` initializes its state from that result. There is no degraded/error flag distinguishing “empty” from “could not load.”
- **Why it matters:** An actual server-side cart is not equivalent to an empty cart.
- **Impact:** During a transient upstream error, a user can see an empty cart, be blocked by an empty checkout, or believe their selections were lost. The server cart may still exist.
- **Reproduction:** Add an item, make the next page render’s Vendure read fail, and open `/ar/cart`.
- **Root cause:** Error and empty are collapsed in a read-only layout API and the client has no retry/recovery state.
- **Recommended remediation:** Return a typed `unavailable` state, preserve the last known client state where safe, show retry/degraded messaging, and revalidate before checkout.
- **Dependencies:** Session/cart consistency, offline policy, cart UI contract.
- **Regression risk:** Preserving stale items must never be treated as authoritative for order submission; server revalidation remains mandatory.

## CHK-001 — Checkout silently changes the selected fulfillment mode

- **Category:** Business logic/checkout integrity
- **Severity:** P1
- **Confidence:** Confirmed
- **Location:** `src/lib/cart/actions.ts:262-269`
- **Evidence:** The server computes `chosen` as the requested mode if available, otherwise the first eligible mode: `methods.find(...input.fulfillmentMode) ?? methods.find(...)`. It then submits `chosen.id` without informing the user that the requested mode was unavailable.
- **Why it matters:** The server must not convert a stale/tampered selection into a different fulfillment promise.
- **Impact:** The order can be placed for a different delivery/pickup method and price than the customer selected/displayed.
- **Reproduction:** Render methods with mode A selected, make A unavailable before submit, call `placeOrder` with A, and observe that another method is submitted.
- **Root cause:** Fallback logic prioritizes completion over selection integrity.
- **Recommended remediation:** Reject with a typed “selection changed” error if the requested mode is not eligible; refresh methods and require an explicit user choice. Recalculate and display the final price from the exact chosen method.
- **Dependencies:** Shipping API and client error state.
- **Regression risk:** More checkouts will require user re-selection after a shipping-rule change; add stale-selection and concurrency tests.

## CHK-002 — Checkout accepts client-supplied order fields without server-side validation and silently drops company/notes

- **Category:** Forms/data integrity/business logic
- **Severity:** P1
- **Confidence:** Confirmed for dropped fields; validation bypass impact is confirmed at action boundary
- **Location:** `src/components/npf/checkout-form.tsx:108-123,166-188,221-227`, `src/lib/cart/types.ts:19-25`, `src/lib/cart/actions.ts:205-260`
- **Evidence:** The UI collects `company` and `notes` and sends them in `CheckoutCustomer`, but `placeOrder` only maps name, email, phone, and shipping address into Vendure. No mutation writes company/notes. `placeOrder` server-side validates only `agreedToTerms`; the browser’s required/pattern attributes are not a server validation layer.
- **Why it matters:** Users are told additional information can be supplied, but that information is not available to fulfillment/sales. Server actions are callable with values that bypass browser HTML validation.
- **Impact:** Customer instructions, pharmacy/company identity, or contact details can be lost; malformed/blank checkout inputs can reach the commerce API.
- **Reproduction:** Complete checkout with a company and notes; inspect the action payload/mutation and resulting order. Directly invoke the server action in a test harness with empty/invalid fields.
- **Root cause:** Checkout DTO includes fields that have no persistence mapping, and validation responsibility is left to the client/Vendure.
- **Recommended remediation:** Add explicit server validation and bounded normalization for every checkout field; persist company/notes in supported order custom fields or a deliberate inquiry/order-note path; surface the server’s validation errors.
- **Dependencies:** Vendure schema/custom fields, fulfillment workflow, privacy/legal retention.
- **Regression risk:** Adding fields to orders changes admin/fulfillment data and migrations; test old orders and all locales.

## DEP-001 — Dockerfile produces a build image, not a runnable website image

- **Category:** Deployment
- **Severity:** P1
- **Confidence:** Confirmed
- **Location:** `Dockerfile:1-8`
- **Evidence:** The file installs, copies, and runs `npm run build`, but defines no `CMD`, `ENTRYPOINT`, `EXPOSE`, or `npm run start` command.
- **Why it matters:** A container built from this Dockerfile has no explicit website process to serve the Next production artifact.
- **Impact:** A deployment that uses this image can build successfully and then fail to start or run the base image’s default Node behavior instead of the website.
- **Reproduction:** Build the image and run it without overriding the command; inspect the process/port.
- **Root cause:** The Dockerfile stops at build completion and does not define the runtime stage/command.
- **Recommended remediation:** Define a production runtime command (preferably a multi-stage/standalone Next image), health check, port contract, and non-root user; verify `docker run` serves `/ar`.
- **Dependencies:** Hosting platform, `output: standalone` if used, runtime environment variables.
- **Regression risk:** Incorrect standalone copying can omit Payload assets or generated service-worker output; test API, static assets, fonts, and service worker in the final image.

---

# 4. Page-by-Page Findings

The route inventory above covers every page. This section records page-level outcomes and the important state/flow observations without duplicating the root-cause findings.

| Page | Happy path | Empty/partial | Error/slow/offline | Keyboard/mobile/SEO result |
|---|---|---|---|---|
| Home | Server-rendered hero, category and featured links are implemented | Empty product/category behavior is not explicitly designed; Payload failure throws to framework | Root layout still performs Vendure reads; no page error boundary | Metadata and JSON-LD exist; visual runtime unverified |
| About/story/quality/careers/shipping/legal | Static content and links are implemented | N/A except content/data claims | No route-level error/loading boundary; thrown data/framework errors use generic Next behavior | Semantic headings are present; full 200% zoom and screen reader path unverified |
| Blogs | Intentional empty/coming-soon state with product CTA | Implemented | Static page has no recovery need | Correctly noindexed/excluded from sitemap |
| Products listing | Query/filter/sort data is URL-driven; card links and add-to-cart controls exist | Empty result text exists | Payload/Vendure error has no page-specific retry state; live pricing falls back to mock | Search form is keyboard-accessible in source; no runtime responsive test |
| Product detail | Slug lookup, related products, gallery, FAQ, download/reference links exist | Missing product calls `notFound`; absent optional sections are omitted | Payload error/no timeout has no branded retry; image URL/runtime not verified | Product JSON-LD exists; gallery keyboard semantics are source-level only |
| Cart | Empty state and summary exist; server mutation state is represented by disabled controls | Empty implemented | Update/remove errors are ignored by `NPFCartView`; upstream read can look empty (CART-001) | At small widths the item layout needs runtime verification |
| Checkout | Guest/auth order path, shipping methods, payment selection, terms, confirmation redirect exist | Empty cart implemented | Shipping action error can leave stale methods; place-order generic error; no retry/field preservation; no timeout | Forms have labels/autocomplete; keyboard/mobile browser run unverified |
| Confirmation | Proof-of-purchase/ownership gate, order display, CTAs exist | No-order state implemented | Lookup outage becomes no-order state without retry/explanation | noindex; query is not exposed without gate in source |
| Login/register | Form actions, loading and generic/domain error states exist | N/A | Login action catches upstream errors; client transport rejection could leave submitting state (UNVERIFIED); redirect is unsafe (SEC-001) | Labels/autocomplete present; password policy otherwise minimal |
| Contact | Server-validated inquiry and success state exist | N/A | Server error is coarse; no client retry preserving form data beyond browser state | Labels, max lengths, alert/status exist; Google Maps third-party behavior unverified |
| Wishlist | Local slugs resolved against current product repository | Empty and unavailable-product note implemented | Server-action rejection is not caught, leaving the spinner indefinitely | noindex; localStorage/private-mode behavior only partially guarded |
| Account dashboard/orders | Protected via server layout and active customer | Empty orders state implemented | Vendure outage is treated as signed out and can redirect; no pagination UI | noindex; account data rendering unverified without Vendure |
| Order detail/reorder | Ownership check before detail; reorder path handles unavailable slugs in normal response | Missing/unowned code is notFound | Reorder final active-order fetch can throw when all lines fail/upstream is down; generic/no inline error | noindex; product images depend on Vendure asset URLs |
| Addresses/profile | Protected server pages, labels and refresh after success | Empty addresses and add form implemented | Address delete ignores result; profile/address errors generic | Form semantics good in source; focus/scroll runtime unverified |
| Lab | Env flag gates before fetch; robots excludes | N/A | Direct access 404 when flag false | Intentional prototype, excluded from production content |
| Localized 404/offline | Localized 404 uses proxy header; offline fallback is standalone | Implemented | 404 locale depends on proxy/header; offline is Arabic-only and service worker build is blocked | Offline language mismatch; retry behavior unverified |

---

# 5. Window-by-Window Audit

## W-001 Header navigation sheet

- **Locations:** `src/components/npf/header.tsx:106-145`, `src/components/ui/sheet.tsx`.
- **Open/close:** Base UI dialog primitive trigger, explicit close, `SheetClose` around navigation links.
- **Escape/outside/focus/scroll/background:** The underlying Base UI dialog primitive is designed to provide these behaviors, but they were not browser-verified because the app could not build/run. **UNVERIFIED runtime.**
- **Keyboard/screen reader:** Trigger has a localized `aria-label`; sheet has a `SheetTitle`; close has screen-reader text. Source-level semantics are good.
- **Stacking/overflow/mobile:** Overlay and popup are `z-50`; side is chosen from locale direction. Sheet width is `w-3/4`, which should fit phones, but content/viewport overflow is **UNVERIFIED**.
- **Persistence/back/deep-link:** It is local component state, not URL-synchronized; browser back does not represent drawer state. This is acceptable for ordinary navigation but back behavior is **UNVERIFIED**.
- **Finding:** No confirmed functional defect beyond the overall runtime-verification limitation.

## W-002 Mobile bottom-nav “More” sheet

- **Locations:** `src/components/npf/bottom-nav.tsx:100-134`, `src/components/ui/sheet.tsx`.
- **Open/close:** Same Base UI primitive; links are wrapped in `SheetClose`.
- **Accessibility:** Trigger is a real button but has no explicit `aria-label` separate from visible localized text; the visible text is a usable accessible name. Sheet title and close are present.
- **Mobile:** Fixed bottom nav is `z-40`; sheet is `z-50`; safe-area bottom padding is present. Runtime keyboard and iOS viewport behavior are **UNVERIFIED**.
- **Finding:** No confirmed defect; requires device testing at 320/360/375/390/414px.

## W-003 Product FAQ accordion

- **Locations:** `src/app/[locale]/products/[slug]/page.tsx:~330-370`, `src/components/ui/accordion.tsx`.
- **Open/close/keyboard/semantics:** Base UI accordion trigger/panel primitives provide the expected disclosure semantics and keyboard handling. Focus-visible styling is present.
- **Animation:** CSS height animation and `overflow-hidden`; reduced-motion handling is not explicitly applied to the accordion CSS.
- **Finding:** Runtime animation/reduced-motion behavior is **UNVERIFIED**. No confirmed functional defect.

## W-004 Product image gallery

- **Location:** `src/components/npf/product-thumbnail-gallery.tsx`.
- **Open/close:** No image viewer/modal; thumbnail buttons switch the active image.
- **Keyboard/screen reader:** Thumbnails are buttons with `aria-label` and `aria-current`; thumbnails are decorative (`alt=""`) while the active image has the product alt.
- **Finding:** Source-level behavior is reasonable. No zoom/full-screen viewer exists; that is a capability gap only if required by product requirements, which is **UNVERIFIED**.

## Windows/components present but unused

`src/components/ui/dialog.tsx`, `tabs.tsx`, and `navigation-menu.tsx` exist, but no public website page imports a live dialog, tab set, popover, tooltip, date picker, command menu, or select/combobox. They were not reported as live defects. `DialogContent` has a hardcoded Arabic close label, which would be an i18n defect if the unused primitive is later used on English pages.

---

# 6. UX/UI Findings

## UX/UI-001 — Checkout errors do not preserve a trustworthy, actionable state

- **Category:** UX/error handling
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/components/npf/checkout-form.tsx:68-85,125-128`
- **Evidence:** `refreshShippingMethods` sets loading false and returns on `result.error` without clearing existing methods or showing the error. `handleSubmit` maps every error to one generic message.
- **Why it matters/impact:** A stale method/price can remain selectable after address/payment refresh failure; users cannot tell whether to retry, re-enter address, or wait.
- **Reproduction:** Load methods, change address/payment, force the server action to return `error`, observe prior methods remain and no message is shown.
- **Root cause:** Error state is not modeled separately from methods/selection.
- **Recommended remediation:** Clear invalidated methods/selection, show localized error with retry, disable submit while refreshing, and map known server errors.
- **Dependencies/regression:** Shipping UX and E2E failure-path coverage.

## UX/UI-002 — Cart mutation failures are silently ignored

- **Category:** UX/cart
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/components/npf/cart-view.tsx:79-99`, `src/lib/cart/provider.tsx:46-63`
- **Evidence:** `removeItem`/`updateQty` return errors, but `NPFCartView` does not inspect them or render an alert/toast/inline message.
- **Why it matters/impact:** A failed delete or quantity change looks like an unresponsive control; users may retry repeatedly or place an incorrect order.
- **Reproduction:** Make `updateCartLine` or `removeCartLine` return an error and operate the cart.
- **Root cause:** Provider exposes an error result but the page discards it.
- **Recommended remediation:** Add per-line mutation error state and retry messaging; preserve focus and announce success/failure.
- **Dependencies/regression:** Cart state contract and accessibility live-region behavior.

## UX/UI-003 — Address delete failure has no feedback

- **Category:** UX/account/error handling
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/components/npf/addresses-list.tsx:21-29`
- **Evidence:** `deleteAddress(id)` result is ignored and the UI always calls `router.refresh()`.
- **Impact:** Users receive no indication that an address was not deleted.
- **Recommended remediation:** Branch on `{ok}`, show a localized alert, only clear pending state after response, and disable only the affected row.
- **Dependencies/regression:** Account E2E failure path.

## UX/UI-004 — Wishlist failure can remain in an indefinite loading state

- **Category:** Error/empty/loading
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/components/npf/wishlist-content.tsx:18-31`
- **Evidence:** The effect calls `getWishlistProducts(...).then(...)` with no `.catch`; `products` stays `null`, which renders the spinner forever on rejection.
- **Impact:** Wishlist is unusable during a Payload/network error and offers no retry.
- **Recommended remediation:** Add error state, cancellation-safe retry, and a useful offline/degraded message.
- **Dependencies/regression:** Server-action response contract and PWA cache policy.

---

# 7. Accessibility Findings

## A11Y-001 — Quantity stepper controls have non-descriptive names

- **Category:** WCAG 4.1.2/name, role, value
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/components/npf/quantity-stepper.tsx:32-49`
- **Evidence:** Buttons use `aria-label="-"` and `aria-label="+"`. The group has a localized label, but the individual actions are not named “Decrease quantity”/“Increase quantity”.
- **Impact:** Screen-reader users hear symbols rather than the action and may not understand what changes.
- **Recommended remediation:** Add localized decrease/increase labels and announce the current quantity with an appropriate value/name relationship.
- **Dependencies/regression:** Dictionary keys and cart/product component tests.

## A11Y-002 — Reveal animation makes critical content dependent on client motion initialization

- **Category:** WCAG 2.3.3 / progressive enhancement
- **Severity:** P2
- **Confidence:** Likely; runtime visual result unverified
- **Location:** `src/components/npf/motion/reveal.tsx:29-45`
- **Evidence:** All `Reveal` components render `initial="hidden"` and only become visible through `whileInView`/`animate` after Framer Motion client behavior. Many page headings, CTAs, and content blocks are wrapped in `Reveal`.
- **Impact:** Hydration failure, disabled JavaScript, motion-library failure, or an observer issue can leave important content visually hidden; it also delays content visibility and can complicate automated accessibility checks.
- **Recommended remediation:** Make server-visible styles the default; animate from visible only on an opted-in client enhancement, or use CSS that does not hide content before enhancement. Add reduced-motion and JS-disabled checks.
- **Dependencies/regression:** Visual regression and Core Web Vitals.

## A11Y-003 — Accessibility test coverage is absent

- **Category:** Testing/accessibility
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `e2e/*`, `playwright.config.ts`
- **Evidence:** Playwright has one Chromium project and no axe/automated accessibility assertions; no component accessibility tests exist.
- **Impact:** Focus traps, contrast, landmarks, labels, mobile nav, RTL, and 200% zoom regressions can ship undetected.
- **Recommended remediation:** Add axe checks for representative public, product, cart, checkout, auth, and account states; test keyboard-only and 200% zoom in Chromium plus Safari/Firefox manual/automated coverage.
- **Dependencies/regression:** Browser matrix and test fixture data.

## Positive accessibility observations

Real labels are associated with form inputs, button/link roles are generally correct, focus-visible styles are in the shared button/input/navigation classes, decorative images use empty alt in several places, and sheets/accordion use accessible Base UI primitives. Contrast claims in comments were not re-measured by this audit; actual rendered contrast remains **UNVERIFIED**.

---

# 8. Responsive/Mobile Findings

## RESP-001 — Header likely overflows at 320–390px

- **Category:** Responsive/mobile UX
- **Severity:** P2
- **Confidence:** Highly likely from layout arithmetic; runtime screenshot is unverified
- **Location:** `src/components/npf/header.tsx:52-115`, `src/components/ui/button.tsx` icon sizes
- **Evidence:** Below `lg`, the header retains the logo plus account, wishlist, cart, locale switcher, theme toggle, and menu. Icon buttons become `max-lg:size-11`; the outer row has `gap-4` and horizontal padding. The logo is `h-11`; all six controls remain present. At 320px, the minimum widths plus six/seven gaps exceed the inner width.
- **Impact:** Horizontal scroll, squeezed locale link, clipped controls, or a broken header at the smallest required widths.
- **Reproduction:** Run the website at 320, 360, 375, and 390px and inspect `document.documentElement.scrollWidth` versus `clientWidth`.
- **Root cause:** Too many persistent mobile header controls with no compact grouping or breakpoint-specific hiding.
- **Recommended remediation:** Collapse secondary controls into the menu at small widths, reserve a compact utility row, or define a tested breakpoint layout; add viewport overflow assertions.
- **Dependencies/regression:** Header navigation and mobile E2E snapshots.

## Responsive test matrix

The requested widths 320, 360, 375, 390, 414, 768, 1024, 1280, 1440, and large desktop are not covered by existing tests. CSS has useful grid breakpoints (`sm`, `lg`) and safe-area padding for the bottom nav, but the following are **UNVERIFIED** at runtime: checkout long forms, cart item rows, fixed bottom nav plus install prompt, sheet viewport overflow, 200% zoom, orientation changes, and iOS browser chrome.

---

# 9. Security Findings

## SEC-002 — No Content Security Policy

- **Category:** Web security
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `next.config.ts:21-36`
- **Evidence:** The configured headers include `nosniff`, `SAMEORIGIN`, Referrer-Policy, HSTS, and Permissions-Policy, but explicitly omit CSP.
- **Impact:** If an XSS or unsafe third-party/content path is introduced, there is no browser-enforced script/source restriction or `frame-ancestors` policy. The app also uses inline theme and JSON-LD scripts, so CSP requires deliberate nonce/hash scoping.
- **Recommended remediation:** Define a route-aware CSP with nonces/hashes and explicit Google Maps frame/source requirements; test Payload admin separately rather than leaving CSP absent globally.
- **Dependencies/regression:** Inline scripts, Payload admin, Maps iframe, service worker, third-party assets.

## SEC-003 — In-memory/IP-header rate limiting is not a production abuse boundary

- **Category:** Security/authentication/availability
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/lib/security/rate-limit.ts:7-37`
- **Evidence:** Limits are stored in a process-local `Map`; client identity trusts the first `x-forwarded-for` value. Restarts and horizontally scaled instances reset/split limits, and a proxy that forwards attacker-supplied values can allow key rotation.
- **Impact:** Login/contact abuse controls can be bypassed or can unfairly block users behind shared IPs.
- **Recommended remediation:** Use a trusted edge-derived client identity and distributed rate-limit storage or edge protection; retain application limits as defense in depth.
- **Dependencies/regression:** Hosting proxy contract, privacy/data retention, login/contact UX.

## SEC-004 — Public Payload GraphQL Playground route increases production attack surface

- **Category:** Security/API exposure
- **Severity:** P2
- **Confidence:** Confirmed route exposure; exploitability/configuration impact unverified
- **Location:** `src/app/(payload)/api/graphql-playground/route.ts:1-5`
- **Evidence:** `GRAPHQL_PLAYGROUND_GET(config)` is exported without an environment guard or auth wrapper.
- **Impact:** A public interactive GraphQL surface assists schema discovery and probing of a production endpoint. It is not needed by public storefront visitors.
- **Recommended remediation:** Disable or auth-gate the playground in production; separately verify introspection and API route policy.
- **Dependencies/regression:** CMS/admin operations and developer tooling.

## SEC-005 — Dependency audit reports high/critical advisories requiring reachability triage

- **Category:** Supply-chain security
- **Severity:** P2
- **Confidence:** Confirmed advisory inventory; website exploitability unverified
- **Location:** `package.json`, resolved dependency tree
- **Evidence:** `npm audit --omit=dev --json` reported 2 critical and 15 high advisories in the resolved tree, including `@vendure/core`, `@vendure/asset-server-plugin`, `sharp`, `tar`, `express`/Nest transitive packages, `multer`, `path-to-regexp`, `typeorm`, and `ws`. Some are in the separately run commerce/admin surfaces, not necessarily in the public Next bundle.
- **Impact:** Vulnerable server/admin/image-processing code may be deployable alongside the website; the current audit does not establish exploitability in the public route.
- **Recommended remediation:** Produce an SBOM and runtime reachability map, upgrade direct packages/lockfile, isolate ERP/admin dependencies from the storefront runtime if possible, and set an advisory policy. Do not blindly run `npm audit fix --force` because npm identified breaking major upgrades.
- **Dependencies/regression:** Vendure compatibility, Payload migrations, image processing, lockfile changes.

## Security positives and UNVERIFIED items

- Session token cookie is HttpOnly, SameSite=Lax, path `/`, and secure in production (`src/lib/vendure/session.ts`).
- Account layout and order detail use server-side checks; confirmation uses a proof cookie/account ownership check.
- Baseline headers are present.
- CSRF behavior of Next Server Actions, production cookie domain/origin behavior, CORS, proxy header sanitization, Payload auth brute-force protection, and actual CSP/headers at the deployed origin are **UNVERIFIED**.

---

# 10. Performance Findings

## PERF-001 — Every public render performs uncached/no-store commerce work

- **Category:** Performance/architecture
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/app/[locale]/layout.tsx:150`, `src/lib/vendure/client.ts:31-36`
- **Evidence:** The layout reads the active order/customer for every locale page; Vendure requests use `cache: "no-store"`. Public marketing pages therefore cannot be fully static or CDN-cacheable as currently structured.
- **Impact:** Higher TTFB, origin load, and reduced resilience for pages that do not need personalized commerce state.
- **Recommended remediation:** Split public shell from personalized header/cart data, use appropriate dynamic boundaries, and cache public content independently from session reads.
- **Dependencies/regression:** Header hydration, cart count freshness, cache headers, auth privacy.

## PERF-002 — Product listing creates one live-price request per product

- **Category:** API/performance/scalability
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/lib/products/payload-repository.ts:139-147,154-160`, `src/lib/vendure/pricing.ts:47-79`
- **Evidence:** `getAllProducts` maps every Payload slug into `getLivePrices`; `getLivePrices` performs `Promise.allSettled(missing.map(slug => fetchLivePrice(slug)))`, and each fetch sends a separate GraphQL product lookup.
- **Impact:** A catalog of N products causes N parallel upstream requests on a listing/sitemap render, increasing load, rate pressure, latency, and failure surface.
- **Recommended remediation:** Add a batched Vendure query or a durable catalog/pricing projection; cap concurrency if batching is impossible; cache at the appropriate request/catalog layer.
- **Dependencies/regression:** Price freshness, SKU join strategy, stale-price policy.

## PERF-003 — Build/runtime font loading strategy is large and mixed

- **Category:** Performance/assets
- **Severity:** P2
- **Confidence:** Likely; exact browser transfer not measured because build failed
- **Location:** `src/app/[locale]/layout.tsx:8-105`
- **Evidence:** Three Google font families plus nine local font files are registered in the shared locale layout. Glora has six static weights, and multiple font variable classes are applied to every locale HTML element.
- **Impact:** Build fragility, possible extra font CSS/requests, increased font selection complexity, and layout shifts if font readiness differs by locale.
- **Recommended remediation:** Self-host only required weights/subsets, use a documented font loading budget, and measure LCP/CLS with Arabic and English pages.
- **Dependencies/regression:** Brand typography approval and legal font licenses.

## PERF-004 — Sitemap is dynamically expensive and emits a new timestamp every request

- **Category:** SEO/performance/caching
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/app/sitemap.ts:28-58`
- **Evidence:** Each sitemap call reads all products through the repository, which can call Payload and live Vendure pricing; `lastModified` is set to `new Date()` for every generated entry.
- **Impact:** Sitemap requests can trigger unnecessary database/upstream work and tell crawlers every URL changed on every request.
- **Recommended remediation:** Use a stable content-derived modification time, cache/revalidate the sitemap, and ensure sitemap generation does not depend on live checkout pricing.
- **Dependencies/regression:** Content publishing workflow and product route indexability.

---

# 11. SEO Findings

## SEO-001 — Metadata coverage is generally strong, but transactional and personal pages are deliberately noindex

This is a **positive/expected result**, not a defect: cart, checkout, confirmation, auth, account, wishlist, and blogs have noindex behavior. Public static pages and product pages have titles/descriptions/canonicals/hreflang/Open Graph/Twitter data. Product pages add Product and Breadcrumb JSON-LD.

## SEO-002 — Sitemap indexability is not tied to product status or publish readiness

- **Category:** SEO/content correctness
- **Severity:** P3
- **Confidence:** Confirmed code path; business intent unverified
- **Location:** `src/app/sitemap.ts:33-55`, `src/lib/products/types.ts`
- **Evidence:** `productRepository.getAllProducts()` is mapped into sitemap entries without filtering `active`, `paused`, or `launching_soon` status.
- **Impact:** Paused/launching products can be submitted to crawlers even when the business may not want them indexed.
- **Recommended remediation:** Define an explicit indexability policy per status and apply the same policy to sitemap, metadata, and internal links.
- **Dependencies/regression:** Product launch strategy; do not change without content-owner approval.

## SEO-003 — No `x-default` alternate and no automated metadata validation

- **Category:** SEO
- **Severity:** P3
- **Confidence:** Confirmed absence; business requirement unverified
- **Location:** `src/lib/seo/page-metadata.ts`, page metadata builders
- **Evidence:** Language alternates include `ar` and `en`, but no `x-default`; no tests assert canonical/hreflang/robots output.
- **Impact:** Language selection for users/crawlers without a matching locale is less explicit; future metadata regressions can ship.
- **Recommended remediation:** Decide whether `x-default` should point to `/ar` or a language selector and add metadata tests for every public route.
- **Dependencies/regression:** SEO strategy and canonical policy.

## SEO-004 — 404 and redirects need deployed-origin verification

- **Category:** SEO/routing
- **Severity:** P3
- **Confidence:** Unverified runtime
- **Evidence:** Proxy redirect/catch-all logic exists and smoke tests cover `/`, unsupported locale, and one localized 404, but production build/E2E could not run.
- **Impact:** Incorrect status codes, canonical headers, or localized 404 behavior would affect crawlability.
- **Recommended remediation:** Verify status codes/headers for `/`, `/fr/products`, `/ar/unknown`, product 404, `/robots.txt`, `/sitemap.xml`, and trailing-slash variants on the deployed origin.
- **Dependencies/regression:** Next 16 routing/proxy behavior.

---

# 12. API/Network Findings

## API-001 — No timeout, cancellation, or retry policy

Covered by REL-001. `vendureRequest` has no timeout/AbortController and all requests use `no-store`; there is no request ID, retry policy, or stale-response guard.

## API-002 — Checkout address/payment refreshes can race

- **Category:** API/state/concurrency
- **Severity:** P2
- **Confidence:** Confirmed code race; exact user-visible order depends on response timing
- **Location:** `src/components/npf/checkout-form.tsx:62-100`
- **Evidence:** Every blur and payment change starts `refreshShippingMethods`; there is no request sequence ID, abort, or last-write-wins check. Each server action mutates the same Vendure active order’s address/custom fields before reading methods.
- **Impact:** A slower old response can overwrite shipping methods/price/selection for newer input; concurrent actions can mutate the active order in the wrong order.
- **Recommended remediation:** Debounce, cancel or sequence requests, clear stale selections, and make the final server submission authoritative with no silent fallback.
- **Dependencies/regression:** Shipping API semantics and UI loading states.

## API-003 — Server errors are not mapped by status/domain

- **Category:** API/error handling
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/lib/vendure/client.ts:39-48`, action callers, checkout/login UI
- **Evidence:** Vendure errors are wrapped as a generic `VendureRequestError`; callers mostly return coarse strings such as `network_error`, while checkout displays one generic order error.
- **Impact:** 401/403/404/409/422/429/500, malformed response, and session expiration cannot be explained or recovered differently.
- **Recommended remediation:** Define typed domain error codes, map auth/session conflicts to refresh/login, validation errors to fields, rate limits to retry-after messaging, and server outages to retry.
- **Dependencies/regression:** Vendure error schema and localized dictionary keys.

## API-004 — Public catalog pricing falls back to mock data when live pricing is unavailable

- **Category:** Commerce/API/business integrity
- **Severity:** P2
- **Confidence:** Confirmed code; whether fallback values are current is unverified
- **Location:** `src/lib/products/payload-repository.ts:75-130`, `src/lib/vendure/pricing.ts:29-44`
- **Evidence:** Live prices are optional; if absent, `toProduct` uses `bridge?.price` from `MockProductRepository`. The same fallback is rendered in product listing/PDP.
- **Impact:** Customers can see stale/wrong prices during Vendure outages; although checkout may later fail, the displayed catalog is not authoritative.
- **Recommended remediation:** Make fallback explicitly labeled as unavailable/last-known, or suppress order prices until live pricing is confirmed; log price-source state.
- **Dependencies/regression:** Business pricing policy and outage UX.

---

# 13. State/Data Findings

## STATE-001 — CartProvider does not reconcile new server initial items

- **Category:** State/session correctness
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/lib/cart/provider.tsx:32-34`, locale layout `:188`
- **Evidence:** `useState(initialItems)` reads the server prop only at initial mount; there is no effect/key/reconciliation when the layout later supplies different `initialCartItems` after login, logout, refresh, or session change.
- **Impact:** UI cart can belong to the previous session while the server cart belongs to the new token. Shared-device login/logout is a realistic mismatch scenario.
- **Recommended remediation:** Reconcile on a session/cart identity key or explicitly reset the provider on auth/cart session changes; never trust client cart for final order data.
- **Dependencies/regression:** Auth refresh flow, anonymous-to-auth cart merge semantics.

## STATE-002 — Concurrent product adds can overwrite each other with stale responses

- **Category:** State/concurrency
- **Severity:** P2
- **Confidence:** Confirmed code race
- **Location:** `src/lib/cart/provider.tsx:36-44`, `src/components/npf/add-to-cart-button.tsx`
- **Evidence:** Each product card has its own `adding` state, so different cards can invoke `addItem` concurrently. Each response unconditionally calls `setItems(result.items)`; response order is not checked.
- **Impact:** The UI can show only one of multiple successfully added items until a full reload; users may believe items were lost.
- **Recommended remediation:** Serialize cart mutations, assign operation sequence numbers, or re-read the authoritative active order before applying a result.
- **Dependencies/regression:** Add-to-cart responsiveness and server action throughput.

## STATE-003 — Wishlist does not respond to changes in another tab

- **Category:** State persistence
- **Severity:** P3
- **Confidence:** Confirmed
- **Location:** `src/lib/wishlist/store.ts:30-76`
- **Evidence:** The store has an in-memory listener list but no `window.storage` listener; `cachedSnapshot` remains unchanged when another tab edits localStorage.
- **Impact:** Header count and wishlist page can be stale across tabs.
- **Recommended remediation:** Subscribe to the browser `storage` event and invalidate/reload the cached snapshot; add a multi-tab test.
- **Dependencies/regression:** Browser privacy/storage behavior.

## STATE-004 — Account lookup failures masquerade as signed-out users

- **Category:** Auth/reliability
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/lib/auth/active-customer.ts:19-49`, account layout
- **Evidence:** `getActiveCustomer` catches any Vendure failure and returns `null`; protected pages redirect to login and the header switches to Login.
- **Impact:** A signed-in user can be wrongly logged out by the UI during an upstream outage, causing confusion and potentially loss of an in-progress flow.
- **Recommended remediation:** Distinguish `guest`, `unauthorized`, and `upstream_unavailable`; show retry/degraded state instead of redirecting on infrastructure failure.
- **Dependencies/regression:** Auth/session error contract.

---

# 14. Forms/Validation Findings

## FORM-001 — Checkout relies on browser constraints for most validation

- **Category:** Validation/security/data quality
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/components/npf/checkout-form.tsx:166-180,197-223`, `src/lib/cart/actions.ts:200-220`
- **Evidence:** HTML `required`, `pattern`, and `type=email` checks exist in the client. `placeOrder` server action only checks terms before sending values onward.
- **Impact:** Direct Server Action calls, browser quirks, or future clients can submit blank/malformed name, phone, address, email, or oversized values.
- **Recommended remediation:** Validate/normalize server-side with bounded lengths and locale-aware phone/email rules; return field-level errors.
- **Dependencies/regression:** Vendure validation and Egyptian phone formats.

## FORM-002 — Contact form has stronger validation than checkout, but its client error does not distinguish validation/rate-limit/server failure

- **Category:** Forms/UX
- **Severity:** P3
- **Confidence:** Confirmed
- **Location:** `src/components/npf/contact-form.tsx:25-58,122-130`
- **Evidence:** Server returns `validation`, `rate_limited`, or `server_error`, but the component collapses all failures to `setError(true)` and the same message.
- **Impact:** Users do not know whether to correct fields, wait, or retry.
- **Recommended remediation:** Map error codes to localized messages and preserve the entered form values.
- **Dependencies/regression:** Dictionary parity tests.

## FORM-003 — Password policy is only `minLength={6}` at the client; server contract is not verified

- **Category:** Auth/validation
- **Severity:** P2
- **Confidence:** Likely; backend policy is outside website scope and unverified
- **Location:** `src/components/npf/register-form.tsx:63-70`, `src/lib/auth/actions.ts:44-90`
- **Evidence:** Website sends raw registration values and does not validate length/format server-side; the only visible rule is six characters.
- **Impact:** Weak or inconsistent passwords may be accepted/rejected without actionable feedback.
- **Recommended remediation:** Align explicit server-side validation and UI requirements with the actual Vendure policy; test domain error mapping.
- **Dependencies/regression:** Commerce auth policy.

---

# 15. Architecture Findings

## ARCH-001 — Public content, personalized session reads, CMS, and commerce are coupled in the root layout

- **Category:** Architecture/scalability
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/app/[locale]/layout.tsx:145-150`
- **Evidence:** The shared layout fetches active cart/customer before rendering every locale page.
- **Impact:** A commerce outage or slow session read affects static content; cacheability and horizontal scaling are reduced.
- **Recommended remediation:** Separate public layout from personalized client islands or bounded server fragments; make failure states explicit.
- **Dependencies/regression:** Header indicators, auth state, server/client boundaries.

## ARCH-002 — Live pricing, mock catalog fallback, Payload content, and Vendure variant lookup have no explicit authoritative-price contract

- **Category:** Architecture/data
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/lib/products/payload-repository.ts`, `src/lib/vendure/pricing.ts`, `product-map.ts`
- **Evidence:** Product reads combine Payload content with live price when present and mock price when absent; add-to-cart resolves variant by slug at request time instead of using the reserved `vendureProductId` bridge.
- **Impact:** Catalog availability/price/SKU may diverge from commerce truth and the join is vulnerable to slug drift/duplicate catalog maintenance.
- **Recommended remediation:** Define a versioned product projection/authoritative join, use stable Vendure IDs, and make price source/freshness observable.
- **Dependencies/regression:** Catalog migration and ERP data ownership.

## ARCH-003 — No route-level loading/error boundaries

- **Category:** Architecture/reliability/UX
- **Severity:** P2
- **Confidence:** Confirmed absence from route tree
- **Location:** `src/app` (no `loading.tsx`, `error.tsx`, or `global-error.tsx` found)
- **Evidence:** Long server reads have no route-specific loading UI; thrown Payload/database/malformed-data errors have no branded recovery boundary.
- **Impact:** Users can see blank/unstyled framework errors or no meaningful progress during slow renders.
- **Recommended remediation:** Add appropriate loading/error boundaries for public catalog, product, account, checkout, and confirmation; include retry/navigation actions without exposing internals.
- **Dependencies/regression:** Next App Router streaming and server action errors.

---

# 16. Code Quality Findings

## CODE-001 — Lint fails on explicit `any` usage

- **Category:** Code quality
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/gql/graphql.ts:9`, migration files under `src/migrations/*`
- **Evidence:** `npm run lint` fails with five `@typescript-eslint/no-explicit-any` errors.
- **Impact:** CI quality gate fails; unsafe shapes in repository/migration/generated integration reduce confidence in data mapping.
- **Recommended remediation:** Regenerate generated files with the correct lint policy or isolate generated/migration files intentionally; type CMS/GraphQL mapping boundaries instead of broadly using `any`.
- **Dependencies/regression:** Generated artifact policy and Payload migrations.

## CODE-002 — Large mixed-responsibility components make checkout/account changes risky

- **Category:** Maintainability
- **Severity:** P3
- **Confidence:** Confirmed
- **Location:** `src/components/npf/checkout-form.tsx` (396 lines), `src/lib/cart/actions.ts` (318 lines), `src/lib/products/mock-repository.ts` (1047 lines)
- **Evidence:** Checkout owns form rendering, shipping request orchestration, payment state, totals, validation handoff, and navigation; cart actions own multiple transaction workflows; mock data is a large implementation file.
- **Impact:** The confirmed shipping race/drop-fields issues are harder to isolate and test; unrelated changes can regress the critical checkout path.
- **Recommended remediation:** Extract typed shipping-method controller, checkout validation/domain service, and test fixtures/data modules while preserving a single authoritative order service.
- **Dependencies/regression:** Do after behavior tests and contract stabilization; avoid a silent refactor during the production gate.

## CODE-003 — Comments/documentation make strong claims that are not all mechanically enforced

- **Category:** Technical debt/auditability
- **Severity:** P3
- **Confidence:** Confirmed examples; broad claim strength unverified
- **Location:** Comments throughout `next.config.ts`, checkout/cart, repositories, and README
- **Evidence:** Comments describe “always identical” live pricing and safe PWA behavior, while code has a mock price fallback, missing Serwist prop forwarding, and no build/runtime verification.
- **Impact:** Future maintainers can trust comments over observable contracts and miss production risks.
- **Recommended remediation:** Replace claims with tested invariants and explicit degraded-state documentation; link comments to automated contract tests.
- **Dependencies/regression:** Documentation update only, but should follow fixes.

---

# 17. Testing Findings

## TEST-001 — Unit suite is healthy but narrow

- **Category:** Test coverage/quality
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/lib/**/*.test.ts`
- **Evidence:** 59 tests pass across 8 server/pure-logic files. No React component tests, no race tests, no metadata/header tests, no service-worker tests, no browser matrix, and no coverage threshold/report.
- **Impact:** Passing unit tests do not protect the UI states and critical integration behavior where the main findings exist.
- **Recommended remediation:** Add contract tests for checkout state transitions, server validation, selected shipping integrity, cart concurrency, session rehydration, error mapping, metadata, and PWA route generation.
- **Dependencies/regression:** Test fixtures for Payload/Vendure.

## TEST-002 — E2E suite can be green without exercising commerce

- **Category:** Test confidence
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `e2e/commerce.spec.ts:14-25`, `playwright.config.ts:28-32`
- **Evidence:** Commerce tests call `test.skip` when Vendure is unreachable. The only configured project is Desktop Chrome; E2E was not executable in this audit because infrastructure/build was unavailable.
- **Impact:** CI can report green while login/cart/shipping/payment/order flows are untested.
- **Recommended remediation:** Separate required storefront smoke from optional ERP integration; run a deterministic commerce test environment for release, and fail/mark the job appropriately when commerce is required.
- **Dependencies/regression:** Vendure test fixture/environment.

## TEST-003 — No failure-path, authorization, accessibility, or responsive E2E coverage

- **Category:** Test coverage
- **Severity:** P2
- **Confidence:** Confirmed
- **Evidence:** Existing smoke covers root/locale/home/catalog/product/contact/terms/404/lab gate; commerce covers guest happy path and no-proof confirmation. No account auth, invalid login, expired session, 401/403/409/429/500, duplicate click, concurrent mutation, mobile, keyboard-only, or accessibility tests are present.
- **Impact:** Most requested audit dimensions are currently unprotected.
- **Recommended remediation:** Build a critical-journey matrix and require happy/slow/empty/error/unauthorized/mobile/keyboard cases before release.
- **Dependencies/regression:** Stable test data and server fault injection.

---

# 18. Analytics/Observability Findings

## OBS-001 — No analytics or product event tracking was found

- **Category:** Analytics/business observability
- **Severity:** P2 if analytics is a product requirement; otherwise informational
- **Confidence:** Confirmed absence; requirement is UNVERIFIED
- **Location:** Repository-wide search of `src`, `public`, `package.json`, `.github`
- **Evidence:** No GA/Segment/Mixpanel/PostHog/Plausible/Sentry/dataLayer/event implementation or analytics package was found. Privacy copy says the site “may” use analytics, but the code does not implement one.
- **Impact:** No measurable page views, product views, add-to-cart, checkout start, purchase, contact conversion, or consent/audit trail.
- **Recommended remediation:** Confirm business/legal requirements; if required, define a consent-aware event schema and test duplicate/missing events without sending PII.
- **Dependencies/regression:** Privacy policy, consent management, CSP, third-party performance.

## OBS-002 — Logging has no request/correlation ID and errors are only console JSON

- **Category:** Observability/reliability
- **Severity:** P2
- **Confidence:** Confirmed
- **Location:** `src/lib/observability/log.ts:5-25`
- **Evidence:** Logs contain timestamp/level/scope/message/stack and selected context but no request ID, order operation ID, upstream latency, status classification, or centralized error tracker.
- **Impact:** Cross-service debugging of checkout races, timeouts, and user reports is difficult; log volume cannot be tied to a request journey.
- **Recommended remediation:** Add request/correlation IDs, structured latency/status fields, redacted operation context, centralized error/performance monitoring, and alert thresholds.
- **Dependencies/regression:** Hosting/runtime logging and privacy review.

---

# 19. Browser Compatibility Findings

## COMPAT-001 — Required browser/device matrix is not tested

- **Category:** Compatibility
- **Severity:** P2
- **Confidence:** Confirmed absence
- **Location:** `playwright.config.ts`
- **Evidence:** Only Desktop Chrome is configured. No Firefox, WebKit/Safari, Edge, iOS Safari, Android Chrome, touch/orientation, or viewport projects exist.
- **Impact:** Service-worker registration, `next/image`, `backdrop-filter`, fixed/safe-area layout, Base UI sheets, form input behavior, and RTL could fail in unsupported/unverified browsers.
- **Recommended remediation:** Add at least Chromium desktop/mobile, Firefox, and WebKit projects; manually verify real iOS Safari/Android Chrome for PWA, keyboard, viewport, and safe-area behavior.
- **Dependencies/regression:** CI runtime and browser installation cost.

## COMPAT-002 — Private browsing storage behavior is only partially guarded

- **Category:** Compatibility/state
- **Severity:** P3
- **Confidence:** Confirmed code risk
- **Location:** `src/components/npf/install-prompt.tsx:23-35`, `src/components/npf/theme-toggle.tsx:31-35`
- **Evidence:** Install prompt catches `sessionStorage` write in `dismiss` but not the `sessionStorage.getItem` in `getSnapshot`; theme toggle writes `localStorage` without a try/catch.
- **Impact:** Safari/private-mode storage restrictions can throw during render or click and leave the user without a stable theme/install control.
- **Recommended remediation:** Guard all reads/writes and use an in-memory fallback; test private browsing/storage-disabled behavior.
- **Dependencies/regression:** Hydration/useSyncExternalStore behavior.

## COMPAT-003 — Locale switching drops query parameters

- **Category:** Navigation/i18n
- **Severity:** P3
- **Confidence:** Confirmed
- **Location:** `src/components/npf/locale-switcher.tsx:9-14`
- **Evidence:** It transforms `usePathname()` only; pathname excludes the query string. `/en/products?q=foo&category=x` switches to `/ar/products` without filters, and confirmation query `order=` is also dropped.
- **Impact:** Users lose search/filter context and a confirmation page can switch to the no-order state.
- **Recommended remediation:** Preserve safe `useSearchParams()` entries where route semantics require them; intentionally omit sensitive transactional query parameters only with a clear UX message.
- **Dependencies/regression:** SEO/canonical query policy and checkout UX.

---

# 20. Edge Cases / Failure Modes

| Scenario | Observed implementation | Result/risk | Status |
|---|---|---|---|
| Double add click on same product | Per-button `adding`/disabled guard | Protected for same button | Source-confirmed; runtime unverified |
| Add two different products quickly | Independent buttons, shared provider, no sequencing | Stale response can overwrite cart state | Confirmed risk, STATE-002 |
| Quantity click while update pending | Cart controls use provider `isPending` | Mostly serialized in cart page | Source-confirmed |
| Refresh during mutation | Server action may complete while navigation/refresh occurs | No idempotency key or mutation resume | UNVERIFIED; meaningful risk |
| Back during checkout | No draft persistence; active order server state may be mutated by blur requests | User can return to stale form/method state | UNVERIFIED |
| Change address while shipping request pending | Multiple uncancelled actions | Stale shipping response/state | Confirmed risk, API-002 |
| Change payment while shipping request pending | Both mutate active order custom field | Race and wrong discount/method display | Confirmed risk |
| Vendure timeout | No fetch timeout | Public render can hang | Confirmed code risk, REL-001 |
| Vendure refusal/outage | Read catches and returns empty cart/customer | Cart/account can appear empty/signed out | Confirmed, CART-001/STATE-004 |
| 401/session expiry | Most active-customer reads become guest; checkout generic failure | No explicit session recovery | Confirmed behavior from catches; exact backend status unverified |
| 403/422/409/429/500 | Generic coarse errors | No field/retry/conflict-specific recovery | Confirmed, API-003 |
| Malformed upstream JSON | `response.json()` throws; many callers catch generic | No typed malformed-response telemetry/UI | Confirmed code path |
| Empty Payload catalog | Products page has empty result count but still hero/matrix logic | Usable but no dedicated data outage distinction | Partially implemented |
| Thousands of products | `limit: 0` plus one price request per slug | Memory/latency/upstream fan-out | Confirmed architectural risk |
| Stale/deleted wishlist slug | Product action filters null | Partial note works | Source-confirmed |
| Wishlist server action fails | Promise has no catch | Spinner indefinitely | Confirmed, UX-004 |
| Multiple users share one browser | Cart provider state can survive server session change | Display/session mismatch | Confirmed, STATE-001 |
| Guessed order code | Confirmation requires proof cookie or account order list | Good source-level gate | Runtime/backend ownership unverified |
| Account has more orders than API default | Query has no explicit pagination | Older orders may not appear | Highly likely; backend default unverified |
| Invalid locale `/fr/products` | Proxy redirects shaped 2-letter segment to `/ar/products` | Intended and smoke-tested in source suite | Runtime status unverified |
| 320px header | Six mobile controls remain visible | Likely horizontal overflow | Highly likely, RESP-001 |
| 200% zoom | No test; dense header/checkout fixed controls | Potential clipping/reflow | UNVERIFIED |
| Offline public page | Serwist default cache/fallback intended | Build/provider broken; behavior unavailable | UNVERIFIED runtime |
| Offline English page | `/offline` is Arabic-only | Language mismatch | Confirmed code |
| Browser private storage | Unguarded read/write paths | Possible render/click exception | Confirmed risk |
| Long Unicode/invalid input | Contact bounded; checkout/auth mostly not bounded server-side | Data quality/validation risk | Confirmed, FORM-001 |

---

# 21. Technical Debt

1. Mixed package surface: Next storefront, Payload CMS, Vendure server/worker/dashboard, and generated GraphQL types share one TypeScript/build boundary.
2. Unstable/inconsistent integration APIs: Serwist wrapper/route mismatch and Vendure config type errors are caught only by `tsc` after dependency installation.
3. Static mock catalog remains a fallback for live commerce data rather than a clearly versioned last-known-price service.
4. `any` in repository/CMS mapping and migrations weakens contract validation.
5. No typed domain error model across Server Actions.
6. No shared form validation schema between client and server.
7. No route error/loading boundary strategy.
8. No instrumentation for upstream latency, request correlation, price source, or cart mutation concurrency.
9. No browser/device/a11y test matrix.
10. The website has two sources for shipping information: static copy in `dictionaries.ts` and live Vendure calculators.
11. Legal copy and shipping copy include explicit “needs review/reconfirmation” language.
12. The generated/long-form `mock-repository.ts` makes data changes hard to review and can hide asset/content drift.

---

# 22. Root Cause Analysis

## R1 — Release contracts are not aligned with installed dependencies

**Symptoms:** BLD-001, BLD-002, CODE-001, build failure.  
**Root cause:** Package/API upgrades were applied without a clean install/build/typecheck contract, and the repository combines multiple applications in one build boundary.  
**Structural remediation:** Pin compatible versions, make clean install mandatory in CI, separate website and ERP compilation where possible, and make generated code/lint policy explicit.

## R2 — Commerce is treated as a render-time dependency without a typed degraded state

**Symptoms:** REL-001, CART-001, STATE-004, PERF-001, API-003.  
**Root cause:** Root layout reads session state synchronously; transport has no timeout; failures collapse into guest/empty/generic error.  
**Structural remediation:** Bounded transport, typed `success/guest/unavailable/error`, resilient personalized islands, and observability.

## R3 — Checkout state is split between multiple asynchronous client mutations and a final server transaction

**Symptoms:** CHK-001, UX-001, API-002, CHK-002, FORM-001.  
**Root cause:** Blur/payment handlers mutate the active order while client state can be stale; final action silently falls back and does not validate/persist all DTO fields.  
**Structural remediation:** A single typed checkout state machine with request sequencing, authoritative final revalidation, explicit conflict errors, and complete field mapping.

## R4 — Client state is initialized from the server but not reconciled afterward

**Symptoms:** STATE-001, STATE-002, stale cart display.  
**Root cause:** `useState(initialItems)` and unconditional response application lack session identity/versioning.  
**Structural remediation:** Session-keyed provider lifecycle, serialized mutations or sequence IDs, and authoritative re-fetch on conflict.

## R5 — Production hardening is partial rather than policy-driven

**Symptoms:** SEC-001, SEC-002, SEC-003, SEC-004, OBS-001, OBS-002.  
**Root cause:** Individual safeguards exist, but there is no complete redirect policy, CSP policy, distributed abuse policy, public API surface policy, analytics/consent plan, or request observability contract.  
**Structural remediation:** Security headers/redirect/rate-limit/observability standards enforced by tests and deployment checks.

## R6 — Critical user journeys are under-tested at the browser boundary

**Symptoms:** TEST-001–003, RESP-001, A11Y-002, COMPAT-001.  
**Root cause:** Most tests cover pure server logic and only a narrow Chromium happy path; commerce tests can skip.  
**Structural remediation:** Required release E2E environment, failure injection, responsive/a11y projects, and production-like data.

---

# 23. Remediation Roadmap

## P0 — Immediate

No confirmed P0. Continue to treat checkout integrity and release blockers as launch-blocking P1 work.

## P1 — Critical before production

| Issue IDs | Affected files/components | Proposed solution | Dependencies | Testing required |
|---|---|---|---|---|
| BLD-001 | `package.json`, lockfile, CI, Docker | Align Node types/Vitest/Node runtime; regenerate lockfile; clean `npm ci` | Node support policy | Clean install on CI and Docker |
| BLD-002 | Serwist provider/route/layout | Forward `swUrl`; align route options with installed API; build | Serwist/Next version | `tsc`, production build, service-worker registration/update/offline tests |
| BLD-003 | locale layout fonts | Self-host/cache Google fonts or controlled build fetch | Font license and visual approval | Network-restricted build; CLS/font visual tests |
| SEC-001 | login form | Same-origin local redirect allowlist | Protected-flow UX | Unit tests for external, `//`, encoded, javascript, valid local paths |
| REL-001 | Vendure client, locale layout | Timeout/abort, degraded state, decouple public layout | Upstream SLO | Hung/slow/refused Vendure tests; TTFB measurements |
| CART-001 | active order/layout/provider/cart | Distinguish empty/unavailable, retry/preserve safe last-known state | Cart UX/session policy | Outage/reconnect/cart integrity E2E |
| CHK-001 | checkout action/form | Reject stale fulfillment selection; explicit refresh/reselect | Shipping calculator contract | Stale eligibility/concurrency tests |
| CHK-002 | checkout DTO/action/backend mapping | Server validate all fields and persist/route company/notes | Vendure custom field/fulfillment design | Direct action validation and order persistence tests |
| DEP-001 | Dockerfile | Add runnable production runtime stage/command/health contract | Host platform | Build/run image and smoke `/ar`, `/api`, assets, SW |

## P2 — Next

| Issue IDs | Proposed solution |
|---|---|
| UX-001, API-002 | Sequence/debounce/cancel shipping requests; clear stale methods and show retry/error |
| UX-002, UX-003, UX-004 | Surface mutation/fetch failures with localized live-region messaging and retry |
| A11Y-001, A11Y-002, A11Y-003 | Descriptive quantity labels; progressive enhancement for Reveal; add axe/keyboard tests |
| RESP-001, COMPAT-001 | Compact mobile header; add required viewport/browser/device projects |
| SEC-002–005 | CSP, trusted/distributed rate limits, disable playground, SBOM/advisory triage |
| PERF-001–004 | Split personalized shell, batch/cache price reads, stable cached sitemap, font budget |
| STATE-001–004 | Session-keyed cart provider, serialized mutations, storage event, unavailable auth state |
| FORM-001–003 | Shared server/client schema and domain-specific error mapping |
| ARCH-001–003 | Public/personalized boundaries and route loading/error boundaries |
| TEST-001–003 | Required commerce test environment, failure injection, auth/account/a11y/responsive coverage |

## P3 — Improvement

- Filter sitemap/internal links by explicit product indexability status.
- Add `x-default` if SEO policy approves it.
- Preserve filter query state in locale switching where appropriate.
- Guard private-mode storage reads/writes.
- Add request/correlation IDs and upstream latency metrics.
- Add multi-tab wishlist synchronization.
- Refine form field-level messaging and focus restoration.
- Review `any`/generated code lint policy and split large modules.

## P4 — Polish

- Refine icon/button labels and semantic headings where runtime audits identify issues.
- Optimize large public assets/download UX after image/font/LCP measurements.
- Add visual design tokens for any remaining one-off patterns only after functional/accessibility fixes.

---

# 24. Quick Wins

1. Reject non-local login redirects.
2. Add `aria-label` text for quantity increase/decrease.
3. Add `.catch`/error state to wishlist loading.
4. Show cart/address mutation errors instead of discarding them.
5. Preserve locale-switcher query parameters for product filters.
6. Catch private-mode `localStorage`/`sessionStorage` reads/writes.
7. Add explicit no-cache/monitoring policy for sitemap rather than `new Date()` on every URL.
8. Add a route-level `error.tsx` with retry/navigation for public catalog and checkout.
9. Add tests for the already-observed tsc/lint/build gates to prevent regression.
10. Add a mobile header viewport-overflow assertion.

These are safe only after confirming product requirements and should not substitute for the P1 fixes.

---

# 25. Architectural Priorities

Do not patch these as isolated one-off symptoms:

1. **Checkout state machine:** shipping eligibility, payment-dependent pricing, address mutation, selection freshness, final order placement, and error mapping need one authoritative orchestration boundary.
2. **Personalized/public rendering boundary:** cart/customer state should not make every marketing page depend on a no-timeout commerce call.
3. **Commerce/catalog authority:** replace slug/mock/live ad hoc joins with a stable product identity and explicit price freshness/source contract.
4. **Runtime/build separation:** the website build should not be blocked by unrelated ERP/Vendure configuration type errors; the production website container needs a clear runtime artifact.
5. **Release test matrix:** happy-path Chromium unit tests are not enough for a checkout product; failure, authorization, accessibility, mobile, and cross-browser checks must be release requirements.

---

# 26. Production Readiness Gate

## Decision: FAIL

Exact conditions required to change the gate:

1. `npm ci` passes from a clean checkout without peer-dependency bypass.
2. `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass in a network-restricted/reproducible build environment.
3. Serwist provider/route integration is corrected and service-worker registration/update/offline behavior is verified.
4. The deployed/container artifact actually starts Next and serves the website.
5. Login redirect is same-origin constrained and covered by tests.
6. Vendure transport has timeout/degraded-state behavior; public pages do not hang on commerce outage.
7. Cart outage/session/concurrency behavior is reconciled and tested.
8. Checkout rejects stale fulfillment selections, validates server-side, and persists or deliberately removes company/notes with product-owner approval.
9. Shipping refresh races and stale method/error states are fixed.
10. Required legal, shipping-price, product-claim, analytics/consent, and regulatory content is formally verified by the appropriate owner.
11. Chromium mobile/desktop, Firefox, WebKit/Safari, keyboard, accessibility, 200% zoom, and requested viewport tests pass.
12. Runtime security review confirms CSP, rate-limit trust boundary, API/playground exposure, cookies, CORS, and dependency reachability.

---

# TOP 10 THINGS TO FIX FIRST

Ordered by release blocking, user impact, security/reliability risk, and dependency order:

1. **BLD-001 — Make clean `npm ci` pass** by aligning `@types/node`, Vitest, Node, and the lockfile.
2. **BLD-002 — Fix the Serwist/TypeScript integration** and verify service-worker generation/registration.
3. **DEP-001 — Produce a runnable production container** with a tested Next runtime command.
4. **BLD-003 — Remove the build-time Google Fonts network dependency** or make it deterministic and cached.
5. **SEC-001 — Constrain the login redirect** to same-origin local paths and add malicious-input tests.
6. **REL-001 — Add Vendure timeouts and a typed degraded state** so public pages do not hang or misclassify infrastructure failures.
7. **CART-001/STATE-001/STATE-002 — Make cart state authoritative and resilient** across outage, session change, and concurrent mutations.
8. **CHK-001 — Never silently substitute a shipping method**; reject stale selection and require explicit re-selection.
9. **CHK-002/FORM-001 — Validate checkout on the server and persist/route company and notes** rather than silently dropping them.
10. **API-002/UX-001/TEST-002/003 — Fix shipping request races and require real failure/mobile/accessibility E2E coverage** before calling checkout production-ready.

**End of audit.**