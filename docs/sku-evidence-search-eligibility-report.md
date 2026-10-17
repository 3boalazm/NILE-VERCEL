# SKU evidence and search eligibility — implementation report

Date: 2026-09-24. This phase added a repository evidence gate. It did not create pages, articles, or hubs. It does not report rankings, indexing, or traffic.

## Files changed

- `src/lib/products/evidence-pack.ts` — server-side evidence attachment contract. Not a form and not a Payload field.
- `src/lib/products/types.ts` — optional `evidencePack` on the product type. Current rows do not set it.
- `src/lib/seo/sku-evidence.ts` — evidence states, fact classes, claim gate, product-type policy, `isProductSearchEligible`, `canExposeField`.
- `src/lib/seo/indexability.ts` — re-exports that policy so older callers cannot drift.
- `src/lib/seo/sitemap-entries.ts` — sitemap membership uses `isProductSearchEligible`.
- `src/lib/seo/product-metadata.ts` — robots and description use the same decision and only exposable text.
- `src/lib/seo/product-schema.ts` — schema fields follow `canExposeField`. Brand and manufacturer emit only from an approved authorization.
- `src/lib/products/commercial-profile.ts` — commercial facts and sections use the same exposure rule.
- `src/lib/content/links.ts` — content-to-product links use `canUseSkuInContent`.
- `src/lib/products/payload-repository.ts` — does not map an evidence pack from Payload or a request.
- Product page, catalog cards, spotlight, homepage evidence block, and homepage testimonials omit fields the gate does not expose.
- `src/lib/seo/sku-evidence.test.ts` — policy tests. Existing eligibility tests were not weakened.

## Architecture

```
catalog row
  → field evidence state
  → isProductSearchEligible
  → sitemap, metadata, Product JSON-LD, commercial facts, future content links
```

There is no second stored index boolean. A client cannot mark a field verified. Payload users have authentication and no custom verification role. No public action was added.

## Current catalog

Evaluated from `src/lib/products/mock-repository.ts` on 2026-09-24. No evidence pack is stored on any row.

| Product | SKU | Type | Active | Identity | Commercial | Specs | Brand | Evidence | Claims | Search eligible | Blocking reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Proxeed Plus | PXD-PLS-001 | supplement | yes | VERIFIED | VERIFIED | UNVERIFIED | MISSING | UNVERIFIED | UNVERIFIED | no | BLOCKED — pack UNVERIFIED + composition UNVERIFIED + leaflet UNVERIFIED + evidence UNVERIFIED + claim clearance MISSING |
| Proxeed Men | PXD-MEN-001 | supplement | no | VERIFIED | MISSING | UNVERIFIED | MISSING | UNVERIFIED | UNVERIFIED | no | BLOCKED — status not active + pack UNVERIFIED + composition UNVERIFIED + leaflet UNVERIFIED + evidence UNVERIFIED + claim clearance MISSING |
| Proxeed Women | PXD-WMN-001 | supplement | yes | VERIFIED | VERIFIED | UNVERIFIED | MISSING | UNVERIFIED | UNVERIFIED | no | BLOCKED — pack UNVERIFIED + composition UNVERIFIED + leaflet UNVERIFIED + evidence UNVERIFIED + claim clearance MISSING |
| Proxeed Women Inositol | PXD-WIN-001 | supplement | no | VERIFIED | MISSING | UNVERIFIED | MISSING | UNVERIFIED | UNVERIFIED | no | BLOCKED — status not active + pack UNVERIFIED + composition UNVERIFIED + leaflet UNVERIFIED + evidence UNVERIFIED + claim clearance MISSING + unconfirmed catalog text |
| Proxerex | PXR-001 | supplement | yes | VERIFIED | VERIFIED | UNVERIFIED | MISSING | MISSING | UNVERIFIED | no | BLOCKED — pack UNVERIFIED + composition UNVERIFIED + leaflet MISSING + evidence MISSING + claim clearance MISSING |
| Ellamuselle | ELM-001 | supplement | no | VERIFIED | VERIFIED | UNVERIFIED | MISSING | MISSING | UNVERIFIED | no | BLOCKED — status not active + pack UNVERIFIED + composition UNVERIFIED + leaflet MISSING + evidence MISSING + claim clearance MISSING |
| CA-MI Pulse Oximeter | CAMI-PO-001 | device | yes | VERIFIED | VERIFIED | VERIFIED | MISSING | NOT_APPLICABLE | NOT_APPLICABLE | yes | none |
| CA-MI IR Thermometer | CAMI-IRT-001 | device | yes | VERIFIED | VERIFIED | VERIFIED | MISSING | NOT_APPLICABLE | NOT_APPLICABLE | yes | none |

Machine reasons for the supplements are `supplement_claim_clearance_absent` and `unverified_required_facts`, plus `status_not_active` for Proxeed Men and Ellamuselle, plus `unconfirmed_catalog_facts` for Proxeed Women Inositol.

Device evidence is `NOT_APPLICABLE` because the device policy does not require an efficacy document. That is not a leaflet clearance. Both device leaflets are `MISSING`. Brand remains `MISSING`. The stored description mentions CA-MI (Italy); that sentence is not a brand authorization and is not copied into schema brand or manufacturer.

The two devices remain the only sitemap product URLs. That matches the previous phase. The catalog data did not contradict it.

## Tests

`npm test`: 17 files, 144 tests, passed. Includes `src/lib/seo/sku-evidence.test.ts`.

Covered: missing and conflicting identity, optional SKU, verified and unverified brand and manufacturer, unverified pack omitted, active supplement without evidence blocked, complete evidence fixture eligible only when every required gate passes, device eligible without a brand, uncleared device claim omitted, sitemap inclusion and exclusion, schema limited to verified fields.

Lint was clean. `tsc --noEmit` exited 0 after `next typegen`.

## Build

Not run. Postgres at `127.0.0.1:5432` refused the connection (errno 111). That is not a pass. Database behavior was not changed to bypass it.

## External blockers

- Production hosting at `https://nilepharmafood.com` remains the known suspension-page blocker. It was not re-probed and not treated as solved.
- No supplement has an approved evidence pack or claim clearance.
- No product has a verified brand or manufacturer authorization.
- Legal name, address, phone, and social profiles remain unverified. They were not invented.
- About, story, hero, and quality pages still contain stored marketing sentences. Those sentences were not rewritten and were not treated as SKU clearance.

## Intentionally not done

No medical articles, fertility or sexual-health hubs, category landing pages, FAQ pages, new claims, invented composition, dosage, prices, certifications, reviews, ratings, SearchAction, query-parameter URLs, domain change, or deployment.

## Next gate

Do not start a content phase. A supplement stays out of the sitemap until a reviewed server-side evidence pack covers its pack, composition, and every stored claim statement. A device brand or manufacturer field waits on an approved authorization record. Production checks wait on the owner hosting cutover.
