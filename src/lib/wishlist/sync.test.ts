import { beforeEach, describe, expect, it, vi } from "vitest"

import { pullWishlist, pushWishlist } from "./sync"

/**
 * F-20 — sync actions: session gating, sanitization, upsert mechanics.
 * `@/payload.config` is mocked (its real import validates env at load, which
 * this sandbox intentionally has no full env for) and `payload`'s getPayload
 * returns a stub client whose Local-API calls are spied.
 */
const payloadClient = {
  find: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
}

vi.mock("@/payload.config", () => ({ default: {} }))
vi.mock("payload", () => ({
  getPayload: vi.fn(async () => payloadClient),
}))
vi.mock("@/lib/auth/active-customer", () => ({
  getActiveCustomer: vi.fn(),
}))

import { getActiveCustomer } from "@/lib/auth/active-customer"

const getActiveCustomerMock = vi.mocked(getActiveCustomer)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("pushWishlist", () => {
  it("refuses to touch Payload for anonymous visitors", async () => {
    getActiveCustomerMock.mockResolvedValue(null)
    const result = await pushWishlist(["proxeed-plus"])
    expect(result).toEqual({ synced: false })
    expect(payloadClient.find).not.toHaveBeenCalled()
  })

  it("creates the customer document with sanitized, validated slugs", async () => {
    getActiveCustomerMock.mockResolvedValue({ id: "42" } as never)
    payloadClient.find.mockResolvedValue({ docs: [] })
    const result = await pushWishlist(["proxeed-plus", "BAD 'slug';-- DROP", "ft-journey-mobile"])
    expect(result).toEqual({ synced: true })
    expect(payloadClient.create).toHaveBeenCalledWith({
      collection: "wishlists",
      overrideAccess: true,
      data: {
        customerId: "42",
        slugs: [{ slug: "proxeed-plus" }, { slug: "ft-journey-mobile" }],
      },
    })
  })

  it("updates the existing document instead of creating a duplicate", async () => {
    getActiveCustomerMock.mockResolvedValue({ id: "42" } as never)
    payloadClient.find.mockResolvedValue({ docs: [{ id: "doc-9" }] })
    await pushWishlist(["proxeed-plus"])
    expect(payloadClient.update).toHaveBeenCalledWith({
      collection: "wishlists",
      id: "doc-9",
      overrideAccess: true,
      data: { customerId: "42", slugs: [{ slug: "proxeed-plus" }] },
    })
    expect(payloadClient.create).not.toHaveBeenCalled()
  })

  it("degrades to local-only when Payload is down (never throws to the caller)", async () => {
    getActiveCustomerMock.mockResolvedValue({ id: "42" } as never)
    payloadClient.find.mockRejectedValue(new Error("ECONNREFUSED"))
    const result = await pushWishlist(["proxeed-plus"])
    expect(result).toEqual({ synced: false })
  })
})

describe("pullWishlist", () => {
  it("returns an empty unsynced result for anonymous visitors", async () => {
    getActiveCustomerMock.mockResolvedValue(null)
    const result = await pullWishlist()
    expect(result).toEqual({ synced: false, slugs: [] })
    expect(payloadClient.find).not.toHaveBeenCalled()
  })

  it("returns the stored slugs for a signed-in customer", async () => {
    getActiveCustomerMock.mockResolvedValue({ id: "42" } as never)
    payloadClient.find.mockResolvedValue({
      docs: [{ id: "doc-9", slugs: [{ slug: "proxeed-plus" }, { slug: "ft-journey-mobile" }] }],
    })
    const result = await pullWishlist()
    expect(result).toEqual({ synced: true, slugs: ["proxeed-plus", "ft-journey-mobile"] })
  })
})
