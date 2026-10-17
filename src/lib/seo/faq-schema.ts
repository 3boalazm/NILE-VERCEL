/**
 * FAQ structured data. Returns null unless every emitted item is an
 * approved public answer. Medical items without an approved evidence
 * flag are dropped. Hidden and unpublished items are dropped.
 * This module does not invent questions.
 */

export const FAQ_LAYERS = ["factual_product", "editorial", "medical_claim"] as const
export type FaqLayer = (typeof FAQ_LAYERS)[number]

export const FAQ_REVIEW_STATES = [
  "draft",
  "internal_review",
  "evidence_review",
  "approved",
  "published",
] as const
export type FaqReviewState = (typeof FAQ_REVIEW_STATES)[number]

export type FaqSchemaItem = {
  question: string
  answer: string
  layer: FaqLayer
  visibility: "hidden" | "public"
  reviewState: FaqReviewState
  evidenceApproved?: boolean
}

type JsonLd = Record<string, unknown>

function emitItem(item: FaqSchemaItem): boolean {
  if (item.visibility !== "public" || item.reviewState !== "published") return false
  if (!item.question.trim() || !item.answer.trim()) return false
  if (item.layer === "medical_claim" && item.evidenceApproved !== true) return false
  return true
}

export function buildFaqJsonLd(items: readonly FaqSchemaItem[]): JsonLd | null {
  const visible = items.filter(emitItem)
  if (visible.length === 0) return null
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: visible.map((item) => ({
      "@type": "Question",
      name: item.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer.trim(),
      },
    })),
  }
}
