# Nile Pharma Food — SEO foundation final report

Date: 2026-09-24.

This is a closure pass. It does not repeat an SEO audit, a competitor audit, or a hosting probe. It records the implementation already in the repository and the external blockers already observed.

The SEO foundation in this repository is closed as far as current access allows. The public program is not complete. Production does not serve this application.

Canonical domain, unchanged: `https://nilepharmafood.com`.

## Executive summary

| Area | Status |
| --- | --- |
| Repository technical SEO | COMPLETE |
| Product index rules | COMPLETE |
| Evidence and YMYL gates | COMPLETE as controls. Approval is BLOCKED. |
| Evidence decision authorization | COMPLETE as a control. Assignment is BLOCKED. |
| The nine confirmed decisions | DEFERRED. They stay `OPEN`. |
| Production runtime | BLOCKED |
| Search growth content | DEFERRED |

No catalog field was changed in this pass. No dossier was approved. No supplement was made eligible. The two CA-MI devices remain the only product URLs the sitemap rule will emit.

## Completed SEO work

These phases are closed. Their reports were not rewritten.

| Work | Where it lives |
| --- | --- |
| Canonical origin, robots, sitemap membership, metadata contract, legacy redirects, 404/410 | `src/lib/seo/`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/proxy.ts` |
| Search foundation and remediation | `docs/seo-remediation-v1-report.md`, `docs/search-foundation-v2-implementation-report.md` |
| Product search growth rules, without new indexable query pages | `docs/product-search-growth-implementation-report.md` |
| SKU evidence and search eligibility | `docs/sku-evidence-search-eligibility.md` |
| Evidence pack workflow | `docs/evidence-pack-workflow.md` |
| Catalog evidence drafts and reconciliation | `docs/catalog-evidence-reconciliation.md` |
| Decision queue | `docs/evidence-decision-queue.md` |
| Authorization bridge | `docs/evidence-decision-authorization.md` |

## Technical SEO status

Repository behavior is COMPLETE. Live-host verification is BLOCKED because the canonical domain does not serve this app. That host was not re-probed in this pass. The last recorded observation is in `docs/production-cutover-final-seo-gate.md` (2026-09-23).

| Control | Repository | Production |
| --- | --- | --- |
| Canonical domain | COMPLETE. `https://nilepharmafood.com` only. `nilepharma.com.eg` is not an NPF URL. | BLOCKED. Last observation: Bluehost suspension page, not this app. |
| Canonical URLs | COMPLETE. Locale path, no query, no hash. Absolute URLs refuse another origin. | BLOCKED. No application HTML to verify. |
| hreflang | COMPLETE for pages that set a locale alternate. Arabic and English paths are emitted together. | BLOCKED. |
| robots | COMPLETE. Allow `/`. Disallow `/admin`, `/api`, and `/*/lab/`. This is not authentication. Sitemap URL is the canonical origin. | BLOCKED. |
| sitemap | COMPLETE. Static public routes plus products that pass `isProductSearchEligible`. No `lastModified`. No blogs, careers, cart, checkout, admin, API, lab, or query URLs. | BLOCKED. |
| metadata | COMPLETE. Title, description, and robots come from the page contract. Ineligible products stay reachable and `noindex`. | BLOCKED. |
| Open Graph | COMPLETE. Same title, description, locale, and canonical path. | BLOCKED. |
| schema | COMPLETE. Product JSON-LD emits only fields the evidence gate exposes. No brand or manufacturer without an approved authorization. No rating, review, or invented GTIN. BreadcrumbList is available for product crumbs. | BLOCKED. |
| breadcrumbs | COMPLETE in schema and product identity helpers. | BLOCKED. |
| redirects | COMPLETE. Five explicit 301s from old `/product/...` paths to Arabic PDPs. Query strings are dropped. www and HTTP are host policy, not app rows. | BLOCKED. |
| 404 | COMPLETE. Unknown `/product/*` is 404. Unconfirmed thermometer slugs are 404, not 301. | BLOCKED. |
| 410 | COMPLETE. Known spam, WordPress, and `/cgi-sys` prefixes are 410. | BLOCKED. |
| Admin and API exclusion | COMPLETE in robots and in the locale proxy matcher. | BLOCKED. |
| Arabic and English | COMPLETE. Arabic title and H1 use stored `nameArabic`. English uses the stored Latin name. Missing Arabic is not invented. | BLOCKED. |

## Product search status

| Rule | Status |
| --- | --- |
| `/products` exists in both locales | COMPLETE |
| Product URLs are `/[locale]/products/[slug]` | COMPLETE |
| Indexability is `isProductSearchEligible` | COMPLETE. No second stored boolean. |
| Eligibility gate | COMPLETE. Open decisions do not change it. |
| Supplements | BLOCKED from the sitemap until pack, composition, and every stored claim are approved. |
| CA-MI devices | COMPLETE under the device rule. Brand is still missing and is not emitted. |
| Unsupported brand or manufacturer | COMPLETE. Not inferred from names, domains, image marks, or leaflet trademark lines. |
| Unsupported medical claims | COMPLETE as a gate. Stored sentences were not rewritten and were not approved. |

## Evidence and YMYL governance

| Rule | Status |
| --- | --- |
| Draft evidence cannot authorize exposure | COMPLETE. Four leaflet dossiers stay `DRAFT`. |
| Stale evidence cannot authorize exposure | COMPLETE. A later source change does not inherit an old snapshot. |
| Unauthorized finalization | COMPLETE. Anonymous and capability-less callers are denied. |
| Client permission grant | COMPLETE. A request body cannot carry a grant or write `evidenceDecisionCapabilities`. |
| Unverified fields | COMPLETE. They stay unverified. Proxeed Men vitamin D `7.5 µg` was not deleted. |
| Claim approval | BLOCKED. No stored health, fertility, or outcome sentence is approved. |
| Decision execution | DEFERRED. Nine records stay `OPEN`. |

A leaflet sentence that names an ingredient is not a medical claim approval. A pack or composition decision does not approve a claim. That rule was not weakened.

## Current product eligibility

Evaluated from the catalog and the existing gate. No row was edited.

| Product | SKU | Commerce status | Search eligible | Evidence | Why blocked, if blocked |
| --- | --- | --- | --- | --- | --- |
| CA-MI Pulse Oximeter | `CAMI-PO-001` | active | yes | Device efficacy document not required. No manual. Brand missing. | Not blocked. Brand is not emitted. |
| CA-MI IR Thermometer | `CAMI-IRT-001` | active | yes | Same device rule. No spec sheet. Brand missing. | Not blocked. Brand is not emitted. |
| Proxeed Plus | `PXD-PLS-001` | active | no | Leaflet dossier `DRAFT`. Usage, duration, and composition decisions `OPEN`. | Unverified pack and composition. Claims not cleared. |
| Proxeed Men | `PXD-MEN-001` | launching_soon | no | Leaflet dossier `DRAFT`. Vitamin D decision `OPEN`. Dose not stated on the leaflet. | Not active. Unverified facts. Claims not cleared. `7.5 µg` remains unverified. |
| Proxeed Women | `PXD-WMN-001` | active | no | Leaflet dossier `DRAFT`. Usage and calorie decisions `OPEN`. | Unverified pack and composition. Claims not cleared. |
| Proxeed Women Inositol | `PXD-WIN-001` | launching_soon | no | Leaflet dossier `DRAFT`. Form, composition, and usage decisions `OPEN`. | Not active. Pack and composition unconfirmed. Claims not cleared. |
| Proxerex | `PXR-001` | active | no | No repository leaflet. | Evidence missing. Claims not cleared. |
| Ellamuselle | `ELM-001` | paused | no | No repository leaflet. | Not active. Evidence missing. Claims not cleared. |

Zero supplements are in the sitemap. The two device product URLs remain the only product candidates.

## Authorization status

COMPLETE as a mechanism. BLOCKED for use.

`finalize_decision` can be read only from a stored Payload user. No user has that capability. The admin form cannot grant it. Chat confirmation cannot grant it. Details: `docs/evidence-decision-authorization.md`.

## Production status

BLOCKED.

Last recorded public origin, 2026-09-23, not re-probed here:

- Apex and www resolved to `173.254.104.205`.
- HTTPS fetches ended at the Bluehost “Account Suspended” page.
- A direct TLS handshake closed with no certificate.
- Port 80 returned an empty reply.

That is not this Next.js app. Localhost is not production evidence. Handoff: `docs/nile-pharma-production-seo-handoff.md`.

## Known blockers

1. No real Payload user has `finalize_decision`. The nine decisions cannot be executed without bypassing the control.
2. `https://nilepharmafood.com` does not serve this application.
3. Local `next build` needs PostgreSQL. `127.0.0.1:5432` is the known local refusal. It is not a production pass.
4. Search Console and Bing were not accessed. Nothing was submitted.
5. Legal name, address, phone, and `sameAs` remain unverified. They were not invented.

## External actions

1. Provision one real Payload user with `finalize_decision` after the capability column exists in PostgreSQL. Do not invent the user in this repository.
2. Execute the nine already-confirmed decisions through the existing workflow. Do not weaken snapshot or variant checks.
3. Put this app on `https://nilepharmafood.com` with TLS, Node 22, and PostgreSQL. Keep the domain.
4. After that origin serves this app, run the runtime verification already written in `docs/seo-final-runtime-gate.md`.
5. Then start `docs/nile-pharma-search-growth-backlog.md`. Do not start it before the origin is this app.

## What is ready for growth

The rules are ready. The content program is not.

Ready now, in the repository only:

- Bilingual product URLs and the eligibility gate.
- The two device PDPs as the only indexable product candidates, still without a brand authorization.
- A decision queue and an authorization check that refuses an anonymous caller.
- A growth backlog that does not invent volume, rank, or medical claims.

Not ready:

- Supplement indexation.
- Educational, fertility, or sexual-health pages.
- Organization schema with a legal identity.
- Search Console submission.
- Any claim that the public domain already ranks or cites this app.

## Checks

This pass, 2026-09-24:

| Check | Result |
| --- | --- |
| `npm test` | Passed. 22 files, 181 tests. |
| `npm run lint` | Passed. |
| `npx tsc --noEmit` | Passed after the test calls matched `createDecisionGrant()`, which takes no argument and returns null. |
| PostgreSQL `127.0.0.1:5432` | Refused. `ConnectionRefusedError`, errno 111. |
| `next build` | Not run. The local database refused the connection. |

One confirmed defect was fixed: the tests still passed a string into `createDecisionGrant()`. The function was already correct. No catalog, eligibility, or decision record changed.
