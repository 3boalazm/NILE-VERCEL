import { existsSync, readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { dictionaries } from "@/lib/i18n/dictionaries"
import { localizeProduct } from "@/lib/products/localize"
import { MockProductRepository } from "@/lib/products/mock-repository"
import type { Product } from "@/lib/products/types"

import { buildFaqJsonLd } from "./faq-schema"
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "./entity-schema"
import {
  GEO_CONTRACT,
  ROUTE_INTENT,
  SEPARATED_ORGANIZATION,
  catalogProductFaqJsonLd,
  eligibleImageSitemapEntries,
  factualAnswers,
  growthSearchDescription,
  homepageSearchLinks,
  organizationCollides,
  productGrowthContract,
  productImageAlt,
  productPageSearchLinks,
  productsHubSearchLinks,
  topicArchitecture,
  topicPublicLinks,
  withStoredTradeAlternate,
} from "./growth"
import { productPageMetadata } from "./product-metadata"
import { buildProductJsonLd } from "./product-schema"
import { CANONICAL_ORIGIN } from "./site"
import { SITEMAP_STATIC_PATHS, buildSitemapEntries } from "./sitemap-entries"
import { isProductSearchEligible } from "./sku-evidence"

const products = await new MockProductRepository().getAllProducts()

function bySku(sku: string): Product {
  const product = products.find((item) => item.sku === sku)
  if (!product) throw new Error(`missing ${sku}`)
  return product
}

const ELIGIBLE = ["CAMI-PO-001", "CAMI-IRT-001"]
const BLOCKED = ["PXD-PLS-001", "PXD-MEN-001", "PXD-WMN-001", "PXD-WIN-001", "PXR-001", "ELM-001"]

describe("product growth contracts", () => {
  it("keeps the two devices indexable and the six supplements blocked", () => {
    expect(products.filter(isProductSearchEligible).map((item) => item.sku).sort()).toEqual([...ELIGIBLE].sort())
    for (const sku of BLOCKED) {
      const contract = productGrowthContract(bySku(sku))
      expect(contract.indexable).toBe(false)
      expect(contract.blockReasons.length).toBeGreaterThan(0)
      expect(contract.faqSchema).toBeNull()
      expect(contract.omittedFields).toEqual(expect.arrayContaining(["brand", "manufacturer"]))
      expect(contract.descriptions.en).not.toContain("clinical study")
      expect(contract.descriptions.en).not.toContain("fertility")
      expect(contract.descriptions.ar).not.toContain("خصوبة")
    }
  })

  it("uses stored headings and verified specs, and omits unsupported device claims", () => {
    const oximeter = bySku("CAMI-PO-001")
    const thermometer = bySku("CAMI-IRT-001")
    for (const product of [oximeter, thermometer]) {
      const contract = productGrowthContract(product)
      expect(contract.indexable).toBe(true)
      expect(contract.titles.en).toBe(product.name)
      expect(contract.titles.ar).toBe(product.nameArabic)
      expect(contract.canonicalPaths).toEqual({
        ar: `/ar/products/${product.slug}`,
        en: `/en/products/${product.slug}`,
      })
      expect(contract.descriptions.en).not.toContain("Italy")
      expect(contract.descriptions.en).not.toContain("O2-Easy")
      expect(contract.descriptions.en).not.toContain("T-One")
      expect(contract.descriptions.ar).not.toContain("الإيطالية")
      expect(contract.imageAlts.en).toBe(
        `${product.name} — ${localizeProduct(product, "en").availableForm}`
      )
      expect(contract.omittedFields).toEqual(expect.arrayContaining(["brand", "manufacturer", "shortDescription"]))
    }
    expect(growthSearchDescription(localizeProduct(oximeter, "en"), "en", oximeter)).toContain("70–99%")
    expect(growthSearchDescription(localizeProduct(thermometer, "en"), "en", thermometer)).toContain("~5 cm")
    expect(productPageMetadata(localizeProduct(oximeter, "en"), "en", oximeter).title).toBe(oximeter.name)
    expect(productPageMetadata(oximeter, "ar", oximeter).robots).toEqual({ index: true, follow: true })
    expect(productPageMetadata(bySku("PXD-PLS-001"), "en").robots).toEqual({ index: false, follow: true })
  })

  it("does not put an unverified claim or a brand into schema or image alt", () => {
    const device = bySku("CAMI-PO-001")
    const schema = JSON.stringify(
      buildProductJsonLd(localizeProduct(device, "en"), "en", dictionaries.en.siteName, "Medical Devices", device)
    )
    expect(schema).not.toContain("Italy")
    expect(schema).not.toContain("Alfasigma")
    expect(schema).not.toContain("\"brand\"")
    expect(productImageAlt(bySku("PXD-PLS-001"), "en")).toBe("Proxeed Plus")
    expect(productImageAlt(bySku("PXD-PLS-001"), "en")).not.toContain("clinical")
    const answers = factualAnswers(localizeProduct(device, "en"), "en", device)
    expect(answers.every((item) => item.schemaEligible === false)).toBe(true)
    expect(answers.map((item) => item.fact)).toContain("70–99%")
    expect(answers.map((item) => item.fact).join(" ")).not.toContain("Italy")
  })
})

describe("answer and entity gates", () => {
  it("keeps FAQ schema closed for catalog text and open only for a published non-medical item", () => {
    for (const product of products) expect(catalogProductFaqJsonLd(product)).toBeNull()
    expect(
      buildFaqJsonLd([
        {
          question: "Stored pack?",
          answer: "Stored form.",
          layer: "factual_product",
          visibility: "public",
          reviewState: "published",
        },
      ])
    ).toMatchObject({ "@type": "FAQPage" })
    expect(
      buildFaqJsonLd([
        {
          question: "Does it treat a condition?",
          answer: "Unapproved.",
          layer: "medical_claim",
          visibility: "public",
          reviewState: "published",
          evidenceApproved: false,
        },
      ])
    ).toBeNull()
  })

  it("keeps Organization on the stored trade name and off the separated company", () => {
    const organization = withStoredTradeAlternate(
      buildOrganizationJsonLd({
        name: dictionaries.en.siteName,
        email: "info@nilepharmafood.com",
        logoPath: "/npf-logo.svg",
      }),
      "en"
    )
    expect(organization.name).toBe("Nile Pharma Food")
    expect(organization.alternateName).toBe("نايل فارما فود")
    expect(organization.url).toBe(CANONICAL_ORIGIN)
    expect(organization).not.toHaveProperty("legalName")
    expect(organization).not.toHaveProperty("address")
    expect(organization).not.toHaveProperty("telephone")
    expect(organization).not.toHaveProperty("sameAs")
    expect(organizationCollides(organization)).toBe(false)
    expect(JSON.stringify(organization)).not.toContain(SEPARATED_ORGANIZATION.hosts[0])
    expect(JSON.stringify(organization)).not.toContain(SEPARATED_ORGANIZATION.names[0])
    expect(buildWebSiteJsonLd({ name: dictionaries.en.siteName })).not.toHaveProperty("potentialAction")
    expect(GEO_CONTRACT.searchAction).toBe(false)
    expect(GEO_CONTRACT.locationPages).toEqual([])
    expect(GEO_CONTRACT.origin).toBe("https://nilepharmafood.com")
  })
})

describe("content architecture and links", () => {
  it("defines both locales for reserved topics and publishes none", () => {
    const topics = topicArchitecture(products.map((item) => item.sku).filter((sku): sku is string => Boolean(sku)))
    expect(topics.map((topic) => topic.id)).toEqual([
      "nutrition",
      "mens-health",
      "womens-health",
      "fertility",
      "sexual-health",
      "educational-resources",
    ])
    for (const topic of topics) {
      expect(topic.publishable).toBe(false)
      expect(topic.publicPath).toBeNull()
      expect(topic.intent).toBe("informational")
      expect(topic.titles.ar.trim().length).toBeGreaterThan(0)
      expect(topic.titles.en.trim().length).toBeGreaterThan(0)
      expect(topic.summaries.en).toContain("must not say that a product treats")
      expect(topic.summaries.ar).toContain("لا يجوز أن تقول إن منتجًا يعالج")
      expect(topic.linkableSkus).toEqual([])
      expect(topic.withheldSkus).toEqual(expect.arrayContaining(BLOCKED))
      expect(topicPublicLinks(topic)).toEqual([])
      expect(SITEMAP_STATIC_PATHS).not.toContain(topic.hubPath)
      expect(existsSync(`src/app/[locale]${topic.hubPath}`)).toBe(false)
    }
    expect(ROUTE_INTENT.find((route) => route.path === "/products/[slug]")?.intent).toBe("product")
    expect(ROUTE_INTENT.every((route) => !("volume" in route))).toBe(true)
  })

  it("links only real routes and only eligible products", () => {
    expect(homepageSearchLinks("ar", "المنتجات")).toEqual([
      { href: "/ar/products", label: "المنتجات", kind: "catalog" },
    ])
    const hub = productsHubSearchLinks(products, "en")
    expect(hub.map((link) => link.href).sort()).toEqual([
      "/en/products/ca-mi-ir-thermometer",
      "/en/products/ca-mi-pulse-oximeter",
    ])
    expect(hub.every((link) => !link.href.includes("?"))).toBe(true)
    const pageLinks = productPageSearchLinks(bySku("CAMI-PO-001"), products, "ar", "المنتجات")
    expect(pageLinks.map((link) => link.href)).toEqual([
      "/ar/products",
      "/ar/products/ca-mi-ir-thermometer",
    ])
    expect(productPageSearchLinks(bySku("PXD-PLS-001"), products, "en", "Products").map((link) => link.href)).toEqual([
      "/en/products",
    ])
    const urls = buildSitemapEntries(products).map((entry) => entry.url)
    expect(urls.some((url) => url.endsWith("/products/ca-mi-pulse-oximeter"))).toBe(true)
    expect(urls.some((url) => url.endsWith("/products/proxeed-plus"))).toBe(false)
    const images = eligibleImageSitemapEntries(
      products,
      "en",
      new Set(["/en/products/ca-mi-pulse-oximeter", "/en/products/ca-mi-ir-thermometer"])
    )
    expect(images.length).toBeGreaterThan(0)
    expect(images.every((entry) => entry.page.includes("/ca-mi-"))).toBe(true)
    expect(images.some((entry) => entry.page.includes("proxeed"))).toBe(false)
    expect(readFileSync("src/app/sitemap.ts", "utf8")).not.toContain("image-sitemap")
  })
})
