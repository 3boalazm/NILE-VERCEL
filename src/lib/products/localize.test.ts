import { describe, expect, it } from "vitest"

import { localizeCategory, localizeProduct } from "./localize"
import type { Product, ProductCategory } from "./types"

const baseProduct = {
  slug: "proxeed-plus",
  name: "Proxeed Plus",
  shortDescription: "وصف عربي",
  keyBenefits: ["ميزة عربية"],
} as Product

const baseCategory = { slug: "supplements", name: "مكملات غذائية" } as ProductCategory

describe("localizeProduct", () => {
  it("returns the product untouched for ar", () => {
    expect(localizeProduct(baseProduct, "ar")).toBe(baseProduct)
  })

  it("returns the product untouched when no en translation exists", () => {
    expect(localizeProduct(baseProduct, "en")).toBe(baseProduct)
  })

  it("merges en overrides onto the base fields for en", () => {
    const product: Product = {
      ...baseProduct,
      translations: { en: { shortDescription: "English description" } },
    }
    const localized = localizeProduct(product, "en")
    expect(localized.shortDescription).toBe("English description")
    // Non-overridden fields survive from the base.
    expect(localized.name).toBe("Proxeed Plus")
    expect(localized.keyBenefits).toEqual(["ميزة عربية"])
  })
})

describe("localizeCategory", () => {
  it("returns the category untouched for ar", () => {
    expect(localizeCategory(baseCategory, "ar")).toBe(baseCategory)
  })

  it("merges en overrides onto the base fields for en", () => {
    const category: ProductCategory = {
      ...baseCategory,
      translations: { en: { name: "Food Supplements" } },
    }
    const localized = localizeCategory(category, "en")
    expect(localized.name).toBe("Food Supplements")
    expect(localized.slug).toBe("supplements")
  })
})
