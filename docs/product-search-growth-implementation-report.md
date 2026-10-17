# Product search growth — implementation report

Date: 2026-09-24. This phase used the catalog already in the repository. It did not start an audit, a keyword study, or a content program. It does not report rankings, indexing, traffic, or search success.

## What was implemented

- A commercial profile classifies every catalog product as `VERIFIED`, `MISSING`, `BLOCKED`, or `NOT_APPLICABLE`. It does not fill missing fields.
- Product pages now render a product-information block from stored category, form, SKU, and availability. Empty facts render nothing. Brand and manufacturer are not sections.
- English product pages show the stored Arabic name. Arabic pages still show the stored Latin name. Headings stay the stored name for that locale.
- Unconfirmed pack text is not promoted into the commercial fact list.
- Device pages that pass the existing index gate emit stored spec rows as `additionalProperty`. Supplements do not. Schema still has no `brand`, `manufacturer`, rating, or review.
- `/products` remains the only commercial hub. Its breadcrumb is Home → Products. Filters stay query strings and are not canonical pages.
- No category landing page was created. No FAQ was generated. Existing catalog FAQ markup was left as HTML and was not given FAQ schema.
- No product copy was rewritten into a stronger health claim.

## Pages

| URL | Change | Indexable |
| --- | --- | --- |
| `/{locale}/products` | Breadcrumb and BreadcrumbList on the existing hub. Filters unchanged. | yes, as the catalog canonical |
| `/{locale}/products/ca-mi-pulse-oximeter` | Facts block, Arabic name on English, device specs in schema | yes |
| `/{locale}/products/ca-mi-ir-thermometer` | Same | yes |
| Six supplement PDPs | Facts block and bilingual name only. Index gate unchanged. | no |
| Category, need, and search query URLs | Not created | not applicable |

## Template

Visible sections come from `commercialSections()`. Benefits, usage, composition, science, leaflet, and an already-stored FAQ render only when that product has the data. Brand, manufacturer, and a generated FAQ are hard-off. There is no placeholder and no “answer to Google” block.

Image alt remains the stored product heading.

## Links

The graph is Homepage → Products → Product, plus related products that are active, in the same category, and in the same audience cell when one exists. Paused and launching products are not substitutes. The product-information block links back to `/products`. Category chips remain filters, not parent landing pages.

## Schema

Product JSON-LD still uses the stored heading, description, image, SKU, category name, and an Offer only when a numeric price and a mapped availability exist. The two device pages add `PropertyValue` rows from stored specs. Organization and WebSite were not given a legal name, `sameAs`, or `SearchAction`.

## Tests

`src/lib/products/commercial-profile.test.ts` covers:

- indexable title and H1 source uses the stored heading
- Arabic name on Arabic and English name on English
- canonical product URLs have no query string
- sitemap membership matches eligibility
- the products breadcrumb does not use a filter URL
- product metadata does not read `searchParams`
- brand and manufacturer stay omitted
- related products stay active, same category, same audience
- a paused product is not a substitute
- empty optional sections are off
- the template cannot generate a FAQ or a brand block
- device schema has supported spec fields only
- Arabic and English names stay distinct

## Data gaps

- No product has a brand field.
- No product has a manufacturer field. The category sentence “CA-MI (Italy)” was not copied into one.
- Proxeed Men and Proxeed Women Inositol have no price.
- Proxerex, Ellamuselle, and both devices have no leaflet path.
- Proxeed Women Inositol pack and composition are stored as unconfirmed.
- No product has a rating or review. None was added.

## Evidence blocker

Every supplement is blocked by `supplement_claim_clearance_absent`. A download URL is not clearance. No fertility, sexual-health, dosage, or outcome FAQ was added. Device evidence is `NOT_APPLICABLE` for that supplement gate; that is not a medical-claim clearance.

## Legal blocker

The registered legal name, address, phone, and social profiles are still unverified. Schema does not invent them. No disambiguation sentence was added. `nilepharma.com.eg` is not used as an NPF URL or brand target.

## Production blocker

Separate from this phase. `https://nilepharmafood.com` still ends on the host suspension page. Hosting, DNS, TLS, deployment, and production verification were not attempted. The owner handoff remains `docs/production-hosting-cutover-handoff.md`.

## Next phase

Do not start a medical content program. The next implementation that the existing backlog allows is still gated:

1. Business evidence pack per SKU (B-04) before any supplement can be considered for the sitemap (B-12).
2. A confirmed manufacturer authorization (B-08) before a device brand field or a device listing URL (B-13).
3. Owner hosting cutover (B-01) before any production check (B-02).

Until those exist, supplements stay out of the sitemap and category URLs stay unpublished.
