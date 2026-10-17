# Evidence decision queue report

Date: 2026-09-24. The known catalog conflicts were recorded. None was decided. No catalog value was chosen. No reviewer was created.

## Result

Nine records are `OPEN`. Owner: none. Decision: none.

`None — all conflicts require an identified decision owner.`

The four leaflet dossiers stay `DRAFT`. No fact was marked `APPROVED`. No supplement was moved to `UNDER_REVIEW`. Search eligibility is still `isProductSearchEligible`. Eligible product slugs are still only `ca-mi-ir-thermometer` and `ca-mi-pulse-oximeter`.

## Files changed

| Path | Change |
| --- | --- |
| `src/lib/evidence/decisions.ts` | Server decision model. A request body cannot carry the grant. |
| `src/lib/evidence/decision-queue.ts` | The nine open records. |
| `src/lib/evidence/store.ts` | Reads the queue. Open records do not change the public product. |
| `src/lib/evidence/catalog-drafts.ts` | Source notes now include the usage, duration, calorie, and composition phrases the records snapshot. Still `DRAFT`. |
| `src/lib/evidence/decision-queue.test.ts` | Creation, authority, staleness, mutation, and search checks. |
| `src/lib/seo/sitemap-entries.ts` | A later decided row still has to pass the existing eligibility gate. Open records do not change membership. |
| `src/app/sitemap.ts` | Passes the open queue into that gate. |
| `docs/evidence-decision-queue.md` | Human package. No option is recommended. |
| `docs/evidence-decision-queue-report.md` | This report. |

`src/lib/products/mock-repository.ts` was not changed. Users were not given a role. No Payload collection, migration, admin screen, or client control was added.

## Authority

Payload users can sign in. They have no role field. Adding a role would invent an owner, so it was not added.

A decision grant is a server symbol. JSON cannot carry it. A storefront session cannot finalize a decision. The evidence `approve` capability cannot finalize one either.

These names are rejected as owners: `system`, `admin`, `Arena`, `developer`, and `repository-acquisition`.

No route mints a grant. The missing piece is an identified owner who is allowed to finalize. Until that exists, the queue cannot move to `DECIDED`.

## Records

| ID | SKU | Field | Status |
| --- | --- | --- | --- |
| `dec-pxd-win-001-form` | `PXD-WIN-001` | form | `OPEN` |
| `dec-pxd-win-001-composition` | `PXD-WIN-001` | composition | `OPEN` |
| `dec-pxd-win-001-usage` | `PXD-WIN-001` | usage | `OPEN` |
| `dec-pxd-pls-001-usage` | `PXD-PLS-001` | usage | `OPEN` |
| `dec-pxd-pls-001-duration` | `PXD-PLS-001` | duration | `OPEN` |
| `dec-pxd-pls-001-composition` | `PXD-PLS-001` | composition | `OPEN` |
| `dec-pxd-wmn-001-usage` | `PXD-WMN-001` | usage | `OPEN` |
| `dec-pxd-wmn-001-calories` | `PXD-WMN-001` | faqCalories | `OPEN` |
| `dec-pxd-men-001-vitamin-d` | `PXD-MEN-001` | vitaminD | `OPEN` |

The two devices were not added. No duplicate field was added.

Each evidence snapshot is the current repository phrase. If that source phrase changes later, the old snapshot cannot authorize the new phrase.

Vitamin D is not adoptable. The leaflet names cholecalciferol and does not state `7.5 µg`. The catalog figure was not deleted.

Every record is variant-ambiguous because the leaflet does not print the catalog SKU. `ADOPT`, `REPLACE`, `REMOVE`, and `RETIRE` are blocked while that is true. `KEEP` and `MARK_UNVERIFIED` would not rewrite the catalog.

A mutation, if one is ever finalized, rewrites only the stored phrase that still matches the decision. It does not replace the Arabic sentence with the English leaflet phrase. It does not approve a claim. It does not set brand or manufacturer from Alfasigma, E-Pharma, or Fine Foods.

Audit entries sit on the decision record and use the same fields as a dossier audit: action, entity, previous state, new state, actor, and time. They are not a second log and not a Payload collection.

## Catalog and search

No catalog string changed. Public product objects are the same objects as before. Sitemap membership did not change. Schema was not given a new brand, manufacturer, or conflicting phrase.

## Checks

| Check | Result |
| --- | --- |
| `npm run lint` | passed |
| `npx tsc --noEmit` | passed |
| `npm test` | passed, 21 files, 174 tests |
| `next build` | not run |

BUILD BLOCKED — local PostgreSQL unavailable. `127.0.0.1:5432` refused the connection, errno 111. No database change was made to force a build.

## Stop

This phase stops here. No medical page, hub, article, or next gate was started.
