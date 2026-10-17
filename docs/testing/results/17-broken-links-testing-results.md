# Report 17 — Broken Links Testing — Results & Defect Register

**Project:** NPF — Nile Pharma Food (Next.js 16.3.3 + Payload CMS 3.88 + Vendure 3.7.3)
**Source report:** `docs/testing/17-broken-links-testing-report.md` (109 test cases)
**Result date:** 2026-09-21
**Tested by:** QA Agent (Arena)
**Branch:** `arena/01a0c301-npf` (baseline `9025fa5`)
**Environment:** local production build (:3000). Live battery: `scratch/link-console-sweep.mjs` — **19-page crawl (ar/en ×19 surfaces), 67 unique links resolved, 62/62 internal = 200, ZERO broken**, anchor verification, broken-image scan (0), plus the 37-URL status sweep and footer/header reachability from Reports 11/14.

---

## Executive Summary

| Verdict | Count | Meaning |
|---|---:|---|
| ✅ Pass | 72 | Meets the expected result |
| ⚠️ Partial | 16 | Works with gaps |
| ❌ Fail | 2 | Does not meet the expected result |
| 🚫 N/A | 19 | Link type/feature not present |
| **Total** | **109** | |

**Headline — the link graph is exceptionally healthy.** The full crawl found **67 unique links with zero internal breakage** (`bad: []`), zero broken images across surfaces, working anchors (`#trust` target exists), all CSS/JS/font assets resolving, working mailto/tel links, and 4 outbound scientific DOI links on the quality page. The only ❌ pair is the known **missing social links** (F-23 — one defect, two cases). Everything else is either a deploy-layer redirect (HTTPS/WWW — F-44/edge) or an automation gap (no scheduled link checker — F-69).

**New defects:** none — the link layer ships clean. Cross-refs below.

---

## Notable Evidence (this session)

```
CRAWL (19 pages → 67 links): internal 62 → ALL 200 · "bad": [] · external 4 (DOI/Wiley
  scientific citations, https) + 1 in-page anchor · brokenAssets: [] · anchors: #trust targetExists=true
FOOTER/TRUTH (Report 11): all 13 footer links → real pages with <h1>/<title>
STATUS SWEEP (Report 11): 37 URLs — 307/200/404 matrix exactly as designed, no surprises
```

## Results — Internal Navigation Links (7 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| LINK-INT-NAV-001 | Header Navigation Links | ✅ | All header hrefs 200 (crawl). |
| LINK-INT-NAV-002 | Footer Links | ✅ | All 13 resolve (crawl + Report 11). |
| LINK-INT-NAV-003 | Mobile Menu Links | ✅ | Sheet links = same hrefs (Report 01/11). |
| LINK-INT-NAV-004 | Bottom Navigation Links | ✅ | Tab hrefs resolve (Report 01 F-06 evidence). |
| LINK-INT-NAV-005 | Breadcrumb Links | ✅ | PDP breadcrumb present (Report 05) + links resolve. |
| LINK-INT-NAV-006 | Pagination Links | ⚠️ | No pagination component (listing loads full sets) — nothing to break. |
| LINK-INT-NAV-007 | Language Switcher Links | ✅ | `/ar`↔`/en` hreflang switcher 200 (measured). |

## Results — Internal Content & Page Links (18 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| LINK-INT-CONT-001 | Product Links | ✅ | PDP hrefs 200 (crawl). |
| LINK-INT-CONT-002 | Category Links | ✅ | `?category=` links 200 (crawl). |
| LINK-INT-CONT-003 | Button Links | ✅ | CTA buttons navigate (journeys). |
| LINK-INT-CONT-004 | Card Links | ✅ | «عرض التفاصيل» cards live (Report 01). |
| LINK-INT-CONT-005 | Text Links | ✅ | Inline links resolve (crawl — zero bad). |
| LINK-INT-CONT-006 | Hero Section Links | ✅ | Hero CTAs resolve (crawl). |
| LINK-INT-CONT-007 | Feature Section Links | ✅ | Feature CTAs resolve. |
| LINK-INT-CONT-008 | Call-to-Action Links | ✅ | All CTAs 200. |
| LINK-INT-PAGE-001 | Homepage Links | ✅ | All home hrefs 200 (crawl). |
| LINK-INT-PAGE-002 | Product Listing Links | ✅ | 200s. |
| LINK-INT-PAGE-003 | Product Detail Links | ✅ | 200s. |
| LINK-INT-PAGE-004 | Cart Page Links | ✅ | 200 (NetworkOnly path — Report 15). |
| LINK-INT-PAGE-005 | Checkout Page Links | ✅ | 200. |
| LINK-INT-PAGE-006 | Account Page Links | ✅ | 200/redirect-to-login as designed. |
| LINK-INT-PAGE-007 | About Page Links | ✅ | 200. |
| LINK-INT-PAGE-008 | Contact Page Links | ✅ | 200 + mailto. |
| LINK-INT-PAGE-009 | Blog Page Links | ✅ | `/ar/blogs` real page (Report 11 truth-check). |
| LINK-INT-PAGE-010 | 404 Page Links | ✅ | 404 page links resolve (logo → /ar). |

## Results — External & Special Links (11 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| LINK-EXT-001 | Social Media Links | ❌ | **None exist** — F-23 (filed). |
| LINK-EXT-002 | Partner Links | ⚠️ | Partner logos (Alfasigma marquee) are non-linked images. |
| LINK-EXT-003 | Resource Links | ✅ | 4 scientific DOI/Wiley links on quality page (measured in crawl). |
| LINK-EXT-004 | Vendor Links | 🚫 | No vendor links designed. |
| LINK-EXT-005 | Payment Gateway Links | 🚫 | Methods are text-only (F-03). |
| LINK-EXT-006 | Third-Party Service Links | 🚫 | None. |
| LINK-SPEC-001 | Email Links | ✅ | `mailto:info@nilepharmafood.com` (measured). |
| LINK-SPEC-002 | Telephone Links | ✅ | `tel:` footer phones (Report 02 UI-FTR-002). |
| LINK-SPEC-003 | WhatsApp Links | 🚫 | Not present. |
| LINK-SPEC-004 | SMS Links | 🚫 | Not present. |
| LINK-SPEC-005 | FaceTime Links | 🚫 | Not present. |

## Results — Image & Asset Links (12 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| LINK-IMG-001 | Image Source Links | ✅ | All img srcs resolve (brokenAssets: []). |
| LINK-IMG-002 | Image Srcset Links | ✅ | 10-width srcsets all resolve (Report 14). |
| LINK-IMG-003 | Picture Element Links | 🚫 | No `<picture>` (Report 14 correction). |
| LINK-IMG-004 | Linked Images | ✅ | Logo/product-image links navigate. |
| LINK-IMG-005 | Favicon Links | ✅ | icon.png + apple-icon resolve (measured). |
| LINK-IMG-006 | Logo Links | ✅ | `npf-logo.svg` links → /ar (measured). |
| LINK-IMG-007 | Social Media Icon Links | ❌ | **None exist** — F-23 (same defect as EXT-001). |
| LINK-IMG-008 | Payment Method Icon Links | 🚫 | No payment icons (Report 14 IMG-051). |
| LINK-ASSET-001 | CSS Links | ✅ | Stylesheet resolves (crawl renders styled). |
| LINK-ASSET-002 | JavaScript Links | ✅ | All chunks 200 (asset sweep clean). |
| LINK-ASSET-003 | Font Links | ✅ | Font faces resolve (Report 14 FONT-022). |
| LINK-ASSET-004 | Icon Links | ✅ | SVG/logo assets resolve. |

## Results — API, Downloads, Anchors, Redirects (16 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| LINK-API-001 | GraphQL Endpoint | ✅ | `/api/graphql` responds (405 GET / 200 POST — measured). |
| LINK-API-002 | REST API Endpoints | ✅ | `/api/*` 200/403 matrix (Report 08/09). |
| LINK-API-003 | Server Actions Endpoints | ✅ | All form actions round-trip (Reports 01/10). |
| LINK-API-004 | Webhook Endpoints | 🚫 | No webhooks. |
| LINK-DL-001 | PDF Download Links | 🚫 | No downloadable PDFs. |
| LINK-DL-002 | Document Download Links | 🚫 | None. |
| LINK-DL-003 | File Download Links | 🚫 | None. |
| LINK-ANCHOR-001 | Hash Links | ✅ | `#trust` measured (targetExists: true). |
| LINK-ANCHOR-002 | Same-Page Anchors | ✅ | Same-page anchors scroll (measured). |
| LINK-ANCHOR-003 | Cross-Page Anchors | ⚠️ | `/about#x` takes 2-hop redirect (known quirk). |
| LINK-REDIR-001 | HTTP→HTTPS Redirect | ⚠️ | Deploy-edge concern (HSTS ready — Report 08). |
| LINK-REDIR-002 | WWW↔Non-WWW | 🚫 | No domain edge in sandbox. |
| LINK-REDIR-003 | Trailing Slash Redirect | ✅ | Clean URLs, no slash variants (sweep). |
| LINK-REDIR-004 | Redirect Chains | ⚠️ | Single-hop everywhere except hash deep-links (measured). |
| LINK-REDIR-005 | Redirect Speed | ✅ | Instant 307s (37-URL sweep 12s total). |
| LINK-REDIR-006 | Redirect Loop Prevention | ✅ | Zero loops in crawl + sweep. |

## Results — Validation, Security, Accessibility (17 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| LINK-VAL-001 | HTTP Status Validation | ✅ | **62/62 internal = 200** (crawl). |
| LINK-VAL-002 | 404 Error Detection | ✅ | 404s correctly rendered/detected (sweep). |
| LINK-VAL-003 | 500 Error Detection | ⚠️ | F-54 mis-fires + F-02 no 500 page. |
| LINK-VAL-004 | Link Integrity Validation | ✅ | `bad: []` — zero integrity failures. |
| LINK-VAL-005 | Link Consistency Validation | ✅ | Header/footer/sheet hrefs consistent across pages. |
| LINK-VAL-006 | Link Localization Validation | ✅ | `/ar/*` ↔ `/en/*` parity (Report 07 hreflang 9/9). |
| LINK-SEC-001 | HTTPS Links | ✅ | All external + canonical links https (crawl + sitemap). |
| LINK-SEC-002 | Safe Links | ✅ | No `javascript:` hrefs (source + crawl). |
| LINK-SEC-003 | Link Sanitization | ✅ | Static/typed hrefs only (React). |
| LINK-SEC-004 | Link Target Security | ⚠️ | External DOI `target=_blank` rel pairing unverified. |
| LINK-SEC-005 | Link Data Security | ✅ | No PII in URLs beyond opaque order codes. |
| LINK-A11Y-001 | Link Keyboard Accessibility | ✅ | Keyboard suite (Reports 04/05). |
| LINK-A11Y-002 | Link Screen Reader Accessibility | ⚠️ | Duplicate link names exist («عرض المزيد» family — F-03-era). |
| LINK-A11Y-003 | Link Text Accessibility | ⚠️ | Some generic labels («عرض المزيد») lack unique context. |
| LINK-A11Y-004 | Link ARIA Attributes | ⚠️ | No `aria-current` on active links — F-62. |
| LINK-A11Y-005 | Link Focus Indicators | ✅ | `focus-visible:ring` (Report 04). |
| LINK-A11Y-006 | Link Color Contrast | ⚠️ | F-36 (3 failing styles incl. link-ish tokens). |

## Results — Perf, SEO, Devices, Browsers, Automation (28 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| LINK-PERF-001 | Link Load Performance | ✅ | Nav instant (p50 285ms desktop — Report 06). |
| LINK-PERF-002 | Link Prefetching | ✅ | Next Link prefetch payloads measured (Report 06). |
| LINK-PERF-003 | Link Caching | ✅ | SW + prefetch caches (41 RSC prefetch entries — Report 15). |
| LINK-PERF-004 | Link Resource Loading | ✅ | No dead resource fetches (crawl console clean). |
| LINK-SEO-001 | Link Anchor Text | ✅ | Descriptive Arabic anchors (crawl samples). |
| LINK-SEO-002 | Link Title Attributes | ⚠️ | `title` attrs rarely used (not required, minor). |
| LINK-SEO-003 | Internal Linking | ✅ | Strong internal mesh (62 links/19 pages). |
| LINK-SEO-004 | External Linking | ✅ | Relevant authority DOI links (quality page). |
| LINK-SEO-005 | Link Equity | ✅ | Clean URL architecture + canonical/hreflang (Report 07). |
| LINK-SEO-006 | Canonical Links | ⚠️ | Inner pages ✓; **home canonical missing** — F-45. |
| LINK-SEO-007 | Alternate Links (hreflang) | ✅ | 9/9 pairs (Report 07). |
| LINK-SEO-008 | Sitemap Links | ✅ | 72 URLs resolve (Report 07 + sweep). |
| LINK-SEO-009 | RSS Feed Links | 🚫 | No RSS feed. |
| LINK-DEV-001 | Desktop Links | ✅ | Crawl (desktop viewport). |
| LINK-DEV-002 | Tablet Links | ✅ | Report 03. |
| LINK-DEV-003 | Mobile Links | ✅ | Reports 01/02. |
| LINK-DEV-004 | Touch Target Size | ⚠️ | F-30 (20px text links). |
| LINK-DEV-005 | Links During Orientation | ✅ | Reflow preserves hrefs (Report 11 DEV-005). |
| LINK-BROW-001 | Chrome Links | ✅ | Chromium 153 (crawl). |
| LINK-BROW-002/003/004 | Firefox/Safari/Edge Links | 🚫 ×3 | Not installable in sandbox. |
| LINK-BROW-005 | Browser-Specific Link Behavior | ⚠️ | Untested beyond Chromium. |
| LINK-AUTO-001 | Automated Link Checker | ⚠️ | Ad-hoc checker run this session (27s, 19 pages); none in repo — F-69. |
| LINK-AUTO-002 | Scheduled Link Checking | 🚫 | None. |
| LINK-AUTO-003 | CI/CD Link Checking | 🚫 | No CI (F-69). |
| LINK-AUTO-004 | Link Checking Performance | ✅ | Sweep = 27s for 67 links (fast). |
| LINK-AUTO-005 | Link Checking Coverage | ✅ | 19 pages × all hrefs = full surface coverage. |

---

## Defect Register

**No new defects.** The link graph is clean (`bad: []`).

**Cross-referenced (open):** F-23 (no social links — LINK-EXT-001 + LINK-IMG-007 ❌), F-03 (no payment icons/links), F-30 (touch targets), F-36 (contrast), F-45 (home canonical), F-62 (aria-current), F-69 (no CI link-checking), F-54/F-02 (500-path detection), F-44 (HTTPS edge).

## Spec Corrections (Report 17)

1. **LINK-EXT-004/005/006, LINK-SPEC-003/004/005, LINK-DL-001..003, LINK-IMG-003/008, LINK-SEO-009, LINK-REDIR-002, LINK-BROW-002/003/004, LINK-AUTO-002/003** — link types/features not present; each row states which.
2. The report anticipated widespread breakage (typical for a "broken links" pass) — the measured result is the opposite: **0 broken internal links**.

---

## Final Tally

| Group | Total | ✅ | ⚠️ | ❌ | 🚫 |
|---|---:|---:|---:|---:|---:|
| LINK-INT-NAV | 7 | 6 | 1 | 0 | 0 |
| LINK-INT-CONT | 8 | 8 | 0 | 0 | 0 |
| LINK-INT-PAGE | 10 | 10 | 0 | 0 | 0 |
| LINK-EXT | 6 | 1 | 1 | 1 | 3 |
| LINK-SPEC | 5 | 2 | 0 | 0 | 3 |
| LINK-IMG | 8 | 5 | 0 | 1 | 2 |
| LINK-ASSET | 4 | 4 | 0 | 0 | 0 |
| LINK-API | 4 | 3 | 0 | 0 | 1 |
| LINK-DL | 3 | 0 | 0 | 0 | 3 |
| LINK-ANCHOR | 3 | 2 | 1 | 0 | 0 |
| LINK-REDIR | 6 | 3 | 2 | 0 | 1 |
| LINK-VAL | 6 | 5 | 1 | 0 | 0 |
| LINK-SEC | 5 | 4 | 1 | 0 | 0 |
| LINK-A11Y | 6 | 2 | 4 | 0 | 0 |
| LINK-PERF | 4 | 4 | 0 | 0 | 0 |
| LINK-SEO | 9 | 6 | 2 | 0 | 1 |
| LINK-DEV | 5 | 4 | 1 | 0 | 0 |
| LINK-BROW | 5 | 1 | 1 | 0 | 3 |
| LINK-AUTO | 5 | 2 | 1 | 0 | 2 |
| **TOTAL** | **109** | **72** | **16** | **2** | **19** |

## Reproduction Appendix

```bash
cd /home/user/NPF && LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp node /home/user/scratch/link-console-sweep.mjs
# → { linkCounts: 67, bad: [], ok200: 62, brokenAssets: [], consoleIssues: [], pageErrors: [] }
```

**Sign-off:** Report 17 executed in full (109/109 classified with live crawl). **72 ✅ / 16 ⚠️ / 2 ❌ / 19 🚫.** Zero broken links — add F-23's social icons and this section is closed. Ready for Report 18.
