import type { CollectionConfig } from "payload"

/**
 * F-20 — account-backed wishlist storage.
 *
 * The wishlist itself stays browser-local (localStorage, see
 * src/lib/wishlist/store.ts) — it works with zero accounts, survives
 * logged-out browsing, and leaks nothing. What this collection adds is the
 * cross-device SYNC for signed-in customers: on login the client pushes its
 * local list, on the wishlist page the two are merged (union), so a device
 * that added an item while logged out converges with the account's list on
 * the next visit. One document per Vendure customer id.
 *
 * Same access posture as `inquiries`/`erasure-requests`: written only through
 * the Server Actions (Local API, overrideAccess, after the Vendure session is
 * verified), readable only by logged-in Payload admins. No REST/GraphQL
 * write path exists.
 */
export const Wishlists: CollectionConfig = {
  slug: "wishlists",
  admin: {
    useAsTitle: "customerId",
    defaultColumns: ["customerId", "slugCount", "updatedAt"],
    description:
      "Account-backed wishlist sync (F-20). One document per Vendure customer; the slugs mirror the customer's merged browser wishlist.",
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "customerId",
      type: "text",
      required: true,
      index: true,
      admin: { description: "Vendure customer id (from the verified active session)." },
    },
    {
      name: "slugs",
      type: "array",
      required: true,
      fields: [{ name: "slug", type: "text", required: true }],
      admin: { description: "Wishlisted product slugs, order preserved." },
    },
  ],
}
