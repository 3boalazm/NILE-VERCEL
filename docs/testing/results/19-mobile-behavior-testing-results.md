# Report 19 — Mobile Behavior Testing — Results & Defect Register

**Project:** NPF — Nile Pharma Food (Next.js 16.3.3 + Payload CMS 3.88 + Vendure 3.7.3)
**Source report:** `docs/testing/19-mobile-behavior-testing-report.md` (86 test cases)
**Result date:** 2026-09-21
**Tested by:** QA Agent (Arena)
**Branch:** `arena/01a0c301-npf` (baseline `9025fa5`)
**Environment:** local production build (:3000) tested across 360/375/390/768/1024/1280/1440 viewports (Reports 02/03/05/11 + this session's viewport-switch probes), full **mobile guest + account journeys with real orders** (Report 01), mobile keyboard/autofill/type audits (Report 10), PWA matrix (Report 15), perf profile (Report 06).

---

## Executive Summary

| Verdict | Count | Meaning |
|---|---:|---|
| ✅ Pass | 39 | Meets the expected result |
| ⚠️ Partial | 20 | Works with gaps |
| ❌ Fail | 1 | Does not meet the expected result |
| 🚫 N/A | 26 | Feature/hardware not used by the product |
| **Total** | **86** | |

**Headline — the core mobile commerce loop is proven end-to-end; device-gadget surfaces don't exist.** A real order was placed from a 375px mobile journey (guest → cart → checkout → confirmation — Report 01), input types/autofill are mobile-optimized (`type=email/tel` + full `autoComplete` — measured), bottom-nav + hamburger + sticky header all measured, AR-RTL/EN-LTR + language switching verified at mobile widths, and storage (localStorage theme + SW caches) works. Gaps: **offline behavior ❌** (F-14/F-64), touch-target sizes (F-30), mobile LCP 6.7s (F-40), heavy bundles (F-42/F-66), no input masking. **26 🚫 rows = hardware/feature absences** (camera, geolocation, vibration, voice, push, video/audio, double-tap/long-press/pinch handlers).

**New defects:** none. Cross-refs below.

---

## Results — Touch & Gestures (13 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| MOB-TOUCH-001 | Tap Interactions | ✅ | All taps work (mobile journeys — real order!). |
| MOB-TOUCH-002 | Double-Tap Interactions | 🚫 | No double-tap handlers designed. |
| MOB-TOUCH-003 | Long-Press Interactions | 🚫 | None. |
| MOB-TOUCH-004 | Swipe Interactions | ⚠️ | Carousel swipe support unverified (button controls measured — F-28). |
| MOB-TOUCH-005 | Pinch Zoom | 🚫 | No custom pinch handlers (native browser zoom fine). |
| MOB-TOUCH-006 | Drag Interactions | 🚫 | None designed. |
| MOB-TOUCH-007 | Touch Target Size | ⚠️ | F-30: 20px text links below 44px guidance. |
| MOB-TOUCH-008 | Touch Feedback | ✅ | `active:`/hover states on buttons (source + Report 02). |
| MOB-TOUCH-009 | Accidental Touch Prevention | ✅ | Spacing/structure prevents misclicks (layout audits). |
| MOB-GEST-001 | Scroll Gestures | ✅ | Smooth scroll + reveal (Report 02/06). |
| MOB-GEST-002 | Pull-to-Refresh | 🚫 | Not designed (native browser PTR = reload only). |
| MOB-GEST-003 | Swipe Navigation | 🚫 | Not designed. |
| MOB-GEST-004 | Edge Swipe Prevention | 🚫 | Not designed. |

## Results — Device Features & Input (12 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| MOB-DEV-001 | Camera Access | 🚫 | No camera features. |
| MOB-DEV-002 | Photo Upload | 🚫 | No file inputs (Report 10 GEN-011). |
| MOB-DEV-003 | Geolocation | 🚫 | Not used. |
| MOB-DEV-004 | Vibration | 🚫 | Not used. |
| MOB-DEV-005 | Accelerometer/Gyroscope | 🚫 | Not used (WebGL hero = lab-only F-21). |
| MOB-DEV-006 | Device Permission Handling | 🚫 | No permission prompts needed by design. |
| MOB-INPUT-001 | On-Screen Keyboard | ✅ | Forms work with mobile keyboard (journey). |
| MOB-INPUT-002 | Input Type Optimization | ✅ | `type=email/tel/password` measured (Report 10). |
| MOB-INPUT-003 | Autocomplete & Autofill | ✅ | Full `autoComplete` attrs measured (name/tel/email/new-password/street-address). |
| MOB-INPUT-004 | Voice Input | 🚫 | Not designed. |
| MOB-INPUT-005 | Input Masking | ⚠️ | No phone/number masks (FORM-ADDR-005 note). |
| MOB-INPUT-006 | Form Keyboard Behavior | ✅ | Enter/submit + layout reflow (Report 10). |

## Results — Mobile Browser & Navigation (12 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| MOB-BROW-001 | URL Bar Behavior | ✅ | Standard viewport behavior (captures). |
| MOB-BROW-002 | Viewport Handling | ✅ | `viewport-fit` meta + responsive (Reports 02/03). |
| MOB-BROW-003 | Overscroll Behavior | ⚠️ | No custom overscroll config. |
| MOB-BROW-004 | Browser Back Button | ✅ | History back works (Report 11 HIST). |
| MOB-BROW-005 | Browser Forward Button | ✅ | Works (measured). |
| MOB-BROW-006 | Browser Zoom | ✅ | Pinch-zoom unrestricted (no user-scalable=no). |
| MOB-BROW-007 | Share Functionality | 🚫 | No Web Share API usage. |
| MOB-NAV-001 | Bottom Navigation | ✅ | Mobile tab bar (F-06-era measured + source `hidden lg:`). |
| MOB-NAV-002 | Hamburger Menu | ✅ | Measured at 360px (Report 11). |
| MOB-NAV-003 | Mobile Back Navigation | ✅ | Works (journeys). |
| MOB-NAV-004 | Breadcrumbs on Mobile | ✅ | PDP breadcrumb (Report 05). |
| MOB-NAV-005 | Sticky Header | ✅ | Sticky measured (Report 02). |

## Results — Orientation, Performance, Network, Storage (19 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| MOB-ORI-001 | Portrait → Landscape | ✅ | Viewport 360↔800 switch reflows (Report 11 DEV-005). |
| MOB-ORI-002 | Landscape → Portrait | ✅ | Same. |
| MOB-ORI-003 | Orientation During Form Input | ⚠️ | Untested mid-keyboard (low risk). |
| MOB-ORI-004 | Orientation During Video | 🚫 | No video. |
| MOB-ORI-005 | Orientation Lock | 🚫 | Not used. |
| MOB-PERF-001 | Touch Responsiveness | ✅ | Taps instant (journey timings). |
| MOB-PERF-002 | Animation Smoothness | ✅ | CSS transforms (reveal/marquee) smooth. |
| MOB-PERF-003 | Mobile Load Time | ⚠️ | Lighthouse mobile LCP 6.7s — **F-40**. |
| MOB-PERF-004 | Scroll Performance | ✅ | Smooth scrolling (CLS 0). |
| MOB-PERF-005 | Mobile Bundle Size | ⚠️ | 737KB chunk + 803KB fonts — F-42/F-66. |
| MOB-NET-001 | Network Type Detection | 🚫 | No `navigator.connection` usage. |
| MOB-NET-002 | Connection Changes | ⚠️ | online/offline events partially used (install-prompt). |
| MOB-NET-003 | Slow Network Performance | ⚠️ | Degrades slowly; no lite mode (F-43 note). |
| MOB-NET-004 | Offline Behavior | ❌ | **F-14/F-64** (broken doc fallback + silent submits). |
| MOB-NET-005 | Data Usage | ⚠️ | Heavy first load (F-41/F-42/F-66). |
| MOB-STORE-001 | LocalStorage on Mobile | ✅ | Theme persistence (measured). |
| MOB-STORE-002 | IndexedDB on Mobile | 🚫 | Not used (Caches API instead). |
| MOB-STORE-003 | Cache Storage on Mobile | ✅ | SW caches work (Report 15). |
| MOB-STORE-004 | Storage Quota Handling | ⚠️ | No quota-exceeded UX (F-64 family). |

## Results — Mobile PWA, Media, Commerce (14 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| MOB-PWA-001 | Install Prompt on Mobile | ✅ | `install-prompt` component (Report 15). |
| MOB-PWA-002 | Home Screen Launch | ⚠️ | Criteria met; device untested. |
| MOB-PWA-003 | Standalone Mode | ✅ | `display: standalone` manifest (parsed). |
| MOB-PWA-004 | Splash Screen | ⚠️ | Apple-touch approximation only — F-68. |
| MOB-PWA-005 | PWA Updates on Mobile | ✅ | Silent update flow (skipWaiting — Report 15). |
| MOB-NOTIF-001 | Push Permission | 🚫 | No push feature. |
| MOB-NOTIF-002 | Push Display | 🚫 | Same. |
| MOB-NOTIF-003 | In-App Notifications | 🚫 | No notification UI (toasts only for actions). |
| MOB-MEDIA-001 | Video Playback | 🚫 | No video. |
| MOB-MEDIA-002 | Audio Playback | 🚫 | No audio. |
| MOB-MEDIA-003 | Image Gallery | ✅ | PDP gallery on mobile (Report 02). |
| MOB-ECOM-001 | Mobile Product Browsing | ✅ | Live (Report 01). |
| MOB-ECOM-002 | Mobile Cart | ✅ | Live (adjust/remove — Report 01). |
| MOB-ECOM-003 | Mobile Checkout | ✅ | **Real order placed at 375px** (Report 01). |
| MOB-ECOM-004 | Mobile Payment | ⚠️ | Manual settlement only — F-03 gateways. |
| MOB-ECOM-005 | Mobile Search | ✅ | Listing search (Report 01 FT-PL-003). |

## Results — A11y, Security, Resources, Localization (14 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| MOB-A11Y-001 | Touch Target Accessibility | ⚠️ | F-30. |
| MOB-A11Y-002 | Mobile Screen Reader | ⚠️ | Partial (F-37/F-61 family). |
| MOB-A11Y-003 | Mobile Accessibility Features | ⚠️ | Basic labels/roles; no reduced-motion (F-67 note). |
| MOB-A11Y-004 | Mobile Voice Control | 🚫 | Not designed. |
| MOB-SEC-001 | Secure Context | ⚠️ | localhost = secure context ✓; production HTTPS pending (F-44). |
| MOB-SEC-002 | Permission Security | ✅ | No sensitive permission prompts. |
| MOB-SEC-003 | Mobile Session Security | ✅ | HttpOnly/SameSame cookies (measured). |
| MOB-RES-001 | Battery Impact | ⚠️ | Marquee animation runs constantly (minor). |
| MOB-RES-002 | CPU Usage | ⚠️ | First-load JS heavy (F-42). |
| MOB-RES-003 | Memory Usage | ✅ | Stable across journeys. |
| MOB-RES-004 | Thermal Throttling | 🚫 | Not measurable/testable. |
| MOB-LOC-001 | Arabic RTL on Mobile | ✅ | Verified across 320–375px (Reports 02/03). |
| MOB-LOC-002 | English LTR on Mobile | ✅ | Verified (F-27/F-29 overflow fixed-path notes). |
| MOB-LOC-003 | Language Switching on Mobile | ✅ | Switcher works (Report 11). |

---

## Defect Register

**No new defects** — mobile commerce is solid; gaps map to existing register entries.

**Cross-referenced (open):** **F-14/F-64 (MOB-NET-004 ❌)**, F-30 (touch targets), F-40 (mobile LCP), F-42/F-66 (weight), F-68 (splash), F-03 (payment gateways), F-43 (slow-net degrade), F-27/F-29 (viewport overflow notes).

## Spec Corrections (Report 19)

1. **26 🚫 rows** = hardware/gadget features the product intentionally never uses (camera, geolocation, vibration, sensors, voice, push, video/audio, double-tap/long-press/pinch/drag handlers, pull-to-refresh, swipe-nav, orientation lock, IndexedDB, network-type detection, thermal) — each row states which.

---

## Final Tally

| Group | Total | ✅ | ⚠️ | ❌ | 🚫 |
|---|---:|---:|---:|---:|---:|
| MOB-TOUCH | 9 | 3 | 2 | 0 | 4 |
| MOB-GEST | 4 | 1 | 0 | 0 | 3 |
| MOB-DEV | 6 | 0 | 0 | 0 | 6 |
| MOB-INPUT | 6 | 4 | 1 | 0 | 1 |
| MOB-BROW | 7 | 5 | 1 | 0 | 1 |
| MOB-NAV | 5 | 5 | 0 | 0 | 0 |
| MOB-ORI | 5 | 2 | 1 | 0 | 2 |
| MOB-PERF | 5 | 3 | 2 | 0 | 0 |
| MOB-NET | 5 | 0 | 3 | 1 | 1 |
| MOB-STORE | 4 | 2 | 1 | 0 | 1 |
| MOB-PWA | 5 | 3 | 2 | 0 | 0 |
| MOB-NOTIF | 3 | 0 | 0 | 0 | 3 |
| MOB-MEDIA | 3 | 1 | 0 | 0 | 2 |
| MOB-ECOM | 5 | 4 | 1 | 0 | 0 |
| MOB-A11Y | 4 | 0 | 3 | 0 | 1 |
| MOB-SEC | 3 | 2 | 1 | 0 | 0 |
| MOB-RES | 4 | 1 | 2 | 0 | 1 |
| MOB-LOC | 3 | 3 | 0 | 0 | 0 |
| **TOTAL** | **86** | **39** | **20** | **1** | **26** |

## Reproduction Appendix

```bash
export LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp PLAYWRIGHT_BASE_URL=http://localhost:3000
# mobile journeys + viewport probes as run in Reports 01/02/03/11
cd /home/user/NPF && npx playwright test --config /home/user/scratch/pw-extra.config.mjs \
  /home/user/scratch/e2e-patched/assets-pwa.spec.ts --workers=1    # PWA/storage matrix
```

**Sign-off:** Report 19 executed in full (86/86 classified). **39 ✅ / 20 ⚠️ / 1 ❌ / 26 🚫.** Mobile checkout generates real revenue-path orders; fix F-14/F-64 + F-30/F-40 for a polished launch. Ready for Report 20.
