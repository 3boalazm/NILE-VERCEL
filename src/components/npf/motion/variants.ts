/**
 * The site's reveal vocabulary. Since the P0 visibility fix these are pure
 * CSS entrances keyed by `[data-reveal="<name>"]` in globals.css — no
 * framer-motion variant objects, no inline `opacity:0` in server HTML.
 * Each name maps to a hidden→visible transition:
 *
 *   fadeSlideUp  opacity 0 → 1, translateY(24px) → 0      (default)
 *   fadeIn       opacity 0 → 1
 *   scaleIn      opacity 0 → 1, scale(0.94) → 1            (stats, media)
 *   blurUp       opacity 0 → 1, blur(10px) → 0, y 20 → 0   (hero copy)
 *   clipReveal   clip-path inset bottom 100% → 0           (editorial dividers)
 *
 * Reduced motion is handled in CSS (`prefers-reduced-motion`): the hidden
 * state simply never exists for those users, so nothing can get stuck.
 */
export const REVEAL_VARIANTS = ["fadeSlideUp", "fadeIn", "scaleIn", "blurUp", "clipReveal"] as const

export type RevealVariantName = (typeof REVEAL_VARIANTS)[number]
