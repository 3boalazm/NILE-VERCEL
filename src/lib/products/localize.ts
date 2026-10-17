import type { Locale } from "@/lib/i18n/config"
import type { Product, ProductCategory } from "./types"

/**
 * Merges a product's `translations.en` overrides onto its base (Arabic)
 * fields for non-Arabic locales. Kept out of the repository interface on
 * purpose — `ProductRepository` stays locale-agnostic (so it still maps
 * cleanly onto a future Vendure Shop API response), and pages localize at
 * the point of use, where `locale` is already in scope.
 */
export function localizeProduct(product: Product, locale: Locale): Product {
  // `name` and `nameArabic` are not localization overrides. Arabic display
  // uses `productHeading` so the stored Latin name cannot be overwritten.
  if (locale === "ar") return product
  const t = product.translations?.en
  if (!t) return product
  return { ...product, ...t }
}

export function localizeCategory(category: ProductCategory, locale: Locale): ProductCategory {
  if (locale === "ar") return category
  const t = category.translations?.en
  if (!t) return category
  return { ...category, ...t }
}
