import { afterEach, describe, expect, it, vi } from "vitest"

// The store keeps module-level state (cached snapshot); resetModules gives
// every test a fresh store so tests can't leak slugs into each other.
afterEach(() => {
  vi.resetModules()
})

describe("F-20 — mergeWishlistSlugs (local store, node environment)", () => {
  it("unions server slugs into the local list without duplicates", async () => {
    const store = await import("./store")
    store.toggleWishlistSlug("proxeed-plus")
    store.mergeWishlistSlugs(["ft-journey-mobile", "proxeed-plus"])
    expect(store.getSnapshot()).toEqual(["proxeed-plus", "ft-journey-mobile"])
  })

  it("keeps the visitor's own additions first (order stability)", async () => {
    const store = await import("./store")
    store.toggleWishlistSlug("local-item")
    store.mergeWishlistSlugs(["account-item-a", "account-item-b"])
    expect(store.getSnapshot().slice(0, 1)).toEqual(["local-item"])
    expect(store.getSnapshot()).toHaveLength(3)
  })

  it("is a no-op when the server adds nothing new (no spurious re-render)", async () => {
    const store = await import("./store")
    store.toggleWishlistSlug("proxeed-plus")
    const before = store.getSnapshot()
    store.mergeWishlistSlugs(["proxeed-plus"])
    expect(store.getSnapshot()).toBe(before) // same reference — useSyncExternalStore won't loop
  })
})
