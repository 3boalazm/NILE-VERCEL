import { MockProductRepository } from "./mock-repository"
import { mockFallbackEnabled } from "./mock-fallback"
import type { ProductRepository } from "./repository"
import { PayloadProductRepository } from "./payload-repository"

/**
 * Single composition point. Live source is Payload (2026-08-30) — the
 * earlier hang blamed on concurrent getPayload() calls was actually the
 * shared dev server's corrupted Turbopack cache (fixed by a full process
 * kill + .next wipe, unrelated to this file); Mock hung too under that
 * corruption, which disproved the deadlock theory. Verified post-fix with
 * both a single request and 5 concurrent requests against
 * /products/proxeed-plus. sku/price resolve live from Vendure per slug
 * (parity with checkout, ADR-007); Mock survives only as the offline
 * fallback when Vendure is unreachable (see payload-repository.ts).
 */
export const productRepository: ProductRepository = process.env.NPF_PREVIEW_MODE === "1" && mockFallbackEnabled()
  ? new MockProductRepository()
  : new PayloadProductRepository()

export type { Product, ProductCategory, ProductStatus, SpecItem, Testimonial } from "./types"
export type { ProductRepository } from "./repository"
export { localizeProduct, localizeCategory } from "./localize"
export { MockProductRepository } from "./mock-repository"
