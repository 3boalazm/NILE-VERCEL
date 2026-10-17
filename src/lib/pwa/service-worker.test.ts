import { readFileSync } from "node:fs"
import { describe, it, expect } from "vitest"

/**
 * Source-level guards for the service worker.
 *
 * The service worker is bundled by esbuild and runs in a worker scope, so it
 * cannot be unit-tested directly. These assertions read the source, the same
 * way `src/lib/seo/remediation.test.ts` guards other source-level rules.
 *
 * Each assertion here corresponds to a bug that reached production:
 *   - the catch-all route matched *every* request, so the worker proxied
 *     third-party traffic. Its own `fetch()` is subject to the page's
 *     `connect-src` policy, so a CSP-blocked request became a failed fetch
 *     inside the worker: "no-response :: [url]" plus an unhandled rejection
 *     on every affected page.
 *   - a failed request had no catch handler, so the fetch event's promise
 *     rejected and the browser showed its own network-error page instead of
 *     the site's /offline fallback.
 */
const sw = readFileSync("src/app/sw.ts", "utf8")

describe("service worker routing", () => {
  it("never proxies a cross-origin request", () => {
    expect(sw).not.toMatch(/matcher:\s*\(\)\s*=>\s*true/)
    expect(sw).toContain("matcher: ({ sameOrigin }) => sameOrigin")
  })

  it("turns a failed request into a response instead of a rejected promise", () => {
    expect(sw).toContain("serwist.setCatchHandler")
    // Documents get the precached offline page; everything else gets an
    // honest 504 rather than an unhandled rejection.
    expect(sw).toContain('serwist.matchPrecache("/offline")')
    expect(sw).toContain('status: 504')
  })

  it("keeps documents, API and admin on the network (never on a page cache)", () => {
    expect(sw).toContain('request.destination === "document"')
    expect(sw).toContain('url.pathname.startsWith("/api/")')
    expect(sw).toContain('url.pathname.startsWith("/admin")')
    // The offline fallback is the only HTML the worker may ever serve.
    expect(sw).toContain('url: "/offline"')
  })
})
