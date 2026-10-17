import { getSnapshot, mergeWishlistSlugs } from "./store"
import { pullWishlist, pushWishlist } from "./sync"

/**
 * F-20 — login-time wishlist reconciliation (client helper).
 *
 * Pulls the account's stored list, merges it into this device's local one
 * (union), then pushes the merged list back so the account document
 * converges. No-ops for anonymous visitors (pull returns synced:false).
 * Sync semantics are documented on the Wishlists collection: reconciliation
 * happens at login and on wishlist-page visits — not on every toggle —
 * which is the accepted trade-off for a Low-severity convenience feature.
 */
export async function reconcileWishlist(): Promise<void> {
  const result = await pullWishlist()
  if (!result.synced) return
  mergeWishlistSlugs(result.slugs)
  await pushWishlist(getSnapshot())
}
