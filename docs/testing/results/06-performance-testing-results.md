# Report 06 — Performance Testing — Results & Defect Register

**Project:** NPF — Nile Pharma Food (Next.js 16.3.3 + Payload CMS 3.88 + Vendure 3.7.3)
**Source report:** `docs/testing/06-performance-testing-report.md` (64 test cases)
**Result date:** 2026-09-21
**Tested by:** QA Agent (Arena)
**Branch:** `arena/01a0c301-npf` (baseline `9025fa5`)
**Environment:** local production build (`next start` :3000), Vendure :3001, PostgreSQL 16.14 :5432, sandbox CPU (1 core class), no CDN/TLS. Lighthouse 12 via `CHROME_PATH=/tmp/chromium` (mobile emulation default: Slow-4G + 4× CPU throttle).

---

## Executive Summary

| Verdict | Count | Meaning |
|---|---:|---|
| ✅ Pass | 40 | Meets the expected result |
| ⚠️ Partial | 14 | Works but misses budget/target in a documented dimension (mostly mobile-emulated) |
| ❌ Fail | 2 | Does not meet the expected result |
| 🚫 N/A | 8 | Not measurable in this sandbox (battery/CDN/DNS/SSL/RUM/soak) |
| **Total** | **64** | |

**Headline — two performance worlds:**
- **Real desktop/lab network: excellent.** Every page: **LCP 192–680 ms**, FCP 164–580 ms, TTFB 23–110 ms, **CLS 0.000 on all 9 pages**, journey hops 185–1322 ms, Vendure API p50 **8 ms**.
- **Lighthouse mobile emulation: 0.58** (FCP 3.1 s / LCP 6.7 s / TBT 390 ms) — driven by **36 font-subset requests (803 KB)**, a **297 KB CSS asset**, and ~121 KB unused JS. Lighthouse SEO **100** and Best-Practices **100**, Accessibility 97 (ties to Report 05 F-36).
- **Stability under fire:** 10/50/100 concurrent bursts → **0 errors** (p50 1 s → 3 s → 4.8 s on the 1-core sandbox).

**New defects:** F-40 … F-44. Continues the global register after Report 05's F-39.

---

## Methodology

1. **Playwright perf audit** (`scratch/e2e-patched/perf-audit.spec.ts`, 4/4): Navigation Timing + FCP/LCP/CLS + per-type resource bytes on 9 pages; mobile CDP 4G-throttled run; long-task/memory scroll probe.
2. **Lighthouse 12** (mobile emulation): `/ar` full run — performance/seo/accessibility/best-practices + 20 audit metrics.
3. **Load probe** (`scratch/load-test.mjs`): bursts of 10/50/100 concurrent GETs + 20 serial Vendure `shop-api` queries (p50/p95/max/errors/RPS).
4. **Bundle forensics** — `.next/static` inventory (117 JS chunks, top sizes, CSS, font counts).
5. **Header probes** — `curl -I` for cache/ETag/HTTP-version/next/image + journey timings (`perf-journeys.spec.ts`).

---

## Key Measurements

### Per-page vitals (desktop, cold load, Chromium 153)

| Page | TTFB | DCL | Load | FCP | LCP | CLS | Req | Weight |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| /ar (home) | 72ms | 406 | 728 | 580 | **680** | **0** | 64 | 729KB |
| /ar/products | 75ms | 168 | 382 | 248 | 408 | 0 | 78 | 1.8MB |
| PDP (proxeed-plus) | 110ms | 337 | 410 | 352 | 352 | 0 | 80 | 1.8MB |
| /ar/cart | 38ms | 157 | 293 | 192 | 192 | 0 | 85 | 1.8MB |
| /ar/checkout | 46ms | 128 | 272 | 184 | 184 | 0 | 87 | 1.9MB |
| /ar/contact | 32ms | 203 | 375 | 240 | 240 | 0 | 82 | 1.9MB |
| /ar/login | 27ms | 123 | 256 | 164 | 164 | 0 | 88 | 1.8MB |
| /ar/account | 23ms | 140 | 297 | 180 | 180 | 0 | 88 | 1.8MB |
| /ar/about | 33ms | 124 | 396 | 176 | 176 | 0 | 79 | 1.9MB |
| **home @ mobile 4G throttle** | 63ms | 1254 | 4412 | 1412 | **2588** | 0.04 | 46 | 680KB |

### Lighthouse (mobile emulation) — `/ar`

| Category | Score | Key metrics |
|---|---:|---|
| Performance | **0.58** | FCP 3.1s · LCP 6.7s · TBT 390ms · CLS 0 · SI 5.5s · TTI 6.7s |
| Accessibility | 0.97 | (contrast items — Report 05 F-36) |
| Best Practices | **1.00** | — |
| SEO | **1.00** | title/description/lang/hreflang/crawlable all 1 |

### Load probe (sandbox, 1 core)

| Scenario | p50 | p95 | errors | RPS |
|---|---:|---:|---:|---:|
| GET /ar ×10 | 1019ms | 1039ms | **0** | 9 |
| GET /products ×10 | 667ms | 668ms | **0** | 15 |
| PEAK /ar ×50 | 3011ms | 3728ms | **0** | 13 |
| PEAK /pdp ×50 | 3664ms | 3668ms | **0** | 14 |
| SPIKE /ar ×100 | 4786ms | 5563ms | **0** | 18 |
| Vendure shop-api ×20 | **8ms** | 36ms | 0 | — |

### Journeys (client-side transitions)

`home→products 285ms` · `products→pdp 1322ms` · `pdp→login 185ms` (RSC prefetch + client nav; cart/checkout flows add-to-cart feedback <1s per Report 01 journeys).

---

## Results — Core Web Vitals (4 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-CWV-001 | Largest Contentful Paint | ⚠️ | Desktop LCP **192–680ms** (all "good" ≪2.5s) and real-4G mobile 2.59s (borderline good) — but **Lighthouse mobile emulation LCP 6.7s** (poor). Split verdict → F-40. |
| PERF-CWV-002 | FID / INP | ⚠️ | Desktop interactions instant (journey hops 185–285ms); LH mobile **TBT 390ms** (>200ms budget) from CPU-throttled JS — INP risk on low-end devices. |
| PERF-CWV-003 | Cumulative Layout Shift | ✅ | **CLS 0.000 on all 9 desktop pages**; 0.04 mobile-4G; LH 0. Screenshot-verified stable (aspect-boxed images, reserved frames). |
| PERF-CWV-004 | Core Web Vitals Overall | ⚠️ | 2 of 3 CWV good in field-like conditions; the mobile-emulated profile drags the overall score (F-40). |

## Results — Page Load (8 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-PL-001 | Homepage Load | ✅ | FCP 580 / LCP 680 / load 728ms desktop. |
| PERF-PL-002 | Product Listing Load | ✅ | FCP 248 / LCP 408ms. |
| PERF-PL-003 | Product Detail Load | ✅ | LCP 352ms (text-block LCP — image LCP path also <700ms in Report 02 shots). |
| PERF-PL-004 | Cart Load | ✅ | FCP/LCP 192ms. |
| PERF-PL-005 | Checkout Load | ✅ | FCP/LCP 184ms. |
| PERF-PL-006 | Account Pages Load | ✅ | login 164ms, account 180ms. |
| PERF-PL-007 | Static Pages Load | ✅ | about 176ms, contact 240ms. |
| PERF-PL-008 | Admin Panel Load | ✅ | Payload admin `/admin` responds 200 (TTFB 358ms first hit after boot). |

## Results — Runtime (8 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-RT-001 | JavaScript Execution | ✅ | TBT desktop negligible; JS heap **9.5MB** after full scroll. |
| PERF-RT-002 | Rendering Performance | ✅ | Scroll-through produced **1 long task** total (budget-healthy). |
| PERF-RT-003 | Animation Performance | ✅ | 0.2s transitions + Embla carousels + marquee — no jank frames observed; marquee is compositor `transform`-based. |
| PERF-RT-004 | Scroll Performance | ✅ | 3000px scroll probe: smooth, 1 long task, reveals fire without hitches. |
| PERF-RT-005 | Input Responsiveness | ✅ | Click→navigation hops 185–285ms; form input typing latency imperceptible (typed-value probe Report 05). |
| PERF-RT-006 | Memory Usage | ✅ | 9.5MB usedJSHeapSize after full-home interaction; no growth pattern across navigations observed. |
| PERF-RT-007 | CPU Usage | ⚠️ | Idle CPU minimal, but mobile-emulated TBT 390ms shows meaningful main-thread JS cost under 4× throttle (bundle JS ~890KB inner pages). |
| PERF-RT-008 | Battery Impact | 🚫 | No battery/energy telemetry in headless sandbox. |

## Results — Network (6 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-NET-001 | Resource Loading | ✅ | 46–88 requests/page, gzip `content-encoding` measured; images tiny (44–100KB/page via next/image). Font sub-quantity noted under BUNDLE-005/007. |
| PERF-NET-002 | HTTP/2 Performance | ⚠️ | Local `next start` speaks HTTP/1.1 (no TLS terminator here). HSTS header preconfigured (`max-age=63072000`); verify h2/h3 at deploy edge. |
| PERF-NET-003 | Caching Performance | ✅ | Static chunks: `Cache-Control: public, max-age=31536000, immutable` + ETag (measured). HTML `no-store` (correct for SSR/session pages). `/_next/image` 200 with correct headers. |
| PERF-NET-004 | CDN Performance | 🚫 | No CDN in local environment. |
| PERF-NET-005 | DNS Performance | 🚫 | localhost resolution only. |
| PERF-NET-006 | SSL/TLS Performance | 🚫 | Local HTTP only; production TLS is deploy-layer. |

## Results — Bundle (9 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-BUNDLE-001 | Main Bundle Size | ⚠️ | Largest raw chunk **737KB** (`5f45121c…`) + 335KB + 329KB + 236KB follow — shared-vendor chunk wants splitting. LH "unused-javascript" estimates **121KB** trimmable. |
| PERF-BUNDLE-002 | Total JavaScript Size | ⚠️ | 117 chunks / 3.5MB raw static JS; per-page **encoded** transfer 280KB (home) to ~890KB (inner pages) — above the 500KB-class comfort budget. |
| PERF-BUNDLE-003 | Total CSS Size | ⚠️ | One **297KB** CSS asset + 21KB + 5KB. The 297KB file dominates first render (F-41). |
| PERF-BUNDLE-004 | Total Image Size | ✅ | 15–100KB/page — next/image responsive + optimized formats. |
| PERF-BUNDLE-005 | Total Font Size | ⚠️ | **36 font requests / 803KB** per inner page (18/355KB home) — per-glyph Arabic subsets explode request count (F-40 root cause #1). |
| PERF-BUNDLE-006 | Total Page Weight | ✅ | 680KB–1.9MB per page (under the 3MB red line). |
| PERF-BUNDLE-007 | Number of Requests | ⚠️ | 64–88/page; the 36 fonts are 40%+ of requests — consolidate subsets (`unicode-range` fewer files) or `preload` critical ones. |
| PERF-BUNDLE-008 | Code Splitting | ✅ | Route-level splitting evident (home ships 280KB JS vs 890KB inner — heavy vendor shared, per-route deltas present). |
| PERF-BUNDLE-009 | Tree Shaking | ✅ | Only ~121KB unused-JS estimated by Lighthouse — production build prunes well. |

## Results — Server (7 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-SERVER-001 | Server Response Time | ✅ | TTFB **23–110ms** across 9 pages (Lighthouse server-response-time 60ms). |
| PERF-SERVER-002 | Database Query Performance | ✅ | Vendure p50 **8ms**/p95 36ms per products query; Payload seed wrote 8 products + taxonomy in 2.5s. |
| PERF-SERVER-003 | API Endpoint Performance | ✅ | `shop-api` measured above; storefront server actions complete <1s (Reports 01–02 flows). |
| PERF-SERVER-004 | Payload CMS Performance | ✅ | `/admin` 200 at 358ms TTFB post-boot. |
| PERF-SERVER-005 | Vendure API Performance | ✅ | p50 8ms under serial load; GraphQL route healthy (`/health` 200). |
| PERF-SERVER-006 | Static Site Generation | ✅ | `npm run build` **79s**; route table shows static/SSG/dynamic split as designed. |
| PERF-SERVER-007 | Server-Side Rendering | ✅ | DCL 123–406ms (SSR HTML complete + hydrating early). |

## Results — Mobile (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-MOB-001 | Mobile Page Load | ⚠️ | LH mobile perf **0.58** (LCP 6.7s emulated); real-4G CDP run much better (LCP 2.59s, FCP 1.4s). Targeted fixes in F-40. |
| PERF-MOB-002 | Mobile Runtime | ✅ | 375px interactions, sheet, carousels smooth (Reports 02/03 + today's scroll probe). |
| PERF-MOB-003 | Mobile Network | ⚠️ | 4G profile loads 680KB/46 requests for home — fine except the font storm + render CSS (F-40/41). |
| PERF-MOB-004 | Mobile Battery Impact | 🚫 | Not measurable headless. |
| PERF-MOB-005 | Mobile Memory | ✅ | 9.5MB heap in mobile context. |

## Results — Offline (4 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-OFFLINE-001 | Service Worker Registration | ✅ | Registered/activated + `controller` true (Report 01 PWA suite + re-probed). |
| PERF-OFFLINE-002 | Cached Resource Loading | ✅ | Precache served `/ar` offline in <1s (Report 01 offline-check v2). |
| PERF-OFFLINE-003 | Offline Page Loading | ❌ | **F-14 open:** uncached URLs offline render `chrome-error://` — the `/offline` fallback never appears. |
| PERF-OFFLINE-004 | Offline Fallback Performance | ❌ | Same root cause (F-14): fallback page cannot perform because navigation never reaches it. |

## Results — Load Testing (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-LOAD-001 | Normal Load | ✅ | 10 concurrent: **0 errors**, p50 ~1s (SSR on 1 core). |
| PERF-LOAD-002 | Peak Load | ✅ | 50 concurrent/page: **0 errors**, p50 3–3.7s. |
| PERF-LOAD-003 | Stress Testing | ⚠️ | 100 concurrent sustained 0 errors but p50 4.8s / p95 5.6s (single un-cached SSR instance). Needs multi-instance/CDN repeat on staging. |
| PERF-LOAD-004 | Endurance Testing | 🚫 | Hours-long soak infeasible in this session. |
| PERF-LOAD-005 | Spike Testing | ✅ | 100-request spike absorbed with **0 failures** (RPS rose 9→18 — queueing, no collapse). |

## Results — User Journeys (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-UJ-001 | Homepage → Product Detail | ✅ | home→products 285ms + products→pdp 1322ms (measured client-side transitions). |
| PERF-UJ-002 | Product Detail → Cart | ✅ | add-to-cart feedback <1s; cart nav instant (Reports 01/02 journeys). |
| PERF-UJ-003 | Cart → Checkout | ✅ | Checkout render 184ms FCP measured; full placement journey live (Report 01). |
| PERF-UJ-004 | Search → Product Detail | ✅ | Search → results → PDP completes without delay (Report 01 FT-PL-003). |
| PERF-UJ-005 | Login → Dashboard | ✅ | Login round-trip + dashboard render measured in Report 01 account journey. |

## Results — Monitoring (3 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| PERF-MON-001 | Real User Monitoring (RUM) | 🚫 | No RUM agent configured in the product (grep: no analytics/RUM SDK). |
| PERF-MON-002 | Synthetic Monitoring | ⚠️ | This suite provides on-demand synthetic checks; no scheduled external monitor exists. |
| PERF-MON-003 | Performance Budget | 🚫 | No perf budget defined in CI/build (`package.json`/`next.config.ts` have none). |

---

## Defect Register (new — continues F-39)

| ID | Sev | Finding | Cases | Recommendation |
|---|---|---|---|---|
| **F-40** | **Medium** | **Mobile-emulated performance 0.58** (LCP 6.7s, TBT 390ms) vs desktop-excellent numbers. Root causes measured: **36 font-subset files (803KB)** per inner page + render-blocking 297KB CSS + ~121KB unused JS. | PERF-CWV-001/002/004, MOB-001/003, BUNDLE-005 | Consolidate Arabic font subsets (2–4 `unicode-range` files), `preload` 1–2 critical woff2, defer non-display text; split the vendor chunk; re-run Lighthouse. |
| **F-41** | Low | **297KB single CSS asset** shipped on first render. | PERF-BUNDLE-003 | Purge/ split per-route CSS (Tailwind v4 content config + critical CSS inline). |
| **F-42** | Low | Largest JS chunk **737KB** raw (335/329/236KB siblings) — shared-vendor monolith. | PERF-BUNDLE-001/002 | `next/dynamic`-split Payload/admin-shared code out of storefront bundles; assert per-route JS < 300KB encoded. |
| **F-43** | Info | SSR latency degrades 1s→4.8s p50 from 10→100 concurrent on the 1-core box (0 errors — stable). | PERF-LOAD-003 | At deploy: run ≥2 instances + CDN/HTML caching for anon catalog; repeat stress on staging. |
| **F-44** | Info | Local stack serves HTTP/1.1 (no TLS edge here) — h2/h3 unverified. | PERF-NET-002 | Verify `curl --http2` against the production domain post-deploy. |

**Cross-referenced (open):** F-14 (offline fallback — OFFLINE-003/004 ❌), F-32 (iOS input zoom), F-36 (contrast — LH a11y 0.97).

## Spec Corrections (Report 06)

1. **PERF-LOAD-004 (endurance), PERF-RT-008/MOB-004 (battery), PERF-NET-004/005/006 (CDN/DNS/SSL), PERF-MON-001 (RUM), PERF-MON-003 (budget)** cannot be executed in this sandbox/product state — 🚫 with reasons above.
2. Lighthouse "mobile" scores use emulated Slow-4G + 4× CPU; measured CDP-4G column shows the gap between emulation and throttled-real. Both are reported.

---

## Final Tally

| Group | Total | ✅ | ⚠️ | ❌ | 🚫 |
|---|---:|---:|---:|---:|---:|
| PERF-CWV | 4 | 1 | 3 | 0 | 0 |
| PERF-PL | 8 | 8 | 0 | 0 | 0 |
| PERF-RT | 8 | 6 | 1 | 0 | 1 |
| PERF-NET | 6 | 2 | 1 | 0 | 3 |
| PERF-BUNDLE | 9 | 4 | 5 | 0 | 0 |
| PERF-SERVER | 7 | 7 | 0 | 0 | 0 |
| PERF-MOB | 5 | 2 | 2 | 0 | 1 |
| PERF-OFFLINE | 4 | 2 | 0 | 2 | 0 |
| PERF-LOAD | 5 | 3 | 1 | 0 | 1 |
| PERF-UJ | 5 | 5 | 0 | 0 | 0 |
| PERF-MON | 3 | 0 | 1 | 0 | 2 |
| **TOTAL** | **64** | **40** | **14** | **2** | **8** |

## Reproduction Appendix

```bash
export LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp PLAYWRIGHT_BASE_URL=http://localhost:3000
cd /home/user/NPF
npx playwright test --config /home/user/scratch/pw-extra.config.mjs \
  /home/user/scratch/e2e-patched/perf-audit.spec.ts \
  /home/user/scratch/e2e-patched/perf-journeys.spec.ts
node /home/user/scratch/load-test.mjs
CHROME_PATH=/tmp/chromium npx lighthouse http://localhost:3000/ar \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
  --only-categories=performance,seo,accessibility,best-practices \
  --output=json --output-path=/home/user/scratch/lh-home.json
```

**Sign-off:** Report 06 executed in full (64/64 classified). **40 ✅ / 14 ⚠️ / 2 ❌ / 8 🚫.** Desktop/field-like vitals are excellent (LCP ≤680ms, CLS 0); the mobile-emulated 0.58 score (F-40…F-42) is the one performance workstream. F-14 remains the only functional ❌. Ready for Report 07.
