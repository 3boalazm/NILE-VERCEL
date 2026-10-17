import { readFileSync } from "node:fs"
import { describe, it, expect } from "vitest"

/**
 * Source-level guards for the Content-Security-Policy in `next.config.ts`.
 *
 * The policy is built inside a function that is not exported, so — like the
 * other source-level guards in this repository (see
 * `src/lib/seo/remediation.test.ts`) — these assertions read the source and
 * check the directives that must not drift.
 *
 * The Google Fonts origins are here on purpose: the storefront self-hosts its
 * fonts, but the deployed document can still be asked for a remote
 * stylesheet, and blocking it produced a refused stylesheet plus a failed
 * fetch inside the service worker. A remote stylesheet cannot execute script.
 */
const config = readFileSync("next.config.ts", "utf8")

describe("Content-Security-Policy", () => {
  it("allows the Google Fonts stylesheet and font origins explicitly", () => {
    expect(config).toContain("https://fonts.googleapis.com")
    expect(config).toContain("https://fonts.gstatic.com")
    // …and nothing wider than that: the rest of the policy stays as it was.
    expect(config).not.toMatch(/style-src[^"]*https:\/\/\*/)
    expect(config).not.toMatch(/font-src[^"]*https:\/\/\*/)
  })

  it("keeps the hard guarantees the policy exists for", () => {
    expect(config).toContain("object-src 'none'")
    expect(config).toContain("base-uri 'self'")
    expect(config).toContain("form-action 'self'")
    expect(config).toContain("frame-ancestors 'self'")
    // No wildcard in script-src: the policy is the reason a compromised
    // dependency cannot pull in remote code.
    expect(config).not.toMatch(/script-src[^"]*https:\/\/\*/)
  })
})
