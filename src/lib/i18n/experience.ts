import type { Locale } from "./config"

/** UI copy only. Product/medical claims continue to come from the catalog. */
const copy = {
  ar: {
    edition: "صحة أوضح. اختيار أهدى.",
    collection: "اختيارات تستحق اهتمامك",
    explore: "اكتشف المجموعة",
    heroTitle: "صحتك أولًا.\nوالاختيار أوضح.",
    heroLead:
      "منتجات صحية من مصادر أوروبية، ومعلومات واضحة تساعدك تختار بثقة. اكتشف مجموعتنا، واقرأ الدليل، وخد وقتك في الاختيار.",
    heroNote: "من أوروبا، لعنايتك في مصر",
    curated: "اكتشف. افهم. اختار.",
    productIndex: "من مجموعتنا",
    scroll: "ابدأ رحلتك",
    since: "معك منذ 2019",
    collectionNote: "مكملات غذائية وأجهزة طبية. لكل احتياج طريق أوضح.",
    needNumber: "مسارات للعناية",
    viewCollection: "كل المنتجات",
    details: "اعرف المنتج",
    support: "محتاج مساعدة في الاختيار؟",
    supportBody:
      "المعلومة الصح بداية الاختيار الصح. فريقنا هنا لمعلومات المنتجات، والتوريد، وتفاصيل الطلب.",
    supportNote: "معلومات المنتجات لا تغني عن استشارة المختص.",
    proofTitle: "الثقة مش مجرد كلمة.",
    proofBody: "اعرف المصدر. راجع المعلومة. واقرأ النشرة الرسمية قبل ما تقرر.",
    search: "ابحث باسم المنتج أو وصفه",
    searchLabel: "ابحث في المنتجات",
    refine: "اختار اللي يناسبك",
    sort: "ترتيب المنتجات",
    ascending: "الاسم: أ — ي",
    descending: "الاسم: ي — أ",
    reset: "مسح الفلاتر",
    results: "المنتجات",
    all: "كل الاحتياجات",
    skip: "تجاوز إلى المحتوى",
    retry: "حاول تاني",
    errorTitle: "حصل عطل مؤقت",
    errorBody:
      "مقدرناش نحمّل البيانات دلوقتي. جرّب مرة تانية أو ارجع للرئيسية.",
    home: "الرئيسية",
    wishlistError:
      "مقدرناش نحمّل المفضلة. اختياراتك محفوظة على الجهاز؛ حاول مرة تانية.",
    deleteError: "مقدرناش نحذف العنوان. جرّب مرة تانية.",
    preview:
      "معاينة تصميم — الكتالوج والأسعار تجريبية. الشراء والحساب محتاجين خدمة التجارة.",
    priceUnavailable: "السعر عند التأكيد",
    priceDemo: "سعر تجريبي للمعاينة",
    priceLive: "يتأكد السعر النهائي والتوفر في السلة.",
    contactContext: "استفسار عن المنتج",
    evidenceSource: "معلومات المنتج والنشرات الرسمية",
    availabilityNote: "التوفر النهائي يتحدد عند الطلب.",
  },
  en: {
    edition: "A little clarity. Better choices.",
    collection: "Worth a closer look",
    explore: "Explore the collection",
    heroTitle: "Your health first.\nA clearer choice.",
    heroLead:
      "European-sourced health products. Clear information. A considered collection to explore at your own pace, with the evidence always close by.",
    heroNote: "European origin. Care in Egypt.",
    curated: "Discover. Understand. Choose.",
    productIndex: "In the collection",
    scroll: "Start exploring",
    since: "Here since 2019",
    collectionNote:
      "Food supplements and medical devices. A clearer path to what you need.",
    needNumber: "Paths to care",
    viewCollection: "All products",
    details: "Meet the product",
    support: "A question before you choose?",
    supportBody:
      "Good information comes first. Talk to our team about the products, supply partnerships, or the details of your order.",
    supportNote:
      "Product information is not a substitute for professional medical advice.",
    proofTitle: "Trust, with something behind it.",
    proofBody:
      "Know the source. Understand the information. Read the official leaflet before you decide.",
    search: "Search by product name or description",
    searchLabel: "Search products",
    refine: "Find your fit",
    sort: "Sort products",
    ascending: "Name: A — Z",
    descending: "Name: Z — A",
    reset: "Clear filters",
    results: "The collection",
    all: "All needs",
    skip: "Skip to content",
    retry: "Try again",
    errorTitle: "A temporary interruption",
    errorBody:
      "We couldn’t load the information just now. Please try again or return to the homepage.",
    home: "Home",
    wishlistError:
      "We couldn’t load your wishlist. Your choices are still saved on this device. Please try again.",
    deleteError: "We couldn’t delete the address. Please try again.",
    preview:
      "Design preview — demo catalog and prices. Checkout and accounts require the commerce service.",
    priceUnavailable: "Price on confirmation",
    priceDemo: "Demo price · preview only",
    priceLive: "Final price and availability are confirmed in your cart.",
    contactContext: "Product inquiry",
    evidenceSource: "Product information & official leaflets",
    availabilityNote: "Final availability is confirmed when ordering.",
  },
} as const

export function getExperienceCopy(locale: Locale) {
  return copy[locale]
}
