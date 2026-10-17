import type { Article } from "./types";

/**
 * Offline/default source for the articles. Each entry mirrors the client's
 * submitted list, with every bibliographic field corrected against the
 * publisher record and a `reviewNote` recording what changed. Seed source
 * too — `scripts/seed.ts` writes these into Payload, so the CMS is the live
 * source once seeded and this file is the fallback.
 */
export const mockArticles: Article[] = [
  // ─── Proxeed Plus ────────────────────────────────────────────────────────
  {
    id: "art_micic_2019",
    slug: "micic-2019-sperm-parameters-trial",
    title:
      "تجربة عشوائية معشّاة على بروكسيد بلس نفسه: ماذا تغيّر في السائل المنوي؟",
    summary:
      "أقوى دليل مباشر على بروكسيد بلس: تجربة عشوائية مزدوجة التعمية ومقارنة بدواء وهمي على ١٧٥ رجلًا بتشخيص ضعف غير مفسَّر في عدد الحيوانات المنوية وحركتها (idiopathic oligoasthenozoospermia)، لمدة ٦ أشهر.",
    keyFindings: [
      "تحسّن دال في حجم السائل المنوي والحيوية بعد ٦ أشهر (p<0.001).",
      "الحركة التقدمية ارتفعت من ٢٨٪ إلى ٣١٪ — فرق صغير لكنه دال إحصائيًا.",
      "مؤشر تجزّؤ الحمض النووي (DFI) انخفض من ٣٨.٥٪ إلى ٣١٪ (p<0.001).",
      "انخفاض DFI كان أقوى مؤشر مستقل على تحسّن الحركة.",
      "مستوى الكارنيتين في السائل المنوي ارتفع مع الاستخدام وارتبط بتحسّن الحركة.",
      "لم تظهر تغيّرات دالة في مجموعة الدواء الوهمي.",
    ],
    caveat:
      "الدراسة قاست معايير السائل المنوي فقط — لم تقيس نسبة حدوث الحمل ولا الولادة الحية. كما أنها أجريت على حالات ضعف غير مفسَّر السبب، ولا تمتد إلى الأسباب الوراثية أو الانسدادية.",
    productSlug: "proxeed-plus",
    source: {
      title:
        "Double-blind, randomised, placebo-controlled trial on the effect of L-carnitine and L-acetylcarnitine on sperm parameters in men with idiopathic oligoasthenozoospermia",
      authors:
        "Micic S, Lalic N, Djordjevic D, Bojanic N, Bogavac-Stanojevic N, Busetto GM, Virmani A, Agarwal A",
      journal: "Andrologia (Wiley)",
      year: "2019",
      type: "تجربة عشوائية معشّاة مزدوجة ومقارنة بدواء وهمي",
      doi: "10.1111/and.13267",
      pubmedId: "PMC6850469",
    },
    evidenceTier: "direct-rct",
    status: "published",
    translations: {
      en: {
        title:
          "A randomised controlled trial of Proxeed Plus itself: what changed in semen parameters?",
        summary:
          "The strongest direct evidence for Proxeed Plus: a double-blind, placebo-controlled randomised trial in 175 men with idiopathic oligoasthenozoospermia over 6 months.",
        keyFindings: [
          "Significant improvement in semen volume and vitality after 6 months (p<0.001).",
          "Progressive motility rose from 28% to 31% — a small but statistically significant change.",
          "Sperm DNA fragmentation index (DFI) fell from 38.5% to 31% (p<0.001).",
          "The drop in DFI was the strongest independent predictor of improved motility.",
          "Seminal carnitine rose with supplementation and correlated with improved motility.",
          "No significant changes occurred in the placebo group.",
        ],
        caveat:
          "The study measured semen parameters only — it did not measure pregnancy or live-birth rates. It enrolled idiopathic cases, so it does not extend to genetic or obstructive causes.",
        source: { type: "Double-blind, randomised, placebo-controlled trial" },
      },
    },
  },
  {
    id: "art_noegroho_2022",
    slug: "noegroho-2022-antioxidants-dna-fragmentation",
    title:
      "مراجعة منهجية: هل تقلّل مضادات الأكسدة تجزّؤ الحمض النووي للحيوانات المنوية؟",
    summary:
      "مراجعة منهجية حلّلت ٩ دراسات عن مضادات الأكسدة وتجزّؤ الحمض النووي (DFI)، وكانت تركيبة بروكسيد (كارنيتين + أسيتيل كارنيتين + عناصر دقيقة) من بين المكمّلات المدروسة.",
    keyFindings: [
      "أربع دراسات أظهرت انخفاضًا دالًا في DFI — منها تجربة Micic على بروكسيد بلس.",
      "خمس دراسات أظهرت انخفاضًا لكنه غير دال إحصائيًا.",
      "تحسّن في تركيز الحيوانات المنوية وحركتها وشكلها بعد المكمّلات.",
      "معدلات الحمل ذُكرت في ٣ دراسات فقط: ارتفعت في ٢ ولم تتغيّر في ١.",
    ],
    caveat:
      "النتائج مختلطة: ثلثا الدراسات دالّة والثلث الآخر لا. المراجعة تشمل مضادات أكسدة متعددة وتركيبات مختلفة، وليست دراسة على بروكسيد بلس وحده. وبيانات الحمل محدودة جدًا.",
    productSlug: "proxeed-plus",
    source: {
      title:
        "Antioxidant Supplementation on Sperm DNA Fragmentation and Sperm Parameters: A Systematic Review and Meta-Analysis",
      authors: "Noegroho BS, Siregar S, Tampubolon KAG",
      journal: "Turkish Journal of Urology",
      year: "2022",
      type: "مراجعة منهجية وتحليل تلوي",
      doi: "10.5152/tud.2022.22058",
      pubmedId: "PMC9623341",
    },
    evidenceTier: "systematic-review",
    status: "published",
    translations: {
      en: {
        title:
          "A systematic review: do antioxidants reduce sperm DNA fragmentation?",
        summary:
          "A systematic review of 9 studies on antioxidant supplementation and DNA fragmentation (DFI), with the Proxeed formulation among the supplements studied.",
        keyFindings: [
          "Four studies showed a statistically significant reduction in DFI — including the Micic trial of Proxeed Plus.",
          "Five studies showed a reduction that was not statistically significant.",
          "Sperm concentration, motility and morphology improved after supplementation.",
          "Pregnancy rates were reported by only 3 studies: up in 2, unchanged in 1.",
        ],
        caveat:
          "The results are mixed: two thirds of studies were significant, one third were not. The review pools many different antioxidants and formulations rather than Proxeed Plus alone, and the pregnancy data is very limited.",
        source: { type: "Systematic review and meta-analysis" },
      },
    },
  },

  // ─── Proxeed Women ───────────────────────────────────────────────────────
  {
    id: "art_oumaima_2025",
    slug: "oumaima-2025-icsi-outcomes",
    title: "دراسة قبل/بعد: بروكسيد وومان ونتائج حقن البويضة (ICSI)",
    summary:
      "قارنت الدراسة نتائج دورة ICSI ثانية عند سيدات تناولن بروكسيد وومان لمدة شهرين قبل الدورة، مقابل دورتهن الأولى بدون مكمّلات — أي أن كل سيدة كانت مقارنة لنفسها.",
    keyFindings: [
      "نسبة نضج البويضات ارتفعت من ٦٩٪ إلى ٨٤٪.",
      "نسبة الأجنة الجيدة ارتفعت من ٤٠٪ إلى ٦٥٪.",
      "وصلت نسبة البلستوسيست إلى ٤٥٪، والبلستوسيست الأعلى جودة إلى ٤٥.٢٪.",
      "معدل الإخصاب في الدورة الأولى كان ٥٥٪ ومعدل الانقسام ٥٨٪.",
    ],
    caveat:
      "تصميم «قبل/بعد» بدون عشوائية وبدون مجموعة ضابطة، وهو منشور كملخص مؤتمر بلا تفاصيل كافية. النتائج مختبرية (بويضات وأجنة) ولا تقيس حدوث الحمل أو الولادة الحية.",
    productSlug: "proxeed-women",
    source: {
      title:
        "Comparison of ICSI results in a group of patients with and without oral L-carnitine, acetyl-L-carnitine and nutrients supplementation",
      authors:
        "Oumaima G, Trabelsi N, Ghodhbene E, Bouhlel F, Mustapha H, Ajina M",
      journal: "Medical Journal of Malaysia (MJM) — ملخص مؤتمر OGSM 2025",
      year: "2025",
      type: "دراسة قبل/بعد (ملخص مؤتمر)",
      url: "https://www.e-mjm.org/2025/v80s5/PP-03.pdf",
    },
    evidenceTier: "direct-other",
    status: "published",
    reviewNote:
      "المجلة كانت مكتوبة خطأً (EMHJ/WHO) والصحيح Medical Journal of Malaysia؛ وهي ملخص مؤتمر بلا DOI، ونُشرت مع توضيح ذلك للقارئ — والمصدر الأصلي يبقى موثّقًا هنا.",
    translations: {
      en: {
        title: "A before-and-after study: Proxeed Women and ICSI outcomes",
        summary:
          "The study compared a second ICSI cycle in women who took Proxeed Women for two months beforehand against their own first cycle without supplementation.",
        keyFindings: [
          "Oocyte maturation rate rose from 69% to 84%.",
          "Good-embryo rate rose from 40% to 65%.",
          "Blastocyst rate reached 45%, and top-quality blastocyst rate 45.2%.",
          "First-cycle fertilisation rate was 55% and cleavage rate 58%.",
        ],
        caveat:
          "Before-and-after design with no randomisation and no control group, published as a conference abstract with limited detail. The outcomes are laboratory measures (oocytes and embryos), not pregnancy or live birth.",
        source: {
          journal:
            "Medical Journal of Malaysia (MJM) — OGSM 2025 conference abstract",
          type: "Before-and-after study (conference abstract)",
        },
      },
    },
  },
  {
    id: "art_agarwal_2018",
    slug: "agarwal-2018-l-carnitine-female-infertility",
    title: "دور الكارنيتين في خصوبة النساء: ماذا يقول الدليل؟",
    summary:
      "مراجعة سردية شاملة لدور L-carnitine في الصحة الإنجابية للمرأة — وهو المكوّن الأساسي في بروكسيد وومان.",
    keyFindings: [
      "الكارنيتين موجود بتركيزات عالية في الجهاز التناسلي الأنثوي ويلعب دورًا في استقلاب الطاقة.",
      "يدعم نضج البويضة وتطوّر الجنين.",
      "تكميمه يقلّل تلف الهيكل الخلوي للبويضة ويقلّل موت الأجنة في تجارب IVF.",
      "نقص الكارنيتين مرتبط بجودة بويضات أقل.",
      "قد يفيد السيدات ذوات الاحتياطي المبيضي المنخفض أو اللواتي يخضن الإخصاب المساعد.",
    ],
    caveat:
      "مراجعة وليست دراسة أصلية، والدليل فيها على مستوى المكوّن (ال كارنيتين) لا على تركيبة بروكسيد وومان نفسها. والأقوى في حالات الإجهاد التأكسدي ودعم IVF، لا في كل أسباب العقم.",
    productSlug: "proxeed-women",
    source: {
      title: "Role of L-carnitine in Female Infertility",
      authors: "Agarwal A, Virmani A, Busetto GM, et al.",
      journal: "Reproductive Biology and Endocrinology (BioMed Central)",
      year: "2018",
      type: "مراجعة سردية",
      doi: "10.1186/s12958-018-0323-4",
    },
    evidenceTier: "ingredient",
    status: "published",
    translations: {
      en: {
        title: "L-carnitine in female fertility: what does the evidence say?",
        summary:
          "A comprehensive narrative review of L-carnitine in women's reproductive health — the core ingredient of Proxeed Women.",
        keyFindings: [
          "Carnitine is present at high concentrations in the female reproductive tract and plays a role in energy metabolism.",
          "It supports oocyte maturation and embryo development.",
          "Supplementation reduces oocyte cytoskeleton damage and embryo apoptosis in IVF research.",
          "Carnitine deficiency is associated with poorer oocyte quality.",
          "It may benefit women with diminished ovarian reserve or undergoing assisted reproduction.",
        ],
        caveat:
          "It is a review rather than original research, and the evidence is ingredient-level (L-carnitine), not on the Proxeed Women formulation itself. It is strongest for oxidative-stress-related issues and IVF support, not all causes of infertility.",
        source: { type: "Narrative review" },
      },
    },
  },

  // ─── Proxerex ────────────────────────────────────────────────────────────
  {
    id: "art_vitagliano_2021",
    slug: "vitagliano-2021-supplement-composition",
    title: "مراجعة نقدية: ما الذي يوجد فعلًا داخل مكمّلات الخصوبة؟",
    summary:
      "مراجعة نقدية لتركيب ٢٤ مكمّلًا للخصوبة: قارنت المكوّنات المذكورة على العبوة بما هو مدعوم بالدراسات، وبالجرعات المستخدمة فعلًا في تلك الدراسات.",
    keyFindings: [
      "٧٥٪ من المكمّلات المدروسة احتوت على الأقل مكوّنًا واحدًا بلا دليل فعالية.",
      "أكثر من نصف التركيبات كان فيها مكوّن بجرعة أقل من الجرعة الفعّالة المدروسة.",
      "مكمّل واحد فقط كان يحتوي حصريًا على مكوّنات لها دليل فعالية وبجرعات كافية.",
    ],
    caveat:
      "الورقة عن مكمّلات خصوبة النساء — وليست عن Proxerex ولا عن صحة الرجال — ونتيجتها نقدية لتركيبات المكمّلات عمومًا. لذلك لم تُربط بأي منتج في الموقع: صلتها بالمنتجات غير مباشرة ولا تدعم أي ادعاء خاص بأي منها.",
    productSlug: "",
    source: {
      title:
        "Dietary Supplements for Female Infertility: A Critical Review of Their Composition",
      authors:
        "Vitagliano A, Petre GC, Francini-Pesenti F, De Toni L, Di Nisio A, Grande G, Foresta C, Garolla A",
      journal: "Nutrients (MDPI)",
      year: "2021",
      type: "مراجعة نقدية",
      doi: "10.3390/nu13103552",
      pubmedId: "PMC8541636",
    },
    evidenceTier: "ingredient",
    status: "published",
    reviewNote:
      "كانت مُدرَجة تحت Proxerex بمؤلف وDOI وعنوان مغلوطة (Laganà / nu13103502 / «Their Efficacy»)، والصحيح Vitagliano / nu13103552 / «Their Composition». والأهم: الورقة عن خصوبة النساء، ونتيجتها نقدية لا مؤيدة — فربطها بمنتج رجالي مضلّل. نُشرت بعد التصحيح وبلا ارتباط بأي منتج.",
    translations: {
      en: {
        title:
          "A critical review: what is actually inside fertility supplements?",
        summary:
          "A critical review of the composition of 24 fertility supplements: it compared the ingredients listed on the label against what the studies support, and against the doses those studies actually used.",
        keyFindings: [
          "75% of the studied supplements contained at least one ingredient with no evidence of efficacy.",
          "Over half of the formulations contained an ingredient below the studied effective dose.",
          "Only one supplement contained exclusively evidence-backed ingredients at adequate doses.",
        ],
        caveat:
          "The paper is about women's fertility supplements — not Proxerex and not men's health — and its conclusion is critical of supplement formulations generally. It is therefore not linked to any product on this site: the relevance is indirect and it supports no product-specific claim.",
        source: { type: "Critical review" },
      },
    },
  },
  {
    id: "art_melhem_2026",
    slug: "melhem-2026-idiopathic-male-infertility",
    title: "أحدث مراجعة شاملة لعلاجات ضعف الخصوبة الذكرية مجهول السبب",
    summary:
      "مراجعة منهجية وتحليل تلوي ضمّ ٤١ تجربة عشوائية على ٣٦١٥ رجلًا، وقارنت فئات العلاجات الدوائية والغذائية في حالات الضعف مجهول السبب.",
    keyFindings: [
      "مضادات الأكسدة ارتبطت بقيم أفضل في عدة معايير منوية.",
      "درجة اليقين في هذا الارتباط منخفضة جدًا، وفواصل التوقعات واسعة تشمل الصفر.",
      "عدم التجانس بين الدراسات مرتفع (>٨٠٪)، ما يعني أن النتائج ليست متسقة عبر الدراسات.",
      "الورقة توصي بتجارب أكبر تقيس نتائج نهائية مثل الولادة الحية.",
    ],
    caveat:
      "الورقة نفسها تقول إن درجة اليقين «منخفضة جدًا»، وإن النتائج المتجمّعة تمثّل متوسطات لتأثيرات متباينة. وهي عن فئات العلاجات عمومًا، لا عن Proxerex تحديدًا — الذي لم تُجرَ عليه أي تجربة سريرية منشورة.",
    productSlug: "proxerex",
    source: {
      title:
        "Pharmacologic and Nutritional Therapies in Idiopathic Male Infertility: A Systematic Review and Meta-Analysis",
      authors:
        "Melhem SJ, Melhem M, Haddad R, Alghurabi O, Mousa R, Massad E, Almomani H, Alrashdan Y, Melhem J",
      journal: "Andrology (Wiley)",
      year: "2026",
      type: "مراجعة منهجية وتحليل تلوي",
      doi: "10.1111/andr.70266",
      pubmedId: "PMC13432660",
    },
    evidenceTier: "systematic-review",
    status: "published",
    reviewNote:
      "المجلة كانت مكتوبة Journal of Urology والصحيح Andrology 2026;14(6):1731-1756. والأهم أن الملخص المرسل وصف النتائج بأنها «moderate-quality»، بينما الورقة تصفها بـ«very low certainty» مع فواصل ثقة تشمل الصفر — نُشرت الصياغة المطابقة للورقة.",
    translations: {
      en: {
        title:
          "The newest synthesis of therapies for idiopathic male infertility",
        summary:
          "A systematic review and meta-analysis of 41 randomised trials in 3,615 men, comparing classes of pharmacological and nutritional treatment for idiopathic infertility.",
        keyFindings: [
          "Antioxidants were associated with higher values for several semen parameters.",
          "Certainty in that association is very low, and prediction intervals are wide and include the null.",
          "Heterogeneity between studies was substantial (>80%), meaning results are not consistent.",
          "The authors call for larger trials reporting hard outcomes such as live birth.",
        ],
        caveat:
          "The paper itself describes the certainty as “very low” and notes the pooled estimates average diverse effects. It covers treatment classes in general, not Proxerex — which has no published clinical trial of its own.",
        source: {
          journal: "Andrology (Wiley)",
          type: "Systematic review and meta-analysis",
        },
      },
    },
  },

  // ─── Ellamuselle ─────────────────────────────────────────────────────────
  {
    id: "art_hart_2024",
    slug: "hart-2024-nutritional-supplements-ivf",
    title: "مكمّلات IVF: أيّها يقف على دليل فعلي؟",
    summary:
      "مراجعة منهجية للمكمّلات الغذائية المستخدمة أثناء علاج IVF، قارنت DHEA والمالاتونين وCoQ10 والكارنيتين والسيلينيوم وفيتامين D والميو-إينوزيتول وأوميغا-٣ والأعشاب الصينية.",
    keyFindings: [
      "اتباع نظام غذائي متوسطي (Mediterranean) هو التوصية الأوضح دليلًا بين كل ما رُوجع.",
      "DHEA وCoQ10 قبل بدء دورة التنشيط أفضل من المجموعات الضابطة في الاستجابة المبيضية.",
      "الميو-إينوزيتول قد يفيد مريضات تكيّس المبايض، لكن نظام الجرعة غير محدد.",
      "أوميغا-٣ قد يحسّن بعض النتائج السريرية والجنينية.",
      "الورقة تنص على أنه لا يبدو هناك دليل يدعم استخدام الكارنيتين كمكمّل في علاج IVF.",
    ],
    caveat:
      "نتائج الورقة لا تدعم استخدام هذا المنتج في سياق الخصوبة، ولم تراجع L-arginine من الأصل — وهي عن علاج IVF لا عن الصحة الجنسية. لذلك نُشرت كموضوع علمي عام دون ربطها بأي منتج.",
    productSlug: "",
    source: {
      title: "Nutritional supplements and IVF: an evidence-based approach",
      authors: "Hart RJ",
      journal: "Reproductive BioMedicine Online",
      year: "2024",
      type: "مراجعة منهجية",
      doi: "10.1016/j.rbmo.2023.103770",
    },
    evidenceTier: "systematic-review",
    status: "published",
    reviewNote:
      "الملخص المرسل نسب إلى الورقة أن الكارنيتين «حسّن جودة البويضات» — والورقة تقول العكس صريحًا («لا يبدو أن هناك دليلًا يدعم استخدام L-carnitine في IVF»). كذلك L-arginine غير مذكور فيها أصلًا، والـDOI والمؤلف مغلوطان. أُصلح المؤلف والـDOI، ونُشرت كموضوع علمي عام غير مرتبط بأي منتج.",
    translations: {
      en: {
        title: "IVF supplements: which ones actually stand on evidence?",
        summary:
          "A systematic review of nutritional supplements used during IVF, covering DHEA, melatonin, CoQ10, carnitine, selenium, vitamin D, myo-inositol, omega-3 and Chinese herbs.",
        keyFindings: [
          "A Mediterranean diet is the recommendation with the clearest supporting evidence of everything reviewed.",
          "DHEA and CoQ10 before cycle start outperform control therapies for ovarian response.",
          "Myo-inositol may benefit women with PCOS, but the dosing regimen is unclear.",
          "Omega-3 may improve some clinical and embryological outcomes.",
          "The paper states there appears to be no evidence supporting L-carnitine as an IVF supplement.",
        ],
        caveat:
          "The findings do not support this product in a fertility context, and L-arginine was never reviewed — the paper concerns IVF treatment, not sexual wellness. It is therefore not linked to any product here and appears as a general scientific topic only.",
        source: { type: "Systematic review" },
      },
    },
  },
  {
    id: "art_michaelsen_2026",
    slug: "michaelsen-2026-dietary-supplements-female-infertility",
    title: "مراجعة ٢٠٢٦: هل تحسّن المكمّلات نتائج العقم عند النساء؟",
    summary:
      "مراجعة منهجية وتحليل تلوي شمل ٤٠ دراسة، قارنت المكمّلات الغذائية بالدواء الوهمي أو بعدم العلاج في حالات العقم عند النساء، وقيّمت سُمك بطانة الرحم والحمل والولادة الحية والإجهاض.",
    keyFindings: [
      "لا يوجد دليل عالي اليقين على أن المكمّلات تحسّن نتائج العقم عند النساء مقابل الدواء الوهمي.",
      "N-acetyl-cysteine حسّن سُمك بطانة الرحم.",
      "تحليل ثانوي (بتحيّز أعلى) يطرح فرضيات لصالح الميو-إينوزيتول وNAC وفيتامين D وفيتامين E والمكمّلات متعددة المكوّنات.",
      "معظم الدراسات المشمولة كان فيها ما يستدعي القلق من حيث التحيز.",
    ],
    caveat:
      "الورقة عن الخصوبة والعلاج المساعد، وليست عن الصحة الجنسية أو الرغبة — وهي لا تذكر الأعشاب المستخدمة في مكمّلات الصحة الجنسية إطلاقًا، لذلك لا تصح الاستشهاد بها على أي ادعاء عن الرغبة أو الأداء.",
    productSlug: "ellamuselle",
    source: {
      title:
        "The Effect of Dietary Supplements on Female Infertility in Terms of Endometrial Thickness, Pregnancy, Live Birth and Miscarriage: A Systematic Review and Meta-Analysis",
      authors:
        "Michaelsen MP, Poulsen M, Borgstrøm M, Wisby HB, Bjerregaard AA, Kesmodel US",
      journal: "Nutrients (MDPI)",
      year: "2026",
      type: "مراجعة منهجية وتحليل تلوي",
      doi: "10.3390/nu18121942",
      pubmedId: "PMC13306041",
    },
    evidenceTier: "ingredient",
    status: "published",
    reviewNote:
      "العنوان كان مبتورًا وأُكمل، وأُضيف الـDOI والمؤلفون. وحُذفت جملة نسبت للورقة حديثًا عن damiana/muira puama/black cohosh — هذه الأعشاب غير مذكورة فيها إطلاقًا. نُشرت بالصياغة المصحّحة.",
    translations: {
      en: {
        title:
          "A 2026 review: do supplements improve outcomes in female infertility?",
        summary:
          "A systematic review and meta-analysis of 40 studies comparing dietary supplements with placebo or no treatment in female infertility, assessing endometrial thickness, pregnancy, live birth and miscarriage.",
        keyFindings: [
          "There is no high-certainty evidence that supplements improve female infertility outcomes versus placebo.",
          "N-acetyl-cysteine improved endometrial thickness.",
          "Secondary analyses (at higher risk of bias) raise hypotheses for myo-inositol, NAC, vitamin D, vitamin E and multi-substance supplements.",
          "Most included studies raised some concerns for risk of bias.",
        ],
        caveat:
          "The paper concerns fertility and assisted reproduction — not sexual wellness or desire — and it does not mention the botanicals used in sexual-wellness supplements at all, so it cannot support any claim about desire or performance.",
        source: { type: "Systematic review and meta-analysis" },
      },
    },
  },

  // ─── Proxeed Men ─────────────────────────────────────────────────────────
  {
    id: "art_busetto_2018",
    slug: "busetto-2018-oat-with-and-without-varicocele",
    title:
      "تجربة معشّاة: بروكسيد وتأثيره على معايير السائل المنوي مع وبدون القيلة الدموية",
    summary:
      "تجربة عشوائية مزدوجة التعمية ومقارنة بدواء وهمي على ١٠٤ رجال بتشخيص خلل في العدد والحركة والشكل (OAT)، مع أو بدون قيلة دموية (varicocele)، لمدة ٦ أشهر على تركيبة بروكسيد.",
    keyFindings: [
      "تحسّن دال في العدد الكلي للحيوانات المنوية والحركة التقدمية والشكل مقابل الدواء الوهمي.",
      "انخفاض دال في تجزّؤ الحمض النووي (DFI).",
      "حدوث ١٠ حالات حمل تلقائي في مجموعة العلاج مقابل ٢ في مجموعة الدواء الوهمي.",
      "النتائج ظهرت في المشاركين سواء كانوا مصابين بقيلة دموية أو لا.",
    ],
    caveat:
      "الحمل كان نتيجة ثانوية وليس الهدف الأساسي للدراسة، والأعداد صغيرة. والدراسة على حالات مجهولة السبب، ولا تمتد إلى الأسباب الوراثية أو الانسدادية. كما أنها أُجريت على تركيبة بروكسيد بلس — وProxeed Men نسخة مطوّرة لم تُدرس مستقلًا.",
    productSlug: "proxeed-men",
    source: {
      title:
        "Effect of metabolic and antioxidant supplementation on sperm parameters in oligo-astheno-teratozoospermia, with and without varicocele: a double-blind placebo-controlled study",
      authors:
        "Busetto GM, Agarwal A, Virmani A, Antonini G, Ragonesi G, et al.",
      journal: "Andrologia (Wiley)",
      year: "2018",
      type: "تجربة عشوائية معشّاة مزدوجة ومقارنة بدواء وهمي",
      doi: "10.1111/and.12927",
    },
    evidenceTier: "direct-rct",
    status: "published",
    translations: {
      en: {
        title:
          "A placebo-controlled trial: sperm parameters with and without varicocele",
        summary:
          "A double-blind, placebo-controlled randomised trial in 104 men with oligo-astheno-teratozoospermia, with or without varicocele, over 6 months on the Proxeed formulation.",
        keyFindings: [
          "Significant improvement in total sperm count, progressive motility and morphology versus placebo.",
          "Significant reduction in DNA fragmentation (DFI).",
          "Ten spontaneous pregnancies occurred in the treatment group versus 2 in the placebo group.",
          "Benefits were observed both in men with varicocele and without it.",
        ],
        caveat:
          "Pregnancy was a secondary outcome rather than the study's primary aim, and the numbers are small. The trial enrolled idiopathic cases, so it does not extend to genetic or obstructive causes. It studied the Proxeed Plus formulation — Proxeed Men is an enhanced version that has not been studied independently.",
        source: { type: "Double-blind, placebo-controlled randomised trial" },
      },
    },
  },
  {
    id: "art_de_ligny_2022",
    slug: "de-ligny-2022-cochrane-antioxidants-male-subfertility",
    title:
      "مراجعة كوكرين: مضادات الأكسدة وخصوبة الرجال — ما يقوله الدليل فعلًا",
    summary:
      "مراجعة كوكرين المنهجية ضمّت ٦١ تجربة عشوائية على ٦٢٦٤ رجلًا، وقارنت مضادات أكسدة مختلفة بالدواء الوهمي أو عدم العلاج. هذه هي النسخة المحدَّثة المنشورة في ٢٠٢٢.",
    keyFindings: [
      "الولادة الحية: OR 1.43 (فاصل ثقة 1.07–1.91)، بدرجة يقين «منخفضة جدًا» — أي أثر محتمل لكن الدليل ضعيف.",
      "الحمل السريري: OR 1.89 (1.45–2.47)، بدرجة يقين «منخفضة».",
      "عند استبعاد الدراسات عالية التحيز من التحليل: لا يبقى دليل على تحسّن الولادة الحية.",
      "المضادات المركّبة تحديدًا لم تُظهر تحسّنًا في الحمل أو الولادة الحية.",
      "النتائج مبنية على ٢٤٦ ولادة حية فقط من ١٢٨٣ زوجًا في ١٢ دراسة صغيرة أو متوسطة.",
    ],
    caveat:
      "الأرقام المنشورة هنا هي أرقام كوكرين الأصلية. لا يصح الاستشهاد بهذه المراجعة على أن مضادات الأكسدة «تضمن» الحمل: درجة اليقين منخفضة، والأثر يختفي عند إزالة الدراسات الأضعف، والمراجعة عن فئات مضادات الأكسدة جميعًا لا عن منتج بعينه.",
    productSlug: "proxeed-men",
    source: {
      title: "Antioxidants for male subfertility",
      authors:
        "de Ligny W, Smits RM, Mackenzie-Proctor R, Jordan V, Fleischer K, de Bruin JP, Showell MG",
      journal: "Cochrane Database of Systematic Reviews",
      year: "2022",
      type: "مراجعة منهجية وتحليل تلوي (Cochrane)",
      doi: "10.1002/14651858.CD007411.pub5",
      pubmedId: "PMC9066298",
    },
    evidenceTier: "systematic-review",
    status: "published",
    reviewNote:
      "الملخص المرسل نسب إلى هذه المراجعة أرقامًا غير صحيحة (OR 4.21 للولادة الحية و3.43 للحمل) ومؤلفًا غير صحيح (Showell بدل de Ligny)، ووصفها بأنها دليل قوي — بينما الورقة تقول إن اليقين «منخفض جدًا» وإن الأثر يختفي بعد استبعاد الدراسات عالية التحيز. نُشر المقال بأرقام كوكرين الصحيحة (1.43 / 1.89) وبدرجة اليقين المنخفضة؛ والأرقام المرسلة لم تُنشر ولا تظهر إلا في هذه الملاحظة الداخلية.",
    translations: {
      en: {
        title:
          "A Cochrane review: antioxidants and male fertility — what the evidence actually says",
        summary:
          "The Cochrane systematic review includes 61 randomised trials in 6,264 men, comparing various antioxidants against placebo or no treatment. This is the 2022 updated version.",
        keyFindings: [
          "Live birth: OR 1.43 (95% CI 1.07–1.91) on “very low” certainty evidence — a possible effect on weak evidence.",
          "Clinical pregnancy: OR 1.89 (1.45–2.47) on “low” certainty evidence.",
          "When studies at high risk of bias are removed, no evidence of increased live birth remains.",
          "Combined antioxidants specifically showed no improvement in pregnancy or live birth.",
          "The findings rest on only 246 live births from 1,283 couples across 12 small or medium-sized studies.",
        ],
        caveat:
          "The figures published here are Cochrane's own. This review cannot be cited to say antioxidants “guarantee” pregnancy: certainty is low, the effect disappears when weaker studies are removed, and the review covers antioxidant classes as a whole, not any single product.",
        source: { type: "Systematic review and meta-analysis (Cochrane)" },
      },
    },
  },

  // ─── Proxeed Women Inositol ──────────────────────────────────────────────
  {
    id: "art_akbari_sene_2025",
    slug: "akbari-sene-2025-myo-inositol-art-pcos",
    title:
      "تحليل تلوي: الميو-إينوزيتول ونتائج الإخصاب المساعد في تكيّس المبايض",
    summary:
      "تحليل تلوي ضمّ ١٧ دراسة تدخّل عن ميو-إينوزيتول / D-chiro-inositol في مريضات تكيّس المبايض (PCOS) الخاضعات لتقنيات الإخصاب المساعد.",
    keyFindings: [
      "زيادة دالة في معدل الحمل السريري (RR 1.64، فاصل ثقة 1.25–2.15).",
      "زيادة دالة في نسبة الأجنة الأعلى جودة (RR 1.12، 1.02–1.23).",
      "انخفاض في عدد الجريبات الغارية (WMD −0.78).",
      "انخفاض في مستوى هرمون AMH (WMD −0.46).",
    ],
    caveat:
      "الدليل خاص بمريضات تكيّس المبايض في دورات الإخصاب المساعد، ولا يمتد إلى الخصوبة عمومًا أو الحمل الطبيعي. والانخفاض في AMH وعدد الجريبات ملاحظة تستدعي الحذر لدى ذوات الاحتياطي المبيضي المنخفض — وهو ما ذكرته الورقة نفسها. كما أن المنتج نفسه لم يُدرس، والأدلة على مستوى المكوّن.",
    productSlug: "proxeed-women-inositol",
    source: {
      title:
        "The effect of myo-inositol on assisted reproductive technology outcomes in women with polycystic ovarian syndrome: a systematic review and meta-analysis of randomized clinical trial studies",
      authors:
        "Akbari Sene A, Saeedzarandi M, Yazdizadeh M, Ghaffari SR, Amjadi F, Zandieh Z, Moradi Y",
      journal: "International Journal of Reproductive BioMedicine",
      year: "2025",
      type: "مراجعة منهجية وتحليل تلوي",
      doi: "10.18502/ijrm.v23i5.19260",
      pubmedId: "PMC12413536",
    },
    evidenceTier: "systematic-review",
    status: "published",
    translations: {
      en: {
        title: "A meta-analysis: myo-inositol and ART outcomes in PCOS",
        summary:
          "A meta-analysis of 17 intervention studies on myo-inositol / D-chiro-inositol in women with PCOS undergoing assisted reproductive technology.",
        keyFindings: [
          "A significant increase in clinical pregnancy rate (RR 1.64, 95% CI 1.25–2.15).",
          "A significant increase in top-grade embryo rate (RR 1.12, 1.02–1.23).",
          "A reduction in antral follicle count (WMD −0.78).",
          "A reduction in anti-Müllerian hormone (AMH) levels (WMD −0.46).",
        ],
        caveat:
          "The evidence is specific to women with PCOS undergoing ART and does not extend to fertility generally or natural conception. The reduction in AMH and antral follicle count is a caution for women with diminished ovarian reserve — the paper itself notes it. The product itself has not been studied; the evidence is ingredient-level.",
        source: { type: "Systematic review and meta-analysis" },
      },
    },
  },
  {
    id: "art_fitz_2024",
    slug: "fitz-2024-inositol-pcos-guidelines",
    title:
      "الإينوزيتول وتكيّس المبايض: المراجعة التي بنت عليها الإرشادات الدولية",
    summary:
      "مراجعة منهجية وتحليل تلوي ضمّ ٣٠ تجربة على ٢٢٣٠ امرأة، أُجريت لتغذية التحديث ٢٠٢٣ للإرشادات الدولية لتكيّس المبايض.",
    keyFindings: [
      "D-chiro-inositol حسّن معدل التبويض مقابل الدواء الوهمي (OR 11.5) في التحليل التلوي لدراستين فقط.",
      "فوائد لبعض المقاييس الأيضية مع الميو-إينوزيتول أو الـD-chiro.",
      "قد لا يكون للإينوزيتول أي تأثير على نتائج أخرى.",
      "الورقة تصف الأدلة بالمحدودة وغير القاطعة لمعظم النتائج، وتطالب بتجارب أكثر صرامة.",
    ],
    caveat:
      "الدليل خاص بمريضات تكيّس المبايض وبنتائج التبويض والمقاييس الأيضية، وليس علاجًا للعقم عمومًا. والتحليل الرئيسي لمعدل التبويض مبني على دراستين صغيرتين فقط.",
    productSlug: "proxeed-women-inositol",
    source: {
      title:
        "Inositol for Polycystic Ovary Syndrome: A Systematic Review and Meta-analysis to Inform the 2023 Update of the International Evidence-based PCOS Guidelines",
      authors: "Fitz V, Graca S, Mahalingaiah S, Liu J, Lai L, Butt A, et al.",
      journal:
        "The Journal of Clinical Endocrinology & Metabolism (Oxford Academic)",
      year: "2024",
      type: "مراجعة منهجية وتحليل تلوي",
      doi: "10.1210/clinem/dgad762",
    },
    evidenceTier: "systematic-review",
    status: "published",
    reviewNote:
      "كان المؤلِّف مكتوبًا «Fitz-Henry A» والصحيح Fitz V، والـDOI كان dgae054 والصحيح dgad762. أُصلح الاثنان ونُشر المقال.",
    translations: {
      en: {
        title:
          "Inositol and PCOS: the review that informed the international guideline",
        summary:
          "A systematic review and meta-analysis of 30 trials in 2,230 women, conducted to inform the 2023 update of the international evidence-based PCOS guideline.",
        keyFindings: [
          "D-chiro-inositol improved ovulation rate versus placebo (OR 11.5) in a meta-analysis of only 2 trials.",
          "Benefits for some metabolic measures with myo-inositol or D-chiro-inositol.",
          "Inositol may have no effect on other outcomes.",
          "The paper describes the evidence as limited and inconclusive for most outcomes and calls for more rigorous trials.",
        ],
        caveat:
          "The evidence is specific to women with PCOS and to ovulation and metabolic measures — it is not a treatment for infertility generally. The ovulation meta-analysis rests on only two small trials.",
        source: { type: "Systematic review and meta-analysis" },
      },
    },
  },
];
