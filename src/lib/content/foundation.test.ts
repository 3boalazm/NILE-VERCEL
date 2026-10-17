import { existsSync, readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { MockProductRepository } from "@/lib/products/mock-repository"
import type { Product } from "@/lib/products/types"
import { CANONICAL_ORIGIN } from "@/lib/seo/site"
import { SITEMAP_STATIC_PATHS, buildSitemapEntries } from "@/lib/seo/sitemap-entries"

import { contentIndexDecision, contentSitemapRows, exposeAnswerBlock } from "./gates"
import { contentProductLinks, isCanonicalContentHref, relatedContentLinks, selectRelatedProducts } from "./links"
import { HUB_REGISTRY, PUBLISHED_CONTENT, isReservedUnpublishedHub, publishedHubPaths } from "./registry"
import { nextReviewState, type ContentRecord } from "./types"

const products = await new MockProductRepository().getAllProducts()

function bySlug(slug: string): Product {
  const product = products.find((item) => item.slug === slug)
  if (!product) throw new Error(`missing ${slug}`)
  return product
}

function record(overrides: Partial<ContentRecord> = {}): ContentRecord {
  return {
    id: "guide-1",
    translationGroupId: "guide-pack",
    kind: "guide",
    layer: "editorial",
    slug: "pack-facts",
    locale: "en",
    title: "Pack facts",
    summary: "A stored summary.",
    reviewState: "published",
    ...overrides,
  }
}

describe("content workflow", () => {
  it("does not let a draft jump to published or become indexable", () => {
    expect(nextReviewState("draft")).toBe("internal_review")
    expect(nextReviewState("approved")).toBe("published")
    expect(nextReviewState("published")).toBeNull()
    for (const reviewState of ["draft", "internal_review", "evidence_review", "approved"] as const) {
      const decision = contentIndexDecision(record({ reviewState }))
      expect(decision.eligible).toBe(false)
      expect(decision.reasons).toContain("not_published")
    }
  })

  it("blocks medical claims, comparisons, filters, and catalog duplicates", () => {
    expect(contentIndexDecision(record()).eligible).toBe(true)
    expect(
      contentIndexDecision(record({ layer: "medical_claim", evidence: [{ title: "Leaflet", sourceType: "product_leaflet", reviewStatus: "unreviewed" }] })).eligible
    ).toBe(false)
    expect(
      contentIndexDecision(
        record({
          layer: "medical_claim",
          evidence: [{ title: "Leaflet", sourceType: "product_leaflet", reviewStatus: "approved" }],
        })
      ).eligible
    ).toBe(true)
    expect(contentIndexDecision(record({ kind: "comparison" })).reasons).toContain("comparison_not_cleared")
    expect(contentIndexDecision(record({ kind: "comparison", comparisonCleared: true })).eligible).toBe(true)
    expect(contentIndexDecision(record({ kind: "category", slug: "supplements" })).reasons).toContain("category_is_a_filter")
    expect(contentIndexDecision(record({ kind: "product", slug: "proxeed-plus" })).reasons).toContain(
      "product_indexability_is_owned_by_catalog_gate"
    )
    expect(contentIndexDecision(record({ kind: "entity_page", slug: "about" })).reasons).toContain(
      "entity_page_already_has_a_static_route"
    )
  })

  it("excludes unpublished content from the sitemap and pairs hreflang only when both locales are eligible", () => {
    expect(PUBLISHED_CONTENT).toEqual([])
    expect(buildSitemapEntries(products, [record({ reviewState: "draft" })])).toEqual(buildSitemapEntries(products))

    const published = record()
    const rows = contentSitemapRows([published])
    expect(rows).toEqual([{ locale: "en", path: "/guides/pack-facts" }])
    expect(rows[0]?.alternates).toBeUndefined()

    const paired = contentSitemapRows([
      published,
      record({ id: "guide-1-ar", locale: "ar", title: "حقائق العبوة", summary: "ملخص مخزن." }),
    ])
    expect(paired.every((row) => row.alternates?.en === "/en/guides/pack-facts")).toBe(true)
    expect(paired.every((row) => row.alternates?.ar === "/ar/guides/pack-facts")).toBe(true)

    const urls = buildSitemapEntries(products, [published]).map((entry) => entry.url)
    expect(urls).toContain(`${CANONICAL_ORIGIN}/en/guides/pack-facts`)
    expect(urls.some((url) => url.includes("?"))).toBe(false)
    expect(urls).not.toContain(`${CANONICAL_ORIGIN}/ar/guides/pack-facts`)
  })

  it("does not expose an answer block unless the record itself is indexable", () => {
    expect(exposeAnswerBlock(record({ reviewState: "draft", answer: { conciseAnswer: "No", explanation: "No" } }))).toBeNull()
    expect(
      exposeAnswerBlock(record({ answer: { conciseAnswer: "Stored answer", explanation: "Stored explanation" } }))
    ).toMatchObject({ conciseAnswer: "Stored answer" })
    expect(
      exposeAnswerBlock(
        record({
          layer: "medical_claim",
          answer: { conciseAnswer: "Claim", explanation: "Claim" },
        })
      )
    ).toBeNull()
  })
})

describe("hubs and urls", () => {
  it("publishes only the products hub and creates no health-hub routes", () => {
    expect(publishedHubPaths()).toEqual(["/products"])
    for (const hub of HUB_REGISTRY) {
      if (!hub.publishable) {
        expect(isReservedUnpublishedHub(hub.path)).toBe(true)
        expect(SITEMAP_STATIC_PATHS).not.toContain(hub.path)
        expect(existsSync(`src/app/[locale]${hub.path}`)).toBe(false)
      }
    }
    expect(existsSync("src/app/[locale]/guides")).toBe(false)
    expect(existsSync("src/app/[locale]/faqs")).toBe(false)
    expect(existsSync("src/app/[locale]/comparisons")).toBe(false)
    const nav = [
      readFileSync("src/components/npf/header.tsx", "utf8"),
      readFileSync("src/components/npf/footer.tsx", "utf8"),
    ].join("\n")
    expect(nav).not.toContain("/hubs/")
    expect(nav).not.toContain("/guides/")
  })
})

describe("internal links", () => {
  it("links only active same-audience products and never a filter URL", () => {
    const plus = bySlug("proxeed-plus")
    const related = selectRelatedProducts(plus, products)
    expect(related.every((item) => item.status === "active")).toBe(true)
    expect(related.map((item) => item.slug)).not.toContain("proxerex")
    expect(related.map((item) => item.slug)).not.toContain("ellamuselle")
    expect(related.map((item) => item.slug)).not.toContain("proxeed-women")
    expect(selectRelatedProducts(bySlug("ellamuselle"), products)).toEqual([])

    const devices = selectRelatedProducts(bySlug("ca-mi-pulse-oximeter"), products)
    expect(devices.map((item) => item.slug)).toContain("ca-mi-ir-thermometer")
    expect(devices.every((item) => item.categorySlug === "medical-devices")).toBe(true)

    const links = relatedContentLinks(
      record({ relatedContentIds: ["missing", "draft-guide"] }),
      [record({ id: "draft-guide", reviewState: "draft", slug: "draft-guide" })],
      "en"
    )
    expect(links).toEqual([])
    const visible = relatedContentLinks(record({ relatedContentIds: ["other"] }), [record({ id: "other", slug: "other-guide" })], "en")
    expect(visible).toEqual([{ href: "/en/guides/other-guide", label: "Pack facts", kind: "content" }])
    expect(visible.every((link) => isCanonicalContentHref(link.href))).toBe(true)

    const productLinks = contentProductLinks(
      record({ relatedProductSlugs: ["proxeed-plus", "ellamuselle", "ca-mi-pulse-oximeter"] }),
      products,
      "ar"
    )
    expect(productLinks.map((link) => link.href)).toEqual(["/ar/products/ca-mi-pulse-oximeter"])
    expect(productLinks.every((link) => isCanonicalContentHref(link.href))).toBe(true)
  })
})
