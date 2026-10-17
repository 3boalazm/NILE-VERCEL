import type { Metadata } from "next"

import type { Locale } from "@/lib/i18n/config"
import type { Product } from "@/lib/products/types"

import { growthSearchDescription, productImageAlt } from "./growth"
import { resolveSeoPage, type ResolvedSeoPage } from "./page-contract"
import { productHeading } from "./product-identity"
import { isProductSearchEligible } from "./sku-evidence"

/**
 * PDP metadata. Title is the stored heading for the locale, not a keyword
 * variant. Ineligible products stay reachable and self-canonical, with
 * noindex,follow, and are excluded from the sitemap by the same gate.
 */
export function productSeoContract(product: Product, locale: Locale, catalogRecord: Product = product): ResolvedSeoPage {
  const heading = productHeading(product, locale)
  return resolveSeoPage({
    locale,
    path: `/products/${product.slug}`,
    title: heading,
    description: growthSearchDescription(product, locale, catalogRecord),
    pageType: "product",
    indexable: isProductSearchEligible(catalogRecord),
    follow: true,
    hasLocaleAlternate: true,
    image: product.image ? { url: product.image, alt: productImageAlt(product, locale, catalogRecord) } : undefined,
    primaryEntity: { kind: "product", name: heading, id: product.slug },
  })
}

export function productPageMetadata(product: Product, locale: Locale, catalogRecord: Product = product): Metadata {
  return productSeoContract(product, locale, catalogRecord).metadata
}
