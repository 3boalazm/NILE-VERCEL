# إعادة التصميم بعد رفض النسخة الأولى — Reference-led redesign

## قرار المستخدم

المستخدم رفض تسليم Clinical Glass بصريًا، وحدد مستوى Ummah Academy وCode & Canvas مرجعًا للقوة والجودة، لا مجرد سلامة الكود. النسخة السابقة ليست تصميمًا معتمدًا؛ الأرقام الاختبارية السابقة لا تعني رضا بصريًا.

## ما تمت مراجعته فعلًا

- https://ummah-academy.vercel.app/ : محتوى الصفحة وفلو audience routing؛ مصدر `src/views/Home.astro` و`src/styles/global.css` من مستودع المستخدم `3boalazm/Ummah-academy`؛ لقطة فعلية محفوظة بالمستودع `docs/assets/phase4/01-de-home.webp`.
- https://codeandcanvas-native.vercel.app/ : المحتوى والبنية المنشورة عبر fetch؛ discipline-driven headline، problem-led inquiry cards، case-study framing، process/acceptance gates. لم يتم الحصول على لقطة مرئية كاملة لهذا المرجع؛ لا يُدّعى pixel audit له.

## تشخيص النسخة المرفوضة

1. عناصر صغيرة أكثر من اللازم: body/utility typography ضعيفة أمام حجم سطح المكتب.
2. استخدام صورة تسويقية مربعة كاملة داخل كارت كـhero بدل تكوين art-directed أصلي.
3. السطح اللؤلؤي/الأخضر مسطح؛ glass مجرد blur أكثر منه material/light/depth.
4. تكرار الإيقاع: عنوان + صف كروت، ثم عنوان + كارت، بلا مشاهد أو transitions تحريرية ذات هوية.
5. لا توجد أداة اختيار واضحة تبرر التفاعل؛ السلايدر والقوائم وحدهما لا يصنعان تجربة خاصة.
6. خط العناوين الإنجليزي المزخرف لا يملك قوة التباين المقصودة من المرجعين.

## الاتجاه البديل: Prismatic Care

ليس نقلًا لقوس Ummah أو visual assets منه. هوية صحية مستقلة: ink/porcelain، ضوء lavender/ice blue، emerald accents، عنوان كبير قوي، مشهد زجاجي بصري مصمّم خصيصًا، عبوة أصلية مستخرجة دون تعديل الكتابة، وطبقات ذات وظيفة حقيقية (مصدر/نشرة/اكتشاف).

- Hero ليس كارت منتج: composition كبيرة مفتوحة + product sculpture + glass proof objects.
- تفاعل مفيد: audience selector يغيّر المجموعة المعروضة ويقود لفلاتر صحيحة، لا تشخيص طبي أو recommendation engine وهمي.
- Collection أكثر تحريرية بأحجام وتكوينات مختلفة، لا grid متكرر في كل section.
- Source / product evidence فصل بصري مميز، ثم closing ذي طابع طباعي واضح.
- خط أساس 16px ومقاس قراءة فعلي؛ sans قوي + serif accent للإنجليزية، خط عربي أصلي ذو وزن وحجم واضحين.
- Motion اختياري خفيف: CSS scene/orbit + state transitions؛ لا يخفي SSR، لا scroll-jacking، ويحترم reduced motion.

## حدود التنفيذ

نحافظ على إصلاحات الأمان والأسعار والمفضلة والاستعادة من الموجة السابقة. لا نضيف claims طبية أو أرقام نجاح. أي صورة تركيبية جديدة هي artwork تجريدي وليست صورة مصنع/تجربة سريرية/عبوة مصطنعة. وضع preview يظل معلنًا ومعاملاته محجوبة.

## ترتيب العمل / معيار التسليم

1. بناء الأصول والمشهد، وإعادة تصميم hero/header واللغة الطباعية.
2. إعادة بناء مشهد اكتشاف الاحتياج وباقي إيقاع الرئيسية؛ مواءمة الكتالوج.
3. عرض لقطة فعلية + معاينة تعمل، لا الاكتفاء بوصف التصميم.
4. إعادة type/lint/unit/build، responsive/RTL ودوال التفاعل. لا تُنسب نتائج النسخة القديمة للجديدة.
5. يبقى القبول البصري للمستخدم؛ لا يُغلق بند التصميم من طرفنا.
