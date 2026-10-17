import "server-only"

import type { Product } from "@/lib/products/types"

import { CATALOG_EVIDENCE_DRAFTS } from "./catalog-drafts"
import { CATALOG_DECISION_QUEUE } from "./decision-queue"
import { projectDecidedCatalog, type EvidenceDecision } from "./decisions"
import { applyApprovedEvidence } from "./project"
import type { EvidenceDossier } from "./types"

/**
 * Production evidence store.
 * Drafts from repository leaflets may be present. No record is approved.
 * Payload Media is public-read, and users have no role field, so this
 * module does not persist private files or grant review access.
 * A future private store may replace `listEvidenceRecords` without changing
 * the eligibility policy.
 */
const RECORDS: readonly EvidenceDossier[] = CATALOG_EVIDENCE_DRAFTS
const DECISIONS: readonly EvidenceDecision[] = CATALOG_DECISION_QUEUE

export function listEvidenceRecords(): readonly EvidenceDossier[] {
  return RECORDS
}

/** Open business conflicts. None are decided. An open record is not a catalog edit. */
export function listEvidenceDecisions(): readonly EvidenceDecision[] {
  return DECISIONS
}

/** Catalog row for public output. A product-field pack is not authority. */
export function publicCatalogProduct(product: Product): Product {
  const evidenced = applyApprovedEvidence(product, listEvidenceRecords())
  return projectDecidedCatalog(evidenced, listEvidenceDecisions(), listEvidenceRecords())
}
