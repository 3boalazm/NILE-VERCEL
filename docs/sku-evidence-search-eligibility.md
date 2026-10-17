# SKU evidence and search eligibility

Date: 2026-09-24. This is the repository rule for one question: what evidence does this SKU actually have, and is that enough for search indexing?

It is not a ranking system. It does not create pages.

## 1. Why evidence is separate from product existence

A row can exist, be active, have a price, and still be unsafe to index. Those are different states:

| State | Meaning | Stored as |
| --- | --- | --- |
| Exists | The catalog row is present | the product record |
| Active | `status === "active"` | `product.status` |
| Data present | A string or number is stored | the field itself |
| Fact verified | The field passes the product-type evidence rule | derived |
| Claim cleared | An approved claim record covers the stored statement | `evidencePack`, when a reviewer attaches one |
| Commercially priced | A numeric storefront price is stored | `product.price` |
| Search eligible | Every required gate for that product type passes | derived by `isProductSearchEligible` |

`active` is not indexable. A download path is not clearance. A product name is not a brand.

## 2. Evidence states

`VERIFIED`, `UNVERIFIED`, `MISSING`, `CONFLICTING`, `NOT_APPLICABLE`.

No other state is used. A stored sentence is not upgraded by inference.

## 3. Fact types

| Class | Fields | Rule |
| --- | --- | --- |
| Identity | slug, Latin name, Arabic name, SKU, category | Verified when stored and not contradicted by an evidence-pack identity assertion. SKU is optional on the catalog type, so a missing SKU is a gap, not an index block. |
| Commercial | price, availability | Price is verified only when a finite number is stored. Availability is the catalog status, not a warehouse quantity. `priceWithTax` and stock quantity are `NOT_APPLICABLE`; the type has neither. |
| Brand / manufacturer | evidence-pack authorization only | Missing unless an approved reference covers `brand_manufacturer` and names the party. Never inferred from the product name, a category sentence, or a reseller page. |
| Composition / specification | composition rows, pack/form, leaflet path | Device specs and form are the stored specification record when they contain no unconfirmed marker. Supplement pack and composition stay unverified until an approved reference covers them. A leaflet path alone is `UNVERIFIED`. |
| Health / medical claim | short description, benefits, usage, scientific text, FAQ answers, testimonials, clinical-reference titles, composition notes | Stored text is not clearance. Each statement needs an approved claim record whose text matches exactly. |

## 4. Claim states

A claim record has a statement, evidence ids, `unverified | approved | rejected`, and allowed contexts.

`claimReview.publicClaims: "none"` is clearance only when no claim text is stored and the review is approved against a usable reference. If text exists, that review is `CONFLICTING`, not clearance.

Seed copy, old descriptions, and imported FAQ answers do not approve themselves.

## 5. Product-type policies

Devices may be indexed from verified identity, verified form, and a verified spec table. Brand is not required. A medical-efficacy claim is not required. An uncleared claim attached to a device is omitted. It is not invented, and it does not by itself remove the factual spec page.

Supplements are blocked unless all of these pass:

- active, with slug, Latin name, Arabic name, and category
- pack/form verified by an approved identity reference, with no unconfirmed marker
- composition verified by an approved composition reference
- every stored claim statement, in both locales, matched by an approved claim record
- no conflicting identity or catalog fact

An active supplement with a price, a slug, and a description is not eligible.

## 6. Search eligibility

`isProductSearchEligible(product)` is the only product eligibility decision. Sitemap, metadata, and content links call it. `isSearchIndexEligible` is the same function.

Current block reasons include inactive status, missing identity, unconfirmed catalog text, absent supplement claim clearance, unverified required facts, conflicting identity, conflicting catalog facts, missing device specs, and a category that has no index policy.

## 7. Field exposure

`canExposeField(product, field, context)` is false unless the field is `VERIFIED`. Contexts are `PRODUCT_PAGE`, `PRODUCT_SCHEMA`, `SITEMAP`, `COMMERCIAL_COPY`, `EDITORIAL_CONTENT`, and `MEDICAL_CONTENT`.

Editorial and medical contexts also require the SKU to be search-eligible. Medical context exposes only a verified health-claim field. A verified claim is exposed only in the contexts named on its record.

Unverified and missing fields are omitted. The page does not print "not available" as a fact.

## 8. Sitemap

Eligible active SKUs may be listed at `/{locale}/products/{slug}`. Blocked, inactive, conflicting, and unverified-required SKUs are not listed. Query strings and category URLs are not sitemap entries. The canonical origin stays `https://nilepharmafood.com`.

A future SKU enters the sitemap when its stored record satisfies the policy. No second boolean is flipped by hand.

## 9. Schema

Product JSON-LD emits a field only when that field is exposable: name, SKU, category, image, offer price, device specs as `additionalProperty`, and brand or manufacturer only from an approved authorization. Description is built from exposable text, not from uncleared claim prose. No rating, review, GTIN, or PreOrder is added.

## 10. How a future SKU becomes eligible

Attach a server-side `evidencePack` to the catalog record. It is not a storefront form and not a Payload field today. Payload's product mapper does not copy one from a document or a request. The storefront user collection has authentication and no custom role that can mark a fact verified. A future admin write has to be a reviewed server-side change, not a public action.

The pack needs approved references with locators, coverage for the fact classes being verified, and claim records whose statements match the stored text exactly. Until that pack exists, the SKU stays blocked.

## 11. Current examples

Eligible: CA-MI Pulse Oximeter and CA-MI IR Thermometer. Specs and form are verified catalog records. Brand, manufacturer, and leaflet are missing. Efficacy evidence is not applicable. No claim record exists.

Blocked: every supplement. Proxeed Plus, Proxeed Women, and Proxerex are active and still blocked because claim clearance is missing and pack/composition are unverified. Proxeed Men and Ellamuselle are also not active. Proxeed Women Inositol also has unconfirmed pack text, which is not treated as verified.

A leaflet path on Proxeed Plus is `UNVERIFIED`. It does not clear the SKU.
