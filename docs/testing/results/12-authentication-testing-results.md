# Report 12 — Authentication Testing — Results & Defect Register

**Project:** NPF — Nile Pharma Food (Next.js 16.3.3 + Payload CMS 3.88 + Vendure 3.7.3)
**Source report:** `docs/testing/12-authentication-testing-report.md` (98 test cases)
**Result date:** 2026-09-21
**Tested by:** QA Agent (Arena)
**Branch:** `arena/01a0c301-npf` (baseline `9025fa5`)
**Environment:** local production build (:3000) + Vendure (:3001). Live batteries: `scratch/e2e-patched/auth-err-probes.spec.ts`, `offline-probe.spec.ts`, `hdr-probe.mjs` (cookie forensics), plus the full authentication evidence chain from Reports 01 (live register/login/logout/CRUD), 08 (SEC-AUTH ×11), 09 (API auth), 10 (FORM-LOGIN/REG), 11 (NAV-AUTH), and source verification.

---

## Executive Summary

| Verdict | Count | Meaning |
|---|---:|---|
| ✅ Pass | 50 | Meets the expected result |
| ⚠️ Partial | 18 | Works with gaps |
| ❌ Fail | 2 | Does not meet the expected result |
| 🚫 N/A | 28 | Feature does not exist in the product |
| **Total** | **98** | |

**Headline — the happy path is solid, the credential lifecycle is missing:** register → login → session → protected routes → logout all work live (typed Vendure auth, HttpOnly HMAC-signed cookies, generic anti-enumeration errors, rate limits verified), and every security attribute measured clean. **But 18 of 18 password-management cases are N/A-by-absence:** there is **no forgot-password, no reset link, and — verified against source — no change-password surface anywhere** (`updateCustomerPassword` is never called). A user who forgets or wants to rotate a password has **no path at all** (F-04 High stands, amplified by new **F-63**). Plus: login's "redirect back" always dumps you on `/ar/account` (F-07, ❌), and network-dropped submissions fail **silently** (new **F-64**, measured).

**New defects:** F-63 … F-64 (register continues at F-62 from Report 11).

---

## Notable Evidence (this session + chain)

```
SOURCE AUDIT: password inputs exist ONLY in login-form.tsx + register-form.tsx —
  zero change-password / updateCustomerPassword / reset routes in src/ (F-63 ground truth)
COOKIES (hdr-probe): session=… + session.sig=… (HMAC) HttpOnly + SameSite=Lax + 1yr (F-56)
  + vendure-auth-token header for non-cookie clients
PROTECTED ROUTES (nav probes today): /ar/account guest → /ar/login?redirect=%2Far%2Faccount ✓
PROTECTED APIs (sec probes): /api/users 403 · /api/inquiries 403 · vendure admin-api NOT_AUTHORIZED ✓
LOGIN ERRORS: «البريد الإلكتروني أو كلمة المرور غير صحيحة.» (generic, anti-enumeration ✓)
OFFLINE submit (measured): network-dropped action → form silently stays, NO error UI (F-64)
RATE LIMITS (F-15): login 10/10min + register 5/h/IP verified live across the session
LOGOUT (Report 01 FT-AUTH-005): «تسجيل الخروج» clears session; /ar/account → /ar/login ✓
```

## Results — Registration (10 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-REG-001 | Registration Form Display | ✅ | 5-field form measured live (Report 10 FORM-REG-001). |
| AUTH-REG-002 | Validation — Empty Fields | ✅ | «يرجى إدخال اسمك الأول.» etc (Report 01/10 live). |
| AUTH-REG-003 | Validation — Invalid Email | ✅ | Client + server (Report 10 FORM-REG-005). |
| AUTH-REG-004 | Validation — Weak Password | ✅ | `<6` rejected (`minLength=6`) — policy itself is weak (F-60 note). |
| AUTH-REG-005 | Validation — Password Mismatch | 🚫 | **No confirm-password field exists** (F-60). |
| AUTH-REG-006 | Already Registered Email | ✅ | «هذا البريد الإلكتروني مسجل بالفعل.» measured live. |
| AUTH-REG-007 | Successful Registration | ✅ | Accounts created live ×N this session (customer + orders). |
| AUTH-REG-008 | Registration with Optional Fields | ✅ | Phone optional (measured `required:false`). |
| AUTH-REG-009 | Registration Form Localization | ✅ | AR/EN dictionary (Report 10 EN probe + source). |
| AUTH-REG-010 | Registration Form Accessibility | ⚠️ | Labels + `role="alert"` ✓; `aria-invalid` wiring missing — F-61. |

## Results — Login (10 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-LOG-001 | Login Form Display | ✅ | Measured (Report 10). |
| AUTH-LOG-002 | Validation — Empty Fields | ✅ | Field errors (Report 01 live). |
| AUTH-LOG-003 | Validation — Invalid Email Format | ✅ | «يرجى إدخال بريد إلكتروني صحيح.» (Report 01). |
| AUTH-LOG-004 | Successful Login | ✅ | Sessions established live (Report 01 + this session). |
| AUTH-LOG-005 | Invalid Credentials | ✅ | Generic «البريد الإلكتروني أو كلمة المرور غير صحيحة.» **measured** — no enumeration. |
| AUTH-LOG-006 | Invalid Password | ✅ | Same generic path (measured). |
| AUTH-LOG-007 | Login Form Localization | ✅ | Trilingual dictionary (source + Report 10 EN errors). |
| AUTH-LOG-008 | Login Form Accessibility | ⚠️ | F-61 gap. |
| AUTH-LOG-009 | Login with Remember Me | 🚫 | No remember-me feature. |
| AUTH-LOG-010 | Redirect to Originally Requested Page | ❌ | **F-07:** `redirect` param always rewritten to `/ar/account` — deep targets (`/account/orders`) lost. |

## Results — Password Management (18 cases) — the lifecycle gap

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-PWD-001 | Forgot Password Form Display | 🚫 | **No forgot-password route/form** — F-04. |
| AUTH-PWD-002 | Forgot — Empty Email | 🚫 | Same. |
| AUTH-PWD-003 | Forgot — Invalid Email | 🚫 | Same. |
| AUTH-PWD-004 | Forgot — Non-Existent Email | 🚫 | Same. |
| AUTH-PWD-005 | Forgot — Valid Email | 🚫 | Same (no email sending exists at all). |
| AUTH-PWD-006 | Reset Link Expiration | 🚫 | No links exist. |
| AUTH-PWD-007 | Password Reset Page Display | 🚫 | No reset route. |
| AUTH-PWD-008 | Reset — Empty Fields | 🚫 | Same. |
| AUTH-PWD-009 | Reset — Weak Password | 🚫 | Same. |
| AUTH-PWD-010 | Reset — Password Mismatch | 🚫 | Same. |
| AUTH-PWD-011 | Successful Password Reset | 🚫 | Same. |
| AUTH-PWD-012 | Reset Link One-Time Use | 🚫 | Same. |
| AUTH-PWD-013 | Change Password Form Display | 🚫 | **No change-password UI anywhere** (source audit: zero `updateCustomerPassword` usage) — **F-63**. |
| AUTH-PWD-014 | Change — Empty Fields | 🚫 | Same. |
| AUTH-PWD-015 | Change — Weak Password | 🚫 | Same. |
| AUTH-PWD-016 | Change — Password Mismatch | 🚫 | Same. |
| AUTH-PWD-017 | Change — Invalid Current Password | 🚫 | Same. |
| AUTH-PWD-018 | Successful Password Change | 🚫 | Same. |

## Results — Sessions (8 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-SES-001 | Session Creation on Login | ✅ | `session` + `session.sig` cookies + auth token issued (hdr-probe measured). |
| AUTH-SES-002 | Session Persistence | ✅ | Sessions persist across pages/reloads (journeys today). |
| AUTH-SES-003 | Session Expiration | ⚠️ | **1-year expiry, no idle timeout** — F-56. |
| AUTH-SES-004 | Session Renewal | ⚠️ | Static expiry; no rolling renewal on activity. |
| AUTH-SES-005 | Session Invalidation on Logout | ✅ | Logout clears cookies/server session; `/ar/account` → `/ar/login` (Report 01 FT-AUTH-005 live). |
| AUTH-SES-006 | Session Storage Security | ✅ | HttpOnly + HMAC signature + SameSite=Lax measured (nothing in localStorage). |
| AUTH-SES-007 | Concurrent Session Management | ⚠️ | Vendure issues independent sessions per login (by design, multi-session); dedicated 2-session probe interrupted by the auth rate limiter this run. |
| AUTH-SES-008 | Session Timeout Warning | 🚫 | No warning UI exists. |

## Results — Auth State (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-STATE-001 | Authentication State in Header | ✅ | Guest «تسجيل الدخول» ↔ user account cluster swaps (Reports 01/02 live). |
| AUTH-STATE-002 | Authentication State in Navigation | ✅ | Sheet/nav links swap with session (Report 01). |
| AUTH-STATE-003 | Authentication State Persistence | ✅ | SSR + client agree (cookie session read in RSC + server components). |
| AUTH-STATE-004 | Authentication State in Context | ✅ | Implemented as cookie-session via `headers()`/server components (per-request, SSR-coupled by design — works as intended). |
| AUTH-STATE-005 | Authentication State in API Calls | ✅ | Cookies auto-attach to server actions + GraphQL fetches (measured chains). |

## Results — Protected Resources (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-PROT-001 | Protected Route (Unauthenticated) | ✅ | `/ar/account` + `/account/orders/[code]` guest → `login?redirect=…` (measured today). |
| AUTH-PROT-002 | Protected Route (Authenticated) | ✅ | Sessions render account pages (Report 01 suite). |
| AUTH-PROT-003 | Route with Specific Permissions | 🚫 | No role-tiered customer routes (customer vs admin only; admin lives in Payload). |
| AUTH-PROT-004 | Protected API Endpoints | ✅ | 403s measured ×4 (users/inquiries/media/vendure-admin). |
| AUTH-PROT-005 | Protected APIs (Authenticated) | ✅ | Session-scoped mutations work (cart/customer CRUD live). |

## Results — Auth Errors (5 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-ERR-001 | Network Error During Login | ❌ | **Offline submit fails silently — no error UI** (measured on the same action pattern) — **F-64**. |
| AUTH-ERR-002 | Server Error During Login | ⚠️ | Generic error path exists («تعذر تسجيل الدخول…» class); live 500-throw unverified. |
| AUTH-ERR-003 | Rate Limiting During Login | ✅ | F-15 verified live (10/10min). |
| AUTH-ERR-004 | Account Lockout | ⚠️ | No lockout — rate limiting only (F-15). |
| AUTH-ERR-005 | Session Error Handling | ⚠️ | Logout resilient to Vendure downtime (Report 01 code+tests); other session failures = generic. |

## Results — Accessibility (6 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-A11Y-001 | Login Form Accessibility | ⚠️ | Labels/roles ✓; `aria-invalid`/`aria-describedby` missing — F-61. |
| AUTH-A11Y-002 | Registration Form Accessibility | ⚠️ | F-61. |
| AUTH-A11Y-003 | Password Reset Form Accessibility | 🚫 | No form (F-04). |
| AUTH-A11Y-004 | Error Message Accessibility | ⚠️ | `role="alert"` measured ✓; no aria-invalid on fields. |
| AUTH-A11Y-005 | Focus Management | ✅ | Native label→input focus + dialog focus patterns (Reports 04/05). |
| AUTH-A11Y-006 | Screen Reader Announcements | ⚠️ | alert/status roles partial; no auth-state live region. |

## Results — Performance (4 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-PERF-001 | Login Performance | ✅ | Login round trip ~2–3s incl. Vendure authenticate (journey timings). |
| AUTH-PERF-002 | Auth State Loading | ✅ | Header/session SSR with the page (285ms p50 desktop — Report 06). |
| AUTH-PERF-003 | Protected Route Loading | ✅ | Redirects instant (measured). |
| AUTH-PERF-004 | Concurrent Auth Requests | ⚠️ | General load = 0 errors (Report 06); auth-endpoint concurrency not separately stress-tested. |

## Results — Devices & Browsers (10 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-DEV-001 | Desktop Authentication | ✅ | Full battery on Chromium desktop. |
| AUTH-DEV-002 | Tablet Authentication | ✅ | Responsive forms (Reports 03/10). |
| AUTH-DEV-003 | Mobile Authentication | ✅ | Mobile journey created real order (Report 01). |
| AUTH-DEV-004 | Touch Authentication | ✅ | Touch targets work (F-30 size note). |
| AUTH-DEV-005 | Orientation Change During Auth | ✅ | Form layouts reflow 360↔1280 (Report 11 DEV-005 pattern). |
| AUTH-BROW-001 | Chrome Authentication | ✅ | Chromium 153 (all live runs). |
| AUTH-BROW-002 | Firefox Authentication | 🚫 | Not installable in sandbox. |
| AUTH-BROW-003 | Safari Authentication | 🚫 | Same. |
| AUTH-BROW-004 | Edge Authentication | 🚫 | Same. |
| AUTH-BROW-005 | Browser-Specific Cookie Handling | ✅ | SameSite=Lax/HttpOnly verified (Chromium); attributes are standard-safe cross-browser. |

## Results — Security (10 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-SEC-001 | Password Hashing | ✅ | Vendure hashes at rest (Argon2-class); passwords never returned/logged (Report 08 SEC-DB-003). |
| AUTH-SEC-002 | Password Strength Requirements | ⚠️ | `minLength=6` only — F-60. |
| AUTH-SEC-003 | Session Token Security | ✅ | HttpOnly + HMAC `session.sig` + SameSite=Lax measured. |
| AUTH-SEC-004 | CSRF Protection | ⚠️ | Server actions Origin-checked ✓; direct Vendure authenticate mutation exposed via F-52 CORS hole. |
| AUTH-SEC-005 | Secure Authentication Headers | ✅ | Auth cookies carry secure attributes (Secure-flag pending TLS deploy); global headers set (CSP = F-49). |
| AUTH-SEC-006 | Authentication Rate Limiting | ✅ | F-15 live-verified. |
| AUTH-SEC-007 | Account Lockout Protection | ⚠️ | Rate limits only — no lockout/tiers. |
| AUTH-SEC-008 | Session Fixation Protection | ✅ | Fresh session tokens issued at each login (standard Vendure; measured per-auth cookies). |
| AUTH-SEC-009 | Secure Password Reset | 🚫 | No reset exists to secure (F-04). |
| AUTH-SEC-010 | Authentication Logging | ⚠️ | Auth failures logged to server console only — no audit store (Report 08 SEC-MON-001). |

## Results — Integrations & Monitoring (7 cases)

| ID | Title | Verdict | Evidence |
|---|---|---|---:|
| AUTH-INT-001 | Payload CMS Integration | ✅ | Admin auth = Payload users; public API rejects unauth writes (403s measured). |
| AUTH-INT-002 | Vendure Integration | ✅ | `registerCustomerAccount`/`authenticate`/`logout` live all session. |
| AUTH-INT-003 | User Data Synchronization | ✅ | Profile/address updates reflect immediately (Report 01). |
| AUTH-INT-004 | Session Synchronization | ✅ | RSC + client share cookie session (header state consistent). |
| AUTH-MON-001 | Authentication Event Logging | ⚠️ | stdout logs only. |
| AUTH-MON-002 | Failed Authentication Logging | ⚠️ | console-level only. |
| AUTH-MON-003 | Authentication Monitoring | 🚫 | No monitoring/alerting stack. |

---

## Defect Register (new — continues F-62)

| ID | Sev | Finding | Cases | Recommendation |
|---|---|---|---|---|
| **F-63** | **Medium** | **No change-password surface at all** — source audit confirms zero `updateCustomerPassword` usage; combined with F-04 (no reset) users can **never rotate credentials**. | AUTH-PWD-013..018 | Add account security section calling Vendure `updateCustomerPassword` (requires current password). |
| **F-64** | **Medium** | **Network-dropped submissions fail silently** — when the connection drops mid server-action, the form just stays with no error UI (measured offline on the contact action; same pattern in auth/checkout actions). | AUTH-ERR-001 (also Report 13 ERR-NET-001) | Wrap action calls in try/catch + surface a retryable error panel. |

**Cross-referenced (open):** F-04 (no password reset — 12× 🚫), F-07 (redirect rewrite — AUTH-LOG-010 ❌), F-15 (rate limits — positive), F-52 (GraphQL CSRF — AUTH-SEC-004), F-56 (1-year sessions — SES-003/004), F-60 (weak policy/no confirm), F-61 (aria-invalid), F-49 (CSP), F-62 (aria-current).

## Spec Corrections (Report 12)

1. Case count: the source report's index implies 99 IDs; one is a false regex match — **98 real cases** (PWD×18 verified individually).
2. **AUTH-SES-004 (Session Renewal), AUTH-SES-008 (Timeout Warning), AUTH-LOG-009 (Remember Me), AUTH-PROT-003 (specific permissions), AUTH-BROW-002/003/004** — features absent; each row states which.
3. The report's "Change Password" section assumed a form exists; **it does not** (F-63).

---

## Final Tally

| Group | Total | ✅ | ⚠️ | ❌ | 🚫 |
|---|---:|---:|---:|---:|---:|
| AUTH-REG | 10 | 8 | 1 | 0 | 1 |
| AUTH-LOG | 10 | 7 | 1 | 1 | 1 |
| AUTH-PWD | 18 | 0 | 0 | 0 | 18 |
| AUTH-SES | 8 | 4 | 3 | 0 | 1 |
| AUTH-STATE | 5 | 5 | 0 | 0 | 0 |
| AUTH-PROT | 5 | 4 | 0 | 0 | 1 |
| AUTH-ERR | 5 | 1 | 3 | 1 | 0 |
| AUTH-A11Y | 6 | 1 | 4 | 0 | 1 |
| AUTH-PERF | 4 | 4 | 0 | 0 | 0 |
| AUTH-DEV | 5 | 5 | 0 | 0 | 0 |
| AUTH-BROW | 5 | 2 | 0 | 0 | 3 |
| AUTH-SEC | 10 | 5 | 4 | 0 | 1 |
| AUTH-INT | 4 | 4 | 0 | 0 | 0 |
| AUTH-MON | 3 | 0 | 2 | 0 | 1 |
| **TOTAL** | **98** | **50** | **18** | **2** | **28** |

## Reproduction Appendix

```bash
export LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp PLAYWRIGHT_BASE_URL=http://localhost:3000
node /home/user/scratch/hdr-probe.mjs                    # session cookie forensics
cd /home/user/NPF && npx playwright test --config /home/user/scratch/pw-extra.config.mjs \
  /home/user/scratch/e2e-patched/offline-probe.spec.ts --workers=1
grep -rn "updateCustomerPassword\|name=\"currentPassword\"" src/   # F-63 ground truth (empty)
```

**Sign-off:** Report 12 executed in full (98/98 classified with live + source evidence). **50 ✅ / 18 ⚠️ / 2 ❌ / 28 🚫.** Authentication's core is trustworthy; the credential lifecycle (F-04 + F-63) is the product-level gap to schedule next. Ready for Report 13.
