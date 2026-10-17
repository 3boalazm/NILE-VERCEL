import type { Product, ProductCategory } from "./types"
import type { ProductRepository } from "./repository"

const CATEGORIES: ProductCategory[] = [
  {
    id: "cat_supplements",
    slug: "supplements",
    name: "مكملات غذائية",
    description: "مكملات متخصصة لدعم الصحة الإنجابية والصحة الجنسية، بتركيبات مبنية على أبحاث علمية منشورة.",
    image: "/categories/supplements.jpg",
    translations: {
      en: {
        name: "Food Supplements",
        description: "Specialized supplements to support reproductive and sexual health, with formulations based on published scientific research.",
      },
    },
  },
  {
    id: "cat_medical-devices",
    slug: "medical-devices",
    name: "أجهزة طبية",
    description: "أجهزة قياس طبية من CA-MI الإيطالية، للاستخدام المنزلي والاحترافي.",
    image: "/categories/medical-devices.jpg",
    translations: {
      en: {
        name: "Medical Devices",
        description: "Medical measurement devices from CA-MI (Italy), for home and professional use.",
      },
    },
  },
  // Announced future lines — no products yet, so no description is invented
  // beyond the category name itself. "Dental" was flagged to Ahmed as having
  // no matching photo on file; he supplied a real dental-instrument photo
  // (Pexels, kris tina) directly in response — replaces the generic
  // "Coming Soon" brand graphic placeholder used until then.
  {
    id: "cat_dental",
    slug: "dental",
    name: "العناية بالأسنان",
    status: "coming_soon",
    image: "/categories/dental.jpg",
    translations: { en: { name: "Dental Care" } },
  },
  {
    id: "cat_cosmetics",
    slug: "cosmetics",
    name: "مستحضرات التجميل",
    status: "coming_soon",
    image: "/categories/cosmetics.jpg",
    translations: { en: { name: "Cosmetics" } },
  },
  {
    id: "cat_drugs",
    slug: "drugs",
    name: "أدوية",
    status: "coming_soon",
    image: "/categories/drugs.webp",
    translations: { en: { name: "Pharmaceuticals" } },
  },
]

const PRODUCTS: Product[] = [
  {
    id: "prod_proxeed-plus",
    slug: "proxeed-plus",
    image: "/products/proxeed-plus-hero.webp",
    name: "Proxeed Plus",
    nameArabic: "بروكسيد بلس",
    categorySlug: "supplements",
    status: "active",
    shortDescription:
      "مكمل غذائي لدعم خصوبة الرجال، مدعوم بدراسة سريرية منشورة خاصة بالمنتج نفسه — وليس فقط بمكوناته.",
    keyBenefits: [
      "في دراسة عام 2024 مقارنة بدواء وهمي، لوحظ تحسّن ملحوظ في تركيز الحيوانات المنوية وعددها وحركتها خلال 6 أشهر من الاستخدام.",
      "أفضل استجابة كانت لدى الرجال في عمر 35 سنة أو أقل ومؤشر كتلة جسم طبيعي.",
      "تركيبة قائمة على L-Carnitine و Acetyl-L-Carnitine، مكوّنات مدروسة في الأبحاث المنشورة.",
      "يحتوي على الزنك (يساهم في الخصوبة والتكاثر الطبيعي) والسيلينيوم (يدعم تكوّن الحيوانات المنوية الطبيعي) — ادعاء مسجّل رسميًا ومطبوع على العلبة.",
    ],
    composition: [
      { label: "L-Carnitine fumarate", value: "3,450 mg" },
      { label: "Fructose", value: "2,000 mg" },
      { label: "Acetyl-L-Carnitine HCl", value: "1,000 mg" },
      { label: "فيتامين C", value: "180 mg" },
      { label: "حمض الستريك", value: "100 mg" },
      { label: "Zinc lactate", value: "20 mg زنك" },
      { label: "Coenzyme Q10", value: "40 mg" },
      { label: "حمض الفوليك", value: "400 µg" },
      { label: "سيلينيوم", value: "100 µg" },
      { label: "فيتامين B12", value: "3 µg" },
    ],
    compositionNote: "لكل 2 كيس (الجرعة اليومية الكاملة)",
    usage:
      "يُذاب كيسان يوميًا (الجرعة الكاملة)، كل كيس في حوالي 120 مل ماء أو عصير برتقال، في نفس الموعد يوميًا، لمدة 4 إلى 6 أشهر — إذ يحتاج الحيوان المنوي حوالي 90 يومًا لينضج.",
    sku: "PXD-PLS-001",
    availableForm: "أكياس بودرة بنكهة الليمون، 30 كيس × 5 جم",
    downloadUrl: "/downloads/proxeed-plus-leaflet.pdf",
    scientificInfo:
      "تركيبة Proxeed Plus مدعومة بأدلة علمية مباشرة على المنتج نفسه — الأقوى بين تشكيلة بروكسيد. في دراسة سريرية معشّاة ومقارنة بدواء وهمي (Busetto وآخرون، 2024)، لوحظ تحسّن ملحوظ في تركيز الحيوانات المنوية وعددها وحركتها التقدمية خلال 6 أشهر، مع أفضل استجابة لدى الرجال في عمر 35 سنة أو أقل وبمؤشر كتلة جسم طبيعي. الادعاء المتعلق بدور الزنك والسيلينيوم في الخصوبة مسجّل رسميًا ومطبوع على العلبة.\n\nProxeed Plus هو مكمل خصوبة مصمم لتحسين جودة الحيوانات المنوية وزيادة فرص الحمل من خلال توفير مزيج من العناصر الغذائية الأساسية. يحتوي على مكونات مثل L-Carnitine، وAcetyl L-Carnitine، والفيتامينات، التي تدعم تطوير الحيوانات المنوية، ووظيفتها، وحمايتها من الإجهاد التأكسدي.\n\nأثبتت الدراسات سريريًا فعاليته في تحسين جودة الحيوانات المنوية وحركتها، ويعتبر Proxeed Plus آمنًا وفعالًا، ويوصى به للرجال الذين يسعون لتحسين الخصوبة، بما في ذلك أولئك الذين يعانون من مشاكل في الخصوبة أو يستعدون للتخصيب الصناعي. يجمع هذا المكمل الغذائي بين الفيتامينات والمعادن والأحماض الأمينية التي يُعتقد أنها تعزز صحة الحيوانات المنوية وتحسن عددها، وحركتها، وشكلها.\n\nProxeed Plus متاح بدون وصفة طبية ويتم تصنيعه بواسطة AlfaSigma HealthScience. من الضروري استشارة أخصائي الرعاية الصحية للحصول على أحدث المعلومات حول Proxeed Plus.\n\nلماذا Proxeed Plus؟\n• تعزيز الخصوبة وزيادة فرص الحمل: مصمم لتحسين الخصوبة الذكرية وزيادة فرص الحمل من خلال توفير العناصر الغذائية الأساسية التي تدعم الصحة الإنجابية.\n• مزيج شامل من العناصر الغذائية: يحتوي على مزيج متوازن من الفيتامينات والمعادن والعناصر الحيوية الأخرى، بما في ذلك L-Carnitine، وAcetyl L-Carnitine، وCoenzyme Q10، والزنك، وحمض الفوليك، وهي ضرورية للخصوبة الذكرية.\n• دعم تطوير وجودة الحيوانات المنوية: تساعد المكونات في تطوير الحيوانات المنوية الصحية، وتوفير الطاقة والحماية من الإجهاد التأكسدي، مما يحافظ على جودة الحيوانات المنوية.\n• تحسين حركة ووظيفة الحيوانات المنوية: تعزز العناصر الغذائية الأساسية في Proxeed Plus حركة الحيوانات المنوية الطبيعية ووظيفتها، وهي ضرورية لتحقيق الحمل الناجح.\n• تعزيز عدد وشكل الحيوانات المنوية الصحي: يدعم إنتاج عدد صحي من الحيوانات المنوية وشكلها، وهي عوامل حاسمة للحمل الناجح.\n• فعالية مثبتة سريريًا: ثبت أنه يحسن جودة الحيوانات المنوية ووظيفتها، مما يجعله خيارًا موثوقًا للرجال الذين يتطلعون لتعزيز خصوبتهم.\n• آمن وفعال: مكمل بسيط وآمن يمكن تناوله على مدى فترة من أربعة إلى ستة أشهر لتحقيق أفضل النتائج.\n• تركيبة براءة اختراع: يبرز تركيبته الفريدة والفعالة.\n• مناسب لمجموعة متنوعة من تحديات الخصوبة: يُوصى به للرجال الذين يسعون لتحسين الخصوبة، سواء كانوا يعانون من مشاكل في الخصوبة أو يستعدون لتقنيات التخصيب المساعدة مثل IVF.",
    faq: [
      {
        question: "كم عدد السعرات الحرارية في الكيس الواحد؟",
        answer: "يحتوي كل كيس على 12 سعرة حرارية.",
      },
      {
        question: "ماذا لو نسيت تناول الجرعة لعدة أيام؟",
        answer: "استأنف التناول بانتظام كالمعتاد، دون الحاجة لتعويض الجرعات الفائتة.",
      },
      {
        question: "هل المنتج مناسب للنباتيين؟",
        answer: "نعم، لا يحتوي على أي مكونات مشتقة من مصادر حيوانية.",
      },
      {
        question: "هل المنتج حلال؟",
        answer: "نعم، حاصل على شهادة حلال.",
      },
    ],
    testimonials: [
      {
        quote:
          "كنا نحاول الإنجاب لأكثر من عامين دون نجاح. أحالنا الطبيب لفحوصات خصوبة، وفوجئت أن المشكلة كانت مني. كنت مدخنًا ونظامي الغذائي لم يكن جيدًا. طلب مني الطبيب تحسين نظامي الغذائي، الإقلاع عن التدخين، وتناول Proxeed Plus لتحسين عدد الحيوانات المنوية. أصبحنا الآن أبوين فخورين بابنتنا ميا.",
        author: "نيك، 41 عامًا",
      },
      {
        quote:
          "بعد سنوات من المحاولة، وعندما قررت زوجتي تجربة أطفال الأنابيب لم أكن متحمسًا. كملاذ أخير قررت تجربة Proxeed Plus. نجح الأمر وحملت زوجتي دون تدخل طبي. لو كنت رجلاً فوق 35 عامًا، فحيواناتك المنوية على الأرجح ليست بالصحة التي تظنها.",
        author: "ستيوارت، 43 عامًا",
      },
    ],
    clinicalReferences: [
      {
        title:
          "Antioxidant treatment for oligoasthenoteratozoospermia and varicocele: a DBPC trial to evaluate the impact of age and body mass index",
        authors: "Busetto GM et al., Asian J Androl",
        year: "2024",
        url: "https://doi.org/10.4103/aja202381",
      },
      {
        title:
          "Baseline levels of seminal reactive oxygen species predict improvements in sperm function following anti-oxidant therapy in men with infertility",
        authors: "Vessey et al.",
        year: "2020",
        url: "https://doi.org/10.1111/cen.14328",
      },
      {
        title:
          "Double-blind, randomised, placebo-controlled trial on the effect of L-carnitine and L-acetylcarnitine on sperm parameters in men with idiopathic oligoasthenozoospermia",
        authors: "Micic et al., Andrologia",
        year: "2019",
        url: "https://doi.org/10.1111/and.13267",
      },
      {
        title:
          "Effect of metabolic and antioxidant supplementation on sperm parameters in oligo-astheno-teratozoospermia, with and without varicocele: a double-blind placebo-controlled study",
        authors: "Busetto et al., Andrologia",
        year: "2018",
        url: "https://doi.org/10.1111/and.12927",
      },
      {
        title:
          "Prospective open-label study on the efficacy and tolerability of a combination of nutritional supplements in primary infertile patients with idiopathic astenoteratozoospermia",
        authors: "Busetto et al., Arch Ital Urol Androl",
        year: "2012",
        url: "https://pubmed.ncbi.nlm.nih.gov/23210405/",
      },
      {
        title: "The role of food supplements in the treatment of the infertile man",
        authors: "Comhaire FH, Mahmoud A",
        year: "2003",
        url: "https://doi.org/10.1016/s1472-6483(10)61881-0",
      },
    ],
    price: 2550,
    currency: "ج.م",
    translations: {
      en: {
        shortDescription:
          "A food supplement to support men's fertility, backed by a published clinical study on the product itself — not just its ingredients.",
        keyBenefits: [
          "In a 2024 study compared to placebo, a marked improvement was observed in sperm concentration, count, and motility over 6 months of use.",
          "The best response was seen in men aged 35 or younger with a normal body mass index.",
          "A formula based on L-Carnitine and Acetyl-L-Carnitine, ingredients studied in published research.",
          "Contains zinc (contributes to fertility and normal reproduction) and selenium (supports normal sperm formation) — an officially registered claim printed on the box.",
        ],
        composition: [
          { label: "L-Carnitine fumarate", value: "3,450 mg" },
          { label: "Fructose", value: "2,000 mg" },
          { label: "Acetyl-L-Carnitine HCl", value: "1,000 mg" },
          { label: "Vitamin C", value: "180 mg" },
          { label: "Citric acid", value: "100 mg" },
          { label: "Zinc lactate", value: "20 mg zinc" },
          { label: "Coenzyme Q10", value: "40 mg" },
          { label: "Folic acid", value: "400 µg" },
          { label: "Selenium", value: "100 µg" },
          { label: "Vitamin B12", value: "3 µg" },
        ],
        compositionNote: "Per 2 sachets (full daily dose)",
        usage:
          "Dissolve two sachets daily (the full dose), each in about 120ml of water or orange juice, at the same time each day, for 4–6 months — sperm take about 90 days to mature.",
        availableForm: "Lemon-flavored powder sachets, 30 sachets × 5 g",
        scientificInfo:
          "Proxeed Plus is backed by direct clinical evidence on the product itself — the strongest evidence base in the Proxeed range. In a randomized, placebo-controlled clinical trial (Busetto et al., 2024), a significant improvement was observed in sperm concentration, count, and progressive motility over 6 months, with the strongest response in men aged 35 or younger with a normal body mass index. The zinc and selenium fertility claim is an officially registered regulatory claim printed on the box.\n\nProxeed Plus is a male fertility supplement designed to enhance sperm quality and increase the chances of conception by providing a blend of essential nutrients. It contains ingredients such as L-Carnitine, Acetyl L-Carnitine, and vitamins, which support sperm development, function, and protection against oxidative stress. Clinically proven to improve sperm quality and motility, Proxeed Plus is safe, effective, and recommended for men aiming to optimize fertility, including those experiencing fertility issues or preparing for assisted reproduction. This dietary supplement combines vitamins, minerals, and amino acids believed to promote sperm health and improve sperm count, motility, and morphology. Proxeed Plus is available over the counter and is manufactured by AlfaSigma HealthScience. It is crucial to consult a healthcare professional for the most current information on Proxeed Plus.\n\nProxeed Plus is a high-quality fertility supplement specifically designed to support healthy sperm development and maximise a man's chances of fathering a child. Its clinically proven formulation contains the right balance of high-quality nutrients and antioxidants to support the natural metabolic processes for normal spermatogenesis (sperm production). The ingredients in Proxeed Plus have been shown to play a critical role in sperm quality providing energy to the developing sperm cell, while simultaneously protecting it from oxidative stress. Proxeed Plus is supported by more than 30 years of clinical studies and is used by thousands of men worldwide. Proxeed Plus is a simple, safe, and effective way to support sperm quality and male reproductive health. Recommended by fertility doctors for all men who want to optimise their sperm health.\n\nWhy Proxeed Plus?\n• Enhances Fertility and Increases Conception Chances: Proxeed Plus is designed to improve male fertility and boost the chances of conception by providing essential nutrients that support reproductive health.\n• Comprehensive Nutrient Blend: Contains a balanced mix of vitamins, minerals, and other vital nutrients, including L-Carnitine, Acetyl L-Carnitine, Coenzyme Q10, Zinc, and Folic Acid, crucial for male fertility.\n• Supports Sperm Development and Quality: Ingredients help in the development of healthy sperm, providing energy and protection from oxidative stress, thereby maintaining sperm quality.\n• Improves Sperm Motility and Function: Key nutrients in Proxeed Plus encourage normal sperm motility and function, essential for successful conception.\n• Promotes Healthy Sperm Count and Morphology: Supports the production of a healthy sperm count and morphology, critical factors for a successful pregnancy.\n• Clinically Proven Efficacy: Proven to improve sperm quality and function, making it a reliable choice for men looking to enhance their fertility.\n• Safe and Effective: A simple and safe supplement that can be taken over a four to six-month period for optimal results.\n• Patented Formula: Highlights its unique and effective formulation.\n• Suitable for Various Fertility Challenges: Recommended for men aiming to optimize fertility, whether experiencing fertility problems or preparing for assisted reproduction techniques like IVF.",
        faq: [
          {
            question: "What is Proxeed Plus?",
            answer:
              "Proxeed Plus is a clinically proven fertility supplement designed to support healthy sperm development and maximize a man's chances of fathering a child. It contains carnitines, vitamins, and minerals.",
          },
          {
            question: "Who should take Proxeed Plus?",
            answer:
              "Proxeed Plus is recommended for men who want to optimize sperm health, are experiencing fertility problems, are preparing for assisted reproductive techniques (ART), or have an unhealthy lifestyle such as smoking or being overweight.",
          },
          { question: "How many calories are in one sachet?", answer: "Each sachet contains 12 kcal." },
          {
            question: "What if I forget to take it for several days?",
            answer: "Simply resume taking it regularly — no need to make up for missed doses.",
          },
          {
            question: "Is Proxeed Plus suitable for vegetarians?",
            answer: "Yes, it contains no animal-derived ingredients.",
          },
          { question: "Is Proxeed Plus halal?", answer: "Yes, it is certified halal." },
        ],
        testimonials: [
          {
            quote:
              "My partner and I had been trying for a baby for over 2 years without success. Our doctor referred us for some fertility tests. I was really shocked to find out it was me, that was the problem. I had been a smoker and my diet wasn't great. I didn't realise that what I ate and drank could affect my sperm. I was told to improve my diet, stop smoking and take Proxeed Plus to improve my sperm count. We are now the proud parents of baby Mia.",
            author: "Nick, 41",
          },
          {
            quote:
              "After years of trying for a baby when my wife decided that we should give IVF a go I wasn't keen. As a last resort I decided to try Proxeed Plus. It worked and we were fortunate enough to get pregnant without medical intervention. If you're a man over 35, your sperm probably isn't as healthy as you might think. I now tell everyone to try Proxeed Plus.",
            author: "Stewart, 43",
          },
          {
            quote:
              "I was stressed and so was my sperm. It was suffering from oxidative stress, caused by too much work, not enough sleep, my age and probably my unhealthy diet. I was told to take Proxeed Plus by our doctor, but I didn't. Little did I know that my wife was putting it in my orange juice. I'm still sleep deprived, but for a different reason, a baby is hard work.",
            author: "Ashish, 38",
          },
          {
            quote:
              "I always thought that men could have a child even in their 80's, so I was surprised to be told that my age and lifestyle was playing havoc on my sperm. I'm so glad that I took Proxeed Plus. I'm now a father for the first time at 51 and my life couldn't be better.",
            author: "Roger, 51",
          },
          {
            quote:
              "When all of your friends around you are having babies, and say “we got lucky on the first try, I must be really fertile” it’s really distressing and stressful, particularly when you’ve been trying for years. You say to yourself, why can’t it happen to me? If you’ve been trying to get pregnant and can’t, get checked out by a doctor and then take Proxeed Plus for men. I did. Thank you AlfaSigma, we now have our perfect child.",
          },
        ],
        clinicalReferences: [
          {
            title:
              "Antioxidant treatment for oligoasthenoteratozoospermia and varicocele: a DBPC trial to evaluate the impact of age and body mass index",
            authors: "Busetto GM et al., Asian J Androl",
            year: "2024",
            url: "https://doi.org/10.4103/aja202381",
          },
          {
            title:
              "Baseline levels of seminal reactive oxygen species predict improvements in sperm function following anti-oxidant therapy in men with infertility",
            authors: "Vessey et al.",
            year: "2020",
            url: "https://doi.org/10.1111/cen.14328",
          },
          {
            title:
              "Double-blind, randomised, placebo-controlled trial on the effect of L-carnitine and L-acetylcarnitine on sperm parameters in men with idiopathic oligoasthenozoospermia",
            authors: "Micic et al., Andrologia",
            year: "2019",
            url: "https://doi.org/10.1111/and.13267",
          },
          {
            title:
              "Effect of metabolic and antioxidant supplementation on sperm parameters in oligo-astheno-teratozoospermia, with and without varicocele: a double-blind placebo-controlled study",
            authors: "Busetto et al., Andrologia",
            year: "2018",
            url: "https://doi.org/10.1111/and.12927",
          },
          {
            title:
              "Prospective open-label study on the efficacy and tolerability of a combination of nutritional supplements in primary infertile patients with idiopathic astenoteratozoospermia",
            authors: "Busetto et al., Arch Ital Urol Androl",
            year: "2012",
            url: "https://pubmed.ncbi.nlm.nih.gov/23210405/",
          },
          {
            title: "The role of food supplements in the treatment of the infertile man",
            authors: "Comhaire FH, Mahmoud A",
            year: "2003",
            url: "https://doi.org/10.1016/s1472-6483(10)61881-0",
          },
        ],
      },
    },
  },
  {
    id: "prod_proxeed-men",
    slug: "proxeed-men",
    image: "/products/proxeed-men.jpg",
    name: "Proxeed Men",
    nameArabic: "بروكسيد رجال",
    categorySlug: "supplements",
    status: "launching_soon",
    shortDescription:
      "تركيبة Alfasigma الأوسع طيفًا لدعم الخصوبة — ثلاث صور من الكارنيتين إضافة إلى L-Arginine ومجموعة فيتامينات ومعادن كاملة، وبنفس الادعاء الرسمي المسجّل للزنك والسيلينيوم الموجود في Proxeed Plus.",
    keyBenefits: [
      "يحتوي على الزنك والسيلينيوم — بنفس الادعاء الرسمي المسجّل الموجود في Proxeed Plus.",
      "ثلاث صور من الكارنيتين مع L-Arginine و CoQ10 ومجموعة فيتامينات ومعادن كاملة تشمل فيتامين E وفيتامين D.",
      "مكوّن من نفس تركيبة L-Carnitine و Acetyl-L-Carnitine المدروسة في الأبحاث المنشورة حول صحة الحيوانات المنوية.",
    ],
    composition: [
      { label: "L-carnitine fumarate", value: "3,540 mg" },
      { label: "Acetyl-L-carnitine HCl", value: "1,000 mg" },
      { label: "Propionyl-L-carnitine HCl", value: "504 mg" },
      { label: "L-arginine", value: "1,000 mg" },
      { label: "فيتامين C", value: "180 mg" },
      { label: "Coenzyme Q10", value: "40 mg" },
      { label: "فيتامين E", value: "24 mg" },
      { label: "زنك", value: "15 mg" },
      { label: "سيلينيوم", value: "100 µg" },
      { label: "حمض الفوليك", value: "400 µg" },
      { label: "فيتامين D", value: "7.5 µg" },
      { label: "فيتامين B12", value: "3 µg" },
    ],
    compositionNote: "لكل 2 كيس (الجرعة اليومية الكاملة)",
    usage: "كيس واحد صباحًا وكيس واحد مساءً، يُذاب في حوالي 150 مل ماء أو عصير، لمدة عدة أسابيع إلى أشهر حسب النشرة الداخلية للمنتج.",
    sku: "PXD-MEN-001",
    availableForm: "أكياس بودرة، 30 كيس × 6.5 جم",
    downloadUrl: "/downloads/proxeed-men-leaflet.pdf",
    scientificInfo:
      "تركيبة Proxeed Men مدعومة بمزيج من دليل على مستوى المكونات وادعاء تنظيمي رسمي — وليست دراسة سريرية مخصصة لتركيبة \"Metabolic Approach\" الحالية. المنتج يحمل نفس الادعاء المسجّل رسميًا الخاص بدور الزنك والسيلينيوم في الخصوبة الموجود في Proxeed Plus، وتركيبته الأساسية (L-Carnitine وAcetyl-L-Carnitine) مدروسة في الأبحاث المنشورة. دراسة Cavallini (2004) المتداولة عن هذا المزيج تخص الوظيفة الجنسية والمزاج لدى الرجال الأكبر سنًا، وليست مؤشرًا على الخصوبة.",
    faq: [
      {
        question: "ما الفرق بين Proxeed Men وProxeed Plus؟",
        answer:
          "Proxeed Men نسخة مطوّرة من تركيبة Proxeed Plus الأصلية — يضيف Tricar (مزيج حاصل على براءة اختراع من ثلاث صور للكارنيتين) لتعزيز إنتاج الطاقة داخل الحيوان المنوي، إضافة إلى L-Arginine وفيتامين D وفيتامين E لدعم تدفق الدم والحماية المضادة للأكسدة.",
      },
      {
        question: "لمن يُنصح باستخدام Proxeed Men؟",
        answer:
          "للرجال الراغبين في تحسين صحة الحيوانات المنوية، أو الذين يعانون من مشاكل خصوبة، أو في مرحلة التعافي بعد إصلاح جراحي لدوالي الخصية، أو المقبلين على تقنيات الإخصاب المساعد، أو أصحاب النظام الغذائي وأسلوب الحياة غير الصحي.",
      },
      {
        question: "ماذا لو نسيت تناول الجرعة لعدة أيام؟",
        answer: "استأنف التناول بانتظام كالمعتاد.",
      },
      {
        question: "هل المنتج حلال؟",
        answer: "نعم، حاصل على شهادة حلال.",
      },
    ],
    translations: {
      en: {
        shortDescription:
          "Alfasigma's broadest-spectrum fertility-support formula — three forms of carnitine plus L-Arginine and a complete set of vitamins and minerals, carrying the same officially registered zinc and selenium claim found in Proxeed Plus.",
        keyBenefits: [
          "Contains zinc and selenium — the same officially registered claim found in Proxeed Plus.",
          "Three forms of carnitine with L-Arginine and CoQ10, plus a complete set of vitamins and minerals including Vitamin E and Vitamin D.",
          "Built on the same L-Carnitine and Acetyl-L-Carnitine formula studied in published research on sperm health.",
        ],
        composition: [
          { label: "L-carnitine fumarate", value: "3,540 mg" },
          { label: "Acetyl-L-carnitine HCl", value: "1,000 mg" },
          { label: "Propionyl-L-carnitine HCl", value: "504 mg" },
          { label: "L-arginine", value: "1,000 mg" },
          { label: "Vitamin C", value: "180 mg" },
          { label: "Coenzyme Q10", value: "40 mg" },
          { label: "Vitamin E", value: "24 mg" },
          { label: "Zinc", value: "15 mg" },
          { label: "Selenium", value: "100 µg" },
          { label: "Folic acid", value: "400 µg" },
          { label: "Vitamin D", value: "7.5 µg" },
          { label: "Vitamin B12", value: "3 µg" },
        ],
        compositionNote: "Per 2 sachets (full daily dose)",
        usage:
          "One sachet in the morning and one in the evening, dissolved in about 150 ml of water or juice, for several weeks to months per the product's package insert.",
        availableForm: "Powder sachets, 30 sachets × 6.5 g",
        scientificInfo:
          "Proxeed Men's formula is backed by a mix of ingredient-level evidence and an official regulatory claim — not a dedicated clinical trial of the current \"Metabolic Approach\" formula. It carries the same officially registered zinc-and-selenium fertility claim as Proxeed Plus, and its core L-Carnitine/Acetyl-L-Carnitine formula is studied in published research. The often-cited Cavallini (2004) study on this ingredient combination concerns sexual function and mood in older men — not a fertility endpoint.\n\nProxeed Men is a specialized fertility supplement formulated to enhance sperm health and improve the chances of conception. This supplement provides a comprehensive blend of essential nutrients that support various aspects of male reproductive health.\n\nClinically proven to improve sperm quality. Proxeed Men works by enhancing sperm quality and function, which is critical for male fertility. The supplement is designed to be safe and effective for men looking to optimize their reproductive potential. It is particularly beneficial for those experiencing fertility challenges or preparing for assisted reproductive techniques like IVF.\n\nWhy Proxeed Men?\n• Enhances Fertility and Increases Chances of Conception: Proxeed Men is designed to improve sperm health and boost the chances of conception by providing essential nutrients that support reproductive function.\n• Comprehensive Nutrient Blend: Contains a balanced mix of vitamins, minerals, and other vital nutrients, including Tricar (a patented blend of three carnitines), L-Arginine, Vitamin D, and Vitamin E, which are crucial for male fertility.\n• Supports Sperm Development and Quality: The ingredients in Proxeed Men help in the production of healthy sperm, providing them with energy and protecting them from oxidative stress, thereby maintaining their quality.\n• Improves Sperm Motility and Morphology: Key nutrients in Proxeed Men enhance sperm movement and structure, improving their ability to reach and fertilize an egg.\n• Promotes Sperm Count and Speed: Supports the production of a higher number of healthy sperm, increasing the chances of conception.\n• Clinically Proven Efficacy: Clinically proven to improve sperm quality and function, making it a reliable choice for men looking to enhance their reproductive health.\n• Safe and Effective: A simple and safe supplement that can be taken over a four to six-month period for optimal results.\n• Patented Formula: Proxeed Men is a patented fertility supplement, highlighting its unique and effective formulation.\n• Suitable for Various Fertility Challenges: Recommended for all men aiming to optimize their sperm health, whether experiencing fertility problems or preparing for assisted reproduction techniques like IVF.",
        faq: [
          {
            question: "What is Proxeed Men?",
            answer:
              "Proxeed Men is a clinically proven formulation designed to support healthy sperm development and maximize a man's chances of fathering a child. It contains essential vitamins and nutrients that enhance sperm function and fertility.",
          },
          {
            question: "What's the difference between Proxeed Men and Proxeed Plus?",
            answer:
              "Proxeed Men is an improved version of the original Proxeed Plus formula — it adds Tricar (a patented blend of three forms of carnitine) to further support sperm energy metabolism, plus L-Arginine, Vitamin D, and Vitamin E to support blood flow and antioxidant protection.",
          },
          {
            question: "Who should take Proxeed Men?",
            answer:
              "Men looking to optimize sperm health, those experiencing fertility problems, those recovering after varicocele repair, those preparing for assisted reproductive techniques, or those with a poor diet and unhealthy lifestyle.",
          },
          {
            question: "How long will I need to take Proxeed Men?",
            answer:
              "You should take Proxeed Men for 4-6 months or for as long as you are trying to conceive. This is because sperm require approximately 90 days to mature.",
          },
          {
            question: "What if I forget to take it for several days?",
            answer: "Simply resume taking it regularly.",
          },
          {
            question: "Can I take it when preparing for assisted reproduction?",
            answer: "Yes, it can be taken, but consulting with a doctor before starting any supplements is recommended.",
          },
          { question: "Is Proxeed Men halal?", answer: "Yes, it is halal-certified." },
        ],
      },
    },
  },
  {
    id: "prod_proxeed-women",
    slug: "proxeed-women",
    image: "/products/proxeed-women-hero.webp",
    gallery: ["/products/proxeed-women.jpg", "/products/proxeed-women-3.jpg"],
    name: "Proxeed Women",
    nameArabic: "بروكسيد نساء",
    categorySlug: "supplements",
    status: "active",
    shortDescription:
      "تركيبة غذائية مدعومة بأبحاث منشورة في حالتين محددتين: استعادة التوازن الأيضي وانتظام الدورة الشهرية لدى مريضات تكيّس المبايض المصاحب بمقاومة الإنسولين، ودعم التعافي الهرموني في حالات انقطاع الدورة الشهرية المرتبط بالإجهاد.",
    keyBenefits: [
      "في دراسة استمرت 24 أسبوعًا على سيدات مصابات بتكيّس المبايض مع مقاومة الإنسولين، لوحظ تحسّن ملحوظ في مستويات الإنسولين والكوليسترول وانتظام الدورة الشهرية.",
      "لدى السيدات اللاتي توقفت الدورة الشهرية بسبب الإجهاد أو الإفراط في التمرين، أظهرت الأبحاث المنشورة أن هذا المزيج يساعد على تنظيم الهرمونات المسؤولة عن التبويض.",
      "خيار غذائي جيد التحمّل وغير هرموني.",
    ],
    composition: [
      { label: "L-Carnitine", value: "500 mg" },
      { label: "Acetyl-L-Carnitine", value: "250 mg" },
      { label: "L-Arginine", value: "500 mg" },
      { label: "N-Acetyl Cysteine", value: "50 mg" },
      { label: "حديد", value: "7 mg" },
      { label: "زنك", value: "5 mg" },
      { label: "بيتا كاروتين", value: "4.8 mg" },
      { label: "فيتامين C", value: "90 mg" },
      { label: "فيتامين E", value: "30 mg" },
      { label: "فيتامين B5", value: "6 mg" },
      { label: "فيتامين B6", value: "2 mg" },
      { label: "حمض الفوليك", value: "200 µg" },
      { label: "نحاس", value: "0.5 mg" },
      { label: "سيلينيوم", value: "27.5 µg" },
      { label: "فيتامين D3", value: "5 µg" },
      { label: "فيتامين B12", value: "2.5 µg" },
    ],
    compositionNote: "16 مكوّنًا — بحسب نشرة أطباء Alfasigma الرسمية لتشكيلة Proxeed",
    usage:
      "يُذاب كيس واحد يوميًا في حوالي 120 مل ماء أو عصير برتقال، في نفس الموعد يوميًا مع الإفطار أو الغداء، لمدة 4 إلى 6 أشهر أو طوال فترة محاولة الحمل — إذ تحتاج البويضات حوالي 4 أشهر لتنضج.",
    sku: "PXD-WMN-001",
    availableForm: "أكياس بودرة بنكهة البرتقال، 30 كيس × 6 جم",
    downloadUrl: "/downloads/proxeed-women-leaflet.pdf",
    scientificInfo:
      "تركيبة Proxeed Women مدعومة بأدلة علمية مباشرة على المنتج نفسه، في حالتين محددتين مختلفتين. دراسة Genazzani (2020) المفتوحة (بدون مجموعة دواء وهمي) على مدار 24 أسبوعًا في حالات تكيّس المبايض المصاحب بمقاومة الإنسولين أظهرت تحسّنًا ملحوظًا في مستويات الإنسولين والدهون، مع انتظام الدورة الشهرية في نحو ثلاثة أرباع الحالات (34 من 45). دراسة Genazzani (2017) في حالات انقطاع الدورة الشهرية المرتبط بالإجهاد أظهرت تطبيع هرمون LH وانخفاض الكورتيزول. الأدلة المتاحة لا تغطي حالات تكيّس المبايض العامة أو غير المصحوبة بمقاومة الإنسولين.\n\nProxeed® Women هو مكمل خصوبة متخصص مصمم لتعزيز الصحة الإنجابية وزيادة فرص الحمل. يوفر هذا المكمل مزيجاً شاملاً من العناصر الغذائية الأساسية التي تدعم جوانب مختلفة من خصوبة النساء.\n\nمثبت سريرياً لتحسين جودة البويضات. يعمل على تحسين جودة البويضات والوظيفة التناسلية، وهو أمر حاسم للتخصيب الناجح. تم تصميم المكمل ليكون آمناً وفعالاً للنساء اللواتي يرغبن في تحسين خصوبتهن. إنه مفيد بشكل خاص لأولئك اللاتي يواجهن تحديات في الخصوبة أو يستعدن لتقنيات الإخصاب المساعدة مثل التلقيح الصناعي.\n\nلماذا Proxeed Women؟\n• تعزيز الخصوبة وزيادة فرص الحمل: تم تصميم Proxeed Women لتحسين الخصوبة وزيادة فرص الحمل من خلال توفير العناصر الغذائية الأساسية التي تدعم الصحة الإنجابية.\n• مزيج غذائي شامل: يحتوي على مزيج متوازن من الفيتامينات والمعادن والعناصر الغذائية الحيوية، بما في ذلك L-Carnitine وAcetyl L-Carnitine وL-Arginine وN-Acetyl Cysteine وB vitamins وحمض الفوليك، وهي ضرورية لخصوبة النساء.\n• دعم تطوير وجودة البويضات: تساعد المكونات في تطوير بويضات صحية، وتوفر لها الطاقة وتحميها من الإجهاد التأكسدي، مما يحافظ على جودتها.\n• تنظيم النشاط الهرموني والإباضة: تشجع العناصر الغذائية الرئيسية في Proxeed Women النشاط الهرموني الطبيعي وتدعم الإباضة المنتظمة، وهو أمر أساسي للتخصيب.\n• تعزيز الانقسام الخلوي الصحي والغرس: يدعم عملية التخصيب، والانقسام الخلوي الصحي، وغرس البويضة المخصبة، وهي خطوات حاسمة للحمل الناجح.\n• فعالية مثبتة سريرياً: مثبت سريرياً لتحسين جودة البويضات والوظيفة، مما يجعله خياراً موثوقاً للنساء اللاتي يسعين لتعزيز خصوبتهن.\n• آمن وفعال: مكمل بسيط وآمن يمكن تناوله على مدى فترة من أربعة إلى ستة أشهر لتحقيق أفضل النتائج.\n• تركيبة حاصلة على براءة اختراع: Proxeed Women هو مكمل خصوبة حاصل على براءة اختراع، مما يبرز تركيبته الفريدة والفعالة.\n• مناسب لمشاكل الخصوبة المختلفة: موصى به لجميع النساء الراغبات في تحسين خصوبتهن، سواءً اللاتي يواجهن مشاكل في الخصوبة أو يستعدن لتقنيات الإخصاب المساعدة مثل التلقيح الصناعي.",
    faq: [
      {
        question: "ما هو Proxeed Women؟",
        answer:
          "Proxeed Women هو تركيبة مثبتة سريرياً مصممة لتنظيم النشاط الهرموني ودعم الخصوبة والصحة الإنجابية لدى النساء. يحتوي على فيتامينات وعناصر غذائية أساسية مثل حمض الفوليك والبيتا كاروتين.",
      },
      {
        question: "من يجب أن تتناول Proxeed Women؟",
        answer:
          "يُنصح بها للسيدات الراغبات في تحسين الخصوبة، أو اللاتي يواجهن مشاكل في الخصوبة، أو لديهن عوامل خطر (مثل العمر فوق 35، تكيّس المبايض، بطانة الرحم المهاجرة)، أو المقبلات على تقنيات الإخصاب المساعد.",
      },
      {
        question: "كم عدد السعرات الحرارية في الكيس الواحد؟",
        answer: "يحتوي كل كيس على 16 سعرة حرارية.",
      },
      {
        question: "ماذا لو نسيت تناول الجرعة لعدة أيام؟",
        answer: "استأنفي التناول بانتظام كالمعتاد.",
      },
      {
        question: "هل يمكن تناوله أثناء التحضير لتقنيات الإخصاب المساعد؟",
        answer: "نعم، يمكن تناوله، لكن يُنصح باستشارة الطبيب قبل البدء في أي مكمل غذائي.",
      },
      {
        question: "هل المنتج حلال؟",
        answer: "نعم، حاصل على شهادة حلال.",
      },
    ],
    testimonials: [
      {
        quote:
          "لم أكن أعلم أن التمرين المفرط يمكن أن يؤثر على الدورة الشهرية للمرأة. كنت بصحة جيدة، لائقة بدنيًا، أتناول الطعام الصحي ولا أدخن، فكيف لم أتمكن من الحمل؟ كنا نحاول الحصول على طفل لأكثر من عام عندما قررنا استشارة طبيب مختص. اكتشفت أنني لم أكن أُبَيِّض بانتظام وأن سني قد يكون عاملًا أيضًا. قال لي الطبيب أن أُقلل من ممارسة الرياضة وأخذ Proxeed Women لإعطاء بويضاتي دفعة. بعد ستة أشهر حملت وأنجبت الآن فتاة جميلة.",
        author: "هانا، 35 عامًا",
      },
      {
        quote:
          "كان لدي بالفعل طفل من علاقة سابقة، لذا عندما قرر زوجي وأنا أننا نريد أن نجب طفلًا معًا، كنت أعتقد أن الأمر سيحدث بسرعة كبيرة. ما لم أضعه في الاعتبار هو سني. عندما بدأت في تناول Proxeed Women، كنت في الـ38 من عمري، وكنت أعتقد أن الوقت قد فات. بعد سبعة أشهر اكتشفت أنني حامل والآن لدينا فتاة صحية. شكرًا لمساعدتنا في إكمال عائلتنا.",
        author: "جو، 39 عامًا",
      },
    ],
    clinicalReferences: [
        {
          title:
            "Synergistic effects of the integrative administration of acetyl-L-carnitine, L-carnitine, L-arginine and N-acetyl-cysteine on metabolic dynamics and on hepatic insulin extraction in overweight/obese patients with PCOS",
          authors: "Genazzani AD et al., Gynecol Reprod Endocrinol Metab",
          year: "2020",
          url: "https://gremjournal.com/wp-content/uploads/2020/02/GREM-journal_1-2020-GENAZZANI-AD.pdf",
        },
        {
          title:
            "Role of L-carnitine in Female Infertility",
          authors: "Agarwal et al.",
          year: "2018",
          url: "https://doi.org/10.1186/s12958-018-0323-4",
        },
        {
          title:
            "Modulatory effects of L-carnitine plus L-acetyl-carnitine on neuroendocrine control of hypothalamic functions in functional hypothalamic amenorrhea (FHA)",
          authors: "Genazzani AD et al., Gynecol Endocrinol",
          year: "2017",
          url: "https://doi.org/10.1080/09513590.2017.1332587",
        },
        {
          title:
            "Acylcarnitine esters profiling of serum and follicular fluid in patients undergoing in vitro fertilization",
          authors: "Várnagy et al., Reprod Biol Endocrinol",
          year: "2013",
          url: "https://doi.org/10.1186/1477-7827-11-67",
        },
        {
          title:
            "Acetyl-L-carnitine (ALC) administration positively affects reproductive axis in hypogonadotropic women with functional hypothalamic amenorrhea",
          authors: "Genazzani AD et al., J Endocrinol Invest",
          year: "2011",
          url: "https://doi.org/10.1007/BF03347087",
        },
        {
          title:
            "L-carnitine supplementation reduces oocyte cytoskeleton damage and embryo apoptosis induced by incubation in peritoneal fluid from patients with endometriosis",
          authors: "Mansour et al., Fertil Steril",
          year: "2009",
          url: "https://doi.org/10.1016/j.fertnstert.2008.02.097",
          note: "دراسة معملية على أجنة فئران — ليست دراسة بشرية.",
        },
        {
          title:
            "The importance of folate, zinc and anti-oxidants in the pathogenesis and prevention of subfertility",
          authors: "Ebisch IM et al., Hum Reprod Update",
          year: "2007",
          url: "https://doi.org/10.1093/humupd/dml054",
        },
    ],
    price: 2550,
    currency: "ج.م",
    translations: {
      en: {
        shortDescription:
          "A food formula backed by published research in two specific conditions: restoring metabolic balance and menstrual regularity in PCOS patients with insulin resistance, and supporting hormonal recovery in stress-related amenorrhea.",
        keyBenefits: [
          "In a 24-week study on women with PCOS and insulin resistance, a marked improvement was observed in insulin levels, cholesterol, and menstrual regularity.",
          "In women whose periods stopped due to stress or excessive exercise, published research shows this blend helps regulate the hormones responsible for ovulation.",
          "A well-tolerated, non-hormonal nutritional option.",
        ],
        composition: [
          { label: "L-Carnitine", value: "500 mg" },
          { label: "Acetyl-L-Carnitine", value: "250 mg" },
          { label: "L-Arginine", value: "500 mg" },
          { label: "N-Acetyl Cysteine", value: "50 mg" },
          { label: "Iron", value: "7 mg" },
          { label: "Zinc", value: "5 mg" },
          { label: "Beta-carotene", value: "4.8 mg" },
          { label: "Vitamin C", value: "90 mg" },
          { label: "Vitamin E", value: "30 mg" },
          { label: "Vitamin B5", value: "6 mg" },
          { label: "Vitamin B6", value: "2 mg" },
          { label: "Folic acid", value: "200 µg" },
          { label: "Copper", value: "0.5 mg" },
          { label: "Selenium", value: "27.5 µg" },
          { label: "Vitamin D3", value: "5 µg" },
          { label: "Vitamin B12", value: "2.5 µg" },
        ],
        compositionNote: "16 ingredients — per Alfasigma's official Proxeed line doctors' leaflet",
        usage:
          "Dissolve one sachet daily in about 120ml of water or orange juice, at the same time each day with breakfast or lunch, for 4–6 months or as long as you're trying to conceive — oocytes take about 4 months to mature.",
        availableForm: "Orange-flavored powder sachets, 30 sachets × 6 g",
        scientificInfo:
          "Proxeed Women's formula is backed by direct clinical evidence on the product itself, across two distinct, specific conditions. An open-label (no placebo group) 24-week Genazzani (2020) study in hyperinsulinemic PCOS showed significant improvements in insulin and lipid levels, with cycle restoration in roughly three-quarters of cases (34 of 45). A Genazzani (2017) study in stress-related functional hypothalamic amenorrhea showed normalized LH and reduced cortisol. The available evidence does not extend to general or normoinsulinemic PCOS.\n\nProxeed Women is a specialized fertility supplement formulated to enhance reproductive health and increase the chances of pregnancy. This supplement provides a comprehensive blend of essential nutrients that support various aspects of female fertility. Clinically proven to improve egg quality by enhancing egg quality and reproductive function, which is critical for successful conception. The supplement is designed to be safe and effective for women looking to optimize their fertility. It is particularly beneficial for those experiencing fertility challenges or preparing for assisted reproductive technologies like IVF.\n\nWhy Proxeed Women?\n• Enhances Fertility and Increases Pregnancy Chances: Proxeed Women is designed to improve fertility and boost the chances of pregnancy by providing essential nutrients that support reproductive health.\n• Comprehensive Nutrient Blend: Contains a balanced mix of vitamins, minerals, and other vital nutrients, including L-Carnitine, Acetyl L-Carnitine, L-Arginine, N-Acetyl Cysteine, B vitamins, and folic acid, which are crucial for female fertility.\n• Supports Egg Development and Quality: The ingredients help in the development of healthy eggs, providing them with energy and protecting them from oxidative stress, thereby maintaining their quality.\n• Regulates Hormonal Activity and Ovulation: Key nutrients in Proxeed Women encourage normal hormonal activity and support regular ovulation, which is essential for conception.\n• Promotes Healthy Cell Division and Implantation: Supports the fertilization process, healthy cell division, and the implantation of the fertilized egg, critical steps for a successful pregnancy.\n• Clinically Proven Efficacy: Clinically proven to improve egg quality and function, making it a reliable choice for women looking to enhance their fertility.\n• Safe and Effective: A simple and safe supplement that can be taken over a four to six-month period for optimal results.\n• Patented Formula: Proxeed Women is a patented fertility supplement, highlighting its unique and effective formulation.\n• Suitable for Various Fertility Challenges: Recommended for all women aiming to optimize their fertility, whether experiencing fertility problems or preparing for assisted reproduction techniques like IVF.",
        faq: [
          {
            question: "What is Proxeed Women?",
            answer:
              "Proxeed Women is a clinically proven formulation designed to regulate hormonal activity and support healthy fertility and reproduction in women. It contains essential vitamins and nutrients like folic acid and betacarotene.",
          },
          {
            question: "Who should take Proxeed Women?",
            answer:
              "Recommended for women who want to optimize fertility, are experiencing fertility problems, have risk factors (e.g. age over 35, PCOS, endometriosis), or are preparing for assisted reproduction.",
          },
          { question: "How many calories are in one sachet?", answer: "Each sachet contains 16 kcal." },
          {
            question: "What if I forget to take it for several days?",
            answer: "Simply resume regular intake.",
          },
          {
            question: "Can I take it when preparing for assisted reproduction?",
            answer: "Yes, but consulting a doctor before taking any supplement is recommended.",
          },
          { question: "Is Proxeed Women halal?", answer: "Yes, it is halal-certified." },
        ],
        testimonials: [
          {
            quote:
              "I didn't know that too much exercise can affect a woman's monthly cycle. I was healthy, fit, ate the right foods and didn't smoke, so why couldn't I get pregnant? We had been trying for a baby for over a year when we decided to seek expert medical advice. I found out that I wasn't ovulating regularly and that my age could also be a factor. The doctor told me to reduce my exercise regime and take Proxeed Women to give my eggs a boost. Six months later I got pregnant and now have a beautiful baby girl.",
            author: "Hannah, 35",
          },
          {
            quote:
              "I already had a child from a previous relationship, so when my husband and I decided that we wanted to have a baby together, I thought it would happen really quickly. What I hadn't factored in was my age. By the time I started taking Proxeed Women, I was 38, and thought I might have missed the boat. Seven months later I discovered I was pregnant and we now have a healthy baby girl. Thank you for helping us to complete our family.",
            author: "Jo, 39",
          },
        ],
        clinicalReferences: [
            {
              title:
                "Synergistic effects of the integrative administration of acetyl-L-carnitine, L-carnitine, L-arginine and N-acetyl-cysteine on metabolic dynamics and on hepatic insulin extraction in overweight/obese patients with PCOS",
              authors: "Genazzani AD et al., Gynecol Reprod Endocrinol Metab",
              year: "2020",
              url: "https://gremjournal.com/wp-content/uploads/2020/02/GREM-journal_1-2020-GENAZZANI-AD.pdf",
            },
            {
              title:
                "Role of L-carnitine in Female Infertility",
              authors: "Agarwal et al.",
              year: "2018",
              url: "https://doi.org/10.1186/s12958-018-0323-4",
            },
            {
              title:
                "Modulatory effects of L-carnitine plus L-acetyl-carnitine on neuroendocrine control of hypothalamic functions in functional hypothalamic amenorrhea (FHA)",
              authors: "Genazzani AD et al., Gynecol Endocrinol",
              year: "2017",
              url: "https://doi.org/10.1080/09513590.2017.1332587",
            },
            {
              title:
                "Acylcarnitine esters profiling of serum and follicular fluid in patients undergoing in vitro fertilization",
              authors: "Várnagy et al., Reprod Biol Endocrinol",
              year: "2013",
              url: "https://doi.org/10.1186/1477-7827-11-67",
            },
            {
              title:
                "Acetyl-L-carnitine (ALC) administration positively affects reproductive axis in hypogonadotropic women with functional hypothalamic amenorrhea",
              authors: "Genazzani AD et al., J Endocrinol Invest",
              year: "2011",
              url: "https://doi.org/10.1007/BF03347087",
            },
            {
              title:
                "L-carnitine supplementation reduces oocyte cytoskeleton damage and embryo apoptosis induced by incubation in peritoneal fluid from patients with endometriosis",
              authors: "Mansour et al., Fertil Steril",
              year: "2009",
              url: "https://doi.org/10.1016/j.fertnstert.2008.02.097",
              note: "Preclinical study on mouse embryos — not a human trial.",
            },
            {
              title:
                "The importance of folate, zinc and anti-oxidants in the pathogenesis and prevention of subfertility",
              authors: "Ebisch IM et al., Hum Reprod Update",
              year: "2007",
              url: "https://doi.org/10.1093/humupd/dml054",
            },
        ],
      },
    },
  },
  {
    id: "prod_proxeed-women-inositol",
    slug: "proxeed-women-inositol",
    image: "/products/proxeed-women-inositol.jpg",
    name: "Proxeed Women Inositol",
    nameArabic: "بروكسيد نساء إينوزيتول",
    categorySlug: "supplements",
    status: "launching_soon",
    shortDescription:
      "يضيف Myo-Inositol — المكوّن الأكثر ارتباطًا في الأبحاث المنشورة بجودة البويضات لدى مريضات تكيّس المبايض — إلى تركيبة Proxeed Women، للسيدات المقبلات على أطفال الأنابيب.",
    keyBenefits: [
      "تحليل شامل لعام 2025 على 11 دراسة وجد أن Myo-Inositol يحسّن بشكل ملحوظ نسبة نضج البويضات ونسبة نجاح الإخصاب لدى مريضات تكيّس المبايض في رحلة أطفال الأنابيب.",
      "يجمع بين Myo-Inositol ومزيج الكارنيتين والأرجينين و NAC المدروس بالفعل في Proxeed Women.",
    ],
    composition: [
      { label: "التركيبة الأساسية", value: "نفس مكوّنات Proxeed Women" },
      { label: "Myo-Inositol", value: "الكمية الدقيقة لكل كيس غير مؤكدة بعد" },
    ],
    sku: "PXD-WIN-001",
    availableForm: "أكياس بودرة (تفاصيل التعبئة النهائية قيد الاعتماد)",
    downloadUrl: "/downloads/proxeed-women-inositol-leaflet.pdf",
    scientificInfo:
      "الدليل العلمي هنا على مستوى المكوّن الرئيسي (Myo-Inositol) وليس على المنتج المخصوص نفسه. تحليل تلوي شامل لعام 2025 (11 دراسة، 981 مشاركة) وجد تحسّنًا ملحوظًا في نسبة نضج البويضات ونسبة نجاح الإخصاب لدى مريضات تكيّس المبايض في سياق أطفال الأنابيب. لم يظهر الدليل نفعًا لدى الحالات ضعيفة الاستجابة المبيضية. العلاقة بين جرعة الكيس الواحد والجرعة السريرية المدروسة غير مؤكدة بعد — لا يُطرح أي ادعاء متعلق بالجرعة قبل التأكد منه.",
    faq: [
      {
        question: "كم عدد السعرات الحرارية في الكيس الواحد؟",
        answer: "يحتوي كل كيس على 12 سعرة حرارية.",
      },
      {
        question: "من يجب أن تتناول Proxeed Women Inositol؟",
        answer:
          "يُنصح بها للسيدات الراغبات في تحسين الخصوبة، أو اللاتي يواجهن مشاكل في الخصوبة، أو لديهن عوامل خطر (مثل العمر فوق 35، تكيّس المبايض، بطانة الرحم المهاجرة)، أو المقبلات على أطفال الأنابيب.",
      },
      {
        question: "هل المنتج حلال؟",
        answer: "نعم، حاصل على شهادة حلال.",
      },
    ],
    clinicalReferences: [
        {
          title:
            "Effect of myo-inositol supplementation in mixed ovarian response IVF cohort: a systematic review and meta-analysis",
          authors: "Zhang J et al., Front Endocrinol",
          year: "2025",
          url: "https://doi.org/10.3389/fendo.2025.1520362",
        },
    ],
    translations: {
      en: {
        shortDescription:
          "Adds Myo-Inositol — the ingredient most strongly linked in published research to egg quality in PCOS patients — to the Proxeed Women formula, for women preparing for IVF.",
        keyBenefits: [
          "A comprehensive 2025 analysis of 11 studies found that Myo-Inositol significantly improves oocyte maturation rates and fertilization success rates in PCOS patients undergoing IVF.",
          "Combines Myo-Inositol with the carnitine, arginine, and NAC blend already studied in Proxeed Women.",
        ],
        composition: [
          { label: "Base formula", value: "Same ingredients as Proxeed Women" },
          { label: "Myo-Inositol", value: "Exact amount per sachet not yet confirmed" },
        ],
        availableForm: "Powder sachets (final packaging details pending approval)",
        scientificInfo:
          "The scientific evidence here is at the ingredient level (Myo-Inositol), not from a trial of this specific product. A comprehensive 2025 meta-analysis (11 trials, 981 participants) found a significant improvement in mature-oocyte rate and fertilization success in PCOS patients undergoing IVF. The evidence showed no benefit in poor ovarian responders. The relationship between the per-sachet dose and the clinically studied dose is not yet confirmed — no dosing-based claim is made until this is verified.\n\nProxeed Women Inositol is a specialized fertility supplement formulated to enhance reproductive health and increase the chances of pregnancy. This supplement provides a comprehensive blend of essential nutrients that support various aspects of female fertility. Clinically proven to improve egg quality by enhancing egg quality and reproductive function, which is critical for successful conception. The supplement is designed to be safe and effective for women looking to optimize their fertility. It is particularly beneficial for those experiencing fertility challenges or preparing for assisted reproductive technologies like IVF.\n\nWhy Proxeed Women Inositol?\n• Comprehensive Nutrient Blend: Contains enhanced mix of vitamins, minerals, and other vital nutrients, including L-Carnitine, Acetyl L-Carnitine, Myoinositol, Methylfolate, N-Acetyl Cysteine, B vitamins, and antioxidants, which are crucial for female fertility.\n• Supports Egg Development and Quality: The ingredients help in the development of healthy eggs, providing them with energy and protecting them from oxidative stress, thereby maintaining their quality.\n• Regulates Hormonal Activity and Ovulation: Key nutrients in Proxeed Women Inositol encourage normal hormonal activity and support regular ovulation, which is essential for conception.\n• Promotes Healthy Cell Division and Implantation: Supports the fertilization process, healthy cell division, and the implantation of the fertilized egg, critical steps for a successful pregnancy.\n• Clinically Proven Efficacy: Clinically proven to improve egg quality and function, making it a reliable choice for women looking to enhance their fertility.\n• Safe and Effective: A simple and safe supplement that can be taken over a four to six-month period for optimal results.\n• Patented Formula: Proxeed Women Inositol is a patented fertility supplement, highlighting its unique and effective formulation.\n• Suitable for Various Fertility Challenges: Recommended for all women aiming to optimize their fertility, whether experiencing fertility problems or preparing for assisted reproduction techniques like IVF.",
        faq: [
          {
            question: "What is Proxeed Women Inositol?",
            answer:
              "Proxeed Women Inositol is a clinically proven formulation designed to regulate hormonal activity and support healthy fertility and reproduction in women. It contains essential vitamins and nutrients like myoinositol and methylfolate.",
          },
          {
            question: "Who should take Proxeed Women Inositol?",
            answer:
              "Recommended for women who want to optimize fertility, are experiencing fertility problems, have risk factors (e.g. age over 35, PCOS, endometriosis), or are preparing for IVF.",
          },
          {
            question: "How should I take Proxeed Women Inositol?",
            answer:
              "Take one sachet daily, mixed with 120ml of water or orange juice. It is suggested to take it at the same time every day with breakfast or lunch.",
          },
          {
            question: "How long should I take Proxeed Women Inositol?",
            answer:
              "Recommended for 4-6 months or as long as you are trying to conceive, as it takes around 4 months for oocytes to mature. Results may vary depending on individual circumstances.",
          },
          {
            question: "What if I forget to take it for several days?",
            answer: "If you forget, resume regular intake.",
          },
          {
            question: "Can I take it when preparing for assisted reproduction?",
            answer: "Yes, it can be taken, but consulting with a doctor before taking any supplements is recommended.",
          },
          { question: "How many calories are in one sachet?", answer: "Each sachet contains 12 kcal." },
          { question: "Is Proxeed Women Inositol halal?", answer: "Yes, it is halal-certified." },
        ],
        clinicalReferences: [
            {
              title:
                "Effect of myo-inositol supplementation in mixed ovarian response IVF cohort: a systematic review and meta-analysis",
              authors: "Zhang J et al., Front Endocrinol",
              year: "2025",
              url: "https://doi.org/10.3389/fendo.2025.1520362",
            },
        ],
      },
    },
  },
  {
    id: "prod_proxerex",
    slug: "proxerex",
    image: "/products/proxerex-hero.webp",
    gallery: ["/products/proxerex.jpg"],
    name: "Proxerex",
    nameArabic: "بروكس إيركس",
    categorySlug: "supplements",
    status: "active",
    shortDescription:
      "يجمع مكوّنات دُرست كل منها على حدة لدعم الأداء الجنسي للرجال وصحة الأوعية الدموية — تركيبة للعافية العامة، وليست بديلاً لعلاج ضعف الانتصاب.",
    keyBenefits: [
      "يحتوي على النياسين، الذي أظهرت دراسة مقارنة بدواء وهمي تحسّنًا في وظيفة الانتصاب لدى الرجال الذين يعانون من ضعف انتصاب متوسط إلى شديد مصاحب لارتفاع دهون الدم.",
      "مستخلص الماكا، مدروس لتأثيره على الرغبة الجنسية بشكل مستقل عن مستوى هرمون التستوستيرون.",
      "مستخلص الكاكاو، مدروس لدوره في تدفق الدم الصحي ووظيفة الأوعية الدموية.",
    ],
    composition: [
      { label: "L-Arginine", value: "2,500 mg" },
      { label: "Propionyl-L-Carnitine", value: "250 mg" },
      { label: "مستخلص الكاكاو", value: "200 mg" },
      { label: "مستخلص الماكا", value: "150 mg" },
      { label: "Acetyl-L-Carnitine", value: "125 mg" },
      { label: "زنك", value: "10 mg" },
      { label: "Nicotinic acid (النياسين)", value: "8 mg" },
      { label: "سيلينيوم", value: "50 µg" },
    ],
    compositionNote: "بحسب نشرة أطباء Alfasigma الرسمية لمنتج Proxerex",
    usage:
      "يُذاب كيس واحد يوميًا، يُفضّل مع الوجبة، في حوالي 120 مل عصير أو ماء بارد، يُحرّك جيدًا ويُشرب فورًا. لمدة 2 إلى 4 أشهر، قابلة للتكرار على مدار العام.",
    sku: "PXR-001",
    availableForm: "أكياس بودرة بنكهة البرتقال، 30 كيس × 6 جم",
    scientificInfo:
      "الدليل العلمي لتركيبة Proxerex على مستوى المكوّنات المفردة، وهو دليل متواضع نسبيًا. النياسين مدروس في دراسة سريرية حقيقية مقارنة بدواء وهمي، لكن في حالات ضعف الانتصاب المتوسط إلى الشديد تحديدًا. مستخلص الماكا مدروس بتأثير متواضع على الرغبة الجنسية، بشكل مستقل عن مستوى هرمون التستوستيرون. لا يوجد دليل على أن المنتج يرفع مستوى التستوستيرون، ولا يُطرح أي ادعاء من هذا النوع.",
    faq: [
      {
        question: "كم عدد السعرات الحرارية في الكيس الواحد؟",
        answer: "يحتوي كل كيس على 19 سعرة حرارية.",
      },
      {
        question: "لمن يُنصح باستخدام Proxerex؟",
        answer: "لجميع الرجال الراغبين في تحسين صحتهم الجنسية، وخصوصًا من يعانون من ضعف الانتصاب أو انخفاض الرغبة الجنسية.",
      },
      {
        question: "ماذا لو فاتتني جرعة؟",
        answer: "استأنف التناول بانتظام كالمعتاد دون مضاعفة الجرعة التالية.",
      },
      {
        question: "هل يوجد آثار جانبية؟",
        answer: "المنتج جيد التحمّل بشكل عام. في حال ظهور أي أعراض جانبية أو تحسسية، أوقف الاستخدام واستشر الطبيب.",
      },
      {
        question: "هل هو آمن مع أدوية أخرى؟",
        answer: "مكمل غذائي وعادة آمن مع أدوية أخرى، لكن يُنصح باستشارة الطبيب إذا كنت تتناول أدوية أو لديك حالة صحية مزمنة.",
      },
    ],
    price: 1790,
    currency: "ج.م",
    clinicalReferences: [
        {
          title:
            "Effect of niacin on erectile function in men suffering erectile dysfunction and dyslipidemia",
          authors: "Ng CF et al., J Sex Med",
          year: "2011",
          url: "https://doi.org/10.1111/j.1743-6109.2011.02414.x",
        },
    ],
    translations: {
      en: {
        shortDescription:
          "Combines ingredients individually studied to support men's sexual performance and vascular health — a general-wellness formula, not a substitute for erectile dysfunction treatment.",
        keyBenefits: [
          "Contains niacin, which a placebo-controlled study showed improved erectile function in men with moderate-to-severe erectile dysfunction who also had high blood lipids.",
          "Maca extract, studied for its effect on sexual desire independent of testosterone level.",
          "Cocoa extract, studied for its role in healthy blood flow and vascular function.",
        ],
        composition: [
          { label: "L-Arginine", value: "2,500 mg" },
          { label: "Propionyl-L-Carnitine", value: "250 mg" },
          { label: "Cocoa extract", value: "200 mg" },
          { label: "Maca extract", value: "150 mg" },
          { label: "Acetyl-L-Carnitine", value: "125 mg" },
          { label: "Zinc", value: "10 mg" },
          { label: "Nicotinic acid (Niacin)", value: "8 mg" },
          { label: "Selenium", value: "50 µg" },
        ],
        compositionNote: "Per Alfasigma's official doctors' leaflet for Proxerex",
        usage:
          "Dissolve one sachet daily, preferably with a meal, in about 120ml of juice or cold water, stir well and drink immediately. Take in 2–4 month cycles, repeatable through the year.",
        availableForm: "Orange-flavored powder sachets, 30 sachets × 6 g",
        scientificInfo:
          "The scientific evidence for Proxerex's formula is at the individual-ingredient level, and is relatively modest. Niacin is studied in a real placebo-controlled clinical trial, but specifically in moderate-to-severe erectile dysfunction. Maca extract is studied for a modest effect on sexual desire, independent of testosterone level. There is no evidence that the product raises testosterone levels, and no such claim is made.\n\nProxerex is a specialized supplement formulated to enhance male reproductive health and increase the chances of sexual well-being. This supplement provides a comprehensive blend of essential nutrients that support various aspects of male sexual function.\n\nClinically proven to improve erectile function. By enhancing blood flow and supporting hormonal balance, Proxerex is clinically proven to improve erectile function, which is critical for maintaining a healthy sex life.\n\nThe supplement is designed to be safe and effective for men looking to optimize their sexual health. It is particularly beneficial for those experiencing sexual health challenges or preparing for any related health regimen.\n\nWhy Proxerex?\n• Enhances Erectile Function: Proxerex supports normal erectile function by improving blood flow and nerve function.\n• Supports Sexual Desire: It aids in boosting sexual drive and overall libido, addressing issues related to low sexual desire.\n• Contains Key Nutrients: The formulation includes L-Arginine, Propionyl-L-Carnitine, Acetyl-L-Carnitine, Zinc, Selenium, Cocoa Flavanols, and Maca Extract, all known for their benefits in sexual health.\n• Improves Blood Flow: L-Arginine and other components enhance nitric oxide production, leading to better blood circulation to the penis.\n• Boosts Energy Levels: Ingredients like Propionyl-L-Carnitine and Acetyl-L-Carnitine provide energy, helping reduce fatigue and support overall vitality.\n• Supports Nerve Health: Acetyl-L-Carnitine contributes to maintaining healthy nerve function, crucial for sexual arousal and erection.\n• Provides Antioxidant Protection: Cocoa Flavanols and Selenium offer antioxidant benefits, protecting cells from oxidative stress.\n• Promotes Hormonal Balance: Zinc plays a role in maintaining hormonal balance, which is essential for normal sexual function.\n• Patented Formula: Proxerex features a unique, patented formulation, ensuring a well-researched and effective approach to supporting sexual health.",
        faq: [
          {
            question: "What is Proxerex?",
            answer:
              "Proxerex is a patented sexual health supplement designed for men to support healthy erectile function and sexual desire. It contains a blend of active ingredients aimed at enhancing sexual health and performance.",
          },
          {
            question: "What are the key ingredients in Proxerex?",
            answer:
              "Proxerex includes L-arginine, Propionyl-L-carnitine, Acetyl-L-carnitine, Nicotinic acid, Zinc, Selenium, Maca extract, and Cocoa flavanols. These ingredients work together to improve erectile function and overall sexual health.",
          },
          { question: "How many calories are in one sachet?", answer: "Each sachet contains 19 kcal." },
          {
            question: "Who should use Proxerex?",
            answer:
              "Suitable for all men looking to improve their sexual health, particularly those experiencing erectile dysfunction or reduced sexual desire.",
          },
          {
            question: "What if I miss a dose?",
            answer: "Resume taking it regularly as soon as you remember — no need to double up.",
          },
          {
            question: "Are there any side effects?",
            answer:
              "Generally well-tolerated. If you experience any adverse or allergic effects, discontinue use and consult a doctor.",
          },
          {
            question: "Is it safe to use with other medications?",
            answer:
              "As a dietary supplement it's usually safe alongside other medications, but consult your doctor if you're on medication or have an underlying health condition.",
          },
        ],
        clinicalReferences: [
            {
              title:
                "Effect of niacin on erectile function in men suffering erectile dysfunction and dyslipidemia",
              authors: "Ng CF et al., J Sex Med",
              year: "2011",
              url: "https://doi.org/10.1111/j.1743-6109.2011.02414.x",
            },
        ],
      },
    },
  },
  {
    id: "prod_ellamuselle",
    slug: "ellamuselle",
    image: "/products/ellamuselle-hero.webp",
    gallery: ["/products/ellamuselle.jpg"],
    name: "Ellamuselle",
    nameArabic: "إلاميوسيل",
    categorySlug: "supplements",
    status: "paused",
    shortDescription:
      "يجمع مكوّنات دُرست — كل على حدة وفي دراسة صغيرة واحدة مجتمعة — للرغبة الجنسية للسيدات وراحة سن اليأس، بتوقعات واقعية عن مجال بحثي ما زال في بداياته. المنتج متوقف مؤقتًا عن الطرح حاليًا.",
    keyBenefits: [
      "مزيج من Muira Puama و Ginkgo Biloba أظهر في دراسة منشورة تحسّنًا في الرغبة والرضا المُبلَّغ عنهما لدى السيدات — دراسة مفتوحة بدون مجموعة ضابطة بدواء وهمي.",
      "يحتوي على الجينستين، المدروس للمساعدة في تخفيف أعراض سن اليأس التي قد تؤثر على العلاقة الحميمة.",
    ],
    composition: [
      { label: "L-Arginine", value: "500 mg" },
      { label: "Propionyl-L-Carnitine", value: "250 mg" },
      { label: "Muira Puama", value: "250 mg" },
      { label: "Damiana (مستخلص Turnera Diffusa)", value: "250 mg" },
      { label: "Black Cohosh", value: "40 mg" },
      { label: "Ginkgo Biloba", value: "25 mg" },
      { label: "زنك", value: "10 mg" },
      { label: "فيتامين B3 (النياسين)", value: "8 mg" },
      { label: "Genistein", value: "2.5 mg" },
    ],
    compositionNote: "9 مكوّنات كاملة — بحسب نشرة أطباء Alfasigma الرسمية",
    sku: "ELM-001",
    availableForm: "أكياس بودرة، 30 كيس بالعلبة",
    scientificInfo:
      "الدليل العلمي لتركيبة Ellamuselle هو الأضعف بين تشكيلة منتجاتنا، وواقعي في توقعاته عن مجال بحثي ما زال في بداياته. دراسة صغيرة واحدة فقط، غير مكررة ومن غير مجموعة ضابطة بدواء وهمي، بحثت مزيج Muira Puama وGinkgo Biloba، وأظهرت تحسّنًا في الرغبة والرضا المُبلَّغ عنهما لدى حوالي 65% من المشاركات. الجينستين مدروس بشكل غير مباشر لدعم أعراض سن اليأس فقط. المنتج متوقف مؤقتًا عن الطرح حاليًا.",
    faq: [
      {
        question: "هل المنتج مثبت سريريًا؟",
        answer:
          "لا توجد دراسات سريرية موسّعة موثّقة تؤكد الفعالية السريرية لـEllamuselle تحديدًا — يُطرح المنتج بناءً على الفوائد المعروفة لمكوّناته الفردية، وليس بناءً على تجربة سريرية على المنتج نفسه.",
      },
    ],
    price: 1200,
    currency: "ج.م",
    clinicalReferences: [
        {
          title:
            "Effects of Herbal vX on libido and sexual activity in premenopausal and postmenopausal women",
          authors: "Waynberg J, Brewer S, Adv Ther",
          year: "2000",
          url: "https://doi.org/10.1007/BF02853164",
          note: "دراسة مفتوحة بدون مجموعة ضابطة أو دواء وهمي (202 امرأة، شهر واحد).",
        },
    ],
    translations: {
      en: {
        shortDescription:
          "Combines ingredients studied — individually, and together in one small study — for women's sexual desire and menopause comfort, with realistic expectations about a research area still in its early stages. Currently paused from sale.",
        keyBenefits: [
          "A blend of Muira Puama and Ginkgo Biloba showed improved self-reported desire and satisfaction in women in a published open-label study that had no placebo control group.",
          "Contains genistein, studied to help ease menopause symptoms that can affect intimacy.",
        ],
        composition: [
          { label: "L-Arginine", value: "500 mg" },
          { label: "Propionyl-L-Carnitine", value: "250 mg" },
          { label: "Muira Puama", value: "250 mg" },
          { label: "Damiana (Turnera Diffusa extract)", value: "250 mg" },
          { label: "Black Cohosh", value: "40 mg" },
          { label: "Ginkgo Biloba", value: "25 mg" },
          { label: "Zinc", value: "10 mg" },
          { label: "Vitamin B3 (Niacin)", value: "8 mg" },
          { label: "Genistein", value: "2.5 mg" },
        ],
        compositionNote: "All 9 ingredients — per Alfasigma's official doctors' leaflet",
        availableForm: "Powder sachets, 30 sachets per box",
        scientificInfo:
          "The scientific evidence for Ellamuselle's formula is the thinnest in our range, and realistic in what it claims for a research area still in its early stages. Just one small, unreplicated, non-placebo-controlled study looked at the Muira Puama and Ginkgo Biloba combination, showing improved self-reported desire and satisfaction in roughly 65% of participants. Genistein is studied only indirectly, for menopausal-symptom support. The product is currently paused from sale.\n\nEllamuselle is a specialized supplement designed to enhance female sexual health by increasing energy levels, improving blood flow to the female genitals, regulating sex hormone levels, and supporting sexual satisfaction.\n\nScientifically Formulated Ingredients - The patented formula includes nine key compounds: L-arginine, L-carnitine, Muira puama, Damiana, Zinc, Black cohosh, Ginkgo biloba, and Vitamin B3. These ingredients play crucial roles in supporting physical and emotional responses related to maintaining normal sexual function and desire in women.\n\nThe individual ingredients in Ellamuselle, such as L-arginine, Muira puama, and Damiana, have been studied separately for their effects on sexual health and function. These components are known for their potential benefits in improving libido, enhancing sexual pleasure, and supporting overall sexual function.\n\nWhy Choose Ellamuselle?\n• Supports Hormonal Activity and Neurotransmitters: The ingredients help regulate hormonal activity and neurotransmitters in the brain, enhancing sexual function.\n• Increases Blood Flow to Genitals: Promotes better blood flow to the genitals, which enhances sexual response.\n• Provides Energy and Protects Cells from Oxidative Stress: Supplies energy to the body's cells and protects them from oxidative damage.\n• Boosts Overall Well-being: Increases energy levels and supports a general sense of well-being.\n• Safe and Effective: Recommended for use over a four to six-month period for optimal results.\n• Recommended for Various Sexual Health Needs: Suitable for all women who want to maintain sexual health, especially those experiencing low libido or sexual discomfort.",
        faq: [
          {
            question: "What is Ellamuselle?",
            answer:
              "Ellamuselle is a natural supplement formulated to support female sexual health. It is designed to enhance libido, hormonal balance, and overall sexual wellness for women.",
          },
          {
            question: "What are the key ingredients in Ellamuselle?",
            answer:
              "The supplement includes L-arginine, Muira puama, Damiana, and Vitamin B3 (Niacin). These ingredients are known for their roles in improving sexual function and enhancing pleasure.",
          },
          {
            question: "How does Ellamuselle support sexual health?",
            answer:
              "Ellamuselle supports sexual health by promoting increased blood flow, enhancing libido, and improving energy levels. The combination of its ingredients is aimed at improving overall sexual function.",
          },
          {
            question: "Is Ellamuselle clinically proven?",
            answer:
              "There are no substantial, well-documented clinical trials confirming Ellamuselle's own clinical efficacy — it's marketed based on the known benefits of its individual ingredients, not a trial of the product itself.",
          },
          {
            question: "Are there any known side effects of Ellamuselle?",
            answer:
              "As with any supplement, it's advisable to consult a healthcare provider before starting to ensure it is appropriate for your individual health needs.",
          },
        ],
        clinicalReferences: [
            {
              title:
                "Effects of Herbal vX on libido and sexual activity in premenopausal and postmenopausal women",
              authors: "Waynberg J, Brewer S, Adv Ther",
              year: "2000",
              url: "https://doi.org/10.1007/BF02853164",
              note: "Open-label study with no control or placebo group (202 women, one month).",
            },
        ],
      },
    },
  },
  {
    id: "prod_ca-mi-pulse-oximeter",
    slug: "ca-mi-pulse-oximeter",
    image: "/products/ca-mi-pulse-oximeter.jpg",
    gallery: [
      "/products/ca-mi-pulse-oximeter-2.jpg",
      "/products/ca-mi-pulse-oximeter-3.jpg",
      "/products/ca-mi-pulse-oximeter-4.jpg",
      "/products/ca-mi-pulse-oximeter-5.jpg",
      "/products/ca-mi-pulse-oximeter-6.jpg",
    ],
    name: "CA-MI Pulse Oximeter",
    nameArabic: "جهاز قياس تشبع الأكسجين CA-MI",
    categorySlug: "medical-devices",
    status: "active",
    shortDescription: "جهاز قياس تشبع الأكسجين في الدم ومعدل النبض، يُلبس على الإصبع — طراز O2-Easy من CA-MI الإيطالية.",
    keyBenefits: [
      "تشغيل بزر واحد وقراءة سريعة.",
      "إيقاف تلقائي لتوفير البطارية.",
      "عمر بطارية طويل نسبيًا (بطاريتان AAA).",
    ],
    composition: [
      { label: "نطاق قياس الأكسجين (SpO2)", value: "70–99%" },
      { label: "نطاق قياس النبض", value: "30–235 نبضة/دقيقة" },
      { label: "البطارية", value: "بطاريتان AAA، عمر تشغيل ~30 ساعة" },
      { label: "الوزن والحجم", value: "~50 جم، 5.8 × 3.2 × 3.4 سم" },
    ],
    sku: "CAMI-PO-001",
    availableForm: "جهاز قياس تشبع أكسجين طرفي (يُلبس على الإصبع)",
    price: 500,
    currency: "ج.م",
    translations: {
      en: {
        shortDescription:
          "A fingertip device measuring blood oxygen saturation and pulse rate — the O2-Easy model from CA-MI (Italy).",
        keyBenefits: [
          "Single-button operation with a fast reading.",
          "Auto shut-off to save battery.",
          "Relatively long battery life (2 x AAA batteries).",
        ],
        composition: [
          { label: "Oxygen (SpO2) measurement range", value: "70–99%" },
          { label: "Pulse measurement range", value: "30–235 bpm" },
          { label: "Battery", value: "2 x AAA batteries, ~30 hours of operation" },
          { label: "Weight & size", value: "~50 g, 5.8 × 3.2 × 3.4 cm" },
        ],
        availableForm: "Fingertip pulse oximeter",
      },
    },
  },
  {
    id: "prod_ca-mi-ir-thermometer",
    slug: "ca-mi-ir-thermometer",
    image: "/products/ca-mi-ir-thermometer.jpg",
    gallery: [
      "/products/ca-mi-ir-thermometer-2.jpg",
      "/products/ca-mi-ir-thermometer-3.jpg",
      "/products/ca-mi-ir-thermometer-4.jpg",
      "/products/ca-mi-ir-thermometer-5.jpg",
      "/products/ca-mi-ir-thermometer-6.jpg",
    ],
    name: "CA-MI IR Thermometer",
    nameArabic: "ميزان حرارة بالأشعة تحت الحمراء CA-MI",
    categorySlug: "medical-devices",
    status: "active",
    shortDescription: "ميزان حرارة بالأشعة تحت الحمراء بدون لمس، بوضعين للقياس (الجسم والأسطح) — طراز T-One من CA-MI الإيطالية.",
    keyBenefits: [
      "قياس بدون لمس على بُعد ~5 سم، خلال ~3 ثوانٍ.",
      "وضع مزدوج: قياس حرارة الجسم أو الأسطح/السوائل (مثل زجاجة الرضاعة).",
      "مؤشر حرارة ثلاثي الألوان (أخضر/أصفر/أحمر) مع تنبيه صوتي عند الحمى.",
      "يحفظ حتى 32 قراءة سابقة، ويدعم التبديل بين °C و °F.",
    ],
    composition: [
      { label: "مسافة القياس", value: "~5 سم" },
      { label: "زمن القراءة", value: "~3 ثوانٍ" },
      { label: "الذاكرة", value: "9–32 قراءة سابقة" },
      { label: "البطارية", value: "بطاريتان AAA" },
      { label: "الوزن والحجم", value: "75–128 جم، 14.6 × 3.8 × 5.4 سم" },
    ],
    sku: "CAMI-IRT-001",
    availableForm: "ميزان حرارة محمول بدون لمس",
    price: 750,
    currency: "ج.م",
    translations: {
      en: {
        shortDescription:
          "A non-contact infrared thermometer with two measurement modes (body and surfaces) — the T-One model from CA-MI (Italy).",
        keyBenefits: [
          "Non-contact measurement from ~5 cm away, in about 3 seconds.",
          "Dual mode: measures body temperature or surface/liquid temperature (like a baby bottle).",
          "Three-color temperature indicator (green/yellow/red) with an audible fever alert.",
          "Stores up to 32 previous readings, and supports switching between °C and °F.",
        ],
        composition: [
          { label: "Measurement distance", value: "~5 cm" },
          { label: "Reading time", value: "~3 seconds" },
          { label: "Memory", value: "9–32 previous readings" },
          { label: "Battery", value: "2 x AAA batteries" },
          { label: "Weight & size", value: "75–128 g, 14.6 × 3.8 × 5.4 cm" },
        ],
        availableForm: "Portable non-contact thermometer",
      },
    },
  },
]

export class MockProductRepository implements ProductRepository {
  async getAllProducts(): Promise<Product[]> {
    return PRODUCTS.map(product => ({ ...product, priceSource: "demo" as const }))
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const product = PRODUCTS.find((product) => product.slug === slug)
    return product ? { ...product, priceSource: "demo" } : null
  }

  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    return PRODUCTS.filter((product) => product.categorySlug === categorySlug).map(product => ({ ...product, priceSource: "demo" as const }))
  }

  async getAllCategories(): Promise<ProductCategory[]> {
    return CATEGORIES
  }

  async getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
    return CATEGORIES.find((category) => category.slug === slug) ?? null
  }
}
