# Evidence decision authorization report

Date: 2026-09-24. The authorization path was added. The nine confirmed decisions were not executed.

## Authorization

| Item | Result |
| --- | --- |
| Mechanism | Server symbol grant issued only from a stored user capability. Session id is checked against that record. |
| Capability | `evidenceDecisionCapabilities`: `view_queue`, `create_decision`, `edit_decision`, `finalize_decision`. |
| Authentication source | Payload `users` collection. The session contributes an id. Capabilities are read from the stored record, not the token. |
| Assignment | Not ready. No user has the capability. The admin form cannot set it. |

## Security

Unauthorized callers are denied: anonymous, mismatched ids, an authenticated user with an empty capability list, a client body, a JSON grant, and an evidence `approve` grant.

A client cannot write the capability. Field create and update access return false, and the change hook restores the stored list.

A denied call writes no audit event and does not change a product. A successful finalization records the actor id, identity, values, snapshot, rationale, `not_approved`, and the resulting search eligibility. That path was tested with a fixture, not with the live queue.

## Decisions

All 9 records remain `OPEN`. None were executed. No owner was written onto them.

## Catalog

No catalog field changed. Proxeed Men Vitamin D remains the stored `7.5 µg`.

## Evidence

The four leaflet dossiers remain `DRAFT`. No fact is `APPROVED`. No claim was approved. Decisions 2 and 6 remain not adoptable. Decision 9 remains a missing dose.

## Search

Eligibility was not changed.

| SKU | Eligible |
| --- | --- |
| `PXD-WIN-001` | no |
| `PXD-PLS-001` | no |
| `PXD-WMN-001` | no |
| `PXD-MEN-001` | no |
| `CAMI-PO-001` | yes |
| `CAMI-IRT-001` | yes |

## External setup

An operator must add the capability column to PostgreSQL and set `finalize_decision` on one real user record. This phase did not do that. Postgres at `127.0.0.1:5432` was not used. No user id or email was invented.

## Checks

| Check | Result |
| --- | --- |
| `npm run lint` | passed on the authorization files; full lint follows the same config |
| `npx tsc --noEmit` | passed |
| `npm test` | passed, 22 files, 181 tests |
| `next build` | not run |

BUILD BLOCKED — local PostgreSQL unavailable. `127.0.0.1:5432` refused the connection, errno 111. No database change was made.

## Stop

The nine decisions stay open. No next phase was started.

## Activation attempt

Date: 2026-09-24. Evidence activation was not started.

No real Payload user has `finalize_decision`. This environment has no `.env` and no reachable PostgreSQL (`127.0.0.1:5432` refused, errno 111), so a stored user cannot be read or assigned. The users collection still cannot grant the field. No user, credential, or permission was invented. The nine confirmed decisions were not executed. Catalog, dossiers, and eligibility were not changed.

A regression now locks that result: anonymous callers and stored users with an empty capability list are denied for the nine confirmed kinds. The queue stays `OPEN`. Sitemap membership and the products-hub search list stay on the two device URLs.

| Check | Result |
| --- | --- |
| `npm test` | passed, 23 files, 189 tests |
| `npm run lint` | passed |
| `npx tsc --noEmit` | passed |
| `next build` | not run. Local PostgreSQL refused the connection. |
