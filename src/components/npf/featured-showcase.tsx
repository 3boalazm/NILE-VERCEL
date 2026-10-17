import Link from "next/link"
import Image from "next/image"

import type { Product } from "@/lib/products"
import type { Locale } from "@/lib/i18n/config"
import { productHeading } from "@/lib/seo/product-identity"
import { publicFieldText } from "@/lib/seo/sku-evidence"
import { ProductImagePlaceholder } from "./product-image-placeholder"
import { ProgressiveBlur } from "./progressive-blur"
import { Reveal } from "./motion/reveal"

export function NPFFeaturedShowcase({
  products,
  locale,
}: {
  products: Product[]
  locale: Locale
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {products.map((product, index) => {
        const heading = productHeading(product, locale)
        const intro = publicFieldText(product, "shortDescription", "COMMERCIAL_COPY")
        return (
        <Reveal key={product.id} as="div" delay={index * 0.08}>
          <Link
            href={`/${locale}/products/${product.slug}`}
            className="group relative flex aspect-[4/5] w-full overflow-hidden rounded-xl outline-none transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {product.image ? (
              <Image
                src={product.image}
                alt={heading}
                fill
                sizes="(min-width: 640px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              />
            ) : (
              <ProductImagePlaceholder className="absolute inset-0 h-full w-full" />
            )}
            <ProgressiveBlur className="h-[58%]" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col p-4">
              <h3 className="truncate text-sm font-medium text-white">{heading}</h3>
              {intro && <p className="line-clamp-2 text-xs text-white/70">{intro}</p>}
            </div>
          </Link>
        </Reveal>
        )
      })}
    </div>
  )
}
