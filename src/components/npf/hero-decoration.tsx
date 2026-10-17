import { cn } from "@/lib/utils"

/**
 * Decorative inline-SVG "blueprint" curve for the hero — a dashed tech
 * contour with an arrow head, matching the brand's pharmaceutical/precision
 * language. Rendered inline (not a file) so its color follows `currentColor`
 * and it can be tinted per hero treatment without new assets or
 * theme-switching logic. Always aria-hidden.
 */
export function HeroDecoration({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className={cn("pointer-events-none absolute size-16 text-current", className)}
    >
      <path
        d="M10 100 Q 50 40, 90 90 T 180 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 14"
      />
      <path
        d="M165 60 L182 69 L167 82"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
