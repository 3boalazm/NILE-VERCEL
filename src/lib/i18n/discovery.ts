import type { Locale } from "./config";

export function getDiscoveryCopy(locale: Locale) {
  return locale === "ar"
    ? {
        applied: "الفلاتر المطبّقة",
        remove: "إزالة",
        query: "البحث",
        entire: "الكتالوج كاملًا",
        emptyTitle: "لم نجد نتيجة بهذه الاختيارات.",
        emptyBody:
          "راجع اسم المنتج أو أزل أحد الفلاتر. يمكنك البحث بالعربية أو الإنجليزية، دون الحاجة للتشكيل.",
        browse: "عرض كل المنتجات",
        contact: "اسأل فريقنا",
        resetSearch: "مسح البحث",
        all: "كل المنتجات",
        reading: "أقسام ملف المنتج",
      }
    : {
        applied: "Applied filters",
        remove: "Remove",
        query: "Search",
        entire: "Entire catalog",
        emptyTitle: "No products match these choices.",
        emptyBody:
          "Check the product name or remove a filter. Search in Arabic or English; accents and diacritics are optional.",
        browse: "Browse the full catalog",
        contact: "Ask our team",
        resetSearch: "Clear search",
        all: "All products",
        reading: "Product file sections",
      };
}
