"use client"

import { motion, useScroll, useSpring } from "framer-motion"

/**
 * Thin Mint reading-progress bar pinned to the very top of the viewport
 * (above the sticky header's z-40). Pure scroll-linked — no layout impact,
 * GPU-composited transform only, and it reduces for motion-sensitive users
 * by simply not springing (framer's useScroll still works; we just drop
 * the rubber-band smoothing which is the motion-y part).
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-ring"
      style={{ scaleX }}
    />
  )
}
