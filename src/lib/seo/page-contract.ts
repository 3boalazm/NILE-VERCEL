import type { Metadata } from "next"

import { locales, type Locale } from "@/lib/i18n/config"

import { absoluteUrl } from "./site"

/**
 * One answer for a public page: canonical, robots, sitemap eligibility,
 * locale alternates, Open Graph, and which schema types apply.
 * Rendering schema stays explicit. This module does not query a database.
 */

export const SEO_PAGE_TYPES = [
  "home",
  "product",
  "category",
  "editorial",
  "faq",
  "comparison",
  "guide",
  "entity",
  "utility",
  "legal",
  "static",
] as const

export type SeoPageType = (typeof SEO_PAGE_TYPES)[number]

export type SeoImageRef = {
  url: string
  alt?: string
  width?: number
  height?: number
}

export type SeoPrimaryEntity = {
  kind: "product" | "organization" | "article" | "category"
  name: string
  id?: string
}

export type SeoPageInput = {
  locale: Locale
  /** Path after the locale segment. `""` is the homepage. No query string. */
  path: string
  title: string
  description: string
  pageType?: SeoPageType
  indexable: boolean
  follow?: boolean
  /** False for utility routes that must not declare a language alternate. */
  hasLocaleAlternate: boolean
  image?: SeoImageRef
  primaryEntity?: SeoPrimaryEntity
}

export type ResolvedSeoPage = {
  metadata: Metadata
  canonicalPath: string
  canonicalUrl: string
  robots: { index: boolean; follow: boolean }
  sitemapEligible: boolean
  schemaTypes: string[]
  primaryEntity?: SeoPrimaryEntity
}

const OG_LOCALE: Record<Locale, string> = { ar: "ar_EG", en: "en_US" }

export function canEnterSitemap(eligible: boolean, path: string): boolean {
  if (!eligible) return false
  if (!path.startsWith("/")) return false
  if (path.includes("?") || path.includes("#") || path.includes(" ")) return false
  return true
}

export function schemaTypesFor(pageType: SeoPageType | undefined): string[] {
  switch (pageType) {
    case "home":
      return ["WebPage", "Organization", "WebSite"]
    case "product":
      return ["WebPage", "Product", "BreadcrumbList"]
    case "faq":
      return ["WebPage", "FAQPage"]
    case "editorial":
    case "guide":
    case "comparison":
      return ["WebPage", "Article"]
    case "entity":
      return ["WebPage", "Organization"]
    default:
      return ["WebPage"]
  }
}

function metadataImage(
  image: SeoImageRef | undefined
): { url: string; alt?: string; width?: number; height?: number }[] | undefined {
  if (!image?.url.trim()) return undefined
  const alt = image.alt?.trim()
  return [
    {
      url: image.url,
      ...(alt ? { alt } : {}),
      ...(image.width ? { width: image.width } : {}),
      ...(image.height ? { height: image.height } : {}),
    },
  ]
}

export function resolveSeoPage(input: SeoPageInput): ResolvedSeoPage {
  if (input.path.includes("?") || input.path.includes("#")) {
    throw new Error(`Canonical path cannot include a query or hash: ${input.path}`)
  }
  const path = input.path === "" || input.path.startsWith("/") ? input.path : `/${input.path}`
  const canonicalPath = `/${input.locale}${path}`
  const index = input.indexable
  const follow = input.follow ?? index
  const images = metadataImage(input.image)
  const sitemapEligible = path === "" ? index : canEnterSitemap(index, path)

  const metadata: Metadata = {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalPath,
      ...(input.hasLocaleAlternate
        ? { languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}${path}`])) }
        : {}),
    },
    openGraph: {
      title: input.title,
      description: input.description,
      locale: OG_LOCALE[input.locale],
      type: "website",
      url: canonicalPath,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: images?.map((image) => image.url),
    },
    robots: { index, follow },
  }

  return {
    metadata,
    canonicalPath,
    canonicalUrl: absoluteUrl(canonicalPath),
    robots: { index, follow },
    sitemapEligible,
    schemaTypes: schemaTypesFor(input.pageType),
    primaryEntity: input.primaryEntity,
  }
}
