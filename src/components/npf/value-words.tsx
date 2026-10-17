"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, useInView, motion } from "framer-motion"

/**
 * MONOLOG-inspired sticky value statement — one phrase at a time that cycles
 * through a short list while the section sits within view. A pure
 * opacity/slide crossfade (no word-splitting, so Arabic letter-joining is
 * never broken). Reduced motion renders the first phrase statically and
 * skips the auto-advance; the dots always allow manual selection.
 */
export function ValueWords({
  words,
  eyebrow,
  title,
}: {
  words: string[]
  eyebrow: string
  title: string
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { margin: "-35% 0px -35% 0px" })
  const [index, setIndex] = useState(0)
  const safeWords = words.length > 0 ? words : [""]

  // Auto-advance only while in view and motion is allowed.
  useEffect(() => {
    if (!inView || safeWords.length <= 1) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % safeWords.length)
    }, 2600)
    return () => clearInterval(timer)
  }, [inView, safeWords.length])

  return (
    <div ref={sectionRef} className="relative">
      <div className="sticky top-24 flex min-h-[42vh] flex-col justify-center gap-6 py-16">
        <span className="eyebrow text-primary">{eyebrow}</span>
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">{title}</h2>
        <div className="relative min-h-[1.8em]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="max-w-xl text-pretty text-3xl leading-tight font-medium sm:text-4xl"
            >
              {safeWords[index]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex gap-2">
          {safeWords.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Value ${i + 1}`}
              onClick={() => setIndex(i)}
              className={
                i === index
                  ? "h-2 w-6 rounded-full bg-primary transition-all"
                  : "h-2 w-2 rounded-full bg-muted transition-all hover:bg-muted-foreground/40"
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
