import type { Product } from "./types";
const PACKS = new Set([
  "proxeed-plus",
  "proxeed-men",
  "proxeed-women",
  "proxeed-women-inositol",
  "proxerex",
  "ellamuselle",
]);
/** Use original, unchanged pack-face pixels for the checked-in photographs.
 * A CMS-uploaded replacement keeps control of its presentation. */
export function careAtlasImage(product: Pick<Product, "slug" | "image">) {
  return PACKS.has(product.slug) && product.image?.startsWith("/products/")
    ? `/care-atlas/packs/${product.slug}.webp`
    : product.image;
}

const ROSE = new Set(["proxeed-women", "proxeed-women-inositol", "ellamuselle"]);
/** Presentation-only tint, echoing the pack artwork (pink = women's line,
 * blue = men's / couple lines, mint = medical devices). Carries no claim. */
export function productTone(product: Pick<Product, "slug" | "categorySlug">): "aqua" | "rose" | "mint" {
  if (ROSE.has(product.slug)) return "rose";
  if (product.categorySlug === "medical-devices") return "mint";
  return "aqua";
}

/** Merchandising order for listings: the supplement range in family order,
 * then the medical devices. Presentation only — unknown slugs keep the
 * repository order after the known ones. */
const LISTING_ORDER = [
  "proxeed-plus",
  "proxeed-men",
  "proxeed-women",
  "proxeed-women-inositol",
  "proxerex",
  "ellamuselle",
  "ca-mi-pulse-oximeter",
  "ca-mi-ir-thermometer",
] as const

export function sortForListing<T extends { slug: string }>(products: readonly T[]): T[] {
  const rank = (slug: string) => {
    const i = (LISTING_ORDER as readonly string[]).indexOf(slug)
    return i === -1 ? LISTING_ORDER.length : i
  }
  return products
    .map((p, i) => [p, i] as const)
    .sort((a, b) => rank(a[0].slug) - rank(b[0].slug) || a[1] - b[1])
    .map(([p]) => p)
}
