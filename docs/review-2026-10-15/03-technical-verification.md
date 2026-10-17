# 03 — التحقق الفني والاختبارات وحدود الأدلة

**2026-10-15 (UTC)** — baseline `67699401650da9222df15e922d57a0daaac12a0d`. التطبيق لم يُعدّل أثناء هذه المراجعة. أوامر التثبيت/الاختبار لا تغير dependency declarations أو lockfile.

## 1. البيئة والنتائج الفعلية

- Node `22.22.3`، npm `10.9.8`، Next `16.3.3`، Chromium `153.0.0` من package `@sparticuz/chromium` المثبتة مؤقتًا خارج dependencies المشروع.
- لا Postgres أو Vendure يعملان، ولا docker binary متاح.
- build/runtime استخدما `MOCK_CATALOG_FALLBACK=1` وconnection string تجريبية إلى port محلي غير متاح. السر المستخدم **تجريبي وليس credential إنتاج**.
- **هذه مراجعة frontend + منطق mocked، وليست اختبار deploy أو checkout live.**

| الفحص | النتيجة | الدليل |
|---|---|---|
| `npm ci` دون legacy/force | PASS، 1769 packages added | `evidence/npm-ci.log` |
| `npm test` | PASS، **12 files / 85 tests** | `unit-tests.log` |
| `npm run lint` | PASS | `lint.log` |
| `npx next typegen` ثم `npx tsc --noEmit --pretty false` | PASS | `typecheck.log` |
| `npm run build` | PASS **مع mock catalog**؛ warnings وDB refusal متوقع | `build-mock.log` |
| `next start` | اشتغل على 0.0.0.0:3000 | runtime محلي، ليس domain إنتاج |
| visibility suite الأصلية | **12/12 PASS** | `visibility-tests.log` |
| smoke suite دون contact persistence | **9/9 PASS** | `smoke-tests.log` |
| contact success E2E | لم يُشغّل؛ يتطلب DB ويكتب inquiry حقيقية | ليس skipped success ولا failure من التطبيق |
| commerce E2E | لم يُشغّل؛ يتطلب Vendure ومخزون/payment config | غير متحقق |
| 13 routes × 4 widths إضافية | 52 page visits؛ كلها HTTP 200؛ **5 حالات overflow** | `browser-review.json` |
| axe على 8 صفحات، WCAG2/2.1 A/AA | findings serious في contrast وlabel/name | `browser-review.json` |
| sheet Escape normal context | PASS بعد انتظار نهاية transition | `browser-followup.json` |
| service worker normal context | active + controlled، بلا page errors في follow-up | `browser-followup.json` |
| production build مع DB حقيقية | غير متحقق | لا بنية متاحة |
| Docker build/run | غير مشغل؛ عيب stage alias مرصود static | `Dockerfile` |
| GitHub CI للـSHA الحالي | failure، السبب غير متحقق | `github-ci.json` |

**ملاحظات نزاهة التنفيذ:** محاولة browser أولى تعثرت لغياب NSS/NSPR؛ استُخدمت libs المضمنة في `al2023.tar.br`. محاولة بعدها مع `--single-process` سببت context crashes. بعد استخراج libs وحذف single-process وdisable-web-security/allow-running-insecure-content نجحت suite بالكامل. هذه failures بيئية لا 12 bugs في الموقع. logs الأولية بقيت scratch، والنتائج النهائية محفوظة.

scan الإضافي استخدم reduced motion و**serviceWorkers:block** لعزل DOM. نتجت فيه أخطاء `Cannot read properties of undefined (reading 'waiting')` من مسار provider عند حظر SW. لا تُعمم كعطل طبيعي: follow-up بالسيرفس ووركر الطبيعي سجل **صفر page errors** وregistration فعالة. يستحق التعامل مع blocked/unsupported SW، لكنه ليس إثبات فشل التسجيل المعتاد.

نتائج interaction في scan الأولي قرئت فور click دون انتظار navigation/transition؛ لذلك `after` و`closedByEscape:false` فيه **غير صالحتين للحكم النهائي**. follow-up بـPlaywright assertions أثبت navigation إلى `/en/products` (وبالتالي فقد query)، وأثبت إغلاق sheet بـEscape. هذا تصحيح منهجي معلن، لا تجاهل للنتائج.

## 2. مقارنة مخاطر الأوديت القديم بالحاضر

| ID قديم | الحالة الحالية | تحقق |
|---|---|---|
| BLD-001 install conflict | مغلق محليًا في Node/npm المحددين | npm ci PASS |
| BLD-002 Serwist typing | مغلق محليًا | wrapper يمرر swUrl، typecheck/build PASS |
| BLD-003 Google Fonts build | مغلق من ناحية الشبكة | localFont وassets محلية، build لا يستدعي Google Fonts |
| SEC-001 login redirect | إصلاح موجود ومختبر | `getSafeLoginRedirect`, 14 tests |
| REL-001 no timeout | أصل المشكلة عولج، الأداء جزئي | 10s AbortController؛ layout ما زال ينتظر cart read حتى للضيف |
| CART-001 outage looks empty | إصلاح موجود ومختبر منطقًا | available/unavailable، UI retry، tests للتمييز |
| CHK-001 shipping silent fallback | أصل المشكلة عولج منطقًا | exact fulfillment mode match وإرجاع fulfillment_selection_changed |
| CHK-002 validation/company/notes | إصلاح موجود ومختبر mocked | validator + company/address + order customerNotes |
| DEP-001 runnable container | إصلاح غير مكتمل | CMD موجود الآن **لكن stage alias builder مفقود** |
| Wishlist endless load | باقٍ | `.then` بلا catch/error state |
| Address delete feedback | باقٍ | response من deleteAddress يُهمل |
| A11Y reveal blank | تحسن مثبت | 12 visibility checks PASS |
| CSP / rate limiting / broad CMS surface | باقٍ أو جزئي | baseline headers لا CSP؛ limiter process-local؛ GraphQL playground route موجود |

هذه ليست إعادة إغلاق آلي لكل IDs القديمة؛ الحالات live المتعلقة بالشحن/الدفع تحتاج إعادة تحقق حقيقي.

## 3. سجل النتائج الحالية

### R-01 — Docker stage غير صالح (P1 release blocker؛ static مؤكد)

`Dockerfile` يبدأ بـ`FROM node:22` دون `AS builder` ثم في runner يستخدم `COPY --from=builder`. Docker قد يعامل builder كاسم صورة خارجية بدل stage السابق. وجود CMD لا يجعل الصورة runnable. يلزم تسمية المرحلة، build حقيقي مع قاعدة seeded، وتشغيل health request. كذلك build secrets الآن تمر عبر ARG/ENV وcopy واسع إلى runner؛ استخدم secret mounts/multi-stage copy محدد وراجع أثر secrets في image layers، لا تعتمد أن حذف `.env` من Git يكفي.

### R-02 — dependencies عالية/حرجة بلا triage (P1 أمن)

npm audit الحالي:

- full tree: **60** affected-package records: 18 moderate / 36 high / 6 critical.
- `--omit=dev`: **57**: 18 moderate / 33 high / 6 critical.
- critical records تشمل `next`, `payload`, `handlebars`, `proxy-addr`, `seroval`, `solid-js`؛ direct runtime في Next/Payload يجعل الفرز عاجلًا، لكن **audit ليس إثبات exploit reachable**.
- سجل Next يقترح upgrade 16.4.1؛ Payload advisories تشير إلى fixed ranges في 3.90.0+. لا نرفع packages عميانيًا ولا `npm audit fix --force`، خاصةً أن الحزم Vendure/Payload متوافقة في مجموعات.
- وجود dashboard/CLI tooling ضمن production dependencies يضخم الصورة؛ افصل build tooling عن runtime عندما يكون ذلك صالحًا وظيفيًا.

الـJSON الكامل محفوظ في dependency-audit*.json مع advisory URLs. عدد audit ليس عدد سيناريوهات اختراق مستقل؛ قد يتكرر advisory عبر عدة packages.

### R-03 — overflow خارج test matrix القديمة (P1 usability؛ browser مؤكد)

| الصفحة | العرض | document width | عرض viewport |
|---|---:|---:|---:|
| `/en` | 320 | 351 | 320 |
| `/en` | 1024 | 1155 | 1024 |
| `/en/products` | 1024 | 1155 | 1024 |
| `/ar/products/proxeed-plus` | 1024 | 1064 | 1024 |
| `/en/products/proxeed-plus` | 1024 | 1155 | 1024 |

الإنجليزي عند lg=1024 يُظهر nav desktop بكل الروابط والأدوات، وبعض cart/language/theme targets خارج الشاشة. العربي PDP follow-up وجد wishlist button عند left≈-39.66px. لم نحسم العنصر المسبب للـ320: بعض عناصر glow/marquee في DOM خارج الإطار لكنها clipped ولا يصح نسب overflow لها دون isolation. المطلوب حل intrinsic sizing وbreakpoints وCTA wrapping، لا إخفاء body overflow كمسكن.

### R-04 — إتاحة/تباين ليست WCAG blanket-pass (P1 design quality؛ browser مؤكد)

axe scan light/reduced-motion عند 1440:

- home ar/en: 6 contrast nodes لكل صفحة + locale label mismatch.
- listing ar: 2 contrast nodes؛ en: 11؛ PDP ar: 1.
- `text-muted-foreground/80` على cards: ratio **4.03** مقابل 4.5 المطلوب للنص الصغير.
- listing EN hero copy: ratio **4.4** مقابل 4.5.
- `LocaleSwitcher` visible `AR`/`EN` ليست ضمن aria-label «التبديل إلى العربية»/«Switch to English»، فظهر label-content-name-mismatch في الصفحات الثماني.

اعتبر النتائج issues قابلة لإعادة الإنتاج؛ ليس شهادة امتثال شاملة. incomplete rules والصور/التدرجات تحتاج مراجعة بشرية، dark/mobile/screens readers غير مُعتمدة. skip link غائب كودًا، وهو موصوف ضمن PR المفتوح لا هذه النسخة.

### R-05 — اكتشاف/لغة يفقدان السياق (P2؛ browser+code)

locale target والنتيجة النهائية من filtered query إلى `/en/products` بلا need/q. search form يحمل q فقط. الحفاظ على pathname غير كافٍ. معيار الإصلاح: same route + allowed query، canonical لا يحتوي tracking params، وquery locale-dependent تُعرّف بوضوح.

### R-06 — error recovery/account ناقص (P1 reliability؛ code)

- لا `error.tsx`/`global-error.tsx` في tree، رغم fail-closed catalog default.
- لا password recovery routes في tree. PR #4 يصف إضافة هذه الوظائف وهو OPEN.
- wishlist reject بلا catch؛ address delete ignores failure؛ بعض submit handlers لا try/finally عند transport throw.
- `validateCheckoutCustomer` typed لكنه يتوقع strings ويستدعي trim؛ TypeScript لا يحمي Server Action من payload غير مطابق. current entry يضع تحققًا داخل try في placeOrder، لكن رسائل/حالات الخروج والحدود لكل action تحتاج schema/runtime tests لمداخل malformed.
- getWishlistProducts يقبل array غير bounded وPromise.all للـslugs؛ نحتاج validation/max batch/rate-limit appropriate، دون التضحية بفلو العميل.

### R-07 — cache PWA للصفحات الشخصية غير مستثنى (P1 privacy؛ static risk)

`src/app/sw.ts` يجعل api/admin/cart/checkout NetworkOnly، **لا account/login/register**. installed `defaultCache` في production يطبّق NetworkFirst على RSC وعلى same-origin non-API في caches عامة (`pages-rsc`, `others`...). لذلك شخصية الصفحات ليست ضمن الاستثناء المتوقع، ولا وجدنا clear-cache on logout.

registration الطبيعية نجحت، لكن **لم نثبت تسرب بيانات شخص حقيقي** لغياب backend/session. بوابة القبول: account/auth وresponses session-sensitive لا تخزن، cache قديم يُمسح عند migration، وتستحيل إعادة بيانات مستخدم A بعد logout/login B أو offline على الجهاز نفسه. حتى public shells تحتوي header/cart session state؛ راجع caching personalized HTML/RSC عمومًا لا المسار فقط.

### R-08 — تسعير fallback وavailability claims (P1 commerce trust؛ code)

`toProduct`: `price: live?.price ?? bridge?.price` مستقل عن mock-content flag. TTL دقيقة فقط للـlive successes، لا negative cache أو bulk query. التعليق «never returns a partial lie / same checkout price» أقوى من التنفيذ. في outage تظهر أسعار mock بدون provenance، والـactive status يتحول InStock.

يلزم explicit price source/staleness أو price unavailable، وألا تمنح structured data عرضًا معتمدًا من بيانات تجريبية. اختبارات amount الحقيقي بعد تغيير price/shipping بين add/place شرط قبل الاعتماد.

### R-09 — SEO ودقة المحتوى (P2؛ code+DOM)

- metadata helper وصفحات products لديها canonical/hreflang جيدان.
- homepage لا generateMetadata خاصًا بها، وlayout لا canonical؛ DOM scan لم يجد canonical في `/ar` أو `/en`.
- x-default غير مضاف، وsitemap timestamps مبنية على new Date لا تاريخ تعديل المحتوى؛ status filtering غير موجود.
- PDP brand hardcoded Alfasigma حتى للأجهزة CA-MI، وimage JSON-LD concat domain + URL يفسد absolute media URLs. بيانات mock local لا تكشف حالة CMS remote.
- JSON-LD يستخدم JSON.stringify داخل script دون escaping `<`؛ مع محتوى CMS غير موثوق يمكن أن يقفل script. لم نحاول exploit ولا ندعي أن محرر غير مخول يستطيع كتابة المحتوى.
- blog noindex/excluded sitemap صح، لكن nav ما زال يروّج له.

### R-10 — أداء ومراقبة وتشغيل (P2؛ code)

- layout ينتظر cart حتى بدون token؛ timeout 10s يمنع تعليقًا لا نهائيًا، لكنه ليس latency مقبولة لصفحة تسويق.
- pricing fan-out لكل slug في miss، وCMS metadata/page قد يعيدان reads؛ تحتاج cache/request memoization مدروسة دون تخزين session.
- خطوط كثيرة محملة unconditionally للغتين ومنها slanted cuts غير مستخدمة افتراضيًا. local fonts حلت الاعتماد على Google، لا بالضرورة حجم preload.
- structured logging موجود؛ لا يثبت centralized alerting/SLO/tracing/request IDs.
- لا analytics events، لا CI أخضر مثبت، ولا CD/live-origin validation.
- HSTS/XFO/nosniff وغيرها موجودة؛ CSP غائبة بقرار سابق. التصميم المختبر للـCSP لكل public/admin/routes أفضل من policy عامة تكسر Payload.

## 4. ما لا يمكن ادعاؤه من هذه المراجعة

لا payment integration live، لا contact persistence live، لا بيانات catalog production، لا NFSA/consent approval، لا cross-browser Safari/Firefox/iOS، لا اختبار stock/order concurrency، لا server load test، لا Lighthouse score/INP field، لا LCP قبل/بعد، لا deploy على الدومين.

الـ52 زيارة تغطي: home ar/en، listing ar/en، PDP Proxeed Plus ar/en، contact/about/cart/checkout/login/register/wishlist ar؛ لا كل routes/account states/products. no broken images في snapshot ليس ضمان أن كل lazy image/PDF حي.

## 5. إعادة التشغيل المختصرة

```bash
npm ci
npm test
npm run lint
npx next typegen
npx tsc --noEmit --pretty false
# فقط لواجهة review/offline؛ لا production:
PAYLOAD_SECRET=review-only-not-production-secret-2026-10-15 \
DATABASE_URI='postgresql://review:review@127.0.0.1:5432/npf_review?connect_timeout=2' \
MOCK_CATALOG_FALLBACK=1 npm run build
# شغّل start بنفس متغيرات البيئة؛ البيئة هنا دون DB/Vendure
npm run start -- --hostname 0.0.0.0 --port 3000
```

لتستات standard مع chromium مثبت استخدم `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/visibility.spec.ts` وsmoke بـ`--grep-invert 'contact form submits'`. كيف تم تشغيل binary/libs البديلة موضح في `evidence/README.md`. المتطلبات live موثقة في README/CI؛ لا تستخدم mock flag لإخفاء build failures في release.

**الحكم الفني:** قابل للبناء والاختبار كواجهة offline، مع إصلاحات حقيقية للمنطق. **غير معتمد للإنتاج** قبل closing release/security/privacy/commerce gates، ولا تكفي اختبارات الظهور لإغلاقها.
