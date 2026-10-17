import type { CollectionConfig } from "payload"

/**
 * Marketing/content fields only — mirrors the non-commerce subset of
 * `Product` in src/lib/products/types.ts. SKU, price, stock, and
 * availability stay in Vendure; `vendureProductId` is the only bridge
 * between the two systems (ADR-007).
 */
export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "category", "status"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "nameArabic",
      type: "text",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Paused", value: "paused" },
        { label: "Launching soon", value: "launching_soon" },
      ],
    },
    {
      name: "shortDescription",
      type: "textarea",
      required: true,
    },
    {
      name: "keyBenefits",
      type: "array",
      labels: { singular: "Benefit", plural: "Key benefits" },
      fields: [
        {
          name: "text",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "composition",
      type: "array",
      labels: { singular: "Spec item", plural: "Composition" },
      fields: [
        { name: "label", type: "text", required: true },
        { name: "value", type: "text", required: true },
      ],
    },
    {
      name: "compositionNote",
      type: "text",
    },
    {
      name: "usage",
      type: "textarea",
    },
    {
      name: "availableForm",
      type: "text",
    },
    {
      name: "scientificInfo",
      type: "textarea",
    },
    {
      name: "downloadUrl",
      type: "text",
    },
    {
      name: "faq",
      type: "array",
      labels: { singular: "FAQ item", plural: "FAQ" },
      admin: {
        description:
          "Source: Ahmed's old-site Miro board (2026-08-31) — see Miro-Product-Content-Found_2026-08-31.md. Leave empty rather than inventing a generic FAQ.",
      },
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },
    {
      name: "testimonials",
      type: "array",
      labels: { singular: "Testimonial", plural: "Testimonials" },
      fields: [
        { name: "quote", type: "textarea", required: true },
        { name: "author", type: "text" },
      ],
    },
    {
      name: "clinicalReferences",
      type: "array",
      labels: { singular: "Reference", plural: "Clinical References" },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "authors", type: "text" },
        { name: "year", type: "text" },
        { name: "url", type: "text" },
        { name: "note", type: "textarea" },
      ],
    },
    {
      name: "translations",
      type: "group",
      fields: [
        {
          name: "en",
          type: "group",
          fields: [
            { name: "shortDescription", type: "textarea" },
            {
              name: "keyBenefits",
              type: "array",
              labels: { singular: "Benefit", plural: "Key benefits" },
              fields: [{ name: "text", type: "text", required: true }],
            },
            {
              name: "composition",
              type: "array",
              labels: { singular: "Spec item", plural: "Composition" },
              fields: [
                { name: "label", type: "text", required: true },
                { name: "value", type: "text", required: true },
              ],
            },
            { name: "compositionNote", type: "text" },
            { name: "usage", type: "textarea" },
            { name: "availableForm", type: "text" },
            { name: "scientificInfo", type: "textarea" },
            {
              name: "faq",
              type: "array",
              labels: { singular: "FAQ item", plural: "FAQ" },
              fields: [
                { name: "question", type: "text", required: true },
                { name: "answer", type: "textarea", required: true },
              ],
            },
            {
              name: "testimonials",
              type: "array",
              labels: { singular: "Testimonial", plural: "Testimonials" },
              fields: [
                { name: "quote", type: "textarea", required: true },
                { name: "author", type: "text" },
              ],
            },
            {
              name: "clinicalReferences",
              type: "array",
              labels: { singular: "Reference", plural: "Clinical References" },
              fields: [
                { name: "title", type: "text", required: true },
                { name: "authors", type: "text" },
                { name: "year", type: "text" },
                { name: "url", type: "text" },
                { name: "note", type: "textarea" },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "gallery",
      type: "array",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "vendureProductId",
      type: "text",
      // Temporarily optional: Vendure now exists (apps/commerce) and has its
      // own copy of this catalog, but the two aren't linked yet — Vendure's
      // product IDs haven't been backfilled here. Required + unique
      // reinstated once that linking pass happens — never fill this with an
      // invented value in the meantime.
      unique: true,
      index: true,
      admin: {
        description:
          "Link to the matching product in Vendure, by ID (ADR-007). Set once at creation — locked against edits after that by the hook below, not just hidden in the UI. Temporarily optional until Vendure exists.",
      },
      hooks: {
        beforeChange: [
          ({ operation, value, originalDoc }) => {
            if (operation === "update" && originalDoc?.vendureProductId) {
              return originalDoc.vendureProductId
            }
            return value
          },
        ],
      },
    },
  ],
}
