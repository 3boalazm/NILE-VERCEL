# HANDOFF — جلسة إصلاح عيوب NPF (يقرأه أول حاجة في الشات الجديد)

**تاريخ:** 2026-09-21 · **فرع الشغل:** `arena/01a0c301-npf` · **الحالة:** الاختبار خلص (23 تقرير + سجل 71 عيباً) — المطلوب دلوقتي: **الإصلاح**.

## 1) اقرأ دول بالترتيب (5 دقايق)
1. `docs/testing/README.md` — حالة البرنامج + الأرقام الكبرى (2,117 حالة).
2. `docs/testing/results/24-test-defect-register.md` — **سجل الـ71 عيباً (F-01..F-71)** + خلاصة لكل عيب + Corrections Log.
3. `docs/testing/results/25-fix-verification-playbook.md` — **خطة الإصلاح**: 4 موجات + **شرط قبول لكل عيب** + كيفية التحقق.
4. `scripts/verify-fixes.mjs` — أداة التحقق الآلي (~48 عيباً). `node scripts/verify-fixes.mjs` → جدول FIXED/OPEN/MANUAL.
5. `TODO.md` + `DECISIONS.md` — خطة العمل الحية + قرارات المشروع.

## 2) المهمة
**إصلاح الـ71 بالترتيب حسب موجات الدليل:**
- **موجة 1 (الإقلاع):** F-05 (5 صفحات فارغة)، F-03 (نصوص الدفع vs `manual-settlement`)، F-01 (SKU وهمي `#P0xx`)، F-02+F-64 (error boundaries + خطأ شبكة صامت)، F-34 (skip link)، F-04+F-52 (استرجاع كلمة السر يحتاج mailer).
- **موجة 2:** ✅ **منفذة ومتحقق منها 2026-09-22** (F-45, F-70, F-18, F-46, F-11, F-53+F-69(CI-half), F-63, F-10, F-61, F-56 + باقي دفعة النمو: F-13/17/19/21/22/23/25/33/39/58/59/62/66/67/68) — harness ‏43 FIXED / 0 OPEN / 2 MANUAL، probes ‏15/15. تفاصيل التحقق في `results/24-test-defect-register.md` §"Wave 2 verification".
- **موجة 3:** ✅ **منفذة ومتحقق منها 2026-09-22** — F-40/41/42 (مقاسة: LCP ‏288–332ms، ‏TTFB ‏≈45ms، أكبر ‏chunk ‏236KB)، F-27/30/32 (e2e ‏narrow + desktop-band)، F-35/36/38 (‏axe ‏0 violations بعد 3 إصلاحات تباين حقيقية + أسماء الـnavs)، F-54 (‏3 طبقات: حارس repo + ‏generateMetadata + ‏404 من الـproxy)، F-57 (بوابة قوة السوبرأدمن + شيل ‏X-Powered-By)، F-14 (‏route المستندات + e2e أوفلاين حقيقي)، F-12 (بروب)، F-60 (برمجية + e2e)، F-29 ‏stale، F-72 (قرار + handler + اختبارات) — probes ‏20/20، unit ‏154/154، e2e ‏37 passed/3 env-skipped. التفاصيل في السجل §"Wave 3 verification".
- **موجة 4:** ✅ **منفذة ومتحقق منها 2026-09-22** — F-20 (مفضلة بالحساب: مجموعة ‏Payload ‏wishlists + مزامنة موثقة)، F-06 (عقد الأسماء بالاختبارات)، F-08 (هوب واحد للهاش)، F-43/44/47/48 (هيدرز كاش + تحذير TLS + canonical + فهرسة الأدمن)، F-49/50/51/28/31/16 (تحقق وإقفال)، F-26 (مندمجة في مفصل F-13)، F-55 (بديل رسمي ببلوك F-54)، قرار ترخيص الخطوط (‏DECISIONS.md) — بروبات ‏25/25، unit ‏169/169، e2e ‏38/3. **كل العيوب ‏F-01..F-73 مقفولة/موثقة — مفيش بند مفتوح.**
كل PR يذكر `Fixes F-xx`. بعد كل موجة: `node scripts/verify-fixes.mjs` لازم يقلّ OPEN.

## 3) تشغيل البيئة (المعروف — التفاصيل الدقيقة ضاعت من ضغط الذاكرة)
- `cd /home/user/NPF && npm i` — **بعدها ضروري:** `rm -rf node_modules/@nestjs && ln -s @vendure/core/node_modules/@nestjs` (npm i يرجّع نسخة غلط).
- **drizzle-kit 0.31.7 bug:** `node_modules/drizzle-kit/api.js` في `pushSchema` بدّل `params` → `literal` (يتعاد تطبيقه بعد كل npm i).
- `.env` مطلوب: `DATABASE_URI` (Postgres), `PAYLOAD_SECRET`, `COOKIE_SECRET`, `SUPERADMIN=admin/Test1234!`, `MOCK_CATALOG_FALLBACK=1`, `NEXT_PUBLIC_SERVER_URL=http://localhost:3000`, `PORT`.
- **قاعدةان منفصلتان!** `npf` (Vendure) و `npf_payload` (Payload) — أبداً مش واحدة.
- البذر: **`npm run seed`** (`scripts/run-seed.mjs` — من PR #3، أنظف من أي سكربت خارجي). شوف كمان `README.md` قسم "Notes for deploys" و `.github/workflows/ci.yml` (المرجع الرسمي لترتيب seed→build).
- السكربتات: `npm run dev` (storefront), `npm run dev:all` (vendure) أو `build:all`+`start:*`. منفذا القياس: storefront :3000 · vendure :3001.
- **لو استخدمت `vendure-full-setup` يدوي بدل seed:** متغيّر PXP-30 بيتعمل من غير stockOnHand → شغّل تعديل `stockOnHand: 500` بعده.
- **Playwright:** `npx playwright install` فاشل (CDN مقفول) — استخدم `@sparticuz/chromium` الموجود في node_modules: `LD_LIBRARY_PATH=/tmp/al2023/lib:/tmp playwright test --config <config>` مع args `--no-sandbox --disable-gpu --disable-dev-shm-usage`. إن `/tmp/chromium` مش موجود: `node -e "require('@sparticuz/chromium').executablePath().then(console.log)"`.
- **Lighthouse:** `CHROME_PATH=/tmp/chromium`. حدود المعدل: تسجيل 5/ساعة/IP · دخول 10/10د (أعد تشغيل السيرفر لتصفيرها).

## 4) حقائق مهمة (متثبتة — متضيّعش وقت)
- الحزمات `@nestjs` = symlink · Payload+Vendure بقت تفشل في build بدون DB قابلة للوصول (`npm run build` يقرأ بيانات) · البناء بـ`next build --webpack`.
- منتج قابل للشراء: `proxeed-plus` (variant `PXP-30` بسعر 175000). عملة "ج.م". حساب جاهز: `ft-journey-mobile@nilepharmafood.local`/`Passw0rd!`. طلبات أدلة: `59K4H7V3FZDVTU3L`, `ZZRAQJUDW2B7EVEM`.
- أسماء الأزرار الحقيقية: PDP إضافة = «إضافة للسلة» · إتمام الطلب = «تأكيد الطلب» (معطّل لحد اختيار الفرع/الشحن) · radios الشحن = `button[role="radio"]`.
- التحقّق: `scripts/verify-fixes.mjs` + اللوحة اليدوية25 بنداً في خرجته + `docs/testing/results/25-*.md` §4 بروتوكول إعادة التوقيع.
- **سجل التصحيحات:** تقارير 16 و21 اتصححوا بعد ما أداة التحقق كشفت إن CI/Dockerfile/vitest/e2e كانوا موجودين (انظر Corrections Log في السجل) — أي رقم قديم في الذاكرة يُؤخذ من ملفات الـresults دائماً.

## 5) أول جملة في الشات الجديد
> "اقرأ docs/testing/HANDOFF.md وابدأ إصلاح الموجة 1 (F-01..F-05, F-34, F-02+F-64, F-04+F-52) — وأول ما تخلص شغّل verify-fixes.mjs ووريني الجدول."
