# Evidence pack authoring and review

Date: 2026-09-24. This is the server-side path from a catalog row to the evidence pack that `isProductSearchEligible` already reads.

It does not approve any current SKU. It does not add an admin screen, a public page, or a second eligibility function.

## 1. Four separate records

| Record | What it is | What it is not |
| --- | --- | --- |
| Product | Catalog identity, price, status, and stored text | Evidence authority. No `verified` flag. |
| Evidence source | A typed document reference and its review state | A URL. A media upload. A product field. |
| Review | A fact snapshot or one claim statement, with reviewer, time, and state | A rewrite of the catalog. A giant claim covering the whole product. |
| Search eligibility | The existing decision in `isProductSearchEligible` | A new policy and a new function. |

Payload does not map `evidencePack`. A pack on a product object is ignored by production sitemap, PDP, catalog, homepage, wishlist display, and content links. Those callers project the evidence store first, then call the existing gate.

`buildSitemapEntries(products, content)` still accepts a direct pack when the evidence argument is omitted. That keeps the policy tests valid. Production always passes the store, including the empty store.

## 2. Sources

A source is one of:

- `OFFICIAL_LEAFLET`
- `MANUFACTURER_DOCUMENT`
- `AUTHORIZATION`
- `REGULATORY_DOCUMENT`
- `INTERNAL_APPROVED_DOCUMENT`
- `OTHER_APPROVED_SOURCE`

A URL is not a source type and is not authority. A locator must be a private label, such as `internal-review-record`. `http`, `https`, a site path, and `/api/media` are rejected. The locator is not copied into sitemap URLs or product schema.

No regulator is invented. No manufacturer is inferred from a product name, a domain, an image, or a reseller page.

## 3. Lifecycle

Each source, fact, and claim moves on its own:

`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED`

`UNDER_REVIEW` → `REJECTED`

No step can be skipped. `APPROVED` and `REJECTED` have no further transition. Rejection keeps the stored statement and the optional note. It does not rewrite or delete catalog text.

Only `APPROVED` can be projected, and only when the source is also `APPROVED` and still usable.

## 4. What a review covers

Facts are separate records: form, composition, brand, manufacturer, and the identity or price fields the workflow can store. A form approval stores the exact reviewed string, including the English string when it differs.

`pack = 30 sachets` does not authorize a later `60 sachets`. If either locale changes, the form snapshot is stale. Stale coverage is omitted. The catalog value is left as stored. The new value is not treated as verified.

Composition uses the same rule on the label/value rows.

Brand and manufacturer are names supplied by the review. They are not copied from `product.name`. A URL is not an authorization name.

Claims are one statement each. The statement must still be present, unchanged, on the product. Allowed contexts are stored on that claim. An empty context list is not projected. Draft, submitted, under-review, and rejected claims do not contribute.

A supplement becomes eligible only through the existing gate: active, matching form coverage, matching composition coverage, and an approved claim for every stored statement. A leaflet is not required. A download path is still not clearance. A partial claim review does not enter the sitemap.

A device can stay eligible without brand or manufacturer approval. Device specs stay on the existing catalog rule. This workflow does not add a device leaflet requirement.

Price is still the stored storefront number. A price review can be recorded. It does not replace `product.price` and it does not change the existing price rule.

## 5. Who may act

Payload users authenticate and have no role field. This phase does not invent roles and does not add one.

The workflow still distinguishes three capabilities:

| Capability | May |
| --- | --- |
| `edit` | Create a draft source, fact, or claim |
| `submit` | Move `DRAFT` to `SUBMITTED` |
| `approve` | Move `SUBMITTED` to `UNDER_REVIEW`, then to `APPROVED` or `REJECTED` |

A storefront session and an anonymous caller have none of these. A grant cannot be built from JSON: the server mark is a symbol, which JSON drops. `evidenceFromClientPayload` rejects every body. No app route or server action calls the grant constructor or the transition functions.

There is no admin UI. A future private handler would have to be server-side, separate from the storefront session, and still unable to treat a request body as approval.

## 6. Files and audit

Payload Media is public-read (`access.read: () => true`). Evidence files are not stored there. Access was not weakened. There is no private file store in this phase. A `documentRef` may only be a private label, and it is never turned into a public URL.

The production store is `listEvidenceRecords()`. A later acquisition pass may place `DRAFT` dossiers there. No current SKU is approved. A draft is not an approval, and a public file path is not a locator.

A successful transition appends an audit event to that dossier: action, entity, previous state, new state, actor, and the caller-supplied timestamp. There is no second audit log. Denied attempts are not persisted, because there is no durable store to write them to. The production list has no dossiers, so there is no production audit trail yet.

No Payload collection and no migration were added.

## 7. What production does with the empty store

The empty store does not change the current catalog. The two device URLs remain the only product URLs that can enter the sitemap. Supplements stay ineligible. Missing brand and manufacturer stay missing. Stored claim text stays withheld from search output.

When a future private store replaces `listEvidenceRecords()`, the same projection and the same `isProductSearchEligible` apply. Callers must not start trusting a product field instead.

## 8. Limits

- No admin workflow screen.
- No durable evidence store, private file store, or durable audit log.
- No revocation transition after `APPROVED`. A matching approval stops contributing only when the catalog value no longer matches, or when it is never projected because the store is empty.
- Identity assertions are not written into `pack.identity`. The existing conflict rule still applies when a pack is passed straight to the policy. Production does not treat a product-field identity block as evidence.
- A supplement with no stored claim text is not given an invented `publicClaims: "none"` clearance.
- Index clearance still uses the existing claim rule. Allowed contexts govern exposure, not a new index function.
- This phase does not publish articles, hubs, medical pages, or product-copy rewrites.
