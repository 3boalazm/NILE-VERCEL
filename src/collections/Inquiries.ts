import type { CollectionConfig } from "payload"

/**
 * Contact-form submissions ("request info" / inquiries). Written only by
 * the `submitContactInquiry` Server Action via the Local API with
 * `overrideAccess` — never directly through the public REST/GraphQL API
 * (create is locked for everyone there, and read/update/delete require a
 * logged-in Payload admin user). The sales team triages from the admin
 * panel via the `status` field.
 */
export const Inquiries: CollectionConfig = {
  slug: "inquiries",
  admin: {
    useAsTitle: "subject",
    defaultColumns: ["subject", "name", "email", "status", "createdAt"],
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "company",
      type: "text",
    },
    {
      name: "locale",
      type: "select",
      defaultValue: "ar",
      options: [
        { label: "Arabic", value: "ar" },
        { label: "English", value: "en" },
      ],
      admin: {
        description: "Which site language the visitor submitted from.",
      },
    },
    {
      name: "subject",
      type: "text",
      required: true,
    },
    {
      name: "message",
      type: "textarea",
      required: true,
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [
        { label: "New", value: "new" },
        { label: "Read", value: "read" },
        { label: "Replied", value: "replied" },
      ],
      admin: {
        description: "Triage state for the sales team — set by admins, never by the form.",
      },
    },
  ],
}
