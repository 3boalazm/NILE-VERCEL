import { absoluteUrl, CANONICAL_ORIGIN } from "./site"

/**
 * Organization and WebSite structured data.
 *
 * Only fields that already exist on the site are emitted by default.
 * Verified legal fields can be passed later. Empty or partial values are
 * omitted. There is no parameter for founder, award, rating, or review.
 *
 * SearchAction is not emitted for the catalog `?q=` filter. That URL is
 * not a canonical site-search endpoint. A future dedicated search page can
 * opt in without changing this shape.
 */

export const ORGANIZATION_ID = `${CANONICAL_ORIGIN}/#organization`
export const WEBSITE_ID = `${CANONICAL_ORIGIN}/#website`

const FILTER_SEARCH_PATHS = new Set(["/products"])

export type VerifiedPostalAddress = {
  streetAddress: string
  addressLocality: string
  addressCountry: string
  addressRegion?: string
}

export type VerifiedOrganizationFields = {
  legalName?: string
  telephone?: string
  address?: VerifiedPostalAddress
  sameAs?: readonly string[]
}

export type SiteSearchTarget = {
  /** Canonical path only, such as `/search`. Query strings are refused. */
  targetPath: string
  queryParam: string
  /** True only when that path is a real public page. Missing pages must not advertise a search URL. */
  pageExists: boolean
}

type JsonLd = Record<string, unknown>

function present(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function externalUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined
    const host = url.hostname.toLowerCase()
    if (host === "nilepharma.com.eg" || host.endsWith(".nilepharma.com.eg")) return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

function postalAddress(address: VerifiedPostalAddress | undefined): JsonLd | undefined {
  if (!address) return undefined
  const streetAddress = present(address.streetAddress)
  const addressLocality = present(address.addressLocality)
  const addressCountry = present(address.addressCountry)
  if (!streetAddress || !addressLocality || !addressCountry) return undefined
  const addressRegion = present(address.addressRegion)
  return {
    "@type": "PostalAddress",
    streetAddress,
    addressLocality,
    addressCountry,
    ...(addressRegion ? { addressRegion } : {}),
  }
}

export function buildOrganizationJsonLd({
  name,
  email,
  logoPath,
  verified,
}: {
  name: string
  email: string
  logoPath: string
  verified?: VerifiedOrganizationFields
}): JsonLd {
  const legalName = present(verified?.legalName)
  const telephone = present(verified?.telephone)
  const address = postalAddress(verified?.address)
  const sameAs = [...new Set((verified?.sameAs ?? []).map(externalUrl).filter((url): url is string => Boolean(url)))]

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: name.trim(),
    url: CANONICAL_ORIGIN,
    logo: absoluteUrl(logoPath),
    email: email.trim(),
    ...(legalName ? { legalName } : {}),
    ...(telephone ? { telephone } : {}),
    ...(address ? { address } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

export function buildSearchAction(search: SiteSearchTarget | null | undefined): JsonLd | undefined {
  if (!search?.pageExists) return undefined
  const targetPath = search.targetPath.trim()
  const queryParam = search.queryParam.trim()
  if (!targetPath.startsWith("/") || targetPath.includes("?") || targetPath.includes("#") || targetPath.includes("=")) {
    return undefined
  }
  if (FILTER_SEARCH_PATHS.has(targetPath)) return undefined
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(queryParam)) return undefined

  return {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: absoluteUrl(`${targetPath}?${queryParam}={search_term_string}`),
    },
    "query-input": `required name=${queryParam}`,
  }
}

export function buildWebSiteJsonLd({
  name,
  search,
}: {
  name: string
  search?: SiteSearchTarget | null
}): JsonLd {
  const potentialAction = buildSearchAction(search)
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: name.trim(),
    url: CANONICAL_ORIGIN,
    publisher: { "@id": ORGANIZATION_ID },
    ...(potentialAction ? { potentialAction } : {}),
  }
}
