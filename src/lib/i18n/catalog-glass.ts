import type { Locale } from "./config";

/**
 * Copy for the Nile Glass catalog (/products) and product file
 * (/products/[slug]). Kept outside the main dictionary because the atlas and
 * the chapter index are Client Components; parity is asserted in
 * catalog-glass.test.ts.
 */
export const CATALOG_GLASS_COPY = {
  ar: {
    catalogEyebrow: "الكتالوج",
    categoryHeading: "الفئة",
    atlasEyebrow: "قراءة سريعة",
    atlasTitle: "قارن الملفات قبل أن تختار.",
    atlasBody:
      "اختر منتجًا من الفهرس لتقرأ تركيبته وطريقة استخدامه ونشرته الرسمية — كما هي منشورة، دون إضافة.",
    noscriptLinks: "روابط ملفات المنتجات:",
    openFile: "افتح ملف المنتج الكامل",
    chaptersTitle: "اقرأ الملف",
    readFullScience: "اقرأ المعلومات العلمية كاملة",
    priceOnRequestBody:
      "لا نعرض سعرًا قبل تأكيده. اطلب المعلومات وسيرد عليك فريقنا بالسعر والتوفر.",
    inquiryHeading: "سؤال عن المنتج؟",
    inquiryBody:
      "أرسل استفسارك وسيصل إلى فريق نايل فارما فود مع اسم المنتج.",
    relatedArticlesEyebrow: "من المدونة",
    relatedProductsEyebrow: "تابع الاستكشاف",
  },
  en: {
    catalogEyebrow: "The catalog",
    categoryHeading: "Category",
    atlasEyebrow: "Quick read",
    atlasTitle: "Compare the files before you choose.",
    atlasBody:
      "Pick a product from the index to read its composition, usage and official leaflet — exactly as published, nothing added.",
    noscriptLinks: "Product file links:",
    openFile: "Open the full product file",
    chaptersTitle: "Read the file",
    readFullScience: "Read the full scientific information",
    priceOnRequestBody:
      "We don’t show a price before it is confirmed. Ask us and our team will reply with price and availability.",
    inquiryHeading: "A question about this product?",
    inquiryBody:
      "Send your question and it reaches the Nile Pharma Food team with the product name attached.",
    relatedArticlesEyebrow: "From the journal",
    relatedProductsEyebrow: "Continue exploring",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export function getCatalogGlassCopy(locale: Locale) {
  return CATALOG_GLASS_COPY[locale] ?? CATALOG_GLASS_COPY.ar;
}
