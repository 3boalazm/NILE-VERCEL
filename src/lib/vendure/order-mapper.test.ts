import { describe, expect, it } from "vitest"

import {
  toCartItems,
  toEligibleShippingMethods,
  toOrderSummary,
  type VendureOrderResponse,
} from "./order-mapper"

function buildOrder(overrides: Partial<VendureOrderResponse> = {}): VendureOrderResponse {
  return {
    id: "1",
    code: "ABC123",
    state: "PaymentAuthorized",
    createdAt: "2026-09-01T10:00:00.000Z",
    currencyCode: "EGP",
    subTotalWithTax: 255000,
    shippingWithTax: 6000,
    totalWithTax: 261000,
    shippingAddress: {
      fullName: "أحمد محمد",
      streetLine1: "شارع 1",
      city: "العبور",
      province: "القليوبية",
      postalCode: "00000",
      phoneNumber: "01012345678",
    },
    shippingLines: [
      { shippingMethod: { id: "1", code: "door-to-door", name: "Door to door" }, priceWithTax: 6000 },
    ],
    customer: {
      firstName: "أحمد",
      lastName: "محمد",
      emailAddress: "ahmed@example.com",
      phoneNumber: "01012345678",
    },
    payments: [
      { id: "1", method: "manual-settlement", metadata: { public: { paymentMethod: "bank_transfer" } } },
    ],
    lines: [
      {
        id: "11",
        quantity: 2,
        linePriceWithTax: 510000,
        productVariant: {
          id: "101",
          sku: "PXD-PLS-001",
          name: "Proxeed Plus",
          product: { slug: "proxeed-plus", featuredAsset: { preview: "/img.jpg" } },
        },
      },
    ],
    ...overrides,
  }
}

describe("toCartItems", () => {
  it("converts minor units to per-unit major units", () => {
    const [item] = toCartItems(buildOrder())
    // 510000 piastres / 2 units / 100 = 2550 EGP each.
    expect(item.price).toBe(2550)
    expect(item.currency).toBe("EGP")
    expect(item.qty).toBe(2)
    expect(item.slug).toBe("proxeed-plus")
    expect(item.sku).toBe("PXD-PLS-001")
    expect(item.image).toBe("/img.jpg")
  })

  it("maps a missing product image to null", () => {
    const order = buildOrder()
    order.lines[0].productVariant.product.featuredAsset = null
    expect(toCartItems(order)[0].image).toBeNull()
  })

  it("returns an empty cart for a null order", () => {
    expect(toCartItems(null)).toEqual([])
    expect(toCartItems(undefined)).toEqual([])
  })
})

describe("toEligibleShippingMethods", () => {
  it("maps plugin codes to fulfillment modes and converts prices", () => {
    const methods = toEligibleShippingMethods([
      { id: "1", code: "door-to-door", name: "Door", priceWithTax: 6000 },
      { id: "2", code: "branch-dropoff", name: "Branch", priceWithTax: 6000 },
      { id: "3", code: "company-pickup", name: "Pickup", priceWithTax: 0 },
    ])
    expect(methods.map((m) => m.mode)).toEqual(["door_to_door", "branch_pickup", "company_pickup"])
    expect(methods[0].priceWithTax).toBe(60)
    expect(methods[2].priceWithTax).toBe(0)
  })

  it("maps unknown shipping codes to a null mode instead of crashing", () => {
    const [method] = toEligibleShippingMethods([
      { id: "9", code: "drone-delivery", name: "Drone", priceWithTax: 100 },
    ])
    expect(method.mode).toBeNull()
  })
})

describe("toOrderSummary", () => {
  it("converts totals and maps customer/payment/fulfillment", () => {
    const summary = toOrderSummary(buildOrder())
    expect(summary.orderNumber).toBe("ABC123")
    expect(summary.subtotal).toBe(2550)
    expect(summary.shippingCost).toBe(60)
    expect(summary.total).toBe(2610)
    expect(summary.hasUnpricedItems).toBe(false)
    expect(summary.customer.name).toBe("أحمد محمد")
    expect(summary.customer.phone).toBe("01012345678")
    expect(summary.customer.email).toBe("ahmed@example.com")
    expect(summary.customer.governorate).toBe("القليوبية")
    expect(summary.customer.city).toBe("العبور")
    expect(summary.customer.address).toBe("شارع 1")
    expect(summary.paymentMethod).toBe("bank_transfer")
    expect(summary.fulfillmentMode).toBe("door_to_door")
  })

  it("falls back to cod for missing or unrecognized payment metadata", () => {
    expect(toOrderSummary(buildOrder({ payments: [] })).paymentMethod).toBe("cod")
    const order = buildOrder()
    order.payments = [{ id: "1", method: "manual-settlement", metadata: { public: { paymentMethod: "bitcoin" } } }]
    expect(toOrderSummary(order).paymentMethod).toBe("cod")
  })

  it("falls back to an empty customer and null fulfillment when absent", () => {
    const summary = toOrderSummary(buildOrder({ customer: null, shippingAddress: null, shippingLines: [] }))
    expect(summary.customer.name).toBe("")
    expect(summary.customer.phone).toBe("")
    expect(summary.fulfillmentMode).toBeNull()
  })
})

describe("toOrderSummary transferRef (manual-transfer reconciliation)", () => {
  it("reads the customer-typed reference from payment metadata.public", () => {
    const order = buildOrder({
      payments: [{ id: "p1", method: "manual-settlement", metadata: { public: { transferRef: "TXN-42" } } }],
    })
    expect(toOrderSummary(order).transferRef).toBe("TXN-42")
  })

  it("stays undefined when no reference was typed", () => {
    expect(toOrderSummary(buildOrder()).transferRef).toBeUndefined()
  })

  it("ignores blank references", () => {
    const order = buildOrder({
      payments: [{ id: "p1", method: "manual-settlement", metadata: { public: { transferRef: "   " } } }],
    })
    expect(toOrderSummary(order).transferRef).toBeUndefined()
  })
})
