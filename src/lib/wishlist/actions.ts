"use server"

import { publicCatalogProduct } from "@/lib/evidence/store"
import { productRepository, localizeProduct } from "@/lib/products"
import type { Locale } from "@/lib/i18n/config"
import type { Product } from "@/lib/products"

/**
 * Resolves wishlisted slugs (client-stored, see store.ts) against the
 * real product repository at render time — a slug for a product that was
 * later removed/renamed in Payload simply won't come back, which the
 * wishlist page treats as "no longer available" rather than erroring.
 * Real stock/availability (product.status) is whatever's current right
 * now, never cached from when the item was wishlisted.
 */
export async function getWishlistProducts(slugs: string[], locale: Locale): Promise<Product[]> {
  if (!Array.isArray(slugs) || slugs.length > 50 || (locale !== "ar" && locale !== "en") || slugs.some(slug => typeof slug !== "string" || !/^[a-z0-9-]{1,120}$/.test(slug))) throw new Error("invalid_wishlist")
  const results = await Promise.all([...new Set(slugs)].map((slug) => productRepository.getProductBySlug(slug)))
  return results
    .filter((product): product is Product => product !== null)
    .map((product) => localizeProduct(publicCatalogProduct(product), locale))
}
