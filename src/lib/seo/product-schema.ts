import type { Locale } from "@/lib/i18n/config"
import type { Product, ProductStatus } from "@/lib/products/types"

import { productAlternateName, productHeading } from "./product-identity"
import { absoluteUrl } from "./site"
import { canExposeField, searchDescription, verifiedBrandName, verifiedManufacturerName } from "./sku-evidence"

/**
 * Product structured data.
 *
 * brand and manufacturer are omitted unless an approved evidence-pack
 * authorization names them. Do not copy the seller trade name, a product
 * name, or a category sentence into either field.
 * seller, when an offer exists, is the trade name already rendered in the
 * header (`dictionary.siteName`). It is not a legal name and not a brand.
 *
 * priceCurrency EGP is the ISO code for the currency label the PDP already
 * shows ("EGP" / "ج.م") and that the terms page already states. It is not
 * emitted without a numeric price.
 *
 * launching_soon emits no Offer. A preorder availability URL is not emitted:
 * this storefront has no reservation that takes payment.
 * availability maps from product.status, which is also what enables the
 * add-to-cart button. It is not a warehouse quantity — that quantity is
 * not on the product object.
 */

const IN_STOCK = "https://schema.org/InStock"
const OUT_OF_STOCK = "https://schema.org/OutOfStock"

export function offerAvailability(status: ProductStatus): typeof IN_STOCK | typeof OUT_OF_STOCK | null {
  if (status === "active") return IN_STOCK
  if (status === "paused") return OUT_OF_STOCK
  return null
}

type JsonLd = Record<string, unknown>

export function buildProductJsonLd(
  product: Product,
  locale: Locale,
  sellerName: string,
  categoryName?: string,
  /** Catalog row before localization. Exposure follows this record when provided. */
  catalogRecord: Product = product
): JsonLd {
  const heading = productHeading(product, locale)
  const alternateName = productAlternateName(product, locale)
  const url = absoluteUrl(`/${locale}/products/${product.slug}`)
  const availability = offerAvailability(product.status)
  const price =
    canExposeField(catalogRecord, "price", "PRODUCT_SCHEMA") &&
    typeof product.price === "number" &&
    Number.isFinite(product.price)
      ? product.price
      : undefined
  const seller = sellerName.trim()
  const description = searchDescription(product, locale, catalogRecord)
  const brand = verifiedBrandName(catalogRecord)
  const manufacturer = verifiedManufacturerName(catalogRecord)

  const offers =
    price !== undefined && availability
      ? {
          "@type": "Offer",
          price,
          priceCurrency: "EGP",
          availability,
          url,
          ...(seller ? { seller: { "@type": "Organization", name: seller } } : {}),
        }
      : undefined

  const specs = canExposeField(catalogRecord, "composition", "PRODUCT_SCHEMA")
    ? (product.composition ?? []).filter((row) => row.label.trim() && row.value.trim())
    : []

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: heading,
    ...(alternateName ? { alternateName } : {}),
    ...(description ? { description } : {}),
    url,
    ...(canExposeField(catalogRecord, "image", "PRODUCT_SCHEMA") && product.image
      ? { image: absoluteUrl(product.image) }
      : {}),
    ...(canExposeField(catalogRecord, "sku", "PRODUCT_SCHEMA") && product.sku?.trim()
      ? { sku: product.sku.trim() }
      : {}),
    ...(canExposeField(catalogRecord, "category", "PRODUCT_SCHEMA") && categoryName?.trim()
      ? { category: categoryName.trim() }
      : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...(manufacturer ? { manufacturer: { "@type": "Organization", name: manufacturer } } : {}),
    ...(offers ? { offers } : {}),
    ...(specs.length > 0
      ? {
          additionalProperty: specs.map((row) => ({
            "@type": "PropertyValue",
            name: row.label.trim(),
            value: row.value.trim(),
          })),
        }
      : {}),
  }
}

export function buildBreadcrumbListJsonLd(crumbs: readonly { name: string; path?: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => {
      const item =
        crumb.path && !crumb.path.includes("?") && !crumb.path.includes("#") ? absoluteUrl(crumb.path) : undefined
      return {
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        ...(item ? { item } : {}),
      }
    }),
  }
}

export function buildBreadcrumbJsonLd({
  locale,
  heading,
  homeLabel,
  productsLabel,
  categoryName,
}: {
  locale: Locale
  heading: string
  homeLabel: string
  productsLabel: string
  categoryName?: string
}): JsonLd {
  // Category filters are `?category=` URLs. Their page canonical is the
  // unfiltered listing, so the crumb keeps the name and omits a non-canonical item.
  return buildBreadcrumbListJsonLd([
    { name: homeLabel, path: `/${locale}` },
    { name: productsLabel, path: `/${locale}/products` },
    ...(categoryName ? [{ name: categoryName }] : []),
    { name: heading },
  ])
}
