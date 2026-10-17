import type { Product, ProductCategory } from "@/lib/products/types"
import { productIndexDecision, type IndexBlockReason } from "@/lib/seo/indexability"
import { canExposeField, skuAssessment, type EvidenceState } from "@/lib/seo/sku-evidence"

/**
 * Commercial-search profile for a catalog row.
 * States describe stored data. They do not fill gaps.
 * Brand and manufacturer have no catalog field, so they stay missing.
 * A leaflet file is not claim clearance.
 */

export const FIELD_STATES = ["VERIFIED", "UNVERIFIED", "MISSING", "CONFLICTING", "NOT_APPLICABLE"] as const
export type FieldState = EvidenceState

export type CommercialFactKey = "category" | "form" | "sku" | "availability" | "brand" | "manufacturer"

export type CommercialFact = {
  key: CommercialFactKey
  value: string
}

export type CommercialSections = {
  benefits: boolean
  usage: boolean
  composition: boolean
  science: boolean
  leaflet: boolean
  existingFaq: boolean
  /** Never rendered. There is no stored brand field. */
  brand: false
  /** Never rendered. There is no stored manufacturer field. */
  manufacturer: false
  /** This template does not invent FAQ items. */
  generatedFaq: false
}

export type CommercialProfile = {
  slug: string
  indexable: boolean
  indexReasons: IndexBlockReason[]
  fields: {
    name: FieldState
    arabicName: FieldState
    category: FieldState
    description: FieldState
    image: FieldState
    brand: FieldState
    manufacturer: FieldState
    packForm: FieldState
    price: FieldState
    availability: FieldState
    composition: FieldState
    leaflet: FieldState
    evidence: FieldState
  }
  searchReadiness: "READY" | "BLOCKED"
  blockingReason: string
  faqReadiness: "EXISTING_CATALOG_FAQ" | "NOT_PUBLISHED"
  sections: CommercialSections
}

function present(value: string | undefined | null): boolean {
  return Boolean(value?.trim())
}

export function commercialProfile(product: Product): CommercialProfile {
  const decision = productIndexDecision(product)
  const assessment = skuAssessment(product)
  const fields = {
    name: assessment.fields.name.state,
    arabicName: assessment.fields.nameArabic.state,
    category: assessment.fields.category.state,
    description: assessment.fields.shortDescription.state,
    image: assessment.fields.image.state,
    brand: assessment.fields.brand.state,
    manufacturer: assessment.fields.manufacturer.state,
    packForm: assessment.fields.form.state,
    price: assessment.fields.price.state,
    availability: assessment.fields.availability.state,
    composition: assessment.fields.composition.state,
    leaflet: assessment.fields.leaflet.state,
    evidence: assessment.evidence,
  } satisfies CommercialProfile["fields"]

  return {
    slug: product.slug,
    indexable: decision.eligible,
    indexReasons: decision.reasons,
    fields,
    searchReadiness: decision.eligible ? "READY" : "BLOCKED",
    blockingReason: assessment.blockingReason,
    faqReadiness: product.faq && product.faq.length > 0 ? "EXISTING_CATALOG_FAQ" : "NOT_PUBLISHED",
    sections: commercialSections(product),
  }
}

export function commercialSections(product: Product): CommercialSections {
  return {
    benefits: canExposeField(product, "keyBenefits", "PRODUCT_PAGE"),
    usage: canExposeField(product, "usage", "PRODUCT_PAGE"),
    composition: canExposeField(product, "composition", "PRODUCT_PAGE"),
    science: canExposeField(product, "scientificInfo", "PRODUCT_PAGE"),
    leaflet: present(product.downloadUrl),
    existingFaq: canExposeField(product, "faq", "PRODUCT_PAGE"),
    brand: false,
    manufacturer: false,
    generatedFaq: false,
  }
}

export function commercialFacts(
  product: Product,
  labels: { categoryName?: string; availability: string },
  source: Product = product
): CommercialFact[] {
  const facts: CommercialFact[] = []
  if (canExposeField(source, "category", "PRODUCT_PAGE") && present(labels.categoryName)) {
    facts.push({ key: "category", value: labels.categoryName!.trim() })
  }
  if (canExposeField(source, "form", "PRODUCT_PAGE") && present(product.availableForm)) {
    facts.push({ key: "form", value: product.availableForm!.trim() })
  }
  if (canExposeField(source, "sku", "PRODUCT_PAGE") && present(product.sku)) {
    facts.push({ key: "sku", value: product.sku!.trim() })
  }
  if (canExposeField(source, "availability", "COMMERCIAL_COPY") && present(labels.availability)) {
    facts.push({ key: "availability", value: labels.availability.trim() })
  }
  const brand = source.evidencePack?.brand
  if (canExposeField(source, "brand", "PRODUCT_PAGE") && brand?.name.trim()) {
    facts.push({ key: "brand", value: brand.name.trim() })
  }
  const manufacturer = source.evidencePack?.manufacturer
  if (canExposeField(source, "manufacturer", "PRODUCT_PAGE") && manufacturer?.name.trim()) {
    facts.push({ key: "manufacturer", value: manufacturer.name.trim() })
  }
  return facts
}

export type CategoryLandingDecision = {
  slug: string
  publishable: false
  reason: string
}

/**
 * No current category clears a dedicated landing page.
 * Filters stay on `/products`. This function is the gate a future
 * cleared category would have to pass; it does not create a route.
 */
export function categoryLandingDecision(
  category: ProductCategory,
  products: readonly Product[]
): CategoryLandingDecision {
  const members = products.filter((product) => product.categorySlug === category.slug)
  if (category.status === "coming_soon" || members.length === 0) {
    return { slug: category.slug, publishable: false, reason: "no real products" }
  }
  const indexable = members.filter((product) => productIndexDecision(product).eligible)
  if (indexable.length === 0) {
    return { slug: category.slug, publishable: false, reason: "no indexable products" }
  }
  if (category.slug === "medical-devices") {
    return {
      slug: category.slug,
      publishable: false,
      reason: "brand field is not stored; devices stay on the catalog canonical",
    }
  }
  return { slug: category.slug, publishable: false, reason: "no cleared category landing record" }
}
