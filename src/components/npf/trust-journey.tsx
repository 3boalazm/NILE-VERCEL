"use client"

import { useEffect, useRef } from "react"
import { BadgeCheckIcon, FactoryIcon, HeadsetIcon, ShieldCheckIcon } from "lucide-react"

import { Reveal } from "./motion/reveal"

const STEP_ICONS = [FactoryIcon, BadgeCheckIcon, ShieldCheckIcon, HeadsetIcon]

/**
 * "Why trust our products?" — the Blueprint-style numbered journey from the
 * audit: four verified steps (European manufacturing → official Alfasigma
 * distributor → NFSA registration → patient/pharmacist support) laid out
 * along a rail. A progress line fills along the rail as the section scrolls
 * through the viewport.
 *
 * The fill is driven by a CSS custom property (`--journey-progress`) that a
 * passive scroll listener updates — transform-only, no layout work. Without
 * JS, or under reduced motion, the rail renders fully drawn: the progress
 * is decoration, never a gate on the content.
 */
export function TrustJourney({
  steps,
}: {
  steps: { title: string; description: string }[]
}) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = sectionRef.current
    if (!element) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      // 0 when the list's top reaches 85% down the viewport, 1 when its
      // bottom reaches 35% — the line finishes drawing before the user
      // reaches the last step, so it never feels like it's lagging.
      const start = viewportHeight * 0.85
      const end = viewportHeight * 0.35
      const total = rect.height + (start - end)
      const progress = Math.min(1, Math.max(0, (start - rect.top) / total))
      element.style.setProperty("--journey-progress", progress.toFixed(3))
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    element.dataset.journeyLive = ""
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (frame) window.cancelAnimationFrame(frame)
      delete element.dataset.journeyLive
    }
  }, [])

  return (
    <div ref={sectionRef} className="relative">
      {/* Rail (vertical on mobile, horizontal on lg). Kept outside the <ol>
          so the list only contains <li> children. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-6 w-px bg-border lg:inset-x-0 lg:top-6 lg:h-px lg:w-auto"
      />
      <div
        aria-hidden="true"
        className="journey-fill pointer-events-none absolute inset-y-0 start-6 w-px origin-top bg-ring lg:inset-x-0 lg:top-6 lg:h-px lg:w-auto lg:origin-[left_center] rtl:lg:origin-[right_center]"
      />

      <ol className="relative grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-6">
      {steps.map((step, index) => {
        const Icon = STEP_ICONS[index % STEP_ICONS.length]
        return (
          <Reveal
            key={step.title}
            as="li"
            delay={index * 0.1}
            className="relative flex gap-5 ps-0 lg:flex-col lg:gap-5"
          >
            <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
              <Icon className="size-5" aria-hidden="true" />
              <span className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary font-mono text-[0.65rem] font-semibold text-primary-foreground">
                {index + 1}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 pt-2 lg:pt-0">
              <h3 className="font-heading text-lg font-semibold leading-snug">{step.title}</h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          </Reveal>
        )
      })}
      </ol>
    </div>
  )
}
