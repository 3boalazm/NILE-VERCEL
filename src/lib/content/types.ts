import type { Locale } from "@/lib/i18n/config"

/**
 * Future content contract. Nothing in this module is a public page.
 * Product facts stay on the catalog type. Editorial copy and medical
 * claims are separate layers so a claim cannot be stored as ordinary
 * marketing text and then treated as cleared.
 */

export const CONTENT_KINDS = [
  "product",
  "category",
  "educational_article",
  "faq",
  "comparison",
  "guide",
  "entity_page",
] as const
export type ContentKind = (typeof CONTENT_KINDS)[number]

export const CONTENT_LAYERS = ["factual_product", "editorial", "medical_claim"] as const
export type ContentLayer = (typeof CONTENT_LAYERS)[number]

export const REVIEW_STATES = [
  "draft",
  "internal_review",
  "evidence_review",
  "approved",
  "published",
] as const
export type ReviewState = (typeof REVIEW_STATES)[number]

export const SOURCE_TYPES = [
  "product_leaflet",
  "manufacturer_documentation",
  "regulatory_source",
  "peer_reviewed_publication",
  "recognized_medical_institution",
  "official_company_documentation",
] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

export type EvidenceReference = {
  title: string
  url?: string
  sourceType: SourceType
  publishedAt?: string
  reviewStatus: "unreviewed" | "approved"
}

export type ContentFaqItem = {
  question: string
  answer: string
  layer: ContentLayer
  visibility: "hidden" | "public"
  reviewState: ReviewState
  evidence?: readonly EvidenceReference[]
}

export type AnswerBlock = {
  conciseAnswer: string
  explanation: string
  keyFacts?: readonly string[]
  definitions?: readonly { term: string; definition: string }[]
  relatedProductSlugs?: readonly string[]
  sources?: readonly EvidenceReference[]
  faq?: readonly ContentFaqItem[]
  reviewedAt?: string
}

export type ContentRecord = {
  id: string
  translationGroupId: string
  kind: ContentKind
  layer: ContentLayer
  slug: string
  locale: Locale
  title: string
  titleArabic?: string
  titleEnglish?: string
  summary: string
  body?: string
  reviewState: ReviewState
  evidence?: readonly EvidenceReference[]
  relatedProductSlugs?: readonly string[]
  relatedContentIds?: readonly string[]
  relatedCategorySlugs?: readonly string[]
  faq?: readonly ContentFaqItem[]
  answer?: AnswerBlock
  /** Stored timestamp only. Callers must not pass `new Date()`. */
  updatedAt?: string
  author?: string
  /** Comparison pages stay blocked until a reviewer sets this. The public registry never does. */
  comparisonCleared?: boolean
}

export const REVIEW_NEXT: Record<ReviewState, ReviewState | null> = {
  draft: "internal_review",
  internal_review: "evidence_review",
  evidence_review: "approved",
  approved: "published",
  published: null,
}

export function nextReviewState(state: ReviewState): ReviewState | null {
  return REVIEW_NEXT[state]
}
