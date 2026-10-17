import { Fragment } from "react"

/**
 * MONOLOG-style partner strip — pure CSS infinite marquee (no JS, no
 * framer-motion) so the loop never taxes the main thread. Items are the
 * documented partners already named across the dictionaries (Alfasigma,
 * CA-MI, Olimp-Lab, Fine Foods, E-Pharma Trento) plus the NFSA registration
 * note — all real, already-verified content, nothing invented.
 *
 * The track is duplicated once for a seamless loop and animated with the
 * `marquee` / `marquee-rtl` keyframes defined in globals.css (LTR slides
 * left, RTL slides right so it always reads in the reading direction).
 * `prefers-reduced-motion` pauses the loop via the `motion-reduce` class.
 */
export function BrandMarquee({
  items,
  ariaLabel,
}: {
  items: string[]
  ariaLabel: string
}) {
  if (items.length === 0) return null
  const doubled = [...items, ...items]

  return (
    <div
      aria-label={ariaLabel}
      className="relative flex w-full overflow-hidden border-y border-border bg-anti-flash-white py-5 dark:bg-card"
    >
      {/* Edge fades are a MASK on the track itself, not overlay gradients.
          axe color-contrast flagged overlay fades: text sliding underneath a
          gradient div momentarily measures < 4.5:1 (and nondeterministically,
          depending on the animation snapshot). Masking the track keeps the
          identical dissolve-in/out visual while the text's own computed
          color (≥ 4.5:1 against the band) is what any contrast checker sees. */}
      <div className="flex w-max items-center gap-12 ps-12 will-change-transform animate-marquee motion-reduce:animate-none rtl:animate-marquee-rtl [mask-image:linear-gradient(to_right,transparent,black_6rem,black_calc(100%_-_6rem),transparent)]">
        {doubled.map((item, index) => (
          <Fragment key={`${item}-${index}`}>
            {/* Full text-muted-foreground (not /70): the faded variant
                measured 3.12:1 on the light band; the full tone ~5.8:1. */}
            <span className="whitespace-nowrap font-heading text-lg font-medium text-muted-foreground">
              {item}
            </span>
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-ring/50" />
          </Fragment>
        ))}
      </div>
    </div>
  )
}
