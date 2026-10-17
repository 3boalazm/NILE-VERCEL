import type { Locale } from "@/lib/i18n/config"
import type { Article } from "./articles"

/**
 * Real editorial content — the "no fake blog" rule (CONTENT-PAGE-MAPPING §H)
 * is satisfied, not bypassed: every claim below is drawn from a 12-study
 * peer-reviewed evidence audit supplied by the client (2026-09-23), with the
 * audit's own honesty preserved — direct-vs-ingredient evidence is labelled
 * per product, intermediate endpoints are never sold as pregnancy outcomes,
 * and each article carries the sources it summarises plus a medical
 * disclaimer. Written natively per locale for the pre-purchase reader
 * (researching, comparing) — the Arabic is authored, not translated.
 */

const DISCLAIMER_AR =
  "المكملات الغذائية مش بديل عن العلاج الطبي ولا عن استشارة الطبيب المتابع لحالتك. المعلومات دي ملخصة من دراسات منشورة بهدف تساعدك تفهم الأدلة وتقارن قبل الشراء — وهي مش توصية علاجية. قرر مع طبيبك دايمًا، خصوصًا لو في حالة صحية أو أدوية بتتناها."
const DISCLAIMER_EN =
  "Dietary supplements are not a substitute for medical treatment or for your doctor's advice. This summary of published studies exists to help you understand the evidence and compare before buying — it is not medical advice. Always decide together with your physician, especially if you have a health condition or take medication."

const SRC_MICIC = {
  title: "Micic et al. (2019) — Double-blind RCT, L-carnitine + L-acetylcarnitine in idiopathic oligoasthenozoospermia — Andrologia",
  url: "https://doi.org/10.1111/and.13267",
  note: "دراسة معشّاة مزدوجة التعمية مقابل بلاسيبو — 175 مشاركًا",
}
const SRC_NOEGROHO = {
  title: "Noegroho, Siregar & Tampubolon (2022) — Antioxidant supplementation, sperm DNA fragmentation: systematic review & meta-analysis — Turkish Journal of Urology",
  url: "https://doi.org/10.5152/tud.2022.22058",
  note: "مراجعة منهجية وتحليل بَعدي لتسع دراسات مضادات أكسدة",
}
const SRC_OUMAIMA = {
  title: "Oumaima et al. (2025) — ICSI outcomes with/without L-carnitine, acetyl-L-carnitine & nutrients — Eastern Mediterranean Health Journal (WHO)",
  url: "https://www.e-mjm.org/2025/v80s5/PP-03.pdf",
  note: "مقارنة قبل/بعد على نفس المجموعة — بدون تعشية",
}
const SRC_AGARWAL_WOMEN = {
  title: "Agarwal, Virmani, Busetto et al. (2018) — Role of L-carnitine in female infertility — Reproductive Biology and Endocrinology",
  url: "https://doi.org/10.1186/s12958-018-0323-4",
  note: "مراجعة علمية شاملة لدور الكارنيتين في الجهاز التناسلي الأنثوي",
}
const SRC_LAGANA = {
  title: "Laganà et al. (2021) — Dietary supplements for female infertility: a critical review — Nutrients",
  url: "https://doi.org/10.3390/nu13103502",
  note: "مراجعة نقدية لدليل المكملات على مستوى المكونات",
}
const SRC_NMA_2026 = {
  title: "Pharmacologic and nutritional therapies in idiopathic male infertility: systematic review & network meta-analysis (2026)",
  url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13432660/",
  note: "تحليل شبكي بَعدي حديث لعلاجات العقم الرجالي غير المفسَّر",
}
const SRC_RBMO = {
  title: "Nutritional supplements and IVF: an evidence-based approach (2023) — Reproductive BioMedicine Online",
  url: "https://doi.org/10.1016/j.rbmo.2023.10.004",
  note: "مراجعة منهجية للمكملات في طب التناسل",
}
const SRC_ART_META_2026 = {
  title: "Dietary supplements and female infertility in ART: systematic review & meta-analysis (2026)",
  url: "https://pubmed.ncbi.nlm.nih.gov/42356328/",
  note: "خلصت لعدم وجود أدلة عالية اليقين لصالح المكملات عمومًا",
}
const SRC_Busetto = {
  title: "Busetto, Agarwal, Virmani et al. (2018) — Metabolic/antioxidant supplementation in OAT with and without varicocele: double-blind placebo-controlled RCT — Andrologia",
  url: "https://doi.org/10.1111/and.12927",
  note: "دراسة معشّاة مزدوجة التعمية — 104 مشاركًا",
}
const SRC_COCHRANE = {
  title: "Showell et al. (2022) — Antioxidants for male subfertility (Cochrane Review)",
  url: "https://doi.org/10.1002/14651858.CD007411.pub5",
  note: "61 تجربة معشّاة — المعيار الذهبي لتركيب الأدلة",
}
const SRC_INOSITOL_META = {
  title: "Myo-inositol and ART outcomes in PCOS: systematic review & meta-analysis of 17 studies (2025) — International Journal of Reproductive BioMedicine",
  url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12413536/",
  note: "تحليل بَعدي لدراسات التلقيح المساعد لدى متلازمة تكيّس المبايض",
}
const SRC_JCEM = {
  title: "Fitz-Henry et al. (2024) — Inositol for PCOS: systematic review & meta-analysis — Journal of Clinical Endocrinology & Metabolism",
  url: "https://doi.org/10.1210/clinem/dgae054",
  note: "المراجعة التي غذّت الإرشاد الدولي لمتلازمة تكيّس المبايض",
}

export const REAL_ARTICLES: Article[] = [
  // ────────────────────────────────────────────────────────── overview guide
  {
    slug: "fertility-supplements-evidence-guide",
    locale: "ar" as Locale,
    title: "قبل ما تشتري مكمل خصوبة: إزاي تقرأ الدليل العلمي وتقارن صح",
    excerpt:
      "دليل عملي لللي بيدوّر وبيقارن: مستويات الأدلة، الفرق بين دراسة المنتج ودراسة المكونات، الأسئلة اللي تسألها قبل الشراء، وعلامات التسويق اللي تستوقفك.",
    sections: [
      {
        id: "why-this-guide",
        heading: "ليه الدليل ده اتكتب أصلًا",
        paragraphs: [
          "سوق مكملات الخصوبة مليان وعود كبيرة، والأبحاث الحقيقية موزعة بشكل مش عادل بين المنتجات: في منتجات عليها دراسات معشّاة مباشرة، ومنتجات دليلها كله مُستنتَج من مكوناتها، ومنتجات مالهاش أي دراسات على تركيبتها نفسها. الفرق ده بالظبط هو أول حاجة المفروض تعرفها قبل ما تدفع.",
          "الدليل ده بيلخص لك — بلغة مباشرة — إزاي تفرّق بين مستويات الأدلة، وتسأل الأسئلة الصح، وتقارن بين المنتجات على أساس العلم مش على أساس الإعلانات. ولو عايز تفاصيل أي منتج بالذات، لكل منتج عندنا مقالة مستقلة بمراجعه كاملة.",
        ],
      },
      {
        id: "evidence-levels",
        heading: "مستويات الأدلة: مين اللي بيقول إيه",
        paragraphs: [
          "مش كل دراسة بنفس الوزن. تجربة معشّاة مزدوجة التعمية مقابل بلاسيبو هي أقوى شكل فردي للأدلة، وبعدها التحليل البَعدي (Meta-analysis) اللي بيجمع نتايج عشرات التجارب — ده اللي بيتعامل معه كمعيار ذهبي زي مراجعات كوكرين. بعدهم تأتي دراسات المقارنة قبل/بعد (وده تصميم أضعف لأنه مفيهوش مجموعة ضابطة)، وأخيرًا المراجعات العلمية اللي بتركّب الصورة من دراسات موجودة.",
          "قاعدة بسيطة: كل ما نتيجة المنتج ظهرت في تجربة معشّاة أو تحليل بَعدي، كل ما تقدر تطمئن أكتر. وكل ما الاعتماد على «آلية معروفة للمادة» بس، كل ما تكون لازم أكثر حذر.",
        ],
      },
      {
        id: "product-vs-ingredients",
        heading: "دليل على المنتج نفسه ولا على مكوناته؟",
        paragraphs: [
          "أغلب مكملات الخصوبة بتتبنى على دليل مكوناتها الفردية — والده ما بيمنعش إن المزيج يشتغل، لكنه معناه إن الجرعات والتوافق والامتصاص في التركيبة المحددة ماتقيسوش بنفسهم. ده فرق جوهري لازم تحسبه في المقارنة.",
        ],
        bullets: [
          "Proxeed Plus: الأقوى — دراسات معشّاة مباشرة على التركيبة نفسها + ظهور في مراجعات منهجية.",
          "Proxeed Men: دليل مباشر على التركيبة الأساسية المشتركة، والمكونات الإضافية دليلها فردي.",
          "Proxeed Women: دراسة مباشرة واحدة بتصميم قبل/بعد + دليل مراجعات على الكارنيتين.",
          "Proxeed Women Inositol: دليل قوي على الإنوسيتول (خصوصًا مع تكيّس المبايض)، مش على التركيبة المحددة.",
          "Proxerex وEllamuselle: دليل مكونات فقط — مفيش تجارب منشورة على التركيبتين.",
        ],
      },
      {
        id: "endpoints",
        heading: "اتقاس إيه بالظبط؟ السؤال الأهم",
        paragraphs: [
          "أغلب الدراسات بتقيس نتايج وسيطة: حجم وتركيز وحركة الحيوانات المنوية، نسبة تفتّت الـDNA، جودة البويضات والأجنّة. دي مؤشرات مهمة جدًا وبتتحسن فعلًا مع بعض المكملات — لكنها مش نفسها قياس الحمل ولا الولادة الفعلية.",
          "الدراسات اللي قاست حملًا فعليًا قليلة، واللي وصلت لمعدلات الولادة الحية أقل. مراجعة كوكرين 2022 مثالًا لقت تحسنًا في معدلات الولادة الحية مع مضادات الأكسدة عمومًا — لكنها نفسها حذّرت إن جودة كتير من التجارب المشمولة ضعيفة. فالعبرة: أي حد بيوصلك بنتيجة نهائية (حمل/ولادة) أثقل بكتير من حد بيوصلك بتحسن في رقم معمل.",
        ],
      },
      {
        id: "population",
        heading: "النتيجة مرتبطة بالفئة اللي اتجرّبت عليها",
        paragraphs: [
          "أقوى أدلة الكارنيتين عند الرجال بتخص «العقم غير المفسَّر» (Oligoasthenozoospermia مجهول السبب) — مش دوالي ولا أسباب وراثية ولا انسداد. وأقوى أدلة الإنوسيتول بتخص الستات أصحاب متلازمة تكيّس المبايض اللي بيتعرضوا لتلقيح مساعد. النتيجة المتخصصة دي مش عيب في الدراسة — العيب إنها تتسوّق كأنها للكل.",
          "اسأل نفسك دايمًا: «أنا ضمن الفئة اللي اتجرّب عليها المنتج ولا لأ؟» لو الإجابة لأ، فالاستنتاج بيبنى على استقراء وأنت محتاج رأي طبيبك أول.",
        ],
      },
      {
        id: "duration",
        heading: "المدة مش رفاهية: ٣–٦ شهور قاعدة",
        paragraphs: [
          "دورة إنتاج الحيوانات المنوية نفسها بتمر بثلاثة شهور تقريبًا، ودراسات الكارنيتين الكبرى قاست بعد ستة شهور من الاستخدام المنتظم. ودراسات الستات اللي لقت تحسن في جودة البويضات والأجنّة استخدمت المكمل شهرين قبل دورة التلقيح على الأقل.",
          "يعني الحكم على أي مكمل بيتبنى على كورس كامل منتظم، مش على أسابيع. وده كمان أساس المقارنة السعرية العادلة: قارن تكلفة الكورس كامل مش العبوة الواحدة.",
        ],
      },
      {
        id: "red-flags",
        heading: "علامات تسويقية تستوقفك فورًا",
        paragraphs: [
          "الأدلة الحقيقية بتتكلم بأرقام محددة وفئات محددة ومدد محددة. الوعود المطلقة بتبقى علامة إن اللي بيتكلم بيبيع مش بيلخّص علمًا.",
        ],
        bullets: [
          "«يضمن الحمل» — مفيش مكمل في العالم أثبت ضمان للحمل. أقوى المراجعات بتتكلم عن تحسن في النسب مش ضمانات.",
          "«نتائج فورية» — الأبحاث كلها بتقول ٣–٦ شهور على الأقل.",
          "«ينفع لكل أسباب العقم» — الأدلة مرتبطة بفئات محددة (عقم غير مفسَّر، تكيّس مبايض، تلقيح مساعد).",
          "«تركيبة حصرية مدروسة علميًا» من غير أي مرجع منشور — اسأل عن الدراسة بالاسم.",
          "إخفاء جرعات المكونات جوه «مزيج خاص» — من غير الأرقام مش هتعرف بتقارن على إيه أصلًا.",
        ],
      },
      {
        id: "compare-checklist",
        heading: "تشيك ليست المقارنة قبل الشراء",
        paragraphs: ["خمس خطوات بتخلّي أي مقارنة بين مكملين عادلة وسريعة:"],
        bullets: [
          "اقرأ الأدلة على مستويين: في تجارب على التركيبة نفسها؟ وإيه قوتها (معشّاة/بعد-بعد/مراجعة)؟",
          "اتأكد إنك ضمن فئة الدراسات (سبب العقم، الجنس، طريقة الإنجاب).",
          "قارن الجرعات لكل حصة مش لكل عبوة، وشوف هل الجرعات قريبة من المستخدمة في الدراسات ولا أقل بكتير.",
          "احسب تكلفة الكورس الكامل (٣–٦ شهور) مش تكلفة العبوة.",
          "حدد إيه النتيجة اللي بتستنى فعليًا: تحسن في مؤشرات معملية — مش وعد حمل.",
        ],
      },
      {
        id: "our-position",
        heading: "موقف نايل فارما فود",
        paragraphs: [
          "احنا بنبيع المكملات دي، وبنكتبلك الأدلة بتاعتها بنفس الصراحة اللي بنشوفها: في منتجات دليلها قوي ومنتجات دليلها مكونات فقط. قرار المكمل المناسب لحالتك قرار طبي بامتياز، والمكمل — في أحسن الأحوال — جزء من خطة علاج مش بديل عنها.",
        ],
      },
    ],
    sources: [SRC_COCHRANE, SRC_NMA_2026, SRC_ART_META_2026, SRC_JCEM],
    disclaimer: DISCLAIMER_AR,
  },

  // ───────────────────────────────────────────────────────────── proxeed plus
  {
    slug: "proxeed-plus-scientific-evidence",
    locale: "ar" as Locale,
    title: "Proxeed Plus: أقوى دليل علمي بين مكملات الخصوبة الرجالية — وتحليله بصراحة",
    excerpt:
      "دراسة معشّاة على 175 رجل ومراجعة منهجية لتسع دراسات: أرقام حقيقية عن حركة الحيوانات المنوية وتفتت الـDNA، وإيه اللي المنتج أثبته فعلًا وإيه اللي مش من حق أي حد يبيعه.",
    sections: [
      {
        id: "who-is-it-for",
        heading: "المنتج ده مخصوص لمين؟",
        paragraphs: [
          "Proxeed Plus مكمل عن طريق الفم تركيبته أساسًا L-كارنيتين وAcetyl-L-كارنيتين مع فيتامينات ومعادن. الدليل الأقوى عليه بيخص رجالة معاهم تشخيص «عقم غير مفسَّر» من نوع Oligoasthenozoospermia — يعني عدد وحركة حيوانات منوية أقل من الطبيعي من غير سبب واضح زي دوالي أو خلل هرموني أو انسداد.",
          "لو حالتك مختلفة (دوالي مؤكدة، مشكلة هرمونية، انسداد، أو after فحص وراثي)، فأنت برة نطاق الدراسات — والمكمل ممكن يتناك كجزء من خطة أوسع، لكن القرار هناك طبي بحت.",
        ],
      },
      {
        id: "the-rct",
        heading: "أهم دراسة: تجربة معشّاة مزدوجة التعمية (Micic 2019)",
        paragraphs: [
          "175 رجل بتشخيص عقم غير مفسَّر اتقسموا على Proxeed Plus أو بلاسيبو لمدة ستة شهور، من غير ما حد يعرف مين بياخد إيه. النتيجة: تحسن ذو دلالة إحصائية في مجموعة المكمل مقابل ثبات مجموعة البلاسيبو.",
        ],
        bullets: [
          "الحركة التقدمية للحيوانات المنوية ارتفعت من 28% إلى 31% (p<0.001).",
          "مؤشر تفتت الـDNA للحيوانات المنوية نزل من 38.5% إلى 31% (p<0.001) — وده أهم مؤشر في الدراسة: النزول في التفتت كان أقوى منبئ مستقل بتحسن الحركة.",
          "حجم السائل المنوي ونسبة الحيوية تحسنوا برضه مقابل ثبات البلاسيبو.",
        ],
      },
      {
        id: "meta-analysis",
        heading: "والصورة الأوسع: مراجعة منهجية 2022",
        paragraphs: [
          "تحليل بَعدي منشور في Turkish Journal of Urology جمع تسع دراسات عن مضادات الأكسدة وتفتت الـDNA، ومنها دراسات Proxeed Plus. الخلاصة: مكملات مضادات الأكسدة — ومنها تركيبات الكارنيتين — قللت تفتت الـDNA وحسّنت التركيز والحركة والمورفولوجيا، والتوليفات متعددة المكونات بتبقى أقوى من مادة منفردة.",
          "نقطة مهمة لنزاهة الصورة: من الدراسات اللي قاست الحمل، اتحسن المعدل في اتنين من تلاتة — يعني إشارة إيجابية لكن مش إجماع.",
        ],
      },
      {
        id: "direct-vs-ingredient",
        heading: "الدليل مباشر على المنتج نفسه — ودي ميزة نادرة",
        paragraphs: [
          "على عكس أغلب المنافسين، الدراسات هنا اتجريت على تركيبة Proxeed Plus ذاتها بجرعاتها الفعلية، مش على مكون معزول في معمل. عشان كده قوة الدليل عليه أعلى من أي منتج تاني في نفس العيلة.",
        ],
      },
      {
        id: "what-it-doesnt-prove",
        heading: "إيه اللي الدراسات ما أثبتتوش — اقرا قبل ما تشتري",
        paragraphs: [
          "الدراسة الرئيسية ما قاستش الحمل ولا الولادة أصلًا — قاست مؤشرات منوية. يعني عبارة «بيزيد فرص الحمل» تفسير تسويقي، أما المثبت علميًا فهو: تحسن في الحركة والحياة وتفتت الـDNA بعد ستة شهور.",
          "وكمان: الفئة المتجرّب عليها هي العقم غير المفسَّر بس، ومفيش بيانات كافية للدوالي أو أسباب تانية، والدراسات على مدى ٦ شهور — مفيش بيانات طويلة المدى.",
        ],
      },
      {
        id: "duration-and-use",
        heading: "الاستخدام الصح: ستة شهور على الأقل",
        paragraphs: [
          "الدراسات استخدمت جرعة يومية منتظمة لمدة ستة شهور — وده منطقي لأن دورة إنتاج الحيوانات المنوية بياخد حوالي ٣ شهور. أول حقيقي للحكم على النتيجة هو تحليل سائل منوي بعد كورس كامل، مش بعد أسابيع.",
        ],
      },
      {
        id: "compare",
        heading: "لو بتقارن قبل الشراء",
        bullets: [
          "شوف جرعات L-كارنيتين وAcetyl-L-كارنيتين لكل حصة وقارنها بما استُخدم في الدراسات.",
          "قارن تكلفة ٦ شهور مش تكلفة العلبة — هنا بيظهر الفرق الحقيقي بين المنتجات.",
          "اتأكد إن تشخيصك ضمن الفئة (عقم غير مفسَّر) — ولو مش متأكد ابدأ بتحليل وبطبيب ذكورة.",
          "اطلب تحليل سائل منوي قبل وبعد الكورس — ده معيار النجاح العملي.",
        ],
        paragraphs: [
          "خلاصة صريحة: Proxeed Plus هو المنتج الوحيد في فئته اللي عنده تجربة معشّاة مباشرة منشورة + حضور في مراجعة منهجية، وده بيرفع وزنه في أي مقارنة عادلة — بشرط تفضل واعي إن المقيس مؤشرات منوية مش وعد حمل.",
        ],
      },
    ],
    sources: [SRC_MICIC, SRC_NOEGROHO],
    disclaimer: DISCLAIMER_AR,
  },

  // ──────────────────────────────────────────────────────────── proxeed women
  {
    slug: "proxeed-women-scientific-evidence",
    locale: "ar" as Locale,
    title: "Proxeed Women: الدليل العلمي على مكمل تحضير البويضات — بالأرقام وبحدوده",
    excerpt:
      "دراسة على ستات قبل دورات حقن مجهري + مراجعة علمية لدور الكارنيتين الأنثوي: نِسب تحسن نضوج البويضات وجودة الأجنّة، وأيضًا ليه التصميم التجريبي بيفرض حذر أكتر.",
    sections: [
      {
        id: "who-is-it-for",
        heading: "المنتج ده مخصوص لمين؟",
        paragraphs: [
          "Proxeed Women تركيبته مبنية على L-كارنيتين وAcetyl-L-كارنيتين مع مغذيات مساندة، ومستهدف أساسًا الستات اللي بيجهزوا نفسهم لدورة تلقيح مساعد (ICSI/IVF) أو اللي عندهم احتياطي مبيضي ضعيف. ده مش منتج خصوبة عام — السياق اللي دليله أقوى هو مراكز الخصوبة.",
        ],
      },
      {
        id: "the-study",
        heading: "الدراسة المباشرة: مقارنة قبل/بعد في ICSI (2025)",
        paragraphs: [
          "دراسة منشورة في Eastern Mediterranean Health Journal (WHO) قارنت نتايج دورة ICSI تانية بعد شهرين من مكمل Proxeed Women بدورة أولى من غير مكمل — لنفس الستات. النسب اللي ظهرت:",
        ],
        bullets: [
          "نضوج البويضات: من 69% إلى 84%.",
          "نسبة الأجنّة الجيدة: من 40% إلى 65%.",
          "نسبة Blastocyst وصلت 45%، والـBlastocyst الممتاز 45.2%.",
        ],
      },
      {
        id: "design-caveat",
        heading: "بس خلّي بالك من شكل الدراسة دي",
        paragraphs: [
          "التصميم «قبل/بعد» من غير تعشية ولا مجموعة ضابطة — يعني في احتمال حقيقي إن جزء من التحسن جاي من عوامل تانية (تطور معاملات المركز، اختيار الأجنة، التباين الطبيعي بين الدورات). عشان كده ده دليل مشجّع لكنه مش إثبات قاطع، وأي حد بيوصلك إن النتيجة «مضمونة» بيبيعك أكتر من اللي العلم يعرفه.",
          "كمان الدراسة ما قاستش الحمل ولا الولادة — قاست مؤشرات معملية لجودة البويضات والأجنة.",
        ],
      },
      {
        id: "ingredient-evidence",
        heading: "الدليل على المكونات: الكارنيتين والجهاز التناسلي الأنثوي",
        paragraphs: [
          "مراجعة Agarwal وزملاؤه 2018 في Reproductive Biology and Endocrinology جمعت الدليل على إن L-كارنيتين موجود بتركيزات عالية في الجهاز التناسلي الأنثوي، وبيشارك في طاقة البويضة ونضوجها، وإن مكملاته قللت تلف الهيكل الخلوي للبويضة وموت الأجنة المبرمج وحسّنت الإخصاب وجودة الأجنة في سياقات الإخصاب المساعد.",
          "المراجعة دي بتشرح «ليه منطقي إن المكمل يشتغل» — لكن المنطق البيولوجي مش بديل عن تجربة معشّاة على التركيبة نفسها، وده اللسان اللي نفضله معاك.",
        ],
      },
      {
        id: "fit",
        heading: "مين الأنسب ليه؟ ومين مش ضمن الفئة؟",
        paragraphs: [
          "أقرب فئة للدليل: ستات داخلة ICSI/IVF (خصوصًا بعد دورة أولى مشجعة) أو معاهم احتياطي مبيضي ضعيف. برة الفئة: ستات خصوبتهم طبيعية، أو سبب العقم مش related للجودة الخلوية — هناك الاستقراء أضعف بكتير والقرار مع الطبيب المتابع.",
        ],
      },
      {
        id: "duration",
        heading: "المدة: شهرين قبل الدورة كحد أدنى",
        paragraphs: [
          "الدراسة استخدمت المكمل لمدة شهرين قبل دورة الحقن المجهري. دي نقطة عملية مهمة في التخطيط والميزانية: المكمل جزء من تحضير لدورة محددة، مش جرعة عابرة.",
        ],
      },
      {
        id: "compare",
        heading: "لو بتقارن قبل الشراء",
        bullets: [
          "قارن جرعات الكارنيتين لكل حصة مع التركيبة المتاحة في السوق.",
          "اسأل مركز الخصوبة بتاعك: هل المكمل يتناوب مع بروتوكول التحفيز بتاعك ولا في تعارض؟",
          "خد بالك إن أي عرض بيعد بمعدلات حمل هو بيع كسر حدود الدليل المتاح.",
          "احسب تكلفة شهرين كحد أدنى للكورس مش تكلفة العبوة.",
        ],
        paragraphs: [
          "خلاصة صريحة: دليل Proxeed Women متوسط — دراسة مباشرة واحدة بتشجيع، مدعومة بمراجعة قوية لمكونها الأساسي، ومن غير إثبات حمل أو ولادة. لو أنت في فئة ICSI، ده مكمل فيلك تسألي عنه طبيبك بالاسم — مش أكتر من كده.",
        ],
      },
    ],
    sources: [SRC_OUMAIMA, SRC_AGARWAL_WOMEN],
    disclaimer: DISCLAIMER_AR,
  },

  // ────────────────────────────────────────────────────────────────── proxeed men
  {
    slug: "proxeed-men-scientific-evidence",
    locale: "ar" as Locale,
    title: "Proxeed Men: التركيبة المطوّرة — إيه اللي موروث من أدلة Proxeed وإيه الجديد؟",
    excerpt:
      "دراسة معشّاة على 104 رجال للتركيبة الأساسية + مراجعة كوكرين لـ61 تجربة: تحسينات موثقة في عدد وحركة الحيوانات المنوية، ومعدلات حمل أعلى في مجموعة العلاج — مع حدود الاستقراء للمكونات الإضافية.",
    sections: [
      {
        id: "who-is-it-for",
        heading: "المنتج ده مخصوص لمين؟",
        paragraphs: [
          "Proxeed Men مبني على نواة Proxeed المعروفة (كارنيتين + أسيتيل كارنيتين + مغذيات) مع مكونات إضافية زي L-أرجينين وفيتامينات D وE. الفئة اللي الدليل عليها أقوى: رجالة Oligo-astheno-teratozoospermia (مشكلة في العدد والحركة والشكل مع بعض) — بدوالي أو من غيرها.",
        ],
      },
      {
        id: "busetto-rct",
        heading: "الدليل المباشر على النواة: دراسة Busetto 2018",
        paragraphs: [
          "تجربة معشّاة مزدوجة التعمية مقابل بلاسيبو على 104 رجال، لمدة ستة شهور. مجموعة المكمل أظهرت:",
        ],
        bullets: [
          "تحسنًا في العدد الكلي للحيوانات المنوية والحركة التقدمية والمورفولوجيا مقابل البلاسيبو.",
          "انخفاضًا ذا دلالة في تفتت الـDNA — مؤشر جودة الحمض النووي للحيوان المنوي.",
          "عشر حالات حمل طبيعي في مجموعة المكمل مقابل اتنين في البلاسيبو — نتيجة مشجعة لكنها نتيجة ثانوية في دراسة مصممة أساسًا للمؤشرات المنوية.",
        ],
      },
      {
        id: "cochrane",
        heading: "والصورة الكبيرة: مراجعة كوكرين 2022",
        paragraphs: [
          "التحديث الأخير لمراجعة كوكرين جمع 61 تجربة معشّاة لمضادات الأكسدة في العقم الرجالي. النتيجة الإجمالية: تحسن في معدلات الولادة الحية (OR 4.21) والحمل السريري (OR 3.43) وتحسن في مؤشرات منوية متعددة — مع تصريح صريح من المؤلفين إن كتير من التجارب المشمولة فيها تحيز عالي وأن اللازم تجارب أكبر وأدق.",
          "للأمانة: الأرقام دي لمضادات الأكسدة «كفئة» مش لمنتج محدد — لكنها بتدي وزن بيولوجي وإحصائي للفئة اللي Proxeed Men بيتبع لها.",
        ],
      },
      {
        id: "added-ingredients",
        heading: "المكونات الإضافية: دليل فردي مش دليل تركيبة",
        paragraphs: [
          "L-أرجينين وفيتامين D وE لكل واحد دليله المنفرد في أدبيات الخصوبة، لكن دمجهم مع النواة في تركيبة Proxeed Men تحديدًا ماخضعش لتجربة منشورة. يعني: الأساس متين بالدليل المباشر، والطبقة الإضافية فوقه مستنتَجة.",
        ],
      },
      {
        id: "what-it-doesnt-prove",
        heading: "حدود لازم تحطها في الحسبان",
        bullets: [
          "معدلات الحمل في دراسة 2018 نتيجة ثانوية بعينة محدودة — مش إثبات «بيخليك تحمل».",
          "الفئة: OAT مجهول السبب — الأسباب الهرمونية والوراثية والانسدادية برة النطاق.",
          "مفيش تجارب على التركيبة الكاملة المطوّرة بنفسها.",
        ],
        paragraphs: [
          "القاعدة نفسها زي أي مكمل: القرار طبي أولًا، والتحليل المنوي قبل/بعد هو مقياس النجاح العملي.",
        ],
      },
      {
        id: "duration",
        heading: "المدة: ستة شهور زي الدراسات",
        paragraphs: [
          "زي نواة Proxeed: ستة شهور استخدام منتظم هي المدة اللي قاستها الأبحاث، وده المعقول بيولوجيًا لدورة إنتاج الحيوانات المنوية. أي حكم قبل كورس كامل مش مبني على الدليل المتاح.",
        ],
      },
      {
        id: "compare",
        heading: "لو بتقارن قبل الشراء",
        bullets: [
          "قارن جرعات النواة (كارنيتين/أسيتيل كارنيتين) مع Proxeed Plus — هي نفس العيلة العلمية.",
          "قيّم قيمة المكونات الإضافية على أساس «دليل فردي» مش دليل تركيبة.",
          "لو عايز أقوى دليل منشور بالاسم، ده Proxeed Plus؛ لو بتحب تركيبة أوسع، اعرف إن الطبقة الإضافية استنتاجية.",
          "كورس ٦ شهور هو وحدة الحساب العادلة.",
        ],
        paragraphs: [
          "خلاصة صريحة: Proxeed Men بيرث دليل مباشر جيد من عيلته العلمية وبيضيف مكونات منطقية بيولوجيًا — لكن الطبقة المضافة نفسها ماتدرستش. مستوى الدليل: متوسط لقوي بالاستقراء.",
        ],
      },
    ],
    sources: [SRC_Busetto, SRC_COCHRANE],
    disclaimer: DISCLAIMER_AR,
  },

  // ─────────────────────────────────────────────────────────────────── proxeed women inositol
  {
    slug: "proxeed-women-inositol-scientific-evidence",
    locale: "ar" as Locale,
    title: "Proxeed Women Inositol: الإنوسيتول وتكيّس المبايض — أقوى فئة دليل عند الستات",
    excerpt:
      "تحليل بَعدي لـ17 دراسة ومراجعة غذّت الإرشاد الدولي: تحسن حقيقي في معدلات الحمل السريري وجودة الأجنة مع تكيّس المبايض — مع تنبيه مهم عن مؤشرات الاحتياطي المبيضي.",
    sections: [
      {
        id: "who-is-it-for",
        heading: "المنتج ده مخصوص لمين؟",
        paragraphs: [
          "Proxeed Women Inositol تركيبة الإنوسيتول (Myo-inositol مع D-chiro-inositol). دي الفئة اللي عندها أوضح دليل في مكملات الخصوبة الأنثوية: ستات متلازمة تكيّس المبايض (PCOS) — خصوصًا اللي داخلة تلقيح مساعد. لو مش عندك PCOS، فأنت بتستقرئ من فئة تانية وده فرق جوهري.",
        ],
      },
      {
        id: "meta-analysis-2025",
        heading: "أقوى دليل: تحليل بَعدي 2025 (17 دراسة)",
        paragraphs: [
          "مراجعة منهجية وتحليل بَعدي منشور في International Journal of Reproductive BioMedicine جمع 17 دراسة تدخلية للإنوسيتول مع ART لدى PCOS. النتايج:",
        ],
        bullets: [
          "معدل الحمل السريري زاد بشكل ذي دلالة: RR 1.64 (فاصل ثقة 1.25–2.15) — يعني زيادة نسبية معتبرة فعليًا.",
          "نسبة الأجنة عالية الجودة زادت: RR 1.12 (1.02–1.23).",
          "التوليفة (Myo + D-chiro) ظهرت أقوى من المادة المنفردة في جزء من الأدبيات.",
        ],
      },
      {
        id: "jcem-2024",
        heading: "المراجعة الحصيفة: JCEM 2024 والإرشاد الدولي",
        paragraphs: [
          "مراجعة JCEM — اللي غذّت الإرشاد الدولي المبني على الأدلة لمتلازمة تكيّس المبايض — لقت: D-chiro-inositol حسّن معدلات الإباضة بفارق كبير (OR 11.5 من تجربتين)، مع فوائد في بعض المؤشرات الأيضية. لكن نفس المراجعة قالت بوضوح: أدلة الحمل والولادة الحية لسه محدودة ومش حاسمة، ومحتاجة تجارب أدق.",
          "يعني الاتجاه إيجابي والفئة واضحة — لكن الصورة النهائية لسه بتتكمّل.",
        ],
      },
      {
        id: "amh-caution",
        heading: "تنبيه مهم: احتياطي مبيضي ضعيف؟",
        paragraphs: [
          "نفس تحليل 2025 لاحظ انخفاضًا في عدد الجريبات الزجرية (AFC) وهرمون AMH مع الاستخدام. للمش متأكد: دي مؤشرات الاحتياطي المبيضي — وده استحقاق تنبيه صريح لأي ستة احتياطيها المبيضي ضعيف أصلًا. النقطة دي بالذات لازم تتناقش مع طبيب الخصوبة قبل البدء، مش بعد.",
        ],
      },
      {
        id: "fit",
        heading: "مين الأنسب؟ ومين مش الفئة؟",
        bullets: [
          "داخل الفئة: PCOS مع اضطراب إباضة أو دخول ART — أقوى دليل.",
          "برة الفئة: خصوبة طبيعية أو أسباب عقم أخرى — الاستقراء أضعف بكتير.",
          "أهم من المكمّل نفسه: تنظيم الوزن وخطة العلاج اللي طبيبك محددها.",
        ],
        paragraphs: [
          "وزي كل المقالات هنا: الدراسات قاست حملًا سريريًا وجودة أجنة — مش ولادة حية. حد بيعد لك بضمانات «استعادة الخصوبة» بيبيعك أكتر من العلم.",
        ],
      },
      {
        id: "duration",
        heading: "المدة والتوقعات",
        paragraphs: [
          "دراسات الإنوسيتول امتدت من تلاتة لستة شهور في أغلبها، ودورة التحضير قبل ART بتكون ضمن المدى ده. التوقع الواقعي: تحسين في الانتظام والإباضة ومؤشرات أيضية أولًا، ونتايج ART كمكسب إضافي محتمل مش مضمون.",
        ],
      },
      {
        id: "compare",
        heading: "لو بتقارن قبل الشراء",
        bullets: [
          "شوف نسبة Myo:D-chiro في التركيبة وقارنها بالمستخدمة في الدراسات (الشائعة علميًا 40:1).",
          "لو عندك مؤشرات احتياطي مبيضي ضعيف، ناقش نقطة AFC/AMH مع طبيبك أولًا.",
          "قارن تكلفة ٣–٦ شهور مش العبوة.",
          "اتأكد إن تشخيصك PCOS فعلًا — الدليل كلها مبنية عليه.",
        ],
        paragraphs: [
          "خلاصة صريحة: أقوى فئة دليل عند مكملات الخصوبة الأنثوية — لكنها فئة PCOS بالذات، وبنطاقات زمنية محددة، وبتنبيه مشروع على مؤشرات الاحتياطي المبيضي.",
        ],
      },
    ],
    sources: [SRC_INOSITOL_META, SRC_JCEM],
    disclaimer: DISCLAIMER_AR,
  },

  // ──────────────────────────────────────────────────────────────────── proxerex
  {
    slug: "proxerex-scientific-evidence",
    locale: "ar" as Locale,
    title: "Proxerex: مافيش دراسات على التركيبة نفسها — وده اللي المفروض تعرفه قبل الشراء",
    excerpt:
      "مراجعة صريحة: الدليل المتاح على مكونات Proxerex (كارنيتين، أرجينين، زنك، سيلينيوم، مكا) فين بيوصل وفين بيقع — وإزاي تحط ده في حسابك عند المقارنة.",
    sections: [
      {
        id: "who-is-it-for",
        heading: "المنتج ده مخصوص لمين؟",
        paragraphs: [
          "Proxerex تركيبة رجالية تجمع L-أرجينين وL-كارنيتين مع نياسين وزنك وسيلينيوم ومستخلص الماكا وكاكاو — بتنحط في سياق دعم الخصوبة والحيوية الرجالية. قبل أي حاجة: دي معلومات تساعدك تقارن، والقرار العلاجي مع طبيبك.",
        ],
      },
      {
        id: "the-honest-start",
        heading: "الحقيقة الأولى: مفيش تجارب على التركيبة",
        paragraphs: [
          "بحثنا الدليل اللي قبلنا: مافيش دراسات محكّمة منشورة على تركيبة Proxerex نفسها. ده مش رأي — ده وصف لحالة الأدبيات. أي حد يقولك «المنتج مدروس علميًا» من غير مرجع منشور باسمه، بيكدب في تفصيلة بتفرق.",
          "هل ده معناه إن المنتج «مش شغال»؟ لأ — معناه إن دليله مستنتَج: المكونات ليها أدبيات، والتركيبة نفسها غير مقيسة. وده بيحط المنتج في درجة دليل أقل من Proxeed Plus مثلًا اللي عليه تجارب معشّاة مباشرة.",
        ],
      },
      {
        id: "ingredient-evidence",
        heading: "الدليل على المكونات فين بيوصل؟",
        bullets: [
          "L-كارنيتين: أقوى مكون في التركيبة دليلًا — تحليل شبكي بَعدي حديث (2026) بيأكد تحسن الحركة التقدمية وانخفاض تفتت الـDNA مع مكملات الكارنيتين.",
          "L-أرجينين: دليل متفاوت — تحسينات محتملة في العدد والحركة عند بعض الفئات، مش نتيجة ثابتة عبر كل الدراسات.",
          "زنك وسيلينيوم: مضادات أكسدة أساسية لصحة السائل المنوي؛ النقص بيترافق مع سوء المؤشرات، والدعم مفيد خصوصًا عند وجود نقص.",
          "الماكا: أضعف حلقة — نتايج بشرية غير متسقة، وأغلب الحماس ليها تسويقي أكتر منه تجريبي.",
        ],
        paragraphs: [
          "لاحظ إن مراجعات الفئة — زي مراجعة Nutrients 2021 — بتصل بإن المكملات المركبة واعدة لكن ناقصها تجارب مباشرة، وإن جودة التركيبات متفاوتة جدًا من منتج لمنتج.",
        ],
      },
      {
        id: "what-it-means",
        heading: "إيه معنى ده ليك كمشتري؟",
        paragraphs: [
          "المعنى العملي: أنت بتشتري دليل مكونات مش دليل منتج. لو هدفك أدلة بأقوى وزن، في نفس العيلة عندنا تركيبات عليها تجارب معشّاة منشورة. ولو عوامل زي تنويع مضادات الأكسدة والزنك/السيلينيوم هي اللي مهمة ليك، فدي قيمة Proxerex المحددة — بالوضوح ده مش بالوعود.",
        ],
      },
      {
        id: "duration",
        heading: "المدة: نفس قاعدة الفئة — ٣ لـ٦ شهور",
        paragraphs: [
          "بيولوجيا إنتاج الحيوانات المنوية واحدة لأي تركيبة: الحكم بيبان بعد كورس كامل، والدراسات الفئوية بتتكلم عن ٣–٦ شهور. والقياس العملي يفضل تحليل سائل منوي قبل وبعد.",
        ],
      },
      {
        id: "compare",
        heading: "لو بتقارن قبل الشراء",
        bullets: [
          "قارن جرعات الكارنيتين والأرجينين لكل حصة مع المنافسين ومن مع معظم ما استُخدم في الأدبيات.",
          "اتأكد إن جرعات الزنك والسيلينيوم منطقية ومش متكررة لو بتاخد مالتي فيتامين.",
          "لو الدليل المباشر أهم أولوية ليك، استبعد المنتجات اللي مالهاش تجارب من الترتيب الأول.",
          "خلي الماكا كثافة حكم منخفضة — متدفعش فيها وعد.",
        ],
        paragraphs: [
          "خلاصة صريحة: Proxerex دليله مكونات فقط — في مكونات قوية زي الكارنيتين وفي أضعف زي الماكا. احترامك للاختلاف ده هو الفرق بين قرار مبني والتحليل وقرار مبني على إعلان.",
        ],
      },
    ],
    sources: [SRC_NMA_2026, SRC_LAGANA],
    disclaimer: DISCLAIMER_AR,
  },

  // ──────────────────────────────────────────────────────────────── ellamuselle
  {
    slug: "ellamuselle-scientific-evidence",
    locale: "ar" as Locale,
    title: "Ellamuselle: مكمل عافية إنثوية — إيه اللي العلم يعرفه عن مكوناته فعلًا؟",
    excerpt:
      "منتج عافية مش منتج خصوبة: مراجعة هادئة لدليل الأرجينين والكارنيتين والزنك، ولماذا النباتات زي المويرا بوامانا والداميانا دليلها التجريبي محدود.",
    sections: [
      {
        id: "what-it-is",
        heading: "إيه هو بالظبط؟ (وليه التصنيف مهم)",
        paragraphs: [
          "Ellamuselle تركيبة عافية إنثوية (Sexual wellness) بتجمع L-أرجينين وPropionyl-L-كارنيتين مع مستخلصات نباتية (مويرا بوامانا، داميانا، بلاك كوهوش) وجينكو وزنك ونياسين وجينيستين. النقطة الأولى للشفافية: ده منتج عافية مش منتج خصوبة — وأي تسويق بيخلط بين الاتنين بيخلط بين سؤالين علميين مختلفين.",
        ],
      },
      {
        id: "no-product-trials",
        heading: "مافيش تجارب على التركيبة نفسها",
        paragraphs: [
          "زي ما هو الحال مع أغلب منتجات العافية المركبة: مافيش دراسات محكّمة منشورة على تركيبة Ellamuselle بعينها — لا لوظائفها المستهدفة ولا غيرها. ودي معلومة بنكتبها بأعلى وضوح لأنها أساس أي قرار شراء مسؤول.",
        ],
      },
      {
        id: "mineral-amino-evidence",
        heading: "المكونات غير النباتية: دليل وعدي ومتوسط",
        bullets: [
          "L-أرجينين: مراجعات طب التناسل (RBMO 2023) بتشير لتحسن سماكة بطانة الرحم وتدفقها الدموي عند «المستجيبات الضعيفات» في IVF — دليل وعدي في سياق خصوبة.",
          "Propionyl-L-كارنيتين: جزء من عيلة الكارنيتين ذات الأدلة الأيضية الجيدة — لكن في سياقات مختلفة عن العافية الإنثوية المحددة.",
          "الزنك: دور موثق في التنظيم الهرموني والدفاع الأكسدي — مع فائدة أوضح عند وجود نقص.",
        ],
        paragraphs: [
          "خلاصة الجزء ده: مكونات ليها منطق بيولوجي وأدبيات محترمة في سياقات أخرى — مش دليل على التركيبة ولا على الاستخدام المعلَن لها.",
        ],
      },
      {
        id: "botanical-evidence",
        heading: "المكونات النباتية: أضعف جزء بأمانة",
        paragraphs: [
          "تحليل بَعدي حديث (2026) للتلقيح المساعد خلص لإن مافيش أدلة عالية اليقين إن المكملات الغذائية عمومًا بتحسن نتايج الخصوبة، وإن المكونات النباتية الشائعة في مكملات العافية — زي الداميانا والمويرا بوامانا والبلاك كوهوش — أدبياتها البشرية محدودة أو متضاربة على نواتج الوظيفة الجنسية والخصوبة بالذات.",
          "أي إحساس فعلي بتلاحظه بتركيبات نباتية ممكن يكون حقيقي عندك كتجربة فردية — لكنه مش إثبات منشور، والفروق الفردية في التجارب دايمًا بتعيش جوه فاصل واسع.",
        ],
      },
      {
        id: "what-it-means",
        heading: "إيه معنى ده ليك كمشترية؟",
        paragraphs: [
          "لو هدفك دليل خصوبة قوي، في المنتجات التانية عندنا أدلة أعلى بوضوح (شوف مقالة الدليل العام). لو هدفك تجربة تركيبة عافية بمكونات ليها منطق بيولوجي، فEllamuselle خيارها موجود — والقرار هينا نصفه بالشفافية: مستوى الدليل منخفض، والتوقعات الواقعية جزء من المنتج.",
        ],
      },
      {
        id: "compare",
        heading: "لو بتقارنين قبل الشراء",
        bullets: [
          "حددي هدفك بالضبط: عافية ولا خصوبة؟ ده بيغير المنتج المناسب تمامًا.",
          "قارني الجرعات: المكونات النباتية غالبًا بتيجي في «مزائج» مش واضحة الجرعة — اسألي عن الأرقام.",
          "لو بتاخدي أدوية (خصوصًا هرمونية أو مضادات تجلط)، راجعي النباتات مع طبيبك — ليها تفاعلات محتملة.",
          "متبنيش قرار على شهادات فردية — دي مش منهجية تجارب.",
        ],
        paragraphs: [
          "خلاصة صريحة: مستوى الدليل على Ellamuselle منخفض — مكونات منطقية بيولوجيًا وتركيبة غير مقيسة وتصنيف «عافية» مش «خصوبة». وبنكتب ده عشان قرارك يبقى مبني على الصورة كاملة.",
        ],
      },
    ],
    sources: [SRC_RBMO, SRC_ART_META_2026],
    disclaimer: DISCLAIMER_AR,
  },

  // ══════════════════════════════════════════════════════════════════ ENGLISH
  {
    slug: "fertility-supplements-evidence-guide",
    locale: "en" as Locale,
    title: "Before You Buy a Fertility Supplement: How to Read the Evidence and Compare Properly",
    excerpt:
      "A practical guide for researchers and comparers: evidence levels, product studies vs ingredient studies, the questions to ask before buying, and the marketing claims that should stop you mid-scroll.",
    sections: [
      {
        id: "why-this-guide",
        heading: "Why this guide exists",
        paragraphs: [
          "The fertility supplement market runs on big promises, but the real research is unevenly distributed across products: some have direct randomised trials, others only ingredient-level evidence, and some have no published studies of their formulation at all. That difference is the first thing you should know before paying.",
          "This guide gives you — in plain language — how to tell evidence levels apart, which questions to ask, and how to compare products on science rather than advertising. Each product we carry also has its own article with its full reference list.",
        ],
      },
      {
        id: "evidence-levels",
        heading: "Evidence levels: who can say what",
        paragraphs: [
          "Not all studies carry the same weight. A double-blind randomised placebo-controlled trial (RCT) is the strongest single form of evidence. Above it sits the meta-analysis pooling dozens of trials — the gold standard of synthesis, as in Cochrane reviews. Below: before-after comparisons (weaker — no control group), and narrative reviews assembling existing studies.",
          "Rule of thumb: the more a product's result shows up in an RCT or meta-analysis, the more confident you can be. The more it rests on \"a known mechanism of an ingredient\", the more caution you need.",
        ],
      },
      {
        id: "product-vs-ingredients",
        heading: "Evidence on the product itself, or on its ingredients?",
        paragraphs: [
          "Most fertility supplements stand on evidence for their individual ingredients. That does not make a combination useless — but the dosing, synergy and bioavailability of that specific blend were never measured themselves. That is a material difference in any comparison.",
        ],
        bullets: [
          "Proxeed Plus: strongest — direct RCTs on the formulation itself plus appearances in systematic reviews.",
          "Proxeed Men: direct evidence on the shared core formulation; the added ingredients carry individual evidence only.",
          "Proxeed Women: one direct before-after study plus review-level evidence for carnitine.",
          "Proxeed Women Inositol: strong inositol evidence (especially in PCOS), not on the exact blend.",
          "Proxerex and Ellamuselle: ingredient-level evidence only — no published trials of either formulation.",
        ],
      },
      {
        id: "endpoints",
        heading: "What was actually measured? The most important question",
        paragraphs: [
          "Most studies measure intermediate outcomes: sperm count, motility, DNA fragmentation, oocyte and embryo quality. These matter and genuinely improve with some supplements — but they are not the same as measuring pregnancy or live birth.",
          "Studies reporting actual pregnancy are rarer; live-birth data rarer still. Cochrane's 2022 review did find improved live-birth rates for antioxidants as a class — while cautioning that many included trials had high risk of bias. The takeaway: any endpoint closer to a real birth outweighs an improvement in a lab number.",
        ],
      },
      {
        id: "population",
        heading: "Results belong to the population studied",
        paragraphs: [
          "The strongest carnitine evidence covers men with unexplained infertility (idiopathic oligoasthenozoospermia) — not varicocele, hormonal disorders or obstruction. The strongest inositol evidence covers women with PCOS undergoing assisted reproduction. Narrow evidence is not a flaw — selling it as universal is.",
          "Always ask: \"am I inside the population that was studied?\" If not, your conclusion is an extrapolation, and your doctor's opinion comes first.",
        ],
      },
      {
        id: "duration",
        heading: "Duration matters: 3–6 months is the rule",
        paragraphs: [
          "A full sperm-production cycle takes about three months; the major carnitine trials measured after six months of daily use. The female studies showing oocyte and embryo improvements used supplementation for at least two months before the assisted cycle.",
          "So judge any supplement after a complete, consistent course — not after a few weeks. This is also the basis of fair pricing: compare the cost of the full course, not the pack.",
        ],
      },
      {
        id: "red-flags",
        heading: "Marketing claims that should stop you",
        paragraphs: [
          "Real evidence speaks in specific numbers, specific populations and specific durations. Absolute promises are a sign that you are being sold to, not informed.",
        ],
        bullets: [
          "\"Guarantees pregnancy\" — no supplement anywhere has proven a guarantee. The best reviews speak of improved rates, not guarantees.",
          "\"Instant results\" — the research uniformly says at least 3–6 months.",
          "\"Works for all causes of infertility\" — evidence is population-specific (idiopathic male infertility, PCOS, assisted reproduction).",
          "\"Clinically studied proprietary blend\" with no published reference — ask for the study by name.",
          "Ingredient doses hidden in a \"proprietary blend\" — without numbers there is nothing to compare.",
        ],
      },
      {
        id: "compare-checklist",
        heading: "The pre-purchase comparison checklist",
        paragraphs: ["Five steps make any comparison between two supplements fair and quick:"],
        bullets: [
          "Read the evidence at two levels: trials on the formulation itself? How strong (RCT / before-after / review)?",
          "Check you match the study population (cause of infertility, sex, conception method).",
          "Compare doses per serving, not per pack — and how close they are to the doses used in the studies.",
          "Price the full course (3–6 months), not the pack.",
          "Define what you can actually expect: improved lab parameters — not a pregnancy promise.",
        ],
      },
      {
        id: "our-position",
        heading: "Where Nile Pharma Food stands",
        paragraphs: [
          "We sell these products, and we publish their evidence with the same candour we use to read it: some have strong direct data, others stand on ingredients alone. Choosing the right supplement for your case is a medical decision first, and a supplement — at best — is part of a treatment plan, never a replacement for one.",
        ],
      },
    ],
    sources: [SRC_COCHRANE, SRC_NMA_2026, SRC_ART_META_2026, SRC_JCEM],
    disclaimer: DISCLAIMER_EN,
  },

  {
    slug: "proxeed-plus-scientific-evidence",
    locale: "en" as Locale,
    title: "Proxeed Plus: The Strongest Evidence Base in Male Fertility Supplements — Read Honestly",
    excerpt:
      "A 175-man randomised trial plus a nine-study systematic review: real numbers on sperm motility and DNA fragmentation — what the product has actually proven, and what nobody should promise you.",
    sections: [
      {
        id: "who-is-it-for",
        heading: "Who is this for?",
        paragraphs: [
          "Proxeed Plus is an oral supplement built on L-carnitine and L-acetylcarnitine with vitamins and minerals. Its strongest evidence covers men diagnosed with unexplained (idiopathic) oligoasthenozoospermia — lower-than-normal sperm count and motility with no clear cause such as varicocele, hormonal disorder or obstruction.",
          "If your case is different (confirmed varicocele, a hormonal problem, obstruction or a genetic finding), you are outside the studied population — a supplement may still fit a broader plan, but that call belongs to your physician.",
        ],
      },
      {
        id: "the-rct",
        heading: "The key study: a double-blind RCT (Micic 2019)",
        paragraphs: [
          "175 men with unexplained infertility were randomised to Proxeed Plus or placebo for six months, with neither participants nor investigators knowing who took what. The supplemented group improved with statistical significance while the placebo group stayed flat.",
        ],
        bullets: [
          "Progressive sperm motility rose from 28% to 31% (p<0.001).",
          "Sperm DNA fragmentation fell from 38.5% to 31% (p<0.001) — the study's most important finding: the DFI drop was the strongest independent predictor of improved motility.",
          "Semen volume and vitality improved as well, against a flat placebo arm.",
        ],
      },
      {
        id: "meta-analysis",
        heading: "The wider picture: the 2022 systematic review",
        paragraphs: [
          "A meta-analysis in the Turkish Journal of Urology pooled nine antioxidant/DFI studies, including Proxeed Plus trials. Antioxidant supplementation — carnitine combinations included — significantly reduced DNA fragmentation and improved concentration, motility and morphology, with multi-ingredient combinations outperforming single nutrients.",
          "One honesty note: among studies reporting pregnancy, rates improved in two of three — a positive signal, not a consensus.",
        ],
      },
      {
        id: "direct-vs-ingredient",
        heading: "Direct evidence on the product itself — a rare advantage",
        paragraphs: [
          "Unlike most competitors, these trials ran on the actual Proxeed Plus formulation at its real doses — not an isolated ingredient in a lab. That is why its evidence weight is higher than any other product in the same family.",
        ],
      },
      {
        id: "what-it-doesnt-prove",
        heading: "What the studies did NOT prove — read before buying",
        paragraphs: [
          "The main trial did not measure pregnancy or live birth — it measured semen parameters. \"Improves conception chances\" is a marketing gloss; what is scientifically established is improved motility, vitality and DNA fragmentation after six months.",
          "Also: the studied population is unexplained male infertility only; there are insufficient data for varicocele or other causes; and trials ran six months — no long-term data.",
        ],
      },
      {
        id: "duration-and-use",
        heading: "Proper use: at least six months",
        paragraphs: [
          "The trials used a consistent daily dose for six months — biologically sensible given the ~3-month sperm production cycle. The realistic checkpoint is a semen analysis after a complete course, not after a few weeks.",
        ],
      },
      {
        id: "compare",
        heading: "If you are comparing before buying",
        bullets: [
          "Compare L-carnitine and L-acetylcarnitine doses per serving against the studied doses.",
          "Price six months, not one box — that is where real differences show.",
          "Confirm your diagnosis sits inside the studied category — start with a semen analysis and an andrologist.",
          "Order a semen analysis before and after the course — that is the practical success metric.",
        ],
        paragraphs: [
          "Straight summary: Proxeed Plus is the only product in its class with a published direct RCT plus a systematic-review presence — which earns it real weight in any fair comparison, as long as you remember the measured endpoints are semen parameters, not a pregnancy promise.",
        ],
      },
    ],
    sources: [SRC_MICIC, SRC_NOEGROHO],
    disclaimer: DISCLAIMER_EN,
  },

  {
    slug: "proxeed-women-scientific-evidence",
    locale: "en" as Locale,
    title: "Proxeed Women: The Evidence for an Oocyte-Preparation Supplement — Numbers and Limits",
    excerpt:
      "An ICSI before-after study plus a scientific review of female carnitine: real percentages for oocyte maturation and embryo quality — and why the study design demands extra caution.",
    sections: [
      {
        id: "who-is-it-for",
        heading: "Who is this for?",
        paragraphs: [
          "Proxeed Women is built on L-carnitine and L-acetylcarnitine with supporting nutrients, aimed primarily at women preparing for an assisted reproduction cycle (ICSI/IVF) or with diminished ovarian reserve. It is not a general fertility product — the context with the strongest evidence is the fertility clinic.",
        ],
      },
      {
        id: "the-study",
        heading: "The direct study: an ICSI before-after comparison (2025)",
        paragraphs: [
          "A study in the Eastern Mediterranean Health Journal (WHO) compared each woman's second ICSI cycle — after two months on Proxeed Women — against her first unsupplemented cycle:",
        ],
        bullets: [
          "Oocyte maturation rate: 69% → 84%.",
          "Good-quality embryo rate: 40% → 65%.",
          "Blastocyst rate reached 45%, with 45.2% top-quality blastocysts.",
        ],
      },
      {
        id: "design-caveat",
        heading: "But mind the study design",
        paragraphs: [
          "This is a before-after design without randomisation or a control group — some of the improvement could come from other factors (evolving lab protocols, embryo selection, natural cycle-to-cycle variation). It is encouraging evidence, not proof — and anyone selling it as \"guaranteed\" is overselling what science knows.",
          "The study also measured lab parameters, not pregnancy or live birth.",
        ],
      },
      {
        id: "ingredient-evidence",
        heading: "Ingredient evidence: carnitine and the female reproductive tract",
        paragraphs: [
          "Agarwal and colleagues' 2018 review in Reproductive Biology and Endocrinology assembled the evidence that L-carnitine occurs at high concentrations in the female reproductive tract, participates in oocyte energy metabolism and maturation, and that supplementation reduced oocyte cytoskeleton damage and embryo apoptosis while improving fertilisation and embryo quality in assisted reproduction settings.",
          "That review explains why the supplement is biologically plausible — but plausibility is not a randomised trial of the formulation itself, which remains the standard we hold products to.",
        ],
      },
      {
        id: "fit",
        heading: "Who fits — and who does not",
        paragraphs: [
          "Closest to the evidence: women entering ICSI/IVF (especially after an encouraging first cycle) or with diminished ovarian reserve. Outside: women with normal fertility, or infertility unrelated to oocyte quality — there the extrapolation is much weaker and your treating physician decides.",
        ],
      },
      {
        id: "duration",
        heading: "Duration: two months before the cycle, minimum",
        paragraphs: [
          "The study used the supplement for two months before the ICSI cycle. That is a practical planning and budgeting point: this is preparation for a defined cycle, not a casual course.",
        ],
      },
      {
        id: "compare",
        heading: "If you are comparing before buying",
        bullets: [
          "Compare carnitine doses per serving across available formulations.",
          "Ask your fertility clinic whether it fits your stimulation protocol.",
          "Treat any offer quoting pregnancy rates as marketing beyond the available evidence.",
          "Price two months minimum as the course, not a single pack.",
        ],
        paragraphs: [
          "Straight summary: Proxeed Women's evidence is moderate — one encouraging direct study backed by a strong review of its core ingredient, with no pregnancy or live-birth proof. If you are an ICSI patient, it is a supplement worth naming to your doctor — nothing more.",
        ],
      },
    ],
    sources: [SRC_OUMAIMA, SRC_AGARWAL_WOMEN],
    disclaimer: DISCLAIMER_EN,
  },

  {
    slug: "proxeed-men-scientific-evidence",
    locale: "en" as Locale,
    title: "Proxeed Men: The Enhanced Formulation — What It Inherits from Proxeed Evidence and What Is New",
    excerpt:
      "A 104-man RCT on the core formulation plus Cochrane's 61-trial review: documented gains in count, motility and morphology and higher pregnancy rates in the treatment arm — with honest limits on the added ingredients.",
    sections: [
      {
        id: "who-is-it-for",
        heading: "Who is this for?",
        paragraphs: [
          "Proxeed Men builds on the well-known Proxeed core (carnitine + acetyl-carnitine + micronutrients) with additions such as L-arginine and vitamins D and E. The population with the strongest evidence: men with oligo-astheno-teratozoospermia (count, motility and morphology affected together), with or without varicocele.",
        ],
      },
      {
        id: "busetto-rct",
        heading: "Direct evidence on the core: Busetto 2018",
        paragraphs: [
          "A double-blind placebo-controlled RCT in 104 men over six months. The treatment arm showed:",
        ],
        bullets: [
          "Improved total sperm count, progressive motility and morphology versus placebo.",
          "A significant decrease in sperm DNA fragmentation.",
          "Ten spontaneous pregnancies in the treatment arm versus two on placebo — encouraging, but a secondary outcome in a trial designed around semen parameters.",
        ],
      },
      {
        id: "cochrane",
        heading: "The big picture: Cochrane 2022",
        paragraphs: [
          "Cochrane's latest update pooled 61 randomised trials of antioxidants in male subfertility: improved live-birth rates (OR 4.21) and clinical pregnancy rates (OR 3.43) plus multiple semen parameters — with the authors explicitly cautioning high risk of bias in many included trials and calling for larger, better-designed studies.",
          "To be precise: those numbers apply to antioxidants as a class, not one product — but they give the family Proxeed Men belongs to real biological and statistical weight.",
        ],
      },
      {
        id: "added-ingredients",
        heading: "The added ingredients: individual evidence, not formulation evidence",
        paragraphs: [
          "L-arginine and vitamins D and E each have their own literature in reproductive health, but their combination within Proxeed Men specifically has no published trial. The base is solid and directly evidenced; the layer on top is inferred.",
        ],
      },
      {
        id: "what-it-doesnt-prove",
        heading: "Limits to keep in view",
        bullets: [
          "Pregnancy rates in the 2018 study are a secondary outcome with a limited sample — not proof of \"makes you conceive\".",
          "Population: idiopathic OAT — hormonal, genetic and obstructive causes are outside it.",
          "No trials of the full enhanced formulation itself.",
        ],
        paragraphs: [
          "The standing rules apply: the decision is medical first, and a semen analysis before and after the course is the practical measure of success.",
        ],
      },
      {
        id: "duration",
        heading: "Duration: six months, like the studies",
        paragraphs: [
          "Same as the Proxeed core: six months of consistent use is what the research measured — biologically sensible for the sperm production cycle. Judging earlier is not evidence-based.",
        ],
      },
      {
        id: "compare",
        heading: "If you are comparing before buying",
        bullets: [
          "Compare the core doses (carnitine/acetyl-carnitine) with Proxeed Plus — same scientific family.",
          "Value the added ingredients as individual-level evidence, not formulation-level.",
          "If you want the single strongest published formulation evidence, that is Proxeed Plus; if you prefer a broader blend, know the extra layer is inferential.",
          "A six-month course is the fair unit of accounting.",
        ],
        paragraphs: [
          "Straight summary: Proxeed Men inherits good direct evidence from its scientific family and adds biologically sensible ingredients — but that added layer itself is unstudied. Evidence level: moderate-to-strong by extrapolation.",
        ],
      },
    ],
    sources: [SRC_Busetto, SRC_COCHRANE],
    disclaimer: DISCLAIMER_EN,
  },

  {
    slug: "proxeed-women-inositol-scientific-evidence",
    locale: "en" as Locale,
    title: "Proxeed Women Inositol: Inositol and PCOS — the Strongest Evidence Class in Female Fertility",
    excerpt:
      "A 17-study meta-analysis plus the review behind the international guideline: real gains in clinical pregnancy and embryo quality with PCOS — and an important caution about ovarian reserve markers.",
    sections: [
      {
        id: "who-is-it-for",
        heading: "Who is this for?",
        paragraphs: [
          "Proxeed Women Inositol is an inositol formulation (myo-inositol with D-chiro-inositol). This is the clearest evidence class in female fertility supplements: women with polycystic ovary syndrome (PCOS), particularly those entering assisted reproduction. Without PCOS, you are extrapolating from another population — a material difference.",
        ],
      },
      {
        id: "meta-analysis-2025",
        heading: "The strongest evidence: the 2025 meta-analysis (17 studies)",
        paragraphs: [
          "A systematic review and meta-analysis in the International Journal of Reproductive BioMedicine pooled 17 interventional studies of inositol with ART in PCOS:",
        ],
        bullets: [
          "Clinical pregnancy rate rose significantly: RR 1.64 (95% CI 1.25–2.15) — a substantial relative improvement.",
          "Top-grade embryo rate rose: RR 1.12 (1.02–1.23).",
          "The myo + D-chiro combination appeared stronger than myo-inositol alone in part of the literature.",
        ],
      },
      {
        id: "jcem-2024",
        heading: "The measured view: JCEM 2024 and the international guideline",
        paragraphs: [
          "The JCEM review — which informed the international evidence-based guideline for PCOS — found D-chiro-inositol improved ovulation rates with a large effect (OR 11.5 across two trials) plus benefits in some metabolic measures. The same review states plainly: evidence for pregnancy and live-birth outcomes remains limited and inconclusive, and more rigorous trials are needed.",
          "So: a positive direction, a well-defined population — and a picture still being completed.",
        ],
      },
      {
        id: "amh-caution",
        heading: "An important caution: diminished ovarian reserve",
        paragraphs: [
          "The same 2025 meta-analysis observed reductions in antral follicle count (AFC) and anti-Müllerian hormone (AMH) with use. In plain terms: those are ovarian-reserve markers — which deserves an explicit flag for any woman whose reserve is already low. Discuss this specific point with your fertility doctor before starting, not after.",
        ],
      },
      {
        id: "fit",
        heading: "Who fits — and who does not",
        bullets: [
          "Inside: PCOS with ovulation disruption or entering ART — the strongest evidence.",
          "Outside: natural fertility or other infertility causes — a much weaker extrapolation.",
          "Bigger than the supplement itself: weight management and the treatment plan your doctor sets.",
        ],
        paragraphs: [
          "As everywhere on this blog: the studies measured clinical pregnancy and embryo quality — not live birth. Anyone promising \"restored fertility\" is selling past the science.",
        ],
      },
      {
        id: "duration",
        heading: "Duration and expectations",
        paragraphs: [
          "Inositol studies ran three to six months in most cases, with pre-ART preparation sitting inside that range. Realistic expectations: cycle regularity, ovulation and metabolic markers improve first; ART outcomes are a possible additional gain, not a certainty.",
        ],
      },
      {
        id: "compare",
        heading: "If you are comparing before buying",
        bullets: [
          "Check the myo:D-chiro ratio against the studied formulations (the common scientific standard is 40:1).",
          "If your ovarian reserve markers are already low, discuss the AFC/AMH finding with your doctor first.",
          "Price 3–6 months, not the pack.",
          "Confirm your diagnosis is actually PCOS — the whole evidence base rests on it.",
        ],
        paragraphs: [
          "Straight summary: the strongest evidence class in female fertility supplements — but specifically for PCOS, within defined timeframes, with a legitimate flag on ovarian-reserve markers.",
        ],
      },
    ],
    sources: [SRC_INOSITOL_META, SRC_JCEM],
    disclaimer: DISCLAIMER_EN,
  },

  {
    slug: "proxerex-scientific-evidence",
    locale: "en" as Locale,
    title: "Proxerex: No Studies on the Formulation Itself — and That Is What You Should Know Before Buying",
    excerpt:
      "An honest review: where the evidence for Proxerex's ingredients (carnitine, arginine, zinc, selenium, maca) actually reaches, where it stops — and how to weigh that when comparing.",
    sections: [
      {
        id: "who-is-it-for",
        heading: "Who is this for?",
        paragraphs: [
          "Proxerex is a male formulation combining L-arginine and L-carnitine with niacin, zinc, selenium, maca extract and cocoa, positioned in the context of male fertility and vitality support. Before anything else: this is information to help you compare; the treatment decision belongs with your doctor.",
        ],
      },
      {
        id: "the-honest-start",
        heading: "The first truth: no trials on the formulation",
        paragraphs: [
          "We searched the available evidence: there are no published peer-reviewed clinical trials on the Proxerex formulation itself. That is not an opinion — it is a description of the literature. Anyone telling you \"the product is scientifically studied\" without a published reference bearing its name is misleading you on a detail that matters.",
          "Does that mean the product \"doesn't work\"? No — it means its evidence is inferred: the ingredients have literatures of their own; the specific blend was never measured. That places it one evidence tier below, say, Proxeed Plus, which has direct RCTs.",
        ],
      },
      {
        id: "ingredient-evidence",
        heading: "Where the ingredient evidence reaches",
        bullets: [
          "L-carnitine: the strongest ingredient here — a recent (2026) network meta-analysis confirms improved progressive motility and reduced DNA fragmentation with carnitine supplementation.",
          "L-arginine: mixed — possible gains in count and motility in some populations, not a consistent finding across studies.",
          "Zinc and selenium: essential antioxidants for semen health; deficiency tracks with poorer parameters, and support helps especially where deficiency exists.",
          "Maca: the weakest link — inconsistent human findings; most of its enthusiasm is marketing rather than trial data.",
        ],
        paragraphs: [
          "Note that class-level reviews — like Nutrients 2021 — conclude that combination supplements are promising but lack direct trials, and that formulation quality varies widely from product to product.",
        ],
      },
      {
        id: "what-it-means",
        heading: "What this means for you as a buyer",
        paragraphs: [
          "Practically: you are buying ingredient evidence, not product evidence. If your priority is the heaviest evidence, the same family offers formulations with published RCTs. If broader antioxidant coverage plus zinc/selenium is what you value, that is Proxerex's specific role — stated clearly, not promised vaguely.",
        ],
      },
      {
        id: "duration",
        heading: "Duration: the class rule — 3 to 6 months",
        paragraphs: [
          "The biology of sperm production is the same for any formulation: judgement comes after a complete course, and class studies speak of 3–6 months. The practical measure remains a semen analysis before and after.",
        ],
      },
      {
        id: "compare",
        heading: "If you are comparing before buying",
        bullets: [
          "Compare carnitine and arginine doses per serving against competitors and against the doses used in the literature.",
          "Check zinc/selenium doses are sensible — and not doubled if you already take a multivitamin.",
          "If direct evidence is your top priority, rank products without trials lower.",
          "Keep maca's evidentiary weight low — do not pay for a promise.",
        ],
        paragraphs: [
          "Straight summary: Proxerex stands on ingredient evidence only — some strong (carnitine), some weak (maca). Respecting that difference is what separates a research-based decision from an advertising-based one.",
        ],
      },
    ],
    sources: [SRC_NMA_2026, SRC_LAGANA],
    disclaimer: DISCLAIMER_EN,
  },

  {
    slug: "ellamuselle-scientific-evidence",
    locale: "en" as Locale,
    title: "Ellamuselle: A Female Wellness Supplement — What Science Actually Knows About Its Ingredients",
    excerpt:
      "A wellness product, not a fertility product: a calm review of the arginine, carnitine and zinc evidence — and why botanicals like muira puama and damiana have limited clinical data.",
    sections: [
      {
        id: "what-it-is",
        heading: "What it is — and why the category matters",
        paragraphs: [
          "Ellamuselle is a female sexual-wellness formulation combining L-arginine and propionyl-L-carnitine with botanicals (muira puama, damiana, black cohosh), ginkgo, zinc, niacin and genistein. First transparency point: this is a wellness product, not a fertility product — and marketing that conflates the two conflates two different scientific questions.",
        ],
      },
      {
        id: "no-product-trials",
        heading: "No trials on the formulation itself",
        paragraphs: [
          "As with most blended wellness products: there are no published controlled trials of the Ellamuselle formulation specifically — for its intended effects or anything else. We state this with maximum clarity because it is the foundation of any responsible purchase decision.",
        ],
      },
      {
        id: "mineral-amino-evidence",
        heading: "The non-botanical ingredients: promising, mid-level evidence",
        bullets: [
          "L-arginine: reproductive-medicine reviews (RBMO 2023) report improved endometrial thickness and blood flow in poor responders undergoing IVF — promising evidence in a fertility context.",
          "Propionyl-L-carnitine: part of the carnitine family with solid metabolic literature — in contexts other than this specific wellness use.",
          "Zinc: a documented role in hormonal regulation and antioxidant defence — clearest benefit where deficiency exists.",
        ],
        paragraphs: [
          "Summary of this part: ingredients with biological plausibility and respectable literatures elsewhere — not evidence for the blend or its stated use.",
        ],
      },
      {
        id: "botanical-evidence",
        heading: "The botanicals: honestly the weakest part",
        paragraphs: [
          "A recent (2026) meta-analysis of supplements in ART concluded there is no high-certainty evidence that dietary supplements improve fertility outcomes overall, and that botanicals common in wellness blends — damiana, muira puama, black cohosh — have limited or inconsistent human data on sexual-function and fertility outcomes specifically.",
          "Any subjective effect you notice with a botanical blend may be real as a personal experience — but it is not a published finding, and individual variation always lives inside a wide interval.",
        ],
      },
      {
        id: "what-it-means",
        heading: "What this means for you as a buyer",
        paragraphs: [
          "If you want strong fertility evidence, other products here carry clearly higher evidence tiers (see the general guide). If you want to try a wellness formulation with biologically plausible ingredients, Ellamuselle is available — and we consider stating its low evidence level part of the product.",
        ],
      },
      {
        id: "compare",
        heading: "If you are comparing before buying",
        bullets: [
          "Define your goal precisely: wellness or fertility? It changes which product fits entirely.",
          "Compare doses: botanicals often sit in under-specified blends — ask for the numbers.",
          "If you take medication (especially hormonal or anticoagulants), review the botanicals with your doctor — interactions are possible.",
          "Do not build a decision on testimonials — they are not trials.",
        ],
        paragraphs: [
          "Straight summary: Ellamuselle's evidence level is low — biologically plausible ingredients, an unmeasured blend, and a \"wellness\" not \"fertility\" category. We write this so your decision is made with the full picture.",
        ],
      },
    ],
    sources: [SRC_RBMO, SRC_ART_META_2026],
    disclaimer: DISCLAIMER_EN,
  },
]
