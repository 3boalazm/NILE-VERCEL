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
