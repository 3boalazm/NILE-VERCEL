"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"

import { cn } from "@/lib/utils"
import { ProductImagePlaceholder } from "./product-image-placeholder"

/**
 * Product gallery upgraded in Phase 2:
 *  - Mobile/desktop swipe between images via embla (axis x, RTL-aware).
 *  - Desktop hover magnifier: the active image zooms ~1.8x and the origin
 *    follows the cursor (no layout thrash — transform only).
 *  - Thumbnails sync with the swipe position and are tappable.
 * Reduced motion leaves the magnifier static (zoom disabled via the
 * motion-reduce class), but swipe still works — it's a nudge, not motion.
 */
export function NPFProductThumbnailGallery({
  images,
  alt,
  dir = "ltr",
}: {
  images: (string | null | undefined)[]
  alt: string
  dir?: "ltr" | "rtl"
}) {
  const validImages = images.filter((src): src is string => Boolean(src))
  const [emblaRef, emblaApi] = useEmblaCarousel({ axis: "x", direction: dir })
  const [activeIndex, setActiveIndex] = useState(0)
  const frameRef = useRef<HTMLDivElement>(null)
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%")
  const [zooming, setZooming] = useState(false)

  const scrollTo = useCallback(
    (i: number) => {
      emblaApi?.scrollTo(i)
      setActiveIndex(i)
    },
    [emblaApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setActiveIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  if (validImages.length === 0) {
    return <ProductImagePlaceholder className="rounded-2xl" />
  }

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const el = frameRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setZoomOrigin(`${x}% ${y}%`)
    setZooming(true)
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div
        ref={frameRef}
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white dark:bg-card"
        onMouseMove={handleMove}
        onMouseLeave={() => setZooming(false)}
      >
        <div ref={emblaRef} className="h-full w-full overflow-hidden">
          <div className="flex h-full">
            {validImages.map((src, index) => (
              <div
                key={src}
                className="relative h-full w-full flex-[0_0_100%]"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className={cn(
                    "object-contain p-6 transition-transform duration-200 ease-out",
                    zooming && "scale-[1.8]",
                    zooming && "motion-reduce:scale-100"
                  )}
                  style={zoomOrigin ? { transformOrigin: zoomOrigin } : undefined}
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {validImages.length > 1 && (
        <div className="flex gap-3">
          {validImages.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`${alt} ${index + 1}`}
              aria-current={index === activeIndex}
              className={cn(
                "relative aspect-square w-full max-w-24 overflow-hidden rounded-xl bg-white dark:bg-card outline-none transition-all",
                index === activeIndex
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "opacity-60 hover:opacity-100 focus-visible:opacity-100"
              )}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-contain p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
