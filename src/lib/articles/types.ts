import type { Locale } from "@/lib/i18n/config"

/**
 * Articles ("المدونة") — readable write-ups of the published research behind
 * each product. Built 2026-09-24 from the source list the client supplied;
 * every entry was then verified field-by-field against the publisher record
 * (see docs/reviews/2026-09-24-articles-verification-ar.md).
 *
 * The type keeps the verified bibliographic block (`source`) separate from
 * NPF's own prose (`summary`/`keyFindings`/`caveat`) so the two can never be
 * confused: the citation is quoted, the writing is ours and graded.
 */

/** How strong the underlying evidence is, in plain tiers the UI can label. */
export type EvidenceTier =
  /** Randomised, placebo-controlled trial of this exact product. */
  | "direct-rct"
  /** Study on this exact product, weaker design (before/after, open-label, abstract). */
  | "direct-other"
  /** Systematic review / meta-analysis — not of this product alone. */
  | "systematic-review"
  /** Evidence for an ingredient the product contains, not the formulation. */
  | "ingredient"

/**
 * Publication state. `published` is live on /blogs; `review` is seeded and
 * visible in the Payload admin but withheld from the site until the client
 * signs off (metadata we corrected ourselves); `draft` is parked pending a
 * decision (a source we could not reconcile with the claim made for it).
 *
 * Every row currently in the list is `published` — the client approved them
 * on 2026-09-25 — but the two held states stay part of the type because they
 * are how a future write-up is parked from the admin instead of being deleted.
 */
export type ArticleStatus = "published" | "review" | "draft"

/** The verified bibliographic record — quoted, never rewritten. */
export type ArticleSource = {
  title: string
  authors: string
  /** Journal or publisher, as printed. */
  journal: string
  year: string
  /** Human-readable study type, e.g. "تجربة عشوائية معشّاة مزدوجة". */
  type: string
  doi?: string
  url?: string
  /** PMID/PMCID where one exists. */
  pubmedId?: string
}

export type ArticleTranslation = {
  title?: string
  summary?: string
  keyFindings?: string[]
  caveat?: string
  reviewNote?: string
  source?: { type?: string; journal?: string }
}

export type Article = {
  id: string
  slug: string
  title: string
  summary: string
  keyFindings: string[]
  /**
   * What this source does NOT show — the limits a reader (or a regulator)
   * would otherwise have to work out themselves. Never empty for published
   * articles.
   */
  caveat: string
  /**
   * Product this article is written for — drives the cross-link and CTA.
   * An empty string marks a topic-only article: the source is worth writing up
   * but does not support the product it was filed under, so it is published
   * without any product association.
   */
  productSlug: string
  source: ArticleSource
  evidenceTier: EvidenceTier
  status: ArticleStatus
  /**
   * Internal explanation of why an article is held back. Admin-only: the
   * public repository drops `review`/`draft` rows entirely, and the note
   * with them.
   */
  reviewNote?: string
  /** en: overrides for the locale-bearing fields above; base stays Arabic. */
  translations?: { en?: ArticleTranslation }
}

export type ArticleRepository = {
  /** Published only — the storefront never sees review/draft rows. */
  getPublishedArticles(): Promise<Article[]>
  getArticleBySlug(slug: string): Promise<Article | null>
  getArticlesByProduct(productSlug: string): Promise<Article[]>
  /** Every row regardless of status — seeding and the sitemap's needs. */
  getAllArticles(): Promise<Article[]>
}

/** Same overlay approach as products: base fields are Arabic. */
export function localizeArticle(article: Article, locale: Locale): Article {
  if (locale === "ar") return article
  const t = article.translations?.en
  if (!t) return article
  return {
    ...article,
    ...t,
    source: { ...article.source, ...(t.source ?? {}) },
  }
}
