# Catalog evidence reconciliation

Date: 2026-09-24. This file states the rules used to compare repository leaflets with the current catalog. It does not replace `isProductSearchEligible` or the evidence workflow.

## Evidence precedence

1. A file already in this repository is the only evidence.
2. A consumer sentence on that file is a direct fact. A function sentence is not a medical outcome claim.
3. A catalog value is not evidence for itself. A seed sentence, a marketing page, and a file title are not a manufactured-by sentence.
4. A leaflet does not automatically replace the catalog. Disagreement is a conflict, not an edit.
5. Artwork dates, PDF file dates, and article codes are recorded when printed or stored in the file. They are not invented, and a file date is not treated as a consumer edition date.
6. A document for one named product does not authorize another named product. An artwork code is not a catalog SKU.
7. Payload Media remains public-read. A public download path is not a locator and not authority.

## Match states

| State | Meaning |
| --- | --- |
| `EXACT_MATCH` | The catalog string and the leaflet statement are the same fact, not merely the same topic. |
| `PARTIAL_MATCH` | A number or name agrees, but the stored sentence is longer, shorter, or not the leaflet sentence. |
| `CONFLICT` | The catalog and the leaflet state different values. |
| `EVIDENCE_MISSING` | The repository has no document that states the fact. |
| `CATALOG_MISSING` | The leaflet states a fact the catalog does not store as that field. |
| `NOT_APPLICABLE` | The field is not a leaflet fact, or the product type does not use it. |

## Actions

| Action | Meaning |
| --- | --- |
| `READY_FOR_APPROVAL` | Exact, sufficient, and free of variant or version doubt. Still not approved by this phase. |
| `CATALOG_CORRECTION_REQUIRED` | The catalog would have to change before the fact could match. Not applied here unless the correction is safe. |
| `EVIDENCE_CORRECTION_REQUIRED` | The draft quotation would have to be corrected. Not a reason to edit the catalog. |
| `BUSINESS_DECISION_REQUIRED` | More than one reading is possible, the catalog intentionally withholds the value, or the leaflet may be another market or edition. |
| `REMAINS_BLOCKED` | The product or field cannot proceed. |

`VARIANT_MATCH_REQUIRED` is used when the file does not identify the catalog SKU or may be another pack. Those facts are not approved.

## Safe correction

A catalog value may be changed only when all of these are true:

1. The leaflet states the replacement directly.
2. The difference is a data-entry error, not a different instruction.
3. There is no variant, market, or edition doubt.
4. The change does not add a medical claim, a price, a certification, or a manufacturer.
5. The change is recorded with the old value, the new value, the file, and the reason.

If any condition fails, the catalog stays as it is.

A unit typo is a safe correction only when the leaflet states the same number and the other unit, and the surrounding panel confirms it. A missing dose is not a unit typo. A different volume is not a unit typo. An intentional "pending" or "unconfirmed" catalog sentence is a business hold, not a typo.

## Claims

An ingredient line does not support a fertility, outcome, or disease sentence. A stored sentence is supportable only when that exact sentence is in the repository document. Partial overlap is not approval. No claim is approved in this phase. There is no reviewer, and the workflow cannot enter `UNDER_REVIEW` without an approve capability. That capability is not invented.

## Approval

`READY_FOR_APPROVAL` would still wait for a human reviewer. This phase does not mint one. Records that were already drafts stay `DRAFT`. A draft does not change sitemap membership or schema.

## Examples

Catalog pack `30 × 5 g` and leaflet `30 sachets per box; 5g per sachet` is a partial match. The catalog string is not replaced with the shorter leaflet sentence.

Catalog usage `about 120 ml` and leaflet `200 ml` is a conflict. The catalog is not changed.

Catalog `Vitamin D 7.5 µg` and a leaflet that does not state `7.5` is not corrected to another unit. The dose is not in the evidence.

Catalog `packaging pending approval` and a leaflet pack line is a business decision. The hold was written on purpose.
