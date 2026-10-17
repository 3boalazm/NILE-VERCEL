import { PayloadArticleRepository } from "./payload-repository"

/**
 * Single composition point for article data, same shape as
 * `@/lib/products`. Pages import from here and never touch Payload directly.
 */
export const articleRepository = new PayloadArticleRepository()

export { MockArticleRepository } from "./repository"
export type { ArticleRepository } from "./repository"
export { localizeArticle } from "./types"
export type {
  Article,
  ArticleSource,
  ArticleStatus,
  ArticleTranslation,
  EvidenceTier,
} from "./types"
