"use client"

import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion"

/**
 * Framer-style magnetic hover for a single primary CTA — the element leans
 * toward the cursor (max ~8px, spring-smoothed) and springs back on leave.
 * Accessibility: fully disabled under prefers-reduced-motion, and for
 * keyboard/focus it does nothing (it's pointer-driven by design). Wraps its
 * children in an extra span for the drag effect so the hit area can be
 * slightly larger than the visible control.
 */
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reducedMotion = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 260, damping: 18, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 260, damping: 18, mass: 0.5 })

  function handleMove(event: React.MouseEvent<HTMLSpanElement>) {
    if (reducedMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={reducedMotion ? undefined : { x: springX, y: springY, display: "inline-block" }}
      className="inline-block"
    >
      {children}
    </motion.span>
  )
}
