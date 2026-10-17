# Report 20 — Analytics, SEO & Metadata Testing — Results & Defect Register

**Project:** NPF — Nile Pharma Food (Next.js 16.3.3 + Payload CMS 3.88 + Vendure 3.7.3)
**Source report:** `docs/testing/20-analytics-tracking-testing-report.md` (79 test cases)
**Result date:** 2026-09-21
**Tested by:** QA Agent (Arena)
**Branch:** `arena/01a0c301-npf` (baseline `9025fa5`)
**Environment:** local production build (:3000). Source sweep for `gtag|googletagmanager|dataLayer|fbq|analytics|umami|plausible|posthog|mixpanel` = **ZERO hits**; live head audit (Report 15): titles ✅, descriptions ✅, OG/Twitter ✅/partial, JSON-LD Organization+Breadcrumbs ✅, sitemap/robots/manifest ✅, canonical home ❌ (F-45), cookie consent ❌ (F-18).

---

## Executive Summary

| Verdict | Count | Meaning |
|---|---:|---|
| ✅ Pass | 12 | Meets the expected result |
| ⚠️ Partial | 6 | Works with gaps |
| ❌ Fail | 38 | Does not meet the expected result |
| 🚫 N/A | 23 | Analytics feature not implemented / not used |
| **Total** | **79** | |

**Headline — the metadata layer is genuinely strong; the analytics layer simply does not exist.** On the SEO/meta side: unique localized titles + descriptions on every page, hreflang + robots + charset + viewport, Organization + BreadcrumbList JSON-LD (validated by parsing), sitemap + robots.txt + manifest — all measured ✅. The one meta ❌ is the **missing home canonical (F-45)** plus the OG trio (og:image/og:url absent → share previews broken). Everything analytics — GA4, GTM, dataLayer, page-views, the entire e-commerce event suite, conversions, UTM — is **absent** (38 ❌ = **F-70**). Privacy rows fail with F-18 (no cookie consent/GDPR banner).

**New defects:** **F-70 (Medium) — no analytics implementation.** Plus cross-refs F-45/F-68/F-18.

---

## Results — Analytics Implementation & Events (25 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| ANA-IMPL-001 | GA4 Installation | ❌ | No gtag/GA scripts (source sweep zero) — **F-70**. |
| ANA-IMPL-002 | GA4 Data Collection | ❌ | F-70. |
| ANA-IMPL-003 | Google Tag Manager | ❌ | No GTM — F-70. |
| ANA-IMPL-004 | Data Layer Implementation | ❌ | No `dataLayer` — F-70. |
| ANA-IMPL-005 | Analytics Script Loading | ❌ | No analytics scripts at all — F-70. |
| ANA-IMPL-006 | Analytics in Both Locales | 🚫 | Nothing to localize. |
| ANA-PV-001 | Initial Page View | ❌ | Not tracked (F-70). |
| ANA-PV-002 | SPA Navigation Page Views | ❌ | Not tracked (F-70). |
| ANA-PV-003 | Virtual Page Views | ❌ | Not tracked (F-70). |
| ANA-PV-004 | Page View Parameters | ❌ | Not tracked (F-70). |
| ANA-ECOM-001 | View Item Event | ❌ | F-70 (funnel blind). |
| ANA-ECOM-002 | View Item List Event | ❌ | F-70. |
| ANA-ECOM-003 | Add to Cart Event | ❌ | F-70 (happens live — just untracked). |
| ANA-ECOM-004 | Remove from Cart Event | ❌ | F-70. |
| ANA-ECOM-005 | Begin Checkout Event | ❌ | F-70. |
| ANA-ECOM-006 | Add Shipping Info Event | ❌ | F-70. |
| ANA-ECOM-007 | Add Payment Info Event | ❌ | F-70. |
| ANA-ECOM-008 | Purchase Event | ❌ | F-70 (real orders place — no purchase event). |
| ANA-ECOM-009 | Refund Event | ❌ | F-70. |
| ANA-CUST-001 | Login Event | ❌ | F-70. |
| ANA-CUST-002 | Sign Up Event | ❌ | F-70. |
| ANA-CUST-003 | Search Event | ❌ | F-70. |
| ANA-CUST-004 | Add to Wishlist Event | ❌ | F-70. |
| ANA-CUST-005 | Contact Form Submission Event | ❌ | F-70. |
| ANA-CUST-006..010 | Share/Download/Scroll/Outbound/Video | 🚫 ×3 + ⚠️ ×2 | Share/download/video surfaces don't exist; scroll/outbound untracked (F-70). |
| ANA-CONV-001..003 | Goals/Funnel/Attribution | ❌ ×3 | F-70. |
| ANA-USER-001..003 | UserID/Session/Custom Dims | ❌ ×3 | F-70. |

## Results — Metadata & Social (22 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| ANA-META-001 | Title Tags | ✅ | Unique localized titles (live matrix). |
| ANA-META-002 | Meta Descriptions | ✅ | Localized descriptions (live matrix). |
| ANA-META-003 | Meta Keywords | ⚠️ | Absent (deprecated practice — acceptable). |
| ANA-META-004 | Meta Robots | ✅ | `robots` present (buildPageMetadata). |
| ANA-META-005 | Canonical URLs | ❌ | **Home canonical missing — F-45** (others present). |
| ANA-META-006 | Hreflang Tags | ✅ | ar/en alternates (measured). |
| ANA-META-007 | Viewport Meta | ✅ | Present with `viewport-fit`. |
| ANA-META-008 | Charset Meta | ✅ | UTF-8 (layout). |
| ANA-OG-001 | Open Graph Tags | ❌ | `og:url` missing — F-45. |
| ANA-OG-002 | Open Graph Images | ❌ | `og:image` missing — share previews bare (F-45). |
| ANA-OG-003 | OG Sharing Preview | ❌ | Incomplete OG = poor preview (F-45). |
| ANA-TW-001 | Twitter Card Tags | ✅ | `summary_large_image` + title/desc/image (measured). |
| ANA-TW-002 | Twitter Card Preview | ⚠️ | Tags correct; live preview unverifiable. |
| ANA-SCHEMA-001 | Organization Schema | ✅ | JSON-LD present (parsed). |
| ANA-SCHEMA-002 | Product Schema | 🚫 | Not implemented (SEO opportunity, not a regression). |
| ANA-SCHEMA-003 | Breadcrumb Schema | ✅ | `BreadcrumbList` on PDP (parsed — measured). |
| ANA-SCHEMA-004 | LocalBusiness Schema | ⚠️ | Partial via Organization. |
| ANA-SCHEMA-005 | Review Schema | 🚫 | No reviews feature. |
| ANA-SCHEMA-006 | Schema Validation | ✅ | Both JSON-LD blocks parse cleanly. |
| ANA-PWA-001 | Manifest Metadata | ✅ | Complete manifest (Report 15). |
| ANA-PWA-002 | Theme Color | ❌ | No `theme-color` meta — F-68. |
| ANA-PWA-003 | App Icons | ⚠️ | Icons ✓ but no maskable — F-33. |

## Results — Campaigns, Privacy, Data, Platforms (22 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| ANA-CAMP-001 | UTM Parameters | ❌ | Not captured anywhere — F-70. |
| ANA-CAMP-002 | Campaign Attribution | 🚫 | No attribution layer. |
| ANA-CAMP-003 | Google Ads Tracking | 🚫 | Not used. |
| ANA-CAMP-004 | Facebook Pixel | 🚫 | Not used. |
| ANA-PRIV-001 | Cookie Consent | ❌ | No banner — **F-18**. |
| ANA-PRIV-002 | GDPR Compliance | ❌ | No consent/export/delete tooling — F-18. |
| ANA-PRIV-003 | Data Privacy | ⚠️ | Minimal data held ✓; policy exists; no controls. |
| ANA-PRIV-004 | Do Not Track | 🚫 | No analytics to honor DNT (moot under F-70). |
| ANA-DATA-001..004 | Accuracy/Completeness/Consistency/Dedupe | 🚫 ×4 | No analytics stream to validate. |
| ANA-PERF-001 | Analytics Script Performance | ✅ | Zero analytics overhead (nothing loads). |
| ANA-PERF-002/003 | Script Loading/Data Transfer | 🚫 ×2 | Nothing to measure. |
| ANA-PLAT-001..003 | Desktop/Mobile/Tablet Analytics | 🚫 ×3 | F-70. |
| ANA-BROW-001..004 | Chrome/Firefox/Safari/Edge Analytics | 🚫 ×4 | F-70. |

---

## Defect Register

**F-70 — No analytics implementation at all (new — Medium).**
- **Where:** whole codebase (`gtag|GTM|dataLayer|fbq|plausible|posthog|umami|mixpanel` = 0 hits); no `Analytics`/`Script` third-party in `src/`.
- **Expected:** GA4 (or equivalent) with page-views + GA4 e-commerce events (view_item → purchase) + UTM capture.
- **Actual:** nothing — funnel, conversions, attribution all invisible.
- **Impact:** Medium — a commercial site cannot measure conversion funnels, campaigns, or ROI; every marketing decision is blind. (Functionality itself is unaffected.)
- **Suggested fix:** add GA4 via `next/script` + `dataLayer` pushes at journey milestones (PLP/PDP/add-to-cart/checkout/purchase) behind a consent gate (fixes F-18 together).
- **Priority:** Medium.

**Cross-referenced (open):** **F-45 (canonical/OG trio ❌)**, **F-68 (theme-color)**, **F-18 (cookie consent/GDPR)**, F-33 (maskable icon).

## Spec Corrections (Report 20)

1. **23 🚫 rows** = analytics features with no underlying implementation (dedupe/DNT/platform/browser analytics rows) or product surfaces that don't exist (video/share/download events).
2. Meta keywords ⚠️ is benign (deprecated by all major engines).

---

## Final Tally

| Group | Total | ✅ | ⚠️ | ❌ | 🚫 |
|---|---:|---:|---:|---:|---:|
| ANA-IMPL | 6 | 0 | 0 | 5 | 1 |
| ANA-PV | 4 | 0 | 0 | 4 | 0 |
| ANA-ECOM | 9 | 0 | 0 | 9 | 0 |
| ANA-CUST | 10 | 0 | 0 | 7 | 3 |
| ANA-CONV | 3 | 0 | 0 | 3 | 0 |
| ANA-USER | 3 | 0 | 0 | 3 | 0 |
| ANA-META | 8 | 6 | 1 | 1 | 0 |
| ANA-OG | 3 | 0 | 0 | 3 | 0 |
| ANA-TW | 2 | 1 | 1 | 0 | 0 |
| ANA-SCHEMA | 6 | 3 | 1 | 0 | 2 |
| ANA-PWA | 3 | 1 | 1 | 1 | 0 |
| ANA-CAMP | 4 | 0 | 0 | 1 | 3 |
| ANA-PRIV | 4 | 0 | 1 | 2 | 1 |
| ANA-DATA | 4 | 0 | 0 | 0 | 4 |
| ANA-PERF | 3 | 1 | 0 | 0 | 2 |
| ANA-PLAT | 3 | 0 | 0 | 0 | 3 |
| ANA-BROW | 4 | 0 | 0 | 0 | 4 |
| **TOTAL** | **79** | **12** | **6** | **38** | **23** |

*(CUST rows: login/signup/search/wishlist/contact = 5 ❌ + scroll/outbound = 2 ❌ → 7 ❌; share/download/video = 3 🚫.)*

## Reproduction Appendix

```bash
cd /home/user/NPF && grep -RniE "gtag|googletagmanager|dataLayer|fbq|plausible|posthog|umami|mixpanel" src/ | wc -l   # → 0
curl -s http://localhost:3000/ar | grep -Eo '"@type":"[A-Za-z]+"|og:[a-z:]+'   # Organization+Breadcrumbs JSON-LD; no og:url/og:image
curl -s http://localhost:3000/sitemap.xml | head -3   # ✅
```

**Sign-off:** Report 20 executed in full (79/79 classified). **12 ✅ / 6 ⚠️ / 38 ❌ / 23 🚫.** Metadata is production-grade minus canonical/OG (F-45); analytics is greenfield (F-70). Ready for Report 21.
