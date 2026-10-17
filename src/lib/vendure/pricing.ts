import "server-only"

import { vendureRequest } from "./client"
import { PRODUCT_VARIANT_ID_BY_SLUG_QUERY } from "./queries"

export type LivePrice = {
  /** Major units (EGP) — converted from Vendure's minor units, same as order-mapper. */
  price: number
  currency: string
  sku: string
}

type VariantPriceLookup = {
  product: {
    slug: string
    variants: Array<{ id: string; sku: string; priceWithTax: number; currencyCode: string }>
  } | null
}

// Short in-memory TTL: catalog pages render per request, and without this
// every page view would fan out to Vendure once per product. A minute of
// listing-price staleness is harmless — cart/checkout always read the live
// order state, so this cache can never change what anyone is charged.
const CACHE_TTL_MS = 60_000
const cache = new Map<string, { at: number; value: LivePrice }>()

async function fetchLivePrice(slug: string): Promise<LivePrice | null> {
  try {
    const { data } = await vendureRequest<VariantPriceLookup>(
      PRODUCT_VARIANT_ID_BY_SLUG_QUERY,
      { slug },
      undefined
    )
    const variant = data.product?.variants[0]
    if (!variant || typeof variant.priceWithTax !== "number") return null
    return {
      price: variant.priceWithTax / 100,
      currency: variant.currencyCode,
      sku: variant.sku,
    }
  } catch {
    // Vendure unreachable (dev without the commerce backend, CI build,
    // outage). Callers omit unavailable prices unless demo mode was explicit.
    return null
  }
}

/**
 * Resolves live Vendure prices for a batch of product slugs. Never throws
 * and never returns a partial lie: slugs Vendure doesn't know (or can't
 * be reached for) are simply absent from the map. Production omits their
 * prices; explicit demo previews may use labeled mock values.
 */
export async function getLivePrices(slugs: string[]): Promise<Map<string, LivePrice>> {
  const result = new Map<string, LivePrice>()
  const now = Date.now()
  const missing: string[] = []

  for (const slug of slugs) {
    const hit = cache.get(slug)
    if (hit && now - hit.at < CACHE_TTL_MS) {
      result.set(slug, hit.value)
    } else {
      missing.push(slug)
    }
  }
  if (missing.length === 0) return result

  const settled = await Promise.allSettled(
    missing.map(async (slug) => ({ slug, live: await fetchLivePrice(slug) }))
  )
  for (const entry of settled) {
    if (entry.status === "fulfilled" && entry.value.live) {
      cache.set(entry.value.slug, { at: now, value: entry.value.live })
      result.set(entry.value.slug, entry.value.live)
    }
  }
  return result
}
