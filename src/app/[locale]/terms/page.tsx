import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { Reveal } from "@/components/npf/motion/reveal"
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
    <Reveal as="div" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold">{dictionary.terms.pageTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dictionary.terms.lastUpdated}</p>

      <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-dashed bg-anti-flash-white p-4 text-sm text-muted-foreground dark:bg-card">
        {dictionary.terms.intro.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-8">
        {dictionary.terms.sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-heading text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-pretty leading-relaxed whitespace-pre-line text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </Reveal>
  )
}
