import type { Locale } from "./config"

/**
 * Copy for the "catalog unavailable" notice.
 *
 * The storefront self-hosts its fonts and keeps its own dictionaries in
 * `dictionaries.ts` (~1.7k lines, both languages). This notice is rendered
 * by a Server Component, so it does not face the client-bundle problem
 * `error-copy.ts` solves — but it is kept in its own module anyway for the
 * same reason that module exists: the notice must be importable from
 * anywhere (a page, a layout, a test) without dragging the whole site copy
 * along, and it must never render `undefined`.
 */
export const CATALOG_NOTICE_COPY: Record<
  Locale,
  {
    eyebrow: string
    title: string
    body: string
    contactCta: string
    browseCta: string
  }
> = {
  ar: {
    eyebrow: "الكتالوج",
    title: "منتجاتنا مش متاحة دلوقتي",
    body:
      "خدمة غير متاحة مؤقتاً، فمقدرناش نعرض المنتجات دلوقتي. باقي الموقع شغال — جرّب تاني بعد شوية، أو كلمنا ونجيبلك اللي محتاجه.",
    contactCta: "كلمنا",
    browseCta: "تصفح المنتجات",
  },
  en: {
    eyebrow: "The catalog",
    title: "Our products are not available right now",
    body:
      "A service is temporarily unavailable, so the product list cannot be shown at the moment. The rest of the site works — try again shortly, or get in touch and we will help you directly.",
    contactCta: "Contact us",
    browseCta: "Browse products",
  },
}

/**
 * Resolves the notice copy for a locale, falling back to Arabic (the site's
 * default locale). A degraded section must never render an empty string
 * where an explanation belongs.
 */
export function getCatalogNoticeCopy(
  locale: string | undefined,
): (typeof CATALOG_NOTICE_COPY)["ar"] {
  const key = (locale as Locale) in CATALOG_NOTICE_COPY ? (locale as Locale) : "ar"
  return CATALOG_NOTICE_COPY[key]
}
