import type { CollectionConfig } from "payload"

/**
 * Job postings ("الوظائف"). The careers page and each role's own page render
 * from this collection, so the client can publish a vacancy — with its own
 * application button — without a deploy.
 *
 * `status` is the gate: `open` postings are live, `paused`/`closed` are
 * filtered out of every storefront query by the job repository. A posting
 * whose `closingDate` has passed also drops off automatically, so a stale ad
 * can never sit on the site after the deadline.
 */
export const Jobs: CollectionConfig = {
  slug: "jobs",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "department", "location", "postedAt"],
    group: "Content",
    description:
      "الوظائف المتاحة. «open» تظهر على الموقع فورًا، و«paused» أو «closed» لا تظهر للزوار. لو حددت تاريخ إغلاق، الوظيفة تختفي تلقائيًا بعده.",
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
      admin: { description: "معرّف الرابط، مثل: medical-representative-cairo" },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "closed",
      options: [
        { label: "معلنة — Open", value: "open" },
        { label: "موقوفة مؤقتًا — Paused", value: "paused" },
        { label: "مغلقة — Closed", value: "closed" },
      ],
      admin: { description: "لا تظهر على الموقع إلا الوظائف بحالة «معلنة»." },
    },
    { name: "title", type: "text", required: true, label: "المسمى الوظيفي" },
    {
      name: "summary",
      type: "textarea",
      required: true,
      label: "وصف مختصر",
      admin: { description: "سطر أو سطران يظهران في الكارت." },
    },
    {
      name: "department",
      type: "text",
      required: true,
      label: "القسم",
      admin: { description: "مثل: المبيعات، التسويق، العمليات، خدمة العملاء" },
    },
    { name: "location", type: "text", required: true, label: "الموقع" },
    {
      name: "workMode",
      type: "select",
      label: "نمط العمل",
      options: [
        { label: "من المكتب — On-site", value: "onsite" },
        { label: "هجين — Hybrid", value: "hybrid" },
        { label: "عن بُعد — Remote", value: "remote" },
      ],
    },
    {
      name: "employmentType",
      type: "select",
      required: true,
      defaultValue: "full-time",
      label: "نوع التعاقد",
      options: [
        { label: "دوام كامل", value: "full-time" },
        { label: "دوام جزئي", value: "part-time" },
        { label: "تعاقد", value: "contract" },
        { label: "تدريب", value: "internship" },
      ],
    },
    {
      name: "experience",
      type: "text",
      label: "الخبرة المطلوبة",
      admin: { description: "نص حر، مثل: «٣–٥ سنوات» أو «خبرة حديثة التخرج»" },
    },
    {
      name: "responsibilities",
      type: "array",
      required: true,
      label: "المسؤوليات",
      labels: { singular: "مسؤولية", plural: "المسؤوليات" },
      fields: [{ name: "text", type: "textarea", required: true }],
    },
    {
      name: "requirements",
      type: "array",
      required: true,
      label: "المتطلبات",
      labels: { singular: "متطلب", plural: "المتطلبات" },
      fields: [{ name: "text", type: "textarea", required: true }],
    },
    {
      name: "niceToHave",
      type: "array",
      label: "يُفضّل وجوده",
      labels: { singular: "ميزة إضافية", plural: "مزايا إضافية" },
      fields: [{ name: "text", type: "textarea", required: true }],
    },
    {
      name: "postedAt",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
      label: "تاريخ النشر",
      admin: { description: "يُستخدم للترتيب في صفحة الوظائف." },
    },
    {
      name: "closingDate",
      type: "date",
      label: "تاريخ الإغلاق",
      admin: { description: "اختياري: بعد هذا التاريخ تختفي الوظيفة من الموقع تلقائيًا." },
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
              name: "responsibilities",
              type: "array",
              labels: { singular: "Responsibility", plural: "Responsibilities" },
              fields: [{ name: "text", type: "textarea", required: true }],
            },
            {
              name: "requirements",
              type: "array",
              labels: { singular: "Requirement", plural: "Requirements" },
              fields: [{ name: "text", type: "textarea", required: true }],
            },
            {
              name: "niceToHave",
              type: "array",
              labels: { singular: "Nice to have", plural: "Nice to have" },
              fields: [{ name: "text", type: "textarea", required: true }],
            },
            { name: "location", type: "text" },
            { name: "department", type: "text" },
          ],
        },
      ],
    },
  ],
}
