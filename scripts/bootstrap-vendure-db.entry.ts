import { bootstrap, LanguageCode, Populator } from "@vendure/core"

import { config } from "../src/vendure-config"

/**
 * Seeds the DEFAULT data a fresh Vendure schema still lacks:
 * superadmin + roles + Egypt zone/country + a standard 14% tax rate, via
 * Vendure's own Populator service (the same service `populate()` used).
 *
 * PRECONDITIONS (see scripts/rebuild-stack.sh):
 *   1. `vendure migrate -r` has created the schema;
 *   2. the default Channel + a Seller row exist (Populator assumes them —
 *      they are inserted by rebuild-stack.sh);
 *   3. POSTGRES is reachable with the .env credentials.
 *
 * Booted on PORT=3011 (rebuild-stack.sh exports it) so it never collides
 * with the long-running server on 3001.
 */

async function main() {
  const app = await bootstrap(config)
  try {
    const populator = app.get(Populator)
    await populator.populateInitialData({
      defaultLanguage: LanguageCode.en,
      defaultZone: "Egypt",
      countries: [{ code: "EG", name: "Egypt", zone: "Egypt" }],
      taxRates: [{ name: "Standard", percentage: 14 }],
      shippingMethods: [],
      paymentMethods: [],
      collections: [],
    })
    console.log("vendure default data seeded (superadmin, roles, Egypt zone/country, tax)")
  } finally {
    await app.close()
  }
}

void main().catch((error) => {
  console.error("bootstrap failed:", error instanceof Error ? error.message : error)
  process.exit(1)
})
