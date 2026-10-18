import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"
import { Reveal } from "@/components/npf/motion/reveal"
import type { Locale } from "@/lib/i18n/config"
import { getCareAtlasCopy } from "@/lib/i18n/care-atlas"

/** Inner-page hero: eyebrow, large display title (optional gradient accent), lead. */
export function PageIntro({
  eyebrow,
  title,
  accent,
  body,
  children,
}: {
  eyebrow?: string
  title: string
  accent?: string
  body?: string
  children?: ReactNode
}) {
  return (
    <section className="ng-wrap ng-page-intro">
      {eyebrow && <span className="ng-eyebrow">{eyebrow}</span>}
      <h1 className="ng-h1">
        {title}
        {accent && (
          <>
            {" "}
            <span className="ng-accent">{accent}</span>
          </>
        )}
      </h1>
      {body && <p className="ng-lead">{body}</p>}
      {children}
    </section>
  )
}

export function SectionHead({
  eyebrow,
  title,
  body,
  id,
  split = true,
}: {
  eyebrow?: string
  title: string
  body?: string
  id?: string
  split?: boolean
}) {
  return (
    <div className={`ng-head ${split ? "ng-head-split" : ""}`}>
      <div className="ng-stack" style={{ ["--ng-stack" as string]: "14px" }}>
        {eyebrow && <span className="ng-eyebrow">{eyebrow}</span>}
        <Reveal as="h2" className="ng-h2" id={id}>
          {title}
        </Reveal>
      </div>
      {body && <p className="ng-lead">{body}</p>}
    </div>
  )
}

/** "Read before you choose": three questions + the official leaflet. */
export function ReadingBand({
  locale,
  leaflet,
}: {
  locale: Locale
  leaflet?: { name: string; url: string }
}) {
  const c = getCareAtlasCopy(locale)
  const qa = [
    [c.question1, c.answer1],
    [c.question2, c.answer2],
    [c.question3, c.answer3],
  ]
  return (
    <section id="reading" className="ng-wrap ng-section" aria-labelledby="reading-title">
      <div className="ng-bento">
        <Reveal className="span-5 ng-glass ng-pad ng-stack" style={{ ["--ng-stack" as string]: "18px" }}>
          <span className="ng-eyebrow">{c.readingLabel}</span>
          <h2 id="reading-title" className="ng-h2">
            {c.reading1} <span className="ng-accent">{c.reading2}</span>
          </h2>
          <p className="ng-body">{c.readingBody}</p>
          {leaflet && (
            <a className="ng-btn ng-btn-primary" href={leaflet.url} target="_blank" rel="noopener noreferrer">
              <span dir="ltr">{leaflet.name}</span>
              <span aria-hidden="true">↧</span>
              <span className="ng-sr">
                {c.documentType}
              </span>
            </a>
          )}
          <p style={{ margin: 0 }}>
            <Link href={`/${locale}/quality-sourcing`} className="ng-link">
              {locale === "ar" ? "المصدر والتوزيع: تعرّف على الحكاية" : "Sourcing & distribution: the full story"}
            </Link>
          </p>
        </Reveal>
        <div className="span-7 ng-acc">
          {qa.map(([q, a], i) => (
            <Reveal key={q} delay={i * 0.06}>
              <details open={i === 0}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Closing call to action used on every marketing page. */
export function ContactBand({ locale }: { locale: Locale }) {
  const c = getCareAtlasCopy(locale)
  return (
    <section id="contact" className="ng-wrap ng-section" aria-labelledby="contact-title">
      <Reveal className="ng-cta ng-glass ng-blur-lg">
        <div className="ng-stack" style={{ ["--ng-stack" as string]: "20px", maxInlineSize: 640 }}>
          <span className="ng-eyebrow">{c.contactLabel}</span>
          <h2 id="contact-title" className="ng-h1">
            {c.contact1} <span className="ng-accent">{c.contact2}</span>
          </h2>
          <p className="ng-lead">{c.contactBody}</p>
          <div className="ng-hero-cta">
            <Link href={`/${locale}/contact`} className="ng-btn ng-btn-primary ng-btn-lg">
              {c.contactAction}
              <span className="ng-arrow" aria-hidden="true">↗</span>
            </Link>
            <a href="mailto:info@nilepharmafood.com" className="ng-btn ng-btn-lg">
              info@nilepharmafood.com
            </a>
            <a href="tel:01027639857" dir="ltr" className="ng-btn ng-btn-ghost ng-btn-lg">
              010 276 39857
            </a>
          </div>
          <p className="ng-card-sub" style={{ margin: 0 }}>
            {c.location}
          </p>
        </div>
      </Reveal>
    </section>
  )
}

/** Large photo with a frosted caption panel (the only place glass sits over imagery). */
export function PhotoPanel({
  src,
  alt,
  note,
  className = "",
  priority = false,
  sizes = "(min-width: 960px) 50vw, 100vw",
}: {
  src: string
  alt: string
  note?: ReactNode
  className?: string
  priority?: boolean
  sizes?: string
}) {
  return (
    <figure className={`ng-photo ${className}`} style={{ margin: 0 }}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} />
      {note && <figcaption className="ng-photo-note">{note}</figcaption>}
    </figure>
  )
}
