import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"
vi.mock("payload", () => ({ getPayload: vi.fn() }))
vi.mock("@/payload.config", () => ({ default: {} }))
vi.mock("@/lib/vendure/pricing", () => ({ getLivePrices: vi.fn() }))
import { getPayload } from "payload"
import { getLivePrices } from "@/lib/vendure/pricing"
import { PayloadProductRepository } from "./payload-repository"
const doc = {
  id: 1,
  slug: "proxeed-plus",
  name: "Proxeed Plus",
  status: "active",
  category: { slug: "food-supplements" },
  keyBenefits: [],
  composition: [],
}
beforeEach(() => {
  vi.stubEnv("MOCK_CATALOG_FALLBACK", "0")
  vi.mocked(getPayload).mockResolvedValue({
    find: vi.fn().mockResolvedValue({ docs: [doc] }),
  } as never)
  vi.mocked(getLivePrices).mockResolvedValue(new Map())
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})
describe("real repository pricing boundary", () => {
  it("doesn't overwrite unavailable provenance with bridge money in the mapped product", async () => {
    const p = await new PayloadProductRepository().getProductBySlug(
      "proxeed-plus"
    )
    expect(p).toMatchObject({ priceSource: "unavailable" })
    expect(p?.price).toBeUndefined()
    expect(p?.currency).toBeUndefined()
    expect(p?.sku).toBeUndefined()
  })
  it("labels explicitly allowed bridge money as demo", async () => {
    vi.stubEnv("MOCK_CATALOG_FALLBACK", "1")
    const p = await new PayloadProductRepository().getProductBySlug(
      "proxeed-plus"
    )
    expect(p).toMatchObject({ priceSource: "demo", price: 2550 })
  })
  it("prefers live price and currency without an editorial override", async () => {
    vi.mocked(getLivePrices).mockResolvedValue(
      new Map([
        ["proxeed-plus", { price: 2700, currency: "EGP", sku: "live-sku" }],
      ])
    )
    const p = await new PayloadProductRepository().getProductBySlug(
      "proxeed-plus"
    )
    expect(p).toMatchObject({
      priceSource: "live",
      price: 2700,
      currency: "EGP",
      sku: "live-sku",
    })
  })
})
