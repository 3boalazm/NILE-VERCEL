import { describe, it, expect } from "vitest"
import { resolveCatalogPrice } from "./catalog-price"
import { localizedDiscoveryHref } from "./discovery"
import { productStructuredData, safeJsonLd } from "./structured-data"
import { MockProductRepository } from "./mock-repository"

describe("catalog integrity", () => {
  const demo = { price: 100, currency: "EGP", sku: "demo" }
  it("fails closed on missing live money unless explicitly opted into demo", () => {
    expect(resolveCatalogPrice(undefined, demo, false)).toMatchObject({
      price: undefined,
      priceSource: "unavailable",
    })
    expect(resolveCatalogPrice(undefined, demo, true)).toMatchObject({
      price: 100,
      priceSource: "demo",
    })
    expect(
      resolveCatalogPrice({ ...demo, price: 120 }, demo, true)
    ).toMatchObject({ price: 120, priceSource: "live" })
    expect(
      resolveCatalogPrice({ ...demo, price: NaN }, demo, false).price
    ).toBeUndefined()
  })
  it("never emits mock offers, invented manufacturer or inventory", async () => {
    const product = (await new MockProductRepository().getAllProducts())[0]
    const schema = productStructuredData(product, "en")
    expect(schema).not.toHaveProperty("brand")
    expect(schema).not.toHaveProperty("offers")
    const live = productStructuredData(
      { ...product, priceSource: "live" },
      "en"
    )
    expect(live).toHaveProperty("offers.price", product.price)
    expect(live).not.toHaveProperty("offers.availability")
  })
  it("escapes HTML parser end tags in structured data", () => {
    const serialized = safeJsonLd({
      name: "</script><img src=x onerror=alert(1)>",
    })
    expect(serialized).not.toContain("<")
    expect(JSON.parse(serialized).name).toContain("</script>")
  })
})
describe("language discovery context", () => {
  it("preserves safe discovery context, never auth/reset/redirect tokens", () => {
    const result = localizedDiscoveryHref(
      "/en/products",
      new URLSearchParams(
        "q=Proxeed&category=male&need=men&sort=name-desc&token=secret&redirect=https://evil.test"
      ),
      "ar"
    )
    expect(result).toContain("/ar/products?")
    expect(result).toContain("q=Proxeed")
    expect(result).toContain("sort=name-desc")
    expect(result).not.toContain("secret")
    expect(result).not.toContain("evil")
  })
  it("bounds preserved values", () => {
    expect(
      localizedDiscoveryHref(
        "/en/products",
        new URLSearchParams({ q: "x".repeat(1000) }),
        "ar"
      ).length
    ).toBeLessThan(250)
  })
})
