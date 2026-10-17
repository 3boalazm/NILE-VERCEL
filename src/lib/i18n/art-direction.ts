import type { Locale } from "./config"

const copy = {
  ar: {
    eyebrow: "نايل فارما فود / عناية من أصلها",
    title: "خبرة من أوروبا.",
    accent: "وعناية أقرب لك.",
    intro:
      "وراء كل منتج، مصدر يستحق الثقة. وبين كل سؤال واختيار، معلومة تستحق تعرفها. اكتشف عالم نايل فارما فود.",
    source: "المصدر قبل كل شيء",
    sourceNote: "موزّع Alfasigma الرسمي في مصر",
    leaflet: "افتح النشرة. اعرف أكتر.",
    leafletNote: "Proxeed Plus / النشرة الرسمية PDF",
    index: "من العلم، للحياة اليومية",
    scroll: "اكتشف عالمنا",
    paths: "العناية مش طريق واحد.",
    pathsAccent: "ابدأ من احتياجك.",
    pathIntro:
      "اختار المجال اللي يهمّك، واكتشف المنتجات ومعلوماتها. مش تشخيص، ولا بديل عن رأي المختص.",
    men: "صحة الرجل",
    women: "صحة المرأة",
    devices: "أجهزة طبية",
    chosen: "مجموعة مختارة لك",
    viewRange: "اكتشف المجموعة",
    viewProduct: "اعرف المنتج",
    available: "منتجات في هذا المسار",
    field: "اختار مسارك",
    all: "كل المنتجات",
    collection: "مش مجرد أسماء على علبة.",
    collectionAccent: "تفاصيل تستحق تعرفها.",
    collectionBody:
      "المكوّنات، طريقة الاستخدام، والنشرة الرسمية. كل منتج له مساحة تحكي تفاصيله بوضوح.",
    origin: "رحلة الثقة",
    originTitle: "الفرق اللي مش ظاهر",
    originAccent: "على الرف.",
    originBody:
      "مصدر معروف، توزيع رسمي، ومعلومة تقدر ترجع لأصلها. دي البداية، قبل أي اختيار.",
    close: "كل سؤال،",
    closeAccent: "بداية عناية.",
    closeBody:
      "عن منتج، عن مصدره، أو عن التعاون معانا. خلّينا نبدأ بالمعلومة الصح.",
    closeAction: "خلّينا نتكلم",
    note: "معلومات المنتجات لا تغني عن استشارة الطبيب أو الصيدلي.",
    trustLabels: ["مصادر أوروبية", "معلومات واضحة", "نشرات رسمية"],
  },
  en: {
    eyebrow: "NILE PHARMA FOOD / CARE, AT ITS SOURCE",
    title: "European science.",
    accent: "Human care.",
    intro:
      "Behind every product, a source worth knowing. Before every choice, information worth understanding. Welcome to Nile Pharma Food.",
    source: "It starts at the source",
    sourceNote: "Official Alfasigma distributor in Egypt",
    leaflet: "Open the leaflet. Look closer.",
    leafletNote: "Proxeed Plus / official leaflet PDF",
    index: "FROM SCIENCE TO EVERYDAY LIFE",
    scroll: "Discover our world",
    paths: "Care isn’t one-size-fits-all.",
    pathsAccent: "Find your starting point.",
    pathIntro:
      "Explore the area that matters to you. Discover products and their information—not a diagnosis or a substitute for professional advice.",
    men: "Men’s health",
    women: "Women’s health",
    devices: "Medical devices",
    chosen: "A closer look at your collection",
    viewRange: "Explore this collection",
    viewProduct: "Meet the product",
    available: "products in this collection",
    field: "CHOOSE YOUR PATH",
    all: "All products",
    collection: "More than a name",
    collectionAccent: "on the packaging.",
    collectionBody:
      "Ingredients, how to use it, and the official leaflet. Every product deserves room to tell its story clearly.",
    origin: "THE TRUST CHAPTER",
    originTitle: "The difference you",
    originAccent: "don’t see on the shelf.",
    originBody:
      "A known source. Official distribution. Information you can trace back. That’s where we start, before you choose.",
    close: "Every question.",
    closeAccent: "A place to begin.",
    closeBody:
      "About a product, its source, or working together. Let’s start with the right information.",
    closeAction: "Let’s talk",
    note: "Product information is not a substitute for advice from your doctor or pharmacist.",
    trustLabels: ["European sources", "Clear information", "Official leaflets"],
  },
} as const

export function getArtDirectionCopy(locale: Locale) {
  return copy[locale]
}
