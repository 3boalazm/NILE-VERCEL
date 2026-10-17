import type { Product } from "./types"

type Price = { price: number; currency: string; sku: string }
/** Missing live price is NOT permission to publish demo money in production. */
export function resolveCatalogPrice(
  live: Price | undefined,
  demo: Pick<Product, "price" | "currency" | "sku"> | undefined,
  allowDemo: boolean
) {
  if (live && Number.isFinite(live.price) && live.price >= 0)
    return {
      price: live.price,
      currency: live.currency,
      sku: live.sku,
      priceSource: "live" as const,
    }
  if (allowDemo && demo)
    return {
      price: demo.price,
      currency: demo.currency,
      sku: demo.sku,
      priceSource: "demo" as const,
    }
  return {
    price: undefined,
    currency: undefined,
    sku: undefined,
    priceSource: "unavailable" as const,
  }
}
