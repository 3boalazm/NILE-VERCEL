import { authorizeDecisionActor, sessionIdFromAuthUser, storedDecisionUserFromRecord, type DecisionActor } from "@/lib/evidence/decision-auth"

type AuthUser = { id?: string | number | null; collection?: string } | null | undefined
type StoredUser = {
  id?: string | number | null
  email?: string | null
  evidenceDecisionCapabilities?: unknown
} | null

/**
 * Production entry. Pass the user from `payload.auth()` and the same user
 * re-read from the users collection. Capabilities on the auth object are ignored.
 * This module does not call Payload and does not assign a capability.
 */
export function decisionActorFromPayloadSession(authUser: AuthUser, storedUser: StoredUser): DecisionActor {
  return authorizeDecisionActor(sessionIdFromAuthUser(authUser), storedDecisionUserFromRecord(storedUser))
}
