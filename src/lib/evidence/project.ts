import type { EvidenceFactClass, EvidenceSourceKind, SkuEvidencePack } from "@/lib/products/evidence-pack"
import type { Product, SpecItem } from "@/lib/products/types"
import { storedClaimStatements } from "@/lib/seo/sku-evidence"

import { isAuthorizationName, isPrivateEvidenceLocator } from "./locator"
import { EVIDENCE_SOURCE_TYPES, type EvidenceDossier, type EvidenceSource, type EvidenceSourceType, type FactApproval, type FactField } from "./types"

/**
 * Projects APPROVED, still-matching workflow records into the evidence pack
 * the existing eligibility policy already reads. Draft, submitted, rejected,
 * and stale approvals are omitted. This function does not decide eligibility.
 */

const SOURCE_KIND: Record<EvidenceSourceType, EvidenceSourceKind> = {
  OFFICIAL_LEAFLET: "official_product_leaflet",
  MANUFACTURER_DOCUMENT: "manufacturer_documentation",
  AUTHORIZATION: "authorized_product_documentation",
  REGULATORY_DOCUMENT: "regulatory_documentation",
  INTERNAL_APPROVED_DOCUMENT: "internal_approved_source",
  OTHER_APPROVED_SOURCE: "other_approved_source",
}

export function compositionSnapshot(rows: readonly SpecItem[] | undefined): string {
  return JSON.stringify((rows ?? []).map((row) => ({ label: row.label.trim(), value: row.value.trim() })))
}

function approvedSource(dossier: EvidenceDossier, id: string): EvidenceSource | undefined {
  const source = dossier.sources.find((item) => item.id === id)
  if (!source || source.state !== "APPROVED") return undefined
  if (!source.id.trim() || !source.title.trim() || !isPrivateEvidenceLocator(source.locator)) return undefined
  if (!EVIDENCE_SOURCE_TYPES.includes(source.sourceType)) return undefined
  if (source.documentRef && !isPrivateEvidenceLocator(source.documentRef)) return undefined
  return source
}

function formMatches(product: Product, fact: FactApproval): boolean {
  if (product.availableForm?.trim() !== fact.reviewedValue) return false
  const english = product.translations?.en?.availableForm?.trim()
  if (!english) return true
  return english === (fact.reviewedValueEn ?? fact.reviewedValue)
}

function compositionMatches(product: Product, fact: FactApproval): boolean {
  if (compositionSnapshot(product.composition) !== fact.reviewedValue) return false
  const english = product.translations?.en?.composition
  if (!english?.length) return true
  return compositionSnapshot(english) === (fact.reviewedValueEn ?? fact.reviewedValue)
}

function textMatches(current: string | undefined, reviewed: string): boolean {
  return current?.trim() === reviewed
}

export function factSnapshotCurrent(product: Product, fact: FactApproval): boolean {
  if (fact.state !== "APPROVED") return false
  switch (fact.field) {
    case "form":
      return formMatches(product, fact)
    case "composition":
      return compositionMatches(product, fact)
    case "name":
      return textMatches(product.name, fact.reviewedValue)
    case "nameArabic":
      return textMatches(product.nameArabic, fact.reviewedValue)
    case "sku":
      return textMatches(product.sku, fact.reviewedValue)
    case "category":
      return textMatches(product.categorySlug, fact.reviewedValue)
    case "price":
      return typeof product.price === "number" && String(product.price) === fact.reviewedValue
    case "brand":
    case "manufacturer":
      return isAuthorizationName(fact.reviewedValue)
    default:
      return false
  }
}

function coverageFor(field: FactField): EvidenceFactClass | null {
  if (field === "form") return "identity"
  if (field === "composition") return "composition_spec"
  if (field === "brand" || field === "manufacturer") return "brand_manufacturer"
  return null
}

export function projectApprovedPack(product: Product, records: readonly EvidenceDossier[]): SkuEvidencePack | null {
  const dossier = records.find((item) => item.productSlug === product.slug)
  if (!dossier) return null

  const covers = new Map<string, Set<EvidenceFactClass>>()
  const remember = (sourceId: string, factClass: EvidenceFactClass) => {
    const current = covers.get(sourceId) ?? new Set<EvidenceFactClass>()
    current.add(factClass)
    covers.set(sourceId, current)
  }

  for (const fact of dossier.facts) {
    if (!factSnapshotCurrent(product, fact)) continue
    if (!approvedSource(dossier, fact.sourceId)) continue
    const factClass = coverageFor(fact.field)
    if (factClass) remember(fact.sourceId, factClass)
  }

  const statements = new Set(storedClaimStatements(product))
  const claims = dossier.claims.filter(
    (claim) =>
      claim.state === "APPROVED" &&
      claim.statement.trim().length > 0 &&
      claim.allowedContexts.length > 0 &&
      statements.has(claim.statement.trim()) &&
      approvedSource(dossier, claim.sourceId) !== undefined
  )
  for (const claim of claims) remember(claim.sourceId, "health_claim")

  const references = [...covers.entries()].flatMap(([sourceId, factClasses]) => {
    const source = approvedSource(dossier, sourceId)
    if (!source || factClasses.size === 0) return []
    return [
      {
        id: source.id,
        kind: SOURCE_KIND[source.sourceType],
        locator: source.locator.trim(),
        reviewStatus: "approved" as const,
        covers: [...factClasses],
      },
    ]
  })

  const brand = dossier.facts.find((fact) => fact.field === "brand" && factSnapshotCurrent(product, fact) && approvedSource(dossier, fact.sourceId))
  const manufacturer = dossier.facts.find(
    (fact) => fact.field === "manufacturer" && factSnapshotCurrent(product, fact) && approvedSource(dossier, fact.sourceId)
  )

  const claimIds = [...new Set(claims.map((claim) => claim.sourceId))]
  const everyStatementCovered =
    statements.size > 0 && [...statements].every((statement) => claims.some((claim) => claim.statement.trim() === statement))

  const pack: SkuEvidencePack = {
    ...(references.length > 0 ? { references } : {}),
    ...(claims.length > 0
      ? {
          claims: claims.map((claim) => ({
            id: claim.id,
            statement: claim.statement.trim(),
            evidenceIds: [claim.sourceId],
            reviewStatus: "approved" as const,
            allowedContexts: claim.allowedContexts,
          })),
        }
      : {}),
    ...(everyStatementCovered && claimIds.length > 0
      ? { claimReview: { reviewStatus: "approved" as const, publicClaims: "listed" as const, evidenceIds: claimIds } }
      : {}),
    ...(brand ? { brand: { name: brand.reviewedValue.trim(), evidenceIds: [brand.sourceId], reviewStatus: "approved" as const } } : {}),
    ...(manufacturer
      ? { manufacturer: { name: manufacturer.reviewedValue.trim(), evidenceIds: [manufacturer.sourceId], reviewStatus: "approved" as const } }
      : {}),
  }

  if (!pack.references && !pack.claims && !pack.brand && !pack.manufacturer && !pack.claimReview) return null
  return pack
}

/**
 * Replaces any evidence pack already on the product. A catalog field or a
 * client payload cannot approve itself. Pass workflow dossiers only.
 */
export function applyApprovedEvidence(product: Product, records: readonly EvidenceDossier[]): Product {
  const pack = projectApprovedPack(product, records)
  if (!pack) {
    if (!product.evidencePack) return product
    const rest = { ...product }
    delete rest.evidencePack
    return rest
  }
  return { ...product, evidencePack: pack }
}
