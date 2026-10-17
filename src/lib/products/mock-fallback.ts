/**
 * Controls whether an unreachable Payload/Postgres backend may fall back to
 * the in-memory mock catalog. Kept as a standalone module (no Payload/config
 * imports) so the policy is unit-testable without a database.
 */

/** True only for explicit opt-in values. Everything else — including unset —
 * means "fail closed". */
export function mockFallbackEnabled(): boolean {
  const value = process.env.MOCK_CATALOG_FALLBACK
  return value === "1" || value === "true" || value === "yes"
}

/**
 * Logs a Payload failure, then either fails closed (default) or returns so
 * the caller can serve the mock catalog. Production must never silently serve
 * mock products/prices to real customers; only the explicit opt-in reaches
 * the return path.
 */
export function degradeToMock(operation: string, error: unknown) {
  console.error(`[payload] ${operation} failed (${error instanceof Error ? error.message : error})`)
  if (!mockFallbackEnabled()) {
    console.error(
      "[payload] MOCK_CATALOG_FALLBACK is not set — failing closed instead of serving mock catalog data to real customers (see .env.example)."
    )
    throw error instanceof Error ? error : new Error(String(error))
  }
  console.error("[payload] MOCK_CATALOG_FALLBACK enabled — serving the mock catalog.")
}
