# Report 11 — Navigation & Routing Testing — Results & Defect Register

**Project:** NPF — Nile Pharma Food (Next.js 16.3.3 + Payload CMS 3.88 + Vendure 3.7.3)
**Source report:** `docs/testing/11-navigation-routing-testing-report.md` (110 test cases)
**Result date:** 2026-09-21
**Tested by:** QA Agent (Arena)
**Branch:** `arena/01a0c301-npf` (baseline `9025fa5`)
**Environment:** local production build (:3000). Live batteries: `scratch/e2e-patched/nav-probes.spec.ts` (passed — `scratch/artifacts/nav-probes.txt`), a 37-URL status sweep (`curl --max-redirs 0`), per-page `<h1>/<title>` verification, plus `find src/app` route-tree audit and Reports 01–09 cross-evidence.

---

## Executive Summary

| Verdict | Count | Meaning |
|---|---:|---|
| ✅ Pass | 82 | Meets the expected result |
| ⚠️ Partial | 15 | Works with gaps |
| ❌ Fail | 7 | Does not meet the expected result |
| 🚫 N/A | 6 | Feature/technology not present |
| **Total** | **110** | |

**Headline — routing is one of the project's strongest layers:** the `[locale]` dynamic-segment architecture works exactly as designed (measured: `/`→`/ar` 307, every bare path → single-hop `/ar/*` 307, `/fr/*` → `/ar/*`, `/en` LTR + `/ar` RTL with correct `dir` on back/forward/refresh), **every footer/header link resolves to a real page** (terms/privacy/careers/blogs/shipping-delivery/quality-sourcing all 200 with proper `<h1>`/`<title>` — verified by content this session), **scroll restoration works perfectly** (800px → back → 800px measured), protected routes soft-gate to `login?redirect=…`, and deep links are shareable. The ❌ rows are concentrated in known gaps: **no skip link** (F-34), **no `aria-current`** (F-62 new), **no error/500 boundary** (F-02), **broken offline fallback** (F-14), **no header search** (F-24), **no social links** (F-23).

**New defects:** F-62 (register continues at F-61 from Report 10).

---

## Notable Evidence (this session)

```
STATUS SWEEP (37 URLs): / →307 /ar · every bare path →307 /ar/* (single hop) · /ar /en /offline
  /manifest.webmanifest /robots.txt /sitemap.xml /admin = 200 · /api/graphql GET = 405 (good)
FOOTER TRUTH: /ar/terms /ar/privacy-policy /ar/careers /ar/blogs /ar/shipping-delivery
  /ar/quality-sourcing /ar/wishlist = **200 + real <h1>/<title>** (h1s: الشروط والأحكام، سياسة
  الخصوصية، الوظائف، المدونة، الشحن والتوصيل، الجودة والمصادر، قائمة المفضلة)
  → the source report's premise that these pages "don't exist" is FALSE (route tree confirms dirs)
GHOST SLUGS (404, and NOT linked from current footer): /ar/shipping-and-delivery /ar/payment-methods
  /ar/health-protocols /ar/articles  ·  /ar/events = 404 (root /events still 307→/about = F-23-era rule)
HEADER: logo → /ar ✓ sticky ✓ 8-link nav + CTA + login/wishlist/cart + EN switcher
LOC: AR→EN click → /en dir=ltr; back → /ar dir=rtl; forward → /en dir=ltr; refresh persists ✓
HISTORY: back/forward ✓ · scroll restoration before=800 afterBack=800 ✓ · refresh keeps page ✓
DEEP: PDP 200 · /ar/account guest → /ar/login?redirect=%2Far%2Faccount ✓ · order confirmation
  without proof → 404 (notFound() — secure) · META: per-route titles ✓, home canonical NONE (F-45)
DEV: hamburger at 360px ✓ · bottom-nav hidden at ≥lg ✓ · PAGE ERRORS: none
```

## Results — Route Configuration (6 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-CONFIG-001 | Route File Structure | ✅ | `find src/app` matches the documented structure: `(payload)/admin [[...segments]]`, `api/[...slug]`, `[locale]/*` (22 route dirs incl. `blogs`, `careers`, `terms`, `privacy-policy`, `shipping-delivery`, `quality-sourcing`, `wishlist`, `lab/hero-abstract`), `[locale]/[...catchall]`, fonts. |
| NAV-CONFIG-002 | Route Metadata | ✅ | Per-route `<title>` measured («المنتجات \| نايل فارما فود» etc). Canonical/og gaps separately filed (F-45/F-46/F-47). |
| NAV-CONFIG-003 | Route Parameters | ✅ | `[slug]` PDP + `[code]` order + `?category=` filters all resolve (measured). |
| NAV-CONFIG-004 | Catch-all Routes | ✅ | `[locale]/[...catchall]` → 404 render (measured `/ar/xyz`); admin `[[...segments]]` serves Payload. |
| NAV-CONFIG-005 | Parallel Routes | 🚫 | Not used in this architecture. |
| NAV-CONFIG-006 | Intercepting Routes | 🚫 | Not used. |

## Results — URL Structure (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-URL-001 | Localized URLs | ✅ | `/ar/*` RTL + `/en/*` LTR measured; `dir` attribute follows locale. |
| NAV-URL-002 | URL Consistency | ✅ | Uniform `/[locale]/segment` pattern across 22 dirs; sitemap parity ar/en (72 URLs — Report 07). |
| NAV-URL-003 | Clean URLs | ✅ | No trailing-slash/index artifacts (sweep). |
| NAV-URL-004 | URL Parameters | ✅ | `?category=supplements` footer links load filtered listing (measured 200). |
| NAV-URL-005 | URL Hash | ✅ | Hash anchors (e.g. home `#sections`) handled natively; `/about#x` documented 2-hop redirect (F-13-era note). |

## Results — Header Navigation (9 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-HDR-001 | Header Visibility | ✅ | 96px sticky header on all pages (Report 02 UI-HDR-001 + today `position:sticky`). |
| NAV-HDR-002 | Logo Navigation | ✅ | Logo href `→ /ar` **measured working today** (Report 02 UI-HDR-003). |
| NAV-HDR-003 | Main Navigation Menu | ✅ | 8 links + CTA measured (home/about/story/products/blogs/quality-sourcing/careers/contact). |
| NAV-HDR-004 | Mobile Menu | ✅ | Sheet opens with all links (Report 01 FT-NAV-003; F-06 dup-name + F-35 trap noted). |
| NAV-HDR-005 | Cart Indicator | ✅ | Badge + cart link sync (Report 02 UI-HDR-005 + API-INT-010). |
| NAV-HDR-006 | Account Links | ✅ | Login/wishlist/account cluster measured. |
| NAV-HDR-007 | Language Switcher | ✅ | `EN` ↔ `AR` hreflang switcher measured (see NAV-LOC-002). |
| NAV-HDR-008 | Search Bar | ❌ | **No search in the header** — search lives only on the catalog listing — **F-24** (filed). |
| NAV-HDR-009 | Sticky Header | ✅ | `position:sticky top:0` measured after 1200px scroll (Report 02). |

## Results — Footer Navigation (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-FTR-001 | Footer Visibility | ✅ | 3-column footer on all pages (Report 02 UI-FTR-001). |
| NAV-FTR-002 | Footer Links | ✅ | **All 13 links resolve** (today: every href 200 + real page `<h1>`; legal pages verified by content). |
| NAV-FTR-003 | Social Media Links | ❌ | No social links/icons anywhere — **F-23** (filed). |
| NAV-FTR-004 | Copyright Information | ✅ | «جميع الحقوق محفوظة» measured. |
| NAV-FTR-005 | Footer Layout | ✅ | Responsive columns (Report 02/03). |

## Results — Bottom Navigation (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-BNAV-001 | Bottom Navigation Visibility | ✅ | Mobile tab bar exists (`bottom-nav.tsx`, `hidden lg:` up = desktop-hidden; F-06 dup-name proves it renders) — hidden ≥1024 measured today. |
| NAV-BNAV-002 | Bottom Navigation Icons | ✅ | Icon tab items (Report 02 sheet/tab captures). |
| NAV-BNAV-003 | Bottom Navigation Badge | ✅ | `cart-indicator` count pill (Report 02 UI-HDR-005). |
| NAV-BNAV-004 | Bottom Navigation Active State | ⚠️ | No `aria-current`/active styling detected on nav items (F-62). |
| NAV-BNAV-005 | Bottom Navigation Touch Targets | ⚠️ | 20px text-link targets measured on nav/footer/sheet — **F-30** (filed). |

## Results — Locale Switching (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-LOC-001 | Locale Switcher Visibility | ✅ | Header `EN`/`AR` link measured. |
| NAV-LOC-002 | Locale Switching | ✅ | AR→EN click → `/en` + `dir=ltr`; back → `/ar` `dir=rtl`; forward `dir=ltr` — measured consistent (inline-`lang` token gap = F-38). |
| NAV-LOC-003 | Locale Persistence | ✅ | Refresh on `/en` stays LTR `/en` (measured). |
| NAV-LOC-004 | Locale in URL | ✅ | Path-prefixed `/ar` `/en` (architecture + sweep). |
| NAV-LOC-005 | Locale Detection | ⚠️ | `/` → `/ar` unconditionally; `Accept-Language` ignored — **F-51** (filed). |

## Results — Page Navigation (23 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-PAGE-001 | Homepage Navigation | ✅ | `/ar` + `/en` 200 (sweep). |
| NAV-PAGE-002 | Homepage Content | ✅ | Sections render (Report 01 visibility suite ×12). |
| NAV-PAGE-003 | Product Listing Navigation | ✅ | `/products` + `?category=` measured. |
| NAV-PAGE-004 | Product Detail Navigation | ✅ | Card «عرض التفاصيل» → PDP (Report 01). |
| NAV-PAGE-005 | Product Category Navigation | ✅ | 5 category routes (Report 07 sitemap). |
| NAV-PAGE-006 | Cart Navigation | ✅ | Header/bottom → `/cart` measured. |
| NAV-PAGE-007 | Checkout Navigation | ✅ | Cart → checkout live (Report 01). |
| NAV-PAGE-008 | Checkout Step Navigation | ✅ | Single-page sections + disabled-until-shipping (Report 10 FORM-CK-003). |
| NAV-PAGE-009 | Account Dashboard Navigation | ✅ | `/account` renders for sessions (Report 01). |
| NAV-PAGE-010 | Account Sub-Page Navigation | ✅ | profile/addresses/orders measured. |
| NAV-PAGE-011 | Order Detail Navigation | ✅ | `/account/orders/[code]` renders with proof/session (Report 01); guests → login redirect (measured today). |
| NAV-PAGE-012 | Login Page Navigation | ✅ | `/login` 200 (sweep). |
| NAV-PAGE-013 | Registration Page Navigation | ✅ | `/register` 200 (sweep). |
| NAV-PAGE-014 | Logout Navigation | ✅ | Returns to public pages with session cleared (Report 01). |
| NAV-PAGE-015 | About Page Navigation | ✅ | `/about` 200 (h1 «من نحن» meta measured). |
| NAV-PAGE-016 | Contact Page Navigation | ✅ | `/contact` 200 (form battery — Report 10). |
| NAV-PAGE-017 | Privacy Policy Navigation | ✅ | **`/ar/privacy-policy` 200 + h1 «سياسة الخصوصية» verified today.** |
| NAV-PAGE-018 | Terms Page Navigation | ✅ | **`/ar/terms` 200 + h1 «الشروط والأحكام» verified today.** |
| NAV-PAGE-019 | Careers Page Navigation | ✅ | **`/ar/careers` 200 + h1 «الوظائف» verified today.** |
| NAV-PAGE-020 | Shipping & Delivery Navigation | ✅ | **`/ar/shipping-delivery` 200 + h1 «الشحن والتوصيل»** (note: spec's slug `shipping-and-delivery` is a ghost → 404). |
| NAV-PAGE-021 | Quality Sourcing Navigation | ✅ | **`/ar/quality-sourcing` 200 + h1 «الجودة والمصادر».** |
| NAV-PAGE-022 | Story Page Navigation | ✅ | `/ar/story` 200 (sweep). |
| NAV-PAGE-023 | Blogs Page Navigation | ✅ | **`/ar/blogs` 200 + h1 «المدونة»** (blogs are noindexed by design — SEO-07). |

## Results — Dynamic Routes (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-DYN-001 | Product Detail Dynamic Route | ✅ | `products/[slug]` resolves real slug (200) + invalid slug → product-not-found 404 (Report 01). |
| NAV-DYN-002 | Order Detail Dynamic Route | ✅ | `account/orders/[code]` resolves real orders (Report 01) / gates guests. |
| NAV-DYN-003 | Category Dynamic Route | ✅ | Query-param categories (`?category=`) resolve (measured). |
| NAV-DYN-004 | Invalid Dynamic Route | ✅ | `/products/no-such-slug` + `/category/no-such` → not-found experience (sweep + Report 01). |
| NAV-DYN-005 | Catch-all Route | ✅ | `/ar/غير-موجود-xyz` → 404 page «الصفحة غير موجودة» (measured). |

## Results — Auth Navigation (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-AUTH-001 | Protected Route Access (Unauthenticated) | ✅ | `/ar/account` + `/ar/account/orders/X` guest → `/ar/login?redirect=%2Far%2Faccount` (measured today). |
| NAV-AUTH-002 | Protected Route Access (Authenticated) | ✅ | Sessions render account pages (Report 01 suite). |
| NAV-AUTH-003 | Redirect After Login | ⚠️ | Redirect works but **always rewrites target to `/ar/account`** (deep links like `/account/orders` lost) — **F-07** (filed). |
| NAV-AUTH-004 | Redirect After Logout | ✅ | Session cleared + public pages (Report 01 FT-AUTH-005). |
| NAV-AUTH-005 | Session Expiration | ⚠️ | Cookies live 1 year (**F-56**); server-side revocation path untested (no expiry UI). |

## Results — Redirects (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-REDIR-001 | HTTP to HTTPS Redirect | ⚠️ | Deploy-edge concern; HSTS preconfigured (Report 08 SEC-SERVER-001). |
| NAV-REDIR-002 | WWW ↔ Non-WWW | 🚫 | No domain-edge in sandbox (canonical = apex `nilepharmafood.com`). |
| NAV-REDIR-003 | Redirect Chains | ⚠️ | All bare paths = **single-hop** 307 (measured); hash deep-links like `/about#x` take 2 hops (known quirk). |
| NAV-REDIR-004 | Redirect Speed | ✅ | Instant 307s across the 37-URL sweep (12s total incl. latencies). |
| NAV-REDIR-005 | Redirect Loop Prevention | ✅ | No loops in sweep or journey runs. |

## Results — Browser History (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-HIST-001 | Back Button | ✅ | SPA back works (measured URL + scroll). |
| NAV-HIST-002 | Forward Button | ✅ | Works incl. locale switch states (measured dir=ltr forward). |
| NAV-HIST-003 | History State | ✅ | App Router history segments consistent (measured sequence). |
| NAV-HIST-004 | Scroll Restoration | ✅ | **800px → navigate → back → 800px** (measured). |
| NAV-HIST-005 | Programmatic Navigation | ✅ | Server-action redirects (login/register/checkout) live (Report 01). |

## Results — Error Handling (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-ERR-001 | 404 Page | ✅ | «الصفحة غير موجودة» + brand title (measured). |
| NAV-ERR-002 | 500 Page | ❌ | **No `error.tsx`/`global-error.tsx`** — runtime errors show raw Next failure — **F-02** (filed). |
| NAV-ERR-003 | Error Boundary | ❌ | Same root (F-02) — no catch boundaries for RSC/client throws. |
| NAV-ERR-004 | Loading State | ✅ | `template.tsx` + per-action pending labels + tinted image boxes (F-22 = unused skeleton noted). |
| NAV-ERR-005 | Network Error Handling | ⚠️ | Form error panels with retry + mailto fallback ✓; **PWA offline fallback broken for uncached URLs — F-14** (filed). |

## Results — Accessibility (6 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-A11Y-001 | Keyboard Navigation | ✅ | Full keyboard suite passed (Report 04 A11Y-01/02 family + Report 05). |
| NAV-A11Y-002 | Screen Reader Navigation | ⚠️ | Landmarks/labels partial (F-37: 5/6 navs unlabeled; F-38 inline lang). |
| NAV-A11Y-003 | Skip Links | ❌ | **No skip link exists** — first Tab = logo — **F-34** (filed, High). |
| NAV-A11Y-004 | ARIA Current | ❌ | `header a[aria-current]` = **none** (measured today) — **F-62** (new). |
| NAV-A11Y-005 | Focus Management | ⚠️ | Sheet focus trap leaks after wrap — **F-35** (filed). |
| NAV-A11Y-006 | Landmark Roles | ⚠️ | Multiple `<nav>` without distinguishing `aria-label`s — **F-37** (filed). |

## Results — Performance (4 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-PERF-001 | Navigation Speed | ✅ | Desktop nav p50 285ms / mobile 1322ms / transition 185ms (Report 06 perf-journeys). |
| NAV-PERF-002 | Route Prefetching | ✅ | Next `<Link>` prefetch payloads observed (Report 06 PERF-CLIENT-003). |
| NAV-PERF-003 | Bundle Splitting | ⚠️ | Route chunks split ✓ but a 737KB vendor chunk rides first load — **F-42** (filed). |
| NAV-PERF-004 | Lazy Loading | ✅ | Dynamic imports (PDP carousel, reveal) + native `loading=lazy` images (Report 06). |

## Results — Deep Links (4 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-DEEP-001 | Direct URL Access | ✅ | Cold loads of 22 routes = 200/307-correct (sweep + probes). |
| NAV-DEEP-002 | Deep Link with Parameters | ✅ | `?category=`, order `[code]`, PDP `[slug]` shared URLs resolve (measured). |
| NAV-DEEP-003 | Deep Link with Hash | ✅ | Native hash handling (no special suppression). |
| NAV-DEEP-004 | Deep Link Sharing | ✅ | Locale-prefixed canonical URLs + hreflang parity (Report 07: 9/9 hreflang). |

## Results — PWA Navigation (4 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-PWA-001 | Offline Navigation | ⚠️ | Cached routes (e.g. `/ar`) render offline ✓ — F-14 covers the rest. |
| NAV-PWA-002 | Offline Fallback | ❌ | **Uncached URL offline → browser error page instead of `/offline`** — **F-14** (filed, High). (`/offline` itself renders 200 — the fallback wiring is the bug.) |
| NAV-PWA-003 | Service Worker Navigation | ✅ | Serwist SW registers + serves cached documents (Report 01 PWA checks). |
| NAV-PWA-004 | Install Navigation | ✅ | `install-prompt` (`role="status"`) surfaces install (Report 05). |

## Results — Device Navigation (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-DEV-001 | Desktop Navigation | ✅ | 8-link header nav (measured today + Report 02). |
| NAV-DEV-002 | Tablet Navigation | ✅ | Report 03 breakpoint suite. |
| NAV-DEV-003 | Mobile Navigation | ⚠️ | Hamburger at 360px measured ✓; bottom-nav presence inconsistent in automated probe (renders per F-06/Report 02 — hydration suspicion F-12). |
| NAV-DEV-004 | Touch Navigation | ⚠️ | Works, but 20px link targets below 44px guidance — **F-30** (filed). |
| NAV-DEV-005 | Orientation Change | ✅ | Viewport switch 360↔1280 reflows header/nav correctly (measured). |

## Results — Browser Navigation (4 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| NAV-BROW-001 | Chrome Navigation | ✅ | Chromium 153 — all probes today. |
| NAV-BROW-002 | Firefox Navigation | 🚫 | Not installable (CDN-blocked sandbox). |
| NAV-BROW-003 | Safari Navigation | 🚫 | Same. |
| NAV-BROW-004 | Edge Navigation | 🚫 | Same. |

---

## Defect Register (new — continues F-61)

| ID | Sev | Finding | Cases | Recommendation |
|---|---|---|---|---|
| **F-62** | Low | **No `aria-current` on the active nav item** (measured: zero `header a[aria-current]`) — screen-reader/keyboard users can't tell which page they're on. | NAV-A11Y-004, NAV-BNAV-004 | Set `aria-current="page"` on the matching header/bottom-nav link. |

**Cross-referenced (open):** F-02 (no error/500 boundary — NAV-ERR-002/003 ❌), F-07 (login redirect drops deep target), F-12 (pre-hydration clicks), F-14 (offline fallback — NAV-PWA-002 ❌), F-23 (no social links — NAV-FTR-003 ❌), F-24 (no header search — NAV-HDR-008 ❌), F-30 (20px targets), F-34 (no skip link — NAV-A11Y-003 ❌), F-35 (sheet trap), F-37 (unlabeled navs), F-38 (inline lang), F-42 (vendor chunk), F-45/F-46 (canonical/og), F-51 (Accept-Language), F-56 (1-year sessions).

## Spec Corrections (Report 11)

1. **The spec's premise that legal/careers/blogs/shipping pages "do not exist" is wrong** — verified live today: `/ar/terms`, `/ar/privacy-policy`, `/ar/careers`, `/ar/blogs`, `/ar/shipping-delivery`, `/ar/quality-sourcing`, `/ar/wishlist` all render real pages with proper `<h1>`/`<title>`. What *doesn't* exist are the ghost slugs `shipping-and-delivery`, `payment-methods`, `health-protocols`, `articles` — which the current footer does **not** link.
2. **NAV-CONFIG-005/006, NAV-REDIR-002, NAV-BROW-002/003/004** — features/technologies not present (parallel/intercepting routes, domain-edge redirects, other browsers). Each row states which.
3. `/events` behavior: root `/events` → 307 → `/about` (middleware rule, F-23-era), while `/ar/events` → 404 (no such page) — both measured.

---

## Final Tally

| Group | Total | ✅ | ⚠️ | ❌ | 🚫 |
|---|---:|---:|---:|---:|---:|
| NAV-CONFIG | 6 | 4 | 0 | 0 | 2 |
| NAV-URL | 5 | 5 | 0 | 0 | 0 |
| NAV-HDR | 9 | 8 | 0 | 1 | 0 |
| NAV-FTR | 5 | 4 | 0 | 1 | 0 |
| NAV-BNAV | 5 | 3 | 2 | 0 | 0 |
| NAV-LOC | 5 | 4 | 1 | 0 | 0 |
| NAV-PAGE | 23 | 23 | 0 | 0 | 0 |
| NAV-DYN | 5 | 5 | 0 | 0 | 0 |
| NAV-AUTH | 5 | 3 | 2 | 0 | 0 |
| NAV-REDIR | 5 | 2 | 2 | 0 | 1 |
| NAV-HIST | 5 | 5 | 0 | 0 | 0 |
| NAV-ERR | 5 | 2 | 1 | 2 | 0 |
| NAV-A11Y | 6 | 1 | 3 | 2 | 0 |
| NAV-PERF | 4 | 3 | 1 | 0 | 0 |
| NAV-DEEP | 4 | 4 | 0 | 0 | 0 |
| NAV-PWA | 4 | 2 | 1 | 1 | 0 |
| NAV-DEV | 5 | 3 | 2 | 0 | 0 |
| NAV-BROW | 4 | 1 | 0 | 0 | 3 |
| **TOTAL** | **110** | **82** | **15** | **7** | **6** |

## Reproduction Appendix

```bash
export LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp PLAYWRIGHT_BASE_URL=http://localhost:3000
cd /home/user/NPF && npx playwright test --config /home/user/scratch/pw-extra.config.mjs \
  /home/user/scratch/e2e-patched/nav-probes.spec.ts --workers=1
cat /home/user/scratch/artifacts/nav-probes.txt
# status sweep (37 URLs) + per-page <h1>/<title> checks as run this session
for p in /ar/terms /ar/privacy-policy /ar/careers /ar/blogs /ar/shipping-delivery; do
  curl -s "http://localhost:3000$p" | grep -o "<h1[^>]*>[^<]*</h1>"; done
```

**Sign-off:** Report 11 executed in full (110/110 classified with live + source evidence). **82 ✅ / 15 ⚠️ / 7 ❌ / 6 🚫.** Navigation/routing architecture is production-solid; the ❌ set is fully covered by the open register (F-02/F-14/F-23/F-24/F-34/F-62). Ready for Report 12.
