import Link from "next/link"
import Image from "next/image"
import { ArrowLeftIcon } from "lucide-react"

import type { ProductCategory } from "@/lib/products"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { Reveal } from "./motion/reveal"
import { ProductImagePlaceholder } from "./product-image-placeholder"
import { ProgressiveBlur } from "./progressive-blur"

export function NPFCategoryShowcase({
  categories,
  locale,
  dictionary,
}: {
  categories: (ProductCategory & { image: string | null; count: number })[]
  locale: Locale
  dictionary: Dictionary
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category, index) => {
        const comingSoon = category.status === "coming_soon"
        return (
          <Reveal key={category.id} as="div" delay={index * 0.08}>
            <Link
              href={`/${locale}/products?category=${category.slug}`}
              className="group relative flex aspect-4/3 overflow-hidden rounded-2xl bg-muted outline-none transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {category.image ? (
                <>
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  {/* Sized to the text block rather than half the card. */}
                  <ProgressiveBlur className="h-[34%]" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-6">
                    <div>
                      <p className="font-heading text-xl font-semibold text-white">
                        {category.name}
                      </p>
                      <p className="mt-1 text-sm text-white/75">
                        {comingSoon
                          ? dictionary.status.launching_soon
                          : dictionary.products.resultsCount(category.count)}
                      </p>
                    </div>
                    <ArrowLeftIcon
                      className="mb-1 size-5 shrink-0 text-white transition-transform duration-300 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1"
                      strokeWidth={1.75}
                    />
                  </div>
                </>
              ) : (
                <>
                  <ProductImagePlaceholder className="absolute inset-0 aspect-auto" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-6">
                    <div>
                      <p className="font-heading text-xl font-semibold text-foreground">
                        {category.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {comingSoon
                          ? dictionary.status.launching_soon
                          : dictionary.products.resultsCount(category.count)}
                      </p>
                    </div>
                    <ArrowLeftIcon
                      className="mb-1 size-5 shrink-0 text-foreground transition-transform duration-300 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1"
                      strokeWidth={1.75}
                    />
                  </div>
                </>
              )}
            </Link>
          </Reveal>
        )
      })}
    </div>
  )
}
