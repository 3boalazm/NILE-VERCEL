import type { Product } from "@/lib/products/types"
import { isProductSearchEligible } from "@/lib/seo/sku-evidence"

import {
  applyDecisionToProduct,
  canCreateDecision,
  canEditDecision,
  canFinalizeDecision,
  canViewDecisionQueue,
  catalogPhraseCurrent,
  createScopedDecisionGrant,
  DECISION_CAPABILITIES,
  evidenceSnapshotCurrent,
  finalizeDecision,
  type DecisionActor,
  type DecisionCapability,
  type DecisionFailure,
  type DecisionKind,
  type EvidenceDecision,
} from "./decisions"
import type { EvidenceDossier } from "./types"

/**
 * Decision authority comes from a user record loaded by server code.
 * The session contributes an id only. A request body cannot add a capability.
 * Finalizing a decision does not grant evidence approval.
 */

export type SessionIdentity = { id: string }

export type StoredDecisionUser = {
  id: string
  email?: string | null
  evidenceDecisionCapabilities?: readonly string[] | null
}

export function authorizeDecisionActor(session: SessionIdentity | null, stored: StoredDecisionUser | null): DecisionActor {
  const sessionId = session?.id.trim() ?? ""
  const storedId = stored?.id.trim() ?? ""
  if (!sessionId || !stored || !storedId || sessionId !== storedId) return { kind: "anonymous" }
  const email = stored.email?.trim() ?? ""
  const grant = createScopedDecisionGrant({
    actorId: storedId,
    identity: email || storedId,
    capabilities: stored.evidenceDecisionCapabilities ?? [],
  })
  if (!grant) return { kind: "storefront", id: storedId }
  return { kind: "internal", grant }
}

/** A browser body is never a session and never a stored user. */
export function decisionActorFromClientPayload(body: unknown): { kind: "anonymous" } {
  void body
  return { kind: "anonymous" }
}

export function stripUntrustedCapabilityWrite<T extends { evidenceDecisionCapabilities?: unknown }>(
  data: T,
  original: { evidenceDecisionCapabilities?: unknown } | null | undefined
): T {
  const previous = Array.isArray(original?.evidenceDecisionCapabilities) ? original.evidenceDecisionCapabilities : []
  return { ...data, evidenceDecisionCapabilities: previous }
}

export function sessionIdFromAuthUser(user: { id?: string | number | null; collection?: string } | null | undefined): SessionIdentity | null {
  if (!user || (user.collection && user.collection !== "users")) return null
  const id = user.id == null ? "" : String(user.id).trim()
  return id ? { id } : null
}

export function storedDecisionUserFromRecord(record: {
  id?: string | number | null
  email?: string | null
  evidenceDecisionCapabilities?: unknown
} | null): StoredDecisionUser | null {
  if (!record?.id) return null
  const capabilities = Array.isArray(record.evidenceDecisionCapabilities)
    ? record.evidenceDecisionCapabilities.filter((item): item is string => typeof item === "string")
    : []
  return { id: String(record.id), email: record.email, evidenceDecisionCapabilities: capabilities }
}

export type AuthorizedExecution = {
  decision: EvidenceDecision
  product: Product
}

/**
 * Runs one decision for an already authorized actor.
 * Does not write the production queue. A failed check returns the original product.
 */
export function executeAuthorizedDecision(input: {
  decision: EvidenceDecision
  kind: DecisionKind
  rationale: string
  actor: DecisionActor
  at: string
  product: Product
  dossiers: readonly EvidenceDossier[]
  replacementValue?: string
}): { ok: true; value: AuthorizedExecution } | { ok: false; reason: DecisionFailure } {
  if (!canFinalizeDecision(input.actor) || input.actor.kind !== "internal") return { ok: false, reason: "denied" }
  if (!catalogPhraseCurrent(input.product, input.decision)) return { ok: false, reason: "stale" }
  if (!evidenceSnapshotCurrent(input.decision, input.dossiers)) return { ok: false, reason: "stale" }
  const finalized = finalizeDecision(
    input.decision,
    {
      kind: input.kind,
      decisionOwnerReference: input.actor.grant.actorId,
      rationale: input.rationale,
      replacementValue: input.replacementValue,
    },
    input.actor,
    input.at
  )
  if (!finalized.ok) return finalized
  const applied = applyDecisionToProduct(input.product, finalized.value, input.dossiers)
  if (!applied.ok) return applied
  const eligibility: "eligible" | "not_eligible" = isProductSearchEligible(applied.value) ? "eligible" : "not_eligible"
  const audit = finalized.value.audit.map((event, index, all) =>
    index === all.length - 1 ? { ...event, searchEligibility: eligibility, approvalState: "not_approved" as const } : event
  )
  return { ok: true, value: { decision: { ...finalized.value, audit }, product: applied.value } }
}

export function decisionCapabilities(actor: DecisionActor): readonly DecisionCapability[] {
  return actor.kind === "internal" ? actor.grant.capabilities : []
}

export { canCreateDecision, canEditDecision, canFinalizeDecision, canViewDecisionQueue, DECISION_CAPABILITIES }
export type { DecisionActor }
