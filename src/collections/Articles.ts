import type { CollectionConfig } from "payload"

/**
 * Articles ("المدونة"). One row per published paper NPF explains: a verified
 * bibliographic block (`source`) plus NPF's own graded prose.
 *
 * `status` is the safety catch. Articles built from sources whose metadata we
 * corrected, or whose claim we could not reconcile with the paper, are seeded
 * as `review`/`draft` and are filtered out of every storefront query — the
 * client flips one row to `published` once they approve it, no deploy needed.
 */
export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "evidenceTier", "product", "updatedAt"],
    group: "Content",
    description:
      "مقالات المدونة العلمية. الحالة «published» تعني ظهور المقال على الموقع، و«review» أو «draft» تعني أنه محجوز للمراجعة ولا يظهر للزوار.",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "معرّف الرابط، مثل: micic-2019-sperm-parameters-trial" },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "منشور — Published", value: "published" },
        { label: "للمراجعة — Review", value: "review" },
        { label: "مسودة — Draft", value: "draft" },
      ],
      admin: {
        description:
          "published = يظهر على الموقع. review/draft = محجوز ولا يظهر للزوار، ويظل مرئيًا هنا فقط.",
      },
    },
    {
      name: "evidenceTier",
      type: "select",
      required: true,
      defaultValue: "ingredient",
      options: [
        { label: "تجربة عشوائية على المنتج نفسه", value: "direct-rct" },
        { label: "دراسة على المنتج نفسه (تصميم أضعف)", value: "direct-other" },
        { label: "مراجعة منهجية / تحليل تلوي", value: "systematic-review" },
        { label: "دليل على مستوى المكوّن", value: "ingredient" },
      ],
      admin: { description: "يُعرض كوسم على المقال لبيان قوة الدليل." },
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      admin: { description: "المنتج الذي يتعلق به المقال (يظهر كزر انتقال إليه)." },
    },
    { name: "title", type: "text", required: true, label: "العنوان (عربي)" },
    { name: "summary", type: "textarea", required: true, label: "الملخص (عربي)" },
    {
      name: "keyFindings",
      type: "array",
      label: "أهم النتائج (عربي)",
      labels: { singular: "نتيجة", plural: "النتائج" },
      fields: [{ name: "text", type: "textarea", required: true }],
    },
    {
      name: "caveat",
      type: "textarea",
      required: true,
      label: "ما لا تقوله هذه الدراسة (عربي)",
      admin: {
        description: "إلزامي: كل مقال منشور يجب أن يوضّح حدود الدليل، لا نتائجه فقط.",
      },
    },
    {
      name: "source",
      type: "group",
      label: "المصدر المنشور (متحقَّق منه — لا يُعاد صياغته)",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "authors", type: "text", required: true },
        { name: "journal", type: "text", required: true },
        { name: "year", type: "text", required: true },
        {
          name: "type",
          type: "text",
          required: true,
          admin: { description: "نوع الدراسة بالعربية، مثل: تجربة عشوائية معشّاة مزدوجة" },
        },
        { name: "doi", type: "text", admin: { description: "بدون بادئة https://doi.org/" } },
        { name: "url", type: "text" },
        { name: "pubmedId", type: "text", admin: { description: "PMID أو PMCID إن وُجد" } },
      ],
    },
    {
      name: "reviewNote",
      type: "textarea",
      label: "ملاحظة داخلية (سبب الحجب أو التصحيح)",
      admin: { description: "تظهر هنا فقط — لا تُعرض على الموقع مطلقًا." },
    },
    {
      name: "translations",
      type: "group",
      fields: [
        {
          name: "en",
          type: "group",
          label: "English",
          fields: [
            { name: "title", type: "text" },
            { name: "summary", type: "textarea" },
            {
              name: "keyFindings",
              type: "array",
              labels: { singular: "Finding", plural: "Findings" },
              fields: [{ name: "text", type: "textarea", required: true }],
            },
            { name: "caveat", type: "textarea" },
            { name: "reviewNote", type: "textarea" },
            {
              name: "source",
              type: "group",
              fields: [
                { name: "type", type: "text" },
                { name: "journal", type: "text" },
              ],
            },
          ],
        },
      ],
    },
  ],
}
