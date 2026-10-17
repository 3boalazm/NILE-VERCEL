import Link from "next/link"
import Image from "next/image"

import type { Product } from "@/lib/products"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { productHeading } from "@/lib/seo/product-identity"
import { publicFieldText } from "@/lib/seo/sku-evidence"
import { ProductImagePlaceholder } from "./product-image-placeholder"
import { Reveal } from "./motion/reveal"

type MatrixDictionary = Dictionary["products"]["matrix"]

type MatrixCell = {
  gender: "men" | "women"
  concern: "fertility" | "wellness"
  product: Product
}

export function NPFPositioningMatrix({
  base,
  dictionary,
  cells,
}: {
  base: string
  dictionary: MatrixDictionary
  cells: MatrixCell[]
}) {
  const locale: Locale = isValidLocale(base.replace(/^\//, "")) ? (base.replace(/^\//, "") as Locale) : "ar"
  const genderLabel = { men: dictionary.genderMen, women: dictionary.genderWomen }
  const concernLabel = { fertility: dictionary.concernFertility, wellness: dictionary.concernWellness }

  return (
    <Reveal className="mb-16">
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="font-heading text-xl font-semibold">{dictionary.title}</h2>
        <p className="text-sm text-muted-foreground">{dictionary.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cells.map((cell, index) => {
          const heading = productHeading(cell.product, locale)
          const intro = publicFieldText(cell.product, "shortDescription", "COMMERCIAL_COPY")
          return (
          <Reveal
            key={cell.product.slug}
            delay={index * 0.06}
            as="div"
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
          >
            <Link href={`${base}/products/${cell.product.slug}`} className="absolute inset-0" aria-label={heading} />
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
              {cell.product.image ? (
                <Image src={cell.product.image} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <ProductImagePlaceholder />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-primary">
                {genderLabel[cell.gender]} · {concernLabel[cell.concern]}
              </span>
              <span className="font-heading text-base font-semibold">{heading}</span>
              {intro && <span className="line-clamp-1 text-sm text-muted-foreground">{intro}</span>}
            </div>
          </Reveal>
          )
        })}
      </div>
    </Reveal>
  )
}
