# Evidence pack workflow report

Date: 2026-09-24. Phase: SKU evidence pack authoring and review. The eligibility audit was not reopened and the eligibility function was not replaced.

## Result

The review path is operational in code and closed in data. Product, evidence, review, and search eligibility stay separate. Only an `APPROVED` fact or claim whose snapshot still matches the catalog can be projected into the existing pack. `isProductSearchEligible` remains the only eligibility decision.

The production store is empty. None of the eight catalog SKUs was approved. No leaflet, brand, manufacturer, price, or stored sentence was converted into evidence. No product copy was rewritten.

## What was added

| Path | Role |
| --- | --- |
| `src/lib/evidence/types.ts` | Source, fact, claim, and dossier records |
| `src/lib/evidence/locator.ts` | Rejects public URLs and media paths |
| `src/lib/evidence/access.ts` | Edit, submit, and approve are distinct. A request cannot mint a grant. |
| `src/lib/evidence/workflow.ts` | Lifecycle and dossier audit |
| `src/lib/evidence/project.ts` | Projects matching approvals into the existing pack shape |
| `src/lib/evidence/store.ts` | Empty production store and `publicCatalogProduct` |
| `src/lib/evidence/workflow.test.ts` | Lifecycle, staleness, claims, brand, sitemap, schema, and security |

Production callers pass that store before the existing gate:

- `src/app/sitemap.ts` passes `listEvidenceRecords()` as the optional third argument of `buildSitemapEntries`. Omitting that argument still leaves direct policy fixtures intact.
- The PDP uses `publicCatalogProduct` for metadata, schema, commercial facts, and related-card display.
- The homepage, catalog listing, wishlist display, and `contentProductLinks` do the same, so a product-field pack is not public authority.

No Payload collection, migration, admin UI, or public demo page was added. Media remains public-read and is not used for evidence files. Users still have no role field.

## Catalog

The empty store leaves the current catalog on the same eligibility result. No row has an evidence pack.

| Product | SKU | Eligible |
| --- | --- | --- |
| Proxeed Plus | PXD-PLS-001 | no |
| Proxeed Men | PXD-MEN-001 | no |
| Proxeed Women | PXD-WMN-001 | no |
| Proxeed Women Inositol | PXD-WIN-001 | no |
| Proxerex | PXR-001 | no |
| Ellamuselle | ELM-001 | no |
| CA-MI Pulse Oximeter | CAMI-PO-001 | yes |
| CA-MI IR Thermometer | CAMI-IRT-001 | yes |

Only the two device product URLs are sitemap candidates. Brand and manufacturer remain missing. Device eligibility does not require them. Supplement pack, composition, leaflet, and claim clearance were not invented.

## Checks

| Check | Result |
| --- | --- |
| `npm run lint` | passed |
| `npx tsc --noEmit` | passed |
| `npm test` | passed, 18 files, 155 tests |
| `next build` | not run |

BUILD BLOCKED — local PostgreSQL unavailable. `127.0.0.1:5432` refused the connection, errno 111. Database behavior was not changed to make a build pass.

## Still missing

- A role model. Edit, submit, and approve are distinguished, but no authenticated user can be granted them. A request body cannot grant them either.
- A private file store. Media cannot hold evidence files without making them public.
- An admin review screen. There is no place for a person to submit or approve a dossier.
- A durable audit log. Audit events live on the dossier. The production list has no dossiers, and a denied attempt is not written anywhere.

Until those exist, nothing in the store can be approved. Replacing `listEvidenceRecords()` is the only supported way to attach a reviewed pack. A later acquisition pass placed `DRAFT` dossiers in the store. Those drafts are not the missing reviewer and not an approval. See `docs/real-catalog-evidence-acquisition-report.md`.

## Stop

This phase stops here. No medical content, article, hub, or next SEO phase was started.
