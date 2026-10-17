import type { EvidenceDossier } from "@/lib/evidence/types"
import { applyApprovedEvidence } from "@/lib/evidence/project"
import { listEvidenceRecords } from "@/lib/evidence/store"
import type { Locale } from "@/lib/i18n/config"
import type { Product } from "@/lib/products/types"
import { PRODUCT_POSITIONING } from "@/lib/products/positioning"
import { canUseSkuInContent } from "@/lib/seo/sku-evidence"
import { productHeading } from "@/lib/seo/product-identity"

import { isContentSearchIndexEligible } from "./gates"
import type { ContentRecord } from "./types"

/**
 * Canonical internal links. Relationships are explicit: same stored
 * category, and the same stored audience cell when the catalog has one.
 * Keyword overlap is not a relationship. If nothing qualifies, return nothing.
 */

export type CanonicalLink = {
  href: string
  label: string
  kind: "product" | "content" | "catalog"
}

export function isCanonicalContentHref(href: string): boolean {
  return href.startsWith("/") && !href.includes("?") && !href.includes("#")
}

export function catalogPath(locale: Locale): string {
  return `/${locale}/products`
}

export function productPath(locale: Locale, slug: string): string {
  return `/${locale}/products/${slug}`
}

export function selectRelatedProducts(current: Pick<Product, "id" | "slug" | "status" | "categorySlug">, candidates: readonly Product[]): Product[] {
  if (current.status !== "active") return []
  const audience = PRODUCT_POSITIONING[current.slug]
  return candidates
    .filter((item) => {
      if (item.id === current.id || item.status !== "active") return false
      if (item.categorySlug !== current.categorySlug) return false
      if (!audience) return true
      const other = PRODUCT_POSITIONING[item.slug]
      return Boolean(other && other.gender === audience.gender && other.concern === audience.concern)
    })
    .slice(0, 4)
}

export function relatedProductLinks(current: Product, candidates: readonly Product[], locale: Locale): CanonicalLink[] {
  return selectRelatedProducts(current, candidates).map((product) => ({
    href: productPath(locale, product.slug),
    label: productHeading(product, locale),
    kind: "product" as const,
  }))
}

export function relatedContentLinks(record: ContentRecord, catalog: readonly ContentRecord[], locale: Locale): CanonicalLink[] {
  if (!isContentSearchIndexEligible(record)) return []
  const ids = new Set(record.relatedContentIds ?? [])
  if (ids.size === 0) return []
  return catalog
    .filter((item) => ids.has(item.id) && item.locale === locale && isContentSearchIndexEligible(item))
    .map((item) => ({
      href: `/${locale}${item.kind === "faq" ? "/faqs/" : item.kind === "comparison" ? "/comparisons/" : "/guides/"}${item.slug}`,
      label: item.title,
      kind: "content" as const,
    }))
}

export function contentProductLinks(
  record: ContentRecord,
  products: readonly Product[],
  locale: Locale,
  records: readonly EvidenceDossier[] = listEvidenceRecords()
): CanonicalLink[] {
  if (!isContentSearchIndexEligible(record)) return []
  const slugs = new Set(record.relatedProductSlugs ?? [])
  if (slugs.size === 0) return []
  return products
    .map((product) => applyApprovedEvidence(product, records))
    .filter((product) => slugs.has(product.slug) && canUseSkuInContent(product, record.layer))
    .map((product) => ({
      href: productPath(locale, product.slug),
      label: productHeading(product, locale),
      kind: "product" as const,
    }))
}
