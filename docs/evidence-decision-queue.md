# Evidence decision queue

Date: 2026-09-24.

This is a record of conflicts already found in the catalog and the repository leaflets. It does not choose a catalog value. It does not rank the options below. A person who is allowed to own the decision has not been identified, so every record stays `OPEN`.

The catalog was not edited. No supplement was approved. No claim was approved. Brand and manufacturer were not filled in from a leaflet name.

## What a decision is

A decision is a business choice about one conflicting field. It is not an evidence approval and it is not search eligibility.

Each record stores:

- SKU, product, and field
- the catalog phrase as stored
- the evidence phrase, snapshotted from the repository file
- the source file
- the conflict type
- status: `OPEN`, `IN_REVIEW`, `DECIDED`, `REJECTED`, or `DEFERRED`
- decision owner, decision, rationale, and decided-at, once someone is allowed to finalize
- optional effective date and a replacement value when the choice is not one of the two stored phrases

Opening a record does not apply it. Finalizing one does not apply it by itself.

## Options

These are the only kinds. None is preferred here.

| Kind | What it would mean later | What it does not do |
| --- | --- | --- |
| `KEEP_CATALOG_VALUE` | Leave the stored catalog phrase. | Does not rewrite the catalog. Does not approve a claim. |
| `ADOPT_EVIDENCE_VALUE` | Use the snapshotted evidence phrase. | Cannot run while the SKU on the file is unproven. Cannot fill a dose the leaflet does not state. Does not approve a claim. |
| `REPLACE_WITH_OTHER_VALUE` | Use some other stated value, recorded on the decision. | Cannot invent that value in this queue. Cannot run while the SKU is unproven. |
| `MARK_UNVERIFIED` | Leave the phrase, and do not treat it as verified. | Does not rewrite the catalog. |
| `REMOVE_FROM_PUBLIC_OUTPUT` | Stop showing the stored phrase. | Cannot run while the SKU is unproven. Does not delete the stored catalog row by itself. |
| `RETIRE_PRODUCT` | Pause the product. | Cannot run while the SKU is unproven. Does not approve the remaining products. |

A pack or composition decision does not approve a health, fertility, dosage, or outcome sentence. A leaflet sentence that names an ingredient is not that approval.

## Who can finalize

Finalizing needs both of these:

1. A server grant. A browser request, a storefront user, or a JSON body cannot carry that grant. The evidence-review `approve` capability is not this grant.
2. A `decisionOwnerReference` for an identified owner.

These names are not owners: `system`, `admin`, `Arena`, `developer`, and `repository-acquisition`.

Payload users have authentication and no role field. No role was added. No reviewer was invented. Until an owner can be identified without inventing one, the queue cannot be finalized.

## When a decision may change the catalog

All of these must be true. If one is missing, the catalog stays as stored.

- The decision is explicit and finalized by an identified owner.
- The server grant is present.
- The evidence snapshot still matches the same source. A later change in the source does not authorize the new wording.
- The file is tied to this SKU, market, and edition. Doubt blocks `ADOPT`, `REPLACE`, `REMOVE`, and `RETIRE`.
- The stored phrase still matches the phrase on the decision. Only that phrase is rewritten. An English phrase does not replace the Arabic sentence.
- The choice is not being used to approve a claim, set a brand, or set a manufacturer.

`KEEP` and `MARK_UNVERIFIED` do not rewrite catalog text.

Search eligibility stays `isProductSearchEligible`. An open decision does not change it. A later pause would have to pass that same gate. No second eligibility function was added.

## Open records

Every row is `OPEN`. Owner: none. Decision: none.

The leaflet does not print the catalog SKU. That doubt is on every row. It is not resolved here.

### Proxeed Women Inositol — `PXD-WIN-001`

Source: `public/downloads/proxeed-women-inositol-leaflet.pdf`. Artwork edition 10.04.2025 is an artwork date, not proof that this is the current Egypt pack.

| Field | Catalog phrase | Evidence phrase | Conflict |
| --- | --- | --- | --- |
| Form | Powder sachets (final packaging details pending approval) | 30 sachets; 6 g per sachet. | The catalog hold is intentional. The file gives a pack. |
| Composition | Exact amount per sachet not yet confirmed. The catalog also says the base formula is the same as Proxeed Women. | Nutritional value per sachet (6 g): myo-inositol 1000 mg, L-carnitine 500 mg (as L-carnitine fumarate 860 mg), acetyl-L-carnitine 250 mg, L-arginine 500 mg, L-cysteine 100 mg, folic acid 400 µg, vitamin D3 5 µg, zinc 5 mg, iron 7 mg, vitamin C 90 mg, vitamin E 30 mg, selenium 27.5 µg, vitamin B12 2.5 µg | The leaflet is not the same table. This is not a typo. The recorded catalog phrase is only the unconfirmed-amount sentence, because that is the stored string. |
| Usage | Take one sachet daily, mixed with 120ml of water or orange juice. | 200 ml of still water | Volume and liquid do not match. The phrase is in the English FAQ. |

### Proxeed Plus — `PXD-PLS-001`

Source: `public/downloads/proxeed-plus-leaflet.pdf`. Artwork edition 12.11.2024. Job title International. The file title words `manf. Fine Foods` are not a manufactured-by sentence.

| Field | Catalog phrase | Evidence phrase | Conflict |
| --- | --- | --- | --- |
| Usage | each in about 120ml of water or orange juice | 200 ml of water or orange juice | Volume. The phrase sits inside the stored English usage sentence. |
| Duration | 4–6 months | at least 6 consecutive months | Course length. The phrase sits inside the same usage sentence. |
| Composition | 20 mg zinc | 20 mg of Zinc; sucrose 22,4% | The stored row is labeled Zinc lactate. The leaflet does not use that salt name in the inspected line, and it states sucrose. The catalog has no sucrose row. The amount 20 mg is not treated as a wrong number. |

### Proxeed Women — `PXD-WMN-001`

Source: `public/downloads/proxeed-women-leaflet.pdf`. No printed consumer edition date. The file does not title itself a doctors' leaflet.

| Field | Catalog phrase | Evidence phrase | Conflict |
| --- | --- | --- | --- |
| Usage | about 120ml of water or orange juice | 200 ml of still water | Volume and liquid. The phrase sits inside the stored English usage sentence. |
| Calories | Each sachet contains 16 kcal. | 75 kJ (18 kcal) | Different number. Not a unit typo. |

### Proxeed Men — `PXD-MEN-001`

Source: `public/downloads/proxeed-men-leaflet.pdf`. No printed consumer edition date on the inspected panel.

| Field | Catalog phrase | Evidence phrase | Conflict |
| --- | --- | --- | --- |
| Vitamin D | 7.5 µg | Cholecalciferol is named. 7.5 µg is not stated. | The leaflet does not give a replacement dose. The catalog figure was not deleted. |

## Not in this queue

- The two CA-MI devices. No new conflict was opened for them.
- Proxerex and Ellamuselle. No repository leaflet was found. That absence is not a new conflict record.
- Brand and manufacturer names on the leaflets, including Alfasigma, E-Pharma, and Fine Foods. Those names were not written into the catalog.
- Stored health, fertility, study, and outcome sentences. A leaflet fact is not approval of those sentences.

## What is still missing

- An identified decision owner. The user model has no role that can be that owner.
- A current-pack confirmation that prints or otherwise ties the catalog SKU to the file.
- Private storage for a future decision file. Payload Media is public-read, so this queue is not stored there. No Payload collection was added.
