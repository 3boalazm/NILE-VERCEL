/**
 * Search-index eligibility facade.
 * The policy lives in `sku-evidence.ts`. Callers should use
 * `isProductSearchEligible`. `isSearchIndexEligible` is the same function.
 */
export {
  DEVICE_CATEGORY_SLUG,
  INDEX_BLOCK_REASONS,
  NON_INDEX_STATUSES,
  SUPPLEMENT_CATEGORY_SLUG,
  hasUnconfirmedCatalogFacts,
  isProductSearchEligible,
  isSearchIndexEligible,
  productIndexDecision,
  type IndexBlockReason,
  type SearchIndexDecision,
} from "./sku-evidence"
