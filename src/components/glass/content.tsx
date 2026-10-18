import Image from "next/image"
import type { HTMLAttributes, ReactNode } from "react"
import { Reveal } from "@/components/npf/motion/reveal"
import type { Locale } from "@/lib/i18n/config"

// Content-page styles. Imported here (not in the root layout) so every page,
// notice and boundary that renders one of these building blocks pulls the
// stylesheet with it — including CatalogUnavailable on the home/products pages.
import "@/app/glass-content.css"

/**
 * Editorial stills — migrated verbatim from care-atlas/editorial-visual.tsx.
 * Alt text and the "AI-generated, not our team/premises" disclosure are part
 * of the data-integrity contract (e2e/editorial-imagery.spec.ts), so the copy
 * is unchanged; only the presentation moved to Nile Glass.
 */
const visuals = {
  about: {
    file: "about-garden",
    index: "01 / LIFE, IN THE EVERYDAY",
    ar: {
      alt: "زوجان يسيران من الخلف في حديقة هادئة؛ الزوجة بحجاب كامل وملابس طويلة واسعة، دون ملامح وجه ظاهرة.",
      caption: "مشهد توضيحي مولّد للعناية اليومية، وليس صورة لفريقنا أو لعملاء.",
    },
    en: {
      alt: "A couple walking away through a quiet garden; the woman wears a full-coverage hijab and loose full-length clothing. No faces are shown.",
      caption: "AI-generated everyday-care illustration, not our team or a customer photograph.",
    },
  },
  story: {
    file: "story-courtyard",
    index: "02 / A WAY FORWARD",
    ar: {
      alt: "ممر حجري معاصر وشجرة زيتون وزجاج يفتح على أفق البحر، دون أشخاص.",
      caption: "مشهد معماري توضيحي مولّد، لا يمثل مقر الشركة.",
    },
    en: {
      alt: "A contemporary stone passage, olive tree and glass opening toward the sea, with no people.",
      caption: "AI-generated architectural illustration, not the company's premises.",
    },
  },
  quality: {
    file: "quality-materials",
    index: "03 / CLARITY, IN THE DETAILS",
    ar: {
      alt: "ضوء أزرق ينكسر عبر زجاج شفاف فوق ورق خالٍ من الكتابة على سطح حجري.",
      caption: "تكوين توضيحي مولّد للدقة والوضوح، وليس معملًا أو مكوّنات منتج.",
    },
    en: {
      alt: "Blue light refracting through clear glass onto blank paper on a stone surface.",
      caption: "AI-generated study of clarity, not a laboratory or actual product ingredients.",
    },
  },
  contact: {
    file: "contact-conversation",
    index: "04 / ROOM FOR A QUESTION",
    ar: {
      alt: "دفتر مفتوح دون كتابة وقلم أزرق وكوب ماء في ضوء طبيعي، دون أشخاص.",
      caption: "تفاصيل توضيحية مولّدة للحوار، وليست صورة لمكتب الشركة.",
    },
    en: {
      alt: "An open blank notebook, blue pencil and glass of water in natural light, with no people.",
      caption: "AI-generated conversation still life, not a photograph of our office.",
    },
  },
} as const

export type EditorialKind = keyof typeof visuals

export function EditorialFigure({
  kind,
  locale,
  wide = false,
  priority = false,
  sizes,
  className = "",
}: {
  kind: EditorialKind
  locale: Locale
  /** Cinematic 21:9 crop (4:3 on phones) for full-width banners. */
  wide?: boolean
  priority?: boolean
  sizes?: string
  className?: string
}) {
  const visual = visuals[kind],
    copy = visual[locale]
  return (
    <Reveal
      as="figure"
      className={`ng-editorial ${wide ? "ng-editorial-wide" : ""} ${className}`}
    >
      <div className="ng-editorial-media">
        <Image
          src={`/care-atlas/editorial/${visual.file}.jpg`}
          alt={copy.alt}
          width={1264}
          height={848}
          priority={priority}
          sizes={sizes ?? (wide ? "(min-width: 1340px) 1280px, 100vw" : "(min-width: 900px) 50vw, 100vw")}
        />
      </div>
      <figcaption>
        <span className="ng-editorial-index" dir="ltr">
          {visual.index}
        </span>
        <span>{copy.caption}</span>
      </figcaption>
    </Reveal>
  )
}

/**
 * Table of contents for long reading pages (articles, legal). Native
 * <details> so it is a collapsed disclosure on phones and works with no JS;
 * on wide screens CSS keeps it open-looking and sticky beside the text.
 */
export function Toc({
  title,
  entries,
  label,
  numbered = true,
}: {
  title: string
  entries: { id: string; heading: string }[]
  label?: string
  /** false when the headings already carry their own numbering. */
  numbered?: boolean
}) {
  if (entries.length === 0) return null
  return (
    <nav className={`ng-toc ${numbered ? "" : "ng-toc-plain"}`} aria-label={label ?? title}>
      <details className="ng-toc-details" open>
        <summary>
          <h2>{title}</h2>
        </summary>
        <ol>
          {entries.map((entry) => (
            <li key={entry.id}>
              <a href={`#${entry.id}`}>{entry.heading}</a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  )
}

/** Centered glass notice used by 404, error and "catalog unavailable". */
export function Notice({
  mark,
  tone,
  eyebrow,
  title,
  titleAs: TitleTag = "h2",
  body,
  children,
  className = "",
  ...rest
}: {
  mark?: ReactNode
  tone?: "danger"
  eyebrow?: string
  title: string
  titleAs?: "h1" | "h2"
  body?: string
  children?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, "title" | "children" | "className">) {
  return (
    <section className={`ng-notice ng-glass ${className}`} {...rest}>
      {mark && (
        <span className="ng-notice-mark" data-tone={tone} aria-hidden="true">
          {mark}
        </span>
      )}
      {eyebrow && <span className="ng-eyebrow">{eyebrow}</span>}
      <TitleTag className="ng-h2">{title}</TitleTag>
      {body && <p className="ng-lead">{body}</p>}
      {children}
    </section>
  )
}

/**
 * Long-form legal page (terms, privacy): intro box, numbered sections and a
 * generated table of contents. Ids are derived from the section order, so
 * the TOC and the headings can never disagree.
 */
export function LegalDocument({
  eyebrow,
  title,
  lastUpdated,
  intro,
  sections,
  tocTitle,
}: {
  eyebrow?: string
  title: string
  lastUpdated?: string
  intro: readonly string[]
  sections: readonly { title: string; body: string }[]
  tocTitle: string
}) {
  const entries = sections.map((section, index) => ({ id: `section-${index + 1}`, heading: section.title }))
  return (
    <div className="ng-content">
      <header className="ng-wrap ng-page-intro" style={{ paddingBlockEnd: "clamp(20px, 3vw, 36px)" }}>
        {eyebrow && <span className="ng-eyebrow">{eyebrow}</span>}
        <h1 className="ng-h1" style={{ fontSize: "var(--ng-t-2xl)" }}>
          {title}
        </h1>
        {lastUpdated && <p className="ng-kicker" style={{ margin: 0 }}>{lastUpdated}</p>}
      </header>
      <div className="ng-wrap ng-reader" style={{ paddingBlockEnd: "clamp(48px, 7vw, 96px)" }}>
        <Toc title={tocTitle} entries={entries} numbered={!sections.every((s) => /^\s*\d/.test(s.title))} />
        <div className="ng-reader-main">
          {intro.length > 0 && (
            <div className="ng-legal-intro">
              {intro.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
          <div className="ng-legal-sections">
            {sections.map((section, index) => (
              <section key={section.title} aria-labelledby={entries[index].id}>
                <h2 id={entries[index].id}>{section.title}</h2>
                <p className="ng-pre">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
