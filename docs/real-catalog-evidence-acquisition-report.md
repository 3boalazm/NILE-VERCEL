# Real catalog evidence acquisition report

Date: 2026-09-24. Phase: real catalog evidence acquisition and search unlock. The eligibility function was not replaced. No second evidence system was added. No catalog value was edited.

## Result

The repository has four product leaflets and no device manual, price list, certificate, or authorization file. Those leaflets were entered as `DRAFT` dossiers. Nothing was submitted or approved. There is no reviewer identity, and none was invented.

Zero supplements became indexable. That is the correct gate result. The two device URLs remain the only sitemap product candidates. Their eligibility does not come from these drafts.

`PRIVATE EVIDENCE STORAGE REQUIRED`. Payload Media stays public-read. No evidence file was uploaded there. Each draft locator is the bare filename. The public `public/downloads/` path is in the note only. It is not authority.

## Records entered

Actor `repository-acquisition` has `edit` only, through `createServerGrant`. Timestamp `2026-09-24T00:00:00.000Z`. No `reviewerId`. No claim records.

| Slug | Locator | Draft facts | Not entered |
| --- | --- | --- | --- |
| `proxeed-plus` | `proxeed-plus-leaflet.pdf` | Latin name, presentation line, trademark Alfasigma S.p.A. | Composition, usage, manufacturer, SKU, claims |
| `proxeed-men` | `proxeed-men-leaflet.pdf` | Latin name, presentation line, trademark Alfasigma s.p.a. | Composition, manufacturer, SKU, claims |
| `proxeed-women` | `proxeed-women-leaflet.pdf` | Latin name, presentation line, composition snapshot of the current rows, trademark Alfasigma S.p.A., manufacturer E-Pharma Trento S.p.A. | Usage, calorie FAQ, claims |
| `proxeed-women-inositol` | `proxeed-women-inositol-leaflet.pdf` | Latin name, leaflet presentation line, leaflet nutrition line, trademark Alfasigma S.p.A., manufacturer Fine Foods & Pharmaceuticals N.T.M. S.p.A. | No catalog snapshot. Form and composition conflict with the catalog. |

Proxerex, Ellamuselle, and both devices have no dossier.

Form drafts store the leaflet presentation sentence, not the longer catalog form string. The women composition draft is the one matching snapshot. Inositol conflict facts quote the leaflet. Their reviewed values are not the catalog snapshot.

An in-memory approval of that women composition snapshot can pass the existing composition gate. The store copy stays `DRAFT`, so the public product does not. Claims are still uncleared, so the supplement stays ineligible even in that test copy. A mismatched or conflicting snapshot does not expose the catalog value and does not write the leaflet sentence onto the product.

## Conflicts left for a later correction

These are `CATALOG CORRECTION REQUIRED`. They were not applied.

- Proxeed Plus: usage volume; zinc salt wording; sucrose absent from the catalog table; stored manufactured-by sentence has no manufactured-by line on the panel.
- Proxeed Men: Vitamin D `7.5 µg` is not in the leaflet.
- Proxeed Women: usage volume; FAQ `16 kcal` versus leaflet `18 kcal`; composition note calls the file a doctors' leaflet.
- Proxeed Women Inositol: pack still pending in the catalog versus leaflet `30 sachets; 6 g`; composition is not the Proxeed Women table; FAQ usage volume.

Brand and manufacturer drafts are candidates only. Approving them would publish those names through the existing gate. They were not approved. `CA-MI` in a device name, and `T-One` on a photo, were not turned into brand or manufacturer facts.

## Search

`listEvidenceRecords()` now returns the four drafts. `publicCatalogProduct` still projects only `APPROVED` matching snapshots. Drafts do not change sitemap URLs or product schema. Schema does not emit locators, brand, or manufacturer.

Eligible slugs remain `ca-mi-ir-thermometer` and `ca-mi-pulse-oximeter`.

## Checks

| Check | Result |
| --- | --- |
| `npm run lint` | passed |
| `npx tsc --noEmit` | passed |
| `npm test` | passed, 19 files, 160 tests |
| `next build` | not run |

BUILD BLOCKED — local PostgreSQL unavailable. `127.0.0.1:5432` refused the connection, errno 111. No migration was added to make a build pass.

Production hosting was not probed. DNS, Bluehost, and TLS were not touched.

## Stop

This phase stops here. No medical page, hub, article, or next SEO phase was started. No reviewer was invented to unlock the drafts.
