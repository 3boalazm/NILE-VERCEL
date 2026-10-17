import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { Reveal } from "@/components/npf/motion/reveal"
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
    <Reveal as="div" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold">{dictionary.privacy.pageTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dictionary.privacy.lastUpdated}</p>

      <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-dashed bg-anti-flash-white p-4 text-sm text-muted-foreground dark:bg-card">
        {dictionary.privacy.intro.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-8">
        {dictionary.privacy.sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-heading text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-pretty leading-relaxed whitespace-pre-line text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </Reveal>
  )
}
