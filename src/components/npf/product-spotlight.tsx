"use client"

import { getExperienceCopy } from "@/lib/i18n/experience"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from "lucide-react"

import type { Product } from "@/lib/products"
import type { Locale } from "@/lib/i18n/config"
import { productHeading } from "@/lib/seo/product-identity"
import { canExposeField, publicFieldText } from "@/lib/seo/sku-evidence"
import type { ClientSafeDictionary } from "@/lib/i18n/dictionaries"
import { ctaButtonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProductImagePlaceholder } from "./product-image-placeholder"
import { ProductStatusBadge } from "./product-status-badge"

export type SpotlightItem = {
  product: Product
  /** "Who is it for?" — resolved server-side from the positioning map. */
  audience?: string
  categoryName?: string
}

const ACCENTS = [
  "from-[color-mix(in_oklab,var(--ring)_18%,transparent)]",
  "from-[color-mix(in_oklab,var(--chart-3)_22%,transparent)]",
  "from-[color-mix(in_oklab,var(--chart-2)_30%,transparent)]",
  "from-[color-mix(in_oklab,var(--chart-4)_28%,transparent)]",
]

/**
 * Homepage "Product Spotlight" (ApeChain-style single-focus stage, adapted
 * to a medical-commerce tone): one product fills the stage with a large
 * art-directed image, who it's for, its lead benefit, form, availability and
 * price, plus two clear CTAs. Thumbnails double as navigation so the whole
 * active range stays visible at a glance.
 *
 * Progressive enhancement: every slide is server-rendered in the HTML (no
 * hidden state), embla only adds the sliding; with JS off the slides stack
 * horizontally in an overflow container and remain readable. Direction is
 * driven by the page's `dir` so arrows and swipe follow the locale.
 */
export function ProductSpotlight({
  items,
  locale,
  dictionary,
  dir,
}: {
  items: SpotlightItem[]
  locale: Locale
  dictionary: ClientSafeDictionary
  dir: "ltr" | "rtl"
}) {
  const copy = dictionary.home
  const ui = getExperienceCopy(locale)
  const base = `/${locale}`
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: items.length > 1, direction: dir, align: "start" })
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  if (items.length === 0) return null

  const PrevIcon = dir === "rtl" ? ChevronRightIcon : ChevronLeftIcon
  const NextIcon = dir === "rtl" ? ChevronLeftIcon : ChevronRightIcon

  return (
    <div className="flex flex-col gap-6" data-testid="product-spotlight">
      <div ref={emblaRef} className="overflow-hidden rounded-[2rem]" aria-roledescription="carousel">
        <div className="flex touch-pan-y">
          {items.map(({ product, audience, categoryName }, index) => {
            const href = `${base}/products/${product.slug}`
            const heading = productHeading(product, locale)
            const intro = publicFieldText(product, "shortDescription", "COMMERCIAL_COPY")
            const form = publicFieldText(product, "form", "COMMERCIAL_COPY")
            const leadBenefit = canExposeField(product, "keyBenefits", "COMMERCIAL_COPY") ? product.keyBenefits[0] : undefined
            const priced = typeof product.price === "number"
            return (
              <article
                key={product.id}
                className="grid min-w-0 flex-[0_0_100%] grid-cols-1 overflow-hidden rounded-[2rem] border border-border bg-card lg:grid-cols-[1.05fr_1fr]"
                aria-roledescription="slide"
                aria-label={`${index + 1} ${copy.spotlightCounterOf} ${items.length}`}
                aria-hidden={index !== selected ? true : undefined}
              >
                {/* Stage */}
                <div
                  className={cn(
                    "relative aspect-[4/3] overflow-hidden bg-gradient-to-br to-transparent sm:aspect-[5/4] lg:aspect-auto lg:min-h-[32rem]",
                    ACCENTS[index % ACCENTS.length]
                  )}
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={heading}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                      priority={index === 0}
                    />
                  ) : (
                    <ProductImagePlaceholder className="absolute inset-0 h-full w-full" />
                  )}
                  <div className="absolute start-5 top-5 flex flex-wrap items-center gap-2">
                    {categoryName && (
                      <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {categoryName}
                      </span>
                    )}
                    <ProductStatusBadge status={product.status} dictionary={dictionary} />
                  </div>
                </div>

                {/* Story */}
                <div className="flex flex-col justify-center gap-6 p-6 sm:p-10">
                  <div className="flex flex-col gap-3">
                    <span className="eyebrow text-primary">
                      {index + 1} {copy.spotlightCounterOf} {items.length}
                    </span>
                    <h3 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                      {heading}
                    </h3>
                    {intro && <p className="text-pretty leading-relaxed text-muted-foreground">{intro}</p>}
                  </div>

                  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                    {audience && (
                      <div className="flex flex-col gap-1">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {copy.spotlightForLabel}
                        </dt>
                        <dd className="font-medium">{audience}</dd>
                      </div>
                    )}
                    {form && (
                      <div className="flex flex-col gap-1">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {copy.spotlightFormLabel}
                        </dt>
                        <dd className="font-medium">{form}</dd>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {copy.spotlightAvailabilityLabel}
                      </dt>
                      <dd className="font-medium">{dictionary.status[product.status]}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {copy.spotlightPriceLabel}
                      </dt>
                      <dd className="font-heading text-lg font-semibold">
                        {priced
                          ? `${product.price} ${locale === "en" ? "EGP" : "ج.م"}`
                          : copy.spotlightPriceOnRequest}
                        {product.priceSource === "demo" && <span className="block text-xs font-normal text-muted-foreground">{ui.priceDemo}</span>}
                      </dd>
                    </div>
                  </dl>

                  {leadBenefit && (
                    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-ring" aria-hidden="true" />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {copy.spotlightBenefitLabel}
                        </span>
                        <p className="text-sm leading-relaxed">{leadBenefit}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={href}
                      className={cn(ctaButtonVariants({ variant: "onLight" }), "min-h-11")}
                      tabIndex={index === selected ? undefined : -1}
                    >
                      {copy.spotlightViewCta}
                      <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                    <Link
                      href={`${base}/contact?product=${encodeURIComponent(product.slug)}`}
                      className={cn(ctaButtonVariants({ variant: "outline" }), "min-h-11")}
                      tabIndex={index === selected ? undefined : -1}
                    >
                      {copy.spotlightInfoCta}
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {/* Controls: thumbnails as tabs + arrows. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.spotlightTitle}>
          {items.map(({ product }, index) => (
            <button
              key={product.id}
              type="button"
              role="tab"
              aria-selected={index === selected}
              aria-label={`${copy.spotlightGoTo} ${productHeading(product, locale)}`}
              onClick={() => scrollTo(index)}
              className={cn(
                "relative size-12 overflow-hidden rounded-xl border-2 bg-muted transition-all sm:size-14",
                index === selected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {product.image ? (
                <Image src={product.image} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <ProductImagePlaceholder className="h-full w-full" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`${base}/products`}
            className="hidden items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            {copy.spotlightAllCta}
            <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label={copy.spotlightPrev}
              className="flex size-11 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <PrevIcon className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label={copy.spotlightNext}
              className="flex size-11 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <NextIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
