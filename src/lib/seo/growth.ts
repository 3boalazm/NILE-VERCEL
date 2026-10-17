import { isReservedUnpublishedHub, HUB_REGISTRY } from "@/lib/content/registry"
import { isCanonicalContentHref, type CanonicalLink } from "@/lib/content/links"
import { getDictionary } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"
import { localizeProduct } from "@/lib/products/localize"
import type { Product } from "@/lib/products/types"

import { buildFaqJsonLd, type FaqSchemaItem } from "./faq-schema"
import { buildImageSitemapEntries, toSeoImage, type ImageSitemapEntry, type SeoImage } from "./image-metadata"
import { productHeading } from "./product-identity"
import { CANONICAL_ORIGIN } from "./site"
import {
  canExposeField,
  isProductSearchEligible,
  productIndexDecision,
  searchDescription,
  type IndexBlockReason,
} from "./sku-evidence"

/**
 * Search-growth contracts.
 * They read the closed eligibility gate. They do not change it, approve a
 * claim, or publish a hub.
 */

export const SEARCH_INTENTS = ["informational", "commercial", "navigational", "product"] as const
export type SearchIntent = (typeof SEARCH_INTENTS)[number]

export const ROUTE_INTENT = [
  { path: "", intent: "navigational", exists: true },
  { path: "/about", intent: "navigational", exists: true },
  { path: "/story", intent: "navigational", exists: true },
  { path: "/contact", intent: "navigational", exists: true },
  { path: "/quality-sourcing", intent: "informational", exists: true },
  { path: "/products", intent: "commercial", exists: true },
  { path: "/products/[slug]", intent: "product", exists: true },
] as const

export const GEO_CONTRACT = {
  origin: CANONICAL_ORIGIN,
  primaryLocale: "ar",
  alternateLocale: "en",
  currency: "EGP",
  locationPages: [],
  excludedHosts: ["nilepharma.com.eg"],
  searchAction: false,
} as const

/** Identity this storefront must not emit. Not a profile of that company. */
export const SEPARATED_ORGANIZATION = {
  hosts: ["nilepharma.com.eg"],
  names: ["El-Nile Co. for Pharmaceuticals and Chemical Industries", "El-Nile Co. for Pharmaceuticals"],
} as const

const SPEC_COUNT = 2

const NO_OUTCOME = {
  en: "This page is not published and must not say that a product treats, cures, prevents, or guarantees a condition.",
  ar: "هذه الصفحة غير منشورة، ولا يجوز أن تقول إن منتجًا يعالج أو يشفي أو يمنع أو يضمن حالة.",
} as const

export function organizationCollides(value: unknown): boolean {
  const raw = JSON.stringify(value)
  const lower = raw.toLowerCase()
  if (SEPARATED_ORGANIZATION.hosts.some((host) => lower.includes(host))) return true
  return SEPARATED_ORGANIZATION.names.some((name) => raw.includes(name))
}

/** Other stored trade name only. Legal identity fields are not added. */
export function withStoredTradeAlternate(
  organization: Record<string, unknown>,
  locale: Locale
): Record<string, unknown> {
  const alternate = getDictionary(locale === "ar" ? "en" : "ar").siteName.trim()
  const name = typeof organization.name === "string" ? organization.name.trim() : ""
  const next = alternate && alternate !== name ? { ...organization, alternateName: alternate } : { ...organization }
  if (!organizationCollides(next)) return next
  const rest = { ...next }
  delete rest.alternateName
  return rest
}

export function growthSearchDescription(display: Product, locale: Locale, source: Product = display): string {
  const base = searchDescription(display, locale, source)
  if (!isProductSearchEligible(source) || !canExposeField(source, "composition", "PRODUCT_SCHEMA")) return base
  const specs = (display.composition ?? [])
    .filter((row) => row.label.trim() && row.value.trim())
    .slice(0, SPEC_COUNT)
    .map((row) => `${row.label.trim()}: ${row.value.trim()}`)
  return specs.length > 0 ? [base, ...specs].join(". ") : base
}

export function productImageAlt(display: Product, locale: Locale, source: Product = display): string {
  const heading = productHeading(display, locale).trim()
  if (!isProductSearchEligible(source) || !canExposeField(source, "form", "PRODUCT_SCHEMA")) return heading
  const form = display.availableForm?.trim()
  if (!form || form === heading) return heading
  return `${heading} — ${form}`
}

export type ProductGrowthContract = {
  sku: string | null
  slug: string
  indexable: boolean
  intent: "product"
  titles: Record<Locale, string>
  descriptions: Record<Locale, string>
  imageAlts: Record<Locale, string>
  canonicalPaths: Record<Locale, string>
  blockReasons: IndexBlockReason[]
  omittedFields: string[]
  faqSchema: null
}

function omittedFields(product: Product): string[] {
  const names = ["brand", "manufacturer", "shortDescription", "keyBenefits", "usage", "scientificInfo", "faq"] as const
  return names.filter((name) => !canExposeField(product, name, "PRODUCT_SCHEMA"))
}

export function productGrowthContract(product: Product): ProductGrowthContract {
  const decision = productIndexDecision(product)
  const titles = { ar: productHeading(product, "ar"), en: productHeading(localizeProduct(product, "en"), "en") }
  const descriptions = {
    ar: growthSearchDescription(product, "ar", product),
    en: growthSearchDescription(localizeProduct(product, "en"), "en", product),
  }
  const imageAlts = {
    ar: productImageAlt(product, "ar", product),
    en: productImageAlt(localizeProduct(product, "en"), "en", product),
  }
  return {
    sku: product.sku?.trim() || null,
    slug: product.slug,
    indexable: decision.eligible,
    intent: "product",
    titles,
    descriptions,
    imageAlts,
    canonicalPaths: {
      ar: `/ar/products/${product.slug}`,
      en: `/en/products/${product.slug}`,
    },
    blockReasons: decision.reasons,
    omittedFields: omittedFields(product),
    faqSchema: catalogProductFaqJsonLd(product),
  }
}

export type FactualAnswer = {
  id: string
  locale: Locale
  intent: "product"
  layer: "factual_product"
  term: string
  fact: string
  sourceField: "form" | "sku" | "composition"
  evidenceApproved: false
  schemaEligible: false
}

export function factualAnswers(display: Product, locale: Locale, source: Product = display): FactualAnswer[] {
  if (!isProductSearchEligible(source)) return []
  const answers: FactualAnswer[] = []
  const form = canExposeField(source, "form", "PRODUCT_SCHEMA") ? display.availableForm?.trim() : ""
  if (form) {
    answers.push({
      id: `${source.slug}-form-${locale}`,
      locale,
      intent: "product",
      layer: "factual_product",
      term: "form",
      fact: form,
      sourceField: "form",
      evidenceApproved: false,
      schemaEligible: false,
    })
  }
  const sku = canExposeField(source, "sku", "PRODUCT_SCHEMA") ? display.sku?.trim() : ""
  if (sku) {
    answers.push({
      id: `${source.slug}-sku-${locale}`,
      locale,
      intent: "product",
      layer: "factual_product",
      term: "sku",
      fact: sku,
      sourceField: "sku",
      evidenceApproved: false,
      schemaEligible: false,
    })
  }
  if (canExposeField(source, "composition", "PRODUCT_SCHEMA")) {
    for (const row of display.composition ?? []) {
      if (!row.label.trim() || !row.value.trim()) continue
      answers.push({
        id: `${source.slug}-spec-${locale}-${answers.length}`,
        locale,
        intent: "product",
        layer: "factual_product",
        term: row.label.trim(),
        fact: row.value.trim(),
        sourceField: "composition",
        evidenceApproved: false,
        schemaEligible: false,
      })
    }
  }
  return answers
}

/** Catalog FAQ text is not an approved answer. Schema stays null. */
export function catalogProductFaqJsonLd(product: Product): null {
  const items: FaqSchemaItem[] = [...(product.faq ?? []), ...(product.translations?.en?.faq ?? [])].map((item) => ({
    question: item.question,
    answer: item.answer,
    layer: "medical_claim",
    visibility: "hidden",
    reviewState: "draft",
    evidenceApproved: false,
  }))
  const schema = buildFaqJsonLd(items)
  return schema ? null : schema
}

export type TopicContract = {
  id: string
  translationGroupId: string
  hubPath: string
  publishable: false
  intent: "informational"
  pageType: "guide"
  evidenceRequirement: string
  audience: Record<Locale, string>
  allowedFactualScope: Record<Locale, string>
  titles: Record<Locale, string>
  summaries: Record<Locale, string>
  internalLinkTargets: readonly ["/products"]
  linkableSkus: readonly string[]
  withheldSkus: readonly string[]
  publicPath: null
}

const TOPIC_COPY = [
  {
    id: "nutrition",
    titles: { en: "Nutrition", ar: "التغذية" },
    audience: {
      en: "No audience is authorized until a reviewed page exists.",
      ar: "لا جمهور مصرح به قبل وجود صفحة مراجعة.",
    },
    allowedFactualScope: {
      en: "Stored catalog facts only, after the evidence gate passes.",
      ar: "حقائق الكتالوج المخزنة فقط، بعد اجتياز بوابة الأدلة.",
    },
  },
  {
    id: "mens-health",
    titles: { en: "Men's Health", ar: "صحة الرجال" },
    audience: {
      en: "A catalog gender label is not an audience authorization.",
      ar: "وسم الجنس في الكتالوج ليس تصريحًا لجمهور.",
    },
    allowedFactualScope: {
      en: "No health outcome wording. Medical review is required first.",
      ar: "لا صياغة لنتائج صحية. المراجعة الطبية مطلوبة أولًا.",
    },
  },
  {
    id: "womens-health",
    titles: { en: "Women's Health", ar: "صحة النساء" },
    audience: {
      en: "A catalog gender label is not an audience authorization.",
      ar: "وسم الجنس في الكتالوج ليس تصريحًا لجمهور.",
    },
    allowedFactualScope: {
      en: "No health outcome wording. Medical review is required first.",
      ar: "لا صياغة لنتائج صحية. المراجعة الطبية مطلوبة أولًا.",
    },
  },
  {
    id: "fertility",
    titles: { en: "Fertility", ar: "الخصوبة" },
    audience: {
      en: "No fertility-patient audience is authorized.",
      ar: "لا جمهور لمرضى الخصوبة مصرح به.",
    },
    allowedFactualScope: {
      en: "No fertility outcome wording until an approved sentence exists.",
      ar: "لا صياغة لنتائج الخصوبة قبل وجود جملة معتمدة.",
    },
  },
  {
    id: "sexual-health",
    titles: { en: "Sexual Health", ar: "الصحة الجنسية" },
    audience: {
      en: "No sexual-health patient audience is authorized.",
      ar: "لا جمهور للصحة الجنسية مصرح به.",
    },
    allowedFactualScope: {
      en: "No sexual-health outcome wording until an approved sentence exists.",
      ar: "لا صياغة لنتائج الصحة الجنسية قبل وجود جملة معتمدة.",
    },
  },
  {
    id: "educational-resources",
    titles: { en: "Educational Resources", ar: "مصادر تعليمية" },
    audience: {
      en: "No learner audience is authorized until reviewed copy exists.",
      ar: "لا جمهور متعلم مصرح به قبل وجود نص مراجع.",
    },
    allowedFactualScope: {
      en: "Reviewed educational copy only. No placeholder article.",
      ar: "نص تعليمي مراجع فقط. لا مقال بديل.",
    },
  },
] as const

export function topicArchitecture(withheldSkus: readonly string[]): TopicContract[] {
  return TOPIC_COPY.map((topic) => {
    const hub = HUB_REGISTRY.find((item) => item.id === topic.id)
    if (!hub || hub.publishable) throw new Error(`Topic ${topic.id} is not a reserved hub`)
    return {
      id: topic.id,
      translationGroupId: topic.id,
      hubPath: hub.path,
      publishable: false,
      intent: "informational",
      pageType: "guide",
      evidenceRequirement: hub.blockedBy ?? "medical-review",
      audience: topic.audience,
      allowedFactualScope: topic.allowedFactualScope,
      titles: topic.titles,
      summaries: {
        en: `${topic.allowedFactualScope.en} ${NO_OUTCOME.en}`,
        ar: `${topic.allowedFactualScope.ar} ${NO_OUTCOME.ar}`,
      },
      internalLinkTargets: ["/products"],
      linkableSkus: [],
      withheldSkus,
      publicPath: null,
    }
  })
}

export function homepageSearchLinks(locale: Locale, productsLabel: string): CanonicalLink[] {
  const href = `/${locale}/products`
  if (!isCanonicalContentHref(href) || isReservedUnpublishedHub("/products")) return []
  return [{ href, label: productsLabel, kind: "catalog" }]
}

export function productsHubSearchLinks(products: readonly Product[], locale: Locale): CanonicalLink[] {
  return products
    .filter((product) => isProductSearchEligible(product))
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((product) => ({
      href: `/${locale}/products/${product.slug}`,
      label: productHeading(product, locale),
      kind: "product" as const,
    }))
    .filter((link) => isCanonicalContentHref(link.href))
}

export function productPageSearchLinks(
  current: Product,
  products: readonly Product[],
  locale: Locale,
  productsLabel: string
): CanonicalLink[] {
  const related = products
    .filter(
      (product) =>
        product.slug !== current.slug &&
        product.categorySlug === current.categorySlug &&
        isProductSearchEligible(product)
    )
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((product) => ({
      href: `/${locale}/products/${product.slug}`,
      label: productHeading(product, locale),
      kind: "product" as const,
    }))
  const links: CanonicalLink[] = [{ href: `/${locale}/products`, label: productsLabel, kind: "catalog" }, ...related]
  return links.filter((link) => isCanonicalContentHref(link.href))
}

export function topicPublicLinks(topic: TopicContract): CanonicalLink[] {
  if (!topic.publishable || topic.publicPath === null) return []
  return []
}

export function eligibleProductImages(products: readonly Product[], locale: Locale): SeoImage[] {
  const images: SeoImage[] = []
  for (const product of products) {
    if (!isProductSearchEligible(product)) continue
    const display = localizeProduct(product, locale)
    const alt = productImageAlt(display, locale, product)
    const pagePath = `/${locale}/products/${product.slug}`
    for (const url of [product.image, ...(product.gallery ?? [])]) {
      const image = toSeoImage({ url, alt, pagePath, productSlug: product.slug })
      if (image) images.push(image)
    }
  }
  return images
}

/** Local entries only. No image-sitemap route is mounted. */
export function eligibleImageSitemapEntries(
  products: readonly Product[],
  locale: Locale,
  indexablePaths: ReadonlySet<string>
): ImageSitemapEntry[] {
  return buildImageSitemapEntries(eligibleProductImages(products, locale), indexablePaths)
}
