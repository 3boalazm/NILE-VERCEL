import type { Product } from "@/lib/products/types"

import type { EvidenceDossier } from "./types"

/**
 * Business decisions are not evidence approvals and not search eligibility.
 * Opening a conflict does not choose a catalog value. Finalizing one requires
 * a server grant and a decision-owner reference. This module does not invent
 * that owner, and a request body cannot carry the grant.
 */

const DECISION_GRANT = Symbol("server-decision-grant")

export const DECISION_STATUSES = ["OPEN", "IN_REVIEW", "DECIDED", "REJECTED", "DEFERRED"] as const
export type DecisionStatus = (typeof DECISION_STATUSES)[number]

export const DECISION_KINDS = [
  "KEEP_CATALOG_VALUE",
  "ADOPT_EVIDENCE_VALUE",
  "REPLACE_WITH_OTHER_VALUE",
  "MARK_UNVERIFIED",
  "REMOVE_FROM_PUBLIC_OUTPUT",
  "RETIRE_PRODUCT",
] as const
export type DecisionKind = (typeof DECISION_KINDS)[number]

export const DECISION_FIELDS = ["form", "composition", "usage", "duration", "faqCalories", "vitaminD"] as const
export type DecisionField = (typeof DECISION_FIELDS)[number]

export const CONFLICT_TYPES = [
  "INTENTIONAL_HOLD",
  "COMPOSITION_MISMATCH",
  "COMPOSITION_REPRESENTATION",
  "USAGE_VOLUME",
  "DURATION",
  "CALORIE",
  "MISSING_DOSE",
  "VALUE_CONFLICT",
] as const
export type ConflictType = (typeof CONFLICT_TYPES)[number]

export const DECISION_CAPABILITIES = ["view_queue", "create_decision", "edit_decision", "finalize_decision"] as const
export type DecisionCapability = (typeof DECISION_CAPABILITIES)[number]

export type DecisionAuditEvent = {
  action: "create" | "start_review" | "decide" | "reject" | "defer"
  entityId: string
  previousState: DecisionStatus | null
  newState: DecisionStatus
  actorId: string
  at: string
  actorIdentity?: string
  sku?: string
  field?: DecisionField
  previousValue?: string
  newValue?: string
  decisionType?: DecisionKind
  evidenceSnapshot?: string
  sourceLocator?: string
  rationale?: string
  /** A business decision does not approve a dossier or a claim. */
  approvalState?: "not_approved"
  searchEligibility?: "eligible" | "not_eligible"
}

export type EvidenceDecision = {
  id: string
  sku: string
  productSlug: string
  field: DecisionField
  catalogValue: string
  evidenceValue: string
  evidenceSnapshot: string
  sourceId: string
  sourceLocator: string
  factId?: string
  /** A phrase that must still be present on the source note when no fact stores the quotation. */
  evidenceAnchor?: string
  conflictType: ConflictType
  /** SKU, market, or edition is not established. Adoption stays blocked. */
  variantAmbiguous: boolean
  /** The evidence states a replacement value. A missing dose is not adoptable. */
  adoptable: boolean
  status: DecisionStatus
  decision?: DecisionKind
  decisionOwnerReference?: string
  rationale?: string
  decidedAt?: string
  effectiveDate?: string
  replacementValue?: string
  audit: DecisionAuditEvent[]
}

export type DecisionGrant = {
  readonly actorId: string
  readonly identity: string
  readonly capabilities: readonly DecisionCapability[]
  readonly [DECISION_GRANT]: true
}

export type DecisionActor = { kind: "internal"; grant: DecisionGrant } | { kind: "anonymous" } | { kind: "storefront"; id?: string }

export type DecisionResult<T> = { ok: true; value: T } | { ok: false; reason: DecisionFailure }

export type DecisionFailure =
  | "denied"
  | "invalid"
  | "not_found"
  | "missing_owner"
  | "stale"
  | "variant_ambiguous"
  | "evidence_incomplete"
  | "client_payload_rejected"

const NOT_AN_OWNER = new Set(["system", "admin", "arena", "developer", "repository-acquisition"])

function isDecisionCapability(value: unknown): value is DecisionCapability {
  return typeof value === "string" && DECISION_CAPABILITIES.includes(value as DecisionCapability)
}

/**
 * A bare id is not authority. Grants are issued only for a stored user
 * whose capability list was loaded by server code, not from a request body.
 */
export function createScopedDecisionGrant(input: {
  actorId: string
  identity: string
  capabilities: readonly string[]
}): DecisionGrant | null {
  const actorId = input.actorId.trim()
  const identity = input.identity.trim()
  if (!actorId || !identity || NOT_AN_OWNER.has(actorId.toLowerCase()) || NOT_AN_OWNER.has(identity.toLowerCase())) return null
  const capabilities = input.capabilities.filter(isDecisionCapability)
  if (capabilities.length === 0) return null
  return { actorId, identity, capabilities, [DECISION_GRANT]: true }
}

/** A string is never a grant. Kept so a caller cannot mint authority from an id. */
export function createDecisionGrant(): null {
  return null
}

export function isDecisionGrant(value: unknown): value is DecisionGrant {
  if (!value || typeof value !== "object" || !(DECISION_GRANT in value)) return false
  const record = value as Record<PropertyKey, unknown>
  return (
    record[DECISION_GRANT] === true &&
    typeof record.actorId === "string" &&
    record.actorId.trim().length > 0 &&
    typeof record.identity === "string" &&
    record.identity.trim().length > 0 &&
    Array.isArray(record.capabilities) &&
    record.capabilities.length > 0 &&
    record.capabilities.every(isDecisionCapability)
  )
}

function hasCapability(actor: { kind: string; grant?: unknown }, capability: DecisionCapability): boolean {
  return actor.kind === "internal" && isDecisionGrant(actor.grant) && actor.grant.capabilities.includes(capability)
}

export function canViewDecisionQueue(actor: { kind: string; grant?: unknown }): boolean {
  return hasCapability(actor, "view_queue")
}

export function canCreateDecision(actor: { kind: string; grant?: unknown }): boolean {
  return hasCapability(actor, "create_decision")
}

export function canEditDecision(actor: { kind: string; grant?: unknown }): boolean {
  return hasCapability(actor, "edit_decision")
}

export function canFinalizeDecision(actor: { kind: string; grant?: unknown }): boolean {
  return hasCapability(actor, "finalize_decision")
}

/** A request body is never a decision, an owner, or an approval. */
export function decisionFromClientPayload(body: unknown): { ok: false; reason: "client_payload_rejected" } {
  void body
  return { ok: false, reason: "client_payload_rejected" }
}

export function isDecisionOwnerReference(reference: string | undefined): boolean {
  const value = reference?.trim() ?? ""
  if (!value || value.length > 200) return false
  return !NOT_AN_OWNER.has(value.toLowerCase())
}

type OpenInput = Omit<EvidenceDecision, "status" | "audit" | "decision" | "decisionOwnerReference" | "rationale" | "decidedAt">

export function openDecision(input: OpenInput, at: string): DecisionResult<EvidenceDecision> {
  if (!input.id.trim() || !input.sku.trim() || !input.productSlug.trim()) return { ok: false, reason: "invalid" }
  if (!DECISION_FIELDS.includes(input.field)) return { ok: false, reason: "invalid" }
  if (!input.catalogValue.trim() || !input.evidenceValue.trim() || !input.evidenceSnapshot.trim()) return { ok: false, reason: "invalid" }
  if (!input.sourceId.trim() || !input.sourceLocator.trim()) return { ok: false, reason: "invalid" }
  if (!CONFLICT_TYPES.includes(input.conflictType)) return { ok: false, reason: "invalid" }
  if (!input.adoptable && input.evidenceSnapshot === input.catalogValue) return { ok: false, reason: "invalid" }
  return {
    ok: true,
    value: {
      ...input,
      status: "OPEN",
      audit: [
        {
          action: "create",
          entityId: input.id,
          previousState: null,
          newState: "OPEN",
          actorId: "repository-acquisition",
          at,
        },
      ],
    },
  }
}

function audit(decision: EvidenceDecision, event: Omit<DecisionAuditEvent, "actorId" | "actorIdentity">, actor: DecisionActor): EvidenceDecision {
  if (actor.kind !== "internal") return decision
  return {
    ...decision,
    audit: [...decision.audit, { ...event, actorId: actor.grant.actorId, actorIdentity: actor.grant.identity }],
  }
}

function ownerMatchesActor(reference: string, actor: DecisionActor): boolean {
  return actor.kind === "internal" && reference.trim() === actor.grant.actorId
}

export function startDecisionReview(decision: EvidenceDecision, actor: DecisionActor, at: string): DecisionResult<EvidenceDecision> {
  if (!canEditDecision(actor)) return { ok: false, reason: "denied" }
  if (decision.status !== "OPEN") return { ok: false, reason: "invalid" }
  return {
    ok: true,
    value: audit(
      { ...decision, status: "IN_REVIEW" },
      { action: "start_review", entityId: decision.id, previousState: "OPEN", newState: "IN_REVIEW", at, sku: decision.sku, field: decision.field },
      actor
    ),
  }
}

export type FinalizeInput = {
  kind: DecisionKind
  decisionOwnerReference: string
  rationale: string
  effectiveDate?: string
  replacementValue?: string
}

export function finalizeDecision(
  decision: EvidenceDecision,
  input: FinalizeInput,
  actor: DecisionActor,
  at: string
): DecisionResult<EvidenceDecision> {
  if (!canFinalizeDecision(actor)) return { ok: false, reason: "denied" }
  if (decision.status !== "OPEN" && decision.status !== "IN_REVIEW") return { ok: false, reason: "invalid" }
  if (!isDecisionOwnerReference(input.decisionOwnerReference)) return { ok: false, reason: "missing_owner" }
  if (!ownerMatchesActor(input.decisionOwnerReference, actor)) return { ok: false, reason: "denied" }
  if (!input.rationale.trim()) return { ok: false, reason: "invalid" }
  if (!DECISION_KINDS.includes(input.kind)) return { ok: false, reason: "invalid" }
  if (mutatesCatalog(input.kind) && decision.variantAmbiguous) return { ok: false, reason: "variant_ambiguous" }
  if (input.kind === "ADOPT_EVIDENCE_VALUE" && !decision.adoptable) return { ok: false, reason: "evidence_incomplete" }
  if (input.kind === "REPLACE_WITH_OTHER_VALUE" && !input.replacementValue?.trim()) return { ok: false, reason: "invalid" }
  const status: DecisionStatus = "DECIDED"
  const action: DecisionAuditEvent["action"] = "decide"
  return {
    ok: true,
    value: audit(
      {
        ...decision,
        status,
        decision: input.kind,
        decisionOwnerReference: input.decisionOwnerReference.trim(),
        rationale: input.rationale.trim(),
        decidedAt: at,
        effectiveDate: input.effectiveDate,
        replacementValue: input.replacementValue?.trim(),
      },
      {
        action,
        entityId: decision.id,
        previousState: decision.status,
        newState: status,
        at,
        sku: decision.sku,
        field: decision.field,
        previousValue: decision.catalogValue,
        newValue: decidedValue(decision, input),
        decisionType: input.kind,
        evidenceSnapshot: decision.evidenceSnapshot,
        sourceLocator: decision.sourceLocator,
        rationale: input.rationale.trim(),
        approvalState: "not_approved",
      },
      actor
    ),
  }
}

function decidedValue(decision: EvidenceDecision, input: FinalizeInput): string {
  if (input.kind === "ADOPT_EVIDENCE_VALUE") return decision.evidenceSnapshot
  if (input.kind === "REPLACE_WITH_OTHER_VALUE") return input.replacementValue?.trim() ?? ""
  if (input.kind === "REMOVE_FROM_PUBLIC_OUTPUT") return ""
  if (input.kind === "RETIRE_PRODUCT") return "paused"
  return decision.catalogValue
}

export function rejectDecision(decision: EvidenceDecision, input: FinalizeInput, actor: DecisionActor, at: string): DecisionResult<EvidenceDecision> {
  if (!canFinalizeDecision(actor)) return { ok: false, reason: "denied" }
  if (decision.status !== "OPEN" && decision.status !== "IN_REVIEW") return { ok: false, reason: "invalid" }
  if (!isDecisionOwnerReference(input.decisionOwnerReference)) return { ok: false, reason: "missing_owner" }
  if (!ownerMatchesActor(input.decisionOwnerReference, actor)) return { ok: false, reason: "denied" }
  return {
    ok: true,
    value: audit(
      {
        ...decision,
        status: "REJECTED",
        decisionOwnerReference: input.decisionOwnerReference.trim(),
        rationale: input.rationale.trim(),
        decidedAt: at,
      },
      { action: "reject", entityId: decision.id, previousState: decision.status, newState: "REJECTED", at },
      actor
    ),
  }
}

export function deferDecision(decision: EvidenceDecision, input: FinalizeInput, actor: DecisionActor, at: string): DecisionResult<EvidenceDecision> {
  if (!canFinalizeDecision(actor)) return { ok: false, reason: "denied" }
  if (decision.status !== "OPEN" && decision.status !== "IN_REVIEW") return { ok: false, reason: "invalid" }
  if (!isDecisionOwnerReference(input.decisionOwnerReference)) return { ok: false, reason: "missing_owner" }
  return {
    ok: true,
    value: audit(
      {
        ...decision,
        status: "DEFERRED",
        decisionOwnerReference: input.decisionOwnerReference.trim(),
        rationale: input.rationale.trim(),
        decidedAt: at,
      },
      { action: "defer", entityId: decision.id, previousState: decision.status, newState: "DEFERRED", at },
      actor
    ),
  }
}

export function catalogPhraseCurrent(product: Product, decision: EvidenceDecision): boolean {
  if (!decision.catalogValue.trim()) return false
  const stored = JSON.stringify({
    availableForm: product.availableForm,
    usage: product.usage,
    composition: product.composition,
    faq: product.faq,
    en: product.translations?.en,
  })
  return stored.includes(decision.catalogValue)
}

export function evidenceSnapshotCurrent(decision: EvidenceDecision, dossiers: readonly EvidenceDossier[]): boolean {
  const dossier = dossiers.find((item) => item.productSlug === decision.productSlug)
  if (!dossier) return false
  const source = dossier.sources.find((item) => item.id === decision.sourceId && item.locator === decision.sourceLocator)
  if (!source) return false
  if (decision.factId) {
    const fact = dossier.facts.find((item) => item.id === decision.factId && item.sourceId === decision.sourceId)
    return fact?.reviewedValue === decision.evidenceSnapshot
  }
  if (!decision.evidenceAnchor) return decision.evidenceSnapshot === decision.evidenceValue
  return Boolean(source.notes?.includes(decision.evidenceAnchor)) && decision.evidenceSnapshot === decision.evidenceValue
}

function mutatesCatalog(kind: DecisionKind): boolean {
  return kind === "ADOPT_EVIDENCE_VALUE" || kind === "REPLACE_WITH_OTHER_VALUE" || kind === "REMOVE_FROM_PUBLIC_OUTPUT" || kind === "RETIRE_PRODUCT"
}

function replaceOnce(text: string, from: string, to: string): string | null {
  const start = text.indexOf(from)
  if (start < 0 || text.indexOf(from, start + from.length) >= 0) return null
  return text.slice(0, start) + to + text.slice(start + from.length)
}

function rewriteText(product: Product, field: DecisionField, from: string, to: string): DecisionResult<Product> {
  if (field === "composition" || field === "vitaminD") return { ok: false, reason: "evidence_incomplete" }
  let hits = 0
  const next: Product = { ...product, translations: product.translations ? { ...product.translations, en: product.translations.en ? { ...product.translations.en } : undefined } : undefined }
  const take = (value: string | undefined, write: (value: string) => void) => {
    if (!value?.includes(from)) return
    const replaced = replaceOnce(value, from, to)
    if (!replaced) return
    write(replaced)
    hits += 1
  }
  if (field === "form") {
    if (next.availableForm === from) {
      next.availableForm = to
      hits += 1
    }
    if (next.translations?.en?.availableForm === from) {
      next.translations = { ...next.translations, en: { ...next.translations.en, availableForm: to } }
      hits += 1
    }
  } else {
    take(next.usage, (value) => {
      next.usage = value
    })
    take(next.translations?.en?.usage, (value) => {
      if (next.translations?.en) next.translations = { ...next.translations, en: { ...next.translations.en, usage: value } }
    })
    const rewriteFaq = (items: Product["faq"]) =>
      items?.map((item) => {
        if (!item.answer.includes(from) && !item.question.includes(from)) return item
        const answer = item.answer.includes(from) ? replaceOnce(item.answer, from, to) : item.answer
        const question = item.question.includes(from) ? replaceOnce(item.question, from, to) : item.question
        if (!answer || !question) return item
        if (answer !== item.answer || question !== item.question) hits += 1
        return { ...item, answer, question }
      })
    if (next.faq) next.faq = rewriteFaq(next.faq)
    if (next.translations?.en?.faq) {
      next.translations = { ...next.translations, en: { ...next.translations.en, faq: rewriteFaq(next.translations.en.faq) } }
    }
  }
  if (hits === 0) return { ok: false, reason: "stale" }
  return { ok: true, value: next }
}

/**
 * Applies one already-finalized decision to a product copy.
 * Only a stored string that still equals the recorded catalog value is rewritten.
 * KEEP and MARK_UNVERIFIED do not change catalog text.
 * A decision never approves a claim and never sets brand or manufacturer.
 */
export function applyDecisionToProduct(
  product: Product,
  decision: EvidenceDecision,
  dossiers: readonly EvidenceDossier[]
): DecisionResult<Product> {
  if (decision.productSlug !== product.slug || decision.status !== "DECIDED" || !decision.decision) return { ok: false, reason: "invalid" }
  if (!evidenceSnapshotCurrent(decision, dossiers)) return { ok: false, reason: "stale" }
  if (decision.decision === "KEEP_CATALOG_VALUE" || decision.decision === "MARK_UNVERIFIED") return { ok: true, value: product }
  if (decision.variantAmbiguous && mutatesCatalog(decision.decision)) return { ok: false, reason: "variant_ambiguous" }
  if (decision.decision === "RETIRE_PRODUCT") return { ok: true, value: { ...product, status: "paused" } }
  if (decision.decision === "ADOPT_EVIDENCE_VALUE") {
    if (!decision.adoptable) return { ok: false, reason: "evidence_incomplete" }
    return rewriteText(product, decision.field, decision.catalogValue, decision.evidenceSnapshot)
  }
  if (decision.decision === "REPLACE_WITH_OTHER_VALUE") {
    if (!decision.replacementValue?.trim()) return { ok: false, reason: "invalid" }
    return rewriteText(product, decision.field, decision.catalogValue, decision.replacementValue.trim())
  }
  if (decision.decision === "REMOVE_FROM_PUBLIC_OUTPUT") return rewriteText(product, decision.field, decision.catalogValue, "")
  return { ok: false, reason: "invalid" }
}

/** Production projection. Open decisions do not change the product. */
export function projectDecidedCatalog(
  product: Product,
  decisions: readonly EvidenceDecision[],
  dossiers: readonly EvidenceDossier[]
): Product {
  const decided = decisions.filter((item) => item.productSlug === product.slug && item.status === "DECIDED")
  if (decided.length === 0) return product
  let next = product
  let changed = false
  for (const decision of decided) {
    const applied = applyDecisionToProduct(next, decision, dossiers)
    if (!applied.ok || applied.value === next) continue
    next = applied.value
    changed = true
  }
  return changed ? next : product
}
