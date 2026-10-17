import type { MetadataRoute } from "next"

import { contentSitemapRows, type ContentSitemapRow } from "@/lib/content/gates"
import type { ContentRecord } from "@/lib/content/types"
import { projectDecidedCatalog, type EvidenceDecision } from "@/lib/evidence/decisions"
import type { EvidenceDossier } from "@/lib/evidence/types"
import { applyApprovedEvidence } from "@/lib/evidence/project"
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config"
import type { Product } from "@/lib/products/types"

import { isProductSearchEligible } from "./sku-evidence"
import { canEnterSitemap } from "./page-contract"
import { CANONICAL_ORIGIN, absoluteUrl } from "./site"

/**
 * Public indexable routes that exist as pages and are not noindex.
 * `/blogs` is an empty noindex state. `/careers` is noindex because it
 * states there are no jobs (F-015). Neither belongs here.
 * Filtered and search URLs (`?category=`, `?need=`, `?q=`) are not routes.
 */
export const SITEMAP_STATIC_PATHS = [
  "",
  "/about",
  "/story",
  "/products",
  "/quality-sourcing",
  "/contact",
  "/shipping-delivery",
  "/privacy-policy",
  "/terms",
] as const

export type SitemapEntry = {
  url: string
  alternates?: { languages: Record<string, string> }
}

function languageAlternates(path: string): Record<string, string> {
  return Object.fromEntries(locales.map((locale) => [locale, absoluteUrl(`/${locale}${path}`)]))
}

function entry(locale: Locale, path: string): SitemapEntry {
  return {
    url: absoluteUrl(`/${locale}${path}`),
    alternates: { languages: languageAlternates(path) },
  }
}

/**
 * Sitemap URLs are the canonical absolute URLs of indexable pages only.
 * `lastModified` is omitted: the catalog has no trustworthy per-URL
 * timestamp, and `new Date()` would invent one.
 */
function contentEntry(row: ContentSitemapRow): SitemapEntry {
  return {
    url: absoluteUrl(`/${row.locale}${row.path}`),
    ...(row.alternates
      ? {
          alternates: {
            languages: Object.fromEntries(
              Object.entries(row.alternates).map(([locale, path]) => [locale, absoluteUrl(path)])
            ),
          },
        }
      : {}),
  }
}

export function buildSitemapEntries(
  products: readonly Product[],
  content: readonly ContentRecord[] = [],
  /**
   * Workflow dossiers. Omitted, the catalog row is passed through so a
   * direct policy fixture can still exercise `isProductSearchEligible`.
   * Production passes the evidence store, including the empty store, and
   * a product-field pack is then ignored.
   */
  evidence?: readonly EvidenceDossier[],
  /** Open records do not change a row. A decided mutation must still pass `isProductSearchEligible`. */
  decisions?: readonly EvidenceDecision[]
): MetadataRoute.Sitemap {
  const evidenced = evidence ? products.map((product) => applyApprovedEvidence(product, evidence)) : products
  const catalog = decisions ? evidenced.map((product) => projectDecidedCatalog(product, decisions, evidence ?? [])) : evidenced
  const staticEntries = locales.flatMap((locale) => SITEMAP_STATIC_PATHS.map((path) => entry(locale, path)))
  const productEntries = locales.flatMap((locale) =>
    catalog
      .filter((product) => canEnterSitemap(isProductSearchEligible(product), `/products/${product.slug}`))
      .map((product) => entry(locale, `/products/${product.slug}`))
  )
  const reserved = new Set<string>([
    ...SITEMAP_STATIC_PATHS,
    ...products.map((product) => `/products/${product.slug}`),
  ])
  const contentEntries = contentSitemapRows(content)
    .filter((row) => canEnterSitemap(true, row.path) && !reserved.has(row.path))
    .map(contentEntry)

  return [...staticEntries, ...productEntries, ...contentEntries].sort((a, b) => {
    const aDefault = a.url.startsWith(`${CANONICAL_ORIGIN}/${defaultLocale}`)
    const bDefault = b.url.startsWith(`${CANONICAL_ORIGIN}/${defaultLocale}`)
    return aDefault === bDefault ? 0 : aDefault ? -1 : 1
  })
}
