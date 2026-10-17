import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isValidLocale, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { NPFCartView } from "@/components/npf/cart-view"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cart">): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar"
  // Transactional page, not a content page — never indexed (also excluded
  // from sitemap.ts). No need for hreflang/OG here.
  return { title: getDictionary(locale).cart.pageTitle, robots: { index: false, follow: false } }
}

export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  const { locale: localeParam } = await params
  if (!isValidLocale(localeParam)) notFound()
  const locale: Locale = localeParam
  const dictionary = getDictionary(locale)

  return <NPFCartView locale={locale} dictionary={dictionary.cart} />
}
