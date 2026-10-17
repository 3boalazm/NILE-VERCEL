"use client"

import {
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react"

import type { RevealVariantName } from "./variants"

/**
 * Scroll-reveal as *progressive enhancement* — the P0 fix from the UX audit.
 *
 * The previous framer-motion version rendered `initial="hidden"` on the
 * server, so every revealed section shipped as `style="opacity:0"` in the
 * HTML and stayed invisible until (a) hydration finished and (b) an
 * IntersectionObserver callback fired. Slow/failed hydration, disabled JS,
 * or an observer edge case (an element parked inside the negative root
 * margin at the end of the page) left whole sections blank.
 *
 * This version inverts the contract: the server HTML is fully visible, and
 * the hidden state is added by CSS only when JavaScript has actually run
 * (`html.js`, set by the inline head script in layout.tsx before first
 * paint) and the user hasn't asked for reduced motion. The CSS lives in
 * globals.css under `[data-reveal]`; this component only flips attributes:
 *
 *   data-reveal="<variant>"  server-rendered — which entrance to use
 *   data-reveal-armed        set on mount — "JS owns this element now";
 *                            the hidden CSS state only ever matches armed
 *                            elements, so nothing hides before hydration
 *   data-revealed            set once when the element enters the viewport
 *                            (or is already on/above screen at mount)
 *
 * Attributes are toggled straight on the DOM node instead of via state so a
 * page with 30+ reveals doesn't re-render on scroll, and a single shared
 * IntersectionObserver serves every instance.
 */

type Tag = "div" | "section" | "article" | "figure" | "ul" | "ol" | "li" | "h2" | "h3" | "p" | "span"

type RevealProps = {
  as?: Tag
  /** Entrance delay in seconds (stagger siblings with `index * 0.08`). */
  delay?: number
  variant?: RevealVariantName
  children?: ReactNode
  className?: string
  style?: CSSProperties
} & Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "className">

// Reveal slightly before the element's top edge reaches the bottom of the
// viewport so content is already animating in when the user gets to it.
// Kept small on purpose — a large negative margin is exactly the edge case
// that can strand the last element on a short page below the threshold.
const BOTTOM_MARGIN_RATIO = 0.08

let sharedObserver: IntersectionObserver | null = null
const pending = new Map<Element, () => void>()
let scrollFallbackAttached = false
let scrollFrame = 0

function settle(element: Element) {
  const callback = pending.get(element)
  pending.delete(element)
  sharedObserver?.unobserve(element)
  callback?.()
  if (pending.size === 0) detachScrollFallback()
}

/**
 * IntersectionObserver only reports *changes* in intersection. An element
 * that goes from below the viewport to above it in a single jump (keyboard
 * End, an in-page anchor, programmatic scrollTo, scroll restoration after
 * hydration) never intersects and so never fires — exactly the "stuck at
 * opacity 0 after scrolling" case from the audit. This passive, rAF-batched
 * listener sweeps the pending set on scroll/resize and settles anything the
 * user has passed or that is now on screen. It only exists while something
 * is pending, and only reads geometry for pending elements.
 */
function sweepPending() {
  scrollFrame = 0
  for (const element of Array.from(pending.keys())) {
    if (alreadyOnOrAboveScreen(element, BOTTOM_MARGIN_RATIO)) settle(element)
  }
}
function onScrollOrResize() {
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(sweepPending)
}
function attachScrollFallback() {
  if (scrollFallbackAttached) return
  scrollFallbackAttached = true
  window.addEventListener("scroll", onScrollOrResize, { passive: true })
  window.addEventListener("resize", onScrollOrResize, { passive: true })
}
function detachScrollFallback() {
  if (!scrollFallbackAttached) return
  scrollFallbackAttached = false
  window.removeEventListener("scroll", onScrollOrResize)
  window.removeEventListener("resize", onScrollOrResize)
  if (scrollFrame) {
    window.cancelAnimationFrame(scrollFrame)
    scrollFrame = 0
  }
}

function observe(element: Element, onEnter: () => void): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onEnter()
    return () => {}
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && entry.intersectionRatio <= 0) continue
          settle(entry.target)
        }
      },
      { rootMargin: `0px 0px -${BOTTOM_MARGIN_RATIO * 100}% 0px`, threshold: 0 }
    )
  }
  pending.set(element, onEnter)
  sharedObserver.observe(element)
  attachScrollFallback()
  return () => {
    pending.delete(element)
    sharedObserver?.unobserve(element)
    if (pending.size === 0) detachScrollFallback()
  }
}

/**
 * `bottomMarginRatio` mirrors the observer's negative bottom root margin.
 * At mount it is 0: an element with any part inside the viewport has already
 * been painted visible (server HTML is not hidden), so hiding it now would
 * be a flash. During the scroll sweep it matches the observer so both paths
 * reveal at the same scroll position.
 */
function alreadyOnOrAboveScreen(element: Element, bottomMarginRatio = 0): boolean {
  const rect = element.getBoundingClientRect()
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  // Zero-size elements never intersect; treat them as visible so an empty
  // wrapper can't hide content that appears later.
  if (rect.width === 0 && rect.height === 0) return true
  // Above the viewport (scroll restoration, in-page anchor jumps, back
  // navigation) — reveal instantly so scrolling back up doesn't replay
  // entrances for content the user has notionally already passed.
  if (rect.bottom <= 0) return true
  return rect.top < viewportHeight * (1 - bottomMarginRatio)
}

export function Reveal({
  as = "div",
  delay = 0,
  variant = "fadeSlideUp",
  children,
  className,
  style,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const reveal = () => element.setAttribute("data-revealed", "")
    // Arm + (maybe) reveal in the same task: the hidden CSS state only
    // matches armed elements, so anything on screen right now goes from
    // visible (server HTML) to visible (revealed) without a hidden paint.
    element.setAttribute("data-reveal-armed", "")
    if (alreadyOnOrAboveScreen(element)) {
      reveal()
      return
    }
    return observe(element, reveal)
  }, [])

  const mergedStyle: CSSProperties | undefined =
    delay > 0 ? ({ ...style, "--reveal-delay": `${delay}s` } as CSSProperties) : style

  // All supported tags share the HTMLElement prop surface used here; the
  // cast keeps JSX happy with a dynamic intrinsic tag.
  const Tag = as as "div"

  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement>}
      className={className}
      style={mergedStyle}
      data-reveal={variant}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/**
 * Convenience wrapper for a list whose children should stagger in: it just
 * reveals the container; give each child its own `<Reveal delay>` (or use
 * `[data-reveal]` CSS `nth-child` delays) for the cascade. Kept for API
 * parity with the previous framer-based export.
 */
export function RevealGroup(props: Omit<RevealProps, "delay">) {
  return <Reveal {...props} />
}
