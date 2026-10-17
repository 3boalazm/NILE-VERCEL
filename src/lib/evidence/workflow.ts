import { canApproveEvidence, canEditEvidence, canSubmitEvidence, type EvidenceActor } from "./access"
import { isPrivateEvidenceLocator } from "./locator"
import { EVIDENCE_SOURCE_TYPES, FACT_FIELDS, type AuditEvent, type ClaimReviewRecord, type EvidenceDossier, type EvidenceSource, type FactApproval, type ReviewState } from "./types"

export type WorkflowResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "denied" | "invalid_transition" | "invalid" | "not_found" }

const TRANSITIONS: Record<ReviewState, readonly ReviewState[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
}

function allowed(actor: EvidenceActor, next: ReviewState): boolean {
  if (next === "SUBMITTED") return canSubmitEvidence(actor)
  if (next === "UNDER_REVIEW") return canApproveEvidence(actor)
  if (next === "APPROVED" || next === "REJECTED") return canApproveEvidence(actor)
  return canEditEvidence(actor)
}

function audit(
  dossier: EvidenceDossier,
  event: Omit<AuditEvent, "actorId">,
  actor: EvidenceActor
): EvidenceDossier {
  if (actor.kind !== "internal") return dossier
  return {
    ...dossier,
    audit: [...dossier.audit, { ...event, actorId: actor.grant.actorId }],
  }
}

function transitionState(state: ReviewState, next: ReviewState, actor: EvidenceActor): WorkflowResult<ReviewState> {
  if (!allowed(actor, next)) return { ok: false, reason: "denied" }
  if (!TRANSITIONS[state].includes(next)) return { ok: false, reason: "invalid_transition" }
  return { ok: true, value: next }
}

export function emptyDossier(productSlug: string): EvidenceDossier {
  return { productSlug, sources: [], facts: [], claims: [], audit: [] }
}

export function addDraftSource(
  dossier: EvidenceDossier,
  source: Omit<EvidenceSource, "state">,
  actor: EvidenceActor,
  at: string
): WorkflowResult<EvidenceDossier> {
  if (!canEditEvidence(actor)) return { ok: false, reason: "denied" }
  if (!source.id.trim() || !source.title.trim() || !isPrivateEvidenceLocator(source.locator)) return { ok: false, reason: "invalid" }
  if (!EVIDENCE_SOURCE_TYPES.includes(source.sourceType)) return { ok: false, reason: "invalid" }
  if (source.documentRef && !isPrivateEvidenceLocator(source.documentRef)) return { ok: false, reason: "invalid" }
  const next = audit(
    { ...dossier, sources: [...dossier.sources, { ...source, state: "DRAFT" }] },
    { action: "create", entityId: source.id, previousState: null, newState: "DRAFT", at },
    actor
  )
  return { ok: true, value: next }
}

export function addDraftFact(
  dossier: EvidenceDossier,
  fact: Omit<FactApproval, "state" | "reviewerId" | "reviewedAt">,
  actor: EvidenceActor,
  at: string
): WorkflowResult<EvidenceDossier> {
  if (!canEditEvidence(actor)) return { ok: false, reason: "denied" }
  if (!fact.id.trim() || !fact.reviewedValue.trim() || !fact.sourceId.trim()) return { ok: false, reason: "invalid" }
  if (!FACT_FIELDS.includes(fact.field)) return { ok: false, reason: "invalid" }
  const next = audit(
    { ...dossier, facts: [...dossier.facts, { ...fact, state: "DRAFT" }] },
    { action: "create", entityId: fact.id, previousState: null, newState: "DRAFT", at },
    actor
  )
  return { ok: true, value: next }
}

export function addDraftClaim(
  dossier: EvidenceDossier,
  claim: Omit<ClaimReviewRecord, "state" | "reviewerId" | "reviewedAt">,
  actor: EvidenceActor,
  at: string
): WorkflowResult<EvidenceDossier> {
  if (!canEditEvidence(actor)) return { ok: false, reason: "denied" }
  if (!claim.id.trim() || !claim.statement.trim() || !claim.sourceId.trim()) return { ok: false, reason: "not_found" }
  const next = audit(
    { ...dossier, claims: [...dossier.claims, { ...claim, state: "DRAFT" }] },
    { action: "create", entityId: claim.id, previousState: null, newState: "DRAFT", at },
    actor
  )
  return { ok: true, value: next }
}

function patchCollection<T extends { id: string; state: ReviewState }>(
  items: readonly T[],
  id: string,
  next: ReviewState,
  reviewer: { reviewerId?: string; reviewedAt?: string }
): T[] | null {
  const index = items.findIndex((item) => item.id === id)
  if (index < 0) return null
  const current = items[index]
  if (!current) return null
  const copy = items.slice()
  copy[index] = { ...current, state: next, ...reviewer }
  return copy
}

export function transitionSource(
  dossier: EvidenceDossier,
  sourceId: string,
  next: ReviewState,
  actor: EvidenceActor,
  at: string
): WorkflowResult<EvidenceDossier> {
  const current = dossier.sources.find((item) => item.id === sourceId)
  if (!current) return { ok: false, reason: "not_found" }
  const moved = transitionState(current.state, next, actor)
  if (!moved.ok) return moved
  if (next === "APPROVED" && !isPrivateEvidenceLocator(current.locator)) return { ok: false, reason: "invalid" }
  if (next === "APPROVED" && current.documentRef && !isPrivateEvidenceLocator(current.documentRef)) {
    return { ok: false, reason: "invalid" }
  }
  const reviewer = reviewerStamp(next, actor, at)
  const sources = patchCollection(dossier.sources, sourceId, next, reviewer)
  if (!sources) return { ok: false, reason: "not_found" }
  return {
    ok: true,
    value: audit(
      { ...dossier, sources },
      { action: actionFor(next), entityId: sourceId, previousState: current.state, newState: next, at },
      actor
    ),
  }
}

export function transitionFact(
  dossier: EvidenceDossier,
  factId: string,
  next: ReviewState,
  actor: EvidenceActor,
  at: string
): WorkflowResult<EvidenceDossier> {
  const current = dossier.facts.find((item) => item.id === factId)
  if (!current) return { ok: false, reason: "not_found" }
  const moved = transitionState(current.state, next, actor)
  if (!moved.ok) return moved
  const reviewer = reviewerStamp(next, actor, at)
  const facts = patchCollection(dossier.facts, factId, next, reviewer)
  if (!facts) return { ok: false, reason: "not_found" }
  return {
    ok: true,
    value: audit(
      { ...dossier, facts },
      { action: actionFor(next), entityId: factId, previousState: current.state, newState: next, at },
      actor
    ),
  }
}

export function transitionClaim(
  dossier: EvidenceDossier,
  claimId: string,
  next: ReviewState,
  actor: EvidenceActor,
  at: string
): WorkflowResult<EvidenceDossier> {
  const current = dossier.claims.find((item) => item.id === claimId)
  if (!current) return { ok: false, reason: "not_found" }
  const moved = transitionState(current.state, next, actor)
  if (!moved.ok) return moved
  const reviewer = reviewerStamp(next, actor, at)
  const claims = patchCollection(dossier.claims, claimId, next, reviewer)
  if (!claims) return { ok: false, reason: "not_found" }
  return {
    ok: true,
    value: audit(
      { ...dossier, claims },
      { action: actionFor(next), entityId: claimId, previousState: current.state, newState: next, at },
      actor
    ),
  }
}

function reviewerStamp(next: ReviewState, actor: EvidenceActor, at: string): { reviewerId?: string; reviewedAt?: string } {
  if ((next !== "APPROVED" && next !== "REJECTED") || actor.kind !== "internal") return {}
  return { reviewerId: actor.grant.actorId, reviewedAt: at }
}

function actionFor(next: ReviewState): AuditEvent["action"] {
  if (next === "SUBMITTED") return "submit"
  if (next === "UNDER_REVIEW") return "start_review"
  if (next === "APPROVED") return "approve"
  return "reject"
}

export function advanceToApproved(
  transition: (dossier: EvidenceDossier, id: string, next: ReviewState, actor: EvidenceActor, at: string) => WorkflowResult<EvidenceDossier>,
  dossier: EvidenceDossier,
  id: string,
  actor: EvidenceActor,
  at: string
): WorkflowResult<EvidenceDossier> {
  const submitted = transition(dossier, id, "SUBMITTED", actor, at)
  if (!submitted.ok) return submitted
  const reviewing = transition(submitted.value, id, "UNDER_REVIEW", actor, at)
  if (!reviewing.ok) return reviewing
  return transition(reviewing.value, id, "APPROVED", actor, at)
}
