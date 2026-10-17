/**
 * Server-side evidence attachment for one SKU.
 *
 * This is not a storefront form and not a client authorization flag.
 * Payload does not read or write it. A request body must never be copied
 * onto this object. A future repository field may populate it only after
 * a reviewed server-side write. No storefront role exists for that write.
 */

export const EVIDENCE_SOURCE_KINDS = [
  "official_product_leaflet",
  "manufacturer_documentation",
  "authorized_product_documentation",
  "regulatory_documentation",
  "internal_approved_source",
  "other_approved_source",
] as const

export type EvidenceSourceKind = (typeof EVIDENCE_SOURCE_KINDS)[number]

export const EVIDENCE_FACT_CLASSES = [
  "identity",
  "commercial",
  "brand_manufacturer",
  "composition_spec",
  "health_claim",
] as const

export type EvidenceFactClass = (typeof EVIDENCE_FACT_CLASSES)[number]

export const EXPOSURE_CONTEXTS = [
  "PRODUCT_PAGE",
  "PRODUCT_SCHEMA",
  "SITEMAP",
  "COMMERCIAL_COPY",
  "EDITORIAL_CONTENT",
  "MEDICAL_CONTENT",
] as const

export type ExposureContext = (typeof EXPOSURE_CONTEXTS)[number]

export type EvidenceReference = {
  id: string
  kind: EvidenceSourceKind
  /** Stored path or document title. Blank is not a usable reference. */
  locator: string
  reviewStatus: "unreviewed" | "approved"
  covers: readonly EvidenceFactClass[]
}

export type ClaimClearance = {
  id: string
  /** Exact stored statement. This record does not invent wording. */
  statement: string
  evidenceIds: readonly string[]
  reviewStatus: "unverified" | "approved" | "rejected"
  allowedContexts: readonly ExposureContext[]
}

export type AuthorizationRecord = {
  name: string
  evidenceIds: readonly string[]
  reviewStatus: "unreviewed" | "approved" | "rejected"
}

export type SkuEvidencePack = {
  references?: readonly EvidenceReference[]
  claims?: readonly ClaimClearance[]
  brand?: AuthorizationRecord
  manufacturer?: AuthorizationRecord
  /**
   * Independent claim review. Absent is not clearance.
   * `publicClaims: "none"` conflicts with stored claim text.
   */
  claimReview?: {
    reviewStatus: "unreviewed" | "approved" | "rejected"
    publicClaims: "none" | "listed"
    evidenceIds: readonly string[]
  }
  /**
   * Optional second identity source. A disagreement is a conflict.
   * It is not a correction of the catalog row.
   */
  identity?: {
    slug?: string
    name?: string
    nameArabic?: string
    sku?: string
  }
}
