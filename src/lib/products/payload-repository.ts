import { resolveCatalogPrice } from "./catalog-price"
import { getPayloadClient } from "@/lib/cms/payload-client"

import { getLivePrices, type LivePrice } from "@/lib/vendure/pricing"
import type { ProductRepository } from "./repository"
import type { Product, ProductCategory } from "./types"
import { MockProductRepository } from "./mock-repository"
import { degradeToMock, mockFallbackEnabled } from "./mock-fallback"
import { isValidSlug } from "@/lib/validation/identifiers"

/**
 * Payload's Products/Categories collections now carry their own
 * `translations`/`scientificInfo`/category `image` fields natively (added
 * and re-seeded same day) — those are read straight from Payload's doc
 * below, not bridged. The fields genuinely absent from Payload's schema on
 * purpose are sku/price: that's Vendure's domain per ADR-007, resolved
 * live per slug via `getLivePrices()` so the PDP/listing price is always
 * the same number checkout will charge (single source of truth: Vendure).
 * MockProductRepository remains only as an offline fallback by matching
 * slug. Bridge prices are permitted only by explicit demo opt-in.
 */
const mockRepository = new MockProductRepository()

async function buildMockProductMap(): Promise<Map<string, Product>> {
  const products = await mockRepository.getAllProducts()
  return new Map(products.map((product) => [product.slug, product]))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toEnTranslation(en: any) {
  if (!en) return undefined
  return {
    shortDescription: en.shortDescription ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyBenefits: en.keyBenefits?.map((benefit: any) => benefit.text),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    composition: en.composition?.map((item: any) => ({ label: item.label, value: item.value })),
    compositionNote: en.compositionNote ?? undefined,
    usage: en.usage ?? undefined,
    availableForm: en.availableForm ?? undefined,
    scientificInfo: en.scientificInfo ?? undefined,
    faq: en.faq?.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? en.faq.map((item: any) => ({ question: item.question, answer: item.answer }))
      : undefined,
    testimonials: en.testimonials?.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? en.testimonials.map((item: any) => ({ quote: item.quote, author: item.author ?? undefined }))
      : undefined,
    clinicalReferences: en.clinicalReferences?.length
      ? en.clinicalReferences.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => ({
            title: item.title,
            authors: item.authors ?? undefined,
            year: item.year ?? undefined,
            url: item.url ?? undefined,
            note: item.note ?? undefined,
          })
        )
      : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(doc: any, mockBySlug: Map<string, Product>, livePrices: Map<string, LivePrice>): Product {
  // Only sku/price are genuinely absent from Payload's schema (Vendure's
  // domain, ADR-007) — everything else below reads Payload's own fields
  // directly. Live Vendure values win; the mock bridge covers slugs
  // Vendure doesn't know or can't be reached for (offline dev, CI build).
  const bridge = mockBySlug.get(doc.slug)
  const live = livePrices.get(doc.slug)
  return {
    id: String(doc.id),
    slug: doc.slug,
    name: doc.name,
    nameArabic: doc.nameArabic ?? undefined,
    categorySlug: typeof doc.category === "object" ? doc.category.slug : doc.category,
    status: doc.status,
    shortDescription: doc.shortDescription,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyBenefits: (doc.keyBenefits ?? []).map((benefit: any) => benefit.text),
    composition: doc.composition?.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => ({ label: item.label, value: item.value })
    ),
    compositionNote: doc.compositionNote ?? undefined,
    usage: doc.usage ?? undefined,
    availableForm: doc.availableForm ?? undefined,
    scientificInfo: doc.scientificInfo ?? undefined,
    downloadUrl: doc.downloadUrl ?? undefined,
    faq: doc.faq?.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? doc.faq.map((item: any) => ({ question: item.question, answer: item.answer }))
      : undefined,
    testimonials: doc.testimonials?.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? doc.testimonials.map((item: any) => ({ quote: item.quote, author: item.author ?? undefined }))
      : undefined,
    clinicalReferences: doc.clinicalReferences?.length
      ? doc.clinicalReferences.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => ({
            title: item.title,
            authors: item.authors ?? undefined,
            year: item.year ?? undefined,
            url: item.url ?? undefined,
            note: item.note ?? undefined,
          })
        )
      : undefined,
    image: typeof doc.image === "object" ? (doc.image?.url ?? undefined) : undefined,
    gallery: doc.gallery
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.map((item: any) => (typeof item.image === "object" ? item.image?.url : undefined))
      .filter((url: string | undefined): url is string => Boolean(url)),
    // Missing live commerce data must not reintroduce bridge money.
    ...resolveCatalogPrice(live, bridge, mockFallbackEnabled()),
    translations: doc.translations?.en ? { en: toEnTranslation(doc.translations.en) } : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCategory(doc: any): ProductCategory {
  return {
    id: String(doc.id),
    slug: doc.slug,
    name: doc.name,
    description: doc.description ?? undefined,
    status: doc.status,
    image: typeof doc.image === "object" ? (doc.image?.url ?? undefined) : undefined,
    translations: doc.translations?.en
      ? { en: { name: doc.translations.en.name ?? undefined, description: doc.translations.en.description ?? undefined } }
      : undefined,
  }
}

export class PayloadProductRepository implements ProductRepository {
  /**
   * The Payload client is created per call, not at module scope: the config
   * module validates the runtime environment when it is imported, and a
   * top-level import turned a missing `DATABASE_URI` / `PAYLOAD_SECRET` into
   * a failed *page* render instead of a failed *catalog* read. See
   * `src/lib/cms/payload-client.ts`.
   */
  private getClient() {
    return getPayloadClient()
  }

  async getAllProducts(): Promise<Product[]> {
    const mockBySlug = await buildMockProductMap()
    let docs: Record<string, unknown>[]
    try {
      const payload = await this.getClient()
      ;({ docs } = await payload.find({ collection: "products", depth: 2, limit: 0 }))
    } catch (error) {
      // Payload/Postgres unreachable or misconfigured. Only the Payload work
      // falls back here; `buildMockProductMap` and `getLivePrices` failures
      // still propagate. Fail closed by default so production never serves
      // mock catalog data to real customers.
      degradeToMock("getAllProducts", error)
      return Array.from(mockBySlug.values())
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const livePrices = await getLivePrices(docs.map((doc: any) => doc.slug))
    return docs.map((doc) => toProduct(doc, mockBySlug, livePrices))
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    // F-54: a malformed slug is a 404-shaped request, not a database query.
    // Returning null here makes every caller (PDP, sitemap, JSON-LD) answer
    // notFound() instead of letting Payload choke and surface a 500.
    if (!isValidSlug(slug)) return null
    const mockBySlug = await buildMockProductMap()
    let docs: Record<string, unknown>[]
    try {
      const payload = await this.getClient()
      ;({ docs } = await payload.find({
        collection: "products",
        where: { slug: { equals: slug } },
        depth: 2,
        limit: 1,
      }))
    } catch (error) {
      degradeToMock(`getProductBySlug("${slug}")`, error)
      const bridge = mockBySlug.get(slug)
      return bridge ?? null
    }
    if (!docs[0]) return null
    const livePrices = await getLivePrices([slug])
    return toProduct(docs[0], mockBySlug, livePrices)
  }

  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    const mockBySlug = await buildMockProductMap()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let categoryDoc: any
    try {
      const payload = await this.getClient()
      const category = await payload.find({
        collection: "categories",
        where: { slug: { equals: categorySlug } },
        limit: 1,
      })
      categoryDoc = category.docs[0]
    } catch (error) {
      degradeToMock(`getProductsByCategory("${categorySlug}")`, error)
      return Array.from(mockBySlug.values()).filter(
        (product) => product.categorySlug === categorySlug
      )
    }
    if (!categoryDoc) return []
    let docs: Record<string, unknown>[]
    try {
      const payload = await this.getClient()
      ;({ docs } = await payload.find({
        collection: "products",
        where: { category: { equals: categoryDoc.id } },
        depth: 2,
        limit: 0,
      }))
    } catch (error) {
      degradeToMock(`getProductsByCategory("${categorySlug}") product query`, error)
      return Array.from(mockBySlug.values()).filter(
        (product) => product.categorySlug === categorySlug
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const livePrices = await getLivePrices(docs.map((doc: any) => doc.slug))
    return docs.map((doc) => toProduct(doc, mockBySlug, livePrices))
  }

  async getAllCategories(): Promise<ProductCategory[]> {
    let docs: Record<string, unknown>[]
    try {
      const payload = await this.getClient()
      ;({ docs } = await payload.find({ collection: "categories", depth: 1, limit: 0 }))
    } catch (error) {
      degradeToMock("getAllCategories", error)
      const mock = new MockProductRepository()
      return mock.getAllCategories()
    }
    return docs.map(toCategory)
  }

  async getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
    let docs: Record<string, unknown>[]
    try {
      const payload = await this.getClient()
      ;({ docs } = await payload.find({
        collection: "categories",
        where: { slug: { equals: slug } },
        depth: 1,
        limit: 1,
      }))
    } catch (error) {
      degradeToMock(`getCategoryBySlug("${slug}")`, error)
      const mock = new MockProductRepository()
      return mock.getCategoryBySlug(slug)
    }
    return docs[0] ? toCategory(docs[0]) : null
  }
}
