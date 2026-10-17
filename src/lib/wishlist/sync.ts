"use server"

import { getPayload } from "payload"

import config from "@/payload.config"

import { getActiveCustomer } from "@/lib/auth/active-customer"
import { isValidSlug } from "@/lib/validation/identifiers"
import { logWarn } from "@/lib/observability/log"

/**
 * F-20 — account-backed wishlist sync (push/pull).
 *
 * Browser-local remains the source of truth for the UI; these actions give a
 * signed-in customer's list a server-side mirror so it converges across
 * devices:
 *
 *   - `pushWishlist` — called after a successful login/registration with the
 *     device's local list; upserts the customer's document.
 *   - `pullWishlist` — called when the wishlist page mounts; returns the
 *     account's stored slugs (or null for anonymous visitors).
 *
 * The client merges (union) and pushes back once — see wishlist-content.tsx.
 *
 * Every write goes through the Local API with overrideAccess AFTER the
 * Vendure session is verified server-side; the collection itself denies
 * direct REST/GraphQL writes. Slugs are re-validated against the same
 * isValidSlug guard used at the repository edge (F-54) and capped, so a
 * tampered localStorage can neither inject arbitrary strings into Payload
 * nor make the document grow without bound.
 */

/** Wishlist size cap — a real list is a few dozen items at most. */
const MAX_SLUGS = 200

function sanitize(slugs: unknown): string[] {
  if (!Array.isArray(slugs)) return []
  const seen = new Set<string>()
  for (const slug of slugs) {
    if (typeof slug === "string" && isValidSlug(slug)) seen.add(slug)
    if (seen.size >= MAX_SLUGS) break
  }
  return [...seen]
}

async function upsert(customerId: string, slugs: string[]): Promise<void> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: "wishlists",
    where: { customerId: { equals: customerId } },
    depth: 0,
    limit: 1,
  })
  // The array field stores { slug } objects; keep the wire format simple.
  const data = { customerId, slugs: slugs.map((slug) => ({ slug })) }
  if (docs[0]) {
    await payload.update({ collection: "wishlists", id: docs[0].id, data, overrideAccess: true })
  } else {
    await payload.create({ collection: "wishlists", data, overrideAccess: true })
  }
}

export async function pushWishlist(slugs: string[]): Promise<{ synced: boolean }> {
  const clean = sanitize(slugs)
  try {
    const customer = await getActiveCustomer()
    if (!customer) return { synced: false }
    await upsert(customer.id, clean)
    return { synced: true }
  } catch (error) {
    // Sync is an enhancement, never a requirement: a Payload outage must not
    // break login or the wishlist page — warn and let the local list rule.
    logWarn("wishlist:push", "wishlist sync failed (continuing local-only)", {
      reason: error instanceof Error ? error.message : String(error),
    })
    return { synced: false }
  }
}

export async function pullWishlist(): Promise<{ synced: boolean; slugs: string[] }> {
  try {
    const customer = await getActiveCustomer()
    if (!customer) return { synced: false, slugs: [] }
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: "wishlists",
      where: { customerId: { equals: customer.id } },
      depth: 0,
      limit: 1,
    })
    const stored: { slug?: string }[] = docs[0]?.slugs ?? []
    return { synced: true, slugs: sanitize(stored.map((entry) => entry?.slug)) }
  } catch (error) {
    logWarn("wishlist:pull", "wishlist pull failed (continuing local-only)", {
      reason: error instanceof Error ? error.message : String(error),
    })
    return { synced: false, slugs: [] }
  }
}
