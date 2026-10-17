import type { ContentRecord } from "./types"

/**
 * Public content registry. Empty on purpose.
 * A future CMS collection must write here only after review. Saving a
 * draft must not insert a record into this list.
 *
 * Hub paths below are reserved names, not routes. `publishable: false`
 * means no page, no nav item, and no sitemap URL.
 */

export const PUBLISHED_CONTENT: readonly ContentRecord[] = []

export const HUB_REGISTRY = [
  {
    id: "products",
    path: "/products",
    publishable: true,
    blockedBy: null,
  },
  {
    id: "nutrition",
    path: "/hubs/nutrition",
    publishable: false,
    blockedBy: "product-evidence",
  },
  {
    id: "mens-health",
    path: "/hubs/mens-health",
    publishable: false,
    blockedBy: "medical-review",
  },
  {
    id: "womens-health",
    path: "/hubs/womens-health",
    publishable: false,
    blockedBy: "medical-review",
  },
  {
    id: "fertility",
    path: "/hubs/fertility",
    publishable: false,
    blockedBy: "medical-review",
  },
  {
    id: "sexual-health",
    path: "/hubs/sexual-health",
    publishable: false,
    blockedBy: "medical-review",
  },
  {
    id: "educational-resources",
    path: "/hubs/educational-resources",
    publishable: false,
    blockedBy: "content-production",
  },
] as const

export type HubId = (typeof HUB_REGISTRY)[number]["id"]

export const FUTURE_URL_PATTERNS = {
  home: "/[locale]",
  products: "/[locale]/products",
  product: "/[locale]/products/[slug]",
  guide: "/[locale]/guides/[slug]",
  faq: "/[locale]/faqs/[slug]",
  comparison: "/[locale]/comparisons/[slug]",
} as const

export function publishedHubPaths(): string[] {
  return HUB_REGISTRY.filter((hub) => hub.publishable).map((hub) => hub.path)
}

export function isReservedUnpublishedHub(path: string): boolean {
  return HUB_REGISTRY.some((hub) => !hub.publishable && hub.path === path)
}
