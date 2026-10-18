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
