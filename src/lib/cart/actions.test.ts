import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  __getTestCookie,
  __resetTestTransport,
} from "../../../test/stubs/next-headers"
import { mockVendureDown, mockVendureFetch, operationNames } from "../../../test/mocks/vendure"
import type { VendureOrderResponse } from "@/lib/vendure/order-mapper"
import {
  addToCart,
  getEligibleShippingMethods,
  placeOrder,
  removeCartLine,
  reorderItems,
  updateCartLine,
} from "./actions"

const ORDER: VendureOrderResponse = {
  id: "1",
  code: "ORD1",
  state: "AddingItems",
  createdAt: "2026-09-01T10:00:00.000Z",
  currencyCode: "EGP",
  subTotalWithTax: 255000,
  shippingWithTax: 6000,
  totalWithTax: 261000,
  shippingAddress: {
    fullName: "عميل تجريبي",
    streetLine1: "شارع 1",
    city: "العبور",
    province: "القليوبية",
    postalCode: "00000",
    phoneNumber: "01012345678",
  },
  shippingLines: [
    { shippingMethod: { id: "sm1", code: "door-to-door", name: "Door" }, priceWithTax: 6000 },
  ],
  customer: { firstName: "عميل", lastName: "تجريبي", emailAddress: "t@t.co", phoneNumber: "01012345678" },
  payments: [],
  lines: [
    {
      id: "l1",
      quantity: 1,
      linePriceWithTax: 255000,
      productVariant: {
        id: "v1",
        sku: "SKU-1",
        name: "Proxeed Plus",
        product: { slug: "proxeed-plus", featuredAsset: { preview: "/img.jpg" } },
      },
    },
  ],
}

const METHODS = [{ id: "sm1", code: "door-to-door", name: "Door", priceWithTax: 6000 }]

const realFetch = global.fetch

beforeEach(() => {
  __resetTestTransport()
})

afterEach(() => {
  global.fetch = realFetch
  vi.restoreAllMocks()
})

describe("addToCart", () => {
  it("resolves the variant then adds it, returning mapped items", async () => {
    const calls = mockVendureFetch({
      ProductVariantIdBySlug: () => ({
        product: { id: "p1", slug: "proxeed-plus", variants: [{ id: "v1", sku: "SKU-1" }] },
      }),
      AddItemToOrder: () => ({ addItemToOrder: ORDER }),
    })
    const result = await addToCart("proxeed-plus", 2)
    expect(result.error).toBeUndefined()
    expect(result.items).toHaveLength(1)
    expect(result.items[0].price).toBe(2550)
    expect(operationNames(calls)).toEqual(["ProductVariantIdBySlug", "AddItemToOrder"])
    expect(calls[1].variables).toEqual({ productVariantId: "v1", quantity: 2 })
  })

  it("returns product_not_found when Vendure has no such slug", async () => {
    const calls = mockVendureFetch({ ProductVariantIdBySlug: () => ({ product: null }) })
    const result = await addToCart("nope", 1)
    expect(result).toEqual({ items: [], error: "product_not_found" })
    expect(calls).toHaveLength(1)
  })

  it("passes Vendure error codes through untouched", async () => {
    mockVendureFetch({
      ProductVariantIdBySlug: () => ({
        product: { id: "p1", slug: "x", variants: [{ id: "v1", sku: "SKU-1" }] },
      }),
      AddItemToOrder: () => ({
        addItemToOrder: { errorCode: "INSUFFICIENT_STOCK_ERROR", message: "x", quantityAvailable: 0 },
      }),
    })
    const result = await addToCart("x", 99)
    expect(result.error).toBe("INSUFFICIENT_STOCK_ERROR")
  })

  it("returns network_error when Vendure is down", async () => {
    mockVendureDown()
    const result = await addToCart("x", 1)
    expect(result).toEqual({ items: [], error: "network_error" })
  })
})

describe("updateCartLine / removeCartLine", () => {
  it("adjusts quantity for qty > 0", async () => {
    const calls = mockVendureFetch({ AdjustOrderLine: () => ({ adjustOrderLine: ORDER }) })
    const result = await updateCartLine("l1", 3)
    expect(result.error).toBeUndefined()
    expect(operationNames(calls)).toEqual(["AdjustOrderLine"])
    expect(calls[0].variables).toEqual({ orderLineId: "l1", quantity: 3 })
  })

  it("removes the line for qty <= 0", async () => {
    const calls = mockVendureFetch({ RemoveOrderLine: () => ({ removeOrderLine: ORDER }) })
    await removeCartLine("l1")
    expect(operationNames(calls)).toEqual(["RemoveOrderLine"])
    expect(calls[0].variables).toEqual({ orderLineId: "l1" })
  })

  it("returns network_error when Vendure is down", async () => {
    mockVendureDown()
    expect(await updateCartLine("l1", 2)).toEqual({ items: [], error: "network_error" })
  })
})

describe("getEligibleShippingMethods", () => {
  it("sets address + prepaid flag, then maps methods", async () => {
    const calls = mockVendureFetch({
      SetOrderShippingAddress: () => ({ setOrderShippingAddress: ORDER }),
      SetOrderCustomFields: () => ({ setOrderCustomFields: { id: "1" } }),
      EligibleShippingMethods: () => ({ eligibleShippingMethods: METHODS }),
    })
    const result = await getEligibleShippingMethods(
      { governorate: "G", city: "C", address: "A", name: "N", phone: "P" },
      "bank_transfer"
    )
    expect(result.error).toBeUndefined()
    expect(result.methods).toEqual([{ id: "sm1", mode: "door_to_door", name: "Door", priceWithTax: 60 }])
    expect(operationNames(calls)).toEqual([
      "SetOrderShippingAddress",
      "SetOrderCustomFields",
      "EligibleShippingMethods",
    ])
    const customFields = calls[1].variables.input as { customFields: { prepaidShipping: boolean } }
    expect(customFields.customFields.prepaidShipping).toBe(true)
  })

  it("passes address errors through", async () => {
    mockVendureFetch({
      SetOrderShippingAddress: () => ({
        setOrderShippingAddress: { errorCode: "MISSING_ADDRESS_ERROR", message: "x" },
      }),
    })
    const result = await getEligibleShippingMethods(
      { governorate: "G", city: "C", address: "A", name: "N", phone: "P" },
      "cod"
    )
    expect(result).toEqual({ methods: [], error: "MISSING_ADDRESS_ERROR" })
  })

  it("returns network_error instead of throwing when Vendure is down", async () => {
    mockVendureDown()
    const result = await getEligibleShippingMethods(
      { governorate: "G", city: "C", address: "A", name: "N", phone: "P" },
      "cod"
    )
    expect(result).toEqual({ methods: [], error: "network_error" })
  })
})

describe("placeOrder", () => {
  const customer = {
    name: "عميل تجريبي",
    phone: "01012345678",
    governorate: "القليوبية",
    city: "العبور",
    address: "شارع 1",
  }

  function happyHandlers() {
    return {
      SetCustomerForOrder: () => ({ setCustomerForOrder: { id: "c1" } }),
      SetOrderShippingAddress: () => ({ setOrderShippingAddress: ORDER }),
      SetOrderCustomFields: () => ({ setOrderCustomFields: { id: "1" } }),
      EligibleShippingMethods: () => ({ eligibleShippingMethods: METHODS }),
      SetOrderShippingMethod: () => ({ setOrderShippingMethod: ORDER }),
      TransitionOrderToState: () => ({ transitionOrderToState: { id: "1", state: "ArrangingPayment" } }),
      AddPaymentToOrder: () => ({ addPaymentToOrder: ORDER }),
    }
  }

  it("runs the full mutation sequence and stamps the proof-of-purchase cookie", async () => {
    const calls = mockVendureFetch(happyHandlers())
    const result = await placeOrder({ customer, paymentMethod: "cod", fulfillmentMode: "door_to_door", agreedToTerms: true })
    expect(result.error).toBeUndefined()
    expect(result.order?.orderNumber).toBe("ORD1")
    expect(result.order?.total).toBe(2610)
    expect(operationNames(calls)).toEqual([
      "SetCustomerForOrder",
      "SetOrderShippingAddress",
      "SetOrderCustomFields",
      "SetOrderCustomFields",
      "EligibleShippingMethods",
      "SetOrderShippingMethod",
      "TransitionOrderToState",
      "AddPaymentToOrder",
    ])
    const payment = calls[7].variables.input as { method: string; metadata: { public: { paymentMethod: string } } }
    expect(payment.method).toBe("manual-settlement")
    expect(payment.metadata.public.paymentMethod).toBe("cod")
    expect(calls[6].variables).toEqual({ state: "ArrangingPayment" })
    expect(calls[5].variables).toEqual({ id: ["sm1"] })
    const notes = calls[3].variables.input as { customFields: { customerNotes: string } }
    expect(notes.customFields.customerNotes).toBe("")
    expect(__getTestCookie("npf_last_order")).toBe("ORD1")
  })

  it("carries the optional transfer reference into payment metadata (reconciliation only)", async () => {
    const calls = mockVendureFetch(happyHandlers())
    await placeOrder({
      customer,
      paymentMethod: "bank_transfer",
      fulfillmentMode: "door_to_door",
      agreedToTerms: true,
      transferRef: "  TXN-987654  ",
    })
    const payment = calls[7].variables.input as { metadata: { public: { transferRef?: string } } }
    expect(payment.metadata.public.transferRef).toBe("TXN-987654")
  })

  it("drops empty/whitespace transfer references instead of storing noise", async () => {
    const calls = mockVendureFetch(happyHandlers())
    await placeOrder({ customer, paymentMethod: "bank_transfer", fulfillmentMode: "door_to_door", agreedToTerms: true, transferRef: "   " })
    const payment = calls[7].variables.input as { metadata: { public: { transferRef?: string } } }
    expect(payment.metadata.public.transferRef).toBeUndefined()
  })

  it("caps oversized transfer references at 60 chars", async () => {
    const calls = mockVendureFetch(happyHandlers())
    await placeOrder({ customer, paymentMethod: "bank_transfer", fulfillmentMode: "door_to_door", agreedToTerms: true, transferRef: "X".repeat(200) })
    const payment = calls[7].variables.input as { metadata: { public: { transferRef?: string } } }
    expect(payment.metadata.public.transferRef).toBe("X".repeat(60))
  })

  it("rejects repricing before arranging payment; does not silently charge a changed total", async () => {
    const calls = mockVendureFetch(happyHandlers())
    expect(await placeOrder({customer,paymentMethod:"cod",fulfillmentMode:"door_to_door",agreedToTerms:true,expectedTotal:2600})).toEqual({order:null,error:"order_total_changed"})
    expect(operationNames(calls)).not.toContain("TransitionOrderToState")
    expect(operationNames(calls)).not.toContain("AddPaymentToOrder")
  })

  it("accepts the reviewed live total", async () => {
    mockVendureFetch(happyHandlers())
    expect((await placeOrder({customer,paymentMethod:"cod",fulfillmentMode:"door_to_door",agreedToTerms:true,expectedTotal:2610})).order?.orderNumber).toBe("ORD1")
  })

  it("blocks orders entirely in a design preview",async()=>{
    vi.stubEnv("NPF_PREVIEW_MODE","1")
    const calls=mockVendureFetch(happyHandlers())
    expect(await placeOrder({customer,paymentMethod:"cod",fulfillmentMode:"door_to_door",agreedToTerms:true})).toEqual({order:null,error:"preview_unavailable"})
    expect(calls).toHaveLength(0)
    vi.unstubAllEnvs()
  })

  it("flags prepaid shipping for bank transfer orders", async () => {
    const calls = mockVendureFetch(happyHandlers())
    await placeOrder({ customer, paymentMethod: "bank_transfer", fulfillmentMode: "door_to_door", agreedToTerms: true })
    const customFields = calls[2].variables.input as { customFields: { prepaidShipping: boolean } }
    expect(customFields.customFields.prepaidShipping).toBe(true)
  })

  it("rejects without terms agreement and calls nothing", async () => {
    const calls = mockVendureFetch(happyHandlers())
    const result = await placeOrder({ customer, paymentMethod: "cod", fulfillmentMode: "door_to_door", agreedToTerms: false })
    expect(result).toEqual({ order: null, error: "terms_not_accepted" })
    expect(calls).toHaveLength(0)
    expect(__getTestCookie("npf_last_order")).toBeUndefined()
  })

  it("tolerates ALREADY_LOGGED_IN_ERROR from setCustomerForOrder", async () => {
    mockVendureFetch({
      ...happyHandlers(),
      SetCustomerForOrder: () => ({
        setCustomerForOrder: { errorCode: "ALREADY_LOGGED_IN_ERROR", message: "x" },
      }),
    })
    const result = await placeOrder({ customer, paymentMethod: "cod", fulfillmentMode: "door_to_door", agreedToTerms: true })
    expect(result.error).toBeUndefined()
    expect(result.order?.orderNumber).toBe("ORD1")
  })

  it("fails cleanly with no eligible shipping method", async () => {
    mockVendureFetch({
      ...happyHandlers(),
      EligibleShippingMethods: () => ({ eligibleShippingMethods: [] }),
    })
    const result = await placeOrder({ customer, paymentMethod: "cod", fulfillmentMode: "door_to_door", agreedToTerms: true })
    expect(result).toEqual({ order: null, error: "no_eligible_shipping_method" })
    expect(__getTestCookie("npf_last_order")).toBeUndefined()
  })

  it("rejects a stale fulfillment choice instead of substituting another method", async () => {
    const calls = mockVendureFetch({
      ...happyHandlers(),
      EligibleShippingMethods: () => ({ eligibleShippingMethods: [{ ...METHODS[0], code: "branch-dropoff" }] }),
    })
    const result = await placeOrder({ customer, paymentMethod: "cod", fulfillmentMode: "door_to_door", agreedToTerms: true })
    expect(result).toEqual({ order: null, error: "fulfillment_selection_changed" })
    expect(operationNames(calls)).not.toContain("SetOrderShippingMethod")
  })

  it("validates checkout fields before touching the order", async () => {
    const calls = mockVendureFetch(happyHandlers())
    const result = await placeOrder({
      customer: { ...customer, phone: "not-a-phone" },
      paymentMethod: "cod",
      fulfillmentMode: "door_to_door",
      agreedToTerms: true,
    })
    expect(result).toEqual({ order: null, error: "invalid_checkout_data" })
    expect(calls).toHaveLength(0)
  })

  it("persists company in the shipping address and notes in order custom fields", async () => {
    const calls = mockVendureFetch(happyHandlers())
    await placeOrder({
      customer: { ...customer, company: "Test Pharmacy", notes: "Leave at reception" },
      paymentMethod: "cod",
      fulfillmentMode: "door_to_door",
      agreedToTerms: true,
    })
    const address = calls[1].variables.input as { company?: string }
    const notes = calls[3].variables.input as { customFields: { customerNotes: string } }
    expect(address.company).toBe("Test Pharmacy")
    expect(notes.customFields.customerNotes).toBe("Leave at reception")
  })

  it("returns network_error instead of throwing when Vendure is down", async () => {
    mockVendureDown()
    const result = await placeOrder({ customer, paymentMethod: "cod", fulfillmentMode: "door_to_door", agreedToTerms: true })
    expect(result).toEqual({ order: null, error: "network_error" })
  })
})

describe("reorderItems", () => {
  it("re-adds per line and reports added vs unavailable slugs", async () => {
    mockVendureFetch({
      ProductVariantIdBySlug: (variables) =>
        variables.slug === "gone"
          ? { product: null }
          : { product: { id: "p1", slug: variables.slug, variants: [{ id: "v1", sku: "SKU-1" }] } },
      AddItemToOrder: () => ({ addItemToOrder: ORDER }),
    })
    const result = await reorderItems([
      { slug: "proxeed-plus", qty: 1 },
      { slug: "gone", qty: 2 },
    ])
    expect(result.addedSlugs).toEqual(["proxeed-plus"])
    expect(result.unavailableSlugs).toEqual(["gone"])
    expect(result.items).toHaveLength(1)
  })

  it("returns the unchanged cart when every line fails", async () => {
    mockVendureFetch({
      ProductVariantIdBySlug: () => ({ product: null }),
      ActiveOrder: () => ({ activeOrder: ORDER }),
    })
    const result = await reorderItems([{ slug: "gone", qty: 1 }])
    expect(result.addedSlugs).toEqual([])
    expect(result.unavailableSlugs).toEqual(["gone"])
    expect(result.items).toHaveLength(1)
  })
})
