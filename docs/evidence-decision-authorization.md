# Evidence decision authorization

Date: 2026-09-24.

The nine confirmed decisions were not executed. This document describes the authorization path that must exist before any of them can be finalized.

## Why the confirmed calls were denied

`finalizeDecision` requires a server grant. The caller was anonymous. A chat confirmation cannot carry that grant. Payload users had no decision capability, and none was invented. The calls returned `denied` and wrote nothing.

## Mechanism

Authority is a stored user capability, not a request.

1. Payload authentication identifies the user. The session contributes an id only.
2. Server code re-reads that user from the `users` collection.
3. `decisionActorFromPayloadSession` reads `evidenceDecisionCapabilities` from that stored record. It ignores capabilities, `isAdmin`, and any grant on the session or the request body.
4. A grant is a server symbol. JSON cannot carry it. `createDecisionGrant("some-id")` no longer mints one.
5. The owner reference on a finalized decision must be that authenticated user id.

The field is `evidenceDecisionCapabilities`. The values are:

| Capability | Allows |
| --- | --- |
| `view_queue` | Read the decision queue. |
| `create_decision` | Open a decision record. |
| `edit_decision` | Move an open record to `IN_REVIEW`. |
| `finalize_decision` | Finalize, reject, or defer a decision. |

Denied by default. An empty or missing list grants nothing.

## What it cannot do

- It cannot approve evidence. `approve` remains a separate evidence capability. A decision grant does not include it.
- It cannot be set from a browser body, a query parameter, a client flag, or the Payload admin form. Field create and update access are closed. A change hook restores the previously stored list.
- It is not saved on the session token.
- It is not assigned to any user by this repository.
- It does not use `system`, `admin`, `Arena`, `developer`, or `repository-acquisition` as an owner.

## Audit

A successful finalization records, on the decision itself:

- decision id, SKU, and field
- previous catalog value and the value the decision would use
- decision type
- authenticated actor id and identity reference
- timestamp
- evidence snapshot and source locator
- rationale
- `approvalState: not_approved`
- resulting search eligibility of the projected product

A denied call does not write an audit event and does not change the catalog or a dossier.

## Snapshot safeguards

These checks are unchanged, and the execution path still requires them:

- The evidence snapshot must still match the same source. A later source change is stale.
- The stored catalog phrase must still be present. If it moved, the decision is stale.
- An ambiguous SKU, market, or edition still blocks adopt, replace, remove, and retire.
- A composition or vitamin D adoption that the leaflet cannot express as a catalog row stays `evidence_incomplete`.
- `KEEP` and `MARK_UNVERIFIED` do not rewrite catalog text.

Decisions 2 and 6 remain not adoptable. Decision 9 remains a missing dose. Those blocks were not weakened.

## External setup required

The authorization function is ready. Assignment is not.

Payload users can sign in. There is no existing capability that distinguishes a trusted administrator from any other authenticated user, so this phase does not let the admin form grant the field. Doing so would let a user grant it to themselves.

Before any of the nine decisions can be executed, an operator must:

1. Apply the `users.evidence_decision_capabilities` column to PostgreSQL. This environment cannot do that: `127.0.0.1:5432` refuses the connection, and no migration was run.
2. Set `evidenceDecisionCapabilities` on one real authenticated user record, including `finalize_decision`, by a direct database write. Do not invent the user id, email, or name in this repository.
3. Call `decisionActorFromPayloadSession` from server code with `payload.auth()` and a fresh `findByID` of that same user. Do not pass the request body as the stored user.

Until that stored capability exists, every finalization stays `denied`.
