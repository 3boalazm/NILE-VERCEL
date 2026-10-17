import type { Locale } from "@/lib/i18n/config"

type NamedProduct = {
  name: string
  nameArabic?: string
}

/**
 * Visible product identity for a locale. Uses stored fields only.
 * Arabic pages use `nameArabic`. English pages keep the Latin `name`.
 * A missing Arabic name falls back to the Latin name and must not be
 * indexed — callers do not invent a translation.
 */
export function productHeading(product: NamedProduct, locale: Locale): string {
  if (locale === "ar") {
    const arabic = product.nameArabic?.trim()
    if (arabic) return arabic
  }
  return product.name
}

/**
 * The other stored name, when it differs from the heading. This is an
 * alternate identity, not a keyword variant and not a translation we wrote.
 */
export function productAlternateName(product: NamedProduct, locale: Locale): string | undefined {
  const heading = productHeading(product, locale)
  const other = locale === "ar" ? product.name.trim() : product.nameArabic?.trim()
  if (!other || other === heading) return undefined
  return other
}
