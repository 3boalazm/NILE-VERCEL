import type { CollectionConfig } from "payload"

/**
 * F-58 — GDPR erasure (right-to-be-forgotten) intake.
 *
 * Vendure's *shop* API deliberately exposes no "delete my account" mutation
 * (erasure is an admin operation), so a storefront cannot erase a customer
 * row itself — and silently pretending otherwise would be the worst kind of
 * privacy fix. What a storefront CAN do honestly is what this collection
 * implements: a verified, authenticated, rate-limited intake that records the
 * request with the customer's id, so ops executes the erasure in Vendure
 * admin + Payload and closes the ticket (SOP in docs/OPS.md, §account
 * erasure; GDPR Art. 12(3) gives up to 30 days).
 *
 * Same access posture as `inquiries`: created only through the Server Action
 * (Local API, overrideAccess), readable only by logged-in Payload admins.
 */
export const ErasureRequests: CollectionConfig = {
  slug: "erasure-requests",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "customerId", "status", "createdAt"],
    description:
      "Account-deletion (GDPR erasure) requests from the storefront profile page. Follow the SOP in docs/OPS.md to complete each one.",
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
      admin: { description: "Vendure customer id to erase." },
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "locale",
      type: "select",
      defaultValue: "ar",
      options: [
        { label: "Arabic", value: "ar" },
        { label: "English", value: "en" },
      ],
    },
    {
      name: "status",
      type: "select",
      defaultValue: "new",
      options: [
        { label: "New", value: "new" },
        { label: "In progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "Rejected", value: "rejected" },
      ],
      admin: {
        description:
          "Ops moves this through the SOP: erase in Vendure admin, purge Payload/backup references, then mark completed.",
      },
    },
    {
      name: "notes",
      type: "textarea",
      admin: { description: "Ops notes: what was erased where, and when." },
    },
  ],
}
