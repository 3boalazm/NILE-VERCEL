/**
 * Permanent public origin for this storefront.
 *
 * Do not replace this host, add a second primary domain, or point canonical,
 * sitemap, hreflang, Open Graph, or structured-data URLs at another domain.
 * Restoring production means serving this app on this same origin. It is not
 * a domain migration. `nilepharma.com.eg` is a different company and is not
 * an NPF URL.
 */
export const CANONICAL_ORIGIN = "https://nilepharmafood.com"

/** Absolute URL on the canonical origin. Relative paths stay on this host. */
export function absoluteUrl(path: string): string {
  if (path.startsWith("https://") || path.startsWith("http://")) {
    const url = new URL(path)
    if (url.origin !== CANONICAL_ORIGIN) {
      throw new Error(`Refusing non-canonical absolute URL: ${path}`)
    }
    return url.toString()
  }
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${CANONICAL_ORIGIN}${normalized}`
}
