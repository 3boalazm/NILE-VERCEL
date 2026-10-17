import { getPayloadClient } from "@/lib/cms/payload-client"
import { degradeToMock } from "@/lib/products/mock-fallback"
import { MockArticleRepository } from "./repository"
import type { Article, ArticleRepository, ArticleStatus, EvidenceTier } from "./types"

/**
 * Live repository: reads the `articles` collection from Payload and maps it
 * onto the UI-facing `Article` type, so nothing outside this file knows about
 * CMS shapes. Mirrors `PayloadProductRepository`, including the fail-closed
 * behaviour: in production a CMS outage surfaces as an error rather than
 * silently swapping in the mock list, while `MOCK_CATALOG_FALLBACK=1`
 * (dev/CI) keeps offline browsing working.
 */
const TIERS: EvidenceTier[] = ["direct-rct", "direct-other", "systematic-review", "ingredient"]
const STATUSES: ArticleStatus[] = ["published", "review", "draft"]

function toTier(value: unknown): EvidenceTier {
  return TIERS.includes(value as EvidenceTier) ? (value as EvidenceTier) : "ingredient"
}

function toStatus(value: unknown): ArticleStatus {
  return STATUSES.includes(value as ArticleStatus) ? (value as ArticleStatus) : "draft"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Payload document shapes are validated at runtime
function toArticle(doc: any): Article {
  const en = doc.translations?.en
  return {
    id: String(doc.id),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    keyFindings: (doc.keyFindings ?? []).map((item: { text: string }) => item.text),
    caveat: doc.caveat,
    productSlug: typeof doc.product === "object" ? (doc.product?.slug ?? "") : String(doc.product ?? ""),
    source: {
      title: doc.source?.title ?? "",
      authors: doc.source?.authors ?? "",
      journal: doc.source?.journal ?? "",
      year: doc.source?.year ?? "",
      type: doc.source?.type ?? "",
      doi: doc.source?.doi ?? undefined,
      url: doc.source?.url ?? undefined,
      pubmedId: doc.source?.pubmedId ?? undefined,
    },
    evidenceTier: toTier(doc.evidenceTier),
    status: toStatus(doc.status),
    reviewNote: doc.reviewNote ?? undefined,
    translations: en
      ? {
          en: {
            title: en.title ?? undefined,
            summary: en.summary ?? undefined,
            keyFindings: en.keyFindings?.length
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                en.keyFindings.map((item: any) => item.text as string)
              : undefined,
            caveat: en.caveat ?? undefined,
            reviewNote: en.reviewNote ?? undefined,
            source: { type: en.source?.type ?? undefined, journal: en.source?.journal ?? undefined },
          },
        }
      : undefined,
  }
}

async function findArticles(where?: Record<string, unknown>): Promise<Article[]> {
  // The config is imported on demand (not at module scope) so a missing
  // runtime CMS environment surfaces as a failed *read* — which this
  // repository already handles — instead of a failed page render.
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: "articles",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Payload's Where type is generic over the collection
    where: where as any,
    limit: 200,
    depth: 1,
    sort: "-source.year",
    overrideAccess: true,
  })
  return result.docs.map(toArticle)
}

export class PayloadArticleRepository implements ArticleRepository {
  private mock = new MockArticleRepository()

  private async read(operation: string, where: Record<string, unknown>, fallback: () => Promise<Article[]>) {
    try {
      return await findArticles(where)
    } catch (error) {
      degradeToMock(operation, error)
      return fallback()
    }
  }

  async getAllArticles(): Promise<Article[]> {
    return this.read("getAllArticles", {}, () => this.mock.getAllArticles())
  }

  async getPublishedArticles(): Promise<Article[]> {
    return this.read("getPublishedArticles", { status: { equals: "published" } }, () =>
      this.mock.getPublishedArticles()
    )
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const [article] = await this.read(
      `getArticleBySlug("${slug}")`,
      { slug: { equals: slug }, status: { equals: "published" } },
      async () => {
        const found = await this.mock.getArticleBySlug(slug)
        return found ? [found] : []
      }
    )
    return article ?? null
  }

  async getArticlesByProduct(productSlug: string): Promise<Article[]> {
    return this.read(
      `getArticlesByProduct("${productSlug}")`,
      { "product.slug": { equals: productSlug }, status: { equals: "published" } },
      () => this.mock.getArticlesByProduct(productSlug)
    )
  }
}
