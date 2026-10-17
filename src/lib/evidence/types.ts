import type { ExposureContext } from "@/lib/products/evidence-pack"

/**
 * Evidence workflow records. These are not product fields and not a
 * `verified` flag. Only an APPROVED record whose snapshotted value still
 * matches the catalog can be projected into the existing evidence pack.
 */

export const REVIEW_STATES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const
export type ReviewState = (typeof REVIEW_STATES)[number]

export const EVIDENCE_SOURCE_TYPES = [
  "OFFICIAL_LEAFLET",
  "MANUFACTURER_DOCUMENT",
  "AUTHORIZATION",
  "REGULATORY_DOCUMENT",
  "INTERNAL_APPROVED_DOCUMENT",
  "OTHER_APPROVED_SOURCE",
] as const
export type EvidenceSourceType = (typeof EVIDENCE_SOURCE_TYPES)[number]

export const FACT_FIELDS = [
  "form",
  "composition",
  "brand",
  "manufacturer",
  "name",
  "nameArabic",
  "sku",
  "category",
  "price",
] as const
export type FactField = (typeof FACT_FIELDS)[number]

export type EvidenceSource = {
  id: string
  sourceType: EvidenceSourceType
  title: string
  /** Label or stored locator. A URL is not authority by itself. */
  locator: string
  state: ReviewState
  /** Opaque private reference. Not a public media URL. */
  documentRef?: string
  issuer?: string
  /** Caller-supplied. This module does not invent a date. */
  reviewedAt?: string
  notes?: string
}

export type FactApproval = {
  id: string
  field: FactField
  /** Exact value that was reviewed. A later catalog edit does not inherit it. */
  reviewedValue: string
  /** English snapshot when the English catalog string differs. */
  reviewedValueEn?: string
  sourceId: string
  state: ReviewState
  reviewerId?: string
  reviewedAt?: string
  note?: string
}

export type ClaimReviewRecord = {
  id: string
  statement: string
  sourceId: string
  state: ReviewState
  allowedContexts: readonly ExposureContext[]
  reviewerId?: string
  reviewedAt?: string
  note?: string
}

export type AuditEvent = {
  action: "create" | "submit" | "start_review" | "approve" | "reject"
  entityId: string
  previousState: ReviewState | null
  newState: ReviewState
  actorId: string
  at: string
}

export type EvidenceDossier = {
  productSlug: string
  sources: EvidenceSource[]
  facts: FactApproval[]
  claims: ClaimReviewRecord[]
  audit: AuditEvent[]
}
