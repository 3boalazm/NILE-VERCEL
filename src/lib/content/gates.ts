import type { Locale } from "@/lib/i18n/config"
import { canEnterSitemap } from "@/lib/seo/page-contract"
import { buildFaqJsonLd, type FaqSchemaItem } from "@/lib/seo/faq-schema"

import { isReservedUnpublishedHub } from "./registry"
import type { AnswerBlock, ContentFaqItem, ContentRecord, EvidenceReference } from "./types"

export const CONTENT_BLOCK_REASONS = [
  "not_published",
  "invalid_slug",
  "missing_copy",
  "medical_claim_without_approved_evidence",
  "comparison_not_cleared",
  "category_is_a_filter",
  "product_indexability_is_owned_by_catalog_gate",
  "entity_page_already_has_a_static_route",
  "unpublished_hub",
] as const

export type ContentBlockReason = (typeof CONTENT_BLOCK_REASONS)[number]

export type ContentIndexDecision = {
  eligible: boolean
  reasons: ContentBlockReason[]
}

function approvedEvidence(evidence: readonly EvidenceReference[] | undefined): boolean {
  return Boolean(evidence?.some((item) => item.reviewStatus === "approved" && item.title.trim()))
}

export function contentPublicPath(record: Pick<ContentRecord, "kind" | "slug">): string | null {
  switch (record.kind) {
    case "educational_article":
    case "guide":
      return `/guides/${record.slug}`
    case "faq":
      return `/faqs/${record.slug}`
    case "comparison":
      return `/comparisons/${record.slug}`
    case "product":
    case "category":
    case "entity_page":
      return null
  }
}

export function contentIndexDecision(record: ContentRecord): ContentIndexDecision {
  const reasons: ContentBlockReason[] = []
  if (record.reviewState !== "published") reasons.push("not_published")
  if (!record.slug.trim() || record.slug.includes("/") || record.slug.includes("?") || record.slug.includes(" ")) {
    reasons.push("invalid_slug")
  }
  if (!record.title.trim() || !record.summary.trim()) reasons.push("missing_copy")
  if (record.layer === "medical_claim" && !approvedEvidence(record.evidence)) {
    reasons.push("medical_claim_without_approved_evidence")
  }
  if (record.kind === "comparison" && record.comparisonCleared !== true) reasons.push("comparison_not_cleared")
  if (record.kind === "category") reasons.push("category_is_a_filter")
  if (record.kind === "product") reasons.push("product_indexability_is_owned_by_catalog_gate")
  if (record.kind === "entity_page") reasons.push("entity_page_already_has_a_static_route")

  const path = contentPublicPath(record)
  if (path && isReservedUnpublishedHub(path)) reasons.push("unpublished_hub")

  return { eligible: reasons.length === 0, reasons }
}

export function isContentSearchIndexEligible(record: ContentRecord): boolean {
  return contentIndexDecision(record).eligible
}

export type ContentSitemapRow = {
  locale: Locale
  path: string
  alternates?: Record<string, string>
}

export function contentSitemapRows(records: readonly ContentRecord[]): ContentSitemapRow[] {
  const eligible = records.filter(isContentSearchIndexEligible)
  return eligible.flatMap((record) => {
    const path = contentPublicPath(record)
    if (!path || !canEnterSitemap(true, path)) return []
    const siblings = eligible.filter(
      (item) => item.translationGroupId === record.translationGroupId && contentPublicPath(item) === path
    )
    const locales = [...new Set(siblings.map((item) => item.locale))]
    const alternates =
      locales.length > 1
        ? Object.fromEntries(locales.map((locale) => [locale, `/${locale}${path}`]))
        : undefined
    return [{ locale: record.locale, path, ...(alternates ? { alternates } : {}) }]
  })
}

export function exposeAnswerBlock(record: ContentRecord): AnswerBlock | null {
  if (!isContentSearchIndexEligible(record) || !record.answer) return null
  if (!record.answer.conciseAnswer.trim() || !record.answer.explanation.trim()) return null
  return record.answer
}

function faqEvidenceApproved(item: ContentFaqItem): boolean {
  return approvedEvidence(item.evidence)
}

export function faqSchemaItems(items: readonly ContentFaqItem[]): FaqSchemaItem[] {
  return items.map((item) => ({
    question: item.question,
    answer: item.answer,
    layer: item.layer,
    visibility: item.visibility,
    reviewState: item.reviewState,
    evidenceApproved: item.layer === "medical_claim" ? faqEvidenceApproved(item) : undefined,
  }))
}

export function buildPublicFaqJsonLd(items: readonly ContentFaqItem[]) {
  return buildFaqJsonLd(faqSchemaItems(items))
}
