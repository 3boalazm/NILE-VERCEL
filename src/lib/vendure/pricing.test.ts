import { afterEach, describe, expect, it, vi } from "vitest"

import { mockVendureDown, mockVendureFetch } from "../../../test/mocks/vendure"
import { getLivePrices } from "./pricing"

const realFetch = global.fetch

afterEach(() => {
  global.fetch = realFetch
  vi.restoreAllMocks()
})

function variantPayload(slug: string, priceWithTax = 255000) {
  return {
    product: {
      id: "p1",
      slug,
      variants: [{ id: "v1", sku: "SKU-1", priceWithTax, currencyCode: "EGP" }],
    },
  }
}

describe("getLivePrices", () => {
  it("resolves live prices in major units with sku and currency", async () => {
    mockVendureFetch({ ProductVariantIdBySlug: (variables) => variantPayload(String(variables.slug)) })
    const prices = await getLivePrices(["price-happy"])
    expect(prices.get("price-happy")).toEqual({ price: 2550, currency: "EGP", sku: "SKU-1" })
  })

  it("omits slugs Vendure does not know instead of lying", async () => {
    mockVendureFetch({ ProductVariantIdBySlug: () => ({ product: null }) })
    expect(await getLivePrices(["price-unknown"])).toEqual(new Map())
  })

  it("returns an empty map — never throws — when Vendure is down", async () => {
    mockVendureDown()
    await expect(getLivePrices(["price-down"])).resolves.toEqual(new Map())
  })

  it("caches within the TTL instead of refetching per render", async () => {
    const calls = mockVendureFetch({
      ProductVariantIdBySlug: (variables) => variantPayload(String(variables.slug)),
    })
    await getLivePrices(["price-cached"])
    await getLivePrices(["price-cached"])
    expect(calls).toHaveLength(1)
  })
})
