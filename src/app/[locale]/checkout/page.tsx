import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { NPFCheckoutForm } from "@/components/npf/checkout-form"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  // Transactional page, not a content page — never indexed (also excluded
  // from sitemap.ts). No need for hreflang/OG here.
  return { title: getDictionary(locale).checkout.pageTitle, robots: { index: false, follow: false } }
}

export default async function CheckoutPage({ params }: PageProps<"/[locale]/checkout">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)

  return <NPFCheckoutForm locale={locale} dictionary={dictionary.checkout} />
}
