# Catalog evidence reconciliation report

Date: 2026-09-24. The four leaflet PDFs were opened again. The catalog was not edited. No dossier was submitted, moved to `UNDER_REVIEW`, or approved. There is no reviewer in the user model, and none was created.

Eligibility is still `isProductSearchEligible`. No second gate was added.

## Files changed

| Path | Change |
| --- | --- |
| `src/lib/evidence/catalog-drafts.ts` | Re-read notes, artwork dates, and the Plus presentation sentence. Still `DRAFT`. |
| `src/lib/evidence/catalog-reconciliation.test.ts` | Locks the conflicts in place and the existing gate. |
| `docs/catalog-evidence-reconciliation.md` | Rules. |
| `docs/catalog-evidence-reconciliation-report.md` | This report. |

`src/lib/products/mock-repository.ts` was not changed. Sitemap and schema code were not changed.

## Document dates

These are file or artwork dates. They are not treated as proof that the file is the current Egypt commercial pack.

| File | What is printed or stored | SKU on the file |
| --- | --- | --- |
| `proxeed-plus-leaflet.pdf` | Artwork edition 12.11.2024. Plant modification 28/11/2024. Practice `C. 05030/4`. Article `45003973`. Job title International. PDF title includes `manf. Fine Foods`. | `PXD-PLS-001` is not printed. |
| `proxeed-men-leaflet.pdf` | Artwork dates 26.11.2018, 26.06.2020, 20.06.2022, 11.11.2022, 04.10.2023. Plant modification 27/10/2023. Practice `C. 02140/10`. Job title International. | `PXD-MEN-001` is not printed. |
| `proxeed-women-leaflet.pdf` | No printed consumer edition date. PDF file date is not used as an edition. | `PXD-WMN-001` is not printed. |
| `proxeed-women-inositol-leaflet.pdf` | Artwork edition 10.04.2025. Plant modification 24/04/2025. Practice `C. 05296/3`. Article `45003976`. Job title International. | `PXD-WIN-001` is not printed. |

Article codes are not catalog SKUs. `VARIANT_MATCH_REQUIRED` for any approval that would treat the file as the current SKU pack.

## Catalog corrections applied

None. Every conflict fails at least one safe-correction rule.

`None — all conflicts require review or additional evidence.`

## Known clusters

### Proxeed Women Inositol — `PXD-WIN-001`

| Field | Catalog | Evidence | Match | Action |
| --- | --- | --- | --- | --- |
| Form | packaging details pending approval | 30 sachets; 6 g per sachet | CONFLICT | `BUSINESS_DECISION_REQUIRED`. The catalog hold is intentional. The artwork is marked International. Not applied. |
| Composition | same ingredients as Proxeed Women; myo-inositol amount unconfirmed | myo-inositol 1000 mg; L-cysteine 100 mg; folic acid 400 µg; fumarate 860 mg | CONFLICT | `BUSINESS_DECISION_REQUIRED`. Not a typo. Not applied. |
| Usage FAQ | 120 ml water or orange juice | 200 ml of still water | CONFLICT | `CATALOG_CORRECTION_REQUIRED` only after a business decision. Not applied. |
| Calories | stored sentence says 12 kcal | 49 kJ (12 kcal) per sachet | PARTIAL_MATCH | Number agrees. The stored sentence is not the leaflet sentence. Not rewritten. |

The product stays blocked. It is `launching_soon`, the pack is unconfirmed, and no claim is approved.

### Proxeed Plus — `PXD-PLS-001`

English panel, read from the page image:

`Product presentation: 30 sachets per box; 5g per sachet.`

`Ingredients: 2 sachets contain: 3450 mg of L-Carnitine fumarate; Sucrose (22,4%), 2000 mg of Fructose, 1000 mg of Acetyl-L-Carnitine HCl, 180 mg of Vitamin C (225%*), 100 mg of Citric acid, 20 mg of Zinc (200%*), Flavour: Lemon, … 100 µg of Selenium (182%*), 40 mg of Coenzyme Q10, … 400 µg of Folic acid (200%*) and 3,0 µg of Vitamin B12 (120%*).`

Use: dissolve 1 sachet in 200 ml of water or orange juice, morning and evening. At least 6 consecutive months, or while attempting to conceive.

Trademark: Alfasigma S.p.A. Distributor: Alfasigma HealthScience BV. No manufactured-by sentence on the consumer panel.

| Field | Catalog | Evidence | Match | Action |
| --- | --- | --- | --- | --- |
| Latin name | Proxeed Plus | Proxeed Plus | EXACT_MATCH | `REVIEW_REQUIRED`. SKU is not on the file. |
| Form | Lemon-flavored powder sachets, 30 sachets × 5 g | 30 sachets per box; 5g per sachet. Flavour: Lemon. | PARTIAL_MATCH | Not an error. Catalog string was not shortened. |
| Composition | includes zinc lactate 20 mg zinc; no sucrose row | 20 mg of Zinc; sucrose 22,4% | CONFLICT | `BUSINESS_DECISION_REQUIRED`. Amounts otherwise agree. Table was not rewritten. |
| Usage | about 120 ml; 4–6 months | 200 ml; at least 6 months | CONFLICT | Not a unit typo. Not applied. |
| Brand | none stored | trademark Alfasigma S.p.A. | CATALOG_MISSING | `REVIEW_REQUIRED`. Not inferred from the name. Not approved. |
| Manufacturer | scientific copy says AlfaSigma HealthScience | no manufactured-by sentence | EVIDENCE_MISSING | File title `manf. Fine Foods` is not that sentence. Copy was not rewritten. |
| Claims | stored health and FAQ sentences | no exact stored sentence | NOT_SUPPORTED | No claim record. |

### Proxeed Women — `PXD-WMN-001`

| Field | Catalog | Evidence | Match | Action |
| --- | --- | --- | --- | --- |
| Latin name | Proxeed Women | Proxeed Women | EXACT_MATCH | `REVIEW_REQUIRED`. SKU is not on the file. |
| Form | Orange-flavored powder sachets, 30 sachets × 6 g | 30 sachets; 6 g per sachet. Orange flavour is in the ingredient list. | PARTIAL_MATCH | Catalog string was not shortened. |
| Composition | stored amounts, including folic acid 200 µg and vitamin D3 5 µg | same amounts per sachet; also fumarate 863 mg and HCl 295 mg | PARTIAL_MATCH | Amounts agree. Salt weights were not added. `REVIEW_REQUIRED`, not approved. |
| Composition note | doctors' leaflet | consumer leaflet, not that title | CONFLICT | Note was not rewritten. |
| Usage | about 120 ml water or orange juice | 200 ml of still water | CONFLICT | Not applied. |
| FAQ calories | 16 kcal | 75 kJ (18 kcal) | CONFLICT | Different number, not a unit typo. No edition date. Not applied. |
| Brand | none stored | Alfasigma S.p.A. | CATALOG_MISSING | `REVIEW_REQUIRED`. Not approved. |
| Manufacturer | none stored | manufactured by E-Pharma Trento S.p.A. | CATALOG_MISSING | Direct sentence. `REVIEW_REQUIRED`. Not approved. |
| Claims | Genazzani and outcome sentences | no exact stored sentence | NOT_SUPPORTED | Ingredient text is not those claims. |

### Proxeed Men — `PXD-MEN-001`

| Field | Catalog | Evidence | Match | Action |
| --- | --- | --- | --- | --- |
| Latin name | Proxeed Men | Proxeed Men | EXACT_MATCH | `REVIEW_REQUIRED`. SKU is not on the file. |
| Form | Powder sachets, 30 sachets × 6.5 g | 30 sachets per box; 6,5 g per sachet. | PARTIAL_MATCH | `6.5` and `6,5` are the same weight. Catalog string was not replaced. |
| Composition | includes Vitamin D 7.5 µg | nutrition line has no `7.5` and no `7,5`. Ingredient list names cholecalciferol without a dose. Vitamin E on the English line is 24 mg. | CONFLICT | Not the unit-typo case. The leaflet does not state a replacement dose. Row was not deleted and not changed. |
| Usage | about 150 ml, plus a duration sentence | 150 ml water or orange juice; a few weeks/months | PARTIAL_MATCH | Volume agrees. Stored sentence was not replaced. Not claim clearance. |
| Brand | none stored | trademark Alfasigma s.p.a. | CATALOG_MISSING | `REVIEW_REQUIRED`. Not approved. |
| Manufacturer | none stored | manufactured in Via B. Marche 1/C, Istrana (TV), Italy | EVIDENCE_MISSING | A place is not a company. The E-Pharma print note is not a manufacturer sentence. |
| Claims | stored health sentences | no exact stored sentence | NOT_SUPPORTED | Function wording was not copied into a claim. |

A text extract that showed French vitamin E `4 mg` is a line split of `24 mg`. It is not a second dose and was not used.

## Other products

| SKU | Evidence | Action |
| --- | --- | --- |
| `PXR-001` Proxerex | no repository leaflet | `EVIDENCE_MISSING`. `REMAINS_BLOCKED`. |
| `ELM-001` Ellamuselle | no repository leaflet | `EVIDENCE_MISSING`. `REMAINS_BLOCKED`. |
| `CAMI-PO-001` | photos only. No manual or authorization. | Brand and manufacturer `EVIDENCE_MISSING`. Device rule unchanged. |
| `CAMI-IRT-001` | photo shows `CA-MI` and `T-One`. No spec sheet or authorization. | `EVIDENCE_MISSING`. Name marks are not authorization. |

Price, stock, certification, and regulatory approval remain `EVIDENCE_MISSING` for every SKU. No price list or certificate is in the repository.

## Evidence-ready facts

These can be handed to a reviewer later. They are still `DRAFT`. They were not moved to `UNDER_REVIEW`, because that transition requires an approve capability this phase does not have.

| SKU | Field | Why it can be reviewed | Why it is not approved |
| --- | --- | --- | --- |
| Four leaflet SKUs | Latin name | Heading matches the catalog name | SKU is not printed. No reviewer. |
| `PXD-WMN-001` | composition amounts | Nutrition line matches the stored amounts | Salt weights are extra. No edition date. No reviewer. |
| Four leaflet SKUs | trademark owner | Direct trademark sentence | Catalog has no brand field. Trademark is not a schema authorization by itself. |
| `PXD-WMN-001` | manufacturer | `manufactured by E-Pharma Trento S.p.A.` | No reviewer. Distributor is a different role. |
| `PXD-WIN-001` | manufacturer | `manufactured by Fine Foods & Pharmaceuticals N.T.M. S.p.A.` | No reviewer. Language panels differ on the distributor name. |

No field is `READY_FOR_APPROVAL`. Version or SKU doubt remains on every file.

## Claim status

No stored sentence of the four leaflet products was found as an exact quotation in the leaflet text. Ingredient labels that also appear in the leaflet do not support the surrounding health, outcome, FAQ, or testimonial sentences.

| Result | What it covers |
| --- | --- |
| `EXACTLY_SUPPORTED` | none |
| `PARTIALLY_SUPPORTED` | some ingredient names and the Men 150 ml volume. Not a claim approval. |
| `NOT_SUPPORTED` | stored health, outcome, study, halal, and manufactured-by sentences |
| `NOT_REVIEWABLE` | Proxerex, Ellamuselle, and both devices. No document. Plus calorie FAQ: the inspected English panel does not state a calorie figure, so it was not turned into a conflict. |

No claim record was created. Leaflet function wording was not copied into the catalog.

## SKU search status

| SKU | Before | After | Reason |
| --- | --- | --- | --- |
| `PXD-PLS-001` | blocked | blocked | drafts are not approvals; usage and composition conflict; claims uncleared |
| `PXD-MEN-001` | blocked | blocked | vitamin D dose unsupported; claims uncleared |
| `PXD-WMN-001` | blocked | blocked | usage and calorie conflicts; claims uncleared |
| `PXD-WIN-001` | blocked | blocked | pack and composition conflict; not active; claims uncleared |
| `PXR-001` | blocked | blocked | no document |
| `ELM-001` | blocked | blocked | no document |
| `CAMI-PO-001` | eligible | eligible | existing device rule. Brand still missing. |
| `CAMI-IRT-001` | eligible | eligible | existing device rule. Brand still missing. |

Zero supplements were unlocked.

## Sitemap

Membership did not change. The two device product URLs remain the only product candidates. No supplement URL was added. No query-string or category URL was added.

## Schema

Product JSON-LD did not change. Drafts still do not emit brand, manufacturer, locators, conflicting pack text, or unapproved composition. The public catalog object is unchanged.

## Remaining evidence gaps

- A human reviewer who can submit and approve.
- Private evidence storage. Media is still public-read.
- A current-pack confirmation that ties each leaflet to its catalog SKU.
- Business decisions for the conflicts above.
- Leaflets or manuals for Proxerex, Ellamuselle, and both devices.
- Manufacturer authorization for Plus, Men, and both devices.
- Certificates, a price list, and exact support for stored claims.

## Checks

| Check | Result |
| --- | --- |
| `npm run lint` | passed |
| `npx tsc --noEmit` | passed |
| `npm test` | passed, 20 files, 163 tests |
| `next build` | not run |

BUILD BLOCKED — local PostgreSQL unavailable. `127.0.0.1:5432` refused the connection, errno 111. No database change was made to force a build.

## Stop

This phase stops here. No medical page, hub, article, or next gate was started.
