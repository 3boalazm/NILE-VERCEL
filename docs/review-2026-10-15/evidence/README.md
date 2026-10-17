# أدلة مراجعة NPF — 2026-10-15

هذه الملفات أنتجت في المراجعة المحلية الحالية. baseline `6769940`؛ لا تدعي نجاح commerce production.

## فهرس

- `npm-ci.log`, `unit-tests.log`, `lint.log`, `typecheck.log`: المخرجات الفعلية، مع logs متوقعة من اختبارات الأعطال.
- `build-mock.log`: build إنتاجي بـMOCK_CATALOG_FALLBACK، DB غير متاحة. errors/warnings داخله لا تُخفى؛ exit code النهائي 0.
- `visibility-tests.log`: 12 passed بعد تصحيح browser environment.
- `smoke-tests.log`: 9 passed باستبعاد contact-save، وصف أحد الاختبارات «seeded catalog» لا يعني أننا seedنا DB؛ هنا mock catalog فقط.
- `browser-review.json/.log`: 52 visit snapshot + axe على 8 صفحات. reducedMotion=reduce، serviceWorkers=block. pageErrors فيها تخص هذا الـblocked context.
- `browser-followup.json/.log`: normal SW + assertions لانتظار اللغة/Escape + overflow probes. هذه مرجع نتائج interactions النهائي لا القراءات الفورية في scan الأول.
- `dependency-audit.json`, `dependency-audit-production.json`: npm audit بتاريخ التجربة، affected-package records لا exploit proof.
- `github-pr3.json`, `github-pr4.json`, `github-ci.json`: حالة GitHub read-only في وقت المراجعة. لم يُدمج PR #4.
- `patch-inventory.txt`: المسارات الغائبة كملفات مستقلة؛ لا حكم تطابق للثلاثة الموجودة.
- `home-ar-mobile.png`, `home-en-desktop.png`: screenshots full page؛ lazy images أسفل الصفحة قد لم تحمل وقت الالتقاط. استخدمت للمراجعة لا اعتماد اكتمال كل الصور.
- `home-en-320.png`, `pdp-ar-1024.png`: viewport screenshots للمقاسات الإضافية.
- `browser-review.mjs.txt`, `browser-followup.mjs.txt`, `playwright.config.cjs.txt`: source نصية لأدوات المراجعة، منفصلة عن application dependencies. suffix txt متعمد كي لا تدخل build/lint كتطبيق.

## تشغيل browser في بيئة الإنترنت المقيدة

الحزم المؤقتة: `@sparticuz/chromium@153.0.0` و`axe-core` في `.cache/review-tools`، وPlaywright من dependencies الريبو. لا تعدّل package.json/lockfile لإعادة التجربة.

```bash
mkdir -p .cache/review
npm install --prefix .cache/review-tools --no-audit --no-fund --package-lock=false @sparticuz/chromium@153.0.0 axe-core
node --input-type=module - <<'NODE'
import c from './.cache/review-tools/node_modules/@sparticuz/chromium/build/index.js';
import {inflate} from './.cache/review-tools/node_modules/@sparticuz/chromium/build/lambdafs.js';
console.log(await c.executablePath());
console.log(await inflate('./.cache/review-tools/node_modules/@sparticuz/chromium/bin/al2023.tar.br'));
NODE
cp docs/review-2026-10-15/evidence/playwright.config.cjs.txt .cache/review/playwright.config.cjs
cp docs/review-2026-10-15/evidence/browser-review.mjs.txt .cache/review/browser-review.mjs
cp docs/review-2026-10-15/evidence/browser-followup.mjs.txt .cache/review/followup.mjs
# server يجب أن يعمل مسبقًا على 3000 بمتغيرات review كما في 03
LD_LIBRARY_PATH=/tmp/al2023/lib npx playwright test --config .cache/review/playwright.config.cjs e2e/visibility.spec.ts
LD_LIBRARY_PATH=/tmp/al2023/lib npx playwright test --config .cache/review/playwright.config.cjs e2e/smoke.spec.ts --grep-invert 'contact form submits'
LD_LIBRARY_PATH=/tmp/al2023/lib node .cache/review/browser-review.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node .cache/review/followup.mjs
```

الأدوات محفوظة بالمسارات المطلقة لهذه البيئة `/home/user/NPF` و/tmp/chromium. إن اختلف root أو binary path عَدّل النسخ المؤقتة، لا تقارير baseline. إعادة scan تكتب فوق JSON/screenshots الحالية؛ احفظ الأدلة الأصلية أو غيّر output paths قبل إعادة التشغيل.

لا browser flag `--disable-web-security` أو single-process في config النهائي؛ مكتبات NSS/NSPR المضمنة حلت غياب shared libs دون تحميل browser من مضيف محظور. التشغيل headless/no-sandbox داخل sandbox وليس إعداد browser deployment.

**قيود:** ليست Safari/Firefox/mobile hardware، ليست Lighthouse/field CWV، ليست DB/Vendure live. automated axe لا يغني عن مراجعة بشرية وscreen reader. لا تختبر contact/order-save ضد production لغرض إعادة هذا التقرير.
