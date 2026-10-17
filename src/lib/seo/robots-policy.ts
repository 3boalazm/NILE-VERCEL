import type { MetadataRoute } from "next"

import { CANONICAL_ORIGIN } from "./site"

/**
 * robots.txt is not authentication. Disallow tells cooperating crawlers
 * not to fetch a path. It does not protect /admin or /api.
 *
 * Do not disallow `/`, locale roots, the catalog, public PDPs, or render
 * assets (`/_next`, images). `/*\/lab/` is the existing prototype gate.
 */
export const ROBOTS_ALLOW = "/"
export const ROBOTS_DISALLOW = ["/*/lab/", "/admin", "/api"] as const

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ROBOTS_ALLOW,
      disallow: [...ROBOTS_DISALLOW],
    },
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
  }
}

/** Google-style prefix / `*` match for the disallow list above. Used by tests. */
export function robotsDisallowMatches(pathname: string): boolean {
  return ROBOTS_DISALLOW.some((rule) => {
    if (rule.includes("*")) {
      const pattern = `^${rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")}`
      return new RegExp(pattern).test(pathname)
    }
    return pathname === rule || pathname.startsWith(`${rule}/`) || pathname.startsWith(rule)
  })
}
