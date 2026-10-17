"use client"

import { useRef } from "react"
import Image from "next/image"
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion"

import { cn } from "@/lib/utils"

/**
 * Phase 2 pinned/scrubbed editorial block: the image stays visually pinned
 * inside a tall scroll container while the text panel scrolls and fades,
 * the classic studio-site "sticky reveal". Uses scroll-linked transforms
 * only (translate + opacity), zero layout work per frame.
 *
 * Reduced-motion renders a plain static two-column layout (no pin, no scrub),
 * and the parallax strength collapses to 0 so nothing moves.
 */
export function StickyScrollSection({
  image,
  imageAlt,
  eyebrow,
  title,
  body,
  reverse = false,
  tone = "light",
}: {
  image: string
  imageAlt: string
  eyebrow: string
  title: string
  body: string
  reverse?: boolean
  tone?: "light" | "dark"
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"])
  const textOpacity = useTransform(scrollYProgress, [0.15, 0.4, 0.6, 0.85], [0, 1, 1, 0])

  const dark = tone === "dark"

  if (reducedMotion) {
    return (
      <section className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8",
        dark && "!max-w-none bg-anti-flash-navy text-anti-flash-white"
      )}>
        <div className="relative aspect-square overflow-hidden rounded-3xl">
          <Image src={image} alt={imageAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col gap-3">
          <span className={dark ? "eyebrow text-anti-flash-white/70" : "eyebrow text-primary"}>{eyebrow}</span>
          <h2 className="font-heading text-3xl font-semibold">{title}</h2>
          <p className={dark ? "leading-relaxed text-anti-flash-white/70" : "leading-relaxed text-muted-foreground"}>{body}</p>
        </div>
      </section>
    )
  }

  return (
    <div ref={containerRef} className={cn("relative", dark && "bg-anti-flash-navy text-anti-flash-white")}>
      <div className="relative mx-auto h-[160vh] max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sticky top-24 flex h-[80vh] items-center overflow-hidden rounded-3xl">
          <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <motion.div
              style={{ y: imageY }}
              className={`relative aspect-square w-full overflow-hidden rounded-3xl ${reverse ? "lg:order-2" : ""}`}
            >
              <Image
                src={image}
                alt={imageAlt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </motion.div>
            <motion.div
              style={{ opacity: textOpacity }}
              className={`flex flex-col gap-3 ${reverse ? "lg:order-1" : ""}`}
            >
              <span className={dark ? "eyebrow text-anti-flash-white/70" : "eyebrow text-primary"}>{eyebrow}</span>
              <h2 className="font-heading text-3xl font-semibold">{title}</h2>
              <p className={dark ? "leading-relaxed text-anti-flash-white/70" : "leading-relaxed text-muted-foreground"}>{body}</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
