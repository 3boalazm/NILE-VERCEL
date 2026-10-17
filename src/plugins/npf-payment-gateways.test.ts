import { describe, expect, it, vi } from "vitest"

import {
  CARD_GATEWAY_CODES,
  kashierOrderHash,
  kashierPaymentHandler,
  kashierSignatureValid,
  paymobHmacValid,
  paymobPaymentHandler,
} from "./npf-payment-gateways"

// Straight re-implementation with node:crypto so the tests pin the EXACT
// documented HMAC inputs rather than the implementation's own code path.
import { createHmac } from "node:crypto"

/** Vendure stores per-method args as ConfigArg[] and hashes them inside
 * createPayment — tests must pass the same array shape. */
const gatewayArgs =
  (defaults: Record<string, string>) =>
  (overrides: Record<string, string> = {}): ConfigArg[] =>
    Object.entries({ ...defaults, ...overrides }).map(([name, value]) => ({ name, value }))
type ConfigArg = { name: string; value: string }

const baseOrder = {
  id: "1",
  code: "ABCD1234",
  state: "ArrangingPayment",
  active: true,
  customer: { firstName: "أحمد", lastName: "سعيد", emailAddress: "a@b.c", phoneNumber: "+201000000000" },
  shippingAddress: { fullName: "أحمد سعيد", streetLine1: "11 ش إمام مالك", city: "العبور", province: "القليوبية", postalCode: "11234" },
  lines: [],
  shippingLines: [],
  surcharges: [],
  discounts: [],
} as unknown as Parameters<typeof paymobPaymentHandler.createPayment>[1]

const ctx = { channel: { code: "__default_channel__" } } as Parameters<typeof paymobPaymentHandler.createPayment>[0]

describe("gateway codes", () => {
  it("declares paymob, kashier and fawry", () => {
    expect(CARD_GATEWAY_CODES).toEqual(["paymob", "kashier", "fawry"])
  })
})

describe("paymob handler", () => {
  it("declines while unconfigured — never throws", async () => {
    const result = await paymobPaymentHandler.createPayment(ctx, baseOrder, 750000, gatewayArgs({ apiKey: " ", integrationId: "", iframeId: "", hmacSecret: "" })(), {}, undefined as unknown as Parameters<typeof paymobPaymentHandler.createPayment>[5])
    expect(result.state).toBe("Declined")
  })

  it("runs auth → order → payment key and returns Authorized + hosted-iframe redirect", async () => {
    const calls: Array<{ url: string; body?: Record<string, unknown> }> = []
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined
      calls.push({ url: String(url), body })
      if (String(url).endsWith("/auth/tokens")) {
        return new Response(JSON.stringify({ token: "AUTH-TOKEN" }), { status: 200 })
      }
      if (String(url).endsWith("/ecommerce/orders")) {
        return new Response(JSON.stringify({ id: 987654 }), { status: 200 })
      }
      if (String(url).endsWith("/payment_keys")) {
        return new Response(JSON.stringify({ token: "PAYMENT-KEY" }), { status: 200 })
      }
      return new Response("nope", { status: 404 })
    })
    vi.stubGlobal("fetch", fetchMock)
    try {
      const result = await paymobPaymentHandler.createPayment(ctx, baseOrder, 750000, gatewayArgs({ apiKey: "KEY", integrationId: "12", iframeId: "34", hmacSecret: "SECRET" })(), {}, undefined as unknown as Parameters<typeof paymobPaymentHandler.createPayment>[5])
      expect(result.state).toBe("Authorized")
      expect(result.amount).toBe(750000)
      const metadata = result.metadata as { public: { redirectUrl: string; gateway: string }; paymobOrderId: string }
      expect(metadata.public.gateway).toBe("paymob")
      expect(metadata.public.redirectUrl).toContain("/api/acceptance/iframes/34?payment_token=PAYMENT-KEY")
      expect(metadata.paymobOrderId).toBe("987654")
      // amount is forwarded untouched: Vendure minor units == Paymob amount_cents
      expect(calls[1].body?.amount_cents).toBe(750000)
      // the payment key request references Paymob's own order id + integration
      expect(calls[2].body?.order_id).toBe(987654)
      expect(calls[2].body?.integration_id).toBe(12)
      expect(calls[2].body?.currency).toBe("EGP")
      // billing data comes from the order, never hardcoded to a person
      const billing = calls[2].body?.billing_data as Record<string, string>
      expect(billing.first_name).toBe("أحمد")
      expect(billing.city).toBe("العبور")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("returns Error (with top-level errorMessage) when a gateway call fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("denied", { status: 401 })))
    try {
      const result = await paymobPaymentHandler.createPayment(ctx, baseOrder, 100, gatewayArgs({ apiKey: "KEY", integrationId: "12", iframeId: "34", hmacSecret: "SECRET" })(), {}, undefined as unknown as Parameters<typeof paymobPaymentHandler.createPayment>[5])
      expect(result.state).toBe("Error")
      expect((result as { errorMessage: string }).errorMessage).toContain("401")
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe("paymobHmacValid", () => {
  const sampleObj = {
    id: 551,
    amount_cents: 750000,
    created_at: "2026-09-23T21:00:00Z",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    integration_id: 12,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: false,
    is_voided: false,
    order: { id: 987654, merchant_order_id: "ABCD1234-1" },
    owner: 11,
    pending: false,
    source_data: { pan: "2346", sub_type: "MasterCard", type: "c" },
    success: true,
  }

  it("accepts the HMAC computed over the documented field ordering", () => {
    const concatenated = [
      sampleObj.amount_cents,
      sampleObj.created_at,
      sampleObj.currency,
      "false", // error_occured
      "false", // has_parent_transaction
      sampleObj.id,
      sampleObj.integration_id,
      "true", // is_3d_secure
      "false",
      "false",
      "false",
      "false",
      "false",
      sampleObj.order.id,
      sampleObj.owner,
      "false", // pending
      sampleObj.source_data.pan,
      sampleObj.source_data.sub_type,
      sampleObj.source_data.type,
      "true", // success
    ].join("")
    const hmac = createHmac("sha256", "SECRET").update(concatenated).digest("hex")
    expect(paymobHmacValid(sampleObj, hmac, "SECRET")).toBe(true)
  })

  it("rejects a tampered payload, wrong secret, and missing hmac", () => {
    const concatenated = [
      sampleObj.amount_cents,
      sampleObj.created_at,
      sampleObj.currency,
      "false",
      "false",
      sampleObj.id,
      sampleObj.integration_id,
      "true",
      "false",
      "false",
      "false",
      "false",
      "false",
      sampleObj.order.id,
      sampleObj.owner,
      "false",
      sampleObj.source_data.pan,
      sampleObj.source_data.sub_type,
      sampleObj.source_data.type,
      "true",
    ].join("")
    const valid = createHmac("sha256", "SECRET").update(concatenated).digest("hex")
    expect(paymobHmacValid(sampleObj, valid, "SECRET")).toBe(true)
    expect(paymobHmacValid({ ...sampleObj, amount_cents: 1 }, valid, "SECRET")).toBe(false)
    expect(paymobHmacValid(sampleObj, valid, "WRONG")).toBe(false)
    expect(paymobHmacValid(sampleObj, undefined, "SECRET")).toBe(false)
  })
})

describe("kashier handler + hash", () => {
  it("computes the order hash over the alphabetical param order", () => {
    const hash = kashierOrderHash({ merchantId: "MID", orderId: "O-1", amountMajor: "7500.00", currency: "EGP", mode: "live", apiKey: "AKEY" })
    expect(hash).toBe(createHmac("sha256", "AKEY").update("amount=7500.00&currency=EGP&merchantId=MID&orderId=O-1&mode=live").digest("hex"))
  })

  it("declines while unconfigured", async () => {
    const result = await kashierPaymentHandler.createPayment(ctx, baseOrder, 750000, gatewayArgs({ merchantId: "", apiKey: "" })(), {}, undefined as unknown as Parameters<typeof paymobPaymentHandler.createPayment>[5])
    expect(result.state).toBe("Declined")
  })

  it("builds the hosted-checkout redirect without any outbound call", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    try {
      const result = await kashierPaymentHandler.createPayment(ctx, baseOrder, 750000, gatewayArgs({ merchantId: "MID", apiKey: "AKEY", mode: "test" })(), {}, undefined as unknown as Parameters<typeof paymobPaymentHandler.createPayment>[5])
      expect(result.state).toBe("Authorized")
      const metadata = result.metadata as { public: { redirectUrl: string; gateway: string }; kashierOrderId: string }
      expect(metadata.public.gateway).toBe("kashier")
      expect(fetchMock).not.toHaveBeenCalled()
      expect(metadata.public.redirectUrl).toContain("#/pay/MID")
      // Kashier's SPA params live INSIDE the hash fragment (#/pay/MID?...) —
      // parse the fragment's query string, not URL.searchParams.
      const fragmentQuery = metadata.public.redirectUrl.split("?")[1] ?? ""
      const params = new URLSearchParams(fragmentQuery)
      expect(params.get("amount")).toBe("7500.00")
      expect(params.get("currency")).toBe("EGP")
      expect(params.get("mode")).toBe("test")
      expect(params.get("hash")).toBe(
        kashierOrderHash({
          merchantId: "MID",
          orderId: params.get("orderId") as string,
          amountMajor: "7500.00",
          currency: "EGP",
          mode: "test",
          apiKey: "AKEY",
        })
      )
      expect(metadata.kashierOrderId).toBe(params.get("orderId"))
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe("kashierSignatureValid", () => {
  it("verifies HMAC over the exact raw body bytes", () => {
    const raw = '{"event":"transaction.authorized","data":{"orderId":"O-1"}}'
    const sig = createHmac("sha256", "AKEY").update(raw).digest("hex")
    expect(kashierSignatureValid(raw, sig, "AKEY")).toBe(true)
    // one changed byte in the body breaks the signature
    expect(kashierSignatureValid(raw.replace("O-1", "O-2"), sig, "AKEY")).toBe(false)
    expect(kashierSignatureValid(raw, sig, "WRONG")).toBe(false)
    expect(kashierSignatureValid(raw, undefined, "AKEY")).toBe(false)
  })
})
