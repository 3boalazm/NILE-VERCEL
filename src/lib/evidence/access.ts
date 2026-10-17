/**
 * Evidence approval is not a storefront permission.
 * Payload users have authentication and no role field. This module does
 * not invent a role. A request body cannot construct a server grant:
 * the grant flag is a symbol, which JSON cannot carry.
 */

const SERVER_GRANT = Symbol("server-evidence-grant")

export type EvidenceCapability = "edit" | "submit" | "approve"

export type ServerGrant = {
  readonly actorId: string
  readonly capabilities: readonly EvidenceCapability[]
  readonly [SERVER_GRANT]: true
}

export type EvidenceActor =
  | { kind: "anonymous" }
  | { kind: "storefront"; id?: string }
  | { kind: "internal"; grant: ServerGrant }

export function createServerGrant(actorId: string, capabilities: readonly EvidenceCapability[]): ServerGrant | null {
  if (!actorId.trim() || capabilities.length === 0) return null
  return { actorId: actorId.trim(), capabilities, [SERVER_GRANT]: true }
}

export function isServerGrant(value: unknown): value is ServerGrant {
  if (!value || typeof value !== "object" || !(SERVER_GRANT in value)) return false
  const record = value as Record<PropertyKey, unknown>
  const actorId = record.actorId
  return record[SERVER_GRANT] === true && typeof actorId === "string" && actorId.trim().length > 0 && Array.isArray(record.capabilities)
}

export function actorFromStorefrontSession(userId?: string): EvidenceActor {
  return userId?.trim() ? { kind: "storefront", id: userId.trim() } : { kind: "anonymous" }
}

function grantOf(actor: EvidenceActor): ServerGrant | null {
  if (actor.kind !== "internal" || !isServerGrant(actor.grant)) return null
  return actor.grant
}

export function canEditEvidence(actor: EvidenceActor): boolean {
  return grantOf(actor)?.capabilities.includes("edit") ?? false
}

export function canSubmitEvidence(actor: EvidenceActor): boolean {
  return grantOf(actor)?.capabilities.includes("submit") ?? false
}

export function canApproveEvidence(actor: EvidenceActor): boolean {
  return grantOf(actor)?.capabilities.includes("approve") ?? false
}

/** Client and product payloads are never an approval. */
export function evidenceFromClientPayload(body: unknown): { ok: false; reason: "client_payload_rejected" } {
  void body
  return { ok: false, reason: "client_payload_rejected" }
}
