import type { Article } from "./types"
import { mockArticles } from "./mock-repository"

/**
 * Data seam for articles, mirroring `ProductRepository`: the Payload-backed
 * implementation is the live source, the mock list is the offline fallback
 * used by seeding and by dev/CI when Payload is unreachable.
 *
 * The published-only methods exist so a withheld article can never leak into
 * the storefront by accident — the filtering happens here, not in the pages.
 */
export interface ArticleRepository {
  getPublishedArticles(): Promise<Article[]>
  getArticleBySlug(slug: string): Promise<Article | null>
  getArticlesByProduct(productSlug: string): Promise<Article[]>
  getAllArticles(): Promise<Article[]>
}

export class MockArticleRepository implements ArticleRepository {
  async getAllArticles(): Promise<Article[]> {
    return mockArticles
  }

  async getPublishedArticles(): Promise<Article[]> {
    return mockArticles.filter((article) => article.status === "published")
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    return (
      mockArticles.find((article) => article.slug === slug && article.status === "published") ?? null
    )
  }

  async getArticlesByProduct(productSlug: string): Promise<Article[]> {
    return mockArticles.filter(
      (article) => article.productSlug === productSlug && article.status === "published"
    )
  }
}
