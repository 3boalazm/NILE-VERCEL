import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { dictionaries } from "@/lib/i18n/dictionaries"
import { localizeProduct } from "@/lib/products/localize"
import { MockProductRepository } from "@/lib/products/mock-repository"
import type { Product } from "@/lib/products/types"
import { buildProductJsonLd } from "@/lib/seo/product-schema"
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries"

import { isSearchIndexEligible } from "./indexability"
import {
  SKU_REQUIRED_BY_CATALOG_MODEL,
  canExposeClaim,
  canExposeField,
  canUseSkuInContent,
  isProductSearchEligible,
  productIndexDecision,
  searchDescription,
  skuAssessment,
} from "./sku-evidence"

const products = await new MockProductRepository().getAllProducts()

function bySlug(slug: string): Product {
  const product = products.find((item) => item.slug === slug)
  if (!product) throw new Error(`missing ${slug}`)
  return product
}

const device = bySlug("ca-mi-pulse-oximeter")

function clearedSupplement(): Product {
  const statement = "Stored identity line."
  return {
    ...device,
    id: "future-supplement",
    slug: "cleared-supplement",
    name: "Cleared Supplement",
    nameArabic: "مكمل معتمد",
    categorySlug: "supplements",
    status: "active",
    shortDescription: statement,
    keyBenefits: [],
    composition: [{ label: "Ingredient", value: "Listed amount" }],
    compositionNote: undefined,
    usage: undefined,
    availableForm: "30 sachets",
    scientificInfo: undefined,
    downloadUrl: undefined,
    faq: undefined,
    testimonials: undefined,
    clinicalReferences: undefined,
    sku: "CLR-001",
    translations: undefined,
    evidencePack: {
      references: [
        {
          id: "ref-1",
          kind: "internal_approved_source",
          locator: "internal-review-record",
          reviewStatus: "approved",
          covers: ["identity", "composition_spec", "health_claim"],
        },
      ],
      claims: [
        {
          id: "claim-1",
          statement,
          evidenceIds: ["ref-1"],
          reviewStatus: "approved",
          allowedContexts: ["PRODUCT_PAGE", "PRODUCT_SCHEMA", "SITEMAP", "COMMERCIAL_COPY", "EDITORIAL_CONTENT", "MEDICAL_CONTENT"],
        },
      ],
      claimReview: {
        reviewStatus: "approved",
        publicClaims: "listed",
        evidenceIds: ["ref-1"],
      },
    },
  }
}

describe("sku evidence states", () => {
  it("keeps the current catalog on the known eligibility result", () => {
    const rows = products.map(skuAssessment)
    expect(rows.filter((row) => row.eligible).map((row) => row.slug).sort()).toEqual([
      "ca-mi-ir-thermometer",
      "ca-mi-pulse-oximeter",
    ])
    for (const slug of ["proxeed-plus", "proxeed-women", "proxerex", "proxeed-men", "ellamuselle", "proxeed-women-inositol"]) {
      const row = rows.find((item) => item.slug === slug)!
      expect(row.eligible).toBe(false)
      expect(row.reasons).toContain("supplement_claim_clearance_absent")
      expect(row.claims).not.toBe("VERIFIED")
      expect(row.brandManufacturer).toBe("MISSING")
    }
    expect(skuAssessment(bySlug("proxeed-men")).reasons).toContain("status_not_active")
    expect(skuAssessment(bySlug("ellamuselle")).reasons).toContain("status_not_active")
    expect(skuAssessment(bySlug("proxeed-women-inositol")).fields.form.state).toBe("UNVERIFIED")
    expect(skuAssessment(bySlug("proxeed-women-inositol")).fields.composition.state).not.toBe("VERIFIED")
    expect(skuAssessment(bySlug("proxeed-plus")).evidence).toBe("UNVERIFIED")
    expect(skuAssessment(device).evidence).toBe("NOT_APPLICABLE")
    expect(skuAssessment(device).claims).toBe("NOT_APPLICABLE")
    expect(isProductSearchEligible(device)).toBe(isSearchIndexEligible(device))
  })

  it("does not treat a leaflet path or active status as claim clearance", () => {
    expect(bySlug("proxeed-plus").status).toBe("active")
    expect(bySlug("proxeed-plus").downloadUrl).toBeTruthy()
    expect(isProductSearchEligible(bySlug("proxeed-plus"))).toBe(false)
    expect(skuAssessment(bySlug("proxeed-plus")).fields.leaflet.state).toBe("UNVERIFIED")
  })

  it("blocks missing identity, conflicting identity, and inactive products", () => {
    expect(SKU_REQUIRED_BY_CATALOG_MODEL).toBe(false)
    expect(isProductSearchEligible({ ...device, sku: undefined })).toBe(true)
    expect(productIndexDecision({ ...device, slug: "" }).reasons).toContain("missing_slug")
    expect(productIndexDecision({ ...device, name: " " }).reasons).toContain("missing_latin_name")
    expect(productIndexDecision({ ...device, nameArabic: undefined }).reasons).toContain("missing_arabic_name")
    const conflict = { ...device, evidencePack: { identity: { sku: "OTHER-SKU" } } }
    expect(productIndexDecision(conflict).reasons).toContain("conflicting_identity")
    expect(isProductSearchEligible(conflict)).toBe(false)
    expect(canExposeField(conflict, "sku", "PRODUCT_SCHEMA")).toBe(false)
    expect(isProductSearchEligible({ ...device, status: "paused" })).toBe(false)
    expect(isProductSearchEligible({ ...device, status: "launching_soon" })).toBe(false)
  })

  it("omits missing or unverified brand and manufacturer, and allows a verified authorization", () => {
    expect(canExposeField(device, "brand", "PRODUCT_SCHEMA")).toBe(false)
    expect(canExposeField(device, "manufacturer", "PRODUCT_PAGE")).toBe(false)
    const unverified = {
      ...device,
      evidencePack: { brand: { name: "CA-MI", evidenceIds: [], reviewStatus: "unreviewed" as const } },
    }
    expect(buildProductJsonLd(unverified, "en", "Nile Pharma Food")).not.toHaveProperty("brand")
    const branded = {
      ...device,
      evidencePack: {
        references: [
          {
            id: "m1",
            kind: "manufacturer_documentation" as const,
            locator: "manufacturer-authorization.pdf",
            reviewStatus: "approved" as const,
            covers: ["brand_manufacturer" as const],
          },
        ],
        brand: { name: "CA-MI", evidenceIds: ["m1"], reviewStatus: "approved" as const },
        manufacturer: { name: "CA-MI", evidenceIds: ["m1"], reviewStatus: "approved" as const },
      },
    }
    expect(buildProductJsonLd(branded, "en", dictionaries.en.siteName).brand).toEqual({ "@type": "Brand", name: "CA-MI" })
    expect(buildProductJsonLd(branded, "en", dictionaries.en.siteName).manufacturer).toEqual({
      "@type": "Organization",
      name: "CA-MI",
    })
    expect(isProductSearchEligible({ ...branded, evidencePack: undefined })).toBe(true)
  })

  it("blocks unverified pack text from factual search output", () => {
    const inositol = bySlug("proxeed-women-inositol")
    expect(canExposeField(inositol, "form", "PRODUCT_PAGE")).toBe(false)
    expect(canExposeField(inositol, "form", "PRODUCT_SCHEMA")).toBe(false)
    expect(searchDescription(inositol, "en")).not.toContain("pending approval")
    expect(searchDescription(inositol, "ar")).not.toContain("قيد الاعتماد")
    expect(canExposeField(device, "form", "PRODUCT_SCHEMA")).toBe(true)
  })
})

describe("product-type search policy", () => {
  it("blocks an active supplement until identity, composition, and claim clearance all pass", () => {
    const cleared = clearedSupplement()
    expect(isProductSearchEligible(cleared)).toBe(true)
    expect(isProductSearchEligible({ ...cleared, evidencePack: undefined })).toBe(false)
    expect(productIndexDecision({ ...cleared, evidencePack: undefined }).reasons).toContain("supplement_claim_clearance_absent")
    const compositionOnly = {
      ...cleared,
      evidencePack: {
        ...cleared.evidencePack!,
        references: cleared.evidencePack!.references!.map((reference) => ({
          ...reference,
          covers: ["composition_spec" as const],
        })),
      },
    }
    expect(isProductSearchEligible(compositionOnly)).toBe(false)
    expect(productIndexDecision(compositionOnly).reasons).toContain("unverified_required_facts")
    expect(isProductSearchEligible({ ...cleared, availableForm: "Powder sachets (final packaging details pending approval)" })).toBe(false)
  })

  it("keeps a factual device eligible without a brand and omits an uncleared medical claim", () => {
    expect(isProductSearchEligible(device)).toBe(true)
    expect(skuAssessment(device).fields.brand.state).toBe("MISSING")
    const claimed = {
      ...device,
      shortDescription: "Treats hypoxia",
      evidencePack: {
        claims: [
          {
            id: "c1",
            statement: "Treats hypoxia",
            evidenceIds: [],
            reviewStatus: "unverified" as const,
            allowedContexts: ["PRODUCT_PAGE" as const, "PRODUCT_SCHEMA" as const],
          },
        ],
      },
    }
    expect(isProductSearchEligible(claimed)).toBe(true)
    expect(canExposeClaim(claimed, "c1", "PRODUCT_SCHEMA")).toBe(false)
    expect(JSON.stringify(buildProductJsonLd(claimed, "en", "Nile Pharma Food"))).not.toContain("Treats hypoxia")
    expect(canUseSkuInContent(device, "factual_product")).toBe(true)
    expect(canUseSkuInContent(device, "medical_claim")).toBe(false)
    expect(canUseSkuInContent(bySlug("proxeed-plus"), "editorial")).toBe(false)
  })
})

describe("search output uses the same eligibility decision", () => {
  it("puts only eligible products in the sitemap and only verified fields in schema", () => {
    const urls = buildSitemapEntries(products).map((entry) => entry.url)
    expect(urls.some((url) => url.endsWith("/products/ca-mi-pulse-oximeter"))).toBe(true)
    expect(urls.some((url) => url.endsWith("/products/proxeed-plus"))).toBe(false)
    expect(urls.some((url) => url.includes("?"))).toBe(false)
    const conflict = { ...device, evidencePack: { identity: { sku: "OTHER-SKU" } } }
    expect(buildSitemapEntries([conflict]).some((entry) => entry.url.includes(conflict.slug))).toBe(false)
    expect(buildSitemapEntries([{ ...device, status: "paused" }]).some((entry) => entry.url.includes(device.slug))).toBe(false)

    const supplement = buildProductJsonLd(bySlug("proxeed-plus"), "en", dictionaries.en.siteName)
    expect(JSON.stringify(supplement)).not.toContain("fertility")
    expect(supplement).not.toHaveProperty("additionalProperty")
    expect(supplement).not.toHaveProperty("brand")
    const englishDevice = localizeProduct(device, "en")
    const schema = buildProductJsonLd(englishDevice, "en", dictionaries.en.siteName, "Medical Devices", device)
    expect(JSON.stringify(schema)).not.toContain("Italy")
    expect(schema.additionalProperty).toEqual(
      expect.arrayContaining([{ "@type": "PropertyValue", name: "Battery", value: "2 x AAA batteries, ~30 hours of operation" }])
    )
    expect(buildProductJsonLd({ ...device, sku: undefined, price: undefined }, "en", "Nile Pharma Food")).not.toHaveProperty("sku")
    expect(buildProductJsonLd({ ...device, price: undefined }, "en", "Nile Pharma Food").offers).toBeUndefined()
  })

  it("does not map evidence approval from the Payload document", () => {
    expect(readFileSync("src/lib/products/payload-repository.ts", "utf8")).not.toMatch(/evidencePack\s*:/)
    expect(readFileSync("src/app/[locale]/products/[slug]/page.tsx", "utf8")).not.toContain("evidencePack")
  })
})
