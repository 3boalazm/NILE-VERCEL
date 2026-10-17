/**
 * Explicit one-hop legacy paths from docs/seo-url-migration-map.md.
 *
 * Destinations are path-only so the response stays on the host that is
 * serving this app. When that host is https://nilepharmafood.com, the hop
 * stays on that domain. www and HTTP canonicalization are host policy, not
 * rows in this table. Do not add a destination on another domain.
 *
 * Query strings are stripped. A legacy URL must not grow a new query, and
 * must not keep one that would make the destination differ from the exact
 * canonical path.
 */

export type LegacyRedirect = {
  /** Path after trailing-slash normalization. No query. */
  source: string
  destination: string
}

export const LEGACY_PRODUCT_REDIRECTS: readonly LegacyRedirect[] = [
  { source: "/product/proxeed-plus", destination: "/ar/products/proxeed-plus" },
  { source: "/product/proxerex", destination: "/ar/products/proxerex" },
  { source: "/product/proxeed-women", destination: "/ar/products/proxeed-women" },
  { source: "/product/pulse-oximeter-ca-mi-o2-easy", destination: "/ar/products/ca-mi-pulse-oximeter" },
  { source: "/product/ellamuselle", destination: "/ar/products/ellamuselle" },
]

/**
 * Thermometer old slug was not confirmed (t-onedigital vs t-one-digital).
 * These must 404, never 301, until an archive or Search Console proves one.
 */
export const UNCONFIRMED_PRODUCT_SLUGS = [
  "t-onedigital-ir-thermometer",
  "t-one-digital-ir-thermometer",
  "t-one",
] as const

const GONE_EXACT = new Set([
  "/term-paper-writer-reviews",
  "/home__trashed/store__trashed",
])

const GONE_PREFIXES = ["/wp-admin", "/wp-content", "/wp-includes", "/cgi-sys"]

export type LegacyPathDecision =
  | { kind: "redirect"; pathname: string; status: 301 }
  | { kind: "gone"; status: 410 }
  | { kind: "not-found"; status: 404 }

const REDIRECT_BY_SOURCE = new Map(LEGACY_PRODUCT_REDIRECTS.map((rule) => [rule.source, rule.destination]))

export function withoutTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.replace(/\/+$/, "")
  return pathname
}

function isGonePrefix(path: string): boolean {
  if (path === "/feed" || path.startsWith("/feed/")) return true
  return GONE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

/**
 * Returns a decision only for paths this table owns. Null means the locale
 * proxy should continue. Unknown `/product/*` is a 404, not a catalog
 * redirect and not a locale hop.
 */
export function resolveLegacyPath(pathname: string): LegacyPathDecision | null {
  const path = withoutTrailingSlash(pathname)

  if (GONE_EXACT.has(path) || isGonePrefix(path)) {
    return { kind: "gone", status: 410 }
  }

  const destination = REDIRECT_BY_SOURCE.get(path)
  if (destination) {
    return { kind: "redirect", pathname: destination, status: 301 }
  }

  if (path === "/product" || path.startsWith("/product/")) {
    return { kind: "not-found", status: 404 }
  }

  return null
}
