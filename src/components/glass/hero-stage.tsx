"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

export type StageSlide = { slug: string; name: string; href: string; image: string }

/**
 * Hero product stage: a frosted frame cycling through the supplement packs
 * (their own pastel backdrops are the colour story). Rotation pauses on hover,
 * focus and under prefers-reduced-motion; the dots are real buttons.
 */
export function HeroStage({
  slides,
  partner,
  eyebrow,
  logoSrc,
  openLabel,
}: {
  slides: StageSlide[]
  partner: string
  eyebrow: string
  logoSrc: string
  openLabel: string
}) {
  const [index, setIndex] = useState(0)
  const paused = useRef(false)

  const advance = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length])

  useEffect(() => {
    if (slides.length < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => {
      if (!paused.current && !document.hidden) advance()
    }, 5200)
    return () => window.clearInterval(id)
  }, [advance, slides.length])

  const active = slides[index]
  return (
    <div
      className="ng-stage"
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
      onFocusCapture={() => (paused.current = true)}
      onBlurCapture={() => (paused.current = false)}
    >
      <span className="ng-orb" aria-hidden="true" style={{ inlineSize: 120, blockSize: 120, insetBlockStart: -28, insetInlineEnd: -22, zIndex: 2 }} />
      <span className="ng-orb" aria-hidden="true" style={{ inlineSize: 64, blockSize: 64, insetBlockEnd: "22%", insetInlineStart: -26, zIndex: 2, animationDelay: "-3s" }} />
      <div className="ng-stage-frame">
        {slides.map((s, i) => (
          <div key={s.slug} className="ng-stage-slide" data-active={i === index} aria-hidden={i === index ? undefined : true}>
            <Image
              src={s.image}
              alt={i === index ? s.name : ""}
              fill
              sizes="(min-width: 960px) 40vw, 92vw"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      <div className="ng-chip-float" style={{ insetBlockStart: 18, insetInlineStart: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local vector logo */}
        <img src={logoSrc} alt="Alfasigma" height={20} width={74} />
        <span>{partner}</span>
      </div>
      <div className="ng-chip-float ng-stage-caption" style={{ position: "absolute" }}>
        <Link href={active.href} className="ng-link" style={{ display: "grid", gap: 2, background: "none", textDecoration: "none" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--ng-ink-3)" }}>{eyebrow}</span>
          <span style={{ fontFamily: "var(--ng-font-display)", fontSize: "1.15rem", color: "var(--ng-ink)" }} dir="auto">
            {active.name} <span aria-hidden="true">↗</span>
            <span className="ng-sr"> — {openLabel}</span>
          </span>
        </Link>
        <div className="ng-stage-dots" role="group" aria-label={eyebrow}>
          {slides.map((s, i) => (
            <button key={s.slug} type="button" aria-label={s.name} aria-current={i === index} onClick={() => setIndex(i)} />
          ))}
        </div>
      </div>
    </div>
  )
}
