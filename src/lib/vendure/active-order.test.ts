import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { __resetTestTransport, __setTestCookie } from "../../../test/stubs/next-headers"
import { mockVendureDown, mockVendureFetch } from "../../../test/mocks/vendure"
import type { VendureOrderResponse } from "./order-mapper"
import { readActiveOrderItems } from "./active-order"

const realFetch = global.fetch

const ORDER: VendureOrderResponse = {
  id: "1",
  code: "ORD1",
  state: "AddingItems",
  createdAt: "2026-09-01T10:00:00.000Z",
  currencyCode: "EGP",
  subTotalWithTax: 10000,
  shippingWithTax: 0,
  totalWithTax: 10000,
  shippingAddress: null,
  shippingLines: [],
  customer: null,
  payments: [],
  lines: [
    {
      id: "line-1",
      quantity: 1,
      linePriceWithTax: 10000,
      productVariant: {
        id: "variant-1",
        sku: "SKU-1",
        name: "Product",
        product: { slug: "product", featuredAsset: null },
      },
    },
  ],
}

beforeEach(() => {
  __resetTestTransport()
  __setTestCookie("npf-vendure-token", "cart-session")
  mockVendureDown()
})

afterEach(() => {
  global.fetch = realFetch
})

describe("readActiveOrderItems", () => {
  it("doesn't request a nonexistent anonymous cart or misreport it as an outage", async () => {
    __resetTestTransport()
    await expect(readActiveOrderItems()).resolves.toEqual({status:"available",items:[],sessionKey:"anonymous"})
    expect(global.fetch).not.toHaveBeenCalled()
  })
  it("distinguishes an available empty cart from an unavailable cart", async () => {
    mockVendureFetch({ ActiveOrder: () => ({ activeOrder: null }) })
    expect(await readActiveOrderItems()).toMatchObject({status:"available",items:[]})

    mockVendureDown()
    expect(await readActiveOrderItems()).toMatchObject({status:"unavailable",items:[]})
  })

  it("returns available cart contents when Vendure responds", async () => {
    mockVendureFetch({ ActiveOrder: () => ({ activeOrder: ORDER }) })
    const result = await readActiveOrderItems()
    expect(result.status).toBe("available")
    expect(result.items[0]?.slug).toBe("product")
  })
})
