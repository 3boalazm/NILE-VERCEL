# Real catalog evidence gap report

Date: 2026-09-24. Phase: real catalog evidence acquisition. Search eligibility was not redesigned. No catalog value was changed.

Evidence is a file already in this repository. Web pages, memory, catalog comments, seed sentences, and marketing copy are not evidence. A draft is not an approval. A conflict is not a silent catalog edit.

## Inventory

| Candidate | What it is | Used as evidence? |
| --- | --- | --- |
| `public/downloads/proxeed-plus-leaflet.pdf` | Print-artwork PDF. Added in `e602d10`. Page 1 is a consumer panel in the image; page 2 text is an artwork ticket plus unreadable body text. | Yes, page-1 panel only. Not approved. |
| `public/downloads/proxeed-men-leaflet.pdf` | Consumer leaflet. Extractable text. | Yes, as a draft source. Not approved. |
| `public/downloads/proxeed-women-leaflet.pdf` | Consumer leaflet. Extractable text. | Yes, as a draft source. Not approved. |
| `public/downloads/proxeed-women-inositol-leaflet.pdf` | Consumer leaflet. Extractable text. | Yes, as a draft source. Not approved. |
| `public/products/ca-mi-pulse-oximeter-2.jpg`, `ca-mi-pulse-oximeter-4.jpg` | Product photos. Display shows SpO2 and pulse. No spec table, battery line, SKU, or legal entity. | No record. |
| `public/products/ca-mi-ir-thermometer-2.jpg` | Product photo. Visible marks include `CA-MI` and `T-One`. No spec table or authorization. | No record. A name mark is not manufacturer authorization. |
| Other gallery JPGs and hero images | Same product-photo set. Filenames do not add facts. | No record. |
| `src/lib/products/mock-repository.ts` | Current catalog, including sentences that cite a doctors' leaflet. | Comparison target only. Not a source. |
| Seed, fixtures, dictionaries, about and quality pages | Store or marketing text. No second leaflet, certificate, price list, or manual. | Not evidence. |
| Git history | The four PDFs and the product images arrive in `e602d10`. No earlier product document. | Inventory only. |
| Clinical citation URLs stored on products | Not files in the repository. | Not fetched. Not evidence. |

No price list, certificate, authorization letter, or device manual is in the repository. Payload Media was not searched as a private store: Media is public-read and is not evidence storage.

`PRIVATE EVIDENCE STORAGE REQUIRED`. The public path `public/downloads/<file>` is recorded in the draft note. It is not the locator and it is not authority.

## Discovery

Quality is `PANEL` for the Plus image panel, `EXTRACT` for machine-readable leaflet text, `PHOTO` for an inspected product photo, or `NONE` when the repository has no document.

`READY_FOR_REVIEW` means a draft fact was entered. It does not mean approved. `CATALOG CORRECTION REQUIRED` is a label for a later phase. This phase does not apply that correction.

### Proxeed Plus — `PXD-PLS-001`

| Field | Current catalog value | Candidate | Source | Quality | Action |
| --- | --- | --- | --- | --- | --- |
| Latin name | Proxeed Plus | Proxeed Plus | Plus panel | PANEL | READY_FOR_REVIEW |
| Arabic name | بروكسيد بلس | none | — | NONE | MISSING |
| SKU | PXD-PLS-001 | not printed | Plus panel | PANEL | MISSING |
| Category | supplements | not a leaflet fact | — | NONE | NOT_APPLICABLE |
| Price | 2550 | no price list | — | NONE | NEEDS_EXTERNAL_SOURCE |
| Stock | no quantity field | — | — | NONE | NOT_APPLICABLE |
| Form | Lemon-flavored powder sachets, 30 sachets × 5 g | 30 sachets per box; 5g per sachet. Flavour: Lemon. | Plus panel | PANEL | READY_FOR_REVIEW |
| Composition | rows per 2 sachets, including zinc lactate 20 mg zinc | same numeric amounts for the listed nutrients; panel says 20 mg of Zinc, not zinc lactate; sucrose 22.4% is not in the catalog table | Plus panel | PANEL | CONFLICTING. CATALOG CORRECTION REQUIRED. No composition snapshot. |
| Usage | about 120 ml water or orange juice, plus a 4–6 month course | 200 ml per sachet | Plus panel | PANEL | CONFLICTING. CATALOG CORRECTION REQUIRED. |
| Brand | none stored | trademark owner Alfasigma S.p.A. | Plus panel | PANEL | READY_FOR_REVIEW |
| Manufacturer | scientific copy says manufactured by AlfaSigma HealthScience | no manufactured-by sentence. Artwork ticket says Fine Foods. That job title is not a manufacturer. | Plus panel | PANEL | MISSING. The stored manufactured-by sentence is not supported. |
| Distributor | not a catalog field | Alfasigma HealthScience BV. Egypt agent named on the leaflet. | Plus panel | PANEL | Not entered. Distributor is not manufacturer. |
| Stored claims | health, outcome, and citation sentences; FAQ says 12 calories; halal and vegetarian answers | no exact stored sentence on the panel | Plus panel | PANEL | MISSING. No claim record. |

### Proxeed Men — `PXD-MEN-001`

| Field | Current catalog value | Candidate | Source | Quality | Action |
| --- | --- | --- | --- | --- | --- |
| Latin name | Proxeed Men | Proxeed Men | men leaflet | EXTRACT | READY_FOR_REVIEW |
| Arabic name | بروكسيد رجال | not confirmed as an exact line | men leaflet | EXTRACT | MISSING |
| SKU | PXD-MEN-001 | not printed | men leaflet | EXTRACT | MISSING |
| Category | supplements | not a leaflet fact | — | NONE | NOT_APPLICABLE |
| Price | stored storefront price | no price list | — | NONE | NEEDS_EXTERNAL_SOURCE |
| Form | Powder sachets, 30 sachets × 6.5 g | 30 sachets per box; 6,5 g per sachet. | men leaflet | EXTRACT | READY_FOR_REVIEW |
| Composition | includes Vitamin D 7.5 µg per 2 sachets | nutritional line matches the other stored amounts; 7.5 µg and 7,5 are absent. Ingredient list names cholecalciferol, not a dose. | men leaflet | EXTRACT | CONFLICTING for the vitamin D row. CATALOG CORRECTION REQUIRED. No full snapshot. |
| Usage | about 150 ml water or juice, plus a duration sentence | Dissolve in 150 ml water or orange juice. | men leaflet | EXTRACT | Volume agrees. The stored sentence is not the leaflet sentence. Not claim clearance. |
| Brand | none stored | trademark Alfasigma s.p.a. | men leaflet | EXTRACT | READY_FOR_REVIEW |
| Manufacturer | none stored | manufactured in Via B. Marche 1/C, Istrana (TV), Italy | men leaflet | EXTRACT | MISSING. A place is not a company. |
| Stored claims | health and outcome sentences; halal FAQ | no exact stored sentence | men leaflet | EXTRACT | MISSING. Leaflet function wording was not copied into a claim. |

### Proxeed Women — `PXD-WMN-001`

| Field | Current catalog value | Candidate | Source | Quality | Action |
| --- | --- | --- | --- | --- | --- |
| Latin name | Proxeed Women | Proxeed Women | women leaflet | EXTRACT | READY_FOR_REVIEW |
| Arabic name | بروكسيد نساء | not confirmed as an exact line | women leaflet | EXTRACT | MISSING |
| SKU | PXD-WMN-001 | not printed | women leaflet | EXTRACT | MISSING |
| Category | supplements | not a leaflet fact | — | NONE | NOT_APPLICABLE |
| Price | stored storefront price | no price list | — | NONE | NEEDS_EXTERNAL_SOURCE |
| Form | Orange-flavored powder sachets, 30 sachets × 6 g | Presentation: 30 sachets; 6 g per sachet. Ingredients include orange flavour. | women leaflet | EXTRACT | READY_FOR_REVIEW |
| Composition | 16 rows, including L-carnitine 500 mg and acetyl-L-carnitine 250 mg | per sachet: L-carnitine 500 mg as fumarate 863 mg; acetyl-L-carnitine 250 mg as HCl 295 mg; remaining stored amounts match | women leaflet | EXTRACT | READY_FOR_REVIEW. Matching candidate, not approval. |
| Composition note | cites a doctors' leaflet | file is a consumer leaflet, not that title | women leaflet | EXTRACT | MISSING. The note is not the document title. |
| Usage | about 120 ml water or orange juice | 200 ml of still water | women leaflet | EXTRACT | CONFLICTING. CATALOG CORRECTION REQUIRED. |
| FAQ calories | 16 kcal | 75 kJ (18 kcal) per sachet | women leaflet | EXTRACT | CONFLICTING. CATALOG CORRECTION REQUIRED. Not an exact claim quotation. |
| Brand | none stored | trademark Alfasigma S.p.A. | women leaflet | EXTRACT | READY_FOR_REVIEW |
| Manufacturer | none stored | manufactured by E-Pharma Trento S.p.A., Trento, Italy | women leaflet | EXTRACT | READY_FOR_REVIEW |
| Stored claims | Genazzani studies, outcome copy, halal FAQ | no exact stored sentence | women leaflet | EXTRACT | MISSING. No claim record. |

### Proxeed Women Inositol — `PXD-WIN-001`

| Field | Current catalog value | Candidate | Source | Quality | Action |
| --- | --- | --- | --- | --- | --- |
| Latin name | Proxeed Women Inositol | Proxeed Women Inositol | inositol leaflet | EXTRACT | READY_FOR_REVIEW |
| Arabic name | بروكسيد نساء إينوزيتول | not confirmed as an exact line | inositol leaflet | EXTRACT | MISSING |
| SKU | PXD-WIN-001 | not printed | inositol leaflet | EXTRACT | MISSING |
| Status | launching_soon | not a leaflet fact | — | NONE | NOT_APPLICABLE |
| Form | packaging details pending approval | 30 sachets; 6 g per sachet | inositol leaflet | EXTRACT | CONFLICTING. CATALOG CORRECTION REQUIRED. |
| Composition | same ingredients as Proxeed Women; myo-inositol amount unconfirmed | myo-inositol 1000 mg; L-cysteine 100 mg rather than NAC 50 mg; folic acid 400 µg rather than 200 µg; fumarate 860 mg rather than 863 mg | inositol leaflet | EXTRACT | CONFLICTING. CATALOG CORRECTION REQUIRED. Reviewed value is the leaflet line, not the catalog snapshot. |
| Usage FAQ | 120 ml water or orange juice | 200 ml of still water | inositol leaflet | EXTRACT | CONFLICTING. CATALOG CORRECTION REQUIRED. |
| FAQ calories | 12 kcal | 49 kJ (12 kcal) | inositol leaflet | EXTRACT | Number agrees. Stored sentence is not the leaflet sentence. No claim record. |
| Brand | none stored | trademark Alfasigma S.p.A. | inositol leaflet | EXTRACT | READY_FOR_REVIEW |
| Manufacturer | none stored | manufactured by Fine Foods & Pharmaceuticals N.T.M. S.p.A. | inositol leaflet | EXTRACT | READY_FOR_REVIEW |
| Stored claims | ingredient-level study copy and outcome copy | no exact stored sentence | inositol leaflet | EXTRACT | MISSING. No claim record. |

### Proxerex — `PXR-001`

No leaflet, manual, or certificate in the repository. Catalog text that cites an Alfasigma doctors' leaflet is not a document. Identity, composition, form, brand, manufacturer, and every stored claim: `NEEDS_EXTERNAL_SOURCE`. No record was created.

### Ellamuselle — `ELM-001`

Same as Proxerex. No repository document. `NEEDS_EXTERNAL_SOURCE`. No record was created.

### CA-MI Pulse Oximeter — `CAMI-PO-001`

| Field | Current catalog value | Candidate | Source | Quality | Action |
| --- | --- | --- | --- | --- | --- |
| Name | CA-MI Pulse Oximeter | `CA-MI` is in the name | photos | PHOTO | NEEDS_EXTERNAL_SOURCE. The name is not authorization. |
| Specs | SpO2 70–99%, pulse 30–235, battery, size | display shows SpO2 and pulse. No printed range, battery, or size. | photos | PHOTO | NEEDS_EXTERNAL_SOURCE |
| Brand / manufacturer | none stored | no legal entity or authorization document | photos | PHOTO | NEEDS_EXTERNAL_SOURCE |
| Stored device copy | short description says CA-MI (Italy) and O2-Easy | not printed as an authorization | photos | PHOTO | Not cleared. Device eligibility does not require brand. |

### CA-MI IR Thermometer — `CAMI-IRT-001`

| Field | Current catalog value | Candidate | Source | Quality | Action |
| --- | --- | --- | --- | --- | --- |
| Name | CA-MI IR Thermometer | photo shows `CA-MI` and `T-One` | thermometer photo | PHOTO | NEEDS_EXTERNAL_SOURCE. Marks are not authorization. |
| Specs | distance, reading time, memory, battery, size | no printed spec table | thermometer photo | PHOTO | NEEDS_EXTERNAL_SOURCE |
| Brand / manufacturer | none stored | no legal entity or authorization document | thermometer photo | PHOTO | NEEDS_EXTERNAL_SOURCE |

## Claim classes

Stored sentences were not rewritten and were not deleted.

| Class | Examples already stored | Support in the repository |
| --- | --- | --- |
| Factual | pack count, sachet weight, nutrient amounts, calorie FAQ | Compared above. A match is a draft or a conflict. It is not an approved claim. |
| Commercial | storefront price, halal FAQ, manufactured-by sentence, patent wording | No price list, certificate, or authorization file. Not cleared. |
| Health / medical | short descriptions, benefits, usage course, scientific copy, testimonials, citation titles | No stored sentence was found as an exact leaflet quotation. Not cleared. Leaflet function wording was not copied into the catalog or into a claim. |

## What stays blocked

Every supplement stays ineligible. The two devices stay eligible on the existing device rule. Their brand and manufacturer stay missing. No new indexable supplement URL was created.
