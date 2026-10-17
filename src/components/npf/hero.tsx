import Link from "next/link"
import Image from "next/image"
import {
  ArrowUpRightIcon,
  ArrowDownIcon,
  FileTextIcon,
  CheckIcon,
  ScanLineIcon,
} from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { getArtDirectionCopy } from "@/lib/i18n/art-direction"

export function NPFHero({
  locale,
  dictionary,
}: {
  locale: Locale
  dictionary: Dictionary
}) {
  const c = getArtDirectionCopy(locale)
  const base = `/${locale}`
  return (
    <section className="prism-hero" aria-labelledby="hero-title">
      <div className="prism-ambient" aria-hidden="true" />
      <div className="prism-hero-copy">
        <span className="prism-kicker">
          <span className="prism-live-dot" />
          {c.eyebrow}
        </span>
        <h1 id="hero-title" className="prism-title">
          <span>{c.title}</span>
          <em>{c.accent}</em>
        </h1>
        <p className="prism-intro">{c.intro}</p>
        <div className="prism-actions">
          <Link href={`${base}/products`} className="prism-cta">
            {dictionary.home.heroCta}
            <ArrowUpRightIcon aria-hidden="true" />
          </Link>
          <a href="#trust" className="prism-secondary">
            {dictionary.home.heroWhyCta}
            <ArrowDownIcon className="size-4" aria-hidden="true" />
          </a>
        </div>
        <ul className="prism-reassurance">
          {c.trustLabels.map((label) => (
            <li key={label}>
              <CheckIcon className="size-4" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
      <div className="prism-scene">
        <span className="prism-scene-type" aria-hidden="true">
          care.
        </span>
        <div className="prism-art-frame">
          <Image
            src="/art/prismatic-care.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            preload
            className="object-cover"
          />
        </div>
        <div className="prism-pack">
          <Image
            src="/art/proxeed-plus-pack.webp"
            alt={dictionary.home.heroImageAlt}
            width={578}
            height={416}
            sizes="(min-width: 1024px) 31vw, 67vw"
            loading="eager"
            className="h-auto w-full"
          />
        </div>
        <Link
          href={`${base}/quality-sourcing`}
          className="prism-source prism-glass"
        >
          <span className="prism-object-icon">
            <ScanLineIcon aria-hidden="true" />
          </span>
          <span>
            <strong>{c.source}</strong>
            <small>{c.sourceNote}</small>
          </span>
          <span className="prism-source-seal" aria-hidden="true">
            ↗
          </span>
        </Link>
        <a
          href="/downloads/proxeed-plus-leaflet.pdf"
          className="prism-leaflet prism-glass"
        >
          <span className="prism-object-icon">
            <FileTextIcon aria-hidden="true" />
          </span>
          <span>
            <strong>{c.leaflet}</strong>
            <small>{c.leafletNote}</small>
          </span>
          <ArrowUpRightIcon className="size-4" aria-hidden="true" />
        </a>
        <span className="prism-orbit-label" aria-hidden="true">
          N / 01 — PROXEED PLUS
        </span>
      </div>
      <div className="prism-hero-bottom">
        <a href="#discover">
          <span className="prism-scroll">
            <ArrowDownIcon className="size-4" aria-hidden="true" />
          </span>
          {c.scroll}
        </a>
        <span>{c.index}</span>
        <span className="prism-hero-coordinate" dir="ltr">
          EUROPE ↗ EGYPT
        </span>
      </div>
    </section>
  )
}
