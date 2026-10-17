# Report 03 — Responsive & RTL Testing — Results & Defect Register

**Project:** NPF — Nile Pharma Food (Next.js 16.3.3 + Payload CMS 3.88 + Vendure 3.7.3)
**Source report:** `docs/testing/03-responsive-testing-report.md` (80 test cases)
**Result date:** 2026-09-21
**Tested by:** QA Agent (Arena)
**Branch:** `arena/01a0c301-npf` (baseline `9025fa5`)
**Environment:** local production build (:3000), Chromium 153 (Sparticuz) via Playwright, emulated viewports 320→1920 + orientation switches + 200% zoom emulation. **Real-device matrix not available in this sandbox.**

---

## Executive Summary

| Verdict | Count | Meaning |
|---|---:|---|
| ✅ Pass | 66 | Meets the expected result |
| ⚠️ Partial | 8 | Works, with documented gaps |
| ❌ Fail | 1 | Does not meet the expected result |
| 🚫 N/A | 5 | Not applicable / not possible in this environment |
| **Total** | **80** | |

**Headline:** RTL is implemented at a reference quality (logical properties, icon mirroring measured at `rotate: 180deg`, language switch both directions). The breakpoint system is solid at 375/768/1280+ — but the 1024px boundary and 320px EN home carry **three genuine horizontal-overflow bugs (F-27…F-29)** discovered by the 70-combination overflow matrix.

**New defects:** F-27 … F-32 (3 Medium, 2 Low, 1 Info). Continues the global register after Report 02's F-26.

---

## Methodology

1. **Overflow matrix** — `scratch/overflow-finder.mjs` + `e2e-patched/responsive-audit.spec.ts`: widths **320/360/375/414/768/1024/1280/1440/1536/1920** × pages **/ar, /ar/products, /ar/products/proxeed-plus, /ar/cart, /ar/checkout, /ar/contact, /en** (70 combos), asserting `scrollWidth ≤ clientWidth` and listing overflowing culprits by DOM class.
2. **Measured audit** (`responsive-audit.spec.ts`, 10/11 passed — failure = the real overflow bug): breakpoint nav/grid behavior, line-clamp truncation, image `loading`/`srcset`/aspect, orientation switches (375×812 ⇄ 812×375), scroll-snap scan, touch-target scan (74 interactive nodes), `dir`/icon-mirroring/logical-property probes, fluid type samples, viewport meta zoom blocking, 200% zoom layout check.
3. **RTL probes** — computed `rotate` on `rtl:rotate-180` icons in ar vs en; `dir`/`lang` attributes; logical class inventory (`ms-/me-/ps-/pe-/-end`) across `src/`.
4. **Visual matrix** — 70+ screenshots at 320/375/414/768/1024/1440/1920 × ar/en × light/dark + orientation states (`scratch/shots/`), read and judged individually.
5. **Extra probes** — CLS (0.00), account dashboard at 375/768 (live-logged session), mobile sheet, marquee culprit identification.

---

## Overflow Matrix — Summary (70 combos)

| Width | /ar | /ar/products | PDP | /ar/cart | /ar/checkout | /ar/contact | /en |
|---:|---|---|---|---|---|---|---|
| 320 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ 355px |
| 360–1023 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1024 | ✅ | ✅ | ❌ 1064px | ✅ | ✅ | ✅ | ❌ 1165px |
| 1280–1920 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Culprits (measured DOM):
- **320px /en** → `div.flex.w-max…animate-marquee` (2868px marquee track) + `div.pointer-events-none.absolute.-end-32` decorative blob.
- **1024px /ar/products/proxeed-plus** → `button.inline-flex.size-9` carousel control parked at x = −40…−4 (outside the RTL container).
- **1024px /en** → header action cluster (`a.group/button` ×3) exceeding the 1024 row + the `-end-32` blob.

---

## Results — Core Responsive (39 cases)

### Viewport (RT-VP)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-VP-001 | Viewport Meta Tag | ✅ | Measured `<meta name="viewport" content="width=device-width, initial-scale=1">`. |
| RT-VP-002 | Viewport Scaling | ⚠️ | 67/70 combos scale perfectly; **3 combos overflow** (F-27/28/29). |
| RT-VP-003 | Initial Zoom Level | ✅ | No `maximum-scale`/forced zoom; pages render at natural scale at all widths. |

### Breakpoints (RT-BP)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-BP-001 | Mobile (0–767px) | ⚠️ | 360/375/414 clean (1–2 col grids, hamburger nav, bottom-nav). **320px /en overflows (F-27)**. |
| RT-BP-002 | Tablet (768–1023px) | ✅ | 768/834 verified: hamburger retained (`lg:` boundary at 1024), 2-col grids, stacked hero. |
| RT-BP-003 | Desktop (1024–1279px) | ❌ | **Exactly at 1024px: PDP overflows 1064px (F-28) and /en home overflows 1165px (F-29).** 1200+ widths clean. |
| RT-BP-004 | Large Desktop (1280px+) | ✅ | 1280/1440 verified: full nav, 3–4 col grids, container max-widths respected. |
| RT-BP-005 | Extra Large (1536px+) | ✅ | 1536/1920 verified: containers centered, no stretched content. |

### Typography (RT-TYPO)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-TYPO-001 | Font Size Scaling | ✅ | Fluid headline scale measured: h1 = 60px @1440 (`clamp`/`text-5xl→7xl`); scales down cleanly at 375 (visual). |
| RT-TYPO-002 | Line Height | ✅ | Body 18px/24px measured; paragraphs comfortable in ar + en (visual). |
| RT-TYPO-003 | Text Truncation | ✅ | 8 elements with `line-clamp: 2; overflow: hidden` on listing cards (measured). |
| RT-TYPO-004 | Arabic Typography | ✅ | KO Banzeen headings + Inter Tight body; shaping, diacritics, justification render correctly at all widths (visual). |
| RT-TYPO-005 | English Typography | ✅ | Glora display + Montserrat body verified in EN screenshots. Info note: CSS `overflow-wrap: normal` (default) — a synthetic 88-char unbroken token can overflow a 320px line (no `wrap-anywhere`); no real content observed hitting this. |

### Images (RT-IMG)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-IMG-001 | Image Scaling | ✅ | All content images fluid within containers (measured 576×576 → responsive). |
| RT-IMG-002 | Image Aspect Ratio | ✅ | Product media in square aspect frames (`aspect-square` + `object-fit: cover` measured); no distortion across widths. |
| RT-IMG-003 | Lazy Loading | ✅ | Below-fold images `loading="lazy"` (measured on listing); hero correctly eager. |
| RT-IMG-004 | Retina/High-DPI | ✅ | `next/image` `srcset` present on content images (measured). |
| RT-IMG-005 | SVG Icons | ✅ | 100% lucide-react SVG icon set — resolution-independent everywhere. |

### Orientation (RT-OR)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-OR-001 | Portrait → Landscape | ✅ | 375×812 → 812×375: no overflow in either state (measured); layout reflows to wide single-row header. |
| RT-OR-002 | Landscape → Portrait | ✅ | Reverse switch clean; `screen.orientation` API present (measured). |
| RT-OR-003 | Tablet Orientation | ✅ | 768×1024 ⇄ 1024×768 equivalent widths clean on home (PDP edge covered by F-28). |
| RT-OR-004 | Viewport Meta for Orientation | ✅ | Meta handles rotation scaling; no zoom lock. |

### Zoom (RT-ZOOM)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-ZOOM-001 | Manual Zoom | ✅ | Meta contains **no** `maximum-scale=1` / `user-scalable=no` (regex-verified) → pinch zoom not blocked. |
| RT-ZOOM-002 | Text-Only Zoom | ⚠️ | Text-only zoom is a Firefox/IE capability not emulatable in headless Chromium. Layout uses rem/px with fluid type; 200%-equivalent viewport test shows text reflows without overlap. Unverified at true text zoom. |
| RT-ZOOM-003 | Maximum Zoom Level | ✅ | No cap in meta; 200% zoom emulation (675×450 CSS px) keeps checkout usable: header visible, **no overflow**. |

### Scrolling (RT-SCROLL)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-SCROLL-001 | Vertical Scrolling | ✅ | Smooth scroll with reveal-on-scroll sections (scroll-progress bar in header tracks position). |
| RT-SCROLL-002 | Horizontal Scrolling | ⚠️ | Not needed for content — except the 3 overflow bugs (F-27/28/29) introduce scrollWidth > clientWidth at edge widths. |
| RT-SCROLL-003 | Scroll Snap (if applicable) | ⚠️ | 0 elements with `scroll-snap-type` (measured). Carousels use **Embla transform-based sliding** instead — functionally equivalent swiping, but the spec's CSS snap pattern is not used. → F-31 |
| RT-SCROLL-004 | Infinite Scroll (if applicable) | 🚫 | The site implements neither infinite scroll nor pagination on listing (grid shows full catalog) — feature not applicable. |

### Touch (RT-TOUCH)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-TOUCH-001 | Minimum Touch Target Size | ⚠️ | Primary controls pass (CTA h-44, icon buttons ≥40, bottom-nav tabs full-height). **But text links measure 343×20 / 34×40** (footer columns, mobile sheet rows, logo) — under the 24px WCAG 2.5.8 minimum and well under 44px guidance. → F-30 |
| RT-TOUCH-002 | Touch Target Spacing | ✅ | Generous row spacing (sheet rows ~44px apart, footer columns gapped) — undersized links are separated enough to avoid mis-taps. |
| RT-TOUCH-003 | Touch Feedback | ✅ | Sheet, carousels, steppers, bottom-nav all exercised at 375px via taps (Playwright touch context + click equivalents); active states present. |

### RTL (RT-RTL)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-RTL-001 | Arabic Layout (RTL) | ✅ | `dir="rtl" lang="ar"` measured. Full-page mirror verified across 12 pages: logo/nav right, hero text right, product visuals left, checkout sidebar left. |
| RT-RTL-002 | English Layout (LTR) | ✅ | `dir="ltr" lang="en"` measured; perfect mirror (EN screenshots). |
| RT-RTL-003 | Language Switching | ✅ | Toggle works both ways (live). **Icon mirroring measured**: `rtl:rotate-180` arrows compute `rotate: 180deg` in ar vs `none` in en (Tailwind v4 `rotate` property) + `ChevronLeftIcon` variants per page. |
| RT-RTL-004 | Mixed Content Direction | ✅ | Latin brand tokens (Proxeed Plus, Alfasigma, E-Pharma Trends, CA-MI) embed inside Arabic sentences without direction bleed (visual across shots). |

### Real Devices (RT-REAL)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-REAL-001 | iOS Real Device Testing | 🚫 | No physical iOS device in sandbox — emulation only. |
| RT-REAL-002 | Android Real Device Testing | 🚫 | No physical Android device in sandbox — emulation only. |
| RT-REAL-003 | Cross-Device Consistency | 🚫 | Cannot be certified without a real-device pass. Emulated matrix (7 widths × 7 pages × 2 locales × 2 themes) is consistent apart from F-27…F-29. |

---

## Results — Page-Specific (18 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-HP-001 | Homepage Mobile Layout | ✅ | 320/375/414 shots: hero stacks, stats 2×2→row, marquee, spotlight card, bottom-nav visible. Spec's "category showcase" step = ShopByNeed + series chips (Report 01 F-13 correction). |
| RT-HP-002 | Homepage Tablet Layout | ✅ | 768 shot: two-column balance, readable stats row. |
| RT-HP-003 | Homepage Desktop Layout | ✅ | 1440/1920 fold + full shots: two-column hero, 4-stat band, full-width sections. |
| RT-PL-001 | Product Listing Mobile | ✅ | 2-col card grid at 375 with search + series chips intact. |
| RT-PL-002 | Product Listing Tablet | ✅ | 2–3 cols at 768. |
| RT-PL-003 | Product Listing Desktop | ✅ | 4-col at 1440/1920; filter row wraps cleanly. |
| RT-PDP-001 | PDP Mobile | ✅ | Image above details, stacked facts table, full-width CTAs (375 shots). |
| RT-PDP-002 | PDP Tablet | ✅ | 768 clean (two-column retained). |
| RT-PDP-003 | PDP Desktop | ⚠️ | 1280+ excellent; **1024px carousel arrow overflows (F-28)**. |
| RT-CART-001 | Cart Mobile | ✅ | Line items + steppers + summary stack (375, empty + loaded). |
| RT-CART-002 | Cart Tablet | ✅ | 768 clean. |
| RT-CART-003 | Cart Desktop | ✅ | 1440 two-column (items + summary) balanced. |
| RT-CK-001 | Checkout Mobile | ✅ | Single column form + summary card (375 with item). |
| RT-CK-002 | Checkout Tablet | ✅ | 768 two-column without crowding. |
| RT-CK-003 | Checkout Desktop | ✅ | 1440 form + sticky sidebar (with item). |
| RT-ACC-001 | Account Dashboard Mobile | ✅ | Live-registered session screenshotted at 375: dashboard + orders stack cleanly. |
| RT-ACC-002 | Account Dashboard Tablet | ✅ | 768 dashboard shot clean. |
| RT-ACC-003 | Account Dashboard Desktop | ✅ | 1280/1440 verified during Report 01 journeys. |

## Results — Component-Specific (23 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| RT-HDR-001 | Header Mobile | ✅ | Compact row: logo + icon actions + burger (375). |
| RT-HDR-002 | Header Tablet | ✅ | Same compact pattern at 768 (nav collapses below `lg`). |
| RT-HDR-003 | Header Desktop | ✅ | Full nav + CTA at 1280–1920. EN 1024 row overflow logged (F-29). |
| RT-HDR-004 | Mobile Menu | ✅ | Sheet 75vw × full height, slide 0.2s, X/Escape/backdrop close (measured + screenshot). |
| RT-HDR-005 | Sticky Header | ✅ | `position: sticky; top: 0` verified after 1200px scroll + scroll-progress companion. |
| RT-FTR-001 | Footer Mobile | ✅ | 4 stacked blocks at 375 (brand + 3 link columns) + legal row. |
| RT-FTR-002 | Footer Tablet | ✅ | 768 wraps to balanced columns. |
| RT-FTR-003 | Footer Desktop | ✅ | 1440 single row of columns (identical across 5 pages — consistency test). |
| RT-NAV-001 | Main Navigation Mobile | ✅ | Collapsed to sheet; all 8 links + login reachable (screenshot). |
| RT-NAV-002 | Main Navigation Tablet | ✅ | 768 = burger pattern (responsive by design). |
| RT-NAV-003 | Main Navigation Desktop | ✅ | Inline row at ≥1024, right-aligned RTL. |
| RT-NAV-004 | Bottom Navigation | ✅ | Fixed bar (measured `inset-x-0 bottom-0 z-40`), 3 tabs + cart badge ("9+" cap). |
| RT-FORM-001 | Form Mobile | ✅ | Contact/checkout fields full-width 375, textarea + counter intact. |
| RT-FORM-002 | Form Tablet | ✅ | 768 balanced field columns. |
| RT-FORM-003 | Form Desktop | ✅ | 1440 two-col field rows + full-width address. |
| RT-FORM-004 | Form Input Resizing | ⚠️ | Inputs fluid ✓; **but 14px input font-size (measured) < 16px → iOS Safari auto-zooms the viewport on focus** (classic mobile defect). → F-32 |
| RT-PC-001 | Product Card Mobile | ✅ | Cards reflow 1-col @320, 2-col @375; clamped text keeps heights uniform. |
| RT-PC-002 | Product Card Tablet | ✅ | 2–3 col @768. |
| RT-PC-003 | Product Card Desktop | ✅ | 4-col @1440 with aligned CTAs. |
| RT-MODAL-001 | Modal Mobile | ✅ | Nav sheet 75vw side-sheet (RTL: from right). |
| RT-MODAL-002 | Modal Tablet | ✅ | Same sheet at 768 (menu is the only modal surface). |
| RT-MODAL-003 | Modal Desktop | 🚫 | No desktop modal exists in the product (nav is inline at ≥1024) — nothing to test. |
| RT-MODAL-004 | Modal Backdrop | ✅ | Dimmed overlay visible behind sheet (screenshot) + z-index layering (measured z-50). |

---

## Defect Register (new — continues F-26)

| ID | Sev | Finding | Cases | Recommendation |
|---|---|---|---|---|
| **F-27** | Medium | **Horizontal overflow at 320px on `/en`** — marquee track `div.flex.w-max…animate-marquee` (2868px) and decorative `.-end-32` blob extend `scrollWidth` to 355px. | RT-VP-002, RT-BP-001, RT-SCROLL-002 | Clip the marquee container (`overflow-hidden` on the outer wrapper at all breakpoints) and bound decorative blobs with `max-width`/`hidden sm:block`. |
| **F-28** | Medium | **PDP overflows at 1024px (ar)** — carousel control `button.size-9` positioned at x −40…−4 outside its RTL container → `scrollWidth` 1064 vs 1024. | RT-BP-003, RT-PDP-003 | Keep carousel arrows inside the Embla container (`absolute start-2`) or hide them below `lg` in favor of swipe/dots. |
| **F-29** | Medium | **`/en` home overflows at 1024px** — header action cluster (3 `a.group/button` items) exceeds the row → `scrollWidth` 1165 vs 1024 (EN labels wider than AR). | RT-BP-003, RT-HDR-003 | Tighten header gap/padding at the `lg` boundary or hide the CTA label into an icon below 1120px. |
| **F-30** | Low | **Touch-target heights 20px** on nav/footer/sheet text links (measured `343×20`) and 34×40 logo link — below WCAG 2.5.8 (24px) and platform guidance (44px). Spacing exception barely covers it. | RT-TOUCH-001 | Add `py-2` (min 24px) or `inline-flex min-h-11` to link rows. |
| **F-31** | Info | No CSS `scroll-snap` anywhere (measured 0) — carousels use Embla transforms (swipe works). Spec mismatch only. | RT-SCROLL-003 | Re-scope the case to "carousel swiping" or add `scroll-snap-type: x mandatory` if snap feel is desired. |
| **F-32** | Low | Form inputs measure **14px font-size** — iOS Safari zooms the viewport on focus of <16px fields, breaking responsive layout during entry. | RT-FORM-004 | Set input/textarea font-size ≥16px on mobile (`text-base` at small breakpoint). |

**Cross-referenced from earlier reports:** F-12 (pre-hydration click loss — RT-TOUCH-003 interactions require hydration wait), F-13 ("category showcase" wording vs ShopByNeed/series — RT-HP-00x), F-26 (reveal opacity-0 capture artifacts — seen in full-page shots).

## Spec Corrections (Report 03)

1. **Total case count is 80**, not 39 — the report includes page-specific (RT-HP/PL/PDP/CART/CK/ACC) and component-specific (RT-HDR/FTR/NAV/FORM/PC/MODAL) blocks in addition to the 39 core cases. All 80 are classified above.
2. **RT-HP-001…003 "verify category showcase"** — implemented as ShopByNeed + series browsing (+ orphaned `category-showcase.tsx`, Report 01 F-13).
3. **RT-SCROLL-003 "scroll-snap-type"** — carousels are Embla-based (F-31).
4. **RT-MODAL-00x** — only modal surface is the mobile nav sheet; desktop modal case is N/A by design.
5. **RT-REAL-001…003** — real-device certification requires hardware outside this sandbox; emulation evidence stands in until a device farm pass is scheduled.

---

## Final Tally

| Group | Total | ✅ | ⚠️ | ❌ | 🚫 |
|---|---:|---:|---:|---:|---:|
| RT-VP | 3 | 2 | 1 | 0 | 0 |
| RT-BP | 5 | 3 | 1 | 1 | 0 |
| RT-TYPO | 5 | 5 | 0 | 0 | 0 |
| RT-IMG | 5 | 5 | 0 | 0 | 0 |
| RT-OR | 4 | 4 | 0 | 0 | 0 |
| RT-ZOOM | 3 | 2 | 1 | 0 | 0 |
| RT-SCROLL | 4 | 1 | 2 | 0 | 1 |
| RT-TOUCH | 3 | 2 | 1 | 0 | 0 |
| RT-RTL | 4 | 4 | 0 | 0 | 0 |
| RT-REAL | 3 | 0 | 0 | 0 | 3 |
| Pages (HP…ACC) | 18 | 17 | 1 | 0 | 0 |
| Components (HDR…MODAL) | 23 | 21 | 1 | 0 | 1 |
| **TOTAL** | **80** | **66** | **8** | **1** | **5** |

*(Group ⚠ rows: RT-VP-002, RT-BP-001 & RT-BP-003❌, RT-ZOOM-002, RT-SCROLL-002 & 003⚠, RT-TOUCH-001, RT-PDP-003, RT-FORM-004 = 8 ⚠ total + RT-BP-003 ❌; 🚫: RT-SCROLL-004, RT-REAL×3, RT-MODAL-003.)*

## Reproduction Appendix

```bash
export LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp PLAYWRIGHT_BASE_URL=http://localhost:3000

# 70-combo overflow matrix with culprits
cd /home/user/scratch && node overflow-finder.mjs

# measured responsive/RTL audit (11 tests)
cd /home/user/NPF && npx playwright test --config /home/user/scratch/pw-extra.config.mjs \
  /home/user/scratch/e2e-patched/responsive-audit.spec.ts

# screenshot matrix + account screenshots
cd /home/user/scratch && node shots.mjs && node acc-shots.mjs   # → scratch/shots/
```

**Sign-off:** Report 03 executed in full (80/80 cases classified with live evidence). **66 ✅ / 8 ⚠️ / 1 ❌ / 5 🚫.** Three horizontal-overflow defects (F-27…F-29) are the priority fixes; RTL implementation quality is high. Ready for Report 04.
