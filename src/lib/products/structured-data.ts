import type { Product } from "./types"

export function productStructuredData(
  product: Product,
  locale: string,
  categoryName?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    ...(product.image && {
      image: new URL(product.image, "https://nilepharmafood.com").href,
    }),
    ...(product.sku && { sku: product.sku }),
    ...(categoryName && { category: categoryName }),
    // Editorial status ≠ inventory. Manufacturer is product-specific and
    // absent from the current CMS contract, so neither is invented here.
    ...(product.priceSource === "live" &&
      typeof product.price === "number" &&
      product.price >= 0 && {
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency:
            product.currency === "ج.م" ? "EGP" : product.currency || "EGP",
          url: `https://nilepharmafood.com/${locale}/products/${product.slug}`,
        },
      }),
  }
}

/** HTML parsers process script end tags before JSON parsers see the text. */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
}
