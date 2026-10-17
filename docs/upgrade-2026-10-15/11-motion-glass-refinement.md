# جولة صقل الحركة والزجاج — الخطة والمراجعة

> **تحديث لاحق:** أضيفت الصور التحريرية والهيدر بالعلامة وحدها، مع تحقق جديد موثق في [12-editorial-imagery-and-mark.md](12-editorial-imagery-and-mark.md). نتائج هذا الملف تخص جولة الحركة السابقة.

## طلب المستخدم — 2026-10-15
أبدى المستخدم رضاه عن الاتجاه الحالي، وطلب جولة تحسين إضافية بموشن وأنيميشن وإحساس Framer ولمسات glassmorphism بسيطة. هذا صقل للهوية الحالية، لا إعادة تصميم من الصفر ولا إطلاق إنتاجي.

## ثوابت
- الصورة الجديدة ذات الحجاب الكامل والملابس الواسعة محفوظة دون تغيير.
- لا تغييرات في state/session أو الدفع أو الحسابات أو مصادر الأسعار.
- SSR مرئي؛ لا `initial: hidden` على العنوان أو الصفحة. فشل hydration وغياب JS لا يتركان المحتوى مخفيًا.
- الحركة قليلة ومقصودة، بلا scroll hijacking أو cursor بديل أو parallax مستمر، ولا حركة حول إدخال بيانات الحساب/الشراء.
- احترام reduced motion وcoarse pointer وreduced transparency وprint، مع أسطح صلبة fallback للزجاج.

## خطة التنفيذ
1. تدرج دخول مرئي للهيرو والعناوين، وحركة كشف هادئة للعناوين التحريرية والبطاقات عبر Reveal الحالي مع حماية Observer/القفز للنهاية.
2. استخدام Framer Motion الموجود أصلًا: انتقال صغير عند تغيير منتج الأطلس أو تبويب معلوماته؛ وعدم تحريك focus أو إعادة تركيب مدخل البحث. زر محادثة بحركة spring/magnetic محدودة للديسكتوب فقط، ويظل رابطًا أصليًا.
3. رأس زجاجي خفيف في مجموعة تنقل الديسكتوب، حواف مضيئة وملاحظة هيرو ووثيقة PDF زجاجية هادئة؛ لا طمس تحت كل فقرة أو تقليل تباين النصوص.
4. صقل hover/focus للروابط والبطاقات والأسهم، وتفاصيل الأسطر والفصول مع الحفاظ على الـRTL والأهداف اللمسية.
5. بناء production جديد ثم مراجعة فعلية للموبايل والديسكتوب بالعربية والإنجليزية. إعادة اختبارات unit/lint/types وbrowser/visibility/no-JS وaxe/responsive، وإضافة فحص السلوك الجديد مع reduced motion.

## التنفيذ النهائي

**اكتملت جولة الصقل داخل تطبيق Next الفعلي، لا داخل النموذج المستقل.**

- [المعاينة العربية](https://3000-iv5tzr8clu7a4c6c2g6t9.e2b.app/ar) · [English](https://3000-iv5tzr8clu7a4c6c2g6t9.e2b.app/en)
- جرّب النزول بعد المشهد الأول لترى glass dock، ثم تغيير منتجات الأطلس وتبويباتها. على الديسكتوب حرّك المؤشر داخل زر المحادثة الدائري آخر الصفحة. الحركة ليست ظاهرة في لقطة ثابتة وحدها.

### الحركة

1. دخول العنوان والشرح والرابط الرئيسي بإزاحة صغيرة وتوقيت متدرج. القواعد الجديدة لا تستخدم opacity صفر للهيرو ولا loader.
2. Reveal للعناوين التحريرية وجانب التعريف ومقدمة القراءة وكتلة المحادثة وبطاقات المنتجات، مع stagger بسيط حسب العمود. أعيد استخدام آلية SSR/Observer/scroll-fallback المحمية، لا استبدالها بـFramer `initial: hidden`.
3. **Framer Motion فعلي من المكتبة الموجودة:** `useAnimate` يحرك الصورة 10px وscale 0.97→1 خلال 0.42s عند تغيير المنتج فقط، وتفاصيله 6px خلال 0.28s. لا تبديل للـfocus ولا إعادة تركيب لمدخل البحث ولا انتظار animation قبل تحديث المحتوى. cleanup يوقف الحركة ويلغي الأنماط المؤقتة عند تبديل الاختيار سريعًا.
4. `MagneticLink` يبقى Next Link أصليًا: انزياح spring محدود بـ8px على المؤشر الدقيق فقط، مع reset عند مغادرة المؤشر/التركيز. لا mouse listener عالمي أو تتبع للمستخدم، ولا حركة مغناطيسية على اللمس أو reduced motion.
5. نفس رأس الصفحة، دون نسخة تنقل إضافية، يتحول بعد خروج الهيرو إلى dock زجاجي صغير. يعود إلى موضعه الأصلي عند الرجوع للأعلى. IntersectionObserver اختياري؛ غيابه يترك التنقل العادي سليمًا. أضيف هامش anchors كي لا يغطي البار عنوان الفصل المقصود.
6. hover خفيف للبطاقات والأسهم، خط تنقل نشط واضح، وتحول علامة سؤال القراءة. لا حركة لا نهائية أو scroll hijacking.

### الزجاج

اللمسة محصورة في مجموعة تنقل الديسكتوب، البار العائم، ملاحظة الهيرو ورابط PDF. درجات Navy شبه المعتمة تحافظ على التباين؛ ليست بطاقات المعلومات الأساسية كلها شفافة. توجد أسطح صلبة للمتصفحات دون backdrop-filter ولـ`prefers-reduced-transparency`، مع إزالة التأثير عند الطباعة. يبقى الهاتف أبسط، بلا تأثيرات pointer مغناطيسية.

### ملفات التنفيذ

- `src/app/care-atlas-motion.css`: طبقة مستقلة فوق نظام Care Atlas، لا إعادة تكديس للتصميم القديم.
- `src/components/care-atlas/magnetic-link.tsx`: رابط spring محدود يحترم الإدخال والإتاحة.
- `header.tsx` و`product-explorer.tsx` و`sections.tsx` داخل مجلد Care Atlas: dock، انتقال الاختيار والكشف التحريري.
- `src/components/npf/product-card.tsx` والرئيسية: Reveal آمن دون تغيير بيانات المنتجات أو إجراءاتها.
- `e2e/motion-polish.spec.ts`: 11 اختبارًا للسلوك الجديد، بجانب الـ37 القائمة.
- `scripts/validate-integrated-care-atlas.mjs`: مجلد أدلة قابل للتحديد، وتمرير أصلي قبل full-page screenshot حتى لا توثَّق البطاقات قبل كشفها كمساحات فارغة.

## المراجعة والإصلاحات

- فُتحت لقطات عربية/إنجليزية، هاتف/ديسكتوب، للرئيسية والكتالوج والبار العائم. الهوية والصورة ذات الحجاب الكامل محفوظتان، بلا تغيير العبوات أو الحقائق الطبية.
- فحص 320px بعد التمرير كشف أن margin الرأس الأصلي مع insets الجديدة ضيّق البار، وأخرج أدواته من سطحه رغم أن document نفسه لم يتجاوز عرض الشاشة. أُلغي margin القديم للـdock وعُدلت مسافاته الصغيرة. أضيف اختبار يراجع **حدود الروابط والأزرار داخل البار نفسه**، لا scrollWidth فقط؛ نجح بالعربية والإنجليزية عند 320/390/1440px.
- أول اختبار hover استخدم زاوية شفافة خارج مساحة الزر الدائري الفعلية، ففشل hit testing. صُححت إحداثيات الاختبار إلى نقطة داخل الدائرة، بلا `force` أو تجاوز لحماية المؤشر. أعيدت suite كاملة بعد ذلك.
- أدوات المتصفح كانت مفقودة بعد استئناف البيئة؛ جُهّز Chromium ومكتباته داخل tooling مؤقت، دون إضافة runtime dependency أو تعديل قواعد أمن المتصفح في التطبيق.

## نتائج الجولة الجديدة — 2026-10-15

| الفحص | النتيجة الفعلية |
| --- | --- |
| production build | ناجح، والخادم يعمل على `0.0.0.0:3000`. تحذيرات Browserslist/Serwist وstatic التاريخية باقية؛ النجاح لا يعني سجلًا خاليًا من التحذيرات. |
| TypeScript | `npx tsc --noEmit` ناجح بعد التعديلات النهائية. |
| ESLint | ناجح دون أخطاء أو تحذيرات. |
| Unit | **121/121، 20 ملفًا**. |
| Browser | **48/48 ناجح في تشغيل نهائي كامل**: smoke + atlas + discovery/recovery + visibility + motion-polish. |
| Responsive | **136 زيارة**: نفس 17 مسارًا × ar/en × 320/390/768/1440px؛ 0 overflow وصور مكسورة مكتشفة. |
| axe | **28 تدقيقًا، 0 مخالفات مكتشفة** بعينة هاتف فاتح/ديسكتوب داكن وقواعد WCAG 2/2.1 A/AA. ليس ضمان امتثال شاملًا لكل حالة hover وحركة أو شهادة قانونية. |
| JavaScript | 0 pageerrors في جولات responsive. |
| Progressive enhancement | غياب JS، توقف/تأخر hydration، Observer صامت، القفز للنهاية وreduced motion: الاختبارات القائمة نجحت بعد إدخال Reveal. |
| سلوك جديد | dock واحد وحدوده صحيحة بست حالات لغة/عرض؛ صورة الأطلس مرئية مبدئيًا ثم تتحرك عند الاختيار؛ magnetic محدود ويعود للصفر ويصل للتواصل؛ reduced motion يعطل الحركة؛ reduced transparency يعطي سطحًا معتمًا؛ tap الهاتف ثابت ويصل للرابط الحقيقي. |
| Commerce/auth | اختبارات regressions المتاحة نجحت؛ لم يُجرَ طلب مدفوع أو SMTP أو حساب عميل حي. لم يتغير منطقها بهذه الجولة. |

### الأدلة

داخل [motion-evidence](motion-evidence/):
- [سجل المتصفح](motion-evidence/e2e.txt)، [unit](motion-evidence/unit.txt)، [lint](motion-evidence/lint.txt)، [البناء](motion-evidence/build.txt)، [تفاصيل responsive/axe](motion-evidence/browser.json).
- [الرئيسية العربية](motion-evidence/home-ar-desktop.webp)، [الموبايل](motion-evidence/home-ar-mobile.webp)، [English](motion-evidence/home-en-desktop.webp).
- [الـdock على الديسكتوب](motion-evidence/docked-ar-1440.webp)، [الهاتف](motion-evidence/docked-ar-390.webp)، [الكتالوج](motion-evidence/products-en-desktop.webp).

### إعادة التحقق

```bash
npm run lint
npx tsc --noEmit
npm test
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 NPF_PREVIEW_MODE=1 npx playwright test \
  e2e/motion-polish.spec.ts e2e/smoke.spec.ts e2e/care-atlas.spec.ts \
  e2e/discovery-recovery.spec.ts e2e/visibility.spec.ts
CARE_ATLAS_EVIDENCE_DIR=docs/upgrade-2026-10-15/motion-evidence \
AXE_CORE_PATH=node_modules/axe-core/axe.min.js \
node scripts/validate-integrated-care-atlas.mjs
```

في البيئة المقيدة استُخدم أيضًا `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/chromium` و`LD_LIBRARY_PATH=/tmp/al2023/lib`. هذه تجهيزات tooling مؤقتة وليست متطلبات runtime للموقع.

## حدود التسليم

- هذه جولة صقل جديدة موثقة بنتائجها، لا إعادة نسبة اختبارات الصورة أو الدراسة القديمة إليها.
- لا مكتبة runtime جديدة؛ Framer Motion كان موجودًا أصلًا. لا ادعاء بنتيجة Lighthouse أو Core Web Vitals ميدانية لم تُقَس هنا.
- المعاينة ما زالت صريحة بـ`NPF_PREVIEW_MODE=1` و`MOCK_CATALOG_FALLBACK=1`. خدمات DB/Vendure/SMTP/payment الحية لم تُعتمد، وبوابات [تقرير الدمج](09-care-atlas-integrated-handoff.md) الأمنية والتشغيلية لم تُغلق. لم يُعد npm audit في جولة الحركة؛ نتائج التبعيات الأخيرة موثقة بالتقرير السابق وليست معالجة بهذه الإضافات.
- لا تعديل للصورة المحتشمة، ولا commit/push/merge/deploy. العمل على `arena/2f247beb-npf` فقط. لا مزامنة جديدة إلى Linear أو Google Docs بهذه الجولة؛ التقارير الحالية محفوظة Markdown.
