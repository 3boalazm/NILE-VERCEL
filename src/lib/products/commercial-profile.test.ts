import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { dictionaries } from "@/lib/i18n/dictionaries"
import { selectRelatedProducts } from "@/lib/content/links"
import { localizeProduct } from "@/lib/products/localize"
import { MockProductRepository } from "@/lib/products/mock-repository"
import { buildProductJsonLd } from "@/lib/seo/product-schema"
import { isSearchIndexEligible } from "@/lib/seo/indexability"
import { productHeading } from "@/lib/seo/product-identity"
import { CANONICAL_ORIGIN } from "@/lib/seo/site"
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries"

import {
  categoryLandingDecision,
  commercialFacts,
  commercialProfile,
  commercialSections,
} from "./commercial-profile"

const repository = new MockProductRepository()
const products = await repository.getAllProducts()
const categories = await repository.getAllCategories()

function bySlug(slug: string) {
  const product = products.find((item) => item.slug === slug)
  if (!product) throw new Error(`missing ${slug}`)
  return product
}

describe("commercial search profile", () => {
  it("marks only the two devices ready and omits brand and manufacturer", () => {
    const ready = products.filter((product) => commercialProfile(product).searchReadiness === "READY").map((product) => product.slug)
    expect(ready.sort()).toEqual(["ca-mi-ir-thermometer", "ca-mi-pulse-oximeter"])
    for (const product of products) {
      const profile = commercialProfile(product)
      expect(profile.fields.brand).toBe("MISSING")
      expect(profile.fields.manufacturer).toBe("MISSING")
      expect(profile.sections.brand).toBe(false)
      expect(profile.sections.manufacturer).toBe(false)
      expect(profile.sections.generatedFaq).toBe(false)
      expect(profile.indexable).toBe(isSearchIndexEligible(product))
      expect(productHeading(product, "ar")).toBe(product.nameArabic)
      expect(productHeading(product, "en")).toBe(product.name)
    }
  })

  it("does not put unverified or unconfirmed facts into the commercial fact list", () => {
    const device = bySlug("ca-mi-pulse-oximeter")
    expect(commercialFacts(device, { categoryName: "Medical Devices", availability: "Available" }).map((fact) => fact.key)).toEqual([
      "category",
      "form",
      "sku",
      "availability",
    ])
    const unconfirmed = bySlug("proxeed-women-inositol")
    expect(commercialFacts(unconfirmed, { categoryName: "Supplements", availability: "Coming Soon" }).map((fact) => fact.key)).not.toContain(
      "form"
    )
    const noBrand = commercialFacts(device, { categoryName: "Medical Devices", availability: "Available" })
    expect(JSON.stringify(noBrand)).not.toContain("CA-MI")
    expect(JSON.stringify(noBrand)).not.toContain("Alfasigma")
  })

  it("hides empty optional sections and does not invent a FAQ", () => {
    const bare = {
      ...bySlug("ca-mi-pulse-oximeter"),
      keyBenefits: [],
      usage: undefined,
      composition: undefined,
      scientificInfo: undefined,
      downloadUrl: undefined,
      faq: undefined,
      translations: undefined,
    }
    expect(commercialSections(bare)).toEqual({
      benefits: false,
      usage: false,
      composition: false,
      science: false,
      leaflet: false,
      existingFaq: false,
      brand: false,
      manufacturer: false,
      generatedFaq: false,
    })
    expect(commercialFacts(bare, { availability: "Available" }).some((fact) => fact.key === "category")).toBe(false)
    expect(commercialFacts(bare, { availability: "Available" }).map((fact) => fact.key)).toEqual(["form", "sku", "availability"])
  })

  it("keeps every current category off a dedicated landing page", () => {
    for (const category of categories) {
      expect(categoryLandingDecision(category, products).publishable).toBe(false)
    }
    expect(categoryLandingDecision(categories.find((item) => item.slug === "supplements")!, products).reason).toBe(
      "no indexable products"
    )
    expect(categoryLandingDecision(categories.find((item) => item.slug === "medical-devices")!, products).reason).toMatch(/brand field/)
    expect(categoryLandingDecision(categories.find((item) => item.slug === "dental")!, products).reason).toBe("no real products")
    for (const path of ["medical-devices", "supplements", "mens-health", "womens-health", "fertility"]) {
      expect(readFileSync("src/app/[locale]/products/page.tsx", "utf8")).not.toContain(`/${path}"`)
    }
  })
})

describe("product page search contract", () => {
  it("uses stored names, a canonical product URL, and sitemap membership only when eligible", () => {
    const entries = buildSitemapEntries(products)
    for (const product of products) {
      for (const locale of ["ar", "en"] as const) {
        const heading = productHeading(product, locale)
        expect(heading.length).toBeGreaterThan(0)
        expect(`${CANONICAL_ORIGIN}/${locale}/products/${product.slug}`).not.toContain("?")
      }
      const inSitemap = entries.some((entry) => entry.url.endsWith(`/products/${product.slug}`))
      expect(inSitemap).toBe(isSearchIndexEligible(product))
    }
    const listing = readFileSync("src/app/[locale]/products/page.tsx", "utf8")
    const metaStart = listing.indexOf("export async function generateMetadata")
    const metaEnd = listing.indexOf("export default", metaStart)
    expect(listing.slice(metaStart, metaEnd)).not.toContain("searchParams")
    const navStart = listing.indexOf('aria-label="Breadcrumb"')
    const navEnd = listing.indexOf("</nav>", navStart)
    expect(listing.slice(navStart, navEnd)).not.toContain("?")
  })

  it("adds device specs to schema and still omits brand, manufacturer, and supplement composition", () => {
    const device = buildProductJsonLd(
      localizeProduct(bySlug("ca-mi-pulse-oximeter"), "en"),
      "en",
      dictionaries.en.siteName,
      "Medical Devices"
    )
    expect(device.additionalProperty).toEqual(
      expect.arrayContaining([{ "@type": "PropertyValue", name: "Battery", value: "2 x AAA batteries, ~30 hours of operation" }])
    )
    expect(device).not.toHaveProperty("brand")
    expect(device).not.toHaveProperty("manufacturer")
    const supplement = buildProductJsonLd(bySlug("proxeed-plus"), "ar", dictionaries.ar.siteName, "مكملات غذائية")
    expect(supplement).not.toHaveProperty("additionalProperty")
    expect(supplement).not.toHaveProperty("brand")
    expect(JSON.stringify(supplement)).not.toContain("aggregateRating")
  })

  it("does not promote paused products or cross audience as substitutes", () => {
    expect(selectRelatedProducts(bySlug("ellamuselle"), products)).toEqual([])
    expect(selectRelatedProducts(bySlug("proxeed-plus"), products).map((item) => item.slug)).not.toContain("proxerex")
    expect(selectRelatedProducts(bySlug("ca-mi-pulse-oximeter"), products).every((item) => item.status === "active")).toBe(true)
  })

  it("keeps Arabic and English metadata distinct", () => {
    const device = bySlug("ca-mi-ir-thermometer")
    expect(productHeading(device, "ar")).not.toBe(productHeading(device, "en"))
    expect(device.translations?.en?.shortDescription).not.toBe(device.shortDescription)
    const page = readFileSync("src/app/[locale]/products/[slug]/page.tsx", "utf8")
    expect(page).toContain("productHeading(product, locale)")
    expect(page).toContain('lang="ar"')
    expect(page).toContain("ProductCommercialFacts")
    expect(page).not.toContain("brand:")
    expect(page).not.toContain("manufacturer:")
  })
})
