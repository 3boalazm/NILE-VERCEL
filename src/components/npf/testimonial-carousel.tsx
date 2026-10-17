"use client"

import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import type { Testimonial } from "@/lib/products"

/**
 * Homepage "customer stories" carousel using embla-carousel-react (already a
 * dependency — previously unused). Shows the published, already-verified
 * Proxeed customer stories from the catalog (Nick/Hannah, from the official
 * Proxeed site) — no invented testimonials. Direction and arrow orientation
 * are driven by the page's `dir` prop so the carousel follows the locale
 * (prev/next swap sides and chevrons in RTL), no client-side guesswork.
 */
export function TestimonialCarousel({
  items,
  dir,
}: {
  items: Testimonial[]
  dir: "ltr" | "rtl"
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: dir })
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

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi && emblaApi.scrollTo(i), [emblaApi])

  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {items.map((t) => (
            <figure
              key={t.quote}
              className="flex min-w-0 flex-[0_0_100%] flex-col gap-4 rounded-3xl border border-border bg-anti-flash-white p-8 sm:p-10 dark:bg-card"
            >
              <blockquote className="text-pretty text-lg leading-relaxed text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              {t.author && (
                <figcaption className="text-sm font-medium text-muted-foreground">
                  {t.author}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex gap-1">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to story ${i + 1}`}
              onClick={() => scrollTo(i)}
              aria-current={i === selected ? "true" : undefined}
              // 44px tap target around a 8px visual dot (mobile audit).
              className="group flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                aria-hidden="true"
                className={
                  i === selected
                    ? "h-2 w-8 rounded-full bg-primary transition-all"
                    : "h-2 w-2 rounded-full bg-muted-foreground/30 transition-all group-hover:bg-muted-foreground/60"
                }
              />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous story"
            className="flex size-11 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {dir === "rtl" ? <ChevronRightIcon className="size-4" /> : <ChevronLeftIcon className="size-4" />}
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next story"
            className="flex size-11 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {dir === "rtl" ? <ChevronLeftIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
