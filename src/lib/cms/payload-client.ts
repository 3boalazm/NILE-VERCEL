import "server-only"

import { getPayload, type Payload } from "payload"

/**
 * The Payload client, loaded on demand — never at module scope.
 *
 * Why this is not a plain `import config from "@/payload.config"`:
 * `src/payload.config.ts` validates the runtime environment when it is
 * evaluated (`parseEnvOrThrow` in `src/lib/env.ts`), and that evaluation
 * happens the moment the module is imported. A storefront repository that
 * imported the config at the top of its file therefore turned a *CMS*
 * misconfiguration into a *storefront* outage: the module failed to load, so
 * every page that reads the catalog threw while it was server-rendering, and
 * the customer got the error page instead of the site.
 *
 * That is exactly what a deployment with no `DATABASE_URI` / `PAYLOAD_SECRET`
 * produced: a minified React error #441 ("an error occurred in the Server
 * Components render") on every route, reported by the route error boundary.
 * The message the operator needed was in the server log, not in the browser.
 *
 * Importing the config inside the call puts the failure where the
 * repository's own try/catch can see it, so it becomes "the catalog is
 * unavailable" (see `readCatalog` in `src/lib/products/catalog-read.ts`)
 * instead of a crashed render.
 *
 * The CMS routes under `src/app/(payload)` still import the config statically
 * and still fail fast: an admin panel without a database cannot work, and
 * saying so immediately is more useful than a blank page.
 */
export async function getPayloadClient(): Promise<Payload> {
  const { default: config } = await import("@/payload.config")
  return getPayload({ config })
}
