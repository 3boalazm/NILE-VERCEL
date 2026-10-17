# 02 — مراجعة البزنس والتصميم والفلو والتسويق والتحليلات

**2026-10-15 — ملاحظات مستقلة على النسخة الحالية.** المشاهدة الفعلية: Chromium 153، build إنتاجي بكتالوج mock، commerce غير متاح. لقطات الواجهة وأدلة الفحص في `evidence/`؛ الحكم البصري رأي تصميمي موضح، وليس نسبة جودة علمية.

## 1. منظور البزنس: الموقع يخدم مين؟

المشروع ليس موقع استوديو أعمال؛ هو موزع منتجات صحية وأجهزة طبية في مصر. يجب أن يستعير جودة الاستوديو دون التضحية بثقة المشتري أو وضوح السعر والطلب.

من الكود يمكن استنتاج 3 مسارات محتملة، **وليس إثبات أنها personas مبنية على interviews**:

1. عميل يعرف المنتج: المنتج → تفاصيل/السعر → السلة → اختيار الاستلام/الدفع → تأكيد واضح.
2. عميل يبحث حسب الاحتياج: men's/women's/devices → مقارنة محدودة → معلومات/دليل → تواصل أو شراء.
3. صيدلية/متخصص/شريك: الشركة والاعتماد والتوريد → طلب معلومات بتوجيه تجاري.

**المشكلة:** CTA «Request info» في header عام، بدون تمييز جمهور أو منتج، وhero يقود الكل إلى catalog. صفحة contact تجمع inquiry لكن لا توجد funnel attribution أو دليل على SLA/ملكية المتابعة.

**المقترح:** احتفظ بالشراء كهدف أساسي للمنتجات الجاهزة للبيع، واجعل طلب المعلومات ثانويًا ومحدد السياق. لا تضف فورم آخر لكل صفحة؛ مرّر slug/source بشكل آمن إلى نموذج موحد، مع خيارات «عميل / صيدلية / شراكة» إذا أقرها البيزنس. معيار القبول: الطلب يصل للمسؤول بالسياق، لا يُعرض نجاح قبل حفظه، ولا يُدّعى وقت رد لم يتعهد به فريق التشغيل.

## 2. اتجاه التصميم الحالي مقابل طلب Glass

### الموجود فعلًا

- هوية متماسكة: navy/mint/light canvas، خطوط محلية عربية وإنجليزية، أزرار pills وبطاقات rounded.
- الزجاج مستخدم في الهيدر sticky والبطاقات العائمة والشعارات وبعض overlays، لا كـskin شامل على كل الموقع.
- الصورة الرئيسية والـspotlight يعرضان المنتج في مشهد بصري واضح؛ مقارنةً بتكديس كروت عامة، هذه ترقية محسوسة.
- الحركة محسوبة؛ المحتوى لا يعتمد عليها ليظهر، وreduced motion ناجح في suite.
- لقطة desktop الإنجليزية وmobile العربية توضحان أن الأقسام فعلًا مرتبة ومترجمة وليست prototype غير موصول.

### لماذا لا أصفه بأنه «غير تقليدي إطلاقًا»؟

شكل الصفحة ما زال: split hero → stats → spotlight → cards → trust steps → evidence → dark band → testimonials → CTA → footer. الشبكات والألوان نضيفة، لكن تكرار section title + subtitle + card يجعل الإيقاع متوقعًا. العلامة أقرب إلى متجر طبي تحريري راقٍ من تجربة studio glass مميزة.

**توصية Art Direction — غير منفذة في هذه المراجعة:**

- «Clinical Glass»: خلفية pearl هادئة، navy عميق للنص والقرار، mint كإشارة دقيقة، ومساحات زجاجية قليلة ذات وظيفة (toolbar/compact proof panel).
- منتج واحد هو البطل؛ لا gradients/blur على كل card. لا نقل السعر أو المكونات فوق صور شفافة يصعب قراءتها.
- تنويع الإيقاع: لوحة دليل مضغوطة + discovery grid، بدل أن تحمل كل مرحلة 80px padding ونفس header pattern.
- 3 levels فقط للأسطح: canvas / readable solid content / floating glass controls. وثّق opacity/border/blur/radius وحالات dark/reduced-transparency في design tokens.
- لوحة trust واحدة ذات روابط إثبات حقيقية بدل إعادة نفس الاعتماد 4 مرات.
- CSS motion قصيرة، لا WebGL إلزامي أو hover مغناطيسي شامل؛ الصورة/العنوان تظل واضحة من SSR.

**معيار قبول التصميم:** ليست عبارة «جامد». موافقة على اتجاه واحد في ar/en، لقطات 320/390/768/1024/1440، readability وتباين وحالات keyboard/dark/reduced-motion، ثم usability tasks محددة. لا ادعاء الوصول لأفضل استوديو في العالم دون مرجع وموافقة.

## 3. بنية المحتوى والبانلز

### الرئيسية الحالية

1. Hero: تعريف + شراء + لماذا تثق.
2. أرقام + marquee للشركاء.
3. Spotlight لأحد المنتجات.
4. Shop by need.
5. Trust journey.
6. Evidence + PDFs.
7. قصة الشركة.
8. Testimonials من الكتالوج.
9. Contact CTA.

**نقاط القوة:** مسار الحاجة الجديد جيد، روابط موجودة فعلًا، evidence ليست مجرد badge، dental القادمة غير قابلة للنقر فلا تقود إلى listing فارغ.

**الحشو الممكن:** اعتماد Alfasigma/NFSA يظهر في hero chips، stats/marquee، trust، story/quality. الصفحات about/story/quality ليست بالضرورة بلا فائدة، لكن كلها روابط top-level تزيد التشتيت. Blog فارغة ومذكورة في nav، وcareers ليست هدف أغلب المشترين.

### IA مقترحة

- Primary nav: **المنتجات / عن NPF والثقة / تواصل**، مع account/cart/search كأدوات واضحة.
- دمج discovery حسب الاحتياج داخل المنتجات، لا إضافة top-level categories جديدة.
- about/story/quality يمكن تجميعها تحت «عن NPF» أو إبقاء quality فرعية مستقلة للدليل. لا حذف المحتوى الطبي أو policy الضروري.
- careers في footer، blog لا تُروّج في nav قبل وجود محتوى فعلي مع reviewer وتاريخ مراجعة.
- اختبر تقديم Shop by Need قبل spotlight للزائر غير العارف بالمنتج؛ لا افتراض أنه يحسن conversion دون بيانات.
- قلل طول mobile: proof strip أصغر، معلومات المنتج قصيرة + details، trust/evidence مدمجة مع disclosure عند الحاجة.

## 4. فلو الاكتشاف والفلاتر

### ما يعمل

- home need cards تربط بـ`/products?need=...`.
- category/need pills روابط server قابلة للمشاركة وليست state خفية.
- active pills لها `aria-current`.
- search يعتمد query حقيقي، والـlisting يعرض count وempty state.

### ما يحتاج إصلاحًا

- `LocaleSwitcher` يستخدم pathname فقط. اختبار فعلي بدأ بـ`/ar/products?need=men&q=proxeed` وأكد أن target والنتيجة `/en/products` — **الفلاتر والبحث ضاعوا**.
- search form لا يحمل category/need/sort كـhidden inputs، فإرسال بحث من قائمة مفلترة يلغي السياق. behavior مثبت من الكود، لا من اختبار submit مستقل.
- category وneed لا يجتمعان؛ الكود يعطي need الأولوية ثم category. إن كان المقصود بدائل، يجب شرحه؛ لا تعرضهما كفلاتر متراكمة ضمنًا.
- ترتيب الاسم موجود في query، وليس هناك control واضح له في UI الحالية. مع 8 منتجات ربما حذفه أفضل من إضافة sort panel بلا حاجة.
- صورة hero كبيرة وpositioning matrix قبل الشبكة تؤخر وصول العميل العارف بالاسم إلى المنتجات، خصوصًا mobile. اجعل عنوان/search/filter أعلى القائمة، وقدّم matrix كمساعدة اختيارية لا حاجز.

معيار القبول: البحث والتبديل بين اللغات يحفظان السياق، back/forward يعيدان نفس النتائج، query عربية/إنجليزية لها سلوك معلوم، والرابط المباشر يعرض نتيجة صحيحة بلا JS.

## 5. PDP والسلة والدفع

### الموجود

PDP يعرض galleries ووصفًا ومكونات/FAQ ومراجع ونشرات حسب المنتج، حالة availability وسعر/طلب سعر وكمية وwishlist وrelated products. التفاصيل وفلو التجارة native للكود وليست روابط متجر خارجي.

checkout يجمع البيانات، يحسب الشحن عبر السيرفر، ويعيد التحقق من fulfillment. company/notes الآن يُرسلان للسيرفر، والـshipping غير المتاح لا يُستبدل صامتًا كما وصف التقرير القديم. توجد cart outage/retry بدل ادعاء سلة فارغة.

### فجوات

- PDP عند 1024 عربي أظهر overflow فعلي وزر wishlist خارج يسار viewport. الـgrid/عرض CTA والكمية يحتاجان اختبار min-width لا مجرد إضافة overflow hidden.
- سعر catalog يمكن أن يأتي من mock bridge حتى لو `MOCK_CATALOG_FALLBACK` غير مفعّل: هذا flag يحمي سقوط المحتوى لا live pricing. لا وعد بـ«نفس سعر checkout دائمًا» عندما المصدر fallback أو cache TTL.
- الحالة `active` ليست stock count، ومع ذلك تتحول في JSON-LD إلى InStock. يلزم قرار مخزون فعلي أو تعديل المعنى قبل إعلان توفر نهائي.
- الدفع في storefront يدوي COD/bank transfer بـ`manual-settlement`. كود بوابات أخرى يحتوي scaffolds؛ لا يُنسب إليه دفع online مكتمل.
- لم تُختبر أسعار الشحن الحقيقية/خصم التحويل/تأكيد الدفع/تكرار الإرسال/تزامن تبويبين على Vendure. اجعل ذلك release gate مستقلًا.

**المقترح:** summary واحد authoritative قبل placeOrder، إعادة تأكيد تغيّر السعر/الشحن، error قابل للإجراء يحفظ المدخلات، ورقم order/حالة payment لا توحي بسداد لم يحدث. اختبر حالات retry بعد انقطاع الرد دون طلبين لنفس العميل.

## 6. الحساب والنماذج

- login محمي من redirect خارجي وله unit tests.
- لا forgot/reset password routes في هذه النسخة، ولا SMTP configuration ضمنها؛ إضافات موصوفة في PR #4 المفتوح، لا نحتسبها منجزة هنا.
- لا skip link أو error boundary مصممة في النسخة الحالية.
- wishlist promise بلا catch: الفشل قد يبقي spinner، وقراءة slugs من client تحتاج bound server-side.
- حذف address يستدعي server action ثم refresh دون تقييم `{ok:false}`، فلا feedback عند الرفض.
- أخطاء server actions المختلفة تُختزل أحيانًا في رسالة عامة. نحتاج field-level mapping و`aria-describedby`/`aria-invalid` وإعادة enable عند throw أيضًا.
- مشكلة privacy إضافية: cache الـPWA لا يستبعد account/login/register حاليًا؛ راجعها قبل اعتماد التجربة على جهاز مشترك.

## 7. التسويق والادعاءات الصحية

- «evidence-based» مدعومة بreferences وleaflets في المحتوى؛ هذا أفضل من claims بلا روابط.
- مصدر testimonials وفق التعليقات هو Proxeed الرسمي، وليس تجربة موثقة لعميل مصري. لا يثبت التعليق consent أو approval أو صحة النتيجة الطبية.
- NFSA 2030 والتوزيع الرسمي يحتاجان owner-approved source/register per product؛ القاموس ليس سجلًا تنظيميًا.
- 8 products و2 categories أرقام hardcoded في home رغم وصفها كأرقام محسوبة. يجب اشتقاقها من catalog أو وصفها كنسخة بتاريخ محدد.
- لا اختراع نسب نجاح/شفاء/تحويل ولا توسيع claim لتشمل كل الأجهزة بسبب تصريح يخص الغذاء.
- CTA «اطلب معلومات» ينبغي ألا يُفهم كتشخيص أو ضمان نتيجة. PDP يجب أن يوضح حدود المعلومات والاستخدام والنشرة الرسمية كما يقرها المختص.

## 8. Analytics: الاقتراحات لا يمكن قياسها حاليًا

لم نجد SDK أو event calls أو consent implementation في `src`. نص privacy يقول «قد نستخدم analytics»، وهذا ليس تطبيقًا.

**خطة قياس مقترحة غير منفذة:**

| الحدث | الهدف | بيانات مسموحة مقترحة |
|---|---|---|
| `view_item_list` / `select_item` | تقييم discovery | locale, public product slug, source section |
| `search` / `filter_apply` | فهم نجاح العثور | category/need ID؛ تجنب query الحرة الصحية أو راجعها قانونيًا |
| `view_item` / `view_evidence` | هل الدليل يخدم القرار؟ | slug, evidence type؛ لا هوية/حالة مرضية |
| `add_to_cart` | intent | slug, quantity بعد نجاح action لا عند مجرد click |
| `begin_checkout` / `checkout_error` | مواضع التسرب | normalized error code وstep، لا عنوان/موبايل |
| `purchase` | تحويل مكتمل | order identifier محدود مع dedup، amount/currency؛ سياسة retention واضحة |
| `contact_submit_success` | leads حقيقية | نوع inquiry ومصدره، بلا message/email/phone |

المنتجات تشمل fertility/sexual health: لا session replay للنماذج، لا إرسال بيانات health/query الحرة أو PII إلى marketing tools. اختر privacy-first vendor/consent وretention بموافقة قانونية؛ conversion KPI لا يستلزم جمع تاريخ صحي.

المقاييس المطلوبة: search-to-product، product-to-cart، checkout success، inquiry persisted-to-response، errors/timeouts. لا أرقام نتائج قبل baseline حقيقي.

## 9. البحث الذي ينقص قبل إعادة التصميم

- 5–8 جلسات usability مقترحة موزعة على جمهور الشراء والمتخصصين، عينة استطلاعية لا إحصاء conversion.
- مهام: ابحث عن منتج يناسب مقصدًا عامًّا دون تشخيص، راجع النشرة، غيّر اللغة مع filters، أكمل guest checkout، افهم طريقة الدفع والرد.
- سجل task success، first-click، الوقت/الأخطاء، ومواضع فقد الثقة؛ لا collecting بيانات طبية حساسة في التسجيلات.
- مراجعة 3 مراجع design بقواعد typography/spacing/interaction، وليس نسخ الشكل أو benchmark وهمي. الوصول المباشر لمعظم مواقع الاستوديوهات غير متاح بسبب حدود الإنترنت الحالية؛ مراجعة المنافسين live **لم تتم**.
- حدد content owner وmedical reviewer وcustomer-support owner، ثم اعتمد IA/المحتوى قبل polishing animation.

**القرار:** احفظ الأساس الجيد. ابدأ بسلامة التجارة والـresponsive والإتاحة والتوثيق، ثم refactor بصري موجّه بbrief. كثرة blur والحركة ليست بديلًا عن فلو واضح وثقة قابلة للإثبات.
