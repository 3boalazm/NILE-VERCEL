"use client"

import { useRef } from "react"
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type HTMLMotionProps,
} from "framer-motion"

/**
 * Subtle scroll parallax for photographic sections — the image shifts ±6px
 * against the scroll position, cached with useSpring-like smoothing via a
 * short transform range. This is the "weight but not WebGL" tier: it makes
 * a full-bleed photo feel anchored and alive without the cost of a 3D scene.
 * Respects `prefers-reduced-motion` (renders statically) and degrades to a
 * plain absolutely-positioned layer if the parent isn't `relative`.
 */
export function ParallaxImage({
  strength = 6,
  ...props
}: HTMLMotionProps<"img"> & { strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength])
  const scale = 1.15 // slight overscan so the ±shift never exposes an edge

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.img
        {...props}
        style={{
          ...props.style,
          y: reducedMotion ? 0 : y,
          scale,
        }}
        className={`h-[115%] w-full object-cover ${props.className ?? ""}`}
        draggable={false}
      />
    </div>
  )
}
