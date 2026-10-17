import { describe, it, expect } from "vitest"
import { isPublicMediaPath, LEGACY_PRIVATE_CACHES } from "./cache-policy"
describe("PWA cache privacy", () => {
  it("allows only known public media paths (also through image optimizer)", () => {
    for (const path of [
      "/products/proxeed.webp",
      "/care-atlas/coastal-couple-modest.jpg",
      "/_next/image?url=%2Fcare-atlas%2Fpacks%2Fproxeed-plus.webp&w=640&q=75",
      "/categories/men.jpg",
      "/npf-logo.svg",
      "/npf-mark-white.svg",
      "/care-atlas/editorial/about-garden.jpg",
      "/_next/image?url=%2Fproducts%2Fhero.webp&w=640&q=75",
    ])
      expect(isPublicMediaPath(new URL(path, "https://npf.test"))).toBe(true)
    for (const path of [
      "/en/account",
      "/api/users/avatar.png",
      "/en/checkout",
      "/_next/image?url=%2Fapi%2Fusers%2Favatar.png",
      "/_next/image?url=https://evil.test/a.jpg",
    ])
      expect(isPublicMediaPath(new URL(path, "https://npf.test"))).toBe(false)
  })
  it("migrates all old Serwist document/RSC caches", () => {
    expect(LEGACY_PRIVATE_CACHES).toEqual(
      expect.arrayContaining([
        "pages",
        "pages-rsc",
        "pages-rsc-prefetch",
        "others",
        "next-data",
      ])
    )
  })
})
