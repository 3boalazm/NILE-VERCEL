import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { LegalDocument } from "@/components/glass/content"
import { buildPageMetadata } from "@/lib/seo/page-metadata"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy-policy">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  const dictionary = getDictionary(locale)
  const description =
    locale === "ar"
      ? `${dictionary.privacy.pageTitle} الخاصة بـ${dictionary.siteName}.`
      : `${dictionary.siteName}'s ${dictionary.privacy.pageTitle}.`
  return buildPageMetadata({
    locale,
    path: "/privacy-policy",
    title: dictionary.privacy.pageTitle,
    description,
  })
}

export default async function PrivacyPolicyPage({
  params,
}: PageProps<"/[locale]/privacy-policy">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)

  return (
    <LegalDocument
      eyebrow={dictionary.siteName}
      title={dictionary.privacy.pageTitle}
      lastUpdated={dictionary.privacy.lastUpdated}
      intro={dictionary.privacy.intro}
      sections={dictionary.privacy.sections}
      tocTitle={dictionary.blogs.tocTitle}
    />
  )
}
