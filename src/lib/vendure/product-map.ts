import "server-only"

import { vendureRequest } from "./client"
import { PRODUCT_VARIANT_ID_BY_SLUG_QUERY } from "./queries"

type ProductVariantLookup = {
  product: { id: string; slug: string; variants: Array<{ id: string; sku: string }> } | null
}

/**
 * Resolves a product slug to its Vendure variant ID at request time.
 * ADR-007 wants a stable stored ID as the long-term join key (Payload's
 * Products collection already has a `vendureProductId` field reserved for
 * this) — that backfill hasn't happened yet, so this is the interim
 * bootstrap: slugs match 1:1 between the storefront catalog and Vendure's
 * seeded catalog today, verified directly against the running Vendure
 * instance. Every catalog product currently has exactly one variant, so
 * "the product's variant" is unambiguous.
 */
export async function resolveVariantIdBySlug(slug: string): Promise<string | null> {
  const { data } = await vendureRequest<ProductVariantLookup>(
    PRODUCT_VARIANT_ID_BY_SLUG_QUERY,
    { slug },
    undefined
  )
  return data.product?.variants[0]?.id ?? null
}
