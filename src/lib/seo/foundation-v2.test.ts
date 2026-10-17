import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { dictionaries } from "@/lib/i18n/dictionaries"
import { MockProductRepository } from "@/lib/products/mock-repository"

import { buildOrganizationJsonLd, buildSearchAction, buildWebSiteJsonLd } from "./entity-schema"
import { buildFaqJsonLd } from "./faq-schema"
import { buildImageSitemapEntries, toSeoImage } from "./image-metadata"
import { isSearchIndexEligible } from "./indexability"
import { canEnterSitemap, resolveSeoPage } from "./page-contract"
import { productSeoContract } from "./product-metadata"
import { buildBreadcrumbListJsonLd, buildProductJsonLd } from "./product-schema"
import { buildRobots } from "./robots-policy"
import { CANONICAL_ORIGIN } from "./site"
import { buildSitemapEntries } from "./sitemap-entries"

const products = await new MockProductRepository().getAllProducts()

describe("entity schema", () => {
  it("emits Organization and WebSite from stored fields only", () => {
    const organization = buildOrganizationJsonLd({
      name: dictionaries.en.siteName,
      email: "info@nilepharmafood.com",
      logoPath: "/npf-logo.svg",
    })
    const website = buildWebSiteJsonLd({ name: dictionaries.en.siteName })
    expect(organization).toMatchObject({
      "@type": "Organization",
      name: dictionaries.en.siteName,
      url: CANONICAL_ORIGIN,
      logo: `${CANONICAL_ORIGIN}/npf-logo.svg`,
      email: "info@nilepharmafood.com",
    })
    expect(website).toMatchObject({
      "@type": "WebSite",
      name: dictionaries.en.siteName,
      url: CANONICAL_ORIGIN,
      publisher: { "@id": `${CANONICAL_ORIGIN}/#organization` },
    })
    expect(website).not.toHaveProperty("potentialAction")
    expect(JSON.stringify(organization)).not.toContain("nilepharma.com.eg")
    expect(JSON.stringify(website)).not.toContain("www.")
  })

  it("omits unverified legal fields and accepts them only when complete", () => {
    const empty = buildOrganizationJsonLd({
      name: "Nile Pharma Food",
      email: "info@nilepharmafood.com",
      logoPath: "/npf-logo.svg",
      verified: { legalName: "  ", telephone: "", sameAs: ["", "not a url"], address: { streetAddress: "1", addressLocality: "", addressCountry: "EG" } },
    })
    expect(empty).not.toHaveProperty("legalName")
    expect(empty).not.toHaveProperty("telephone")
    expect(empty).not.toHaveProperty("address")
    expect(empty).not.toHaveProperty("sameAs")
    expect(empty).not.toHaveProperty("founder")
    expect(empty).not.toHaveProperty("award")

    const filled = buildOrganizationJsonLd({
      name: "Nile Pharma Food",
      email: "info@nilepharmafood.com",
      logoPath: "/npf-logo.svg",
      verified: {
        legalName: "Example Registered Name",
        telephone: "+20 100 000 0000",
        address: {
          streetAddress: "1 Example Street",
          addressLocality: "El Obour",
          addressRegion: "Qalyubia",
          addressCountry: "EG",
        },
        sameAs: ["https://example.com/profile", "https://nilepharma.com.eg/"],
      },
    })
    expect(filled.legalName).toBe("Example Registered Name")
    expect(filled.telephone).toBe("+20 100 000 0000")
    expect(filled.address).toMatchObject({ streetAddress: "1 Example Street", addressCountry: "EG" })
    expect(filled.sameAs).toEqual(["https://example.com/profile"])
  })

  it("does not advertise catalog filter search as a site SearchAction", () => {
    expect(buildSearchAction(null)).toBeUndefined()
    expect(buildSearchAction({ targetPath: "/products", queryParam: "q", pageExists: true })).toBeUndefined()
    expect(buildSearchAction({ targetPath: "/products?q=", queryParam: "q", pageExists: true })).toBeUndefined()
    expect(buildSearchAction({ targetPath: "/search", queryParam: "q", pageExists: false })).toBeUndefined()
    const action = buildSearchAction({ targetPath: "/search", queryParam: "q", pageExists: true })
    expect(action).toMatchObject({
      "@type": "SearchAction",
      target: { urlTemplate: `${CANONICAL_ORIGIN}/search?q={search_term_string}` },
    })
    expect(buildWebSiteJsonLd({ name: "Nile Pharma Food" })).not.toHaveProperty("potentialAction")
    expect(readFileSync("src/app/[locale]/layout.tsx", "utf8")).not.toContain("pageExists")
  })
})

describe("page contract", () => {
  it("rejects a filter URL as a canonical path", () => {
    expect(() =>
      resolveSeoPage({
        locale: "ar",
        path: "/products?category=supplements",
        title: "Products",
        description: "Catalog",
        indexable: true,
        hasLocaleAlternate: true,
      })
    ).toThrow(/query/)
  })

  it("keeps noindex pages out of the sitemap and utility pages off hreflang", () => {
    const blocked = resolveSeoPage({
      locale: "en",
      path: "/blogs",
      title: "Blog",
      description: "Empty",
      indexable: false,
      follow: false,
      hasLocaleAlternate: true,
    })
    expect(blocked.robots).toEqual({ index: false, follow: false })
    expect(blocked.sitemapEligible).toBe(false)
    expect(blocked.canonicalUrl).toBe(`${CANONICAL_ORIGIN}/en/blogs`)

    const utility = resolveSeoPage({
      locale: "ar",
      path: "/cart",
      title: "Cart",
      description: "Cart",
      pageType: "utility",
      indexable: false,
      follow: false,
      hasLocaleAlternate: false,
    })
    expect(utility.metadata.alternates).not.toHaveProperty("languages")
    expect(utility.schemaTypes).toEqual(["WebPage"])
  })

  it("uses the product eligibility gate for robots, sitemap, and canonical", () => {
    for (const product of products) {
      for (const locale of ["ar", "en"] as const) {
        const contract = productSeoContract(product, locale)
        expect(contract.sitemapEligible).toBe(isSearchIndexEligible(product))
        expect(contract.canonicalUrl).toBe(`${CANONICAL_ORIGIN}/${locale}/products/${product.slug}`)
        expect(contract.canonicalUrl).not.toContain("?")
        expect(canEnterSitemap(contract.sitemapEligible, `/products/${product.slug}`)).toBe(contract.sitemapEligible)
      }
    }
    expect(buildSitemapEntries(products)).toEqual(buildSitemapEntries(products, []))
  })
})

describe("schema safety", () => {
  it("does not add medical, rating, or brand fields to product schema", () => {
    for (const product of products) {
      const schema = buildProductJsonLd(product, "en", dictionaries.en.siteName)
      const keys = new Set<string>()
      const walk = (value: unknown) => {
        if (!value || typeof value !== "object") return
        for (const [key, child] of Object.entries(value)) {
          keys.add(key)
          walk(child)
        }
      }
      walk(schema)
      for (const banned of ["dosage", "indication", "aggregateRating", "review", "brand", "manufacturer", "gtin"]) {
        expect(keys.has(banned)).toBe(false)
      }
    }
  })

  it("omits query-string breadcrumb items", () => {
    const json = JSON.stringify(
      buildBreadcrumbListJsonLd([
        { name: "Home", path: "/ar" },
        { name: "Products", path: "/ar/products" },
        { name: "Filter", path: "/ar/products?category=supplements" },
        { name: "Pack" },
      ])
    )
    expect(json).not.toContain("?")
    expect(json).toContain(`${CANONICAL_ORIGIN}/ar/products`)
  })

  it("does not emit FAQ schema for unpublished or unevidenced medical items", () => {
    expect(
      buildFaqJsonLd([
        {
          question: "Draft question",
          answer: "Draft answer",
          layer: "editorial",
          visibility: "public",
          reviewState: "draft",
        },
        {
          question: "Unevidenced claim",
          answer: "Not cleared",
          layer: "medical_claim",
          visibility: "public",
          reviewState: "published",
          evidenceApproved: false,
        },
      ])
    ).toBeNull()

    const faq = buildFaqJsonLd([
      {
        question: "What pack is listed?",
        answer: "The stored pack name.",
        layer: "factual_product",
        visibility: "public",
        reviewState: "published",
      },
    ])
    expect(faq?.["@type"]).toBe("FAQPage")
    expect(JSON.stringify(faq)).not.toContain("Unevidenced")
  })
})

describe("image sitemap generator", () => {
  it("keeps empty, query, and noindex images out, and is not mounted", () => {
    const image = toSeoImage({
      url: "/products/example.webp",
      alt: "Example pack",
      pagePath: "/products/example",
      width: 800,
      height: 800,
    })
    expect(image).toMatchObject({ alt: "Example pack", width: 800, height: 800 })
    expect(toSeoImage({ url: "/products/example.webp", alt: "  ", pagePath: "/products/example" })).toBeNull()
    expect(toSeoImage({ url: "/products/example.webp?x=1", alt: "Example pack", pagePath: "/products/example" })).toBeNull()

    const entries = buildImageSitemapEntries(
      [
        image!,
        { url: "/products/hidden.webp", alt: "Hidden", pagePath: "/products/hidden" },
        { url: "/products/filter.webp", alt: "Filter", pagePath: "/products?category=supplements" },
      ],
      new Set(["/products/example"])
    )
    expect(entries).toEqual([
      {
        loc: `${CANONICAL_ORIGIN}/products/example.webp`,
        page: `${CANONICAL_ORIGIN}/products/example`,
      },
    ])
    expect(buildRobots().sitemap).toBe(`${CANONICAL_ORIGIN}/sitemap.xml`)
    expect(JSON.stringify(buildRobots())).not.toContain("image")
    expect(readFileSync("src/app/sitemap.ts", "utf8")).not.toContain("buildImageSitemapEntries")
  })
})
