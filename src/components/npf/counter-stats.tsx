"use client"

import { useEffect, useRef } from "react"

/**
 * MONOLOG-style stat figures that count up when they enter the viewport.
 *
 * P0 note: the server HTML carries the *final* value (previously the motion
 * value's initial 0 was rendered, so no-JS visitors and crawlers read
 * "0 products in the catalog"). The count-up is a pure post-mount
 * enhancement written straight to the text node — no state, no re-render,
 * and reduced-motion users simply keep the static figure.
 */
export function CounterStats({
  items,
  className,
}: {
  items: { value: string; label: string }[]
  className?: string
}) {
  return (
    <div className={className ?? "grid grid-cols-2 gap-6 sm:grid-cols-4"}>
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <StatValue value={item.value} />
          <p className="text-sm text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

function StatValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  // Count-up only for small cardinal figures ("8", "2"). Years like "2019"
  // (founding year) or "5" (partner-brand count) are static labels,
  // not counters — animating from 0 would be nonsense.
  const numeric = /^\d+$/.test(value) && Number(value) < 1900

  useEffect(() => {
    const element = ref.current
    if (!element || !numeric) return
    if (typeof IntersectionObserver === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const target = Number(value)
    let frame = 0
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        const start = performance.now()
        const duration = 1100
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          element.textContent = String(Math.round(target * eased))
          if (t < 1) frame = window.requestAnimationFrame(tick)
          else element.textContent = value
        }
        frame = window.requestAnimationFrame(tick)
      },
      { rootMargin: "-60px" }
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
      element.textContent = value
    }
  }, [numeric, value])

  return (
    <span
      ref={ref}
      data-count-target={value}
      className="font-heading text-4xl font-semibold tabular-nums sm:text-5xl"
    >
      {value}
    </span>
  )
}
