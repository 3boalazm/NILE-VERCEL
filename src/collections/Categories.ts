import type { CollectionConfig } from "payload"

/**
 * Mirrors `ProductCategory` in src/lib/products/types.ts — the shape the
 * app already renders. Once `PayloadProductRepository` is wired in, this
 * collection becomes the source of truth and the mock type moves to
 * being the app-facing DTO the repository maps onto.
 */
export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "status"],
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
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Coming soon", value: "coming_soon" },
      ],
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "translations",
      type: "group",
      fields: [
        {
          name: "en",
          type: "group",
          fields: [
            { name: "name", type: "text" },
            { name: "description", type: "textarea" },
          ],
        },
      ],
    },
  ],
}
