import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { dictionaries } from "@/lib/i18n/dictionaries"
import { localizeProduct } from "@/lib/products/localize"
import { MockProductRepository } from "@/lib/products/mock-repository"
import type { Product } from "@/lib/products/types"

import { isSearchIndexEligible, productIndexDecision } from "./indexability"
import {
  LEGACY_PRODUCT_REDIRECTS,
  UNCONFIRMED_PRODUCT_SLUGS,
  resolveLegacyPath,
} from "./legacy-redirects"
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "./entity-schema"
import { buildPageMetadata } from "./page-metadata"
import { productPageMetadata } from "./product-metadata"
import { productAlternateName, productHeading } from "./product-identity"
import { buildBreadcrumbJsonLd, buildProductJsonLd, offerAvailability } from "./product-schema"
import { ROBOTS_DISALLOW, buildRobots, robotsDisallowMatches } from "./robots-policy"
import { CANONICAL_ORIGIN, absoluteUrl } from "./site"
import { SITEMAP_STATIC_PATHS, buildSitemapEntries } from "./sitemap-entries"

const repository = new MockProductRepository()
const products = await repository.getAllProducts()

const STORED_ARABIC_NAMES: Record<string, string> = {
  "proxeed-plus": "بروكسيد بلس",
  "proxeed-men": "بروكسيد رجال",
  "proxeed-women": "بروكسيد نساء",
  "proxeed-women-inositol": "بروكسيد نساء إينوزيتول",
  proxerex: "بروكس إيركس",
  ellamuselle: "إلاميوسيل",
  "ca-mi-pulse-oximeter": "جهاز قياس تشبع الأكسجين CA-MI",
  "ca-mi-ir-thermometer": "ميزان حرارة بالأشعة تحت الحمراء CA-MI",
}

const ELIGIBLE_SLUGS = ["ca-mi-ir-thermometer", "ca-mi-pulse-oximeter"]

function bySlug(slug: string): Product {
  const product = products.find((item) => item.slug === slug)
  if (!product) throw new Error(`missing catalog product ${slug}`)
  return product
}

function walk(value: unknown, visit: (key: string, node: unknown) => void) {
  if (!value || typeof value !== "object") return
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit)
    return
  }
  for (const [key, child] of Object.entries(value)) {
    visit(key, child)
    walk(child, visit)
  }
}

describe("canonical origin", () => {
  it("stays on the permanent public host", () => {
    expect(CANONICAL_ORIGIN).toBe("https://nilepharmafood.com")
    expect(CANONICAL_ORIGIN).not.toContain("www.")
    expect(CANONICAL_ORIGIN).not.toContain("nilepharma.com.eg")
  })
})

describe("search index eligibility", () => {
  it("does not treat database existence or active status as eligibility", async () => {
    expect(products).toHaveLength(8)
    const eligible = products.filter(isSearchIndexEligible).map((product) => product.slug).sort()
    expect(eligible).toEqual(ELIGIBLE_SLUGS)
    const proxeedPlus = bySlug("proxeed-plus")
    expect(proxeedPlus.status).toBe("active")
    expect(productIndexDecision(proxeedPlus).reasons).toContain("supplement_claim_clearance_absent")
    expect(productIndexDecision(bySlug("proxerex")).reasons).toContain("supplement_claim_clearance_absent")
    expect(productIndexDecision(bySlug("proxeed-women")).reasons).toContain("supplement_claim_clearance_absent")
  })

  it("keeps paused, launching, and unconfirmed products out without deleting them", () => {
    expect(bySlug("ellamuselle").status).toBe("paused")
    expect(productIndexDecision(bySlug("ellamuselle")).reasons).toEqual(
      expect.arrayContaining(["status_not_active", "supplement_claim_clearance_absent"])
    )
    expect(productIndexDecision(bySlug("proxeed-men")).reasons).toContain("status_not_active")
    expect(productIndexDecision(bySlug("proxeed-women-inositol")).reasons).toEqual(
      expect.arrayContaining([
        "status_not_active",
        "unconfirmed_catalog_facts",
        "supplement_claim_clearance_absent",
      ])
    )
  })

  it("does not index a supplement just because a leaflet file exists", () => {
    expect(bySlug("proxeed-plus").downloadUrl).toBeTruthy()
    expect(isSearchIndexEligible(bySlug("proxeed-plus"))).toBe(false)
  })

  it("blocks an otherwise complete device when specs or identity are missing", () => {
    const device = bySlug("ca-mi-pulse-oximeter")
    expect(isSearchIndexEligible({ ...device, composition: [] })).toBe(false)
    expect(isSearchIndexEligible({ ...device, nameArabic: "" })).toBe(false)
    expect(isSearchIndexEligible({ ...device, status: "launching_soon" })).toBe(false)
    expect(
      isSearchIndexEligible({
        ...device,
        composition: [{ label: "Dose", value: "not yet confirmed" }],
      })
    ).toBe(false)
    expect(isSearchIndexEligible({ ...device, categorySlug: "dental" })).toBe(false)
  })
})

describe("product identity", () => {
  it("uses stored Arabic names and does not invent translations", () => {
    for (const product of products) {
      expect(product.nameArabic).toBe(STORED_ARABIC_NAMES[product.slug])
      expect(productHeading(product, "ar")).toBe(product.nameArabic)
      expect(productHeading(product, "en")).toBe(product.name)
      expect(productAlternateName(product, "ar")).toBe(product.name)
      expect(localizeProduct(product, "en").name).toBe(product.name)
      expect(localizeProduct(product, "en").nameArabic).toBe(product.nameArabic)
      expect(localizeProduct(product, "ar")).toBe(product)
    }
  })

  it("falls back to the Latin name when Arabic is missing", () => {
    const product = { ...bySlug("ca-mi-pulse-oximeter"), nameArabic: undefined }
    expect(productHeading(product, "ar")).toBe(product.name)
    expect(productAlternateName(product, "ar")).toBeUndefined()
    expect(isSearchIndexEligible(product)).toBe(false)
  })

  it("puts the stored heading in the title and keeps a self-canonical", () => {
    const device = bySlug("ca-mi-pulse-oximeter")
    const arabic = productPageMetadata(device, "ar")
    const english = productPageMetadata(device, "en")
    expect(arabic.title).toBe(device.nameArabic)
    expect(english.title).toBe(device.name)
    expect(arabic.alternates?.canonical).toBe("/ar/products/ca-mi-pulse-oximeter")
    expect(english.alternates?.canonical).toBe("/en/products/ca-mi-pulse-oximeter")
    expect(arabic.robots).toEqual({ index: true, follow: true })
    expect(english.openGraph?.url).toBe("/en/products/ca-mi-pulse-oximeter")

    const supplement = productPageMetadata(bySlug("proxeed-plus"), "ar")
    expect(supplement.title).toBe("بروكسيد بلس")
    expect(supplement.robots).toEqual({ index: false, follow: true })
    expect(supplement.alternates?.canonical).toBe("/ar/products/proxeed-plus")
  })
})

describe("product schema", () => {
  it("does not hardcode a brand, manufacturer, rating, GTIN, or PreOrder", () => {
    expect(offerAvailability("launching_soon")).toBeNull()
    expect(offerAvailability("active")).toBe("https://schema.org/InStock")
    expect(offerAvailability("paused")).toBe("https://schema.org/OutOfStock")

    for (const product of products) {
      for (const locale of ["ar", "en"] as const) {
        const schema = buildProductJsonLd(product, locale, dictionaries[locale].siteName, "Category")
        const keys = new Set<string>()
        walk(schema, (key) => keys.add(key))
        expect(schema.brand).toBeUndefined()
        expect(schema.manufacturer).toBeUndefined()
        expect(keys.has("aggregateRating")).toBe(false)
        expect(keys.has("review")).toBe(false)
        expect(keys.has("reviewCount")).toBe(false)
        expect(keys.has("ratingValue")).toBe(false)
        expect([...keys].some((key) => key.toLowerCase().startsWith("gtin"))).toBe(false)
        expect(JSON.stringify(schema)).not.toContain("PreOrder")
        expect(schema.name).toBe(productHeading(product, locale))
        expect(schema.url).toBe(absoluteUrl(`/${locale}/products/${product.slug}`))
        if (schema.offers) {
          const offer = schema.offers as { price: number; priceCurrency: string; seller: { name: string } }
          expect(offer.price).toBe(product.price)
          expect(offer.priceCurrency).toBe("EGP")
          expect(offer.seller.name).toBe(dictionaries[locale].siteName)
          expect(offer.seller.name).not.toBe("Alfasigma")
        }
      }
    }
  })

  it("omits brand on CA-MI devices even though the old schema used Alfasigma", () => {
    const device = bySlug("ca-mi-pulse-oximeter")
    const schema = buildProductJsonLd(device, "ar", dictionaries.ar.siteName)
    expect(schema).not.toHaveProperty("brand")
    expect(JSON.stringify(schema)).not.toContain("Alfasigma")
    expect(schema.name).toBe("جهاز قياس تشبع الأكسجين CA-MI")
    expect(schema.alternateName).toBe("CA-MI Pulse Oximeter")
    expect(schema.image).toBe(`${CANONICAL_ORIGIN}${device.image}`)
  })

  it("omits the offer when price or a real availability is missing", () => {
    const launching = { ...bySlug("proxeed-men"), price: 100 }
    expect(buildProductJsonLd(launching, "en", "Nile Pharma Food").offers).toBeUndefined()
    const unpriced = { ...bySlug("ca-mi-pulse-oximeter"), price: undefined }
    const schema = buildProductJsonLd(unpriced, "en", "Nile Pharma Food")
    expect(schema.offers).toBeUndefined()
    expect(JSON.stringify(schema)).not.toContain("priceCurrency")
    const paused = buildProductJsonLd(bySlug("ellamuselle"), "en", dictionaries.en.siteName)
    expect(paused.offers).toMatchObject({
      availability: "https://schema.org/OutOfStock",
      price: 1200,
      priceCurrency: "EGP",
    })
  })

  it("does not put a filtered category URL in breadcrumb schema", () => {
    const json = JSON.stringify(
      buildBreadcrumbJsonLd({
        locale: "ar",
        heading: "بروكسيد بلس",
        homeLabel: "الرئيسية",
        productsLabel: "المنتجات",
        categoryName: "مكملات غذائية",
      })
    )
    expect(json).not.toContain("?")
    expect(json).not.toContain("category=")
    expect(json).toContain(`${CANONICAL_ORIGIN}/ar/products`)
    expect(json).not.toContain("nilepharma.com.eg")
  })
})

describe("legacy redirects", () => {
  it("301s only the confirmed pairs, including the trailing slash, in one decision", () => {
    expect(LEGACY_PRODUCT_REDIRECTS.map((rule) => rule.source)).toEqual([
      "/product/proxeed-plus",
      "/product/proxerex",
      "/product/proxeed-women",
      "/product/pulse-oximeter-ca-mi-o2-easy",
      "/product/ellamuselle",
    ])
    for (const rule of LEGACY_PRODUCT_REDIRECTS) {
      expect(rule.destination.startsWith("/ar/products/")).toBe(true)
      expect(rule.destination).not.toContain("http")
      for (const source of [rule.source, `${rule.source}/`]) {
        expect(resolveLegacyPath(source)).toEqual({
          kind: "redirect",
          pathname: rule.destination,
          status: 301,
        })
      }
    }
  })

  it("does not redirect spam, trash, unknown products, or the unconfirmed thermometer slug", () => {
    expect(resolveLegacyPath("/term-paper-writer-reviews")).toEqual({ kind: "gone", status: 410 })
    expect(resolveLegacyPath("/term-paper-writer-reviews/")).toEqual({ kind: "gone", status: 410 })
    expect(resolveLegacyPath("/home__trashed/store__trashed")).toEqual({ kind: "gone", status: 410 })
    expect(resolveLegacyPath("/wp-admin/plugins.php")).toEqual({ kind: "gone", status: 410 })
    expect(resolveLegacyPath("/cgi-sys/suspendedpage")).toEqual({ kind: "gone", status: 410 })
    expect(resolveLegacyPath("/product/does-not-exist")).toEqual({ kind: "not-found", status: 404 })
    expect(resolveLegacyPath("/product")).toEqual({ kind: "not-found", status: 404 })
    for (const slug of UNCONFIRMED_PRODUCT_SLUGS) {
      expect(resolveLegacyPath(`/product/${slug}`)).toEqual({ kind: "not-found", status: 404 })
    }
    expect(resolveLegacyPath("/product/term-paper-writer-reviews")?.kind).not.toBe("redirect")
    expect(resolveLegacyPath("/ar/products/proxeed-plus")).toBeNull()
    expect(resolveLegacyPath("/en/product/proxeed-plus")).toBeNull()
    expect(JSON.stringify(LEGACY_PRODUCT_REDIRECTS)).not.toContain("nilepharma.com.eg")
  })
})

describe("sitemap and robots", () => {
  const entries = buildSitemapEntries(products)

  it("lists only canonical indexable URLs and omits lastModified", () => {
    const urls = entries.map((entry) => entry.url)
    expect(urls.every((url) => url.startsWith(`${CANONICAL_ORIGIN}/`))).toBe(true)
    expect(urls.some((url) => url.includes("www.") || url.includes("nilepharma.com.eg") || url.includes("?"))).toBe(
      false
    )
    for (const entry of entries) {
      expect(entry).not.toHaveProperty("lastModified")
    }
    for (const slug of ["ellamuselle", "proxeed-plus", "proxeed-men", "proxeed-women", "proxerex", "proxeed-women-inositol"]) {
      expect(urls.some((url) => url.includes(slug))).toBe(false)
    }
    for (const locale of ["ar", "en"] as const) {
      for (const slug of ELIGIBLE_SLUGS) {
        const product = bySlug(slug)
        const url = absoluteUrl(`/${locale}/products/${slug}`)
        expect(urls).toContain(url)
        expect(productPageMetadata(product, locale).alternates?.canonical).toBe(`/${locale}/products/${slug}`)
        expect(url).toBe(absoluteUrl(String(productPageMetadata(product, locale).alternates?.canonical)))
        expect(isSearchIndexEligible(product)).toBe(true)
      }
    }
    for (const rule of LEGACY_PRODUCT_REDIRECTS) {
      expect(urls).not.toContain(absoluteUrl(rule.source))
      expect(urls.some((url) => url.endsWith(rule.source))).toBe(false)
    }
    for (const blocked of ["/blogs", "/careers", "/admin", "/api", "/lab", "/cart", "/checkout"]) {
      expect(urls.some((url) => url.includes(blocked))).toBe(false)
    }
  })

  it("points static sitemap URLs at pages the app can render", () => {
    const pageFile: Record<string, string> = {
      "": "src/app/[locale]/page.tsx",
      "/about": "src/app/[locale]/about/page.tsx",
      "/story": "src/app/[locale]/story/page.tsx",
      "/products": "src/app/[locale]/products/page.tsx",
      "/quality-sourcing": "src/app/[locale]/quality-sourcing/page.tsx",
      "/contact": "src/app/[locale]/contact/page.tsx",
      "/shipping-delivery": "src/app/[locale]/shipping-delivery/page.tsx",
      "/privacy-policy": "src/app/[locale]/privacy-policy/page.tsx",
      "/terms": "src/app/[locale]/terms/page.tsx",
    }
    expect(Object.keys(pageFile).sort()).toEqual([...SITEMAP_STATIC_PATHS].sort())
    for (const path of SITEMAP_STATIC_PATHS) {
      expect(readFileSync(pageFile[path], "utf8").length).toBeGreaterThan(0)
      expect(entries.some((entry) => entry.url === absoluteUrl(`/ar${path}`))).toBe(true)
    }
    expect(readFileSync("src/app/[locale]/products/[slug]/page.tsx", "utf8")).toContain("productPageMetadata")
  })

  it("disallows admin and api without blocking public routes or assets", () => {
    const robots = buildRobots()
    expect(robots.sitemap).toBe(`${CANONICAL_ORIGIN}/sitemap.xml`)
    expect(ROBOTS_DISALLOW).toEqual(["/*/lab/", "/admin", "/api"])
    for (const path of ["/", "/ar", "/en", "/products", "/ar/products", "/en/products/ca-mi-pulse-oximeter", "/_next/static/chunks/app.js", "/products/proxeed-plus.jpg"]) {
      expect(robotsDisallowMatches(path)).toBe(false)
    }
    expect(robotsDisallowMatches("/admin")).toBe(true)
    expect(robotsDisallowMatches("/admin/collections")).toBe(true)
    expect(robotsDisallowMatches("/api")).toBe(true)
    expect(robotsDisallowMatches("/api/graphql")).toBe(true)
    expect(robotsDisallowMatches("/ar/lab/hero-abstract")).toBe(true)
    expect(robotsDisallowMatches("/en/lab/hero-abstract")).toBe(true)
  })

  it("uses the same eligibility decision for robots, sitemap, and canonical", () => {
    const urls = entries.map((entry) => entry.url)
    for (const product of products) {
      const eligible = isSearchIndexEligible(product)
      for (const locale of ["ar", "en"] as const) {
        const meta = productPageMetadata(product, locale)
        const path = `/${locale}/products/${product.slug}`
        expect(meta.robots).toEqual(
          eligible ? { index: true, follow: true } : { index: false, follow: true }
        )
        expect(meta.alternates?.canonical).toBe(path)
        expect(urls.includes(absoluteUrl(path))).toBe(eligible)
        expect(buildProductJsonLd(product, locale, dictionaries[locale].siteName).name).toBe(
          productHeading(product, locale)
        )
      }
    }
  })
})

describe("source regressions", () => {
  it("does not silently hardcode Alfasigma or PreOrder back into product schema", () => {
    const page = readFileSync("src/app/[locale]/products/[slug]/page.tsx", "utf8")
    const schema = readFileSync("src/lib/seo/product-schema.ts", "utf8")
    expect(page).not.toContain("Alfasigma")
    expect(page).not.toContain("PreOrder")
    expect(schema).not.toContain("Alfasigma")
    expect(schema).not.toContain("PreOrder")
    expect(page).toContain("buildProductJsonLd")
    expect(page).toContain("{heading}")
  })

  it("keeps the product breadcrumb off filtered category URLs", () => {
    const page = readFileSync("src/app/[locale]/products/[slug]/page.tsx", "utf8")
    const start = page.indexOf('aria-label="Breadcrumb"')
    const end = page.indexOf("</nav>", start)
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThan(start)
    expect(page.slice(start, end)).not.toContain("?category=")
  })

  it("does not let cart, checkout, or account declare language alternates", () => {
    for (const file of [
      "src/app/[locale]/cart/page.tsx",
      "src/app/[locale]/checkout/page.tsx",
      "src/app/[locale]/checkout/confirmation/page.tsx",
      "src/app/[locale]/account/page.tsx",
      "src/app/[locale]/account/orders/page.tsx",
      "src/app/[locale]/wishlist/page.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).not.toContain("languages:")
    }
  })

  it("keeps Organization to verified fields and does not emit SearchAction", () => {
    const layout = readFileSync("src/app/[locale]/layout.tsx", "utf8")
    expect(layout).toContain("buildOrganizationJsonLd")
    expect(layout).toContain("buildWebSiteJsonLd")
    expect(layout).not.toContain("buildSearchAction")
    expect(layout).not.toContain("search:")
    expect(layout).not.toContain("legalName")
    expect(layout).not.toContain("sameAs")
    expect(layout).not.toContain("telephone")
    const organization = buildOrganizationJsonLd({
      name: "Nile Pharma Food",
      email: "info@nilepharmafood.com",
      logoPath: "/npf-logo.svg",
    })
    expect(organization["@type"]).toBe("Organization")
    expect(organization.url).toBe(CANONICAL_ORIGIN)
    expect(organization).not.toHaveProperty("legalName")
    expect(organization).not.toHaveProperty("address")
    expect(organization).not.toHaveProperty("telephone")
    expect(organization).not.toHaveProperty("sameAs")
    const website = buildWebSiteJsonLd({ name: "Nile Pharma Food" })
    expect(website["@type"]).toBe("WebSite")
    expect(website.url).toBe(CANONICAL_ORIGIN)
    expect(website).not.toHaveProperty("potentialAction")
  })

  it("keeps catalog filters off the canonical", () => {
    const page = readFileSync("src/app/[locale]/products/page.tsx", "utf8")
    const metaStart = page.indexOf("export async function generateMetadata")
    const metaEnd = page.indexOf("export default", metaStart)
    expect(page.slice(metaStart, metaEnd)).toContain('path: "/products"')
    expect(page.slice(metaStart, metaEnd)).not.toContain("searchParams")
  })

  it("does not advertise the homepage as the hreflang of every route", () => {
    const layout = readFileSync("src/app/[locale]/layout.tsx", "utf8")
    expect(layout).not.toContain("alternates:")
    const meta = buildPageMetadata({
      locale: "en",
      path: "/about",
      title: "About",
      description: "About the seller",
    })
    expect(meta.alternates?.canonical).toBe("/en/about")
    expect(meta.openGraph && "url" in meta.openGraph ? meta.openGraph.url : undefined).toBe("/en/about")
  })

  it("names the Docker builder stage required by COPY --from=builder", () => {
    const dockerfile = readFileSync("Dockerfile", "utf8")
    const builder = dockerfile.indexOf("FROM node:22 AS builder")
    const copy = dockerfile.indexOf("COPY --from=builder")
    expect(builder).toBeGreaterThanOrEqual(0)
    expect(copy).toBeGreaterThan(builder)
  })

  it("does not stamp a fresh lastModified or link the empty blog from navigation", () => {
    expect(readFileSync("src/app/sitemap.ts", "utf8")).not.toContain("new Date(")
    for (const file of [
      "src/components/npf/header.tsx",
      "src/components/npf/footer.tsx",
      "src/components/npf/bottom-nav.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).not.toContain("/blogs")
    }
    expect(readFileSync("src/app/[locale]/careers/page.tsx", "utf8")).toContain("noIndex: !hasOpenJobs")
    const proxy = readFileSync("src/proxy.ts", "utf8")
    expect(proxy).toContain("resolveLegacyPath")
    expect(proxy).toContain('url.search = ""')
    expect(proxy.indexOf("const legacy = resolveLegacyPath")).toBeLessThan(proxy.indexOf("const hasLocale"))
    expect(readFileSync("next.config.ts", "utf8")).toContain("skipTrailingSlashRedirect: true")
    for (const prefix of ["/wp-admin/:path*", "/wp-content/:path*", "/wp-includes/:path*", "/cgi-sys/:path*", "/feed"]) {
      expect(proxy).toContain(prefix)
    }
  })
})
