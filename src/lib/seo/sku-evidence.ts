import type { Locale } from "@/lib/i18n/config"
import type { ExposureContext, EvidenceFactClass, SkuEvidencePack } from "@/lib/products/evidence-pack"
import type { Product, ProductStatus, ProductTranslation, SpecItem } from "@/lib/products/types"

import { productHeading } from "./product-identity"

/**
 * SKU evidence and search eligibility.
 *
 * Existence, active status, stored text, claim clearance, and sitemap
 * eligibility are separate. This module derives them. It does not store a
 * second boolean and it does not invent facts.
 *
 * A leaflet path is an unreviewed locator, not approval.
 * A product name is not a brand authorization.
 */

export const SUPPLEMENT_CATEGORY_SLUG = "supplements"
export const DEVICE_CATEGORY_SLUG = "medical-devices"

export const INDEX_BLOCK_REASONS = [
  "status_not_active",
  "missing_slug",
  "missing_latin_name",
  "missing_arabic_name",
  "missing_category",
  "unconfirmed_catalog_facts",
  "supplement_claim_clearance_absent",
  "category_not_cleared_for_index",
  "missing_device_specs",
  "conflicting_identity",
  "conflicting_catalog_facts",
  "unverified_required_facts",
] as const

export type IndexBlockReason = (typeof INDEX_BLOCK_REASONS)[number]

export type SearchIndexDecision = {
  eligible: boolean
  reasons: IndexBlockReason[]
}

export const EVIDENCE_STATES = ["VERIFIED", "UNVERIFIED", "MISSING", "CONFLICTING", "NOT_APPLICABLE"] as const
export type EvidenceState = (typeof EVIDENCE_STATES)[number]

export const EVIDENCE_FIELDS = [
  "slug",
  "name",
  "nameArabic",
  "sku",
  "category",
  "form",
  "price",
  "priceWithTax",
  "availability",
  "stock",
  "brand",
  "manufacturer",
  "composition",
  "leaflet",
  "image",
  "shortDescription",
  "keyBenefits",
  "usage",
  "scientificInfo",
  "faq",
  "testimonials",
  "clinicalReferences",
] as const

export type EvidenceField = (typeof EVIDENCE_FIELDS)[number]

export type FieldAssessment = {
  field: EvidenceField
  factClass: EvidenceFactClass
  state: EvidenceState
  reason: string
  requiresEvidence: boolean
  safeForSearch: boolean
}

export type SkuAssessment = {
  slug: string
  sku: string | null
  productType: "device" | "supplement" | "other"
  active: boolean
  identity: EvidenceState
  commercial: EvidenceState
  composition: EvidenceState
  brandManufacturer: EvidenceState
  evidence: EvidenceState
  claims: EvidenceState
  eligible: boolean
  reasons: IndexBlockReason[]
  blockingReason: string
  fields: Record<EvidenceField, FieldAssessment>
}

export type { ExposureContext }

const UNCONFIRMED_FACT_MARKERS = [
  "غير مؤكدة",
  "غير مؤكد",
  "قيد الاعتماد",
  "not yet confirmed",
  "pending approval",
]

const FACT_CLASS: Record<EvidenceField, EvidenceFactClass> = {
  slug: "identity",
  name: "identity",
  nameArabic: "identity",
  sku: "identity",
  category: "identity",
  form: "identity",
  price: "commercial",
  priceWithTax: "commercial",
  availability: "commercial",
  stock: "commercial",
  brand: "brand_manufacturer",
  manufacturer: "brand_manufacturer",
  composition: "composition_spec",
  leaflet: "composition_spec",
  image: "identity",
  shortDescription: "health_claim",
  keyBenefits: "health_claim",
  usage: "health_claim",
  scientificInfo: "health_claim",
  faq: "health_claim",
  testimonials: "health_claim",
  clinicalReferences: "health_claim",
}

/** The catalog type marks SKU optional. Missing SKU is a gap, not an index block. */
export const SKU_REQUIRED_BY_CATALOG_MODEL = false

export const NON_INDEX_STATUSES: readonly ProductStatus[] = ["paused", "launching_soon"]

function present(value: string | undefined | null): boolean {
  return Boolean(value?.trim())
}

function unique(reasons: IndexBlockReason[]): IndexBlockReason[] {
  return INDEX_BLOCK_REASONS.filter((reason) => reasons.includes(reason))
}

function factLines(composition: SpecItem[] | undefined, note: string | undefined, form: string | undefined): string[] {
  const lines: string[] = []
  for (const item of composition ?? []) lines.push(item.label, item.value)
  if (note) lines.push(note)
  if (form) lines.push(form)
  return lines
}

export function hasUnconfirmedCatalogFacts(product: Product): boolean {
  const lines = [
    ...factLines(product.composition, product.compositionNote, product.availableForm),
    ...factLines(
      product.translations?.en?.composition,
      product.translations?.en?.compositionNote,
      product.translations?.en?.availableForm
    ),
  ]
  const haystack = lines.join("\n").toLowerCase()
  return UNCONFIRMED_FACT_MARKERS.some((marker) => haystack.includes(marker.toLowerCase()))
}

function textHasUnconfirmedMarker(value: string | undefined): boolean {
  const haystack = value?.toLowerCase() ?? ""
  return UNCONFIRMED_FACT_MARKERS.some((marker) => haystack.includes(marker.toLowerCase()))
}

function productType(product: Product): SkuAssessment["productType"] {
  if (product.categorySlug === DEVICE_CATEGORY_SLUG) return "device"
  if (product.categorySlug === SUPPLEMENT_CATEGORY_SLUG) return "supplement"
  return "other"
}

function packOf(product: Product): SkuEvidencePack {
  return product.evidencePack ?? {}
}

function usableReference(pack: SkuEvidencePack, id: string, factClass: EvidenceFactClass) {
  const reference = pack.references?.find((item) => item.id === id)
  if (!reference) return false
  if (reference.reviewStatus !== "approved") return false
  if (!reference.id.trim() || !reference.locator.trim()) return false
  return reference.covers.includes(factClass)
}

function hasCoverage(pack: SkuEvidencePack, factClass: EvidenceFactClass): boolean {
  return (pack.references ?? []).some(
    (reference) =>
      reference.reviewStatus === "approved" &&
      reference.id.trim().length > 0 &&
      reference.locator.trim().length > 0 &&
      reference.covers.includes(factClass)
  )
}

function idsResolve(pack: SkuEvidencePack, ids: readonly string[], factClass: EvidenceFactClass): boolean {
  return ids.length > 0 && ids.every((id) => usableReference(pack, id, factClass))
}

function field(product: Product, name: EvidenceField, state: EvidenceState, reason: string, requiresEvidence: boolean): FieldAssessment {
  return {
    field: name,
    factClass: FACT_CLASS[name],
    state,
    reason,
    requiresEvidence,
    safeForSearch: state === "VERIFIED",
  }
}

function comparedIdentity(stored: string | undefined, asserted: string | undefined, invalid = false): EvidenceState {
  const left = stored?.trim() ?? ""
  const right = asserted?.trim() ?? ""
  if (right && left && right !== left) return "CONFLICTING"
  if (!left || invalid) return "MISSING"
  return "VERIFIED"
}

function validSlug(slug: string | undefined): boolean {
  const value = slug?.trim() ?? ""
  return value.length > 0 && !/[\s?#/]/.test(value)
}

function duplicateSpecConflict(rows: SpecItem[] | undefined): boolean {
  const seen = new Map<string, string>()
  for (const row of rows ?? []) {
    const label = row.label.trim().toLowerCase()
    const value = row.value.trim()
    if (!label || !value) continue
    const previous = seen.get(label)
    if (previous !== undefined && previous !== value) return true
    seen.set(label, value)
  }
  return false
}

function localeMarkerConflict(product: Product): boolean {
  const pairs: [string | undefined, string | undefined][] = [
    [product.availableForm, product.translations?.en?.availableForm],
    [product.compositionNote, product.translations?.en?.compositionNote],
  ]
  return pairs.some(([arabic, english]) => {
    if (!present(arabic) || !present(english)) return false
    return textHasUnconfirmedMarker(arabic) !== textHasUnconfirmedMarker(english)
  })
}

type Prose = {
  shortDescription?: string
  keyBenefits?: string[]
  usage?: string
  scientificInfo?: string
  compositionNote?: string
  faq?: { answer: string }[]
  testimonials?: { quote: string }[]
  clinicalReferences?: { title: string }[]
}

function pushProse(lines: string[], source: Prose | undefined) {
  if (!source) return
  if (source.shortDescription) lines.push(source.shortDescription)
  for (const line of source.keyBenefits ?? []) lines.push(line)
  if (source.usage) lines.push(source.usage)
  if (source.scientificInfo) lines.push(source.scientificInfo)
  if (source.compositionNote) lines.push(source.compositionNote)
  for (const item of source.faq ?? []) lines.push(item.answer)
  for (const item of source.testimonials ?? []) lines.push(item.quote)
  for (const item of source.clinicalReferences ?? []) lines.push(item.title)
}

export function storedClaimStatements(product: Product): string[] {
  const lines: string[] = []
  pushProse(lines, product)
  pushProse(lines, product.translations?.en as ProductTranslation | undefined)
  return [...new Set(lines.map((line) => line.trim()).filter(Boolean))]
}

function approvedClaimMatches(product: Product, statement: string, context?: ExposureContext): boolean {
  const pack = packOf(product)
  return (pack.claims ?? []).some(
    (claim) =>
      claim.reviewStatus === "approved" &&
      claim.statement.trim() === statement &&
      idsResolve(pack, claim.evidenceIds, "health_claim") &&
      (context === undefined || claim.allowedContexts.includes(context))
  )
}

function claimReviewConflicts(product: Product, statements: readonly string[]): boolean {
  const review = packOf(product).claimReview
  return Boolean(review && review.publicClaims === "none" && statements.length > 0)
}

function supplementClaimsCleared(product: Product): boolean {
  const pack = packOf(product)
  const statements = storedClaimStatements(product)
  const review = pack.claimReview
  if (claimReviewConflicts(product, statements)) return false
  if (statements.length === 0) {
    return Boolean(
      review &&
        review.reviewStatus === "approved" &&
        review.publicClaims === "none" &&
        idsResolve(pack, review.evidenceIds, "health_claim")
    )
  }
  if (!review || review.reviewStatus !== "approved" || review.publicClaims !== "listed") return false
  if (!idsResolve(pack, review.evidenceIds, "health_claim")) return false
  return statements.every((statement) => approvedClaimMatches(product, statement))
}

function proseState(product: Product, lines: string[]): EvidenceState {
  const statements = lines.map((line) => line.trim()).filter(Boolean)
  if (statements.length === 0) return "NOT_APPLICABLE"
  if (claimReviewConflicts(product, storedClaimStatements(product))) return "CONFLICTING"
  if (statements.every((statement) => approvedClaimMatches(product, statement))) return "VERIFIED"
  return "UNVERIFIED"
}

function authorizationState(product: Product, kind: "brand" | "manufacturer"): EvidenceState {
  const record = packOf(product)[kind]
  if (!record) return "MISSING"
  if (!record.name.trim() || record.reviewStatus !== "approved") return "UNVERIFIED"
  if (!idsResolve(packOf(product), record.evidenceIds, "brand_manufacturer")) return "UNVERIFIED"
  return "VERIFIED"
}

function formState(product: Product): EvidenceState {
  const arabic = product.availableForm
  const english = product.translations?.en?.availableForm
  if (!present(arabic) && !present(english)) return "MISSING"
  if (localeMarkerConflict(product) && (textHasUnconfirmedMarker(arabic) || textHasUnconfirmedMarker(english))) {
    return "CONFLICTING"
  }
  if (textHasUnconfirmedMarker(arabic) || textHasUnconfirmedMarker(english)) return "UNVERIFIED"
  if (productType(product) === "device") return "VERIFIED"
  if (productType(product) === "supplement" && hasCoverage(packOf(product), "identity")) return "VERIFIED"
  return "UNVERIFIED"
}

function compositionState(product: Product): EvidenceState {
  const rows = product.composition ?? []
  const english = product.translations?.en?.composition ?? []
  if (rows.length === 0 && english.length === 0) return "MISSING"
  if (duplicateSpecConflict(rows) || duplicateSpecConflict(english)) return "CONFLICTING"
  if (hasUnconfirmedCatalogFacts(product) || localeMarkerConflict(product)) {
    return localeMarkerConflict(product) ? "CONFLICTING" : "UNVERIFIED"
  }
  if (productType(product) === "device") return "VERIFIED"
  if (productType(product) === "supplement" && hasCoverage(packOf(product), "composition_spec")) return "VERIFIED"
  return "UNVERIFIED"
}

function leafletState(product: Product): EvidenceState {
  const pack = packOf(product)
  const approvedLeaflet = (pack.references ?? []).some(
    (reference) =>
      reference.kind === "official_product_leaflet" &&
      reference.reviewStatus === "approved" &&
      reference.locator.trim().length > 0
  )
  if (approvedLeaflet) return "VERIFIED"
  if (present(product.downloadUrl)) return "UNVERIFIED"
  return "MISSING"
}

function evidenceRollup(product: Product, composition: EvidenceState): EvidenceState {
  const pack = packOf(product)
  const approved = (pack.references ?? []).some(
    (reference) => reference.reviewStatus === "approved" && reference.locator.trim().length > 0 && reference.id.trim().length > 0
  )
  if (approved) return "VERIFIED"
  if (productType(product) === "device" && composition === "VERIFIED") return "NOT_APPLICABLE"
  if (present(product.downloadUrl)) return "UNVERIFIED"
  return "MISSING"
}

function claimsRollup(product: Product): EvidenceState {
  if (productType(product) !== "supplement") {
    const records = packOf(product).claims ?? []
    if (records.length === 0) return "NOT_APPLICABLE"
    return records.every((claim) => claim.reviewStatus === "approved" && approvedClaimMatches(product, claim.statement.trim()))
      ? "VERIFIED"
      : "UNVERIFIED"
  }
  if (claimReviewConflicts(product, storedClaimStatements(product))) return "CONFLICTING"
  if (supplementClaimsCleared(product)) return "VERIFIED"
  return storedClaimStatements(product).length > 0 ? "UNVERIFIED" : "MISSING"
}

function worse(states: EvidenceState[]): EvidenceState {
  if (states.includes("CONFLICTING")) return "CONFLICTING"
  if (states.includes("UNVERIFIED")) return "UNVERIFIED"
  if (states.includes("MISSING")) return "MISSING"
  if (states.every((state) => state === "NOT_APPLICABLE")) return "NOT_APPLICABLE"
  if (states.every((state) => state === "VERIFIED" || state === "NOT_APPLICABLE")) return "VERIFIED"
  return "UNVERIFIED"
}

export function fieldAssessments(product: Product): Record<EvidenceField, FieldAssessment> {
  const pack = packOf(product)
  const type = productType(product)
  const form = formState(product)
  const composition = compositionState(product)
  const prose = (name: EvidenceField, lines: string[]): FieldAssessment =>
    field(
      product,
      name,
      proseState(product, lines),
      proseState(product, lines) === "VERIFIED" ? "approved claim record matches the stored text" : "stored text is not an approved claim",
      type === "supplement"
    )

  return {
    slug: field(
      product,
      "slug",
      comparedIdentity(product.slug, pack.identity?.slug, !validSlug(product.slug)),
      validSlug(product.slug) ? "stored slug" : "slug missing or not a single path segment",
      false
    ),
    name: field(product, "name", comparedIdentity(product.name, pack.identity?.name), "stored Latin name", false),
    nameArabic: field(
      product,
      "nameArabic",
      comparedIdentity(product.nameArabic, pack.identity?.nameArabic),
      "stored Arabic name",
      false
    ),
    sku: field(
      product,
      "sku",
      comparedIdentity(product.sku, pack.identity?.sku),
      present(product.sku) ? "stored SKU" : "SKU is optional on the catalog type and is absent",
      false
    ),
    category: field(
      product,
      "category",
      present(product.categorySlug) ? "VERIFIED" : "MISSING",
      "stored category slug",
      false
    ),
    form: field(product, "form", form, "pack/form uses the product-type evidence rule", type === "supplement"),
    price: field(
      product,
      "price",
      typeof product.price === "number" && Number.isFinite(product.price) ? "VERIFIED" : "MISSING",
      "storefront price, not a manufacturer price list",
      false
    ),
    priceWithTax: field(product, "priceWithTax", "NOT_APPLICABLE", "no priceWithTax field on the catalog type", false),
    availability: field(
      product,
      "availability",
      product.status === "active" || product.status === "paused" || product.status === "launching_soon" ? "VERIFIED" : "MISSING",
      "catalog status, not a warehouse quantity",
      false
    ),
    stock: field(product, "stock", "NOT_APPLICABLE", "no stock quantity on the catalog type", false),
    brand: field(product, "brand", authorizationState(product, "brand"), "no brand is inferred from the product name", true),
    manufacturer: field(
      product,
      "manufacturer",
      authorizationState(product, "manufacturer"),
      "no manufacturer is inferred from the product name or a category sentence",
      true
    ),
    composition: field(product, "composition", composition, "spec table or composition rows", type === "supplement"),
    leaflet: field(product, "leaflet", leafletState(product), "a download path is not approval", type === "supplement"),
    image: field(product, "image", present(product.image) ? "VERIFIED" : "MISSING", "stored asset path, not a rights review", false),
    shortDescription: prose("shortDescription", [product.shortDescription, product.translations?.en?.shortDescription ?? ""].filter(Boolean)),
    keyBenefits: prose("keyBenefits", [...product.keyBenefits, ...(product.translations?.en?.keyBenefits ?? [])]),
    usage: prose("usage", [product.usage ?? "", product.translations?.en?.usage ?? ""]),
    scientificInfo: prose("scientificInfo", [product.scientificInfo ?? "", product.translations?.en?.scientificInfo ?? ""]),
    faq: prose("faq", [...(product.faq ?? []), ...(product.translations?.en?.faq ?? [])].map((item) => item.answer)),
    testimonials: prose(
      "testimonials",
      [...(product.testimonials ?? []), ...(product.translations?.en?.testimonials ?? [])].map((item) => item.quote)
    ),
    clinicalReferences: prose(
      "clinicalReferences",
      [...(product.clinicalReferences ?? []), ...(product.translations?.en?.clinicalReferences ?? [])].map((item) => item.title)
    ),
  }
}

export function productIndexDecision(product: Product): SearchIndexDecision {
  const fields = fieldAssessments(product)
  const reasons: IndexBlockReason[] = []
  const type = productType(product)

  if (product.status !== "active") reasons.push("status_not_active")
  if (fields.slug.state === "MISSING") reasons.push("missing_slug")
  if (fields.slug.state === "CONFLICTING") reasons.push("conflicting_identity")
  if (fields.name.state === "MISSING") reasons.push("missing_latin_name")
  if (fields.name.state === "CONFLICTING") reasons.push("conflicting_identity")
  if (fields.nameArabic.state === "MISSING") reasons.push("missing_arabic_name")
  if (fields.nameArabic.state === "CONFLICTING") reasons.push("conflicting_identity")
  if (fields.sku.state === "CONFLICTING") reasons.push("conflicting_identity")
  if (fields.category.state !== "VERIFIED") reasons.push("missing_category")
  if (hasUnconfirmedCatalogFacts(product)) reasons.push("unconfirmed_catalog_facts")
  if (fields.composition.state === "CONFLICTING" || fields.form.state === "CONFLICTING") {
    reasons.push("conflicting_catalog_facts")
  }

  if (type === "supplement") {
    if (!supplementClaimsCleared(product)) reasons.push("supplement_claim_clearance_absent")
    if (fields.form.state !== "VERIFIED" || fields.composition.state !== "VERIFIED") {
      reasons.push("unverified_required_facts")
    }
  } else if (type === "device") {
    if (!product.composition?.length) reasons.push("missing_device_specs")
    if (fields.composition.state !== "VERIFIED" || fields.form.state !== "VERIFIED") {
      reasons.push("unverified_required_facts")
    }
  } else if (present(product.categorySlug)) {
    reasons.push("category_not_cleared_for_index")
  }

  const listed = unique(reasons)
  return { eligible: listed.length === 0, reasons: listed }
}

export function isProductSearchEligible(product: Product): boolean {
  return productIndexDecision(product).eligible
}

export function isSearchIndexEligible(product: Product): boolean {
  return isProductSearchEligible(product)
}

function claimFieldAllows(product: Product, name: EvidenceField, context: ExposureContext): boolean {
  const lines = claimLines(product, name)
  if (lines.length === 0) return false
  return lines.every((line) => approvedClaimMatches(product, line, context))
}

function claimLines(product: Product, name: EvidenceField): string[] {
  if (name === "shortDescription") return [product.shortDescription, product.translations?.en?.shortDescription ?? ""].map((line) => line.trim()).filter(Boolean)
  if (name === "keyBenefits") return [...product.keyBenefits, ...(product.translations?.en?.keyBenefits ?? [])].map((line) => line.trim()).filter(Boolean)
  if (name === "usage") return [product.usage ?? "", product.translations?.en?.usage ?? ""].map((line) => line.trim()).filter(Boolean)
  if (name === "scientificInfo") return [product.scientificInfo ?? "", product.translations?.en?.scientificInfo ?? ""].map((line) => line.trim()).filter(Boolean)
  if (name === "faq") return [...(product.faq ?? []), ...(product.translations?.en?.faq ?? [])].map((item) => item.answer.trim()).filter(Boolean)
  if (name === "testimonials") {
    return [...(product.testimonials ?? []), ...(product.translations?.en?.testimonials ?? [])].map((item) => item.quote.trim()).filter(Boolean)
  }
  if (name === "clinicalReferences") {
    return [...(product.clinicalReferences ?? []), ...(product.translations?.en?.clinicalReferences ?? [])]
      .map((item) => item.title.trim())
      .filter(Boolean)
  }
  return []
}

export function canExposeField(product: Product, name: EvidenceField, context: ExposureContext): boolean {
  const row = fieldAssessments(product)[name]
  if (row.state !== "VERIFIED") return false
  if (row.factClass === "health_claim" && !claimFieldAllows(product, name, context)) return false
  if (context === "SITEMAP" || context === "EDITORIAL_CONTENT" || context === "MEDICAL_CONTENT") {
    if (!isProductSearchEligible(product)) return false
  }
  if (context === "MEDICAL_CONTENT" && row.factClass !== "health_claim") return false
  return true
}

export function canExposeStatement(product: Product, statement: string | undefined, context: ExposureContext): boolean {
  const value = statement?.trim()
  if (!value) return false
  return approvedClaimMatches(product, value, context)
}

export function canExposeClaim(product: Product, claimId: string, context: ExposureContext): boolean {
  const claim = packOf(product).claims?.find((item) => item.id === claimId)
  if (!claim || claim.reviewStatus !== "approved" || !claim.statement.trim()) return false
  if (!claim.allowedContexts.includes(context)) return false
  return idsResolve(packOf(product), claim.evidenceIds, "health_claim")
}

export function verifiedBrandName(product: Product): string | null {
  if (!canExposeField(product, "brand", "PRODUCT_SCHEMA")) return null
  return packOf(product).brand?.name.trim() || null
}

export function verifiedManufacturerName(product: Product): string | null {
  if (!canExposeField(product, "manufacturer", "PRODUCT_SCHEMA")) return null
  return packOf(product).manufacturer?.name.trim() || null
}

export function searchDescription(display: Product, locale: Locale, source: Product = display): string {
  const heading = productHeading(display, locale).trim()
  const parts = heading ? [heading] : []
  const prose = canExposeField(source, "shortDescription", "PRODUCT_SCHEMA") ? display.shortDescription?.trim() : ""
  if (prose && !parts.includes(prose)) parts.push(prose)
  const form = canExposeField(source, "form", "PRODUCT_SCHEMA") ? display.availableForm?.trim() : ""
  if (form && !parts.includes(form)) parts.push(form)
  return parts.join(" — ")
}

export function publicFieldText(
  product: Product,
  name: "shortDescription" | "form",
  context: ExposureContext
): string | null {
  if (!canExposeField(product, name, context)) return null
  const value = name === "form" ? product.availableForm : product.shortDescription
  return value?.trim() || null
}

export function canUseSkuInContent(product: Product, layer: "factual_product" | "editorial" | "medical_claim"): boolean {
  if (!isProductSearchEligible(product)) return false
  if (layer === "medical_claim") return claimsRollup(product) === "VERIFIED"
  return true
}

export function catalogHasPublicEvidence(products: readonly Product[]): boolean {
  return products.some(
    (product) =>
      canExposeField(product, "scientificInfo", "EDITORIAL_CONTENT") ||
      canExposeField(product, "clinicalReferences", "MEDICAL_CONTENT") ||
      canExposeField(product, "leaflet", "EDITORIAL_CONTENT")
  )
}

function rollupIdentity(fields: Record<EvidenceField, FieldAssessment>): EvidenceState {
  const sku = fields.sku.state === "MISSING" ? "VERIFIED" : fields.sku.state
  return worse([fields.slug.state, fields.name.state, fields.nameArabic.state, fields.category.state, sku])
}

function rollupCommercial(fields: Record<EvidenceField, FieldAssessment>): EvidenceState {
  if (fields.price.state === "VERIFIED" && fields.availability.state === "VERIFIED") return "VERIFIED"
  if (fields.price.state === "MISSING") return "MISSING"
  return fields.availability.state
}

export function formatSearchBlock(assessment: Pick<SkuAssessment, "eligible" | "reasons" | "fields" | "claims" | "evidence">): string {
  if (assessment.eligible) return "none"
  const parts: string[] = []
  if (assessment.reasons.includes("status_not_active")) parts.push("status not active")
  for (const key of ["slug", "name", "nameArabic", "category"] as const) {
    if (assessment.fields[key].state !== "VERIFIED") parts.push(`${key} ${assessment.fields[key].state}`)
  }
  if (assessment.fields.form.state !== "VERIFIED") parts.push(`pack ${assessment.fields.form.state}`)
  if (assessment.fields.composition.state !== "VERIFIED") parts.push(`composition ${assessment.fields.composition.state}`)
  if (assessment.fields.leaflet.state === "MISSING" || assessment.fields.leaflet.state === "UNVERIFIED") {
    parts.push(`leaflet ${assessment.fields.leaflet.state}`)
  }
  if (assessment.evidence === "MISSING" || assessment.evidence === "UNVERIFIED") parts.push(`evidence ${assessment.evidence}`)
  if (assessment.claims === "UNVERIFIED" || assessment.claims === "MISSING" || assessment.claims === "CONFLICTING") {
    parts.push(`claim clearance ${assessment.claims === "CONFLICTING" ? "CONFLICTING" : "MISSING"}`)
  }
  if (assessment.reasons.includes("missing_device_specs")) parts.push("device specs MISSING")
  if (assessment.reasons.includes("category_not_cleared_for_index")) parts.push("category not cleared")
  if (assessment.reasons.includes("unconfirmed_catalog_facts")) parts.push("unconfirmed catalog text")
  if (assessment.reasons.includes("conflicting_identity") || assessment.reasons.includes("conflicting_catalog_facts")) {
    parts.push("conflicting facts")
  }
  return `BLOCKED — ${parts.join(" + ")} (${assessment.reasons.join(", ")})`
}

export function skuAssessment(product: Product): SkuAssessment {
  const fields = fieldAssessments(product)
  const decision = productIndexDecision(product)
  const composition = fields.composition.state
  const assessment: SkuAssessment = {
    slug: product.slug,
    sku: product.sku?.trim() || null,
    productType: productType(product),
    active: product.status === "active",
    identity: rollupIdentity(fields),
    commercial: rollupCommercial(fields),
    composition,
    brandManufacturer: worse([fields.brand.state, fields.manufacturer.state]),
    evidence: evidenceRollup(product, composition),
    claims: claimsRollup(product),
    eligible: decision.eligible,
    reasons: decision.reasons,
    blockingReason: "",
    fields,
  }
  assessment.blockingReason = formatSearchBlock(assessment)
  return assessment
}
