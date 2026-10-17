# Product search readiness matrix

Date: 2026-09-24. Source: the eight catalog rows in `src/lib/products/mock-repository.ts`, classified by `commercialProfile()`. States are only `VERIFIED`, `MISSING`, `BLOCKED`, or `NOT_APPLICABLE`. A stored string is not claim clearance. Brand and manufacturer have no product field.

No row is a ranking, index, or traffic result. Public discovery of this app is still blocked at `https://nilepharmafood.com`.

## Products

| Product | Arabic name | Category | Status | Indexable | Search readiness | Blocking reason | Name | Arabic name state | Description | Image | Pack / form | Price | Availability | Brand | Manufacturer | Specs / composition | Leaflet file | Evidence | FAQ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Proxeed Plus | بروكسيد بلس | supplements | active | no | BLOCKED | supplement_claim_clearance_absent | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED (2550 EGP) | VERIFIED | MISSING | MISSING | VERIFIED | VERIFIED | BLOCKED | EXISTING_CATALOG_FAQ |
| Proxeed Men | بروكسيد رجال | supplements | launching_soon | no | BLOCKED | status_not_active, supplement_claim_clearance_absent | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | MISSING | VERIFIED | MISSING | MISSING | VERIFIED | VERIFIED | BLOCKED | EXISTING_CATALOG_FAQ |
| Proxeed Women | بروكسيد نساء | supplements | active | no | BLOCKED | supplement_claim_clearance_absent | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED (2550 EGP) | VERIFIED | MISSING | MISSING | VERIFIED | VERIFIED | BLOCKED | EXISTING_CATALOG_FAQ |
| Proxeed Women Inositol | بروكسيد نساء إينوزيتول | supplements | launching_soon | no | BLOCKED | status_not_active, unconfirmed_catalog_facts, supplement_claim_clearance_absent | VERIFIED | VERIFIED | VERIFIED | VERIFIED | BLOCKED | MISSING | VERIFIED | MISSING | MISSING | BLOCKED | VERIFIED | BLOCKED | EXISTING_CATALOG_FAQ |
| Proxerex | بروكس إيركس | supplements | active | no | BLOCKED | supplement_claim_clearance_absent | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED (1790 EGP) | VERIFIED | MISSING | MISSING | VERIFIED | MISSING | BLOCKED | EXISTING_CATALOG_FAQ |
| Ellamuselle | إلاميوسيل | supplements | paused | no | BLOCKED | status_not_active, supplement_claim_clearance_absent | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED (1200 EGP) | VERIFIED | MISSING | MISSING | VERIFIED | MISSING | BLOCKED | EXISTING_CATALOG_FAQ |
| CA-MI Pulse Oximeter | جهاز قياس تشبع الأكسجين CA-MI | medical-devices | active | yes | READY | none | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED (500 EGP) | VERIFIED | MISSING | MISSING | VERIFIED | MISSING | NOT_APPLICABLE | NOT_PUBLISHED |
| CA-MI IR Thermometer | ميزان حرارة بالأشعة تحت الحمراء CA-MI | medical-devices | active | yes | READY | none | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED (750 EGP) | VERIFIED | MISSING | MISSING | VERIFIED | MISSING | NOT_APPLICABLE | NOT_PUBLISHED |

Canonical URLs, when the page is eligible, are `https://nilepharmafood.com/{locale}/products/{slug}`. Sitemap membership matches the Indexable column: only the two devices. Query filters are not rows and are not canonical pages.

`EXISTING_CATALOG_FAQ` means the catalog already had FAQ items. This phase did not add FAQ items or FAQ schema. `NOT_PUBLISHED` means no FAQ was written. A leaflet path is a stored file, not evidence clearance.

## Categories

| Category | Products | Indexable products | Dedicated URL | Reason |
| --- | --- | --- | --- | --- |
| supplements | 6 | 0 | not created | no indexable products; stored description is a health claim |
| medical-devices | 2 | 2 | not created | no product brand or manufacturer field; a new URL would be a thin hub |
| dental | 0 | 0 | not created | coming soon, no products |
| cosmetics | 0 | 0 | not created | coming soon, no products |
| drugs | 0 | 0 | not created | coming soon, no products |

`/products` remains the commercial hub. Category and need controls stay filters on that canonical URL.
