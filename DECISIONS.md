# DECISIONS — قرارات مشروع NPF Storefront

> ملف حيّ للقرارات المعمارية والتقنية. آخر تحديث: 2026-09-22 (قرارات الموجة 1).

| القرار | التفصيل | السبب |
|---|---|---|
| **الستاك** | Next.js 16.3.3 (App Router, RSC) + Payload CMS 3.88 + Vendure 3.7.3 + Serwist PWA | محتوى + تجارة منفصلين، واجهة React 19 + Tailwind 4 |
| **قاعدةان منفصلتان** | `npf` لـVendure و `npf_payload` لـPayload | اختناق drizzle/prisma لو شاركوا قاعدة واحدة (درس مثبت عملياً) |
| **الدفع اليدوي** | `PAYMENT_METHOD_CODE = "manual-settlement"` في `src/lib/cart/actions.ts` | بوابات دفع مصرية لم تُدمج بعد (F-03) — التسمية يجب أن تعكس القدرات |
| **بيانات الكتالوج** | أولاً Vendure حيّ، ثم جسر mock (`MOCK_CATALOG_FALLBACK=1`) | البناء والتطوير يشتغلان بدون Vendure (انظر `src/lib/vendure/pricing.ts`) |
| **البناء** | `next build --webpack` + `npm run seed` قبل البناء | التوليد الثابت يقرأ بيانات حقيقية وقت البناء (انظر CI: seed→typegen→tsc→lint→build) |
| **CI/CD** | `.github/workflows/ci.yml`: build + unit (vitest) + e2e (Playwright) — **الـCD ناقص (F-69)** | جودة مضمونة على كل PR؛ النشر يدوي حالياً |
| **الحاوية** | `Dockerfile` متعدد المراحل (node:22 → slim) مع أسرار كـbuild ARGs | صورة إنتاج نظيفة بلا devDeps |
| **الاختبارات** | vitest متداخل `src/lib/**/*.test.ts` + Playwright `e2e/*.spec.ts` | منطق نقي + دخان تجاري |
| **الخطوط** | `localFont` من `src/app/fonts/` (Glora + Ko_Banzeen) | أداء وخصوصية — بحاجة subset/preload (F-66) |
| **الجلسات** | كوكيز HttpOnly عبر جلسة Vendure | أمان XSS — مدة السنة طويلة (F-56) |
| **حدود المعدل** | تسجيل 5/ساعة/IP · دخول 10/10د (Vendure/อำนวยความn) | حماية — مستندة الآن (F-15) |
| **الترجمة** | قواميس `src/lib/i18n/` + `/{locale}` مسارات ar/en | RTL/LTR أصيلان بلا مكتبة i18n ثقيلة |
| **PWA** | Serwist (`src/app/sw.ts`) NetworkOnly لـ`/(api|admin)/` والسلة/الدفع | السلة دائماً حيّة — fallback offline ناقص (F-14) |
| **أدوات التحقق** | `scripts/verify-fixes.mjs` بعد كل دفعة إصلاح | كشف حتى أخطاء التدقيق نفسه (انظر Corrections Log في سجل العيوب) |
| **حدود الأخطاء (F-02)** | `src/app/[locale]/error.tsx` (يحافظ على الهيدر/الفوتر/الاتجاه ويستبدل الجزء الفاشل فقط) + `src/app/global-error.tsx` (بيستبدل المستند كله، وبيشتقّ اللغة من `navigator` لأنه مفيش router context بعد انهيار الـroot layout) | أي throw في render كان بينتهي بصفحة Next الافتراضية/طريق مسدود. صفحة الخطأ لازم تعرض دايماً مخرج (retry + home + بريد) و`digest` للربط بلوج السيرفر |
| **نصوص حدود الأخطاء** | موديول مستقل `src/lib/i18n/error-copy.ts` (+ `common-errors.ts` لرسائل الشبكة) بدل `dictionaries.ts` | `error.tsx` مكوّن عميل؛ استيراد القاموس الكامل (~1700 سطر × لغتين) كان هيحشر نصوص الموقع كلها في حزمة العميل ويزوّد F-42 سوءاً |
| **البريد الصادر (F-52)** | `nodemailer` + إعداد SMTP موحّد في `src/lib/email/mailer.ts` يخدم Vendure وPayload؛ من غير `SMTP_HOST` يفضل السلوك القديم (Vendure يكتب `.eml`، وPayload يلوج) | إرسال بريد حقيقي لما يتظبط، ومن غير ما يكسر التطوير المحلي أو CI. `STOREFRONT_URL` بقى مصدر روابط البريد بدل `localhost:8080` الميت |
| **تفعيل البريد** | `requireVerification` بقى مفتاح `NPF_REQUIRE_EMAIL_VERIFICATION` — ** default = off** | تشغيله من غير mailer شغّال كان هيقفل كل حساب جديد على صاحبه. مسار `/verify` بقى موجود فالمفتاح بقى آمن |
| **استرجاع كلمة السر** | `requestPasswordReset` بيرجّع `ok:true` دايماً (حتى لو العنوان مش موجود)؛ `resetPassword` بيرجّع كود الخطأ الحقيقي | الأول كان هيحوّل الفورم لأداة تعداد حسابات (account enumeration). التاني صاحبه أثبت ملكية البريد بالضغط على الرابط |
| **مساران للتأكيد** | `/verify` (‏`verifyCustomerAccount`) و`/verify-email-change` (‏`updateCustomerEmailAddress`) منفصلين رغم تطابق الشاشة | نوعا التوكن مش قابلين للتبادل في Vendure — دمجهم كان هيكسر واحد من التدفقين |
| **skip link (F-34)** | أول عنصر في `<body>` قبل `ScrollProgress` والهيدر، هدفه `<main id="main-content" tabIndex={-1}>`، مخفي بـ`sr-only` لحد التركيز | WCAG 2.4.1 — تجاوز التنقل بلوحة المفاتيح. `tabIndex={-1}` يخلي المنطقة قابلة للتركيز برمجياً من غير ما تبقى محطة Tab |
| **حد خطأ لمجموعة `(payload)`** | **ماضفناش** `src/app/(payload)/error.tsx` — `global-error.tsx` بيغطيها (اتثبت بـprobe: ‏`/admin` 500 → صفحة مصمَّمة + زر استرجاع) | الـ`(payload)` group له root layout مستقل، والـlayout نفسه بيحتاج قاعدة البيانات؛ فحد خطأ داخل المجموعة مش مضمون إنه يترسم وقت فشل init. إضافة حد هناك كانت هتدي إحساس أمان زائف |
| **`unhandledRejection` (F-72) — القرار النهائي (موجة 3)** | معالج `unhandledRejection` مُهيكل في `src/instrumentation.ts`: العملية تعيش، وكل حدث بيمرّ عبر خط F-65 (لوج مُهيكل + إبلاغ محدود المعدل) ومعاه هوية السبب (reasonType/message/stack) — ومفيش أي حدث بيختفي | الرفض الأول كان قبل اكتمال خط الإبلاغ. الـfail-fast مرفوض بمبرر موثق: Postgres واقف ≠ الموقع كله واقف (الـstorefront بيخدم 200 بالـfallback). الـmasking بيتعالج بتسجيل كل حدث بهويته + تسمية quirk الـPayload (reason: undefined) صراحةً. 3 اختبارات |
| **معايرة أداة التحقق v3** | فحص F-34 بقى متثبّت على `<body>` بدل أول 3000 حرف من المستند، وبقى **أصرم**: بيتأكد كمان إن `id` الهدف موجود وإن الرابط سابق لـheader/nav/main | الـ`<head>` في التطبيق ~5.1KB (preload لصور الـhero بتسعة مقاسات + OG/Twitter كامل) فـ`<body>` بيبدأ بعد النافذة — الفحص القديم كان بيقول OPEN حتى للتنفيذ الصحيح |
| **المفضلة مربوطة بالحساب (F-20)** | localStorage مصدر الحقيقة للواجهة + مرآة حساب عبر مجموعة Payload `wishlists` (pull → merge اتحاد → push عند الدخول وزيارة صفحة المفضلة؛ تعديلات صفحة المفضلة بتتدفع فورًا لو العميل مسجّل) | يعمل بلا حساب ومن غير ما يسرّب حاجة، وبيتزامن بين الأجهزة عند تسجيل الدخول. الحد المقبول: المزامنة عند نقاط الاتفاق (دخول/زيارة) مش كل ضغطة قلب — trade-off موثق في الوصلة ومجموعة Wishlists لميزة Low |
| **ترخيص الخطوط (قرار بيزنس — موجة 4)** | البقاء على KO Banzeen/Glora في الريبو العام **موقتًا** مع خطة ملزمة: تأكيد web-use من Protype Foundry (hello@protype.studio) + إثبات ملكية Glora من العميل؛ ولو مفيش ruling قبل الإطلاق: نقل الملفات لـasset store خاص أو استبدال بوجوه OFL | الوضع موثق بالكامل في `src/app/fonts/LICENSES.md` (من nameID الملفات نفسها بـfontTools). «ممنوع إعادة التوزيع» المدمجة + ريبو عام = أقرب للـredistribution من الـembedding — مش قرار كود، ولازم يتحسم قبل الإطلاق |
| **مسارات المحتوى المكررة (F-47)** | canonical من `buildPageMetadata` لكل الصفحات + `/ar/products/` → 308 و`/products` → 307 (proxy يسبق كل حاجة) + الترتيب متغير query مش صفحة منفصلة | كل variant بيتحوّل لمسار واحد بسلاش/لغة واحدة، والصفحة بتعرف canonical بتاعها — مفيش محتوى مكرر للمحركات |
| **فحوص IDOR/api-probes (F-55)** | خريطة توقعات IDOR اتصلحت على الحقيقة: المسارات المحمية بترجع 404/307 (حارس الـproxy + حارس الـslug) مش 500، والـprobe الرسمي بقى بلوك F-54 في `scripts/probe-manual-checks.mjs` | ملف scratch/api-probes.txt القديم كان artifact مؤقت بمسارات خاطئة؛ البديل الرسمي حيّ في شجرة المستودع وبيتحقق آليًا كل تشغيلة |
