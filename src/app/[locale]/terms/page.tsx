import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { LegalDocument } from "@/components/glass/content"
import { buildPageMetadata } from "@/lib/seo/page-metadata"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const dictionary = getDictionary(locale)
  const description =
    locale === "ar"
      ? `${dictionary.terms.pageTitle} الخاصة بـ${dictionary.siteName}.`
      : `${dictionary.siteName}'s ${dictionary.terms.pageTitle}.`
  return buildPageMetadata({
    locale,
    path: "/terms",
    title: dictionary.terms.pageTitle,
    description,
  })
}

// Same long-form legal layout as the privacy-policy page (dashed intro
// box + numbered sections) — the two pages are a matched pair in the
// footer, so they deliberately share the structure.
export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)

  return (
    <LegalDocument
      eyebrow={dictionary.siteName}
      title={dictionary.terms.pageTitle}
      lastUpdated={dictionary.terms.lastUpdated}
      intro={dictionary.terms.intro}
      sections={dictionary.terms.sections}
      tocTitle={dictionary.blogs.tocTitle}
    />
  )
}
