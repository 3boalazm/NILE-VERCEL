import type { Metadata } from "next"

import type { Locale } from "@/lib/i18n/config"

import { resolveSeoPage, type SeoPageType } from "./page-contract"

/**
 * Shared per-page metadata builder. Canonical, robots, Open Graph, and
 * hreflang come from the SEO page contract so a route cannot invent a
 * second copy of those rules. Utility pages that must not declare a
 * language alternate do not call this helper.
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  image,
  noIndex,
  follow,
  pageType,
}: {
  locale: Locale
  /** Path after the locale segment, e.g. "/about", "" for the homepage. */
  path: string
  /** Rendered through the layout's `title.template` ("%s | <site name>"). */
  title: string
  description: string
  image?: { url: string; width?: number; height?: number; alt?: string }
  /** Set for real-but-thin routes (e.g. /blogs until real articles ship) — keeps the page live for visitors while telling crawlers to skip it. */
  noIndex?: boolean
  /** With noIndex, whether links on the page may be followed. Defaults to false. */
  follow?: boolean
  pageType?: SeoPageType
}): Metadata {
  return resolveSeoPage({
    locale,
    path,
    title,
    description,
    pageType: pageType ?? "static",
    indexable: !noIndex,
    follow: noIndex ? (follow ?? false) : true,
    hasLocaleAlternate: true,
    image,
  }).metadata
}
