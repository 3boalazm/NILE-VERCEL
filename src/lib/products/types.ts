import type { SkuEvidencePack } from "./evidence-pack"

/**
 * Commerce/catalog status. This is not search-index eligibility.
 * An `active` row can still be noindex. Eligibility is derived in
 * `src/lib/seo/indexability.ts` (`SearchIndexDecision`) and must not be
 * stored as a second boolean that can drift from that gate.
 */
export type ProductStatus = "active" | "paused" | "launching_soon"

/** English overrides for a category's locale-bearing fields — see `localizeCategory`. */
export type CategoryTranslation = {
  name?: string
  description?: string
}

export type ProductCategory = {
  id: string
  slug: string
  name: string
  description?: string
  /** Omitted/"active" = a real, live category. "coming_soon" = announced future line, no products yet. */
  status?: "active" | "coming_soon"
  /** Dedicated category photo. When absent, the homepage falls back to a representative product's image. */
  image?: string | null
  /** en: English copy for this category's name/description. Base fields above stay Arabic. */
  translations?: { en?: CategoryTranslation }
}

export type SpecItem = {
  label: string
  value: string
}

export type FaqItem = {
  question: string
  answer: string
}

export type Testimonial = {
  quote: string
  author?: string
}

export type ClinicalReference = {
  title: string
  authors?: string
  year?: string
  url?: string
  /**
   * Plain-language limitation note rendered with the citation — e.g. that a
   * study was preclinical (mouse embryos) or had no placebo control group.
   * Added 2026-09-24 so a cited paper can never be read as stronger evidence
   * than it is; see docs/reviews/2026-09-24-scientific-content-review-ar.md.
   */
  note?: string
}

/** English overrides for a product's locale-bearing fields — see `localizeProduct`. */
export type ProductTranslation = {
  shortDescription?: string
  keyBenefits?: string[]
  composition?: SpecItem[]
  compositionNote?: string
  usage?: string
  availableForm?: string
  scientificInfo?: string
  faq?: FaqItem[]
  testimonials?: Testimonial[]
  clinicalReferences?: ClinicalReference[]
}

/**
 * Shape mirrors the fields NPF's storefront actually renders. Once Vendure
 * is wired in, `VendureProductRepository` maps its Shop API response onto
 * this same type — components never import Vendure/GraphQL types directly.
 */
export type Product = {
  id: string
  slug: string
  /** Latin product name. Authoritative on English pages. Do not overwrite with a translation. */
  name: string
  /**
   * Stored Arabic display name. Arabic title, H1, and Product schema `name`
   * must use this string. Do not invent a translation when it is missing.
   * There is no `brand` or `manufacturer` field. Do not infer one.
   */
  nameArabic?: string
  categorySlug: string
  status: ProductStatus
  /** Core positioning statement — one line, evidence-safe. */
  shortDescription: string
  /** Evidence-graded benefit/claim lines — already written, don't rephrase. */
  keyBenefits: string[]
  /** Composition or, for devices, technical specs. */
  composition?: SpecItem[]
  compositionNote?: string
  usage?: string
  availableForm?: string
  /**
   * Citation-level evidence tier + caveats, distinct from the punchier
   * `keyBenefits` bullets — e.g. "ingredient-level evidence, not a trial of
   * this product" or "does not extend to general PCOS." Source: verified
   * clinical-evidence table in CONTENT-PAGE-MAPPING.md Section E, carried
   * over from the old site's PDP structure (Hero/Overview/Key Benefits/
   * Composition/Usage/Scientific Information/Downloads). Omitted for the two
   * CA-MI devices — spec-based products, no clinical-evidence framing applies.
   */
  scientificInfo?: string
  /**
   * Official patient/consumer leaflet PDF (source: verified against the
   * actual print-artwork file in E:\Work\NPF\New Box — genuine multi-
   * language consumer insert, not an internal regulatory doc, per
   * CONTENT-PAGE-MAPPING.md Section B's "pending a decision" flag, now
   * resolved). One file covers both locales — the PDF itself is already
   * multi-language (EN/FR/AR/NL) — so this is locale-agnostic, no
   * translations.en override needed. Omitted where no genuine leaflet
   * exists on file (Proxerex, Ellamuselle, the two CA-MI devices) —
   * do not substitute a box-artwork or campaign PDF instead.
   */
  downloadUrl?: string
  /**
   * Per-product FAQ, testimonials, and clinical-paper citations — source:
   * Ahmed's old-site Miro board, found 2026-08-31 (see
   * `Miro-Product-Content-Found_2026-08-31.md` and CONTENT-PAGE-MAPPING.md
   * Section F.1). Genuinely new PDP sections, not part of the original
   * Hero/Overview/Key Benefits/Composition/Usage/Scientific Info/Downloads
   * structure — omitted entirely for products with no sourced content
   * (don't invent a generic FAQ or testimonial for those).
   */
  faq?: FaqItem[]
  testimonials?: Testimonial[]
  clinicalReferences?: ClinicalReference[]
  image?: string | null
  gallery?: string[]
  sku?: string
  /** Pricing provenance: only live prices may create structured-data offers. */
  priceSource?: "live" | "demo" | "unavailable"
  price?: number
  currency?: string
  /**
   * en: English copy for this product's evidence/claim text (shortDescription,
   * keyBenefits, composition, etc). Base fields above stay Arabic — `name` is
   * already locale-neutral (Latin product names like "Proxeed Plus") and
   * needs no override. See `localizeProduct`.
   */
  translations?: { en?: ProductTranslation }
  /**
   * Optional server-side evidence attachment. Not a Payload field and not
   * a storefront input. Absence means the pack is missing, not approved.
   */
  evidencePack?: SkuEvidencePack
}
