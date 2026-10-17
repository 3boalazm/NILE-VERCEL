# Nile Pharma Food — search growth backlog

Date: 2026-09-24.

Repository growth work is implemented in `src/lib/seo/growth.ts`. It does not approve a claim, index a blocked SKU, or publish a hub. Search volume, rankings, backlink counts, and partnerships were not measured.

Production runtime and supplement activation stay blocked. Detail: `docs/nile-pharma-search-growth-execution-report.md`.

## Implemented

| Area | Status | What the repository does |
| --- | --- | --- |
| Product SEO for `CAMI-PO-001` and `CAMI-IRT-001` | IMPLEMENTED | Stored heading stays the title and H1. Description and image alt add the verified form and, for the description, two verified spec rows. Brand, manufacturer, and unverified prose stay out. |
| Blocked product contracts | IMPLEMENTED | Six supplement contracts stay `noindex`. Descriptions do not copy claim sentences. |
| Content architecture | IMPLEMENTED | Six topics have intent, page type, audience, factual scope, evidence requirement, and Arabic/English titles. None is a route. |
| AEO / GEO | IMPLEMENTED as gates | Factual spec answers are not FAQ schema. Catalog FAQ schema stays null. No SearchAction. No location pages. Origin stays `https://nilepharmafood.com`. |
| Entity SEO | IMPLEMENTED | Organization uses the stored trade name and the other locale's stored trade name. Legal fields stay out. `nilepharma.com.eg` and El-Nile Co. for Pharmaceuticals are refused, not copied. |
| Internal linking | IMPLEMENTED | Homepage links to `/products`. The products hub links the two eligible PDPs. Product search links do not use filter URLs or unpublished hubs. |
| Image SEO | IMPLEMENTED, not mounted | Eligible product images get a stored alt. The image-sitemap generator is not a public route. |
| Search intent | IMPLEMENTED | Informational, commercial, navigational, and product. No volume and no rank. |

## Product SEO

| Item | Status | Gate |
| --- | --- | --- |
| Keep the eight real PDPs. Do not add coming-soon categories as search targets. | IMPLEMENTED | Dental, cosmetics, and drugs stay coming-soon. |
| Leave the two CA-MI device PDPs as the only indexable product candidates. Do not add a brand or manufacturer until an authorization record exists. | IMPLEMENTED | Brand remains missing. |
| Keep all six supplements `noindex` until pack, composition, and every stored claim are approved. | IMPLEMENTED | Evidence approval. The nine open decisions do not clear this. |
| Publish a dated price only from the catalog or Vendure. Do not copy a directory price. | DEFERRED | A stored current price is already on the PDP. A dated public price record was not added. |
| Do not add a comparison page. | IMPLEMENTED | No comparison route. |
| Do not 301 the unconfirmed thermometer slugs. | IMPLEMENTED | They stay 404. |
| Do not revive the old Proxerex “clinically proven” wording. | IMPLEMENTED | Not copied into metadata. |

## Educational SEO

| Item | Status | Gate |
| --- | --- | --- |
| Topic contracts for nutrition, men's health, women's health, fertility, sexual health, and educational resources. | IMPLEMENTED | Contracts only. No pages. |
| No fertility, PCOS, or sexual-function article until a reviewed source supports the exact wording. | BLOCKED | Medical review plus an approved evidence record. |
| No hub until that page exists and its evidence gate passes. | BLOCKED | The two eligible SKUs are devices, not a health hub. |
| Do not turn a leaflet ingredient line into a physiological claim. | IMPLEMENTED | Ingredient text is not copied into growth copy. |

## AEO

| Item | Status | Gate |
| --- | --- | --- |
| Factual device answers from exposed form, SKU, and spec rows. | IMPLEMENTED | Not emitted as FAQ schema. |
| Product answers for pack, name, and form on supplements. | BLOCKED | Decision execution plus evidence approval. |
| Do not answer dosage, outcome, or contraindication questions from catalog marketing sentences. | IMPLEMENTED | Those sentences stay out of schema. |
| Device accuracy or clinical-validation answers. | BLOCKED | No spec sheet in the repository. Stored ranges are specs, not a validation claim. |

## GEO

| Item | Status | Gate |
| --- | --- | --- |
| Egypt commercial pages stay on `https://nilepharmafood.com`, Arabic first, English alternate. | IMPLEMENTED in code | Production runtime still blocked. |
| Do not target `nilepharma.com.eg`. | IMPLEMENTED | Separated host is refused. |
| Do not create location pages. | IMPLEMENTED | None exist. |

## Entity SEO

| Item | Status | Gate |
| --- | --- | --- |
| Trade name and the other stored locale name. | IMPLEMENTED | Not a legal name. |
| Do not emit `legalName`, address, telephone, or `sameAs`. | IMPLEMENTED | Still unverified for schema. |
| Do not set Product `brand` or `manufacturer` from a leaflet or image. | IMPLEMENTED | No authorization record. |

## Internal linking

| Item | Status | Gate |
| --- | --- | --- |
| Homepage → `/products`. Educational hubs only if a page exists. | IMPLEMENTED | No educational page exists. |
| Products hub → the two eligible PDPs. | IMPLEMENTED | Blocked products stay in the catalog grid and out of this search list. |
| Product search links avoid filter URLs and unpublished hubs. | IMPLEMENTED | Category filters remain commerce filters, not canonical parents. |
| Do not link a supplement as a treatment. | IMPLEMENTED | Topic contracts have no linkable SKUs. |

## Authority

| Item | Status | Gate |
| --- | --- | --- |
| No backlink campaign, guest post, or partnership. | DEFERRED | Not measured. Not invented. |
| No manufacturer co-marketing page. | DEFERRED | No written authorization. |
| Stored clinical references are not claim clearance. | IMPLEMENTED | They are not copied into growth metadata. |

## Measurement

| Item | Status | Gate |
| --- | --- | --- |
| Search Console and Bing. | BLOCKED | The canonical host does not serve this app. |
| Rank, impression, or citation counts. | BLOCKED | None measured. |
| Runtime checklist in `docs/seo-final-runtime-gate.md`. | BLOCKED | The app is not the origin. |

## Remaining

1. Provision one real reviewer and execute the nine confirmed decisions. That does not by itself index a supplement.
2. Put this app on `https://nilepharmafood.com`, then run the existing runtime checklist.
3. Publish a topic page only after its evidence gate passes and a real route is added. Do not start from an empty hub.
