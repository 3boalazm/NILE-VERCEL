import Link from "next/link"
import Image from "next/image"
import { ArrowLeftIcon, ClockIcon } from "lucide-react"

import type { Product } from "@/lib/products"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { NEEDS, productsForNeed, type NeedDefinition } from "@/lib/products/positioning"
import { cn } from "@/lib/utils"
import { Reveal } from "./motion/reveal"
import { ProductImagePlaceholder } from "./product-image-placeholder"

type NeedTile = NeedDefinition & {
  title: string
  description: string
  count: number
  image: string | null
}

// Photo per need: the category photo where a dedicated one exists, otherwise
// the most representative active product in that need.
const NEED_IMAGE_OVERRIDES: Partial<Record<NeedDefinition["id"], string>> = {
  medicalDevices: "/categories/medical-devices.jpg",
  dental: "/categories/dental.jpg",
}

/**
 * "Shop by need" — the user thinks in needs (men's health, women's health,
 * devices…), not in catalog departments. Each tile links to the products
 * page pre-filtered by `?need=`; an announced-but-empty line renders as a
 * non-interactive "coming soon" tile rather than a dead-end empty listing.
 */
export function ShopByNeed({
  products,
  locale,
  dictionary,
}: {
  products: Product[]
  locale: Locale
  dictionary: Dictionary
}) {
  const base = `/${locale}`
  const tiles: NeedTile[] = NEEDS.filter((need) => !need.comingSoon).map((need) => {
    const matched = productsForNeed(products, need)
    const representative =
      matched.find((product) => product.status === "active" && product.image) ??
      matched.find((product) => product.image)
    return {
      ...need,
      ...dictionary.home.needs[need.id],
      count: matched.length,
      image: NEED_IMAGE_OVERRIDES[need.id] ?? representative?.image ?? null,
    }
  })

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile, index) => {
        const content = (
          <>
            {/* Image: a side thumbnail on phones (keeps four stacked tiles
                short), the full-width 4:3 stage from `sm` up. */}
            <div className="relative w-[38%] shrink-0 overflow-hidden bg-muted sm:aspect-[16/10] sm:w-auto">
              {tile.image ? (
                <Image
                  src={tile.image}
                  alt=""
                  fill
                  // F-40: the need tiles are inside the first viewport on
                  // phones; the first tile's image is very likely the LCP
                  // element, so it is preloaded rather than lazy-discovered.
                  priority={index === 0}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 40vw"
                  className={cn(
                    "object-cover transition-transform duration-500",
                    !tile.comingSoon && "group-hover:scale-[1.05]",
                    tile.comingSoon && "opacity-80 saturate-50"
                  )}
                />
              ) : (
                <ProductImagePlaceholder className="absolute inset-0 h-full w-full" />
              )}
              {tile.comingSoon && (
                <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <ClockIcon className="size-3.5" aria-hidden="true" />
                  {dictionary.home.needsComingSoon}
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-heading text-lg font-semibold leading-snug">{tile.title}</h3>
                {!tile.comingSoon && (
                  <ArrowLeftIcon
                    className="mt-1 size-4 shrink-0 text-primary transition-transform duration-300 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{tile.description}</p>
              {!tile.comingSoon && (
                <span className="mt-auto pt-2 text-xs font-medium text-primary">
                  {dictionary.products.resultsCount(tile.count)}
                </span>
              )}
            </div>
          </>
        )

        const cardClass =
          "group flex h-full flex-row overflow-hidden rounded-3xl border border-white/70 bg-card/60 text-card-foreground shadow-sm transition-[transform,box-shadow,border-color] duration-300 sm:flex-col"

        return (
          <Reveal key={tile.id} as="div" delay={index * 0.08} className="h-full">
            {tile.comingSoon ? (
              <div className={cn(cardClass, "border-dashed")} aria-label={`${tile.title} — ${dictionary.home.needsComingSoon}`}>
                {content}
              </div>
            ) : (
              <Link
                href={`${base}/products?need=${tile.param}`}
                className={cn(
                  cardClass,
                  "outline-none hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl focus-visible:ring-3 focus-visible:ring-ring/50"
                )}
              >
                {content}
              </Link>
            )}
          </Reveal>
        )
      })}
    </div>
  )
}
