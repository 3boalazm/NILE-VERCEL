import { absoluteUrl } from "./site"

/**
 * Image metadata for Open Graph and a future image sitemap.
 * The generator is local and pure. It is not mounted: an empty or
 * decorative image must not be advertised, and production has not
 * confirmed that the current files are the final assets.
 */

export type SeoImage = {
  url: string
  alt: string
  width?: number
  height?: number
  pagePath?: string
  productSlug?: string
}

export type ImageSitemapEntry = {
  loc: string
  page: string
}

export function toSeoImage(input: {
  url: string | null | undefined
  alt: string | null | undefined
  width?: number
  height?: number
  pagePath?: string
  productSlug?: string
}): SeoImage | null {
  const url = input.url?.trim()
  const alt = input.alt?.trim()
  if (!url || !alt) return null
  if (url.includes("?") || url.includes("#")) return null
  if (input.pagePath && (input.pagePath.includes("?") || input.pagePath.includes("#"))) return null
  return {
    url,
    alt,
    ...(input.width ? { width: input.width } : {}),
    ...(input.height ? { height: input.height } : {}),
    ...(input.pagePath ? { pagePath: input.pagePath } : {}),
    ...(input.productSlug ? { productSlug: input.productSlug } : {}),
  }
}

export function buildImageSitemapEntries(
  images: readonly SeoImage[],
  indexablePaths: ReadonlySet<string>
): ImageSitemapEntry[] {
  const entries: ImageSitemapEntry[] = []
  for (const image of images) {
    if (!image.alt.trim() || !image.pagePath) continue
    if (!indexablePaths.has(image.pagePath)) continue
    if (image.pagePath.includes("?") || image.url.includes("?")) continue
    entries.push({
      loc: absoluteUrl(image.url),
      page: absoluteUrl(image.pagePath),
    })
  }
  return entries
}
