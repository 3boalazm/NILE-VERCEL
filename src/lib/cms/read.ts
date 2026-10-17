import "server-only"

import { logError } from "@/lib/observability/log"

/**
 * Reading the CMS must never be able to take the page down.
 *
 * The repositories fail *closed* on purpose: a CMS outage must not swap the
 * real catalog for the mock one, because mock products and mock prices
 * reaching a real customer is a worse failure than an empty section (see
 * `degradeToMock` in `src/lib/products/mock-fallback.ts`). Failing closed
 * means the read throws — and a throw inside a Server Component render takes
 * the whole route with it: Next swaps the page for the error boundary, the
 * customer sees "something went wrong", and the browser logs a minified
 * React error #441 ("an error occurred in the Server Components render").
 *
 * That is the right trade for *data* (never invent a price) and the wrong
 * trade for the *page* (a database blip should not delete the home page's
 * hero, navigation, editorial content or contact details).
 *
 * So the two decisions are separated: the repository keeps failing closed,
 * and the page asks for the CMS through this helper. A failed read comes
 * back as `unavailable`, is reported through the F-65 pipeline (`logError`),
 * and lets the page render everything it can with an honest notice where the
 * content would have been.
 */
export type CmsRead<T> =
  | { status: "ok"; value: T }
  | { status: "unavailable"; error: unknown }

/**
 * Run one CMS read and turn a failure into a value the page can render.
 *
 * `operation` names the read (e.g. "home:products") and ends up in the
 * structured log record, so an operator can tell which surface degraded
 * without reading a stack trace.
 */
export async function readCms<T>(
  operation: string,
  read: () => Promise<T>,
): Promise<CmsRead<T>> {
  try {
    return { status: "ok", value: await read() }
  } catch (error) {
    logError("cms:read", error, { operation })
    return { status: "unavailable", error }
  }
}

/**
 * The list flavour: an empty list plus a flag, for the surfaces that can
 * render without the items (leaflet lists, related products, filters).
 */
export async function readCmsList<T>(
  operation: string,
  read: () => Promise<T[]>,
): Promise<{ items: T[]; unavailable: boolean }> {
  const result = await readCms(operation, read)
  if (result.status === "unavailable") return { items: [], unavailable: true }
  return { items: result.value, unavailable: false }
}
