# Nile Pharma Food — search growth execution

Date: 2026-09-24.

This pass executes the prepared growth layer inside the repository. It does not reopen the SEO foundation, approve evidence, or touch hosting.

Canonical domain, unchanged: `https://nilepharmafood.com`.

## Implemented

- `src/lib/seo/growth.ts` — product contracts, factual answers, topic architecture, search intent, GEO contract, entity separation, and internal-link rules.
- Eligible PDP metadata uses the stored heading as the title. The description adds the verified form and two verified spec rows. Image alt is the stored heading plus the verified form.
- Open Graph image alt is passed through the existing page contract.
- Catalog FAQ text cannot become FAQ schema. A published non-medical FAQ fixture still can.
- Organization JSON-LD adds the other stored trade name. It does not add a legal name, address, phone, or `sameAs`.
- Homepage catalog link comes from the growth link list. The products hub renders links to the two eligible PDPs only.
- No new public route, hub, article, comparison, or image sitemap.

## Product SEO

| SKU | Change |
| --- | --- |
| `CAMI-PO-001` | Indexable. English description includes `Fingertip pulse oximeter` and `70–99%`. `Italy`, `O2-Easy`, brand, and manufacturer are omitted. |
| `CAMI-IRT-001` | Indexable. English description includes the stored form and `~5 cm`. Model and origin prose are omitted. |
| `PXD-PLS-001`, `PXD-MEN-001`, `PXD-WMN-001`, `PXD-WIN-001`, `PXR-001`, `ELM-001` | Contracts only. Still `noindex`. Claim sentences are not copied into titles, descriptions, or alts. |

H1 remains the stored heading. Specs already render from the catalog when the exposure gate allows them. No claim was rewritten.

## Growth architecture

| Layer | Status |
| --- | --- |
| Content topics | Six reserved contracts, Arabic and English. `publishable: false`. No route. |
| AEO | Factual answers from exposed fields. `schemaEligible: false`. Catalog FAQ schema is null. |
| GEO | Arabic first, English alternate, EGP, no location pages, no SearchAction. |
| Entity | Trade names only. Separated from El-Nile Co. for Pharmaceuticals and `nilepharma.com.eg`. Those identities are not written into schema. |
| Internal links | Real routes only. Eligible products only in the search list. |
| Intent | informational, commercial, navigational, product. No volume. No rank. |
| Images | Eligible assets can be listed by the existing generator. The generator is not mounted. |

## Tests

| Check | Result |
| --- | --- |
| `npm test` | Passed. 23 files, 188 tests. |
| `npm run lint` | Passed. |
| `npx tsc --noEmit` | Passed after `npx next typegen`. |
| PostgreSQL `127.0.0.1:5432` | Refused. `ConnectionRefusedError`, errno 111. |
| `next build` | Not run. |

## Still blocked

- Reviewer provisioning: no stored user has `finalize_decision`. Rechecked 2026-09-24. PostgreSQL at `127.0.0.1:5432` refused the connection, and no `.env` is present. The nine decisions were not executed.
- Production hosting: `https://nilepharmafood.com` does not serve this app.
- Evidence-dependent supplement activation: six SKUs stay ineligible. No product became newly eligible.

## Ready now

Repository work that does not need those blockers:

- The two device PDPs already use stored facts in metadata, alt, schema, and the products-hub search list.
- Topic, answer, intent, and link contracts can be filled later only with approved text.
- No further audit is required for that.

## Next

1. Provision one real reviewer.
2. Execute the nine confirmed decisions through the existing workflow.
3. Resolve hosting, then run the runtime checklist.
4. Add a public topic page only when its evidence gate and a real route both exist.
