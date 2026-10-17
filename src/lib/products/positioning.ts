import type { Dictionary } from "@/lib/i18n/dictionaries"
import type { Product, ProductCategory } from "./types"

/**
 * Need-based navigation ("shop by need") and per-product audience lines.
 *
 * Deliberately a small code-level map rather than a new CMS field: every
 * label here is an already-approved dictionary string (the positioning
 * matrix's gender/concern labels, the category names) recombined — nothing
 * new is claimed about any product. Keyed by slug so it works identically
 * against the Payload catalog and the mock fallback.
 */

export type Gender = "men" | "women"
export type Concern = "fertility" | "wellness"

/** Company-profile §4.1a positioning: one gender × concern cell per supplement. */
export const PRODUCT_POSITIONING: Record<string, { gender: Gender; concern: Concern }> = {
  "proxeed-plus": { gender: "men", concern: "fertility" },
  "proxeed-men": { gender: "men", concern: "fertility" },
  "proxeed-women": { gender: "women", concern: "fertility" },
  "proxeed-women-inositol": { gender: "women", concern: "fertility" },
  proxerex: { gender: "men", concern: "wellness" },
  ellamuselle: { gender: "women", concern: "wellness" },
}

export type NeedId = "mensHealth" | "womensHealth" | "medicalDevices" | "dental"

export type NeedDefinition = {
  id: NeedId
  /** URL value for `/products?need=` */
  param: string
  /** Matches products either by explicit slug list or by category slug. */
  slugs?: string[]
  categorySlug?: string
  /** Announced line with no products yet — rendered as a non-link tile. */
  comingSoon?: boolean
}

export const NEEDS: NeedDefinition[] = [
  { id: "mensHealth", param: "mens-health", slugs: ["proxeed-plus", "proxeed-men", "proxerex"] },
  {
    id: "womensHealth",
    param: "womens-health",
    slugs: ["proxeed-women", "proxeed-women-inositol", "ellamuselle"],
  },
  { id: "medicalDevices", param: "medical-devices", categorySlug: "medical-devices" },
  { id: "dental", param: "dental", categorySlug: "dental", comingSoon: true },
]

export function findNeed(param: string | undefined): NeedDefinition | undefined {
  if (!param) return undefined
  return NEEDS.find((need) => need.param === param)
}

export function productMatchesNeed(product: Product, need: NeedDefinition): boolean {
  if (need.slugs?.includes(product.slug)) return true
  if (need.categorySlug && product.categorySlug === need.categorySlug) return true
  return false
}

export function productsForNeed(products: Product[], need: NeedDefinition): Product[] {
  return products.filter((product) => productMatchesNeed(product, need))
}

/**
 * "Who is it for?" — e.g. "رجال · دعم الخصوبة". Supplements use the
 * positioning matrix labels; anything else (devices, future lines) falls
 * back to its category name, which is always a safe, already-published
 * description.
 */
export function getAudienceLabel(
  product: Pick<Product, "slug" | "categorySlug">,
  // Only the matrix labels are read, so both `Dictionary` and the
  // function-free `ClientSafeDictionary` fit.
  dictionary: { products: { matrix: Dictionary["products"]["matrix"] } },
  categories: Pick<ProductCategory, "slug" | "name">[] = []
): string | undefined {
  const cell = PRODUCT_POSITIONING[product.slug]
  if (cell) {
    const matrix = dictionary.products.matrix
    const gender = cell.gender === "men" ? matrix.genderMen : matrix.genderWomen
    const concern = cell.concern === "fertility" ? matrix.concernFertility : matrix.concernWellness
    return `${gender} · ${concern}`
  }
  return categories.find((category) => category.slug === product.categorySlug)?.name
}
